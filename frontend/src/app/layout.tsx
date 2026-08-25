import type { Metadata } from 'next';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import './globals.css';

export const metadata: Metadata = {
  title: 'Placemind — AI Career Copilot | ATS Resume Scoring & Mock Interviews',
  description:
    'The AI career copilot that parses, scores, rewrites, and rehearses — all in one place with dual Cloud (Gemini 2.5) and Local Privacy (LM Studio) AI.',
  keywords: [
    'ATS Resume Scorer',
    'pgvector',
    'AI Mock Interview',
    'Resume Optimizer',
    'Local AI Privacy',
    'LM Studio',
    'Next.js 15',
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning className="scroll-smooth">
      <body className="bg-[#F7EFE8] dark:bg-[#0A0A0C] text-[#1A1A1E] dark:text-[#F5F5F7] antialiased selection:bg-[#6C5CE7] selection:text-white transition-colors duration-300">
        <ThemeProvider>
          {children}
        </ThemeProvider>
        
        {/* SVG Gooey Liquid Fusion Filter Definition */}
        <svg className="absolute w-0 h-0 pointer-events-none" aria-hidden="true">
          <defs>
            <filter id="gooey-fusion">
              <feGaussianBlur in="SourceGraphic" stdDeviation="6" result="blur" />
              <feColorMatrix
                in="blur"
                mode="matrix"
                values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 19 -9"
                result="goo"
              />
              <feComposite in="SourceGraphic" in2="goo" operator="atop" />
            </filter>
            <filter id="liquid-bridge">
              <feGaussianBlur in="SourceGraphic" stdDeviation="7" result="blur" />
              <feColorMatrix
                in="blur"
                mode="matrix"
                values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 22 -10"
                result="liquid"
              />
              <feBlend in="SourceGraphic" in2="liquid" />
            </filter>
          </defs>
        </svg>
      </body>
    </html>
  );
}
