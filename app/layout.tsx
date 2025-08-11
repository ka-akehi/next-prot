import Header from '@/app/_components/Header';
import { AuthSessionProvider } from '@/app/providers/session-provider';
import RegisterServiceWorker from '@/components/RegisterServiceWorker';
import { ErrorListener } from '@/components/system/error-listener';
import { Geist, Geist_Mono } from 'next/font/google';
import Script from 'next/script';
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
          <Script src={`https://www.googletagmanager.com/gtag/js?id=G-XXXXXXX`} strategy="afterInteractive" />
          <Script id="ga-init" strategy="afterInteractive">
            {`
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', 'G-XXXXXXX', {
      debug_mode: true,
      page_path: window.location.pathname,
    });
  `}
          </Script>
          <Header />
          <ErrorListener />
          <RegisterServiceWorker />
          {children}
        </AuthSessionProvider>
      </body>
    </html>
  );
}
