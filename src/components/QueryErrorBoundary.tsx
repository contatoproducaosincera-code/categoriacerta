import { Component, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class QueryErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error("Query Error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex flex-col items-center justify-center min-h-[400px] p-8">
          <AlertCircle className="h-16 w-16 text-destructive mb-4" />
          <h2 className="text-2xl font-bold mb-2">Erro ao Carregar Dados</h2>
          <p className="text-muted-foreground mb-6 text-center max-w-md">
            Ocorreu um erro ao carregar as informações. Por favor, tente novamente.
          </p>
          <div className="flex gap-4">
            <Button onClick={() => window.location.reload()}>
              Recarregar Página
            </Button>
            <Button 
              variant="outline" 
              onClick={() => this.setState({ hasError: false, error: null })}
            >
              Tentar Novamente
            </Button>
          </div>
          {process.env.NODE_ENV === 'development' && this.state.error && (
            <pre className="mt-8 p-4 bg-muted rounded text-xs max-w-2xl overflow-auto">
              {this.state.error.toString()}
            </pre>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export default QueryErrorBoundary;
