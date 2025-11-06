import { useEffect } from 'react';
import { StatusBar, Style } from '@capacitor/status-bar';
import { Capacitor } from '@capacitor/core';

export function useStatusBarTheme(theme: 'light' | 'dark' | 'system') {
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    const updateStatusBar = async () => {
      try {
        const effectiveTheme = theme === 'system' 
          ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
          : theme;

        if (effectiveTheme === 'dark') {
          // Mode sombre : fond bleu foncé (#0D1117), icônes blanches (style Dark = icônes blanches)
          await StatusBar.setBackgroundColor({ color: '#0D1117' });
          await StatusBar.setStyle({ style: Style.Dark });
        } else {
          // Mode clair : fond bleu Material (#1976D2), icônes blanches (style Dark = icônes blanches)
          await StatusBar.setBackgroundColor({ color: '#1976D2' });
          await StatusBar.setStyle({ style: Style.Dark });
        }
        
        console.log(`📱 StatusBar configurée: theme=${effectiveTheme}, couleur=${effectiveTheme === 'dark' ? '#0D1117' : '#1976D2'}`);
      } catch (error) {
        console.error('❌ Erreur configuration StatusBar:', error);
      }
    };

    updateStatusBar();
  }, [theme]);
}
