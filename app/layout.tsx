import Header from '@/app/_components/Header';
import { AuthSessionProvider } from '@/app/providers/session-provider';
import { ErrorListener } from '@/components/system/error-listener';
import RegisterServiceWorker from '@/components/todo/RegisterServiceWorker';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#ffffff',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#000000" />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <AuthSessionProvider>
          <Header />
          <ErrorListener />
          <RegisterServiceWorker />
          {children}
        </AuthSessionProvider>
      </body>
    </html>
  );
}
