import { AuctionList } from '@/components/auction/AuctionList';
import { Hero } from '@/components/layout/Hero';

export default function Home() {
  return (
    <main className="min-h-screen">
      <Hero />
      <div className="container mx-auto px-4 py-12">
        <AuctionList />
      </div>
    </main>
  );
}
