import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    
    const client = createClient(supabaseUrl, supabaseAnonKey)

    const { email, redirectTo } = await req.json()

    if (!email) {
      throw new Error('email is required')
    }

    const redirectUrl = redirectTo || 'https://kernel-voice.lovable.app/auth'

    // Send password reset email using public API
    const { error } = await client.auth.resetPasswordForEmail(email, {
      redirectTo: redirectUrl,
    })

    if (error) throw error

    return new Response(JSON.stringify({ 
      success: true, 
      message: `Password reset email sent to ${email}`,
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('Password reset error:', error)
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Operation failed' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
