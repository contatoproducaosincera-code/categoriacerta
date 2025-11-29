import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import ErrorBoundary from "./components/ErrorBoundary";
import Index from "./pages/Index";
import Atletas from "./pages/Atletas";
import Ranking from "./pages/Ranking";
import Torneios from "./pages/Torneios";
import Admin from "./pages/Admin";
import Auth from "./pages/Auth";
import Signup from "./pages/Signup";
import Feed from "./pages/Feed";
import Offline from "./pages/Offline";
import NotFound from "./pages/NotFound";
import ProtectedRoute from "./components/ProtectedRoute";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30000, // 30 segundos
      gcTime: 300000, // 5 minutos
      refetchOnWindowFocus: false,
      retry: (failureCount, error) => {
        // Não retentar em erros de autenticação
        if (error && typeof error === 'object' && 'code' in error) {
          const code = (error as any).code;
          if (code === 'PGRST301' || code === 'PGRST116') return false;
        }
        return failureCount < 2;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ErrorBoundary>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/atletas" element={<Atletas />} />
            <Route path="/ranking" element={<Ranking />} />
            <Route path="/torneios" element={<Torneios />} />
            <Route path="/feed" element={<Feed />} />
            <Route path="/offline" element={<Offline />} />
            <Route path="/admin" element={
              <ProtectedRoute>
                <Admin />
              </ProtectedRoute>
            } />
            <Route path="/auth" element={<Auth />} />
            <Route path="/signup" element={<Signup />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </ErrorBoundary>
  </QueryClientProvider>
);

export default App;
