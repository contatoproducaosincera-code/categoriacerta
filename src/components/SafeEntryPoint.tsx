import { useEffect, useState, ReactNode } from 'react';
import { detectEnvironment, EnvironmentInfo } from '@/lib/environmentDetection';
import { cleanupUrlFlags, isReloadLoop, markInitialization } from '@/lib/cacheRecovery';
import { WebViewWarningBanner } from './WebViewWarningBanner';

interface SafeEntryPointProps {
  children: ReactNode;
}

type InitializationStatus = 'detecting' | 'ready' | 'error';

/**
 * SafeEntryPoint - Ultra-lightweight entry point that:
 * 1. Detects environment (browser vs WebView)
 * 2. Handles initialization without API calls
 * 3. Shows WebView warning if needed
 * 4. Renders children only when safe
 */
export function SafeEntryPoint({ children }: SafeEntryPointProps) {
  const [status, setStatus] = useState<InitializationStatus>('detecting');
  const [environment, setEnvironment] = useState<EnvironmentInfo | null>(null);
  const [showWebViewWarning, setShowWebViewWarning] = useState(false);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Step 1: Detect environment
        const env = detectEnvironment();
        setEnvironment(env);
        
        // Step 2: Clean up any URL flags from previous reload
        cleanupUrlFlags();
        
        // Step 3: Check for WebView and show warning
        if (env.isWebView) {
          console.log('[SafeEntry] WebView detected:', env.webViewType);
          setShowWebViewWarning(true);
        }
        
        // Step 4: Log storage availability
        if (!env.hasLocalStorage) {
          console.warn('[SafeEntry] localStorage not available');
        }
        if (!env.hasSessionStorage) {
          console.warn('[SafeEntry] sessionStorage not available');
        }
        
        // Step 5: Mark initialization timestamp
        markInitialization();
        
        // Step 6: Check if we're in a reload loop (don't block, just log)
        if (isReloadLoop()) {
          console.warn('[SafeEntry] Reload loop detected, continuing anyway');
        }
        
        // Initialization complete
        setStatus('ready');
        console.log('[SafeEntry] App initialized successfully');
        
      } catch (error) {
        console.error('[SafeEntry] Initialization error:', error);
        // Even on error, try to render the app
        setStatus('ready');
      }
    };

    initializeApp();
  }, []);

  // Minimal loading state - just a CSS spinner, no React components
  if (status === 'detecting') {
    return (
      <div 
        className="min-h-screen flex items-center justify-center bg-background"
        style={{ 
          minHeight: '100vh', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          backgroundColor: 'var(--background, #fff)'
        }}
      >
        <div 
          style={{
            width: '32px',
            height: '32px',
            border: '3px solid var(--muted, #e5e7eb)',
            borderTopColor: 'var(--primary, #00b4d8)',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
          }}
        />
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <>
      {/* WebView Warning Banner - Shows at top of page */}
      {showWebViewWarning && environment && (
        <WebViewWarningBanner 
          webViewType={environment.webViewType}
          onDismiss={() => setShowWebViewWarning(false)}
        />
      )}
      
      {/* Main App Content */}
      {children}
    </>
  );
}

export default SafeEntryPoint;
