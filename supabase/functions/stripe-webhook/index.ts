// Stripe webhook: syncs subscription state into public.subscribers
// Handles: checkout.session.completed, customer.subscription.{created,updated,deleted},
// invoice.payment_succeeded, invoice.payment_failed
import Stripe from "https://esm.sh/stripe@18.5.0?target=denonext";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const log = (step: string, details?: unknown) => {
  const extra = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[STRIPE-WEBHOOK] ${step}${extra}`);
};

const stripeKey = Deno.env.get("STRIPE_SECRET_KEY")!;
const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET")!;
const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

const admin = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  { auth: { persistSession: false } },
);

async function findUserIdByEmail(email: string): Promise<string | null> {
  // Look up via profiles table (mirrors auth.users)
  const { data } = await admin
    .from("profiles")
    .select("id")
    .eq("email", email)
    .maybeSingle();
  return data?.id ?? null;
}

async function upsertFromSubscription(sub: Stripe.Subscription) {
  const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer.id;
  const customer = await stripe.customers.retrieve(customerId) as Stripe.Customer;
  const email = customer.email;
  if (!email) {
    log("Customer has no email, skipping", { customerId });
    return;
  }

  const item = sub.items.data[0];
  const priceId = item?.price?.id ?? null;
  const productId = typeof item?.price?.product === "string"
    ? item.price.product
    : item?.price?.product?.id ?? null;

  const userId = await findUserIdByEmail(email);

  const row = {
    user_id: userId,
    email,
    stripe_customer_id: customerId,
    stripe_subscription_id: sub.id,
    product_id: productId,
    price_id: priceId,
    status: sub.status,
    current_period_end: sub.current_period_end
      ? new Date(sub.current_period_end * 1000).toISOString()
      : null,
    cancel_at_period_end: sub.cancel_at_period_end,
    updated_at: new Date().toISOString(),
  };

  const { error } = await admin
    .from("subscribers")
    .upsert(row, { onConflict: "email" });

  if (error) {
    log("Upsert error", { error: error.message, email });
    throw error;
  }
  log("Subscription synced", { email, status: sub.status, productId });
}

async function markFromInvoice(invoice: Stripe.Invoice, status: string) {
  const customerId = typeof invoice.customer === "string"
    ? invoice.customer
    : invoice.customer?.id;
  if (!customerId) return;

  const { error } = await admin
    .from("subscribers")
    .update({
      latest_invoice_status: status,
      updated_at: new Date().toISOString(),
    })
    .eq("stripe_customer_id", customerId);

  if (error) log("Invoice update error", { error: error.message });
  else log("Invoice status recorded", { customerId, status });
}

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const signature = req.headers.get("stripe-signature");
  if (!signature) return new Response("Missing signature", { status: 400 });

  const body = await req.text();

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(
      body,
      signature,
      webhookSecret,
    );
  } catch (err) {
    log("Signature verification failed", { error: (err as Error).message });
    return new Response("Invalid signature", { status: 400 });
  }

  log("Event received", { type: event.type, id: event.id });

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.mode === "subscription" && session.subscription) {
          const subId = typeof session.subscription === "string"
            ? session.subscription
            : session.subscription.id;
          const sub = await stripe.subscriptions.retrieve(subId);
          await upsertFromSubscription(sub);
        }
        break;
      }
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        await upsertFromSubscription(sub);
        break;
      }
      case "invoice.payment_succeeded":
        await markFromInvoice(event.data.object as Stripe.Invoice, "succeeded");
        break;
      case "invoice.payment_failed":
        await markFromInvoice(event.data.object as Stripe.Invoice, "failed");
        break;
      default:
        log("Unhandled event type", { type: event.type });
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    log("Handler error", { error: (err as Error).message });
    // Return 500 so Stripe retries
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
