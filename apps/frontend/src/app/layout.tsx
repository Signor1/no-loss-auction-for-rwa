import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';
import { WalletConnectButton } from '@/components/WalletConnectButton';
import { SkipNavLink } from '@/components/accessibility/SkipNavLink';
import { ContrastToggle } from '@/components/accessibility/ContrastToggle';
import { TextScalingControl } from '@/components/accessibility/TextScalingControl';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'No Loss Auction - RWA Tokenization',
  description: 'Decentralized No Loss Auction platform for Real World Asset tokenization',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>
          <SkipNavLink />
          <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800" role="banner">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center h-16">
                <div className="flex items-center">
                  <h1 className="text-xl font-bold text-gray-900">No-Loss Auction</h1>
                </div>
                <nav className="flex items-center space-x-6" role="navigation" aria-label="Main Navigation">
                  <div className="flex items-center space-x-2 border-r dark:border-gray-700 pr-6 mr-6">
                    <ContrastToggle />
                    <TextScalingControl />
                  </div>
                  <WalletConnectButton />
                </nav>
              </div>
            </div>
          </header>
          <main id="main-content" role="main" tabIndex={-1}>
            {children}
          </main>
        </Providers>
      </body>
    </html>
  );
}
