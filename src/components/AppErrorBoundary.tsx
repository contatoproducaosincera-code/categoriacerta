import { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw, Trash2 } from "lucide-react";
import { performCleanReload, isReloadLoop } from "@/lib/cacheRecovery";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  isClearing: boolean;
}

/**
 * AppErrorBoundary - Enhanced error boundary with cache recovery
 * Handles:
 * - Critical JavaScript errors
 * - Corrupted cache/storage recovery
 * - Prevents reload loops
 */
class AppErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    isClearing: false,
  };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("[AppErrorBoundary] Error caught:", error);
    console.error("[AppErrorBoundary] Error info:", errorInfo);
    
    // Log to help debugging
    console.log("[AppErrorBoundary] Stack:", error.stack);
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleClearAndReload = async () => {
    if (isReloadLoop()) {
      // Already tried clearing, just reload
      this.handleReload();
      return;
    }

    this.setState({ isClearing: true });
    
    try {
      await performCleanReload();
    } catch (e) {
      console.error("[AppErrorBoundary] Failed to clear cache:", e);
      this.handleReload();
    }
  };

  private handleGoHome = () => {
    window.location.href = "/";
  };

  public render() {
    if (this.state.hasError) {
      const inReloadLoop = isReloadLoop();
      
      return (
        <div 
          className="min-h-screen flex items-center justify-center p-4"
          style={{ 
            minHeight: '100vh', 
            backgroundColor: 'var(--background, #fff)',
            color: 'var(--foreground, #000)',
          }}
        >
          <div 
            className="max-w-md w-full p-6 rounded-lg border shadow-lg"
            style={{
              backgroundColor: 'var(--card, #fff)',
              borderColor: 'var(--border, #e5e7eb)',
            }}
          >
            <div className="flex items-center gap-3 mb-4">
              <div 
                className="p-2 rounded-full"
                style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)' }}
              >
                <AlertTriangle 
                  className="h-6 w-6" 
                  style={{ color: '#ef4444' }}
                />
              </div>
              <h1 className="text-xl font-bold">Ops! Algo deu errado</h1>
            </div>
            
            <p className="text-sm opacity-70 mb-6">
              {inReloadLoop 
                ? "Encontramos um problema persistente. Tente voltar para a página inicial."
                : "Ocorreu um erro inesperado. Limpar o cache pode resolver o problema."
              }
            </p>
            
            {/* Error details (collapsed by default) */}
            {this.state.error && (
              <details className="mb-6 text-xs">
                <summary className="cursor-pointer opacity-50 hover:opacity-70">
                  Detalhes técnicos
                </summary>
                <pre 
                  className="mt-2 p-2 rounded overflow-auto max-h-32 text-[10px]"
                  style={{ 
                    backgroundColor: 'var(--muted, #f3f4f6)',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                  }}
                >
                  {this.state.error.message}
                </pre>
              </details>
            )}
            
            <div className="flex flex-col gap-2">
              {!inReloadLoop && (
                <button
                  onClick={this.handleClearAndReload}
                  disabled={this.state.isClearing}
                  className="flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-md font-medium text-white transition-colors"
                  style={{ 
                    backgroundColor: this.state.isClearing ? '#9ca3af' : '#00b4d8',
                  }}
                >
                  {this.state.isClearing ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      Limpando cache...
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4" />
                      Limpar cache e recarregar
                    </>
                  )}
                </button>
              )}
              
              <button
                onClick={this.handleReload}
                className="flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-md font-medium border transition-colors hover:opacity-80"
                style={{ 
                  borderColor: 'var(--border, #e5e7eb)',
                }}
              >
                <RefreshCw className="h-4 w-4" />
                Tentar novamente
              </button>
              
              <button
                onClick={this.handleGoHome}
                className="w-full py-2 px-4 text-sm opacity-60 hover:opacity-80 transition-opacity"
              >
                Voltar para Início
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default AppErrorBoundary;
