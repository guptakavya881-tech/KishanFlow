import './globals.css';
import { AuthProvider } from '@/context/AuthContext';

export const metadata = {
  title: 'KishanFlow — From Farm to Future',
  description:
    'A modern agricultural marketplace connecting Farmers, Buyers, Suppliers, and Admins for a smarter and stronger agriculture ecosystem.',
  keywords: [
    'KishanFlow',
    'Agriculture Marketplace',
    'Farmer Login',
    'Buyer Registration',
    'Farm to Market',
    'Krishi',
  ],
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Caveat:wght@600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
