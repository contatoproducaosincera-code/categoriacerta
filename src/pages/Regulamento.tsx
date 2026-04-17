import { memo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Download, ExternalLink, Loader2, Upload, Trash2, ShieldCheck } from "lucide-react";
import { useAdmin } from "@/hooks/useAdmin";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const Regulamento = memo(() => {
  const { isAdmin, loading: adminLoading } = useAdmin();
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);

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

  const isPdf = fileUrl?.name.toLowerCase().endsWith(".pdf");

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Client-side guard (backend RLS is the real enforcement)
    if (!isAdmin) {
      toast.error("Acesso negado. Apenas administradores podem enviar regulamentos.");
      e.target.value = "";
      return;
    }

    // Validate file type and size
    const validTypes = ["application/pdf"];
    if (!validTypes.includes(file.type)) {
      toast.error("Apenas arquivos PDF são aceitos.");
      e.target.value = "";
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Arquivo muito grande. Limite: 10MB.");
      e.target.value = "";
      return;
    }

    setUploading(true);
    try {
      const { data: existing } = await supabase.storage
        .from("regulamento")
        .list("");

      if (existing && existing.length > 0) {
        const { error: removeError } = await supabase.storage
          .from("regulamento")
          .remove(existing.map((f) => f.name));
        if (removeError) throw removeError;
      }

      const { error } = await supabase.storage
        .from("regulamento")
        .upload(file.name, file, { upsert: true, contentType: file.type });

      if (error) {
        if (error.message.toLowerCase().includes("row-level security") || error.message.toLowerCase().includes("forbidden")) {
          throw new Error("Acesso negado (403). Apenas administradores podem enviar.");
        }
        throw error;
      }
      toast.success("Regulamento atualizado com sucesso!");
      refetch();
    } catch (err: any) {
      toast.error(err.message || "Erro ao enviar arquivo.");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handleDelete = async () => {
    if (!isAdmin || !fileUrl) return;
    setDeleting(true);
    try {
      const { error } = await supabase.storage
        .from("regulamento")
        .remove([fileUrl.name]);
      if (error) throw error;
      toast.success("Regulamento removido.");
      refetch();
    } catch (err: any) {
      toast.error(err.message || "Erro ao excluir arquivo.");
    } finally {
      setDeleting(false);
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
            <p className="text-muted-foreground mt-2 text-sm">
              Consulte as regras oficiais do Categoria Certa
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            {isLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : fileUrl ? (
              <div className="space-y-4">
                {/* Embedded PDF viewer */}
                {isPdf && (
                  <div className="border rounded-lg overflow-hidden bg-muted">
                    <iframe
                      src={`${fileUrl.url}#toolbar=0`}
                      title="Regulamento"
                      className="w-full h-[60vh] min-h-[400px]"
                    />
                  </div>
                )}

                <div className="flex flex-col items-center gap-3">
                  <p className="text-xs text-muted-foreground text-center">
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
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-30" />
                <p>Nenhum regulamento disponível no momento.</p>
              </div>
            )}

            {/* Admin-only management panel */}
            {!adminLoading && isAdmin && (
              <div className="border-t pt-6 mt-2">
                <div className="flex items-center gap-2 mb-3">
                  <ShieldCheck className="h-4 w-4 text-primary" />
                  <p className="text-sm font-medium">
                    Painel do Administrador
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <label className="flex-1 cursor-pointer">
                    <Button variant="secondary" className="gap-2 w-full" disabled={uploading} asChild>
                      <span>
                        {uploading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Upload className="h-4 w-4" />
                        )}
                        {uploading ? "Enviando..." : fileUrl ? "Substituir regulamento" : "Enviar regulamento"}
                      </span>
                    </Button>
                    <Input
                      type="file"
                      accept="application/pdf"
                      className="hidden"
                      onChange={handleUpload}
                      disabled={uploading}
                    />
                  </label>

                  {fileUrl && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" className="gap-2" disabled={deleting}>
                          {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                          Excluir
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Excluir regulamento?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Esta ação removerá o regulamento atual e não poderá ser desfeita.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={handleDelete}>Excluir</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Apenas PDF, máx. 10MB. O arquivo anterior é substituído automaticamente.
                </p>
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
