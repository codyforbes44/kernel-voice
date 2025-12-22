import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { ThemeProvider } from "next-themes";
import LandingPage from "./pages/LandingPage";
import VoiceAssistant from "./pages/VoiceAssistant";
import Auth from "./pages/Auth";
import Install from "./pages/Install";
import NotFound from "./pages/NotFound";
import Profile from "./pages/Profile";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import AdminDashboard from "./pages/admin/Dashboard";
import AdminUsers from "./pages/admin/Users";
import AdminConversations from "./pages/admin/Conversations";
import AdminDocuments from "./pages/admin/Documents";
import AdminKnowledgeBase from "./pages/admin/KnowledgeBase";

const queryClient = new QueryClient();

const App = () => (
  <HelmetProvider>
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/assistant" element={<VoiceAssistant />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/install" element={<Install />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/users" element={<AdminUsers />} />
              <Route path="/admin/conversations" element={<AdminConversations />} />
              <Route path="/admin/documents" element={<AdminDocuments />} />
              <Route path="/admin/knowledge-base" element={<AdminKnowledgeBase />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  </HelmetProvider>
);

export default App;
