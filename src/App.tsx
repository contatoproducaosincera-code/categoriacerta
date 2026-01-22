import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { lazy, Suspense } from "react";
import AppErrorBoundary from "./components/AppErrorBoundary";
import SafeEntryPoint from "./components/SafeEntryPoint";
import { ThemeProvider } from "./hooks/useTheme";

// Minimal loading spinner - inline styles for guaranteed rendering
const MinimalSpinner = () => (
  <div 
    style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      backgroundColor: 'var(--background, #fff)',
    }}
  >
    <div 
      style={{
        width: '32px',
        height: '32px',
        border: '3px solid var(--muted, #e5e7eb)',
        borderTopColor: 'var(--primary, #00b4d8)',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
      }}
    />
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
  </div>
);

// Lazy load das páginas para code splitting
const Index = lazy(() => import("./pages/Index"));
const Atletas = lazy(() => import("./pages/Atletas"));
const Ranking = lazy(() => import("./pages/Ranking"));
const Torneios = lazy(() => import("./pages/Torneios"));
const Admin = lazy(() => import("./pages/Admin"));
const Auth = lazy(() => import("./pages/Auth"));
const Signup = lazy(() => import("./pages/Signup"));
const Feed = lazy(() => import("./pages/Feed"));
const Offline = lazy(() => import("./pages/Offline"));
const Waitlist = lazy(() => import("./pages/Waitlist"));
const HistoricoProgressao = lazy(() => import("./pages/HistoricoProgressao"));
const NotFound = lazy(() => import("./pages/NotFound"));
const ProtectedRoute = lazy(() => import("./components/ProtectedRoute"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60000, // 1 minuto
      gcTime: 600000, // 10 minutos
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: false,
      retry: 1,
      retryDelay: 1000,
    },
  },
});

const App = () => (
  <AppErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <SafeEntryPoint>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Suspense fallback={<MinimalSpinner />}>
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/atletas" element={<Atletas />} />
                  <Route path="/ranking" element={<Ranking />} />
                  <Route path="/torneios" element={<Torneios />} />
                  <Route path="/feed" element={<Feed />} />
                  <Route path="/historico-progressao" element={<HistoricoProgressao />} />
                  <Route path="/offline" element={<Offline />} />
                  <Route path="/admin" element={
                    <ProtectedRoute>
                      <Admin />
                    </ProtectedRoute>
                  } />
                  <Route path="/admin/waitlist" element={
                    <ProtectedRoute>
                      <Waitlist />
                    </ProtectedRoute>
                  } />
                  <Route path="/auth" element={<Auth />} />
                  <Route path="/signup" element={<Signup />} />
                  {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </BrowserRouter>
          </TooltipProvider>
        </SafeEntryPoint>
      </ThemeProvider>
    </QueryClientProvider>
  </AppErrorBoundary>
);

export default App;
