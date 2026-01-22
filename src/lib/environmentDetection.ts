/**
 * Environment Detection Utilities
 * Detects WebViews, browser types, and network conditions
 */

export interface EnvironmentInfo {
  isWebView: boolean;
  webViewType: 'instagram' | 'facebook' | 'whatsapp' | 'twitter' | 'linkedin' | 'tiktok' | 'snapchat' | 'line' | 'other' | null;
  isIOS: boolean;
  isAndroid: boolean;
  isMobile: boolean;
  isOnline: boolean;
  hasLocalStorage: boolean;
  hasSessionStorage: boolean;
  hasCookies: boolean;
}

// Detect WebView type from user agent
export const detectWebViewType = (): EnvironmentInfo['webViewType'] => {
  if (typeof navigator === 'undefined') return null;
  
  const ua = navigator.userAgent || navigator.vendor || '';
  
  if (/Instagram/i.test(ua)) return 'instagram';
  if (/FBAN|FBAV|FB_IAB/i.test(ua)) return 'facebook';
  if (/WhatsApp/i.test(ua)) return 'whatsapp';
  if (/Twitter/i.test(ua)) return 'twitter';
  if (/LinkedIn/i.test(ua)) return 'linkedin';
  if (/TikTok|BytedanceWebview|musical_ly/i.test(ua)) return 'tiktok';
  if (/Snapchat/i.test(ua)) return 'snapchat';
  if (/Line\//i.test(ua)) return 'line';
  if (/wv|WebView/i.test(ua) && !/Chrome\/\d+.*Mobile Safari/i.test(ua)) return 'other';
  
  return null;
};

// Check if running in any WebView
export const isWebView = (): boolean => {
  return detectWebViewType() !== null;
};

// Full environment detection
export const detectEnvironment = (): EnvironmentInfo => {
  if (typeof window === 'undefined') {
    return {
      isWebView: false,
      webViewType: null,
      isIOS: false,
      isAndroid: false,
      isMobile: false,
      isOnline: true,
      hasLocalStorage: false,
      hasSessionStorage: false,
      hasCookies: false,
    };
  }

  const ua = navigator.userAgent || '';
  const webViewType = detectWebViewType();

  // Test localStorage availability
  let hasLocalStorage = false;
  try {
    const testKey = '__storage_test__';
    localStorage.setItem(testKey, testKey);
    localStorage.removeItem(testKey);
    hasLocalStorage = true;
  } catch {
    hasLocalStorage = false;
  }

  // Test sessionStorage availability
  let hasSessionStorage = false;
  try {
    const testKey = '__session_test__';
    sessionStorage.setItem(testKey, testKey);
    sessionStorage.removeItem(testKey);
    hasSessionStorage = true;
  } catch {
    hasSessionStorage = false;
  }

  // Test cookies availability
  let hasCookies = false;
  try {
    document.cookie = '__cookie_test__=1';
    hasCookies = document.cookie.includes('__cookie_test__');
    document.cookie = '__cookie_test__=; expires=Thu, 01 Jan 1970 00:00:00 GMT';
  } catch {
    hasCookies = false;
  }

  return {
    isWebView: webViewType !== null,
    webViewType,
    isIOS: /iPhone|iPad|iPod/i.test(ua),
    isAndroid: /Android/i.test(ua),
    isMobile: /iPhone|iPad|iPod|Android|webOS|BlackBerry|IEMobile|Opera Mini/i.test(ua),
    isOnline: navigator.onLine,
    hasLocalStorage,
    hasSessionStorage,
    hasCookies,
  };
};

// Get friendly name for WebView
export const getWebViewName = (type: EnvironmentInfo['webViewType']): string => {
  const names: Record<string, string> = {
    instagram: 'Instagram',
    facebook: 'Facebook',
    whatsapp: 'WhatsApp',
    twitter: 'Twitter/X',
    linkedin: 'LinkedIn',
    tiktok: 'TikTok',
    snapchat: 'Snapchat',
    line: 'LINE',
    other: 'aplicativo',
  };
  return type ? names[type] || 'aplicativo' : '';
};

// Get current URL for sharing
export const getCurrentUrl = (): string => {
  if (typeof window !== 'undefined') {
    // Remove any reload flags
    const url = new URL(window.location.href);
    url.searchParams.delete('reload');
    url.searchParams.delete('cache_cleared');
    return url.toString();
  }
  return '';
};

// Attempt to open in external browser
export const openInExternalBrowser = (): void => {
  const currentUrl = getCurrentUrl();
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
    // iOS: Copy URL to clipboard as most reliable method
    navigator.clipboard?.writeText(currentUrl);
    // Also try to open - may trigger "Open in Safari" option
    window.open(currentUrl, '_blank');
  } else {
    window.open(currentUrl, '_blank');
  }
};
