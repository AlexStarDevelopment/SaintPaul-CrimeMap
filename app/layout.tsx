/* eslint-disable @next/next/no-page-custom-font */
/* eslint-disable @next/next/next-script-for-ga */
/* eslint-disable react/no-unescaped-entities */
/* eslint-disable @next/next/no-sync-scripts */

import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Script from "next/script";
import "@fontsource/inter";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Saint Paul - Crime Map",
  description:
    "Interactive neighborhood crime map of St Paul, MN created as a free public resource. Created by Saint Paul community member",
  keywords: [
    "saint paul crime map",
    "st paul crime map",
    "st. paul crime map",
    "mn crime map",
    "saint paul mn crime map",
    "st paul mn crime map",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-theme="pastel">
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
        <Script
          async
          src="https://www.googletagmanager.com/gtag/js?id=G-8VSBZ6SFBZ"
        ></Script>
        <Script id="google-analytics">
          {`window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());

        gtag('config', 'G-8VSBZ6SFBZ');
        `}
        </Script>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin=""
        />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap"
        />
        <link
          rel="stylesheet"
          href="https://unpkg.com/leaflet@1.3.1/dist/leaflet.css"
          integrity="sha512-Rksm5RenBEKSKFjgI3a41vrjkw4EVPlJ3+OiI65vTjIdo9brlAacEuKOiQ5OFh7cOI1bkDwLqdLw3Zg0cRJAAQ=="
          crossOrigin=""
        />
        <link
          rel="stylesheet"
          href="https://unpkg.com/leaflet.markercluster@1.3.0/dist/MarkerCluster.css"
        />
        <link
          rel="stylesheet"
          href="https://unpkg.com/leaflet.markercluster@1.3.0/dist/MarkerCluster.Default.css"
        />
        <script
          src="https://unpkg.com/leaflet@1.3.1/dist/leaflet.js"
          integrity="sha512-/Nsx9X4HebavoBvEBuyp3I7od5tA0UzAxs+j83KgC8PU0kgB4XiK4Lfe4y4cgBtaRJQEIFCW+oC506aPT2L1zw=="
          crossOrigin=""
        ></script>
        <script src="https://unpkg.com/leaflet.markercluster@1.3.0/dist/leaflet.markercluster.js"></script>
      </head>
      <body className={inter.className}>{children}</body>
    </html>
  );
}
