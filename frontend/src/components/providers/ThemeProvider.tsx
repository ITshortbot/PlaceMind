'use client';

// ============================================================================
// File: frontend/src/components/providers/ThemeProvider.tsx
// Description: next-themes ThemeProvider wrapper with class strategy and system default
// ============================================================================

import React from 'react';
import { ThemeProvider as NextThemesProvider } from 'next-themes';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem={true}
      disableTransitionOnChange={false}
    >
      {children}
    </NextThemesProvider>
  );
}
