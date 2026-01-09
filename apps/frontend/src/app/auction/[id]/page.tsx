'use client';

import { AuctionDetail } from '@/components/auction/AuctionDetail';

export default function AuctionDetailPage({ params }: { params: { id: string } }) {
  return <AuctionDetail auctionId={params.id} />;
}
