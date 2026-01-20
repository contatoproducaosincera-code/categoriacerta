import { useState, useEffect } from 'react';
import { ExternalLink, AlertTriangle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface InstagramWebViewWarningProps {
  className?: string;
}

// Detect if running in Instagram's in-app browser (WebView)
const isInstagramWebView = (): boolean => {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return false;
  }
  
  const userAgent = navigator.userAgent || navigator.vendor || '';
  
  // Check for Instagram WebView indicators
  const isInstagram = /Instagram/i.test(userAgent);
  const isFBAV = /FBAN|FBAV/i.test(userAgent); // Facebook App (Instagram uses similar WebView)
  const isWebView = /wv|WebView/i.test(userAgent);
  
  // Additional checks for in-app browsers
  const isInAppBrowser = /Line|Snapchat|Twitter|LinkedIn/i.test(userAgent);
  
  return isInstagram || isFBAV || isWebView || isInAppBrowser;
};

// Get the current URL for opening in external browser
const getCurrentUrl = (): string => {
  if (typeof window !== 'undefined') {
    return window.location.href;
  }
  return '';
};

// Attempt to open in external browser
const openInExternalBrowser = () => {
  const currentUrl = getCurrentUrl();
  
  // Try different methods to open in external browser
  // Method 1: Use intent for Android
  const isAndroid = /Android/i.test(navigator.userAgent);
  const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
  
  if (isAndroid) {
    // Android intent to open in Chrome or default browser
    const intentUrl = `intent://${currentUrl.replace(/^https?:\/\//, '')}#Intent;scheme=https;package=com.android.chrome;end`;
    window.location.href = intentUrl;
    
    // Fallback after a short delay
    setTimeout(() => {
      window.open(currentUrl, '_system');
    }, 500);
  } else if (isIOS) {
    // iOS: Try to open in Safari
    // Using a workaround by opening with x-safari URL scheme
    const safariUrl = `x-safari-${currentUrl}`;
    
    // First try the Safari scheme
    try {
      window.location.href = safariUrl;
    } catch {
      // Fallback: just open the URL which might trigger "Open in Safari" option
      window.open(currentUrl, '_blank');
    }
    
    // Additional fallback
    setTimeout(() => {
      // Copy URL to clipboard as last resort
      navigator.clipboard?.writeText(currentUrl);
    }, 1000);
  } else {
    // Generic fallback
    window.open(currentUrl, '_blank');
  }
};

export function InstagramWebViewWarning({ className }: InstagramWebViewWarningProps) {
  const [isWebView, setIsWebView] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // Check on mount
    setIsWebView(isInstagramWebView());
  }, []);

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(getCurrentUrl());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy URL:', error);
    }
  };

  if (!isWebView || dismissed) {
    return null;
  }

  return (
    <Card className={`border-amber-500/50 bg-amber-50 dark:bg-amber-950/30 ${className}`}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1 space-y-3">
            <div>
              <h4 className="font-semibold text-amber-800 dark:text-amber-200 text-sm">
                Navegador do Instagram detectado
              </h4>
              <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                Para uma melhor experiência, abra este site no navegador do seu celular (Chrome ou Safari).
              </p>
            </div>
            
            <div className="flex flex-wrap gap-2">
              <Button 
                size="sm" 
                onClick={openInExternalBrowser}
                className="bg-amber-600 hover:bg-amber-700 text-white text-xs h-8"
              >
                <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                Abrir no navegador
              </Button>
              
              <Button 
                size="sm" 
                variant="outline"
                onClick={handleCopyUrl}
                className="border-amber-500/50 text-amber-700 dark:text-amber-300 text-xs h-8"
              >
                {copied ? '✓ Copiado!' : 'Copiar link'}
              </Button>
            </div>
            
            <p className="text-[10px] text-amber-600 dark:text-amber-400">
              Toque nos 3 pontos (⋮) no canto e selecione "Abrir no navegador"
            </p>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setDismissed(true)}
            className="h-6 w-6 p-0 text-amber-600 hover:text-amber-800 hover:bg-amber-100 dark:hover:bg-amber-900/50"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export { isInstagramWebView };
