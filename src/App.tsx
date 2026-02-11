import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/contexts/AuthContext";
import { AppErrorBoundary } from "@/components/layout/ErrorBoundary";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { LoadingScreen } from "@/components/layout/LoadingScreen";

// Lazy-loaded pages
const LandingPage = lazy(() => import("./pages/LandingPage"));
const VoiceAssistant = lazy(() => import("./pages/VoiceAssistant"));
const Auth = lazy(() => import("./pages/Auth"));
const Install = lazy(() => import("./pages/Install"));
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

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,    // 5 minutes
      gcTime: 1000 * 60 * 10,       // 10 minutes
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const App = () => (
  <HelmetProvider>
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <AppErrorBoundary>
              <BrowserRouter>
                <Suspense fallback={<LoadingScreen message="Loading..." />}>
                  <Routes>
                    <Route path="/" element={<LandingPage />} />
                    <Route path="/assistant" element={<VoiceAssistant />} />
                    <Route path="/auth" element={<Auth />} />
                    <Route path="/install" element={<Install />} />
                    <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                    <Route path="/privacy" element={<Privacy />} />
                    <Route path="/terms" element={<Terms />} />
                    <Route path="/pricing" element={<Pricing />} />
                    <Route path="/subscription-success" element={<SubscriptionSuccess />} />
                    <Route path="/admin" element={<AdminDashboard />} />
                    <Route path="/admin/users" element={<AdminUsers />} />
                    <Route path="/admin/conversations" element={<AdminConversations />} />
                    <Route path="/admin/documents" element={<AdminDocuments />} />
                    <Route path="/admin/knowledge-base" element={<AdminKnowledgeBase />} />
                    <Route path="/admin/audit-logs" element={<AdminAuditLogs />} />
                    <Route path="/admin/settings" element={<AdminSettings />} />
                    <Route path="/admin/widgets" element={<AdminWidgets />} />
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
