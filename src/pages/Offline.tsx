import { WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const Offline = () => {
  const handleReload = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent/20 to-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-strong animate-fade-in">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
            <WifiOff className="h-8 w-8 text-destructive" />
          </div>
          <CardTitle className="text-2xl">Você está offline</CardTitle>
          <CardDescription className="text-base">
            Sem conexão com a internet. Verifique sua conexão e tente novamente.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-muted p-4 rounded-lg">
            <p className="text-sm text-muted-foreground">
              O Categoria Certa precisa de conexão para funcionar corretamente. 
              Quando a internet retornar, clique em "Tentar Novamente" para continuar.
            </p>
          </div>
          <Button 
            onClick={handleReload} 
            className="w-full"
            size="lg"
          >
            Tentar Novamente
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default Offline;
