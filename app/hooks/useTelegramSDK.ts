"use client";

import { useEffect, useState } from 'react';
import type { TelegramTheme } from '@/app/lib/ui/theme';

export const useTelegramSDK = () => {
  const [isReady, setIsReady] = useState(false);
  const [user, setUser] = useState<{ id: number; first_name: string; username?: string } | null>(null);
  const [theme, setTheme] = useState<TelegramTheme>('dark');
  const [viewport, setViewport] = useState<{ height: number; width: number; is_expanded: boolean }>({ height: 0, width: 0, is_expanded: false });

  useEffect(() => {
    if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
      const tg = window.Telegram.WebApp;
      tg.ready();
      tg.expand();
      setTheme(tg.colorScheme);
      if (tg.initDataUnsafe.user) {
        setUser(tg.initDataUnsafe.user);
      }
      setViewport({ height: tg.viewport.height, width: tg.viewport.width, is_expanded: tg.viewport.is_expanded });
      tg.onEvent('themeChanged', () => setTheme(tg.colorScheme));
      tg.onEvent('viewportChanged', () => setViewport({ height: tg.viewport.height, width: tg.viewport.width, is_expanded: tg.viewport.is_expanded }));
      setIsReady(true);
    } else {
      setTimeout(() => { setIsReady(true); setTheme('dark'); }, 100);
    }
  }, []);

  const haptic = {
    light: () => window.Telegram?.WebApp?.HapticFeedback?.impactOccurred('light'),
    medium: () => window.Telegram?.WebApp?.HapticFeedback?.impactOccurred('medium'),
    heavy: () => window.Telegram?.WebApp?.HapticFeedback?.impactOccurred('heavy'),
    success: () => window.Telegram?.WebApp?.HapticFeedback?.notificationOccurred('success'),
    error: () => window.Telegram?.WebApp?.HapticFeedback?.notificationOccurred('error'),
    warning: () => window.Telegram?.WebApp?.HapticFeedback?.notificationOccurred('warning'),
    selection: () => window.Telegram?.WebApp?.HapticFeedback?.selectionChanged(),
  } as const;

  const mainButton = {
    show: (text: string, callback?: () => void) => {
      if (!window.Telegram?.WebApp?.MainButton) return;
      const btn = window.Telegram.WebApp.MainButton;
      btn.setText(text);
      if (callback) btn.onClick(callback);
      btn.show();
      btn.enable();
    },
    hide: () => window.Telegram?.WebApp?.MainButton?.hide(),
    setProgress: (show: boolean) => {
      if (!window.Telegram?.WebApp?.MainButton) return;
      if (show) window.Telegram.WebApp.MainButton.showProgress();
      else window.Telegram.WebApp.MainButton.hideProgress();
    }
  };

  const backButton = {
    show: (callback: () => void) => {
      if (!window.Telegram?.WebApp?.BackButton) return;
      const btn = window.Telegram.WebApp.BackButton;
      btn.onClick(callback);
      btn.show();
    },
    hide: () => window.Telegram?.WebApp?.BackButton?.hide(),
  };

  return { isReady, user, theme, viewport, haptic, mainButton, backButton } as const;
};


