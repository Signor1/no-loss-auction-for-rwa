import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';
import { WalletConnectButton } from '@/components/WalletConnectButton';

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
          <header className="bg-white border-b border-gray-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center h-16">
                <div className="flex items-center">
                  <h1 className="text-xl font-bold text-gray-900">No-Loss Auction</h1>
                </div>
                <nav className="flex items-center space-x-4">
                  <WalletConnectButton />
                </nav>
              </div>
            </div>
          </header>
          <main>{children}</main>
        </Providers>
      </body>
    </html>
  );
}
