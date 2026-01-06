'use client';

export function AuctionList() {
  return (
    <div>
      <h2 className="text-3xl font-bold mb-6">Active Auctions</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="border rounded-lg p-6 hover:shadow-lg transition">
          <h3 className="text-xl font-semibold mb-2">Sample RWA Auction</h3>
          <p className="text-gray-600 mb-4">Real estate tokenization auction</p>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Total Pool:</span>
              <span className="font-semibold">1,000 ETH</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Time Left:</span>
              <span className="font-semibold">2d 14h 32m</span>
            </div>
          </div>
          <button className="w-full mt-4 bg-primary-600 text-white py-2 rounded-lg hover:bg-primary-700 transition">
            View Details
          </button>
        </div>
      </div>
    </div>
  );
}
