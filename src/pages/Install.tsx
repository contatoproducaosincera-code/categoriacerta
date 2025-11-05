import { useState, useEffect } from "react";
import { Download, Check, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Navbar from "@/components/Navbar";
import { useToast } from "@/hooks/use-toast";

const Install = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      toast({
        title: "Instalação não disponível",
        description: "Use o menu do navegador para adicionar à tela inicial",
        variant: "destructive",
      });
      return;
    }

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      toast({
        title: "App instalado!",
        description: "Categoria Certa foi adicionado à sua tela inicial",
      });
      setIsInstalled(true);
    }

    setDeferredPrompt(null);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <section className="py-16">
        <div className="container mx-auto px-4 max-w-3xl">
          <div className="text-center mb-12 animate-fade-in">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-primary to-accent mb-6 animate-glow">
              <Smartphone className="h-10 w-10 text-white" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Instale o App
            </h1>
            <p className="text-xl text-muted-foreground">
              Tenha o Categoria Certa sempre à mão na sua tela inicial
            </p>
          </div>

          <Card className="shadow-strong animate-fade-in" style={{ animationDelay: '0.1s' }}>
            <CardHeader>
              <CardTitle className="text-2xl">Por que instalar?</CardTitle>
              <CardDescription>
                Aproveite todos os benefícios do app instalado
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4">
                {[
                  {
                    icon: "⚡",
                    title: "Acesso instantâneo",
                    description: "Abra direto da tela inicial, sem precisar do navegador"
                  },
                  {
                    icon: "📱",
                    title: "Experiência nativa",
                    description: "Interface otimizada que parece um app de verdade"
                  },
                  {
                    icon: "🔔",
                    title: "Notificações em breve",
                    description: "Receba atualizações sobre conquistas e categorias"
                  },
                  {
                    icon: "💾",
                    title: "Cache inteligente",
                    description: "Carregamento rápido com dados salvos localmente"
                  }
                ].map((feature, index) => (
                  <div key={index} className="flex gap-4 p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                    <div className="text-3xl">{feature.icon}</div>
                    <div>
                      <h3 className="font-semibold mb-1">{feature.title}</h3>
                      <p className="text-sm text-muted-foreground">{feature.description}</p>
                    </div>
                  </div>
                ))}
              </div>

              {isInstalled ? (
                <Alert className="bg-primary/10 border-primary">
                  <Check className="h-4 w-4 text-primary" />
                  <AlertDescription className="text-primary font-medium">
                    App já instalado! Você pode acessá-lo pela tela inicial.
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="space-y-4">
                  <Button
                    onClick={handleInstallClick}
                    size="lg"
                    className="w-full text-lg"
                    disabled={!deferredPrompt}
                  >
                    <Download className="mr-2 h-5 w-5" />
                    {deferredPrompt ? "Instalar Agora" : "Instalação Indisponível"}
                  </Button>

                  <Alert>
                    <AlertDescription className="text-sm">
                      <strong className="block mb-2">Como instalar manualmente:</strong>
                      <ul className="space-y-1 list-disc list-inside">
                        <li><strong>iPhone/iPad:</strong> Toque em <strong>Compartilhar</strong> → <strong>Adicionar à Tela de Início</strong></li>
                        <li><strong>Android:</strong> Toque no menu (⋮) → <strong>Adicionar à tela inicial</strong></li>
                        <li><strong>Desktop:</strong> Clique no ícone de instalação na barra de endereço</li>
                      </ul>
                    </AlertDescription>
                  </Alert>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
};

export default Install;
