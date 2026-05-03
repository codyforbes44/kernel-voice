import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider, keepPreviousData } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/contexts/AuthContext";
import { AppErrorBoundary } from "@/components/layout/ErrorBoundary";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { LoadingScreen } from "@/components/layout/LoadingScreen";
import { ScrollToTop } from "@/components/shared/ScrollToTop";
import { RouteErrorBoundary } from "@/components/shared/RouteErrorBoundary";
import { OfflineIndicator } from "@/components/shared/OfflineIndicator";

// Lazy-loaded pages
const LandingPage = lazy(() => import("./pages/LandingPage"));
const VoiceAssistant = lazy(() => import("./pages/VoiceAssistant"));
const Auth = lazy(() => import("./pages/Auth"));

const NotFound = lazy(() => import("./pages/NotFound"));
const Profile = lazy(() => import("./pages/Profile"));
const Privacy = lazy(() => import("./pages/Privacy"));
const Terms = lazy(() => import("./pages/Terms"));
const Pricing = lazy(() => import("./pages/Pricing"));
const SubscriptionSuccess = lazy(() => import("./pages/SubscriptionSuccess"));


// Admin pages (heavier chunk)
const AdminDashboard = lazy(() => import("./pages/admin/Dashboard"));
const AdminUsers = lazy(() => import("./pages/admin/Users"));
const AdminConversations = lazy(() => import("./pages/admin/Conversations"));
const AdminDocuments = lazy(() => import("./pages/admin/Documents"));
const AdminKnowledgeBase = lazy(() => import("./pages/admin/KnowledgeBase"));
const AdminAuditLogs = lazy(() => import("./pages/admin/AuditLogs"));
const AdminSettings = lazy(() => import("./pages/admin/Settings"));
const AdminWidgets = lazy(() => import("./pages/admin/Widgets"));
const WidgetsRedirect = lazy(() => import("./pages/WidgetsRedirect"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      gcTime: 1000 * 60 * 10,
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      retry: (failureCount, error: any) => {
        // Don't retry on 4xx; retry up to 2x on transient errors
        const status = error?.status ?? error?.response?.status;
        if (status && status >= 400 && status < 500) return false;
        return failureCount < 2;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 8000),
      networkMode: 'offlineFirst',
      placeholderData: keepPreviousData,
    },
    mutations: {
      retry: 0,
      networkMode: 'offlineFirst',
    },
  },
});

/** Wrap a route element with a per-route error boundary. */
const route = (name: string, element: React.ReactNode) => (
  <RouteErrorBoundary routeName={name}>{element}</RouteErrorBoundary>
);

const App = () => (
  <HelmetProvider>
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <OfflineIndicator />
            <AppErrorBoundary>
              <BrowserRouter>
                <ScrollToTop />
                <Suspense fallback={<LoadingScreen message="Loading..." />}>
                  <Routes>
                    <Route path="/" element={route("Home", <LandingPage />)} />
                    <Route path="/assistant" element={route("Voice Assistant", <VoiceAssistant />)} />
                    <Route path="/auth" element={route("Sign In", <Auth />)} />
                    
                    <Route path="/profile" element={<ProtectedRoute>{route("Profile", <Profile />)}</ProtectedRoute>} />
                    <Route path="/privacy" element={route("Privacy", <Privacy />)} />
                    <Route path="/terms" element={route("Terms", <Terms />)} />
                    <Route path="/pricing" element={route("Pricing", <Pricing />)} />
                    <Route path="/subscription-success" element={route("Subscription", <SubscriptionSuccess />)} />
                    <Route path="/admin" element={<ProtectedRoute>{route("Admin Dashboard", <AdminDashboard />)}</ProtectedRoute>} />
                    <Route path="/admin/users" element={<ProtectedRoute>{route("Admin Users", <AdminUsers />)}</ProtectedRoute>} />
                    <Route path="/admin/conversations" element={<ProtectedRoute>{route("Admin Conversations", <AdminConversations />)}</ProtectedRoute>} />
                    <Route path="/admin/documents" element={<ProtectedRoute>{route("Admin Documents", <AdminDocuments />)}</ProtectedRoute>} />
                    <Route path="/admin/knowledge-base" element={<ProtectedRoute>{route("Knowledge Base", <AdminKnowledgeBase />)}</ProtectedRoute>} />
                    <Route path="/admin/audit-logs" element={<ProtectedRoute>{route("Audit Logs", <AdminAuditLogs />)}</ProtectedRoute>} />
                    <Route path="/admin/settings" element={<ProtectedRoute>{route("Admin Settings", <AdminSettings />)}</ProtectedRoute>} />
                    <Route path="/admin/widgets" element={<ProtectedRoute>{route("Widgets", <AdminWidgets />)}</ProtectedRoute>} />


                    {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </Suspense>
              </BrowserRouter>
            </AppErrorBoundary>
          </TooltipProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ThemeProvider>
  </HelmetProvider>
);

export default App;
