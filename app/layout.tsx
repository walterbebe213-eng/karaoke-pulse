import type {Metadata} from 'next';
import { Sora, Plus_Jakarta_Sans, JetBrains_Mono } from 'next/font/google';
import './globals.css'; // Global styles

const sora = Sora({
  subsets: ['latin'],
  variable: '--font-sora',
});

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-jakarta',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
});

export const metadata: Metadata = {
  title: 'Karaoke Pulse',
  description: 'Interactive premium karaoke lounge and host command dashboard',
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="pt-br" className={`${sora.variable} ${jakarta.variable} ${jetbrainsMono.variable}`}>
      <body suppressHydrationWarning className="bg-background text-on-background min-h-screen">
        {children}
      </body>
    </html>
  );
}

