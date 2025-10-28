import Navbar from "@/components/Navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lock } from "lucide-react";

const Admin = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-md mx-auto">
            <Card>
              <CardHeader className="text-center">
                <div className="flex justify-center mb-4">
                  <Lock className="h-12 w-12 text-primary" />
                </div>
                <CardTitle>Área Administrativa</CardTitle>
                <CardDescription>
                  Acesso restrito para administradores
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-center text-muted-foreground">
                  Para acessar a área administrativa e gerenciar atletas, torneios e pontuações, você precisa ativar o Lovable Cloud.
                </p>
                <div className="text-center">
                  <Button size="lg" className="w-full">
                    Ativar Autenticação
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Admin;
