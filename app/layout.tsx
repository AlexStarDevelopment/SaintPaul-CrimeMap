import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import Script from 'next/script';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import '@fontsource/inter';
import './globals.css';
import ThemeProvider from './components/ThemeProvider';
import SessionProvider from './components/SessionProvider';
import { ErrorBoundary } from './components/ErrorBoundary';
import GlobalHeader from './components/GlobalHeader';
import GlobalSupportDialog from './components/GlobalSupportDialog';
import { CrimeDataProvider } from './contexts/CrimeDataContext';

// Cache warming disabled in layout to prevent multiple initializations
// Cache warming will only run in production via the cacheWarming module itself

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Saint Paul Crime Map - Interactive Crime Data',
  description:
    'Interactive neighborhood crime map of Saint Paul, Minnesota. View real-time crime data and stay informed about community safety.',
  keywords: 'saint paul crime map, minnesota crime data, neighborhood safety, crime statistics',
  authors: [{ name: 'Saint Paul Community Member' }],
  // Base URL used to resolve social images and canonical links
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
  icons: {
    icon: '/favicon.svg',
    apple: '/apple-icon',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <title>Saint Paul - Crime Map</title>
        <meta
          name="description"
          content="Interactive neighborhood crime map of St. Paul, MN created as a free public resource. Created by Saint Paul community member"
        />
        <meta
          name="keywords"
          content="St. Paul crime map, real-time crime data, St. Paul crime statistics, Minnesota safety map, neighborhood crime map, crime heatmap, St. Paul MN"
        />
        <Script async src="https://www.googletagmanager.com/gtag/js?id=G-8VSBZ6SFBZ"></Script>
        <Script id="google-analytics">
          {`window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());

        gtag('config', 'G-8VSBZ6SFBZ');
        `}
        </Script>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      </head>
      <body className={inter.className}>
        <ErrorBoundary>
          <SessionProvider>
            <ThemeProvider>
              <CrimeDataProvider>
                <GlobalHeader />
                {children}
                <GlobalSupportDialog />
              </CrimeDataProvider>
            </ThemeProvider>
          </SessionProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
