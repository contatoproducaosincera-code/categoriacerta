import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAthlete } from "@/hooks/useAthlete";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2, LogOut, Trophy, Upload } from "lucide-react";
import BackButton from "@/components/BackButton";

const Perfil = () => {
  const navigate = useNavigate();
  const { isAthlete, athleteData, isLoading: athleteLoading, logout } = useAthlete();
  const [isLoading, setIsLoading] = useState(false);
  const [instagram, setInstagram] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!athleteLoading && !isAthlete) {
      navigate("/auth-atleta");
    }
  }, [isAthlete, athleteLoading, navigate]);

  useEffect(() => {
    if (athleteData) {
      setInstagram(athleteData.instagram || "");
      setAvatarUrl(athleteData.avatar_url || "");
    }
  }, [athleteData]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error } = await supabase
        .from("athletes")
        .update({
          instagram: instagram,
          avatar_url: avatarUrl,
        })
        .eq("id", athleteData.id);

      if (error) throw error;

      toast.success("Perfil atualizado com sucesso!");
    } catch (error: any) {
      toast.error(error.message || "Erro ao atualizar perfil");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      // For now, we'll just convert to base64 and store directly
      // In production, you'd upload to Supabase Storage
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarUrl(reader.result as string);
        toast.success("Foto carregada! Clique em 'Salvar Alterações' para confirmar.");
      };
      reader.readAsDataURL(file);
    } catch (error: any) {
      toast.error("Erro ao carregar foto");
    } finally {
      setUploading(false);
    }
  };

  if (athleteLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!isAthlete || !athleteData) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <section className="py-12">
        <div className="container mx-auto px-4 max-w-2xl">
          <div className="mb-6">
            <BackButton />
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Meu Perfil</CardTitle>
                  <CardDescription>Gerencie suas informações pessoais</CardDescription>
                </div>
                <Button variant="outline" onClick={logout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Sair
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Avatar Section */}
              <div className="flex flex-col items-center gap-4">
                <Avatar className="h-32 w-32">
                  <AvatarImage src={avatarUrl} alt={athleteData.name} />
                  <AvatarFallback className="text-2xl">
                    {athleteData.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <Input
                    id="avatar-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarUpload}
                    disabled={uploading}
                  />
                  <Label htmlFor="avatar-upload">
                    <Button variant="outline" size="sm" asChild disabled={uploading}>
                      <span className="cursor-pointer">
                        {uploading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Carregando...
                          </>
                        ) : (
                          <>
                            <Upload className="mr-2 h-4 w-4" />
                            Alterar Foto
                          </>
                        )}
                      </span>
                    </Button>
                  </Label>
                </div>
              </div>

              {/* Info Display */}
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Nome</Label>
                    <p className="font-medium">{athleteData.name}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Cidade</Label>
                    <p className="font-medium">{athleteData.city}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Categoria</Label>
                    <div className="mt-1">
                      <Badge variant="default">{athleteData.category}</Badge>
                    </div>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Pontuação</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Trophy className="h-4 w-4 text-primary" />
                      <span className="font-bold text-lg">{athleteData.points}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Editable Form */}
              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="instagram">Instagram</Label>
                  <Input
                    id="instagram"
                    type="text"
                    placeholder="@seu_instagram"
                    value={instagram}
                    onChange={(e) => setInstagram(e.target.value)}
                  />
                </div>

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    "Salvar Alterações"
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
};

export default Perfil;
