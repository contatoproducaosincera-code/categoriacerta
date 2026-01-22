import { useState } from 'react';
import { ExternalLink, X, Copy, Check, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getWebViewName, getCurrentUrl, openInExternalBrowser, EnvironmentInfo } from '@/lib/environmentDetection';

interface WebViewWarningBannerProps {
  webViewType: EnvironmentInfo['webViewType'];
  onDismiss: () => void;
}

/**
 * WebView Warning Banner
 * Fixed banner at top of page warning users about WebView limitations
 */
export function WebViewWarningBanner({ webViewType, onDismiss }: WebViewWarningBannerProps) {
  const [copied, setCopied] = useState(false);
  
  const webViewName = getWebViewName(webViewType);
  
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(getCurrentUrl());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy URL:', error);
    }
  };

  const handleOpenExternal = () => {
    openInExternalBrowser();
  };

  // Get instructions based on platform
  const getInstructions = (): string => {
    if (webViewType === 'instagram') {
      return 'Toque nos 3 pontos (⋮) no canto superior e selecione "Abrir no navegador"';
    }
    if (webViewType === 'whatsapp') {
      return 'Toque nos 3 pontos (⋮) no canto superior e selecione "Abrir no navegador"';
    }
    if (webViewType === 'facebook') {
      return 'Toque nos 3 pontos (⋯) no canto inferior direito e selecione "Abrir no navegador"';
    }
    if (webViewType === 'tiktok') {
      return 'Toque no ícone de compartilhar e selecione "Copiar link", depois abra no navegador';
    }
    return 'Copie o link e abra no navegador do seu celular (Chrome ou Safari)';
  };

  return (
    <div 
      className="fixed top-0 left-0 right-0 z-[100] bg-amber-500 text-white shadow-lg"
      role="alert"
      aria-live="polite"
    >
      <div className="container mx-auto px-3 py-3 sm:px-4 sm:py-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 flex-shrink-0 mt-0.5" aria-hidden="true" />
          
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm sm:text-base">
              Navegador do {webViewName} detectado
            </p>
            <p className="text-xs sm:text-sm opacity-90 mt-1">
              Para melhor funcionamento, abra este site no Chrome ou Safari.
            </p>
            <p className="text-[10px] sm:text-xs opacity-75 mt-1 hidden sm:block">
              {getInstructions()}
            </p>
            
            {/* Action buttons */}
            <div className="flex flex-wrap gap-2 mt-3">
              <Button 
                size="sm"
                onClick={handleOpenExternal}
                className="bg-background text-amber-700 hover:bg-muted h-8 text-xs font-medium"
              >
                <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                Abrir no navegador
              </Button>
              
              <Button 
                size="sm"
                variant="outline"
                onClick={handleCopy}
                className="border-primary-foreground/50 text-primary-foreground hover:bg-primary-foreground/10 h-8 text-xs"
              >
                {copied ? (
                  <>
                    <Check className="h-3.5 w-3.5 mr-1.5" />
                    Copiado!
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5 mr-1.5" />
                    Copiar link
                  </>
                )}
              </Button>
            </div>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={onDismiss}
            className="h-8 w-8 p-0 text-white hover:bg-white/20 flex-shrink-0"
            aria-label="Fechar aviso"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

export default WebViewWarningBanner;
