import { memo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Download, ExternalLink, Loader2, Upload } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useAdmin } from "@/hooks/useAdmin";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

const Regulamento = memo(() => {
  const { user } = useAuth();
  const { isAdmin } = useAdmin();
  const [uploading, setUploading] = useState(false);

  const { data: fileUrl, isLoading, refetch } = useQuery({
    queryKey: ["regulamento-file"],
    queryFn: async () => {
      const { data, error } = await supabase.storage
        .from("regulamento")
        .list("", { limit: 1, sortBy: { column: "created_at", order: "desc" } });

      if (error) throw error;
      if (!data || data.length === 0) return null;

      const file = data[0];
      const { data: urlData } = supabase.storage
        .from("regulamento")
        .getPublicUrl(file.name);

      return { url: urlData.publicUrl, name: file.name };
    },
    staleTime: 1000 * 60 * 5,
  });

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      // Remove old files
      const { data: existing } = await supabase.storage
        .from("regulamento")
        .list("");
      
      if (existing && existing.length > 0) {
        await supabase.storage
          .from("regulamento")
          .remove(existing.map((f) => f.name));
      }

      const { error } = await supabase.storage
        .from("regulamento")
        .upload(file.name, file, { upsert: true });

      if (error) throw error;
      toast.success("Regulamento atualizado com sucesso!");
      refetch();
    } catch (err: any) {
      toast.error("Erro ao enviar arquivo: " + err.message);
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <Navbar />
      <main className="container mx-auto px-4 py-8 max-w-3xl">
        <Card>
          <CardHeader className="text-center pb-4">
            <div className="flex justify-center mb-4">
              <div className="p-4 rounded-full bg-primary/10">
                <FileText className="h-10 w-10 text-primary" />
              </div>
            </div>
            <CardTitle className="text-2xl md:text-3xl font-display">
              Regulamento
            </CardTitle>
            <p className="text-muted-foreground mt-2">
              Consulte as regras e regulamentos oficiais do Categoria Certa
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            {isLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : fileUrl ? (
              <div className="flex flex-col items-center gap-4 py-6">
                <p className="text-sm text-muted-foreground text-center">
                  Arquivo: <span className="font-medium text-foreground">{fileUrl.name}</span>
                </p>
                <div className="flex flex-col sm:flex-row gap-3 w-full max-w-sm">
                  <Button asChild className="flex-1 gap-2">
                    <a href={fileUrl.url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4" />
                      Visualizar
                    </a>
                  </Button>
                  <Button variant="outline" asChild className="flex-1 gap-2">
                    <a href={fileUrl.url} download={fileUrl.name}>
                      <Download className="h-4 w-4" />
                      Baixar
                    </a>
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-30" />
                <p>Nenhum regulamento disponível no momento.</p>
              </div>
            )}

            {/* Admin upload */}
            {user && isAdmin && (
              <div className="border-t pt-6">
                <p className="text-sm font-medium mb-3 text-muted-foreground">
                  Área do administrador
                </p>
                <label className="cursor-pointer">
                  <Button variant="secondary" className="gap-2 w-full sm:w-auto" disabled={uploading} asChild>
                    <span>
                      {uploading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Upload className="h-4 w-4" />
                      )}
                      {uploading ? "Enviando..." : "Enviar novo regulamento"}
                    </span>
                  </Button>
                  <Input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    className="hidden"
                    onChange={handleUpload}
                    disabled={uploading}
                  />
                </label>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
});

Regulamento.displayName = "Regulamento";

export default Regulamento;
