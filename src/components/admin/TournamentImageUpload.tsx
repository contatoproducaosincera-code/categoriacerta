import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ImagePlus, Trash2, Loader2 } from "lucide-react";

interface TournamentImageUploadProps {
  imageUrl: string | null;
  onImageChange: (url: string | null) => void;
  tournamentId?: string;
}

const TournamentImageUpload = ({ imageUrl, onImageChange, tournamentId }: TournamentImageUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validar tipo de arquivo
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Tipo de arquivo inválido",
        description: "Use apenas imagens JPG, PNG, WEBP ou GIF",
        variant: "destructive",
      });
      return;
    }

    // Validar tamanho (máx 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Arquivo muito grande",
        description: "A imagem deve ter no máximo 5MB",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    try {
      // Gerar nome único para o arquivo
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = tournamentId ? `${tournamentId}/${fileName}` : `temp/${fileName}`;

      // Upload para o Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from("tournament-images")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) throw uploadError;

      // Obter URL pública
      const { data: { publicUrl } } = supabase.storage
        .from("tournament-images")
        .getPublicUrl(filePath);

      onImageChange(publicUrl);
      toast({
        title: "Imagem enviada!",
        description: "A imagem foi carregada com sucesso",
      });
    } catch (error: any) {
      toast({
        title: "Erro no upload",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      // Limpar input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleRemove = () => {
    onImageChange(null);
  };

  return (
    <div className="space-y-2">
      <Label>Imagem do Torneio</Label>
      
      {imageUrl ? (
        <div className="relative">
          <img
            src={imageUrl}
            alt="Preview do torneio"
            className="w-full h-48 object-cover rounded-lg border"
          />
          <Button
            type="button"
            size="sm"
            variant="destructive"
            className="absolute top-2 right-2"
            onClick={handleRemove}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-muted-foreground/30 rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
        >
          {uploading ? (
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="text-sm text-muted-foreground">Enviando...</span>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <ImagePlus className="h-8 w-8 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                Clique para adicionar uma imagem
              </span>
              <span className="text-xs text-muted-foreground">
                JPG, PNG, WEBP ou GIF (máx 5MB)
              </span>
            </div>
          )}
        </div>
      )}
      
      <Input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={handleUpload}
        disabled={uploading}
      />
    </div>
  );
};

export default TournamentImageUpload;
