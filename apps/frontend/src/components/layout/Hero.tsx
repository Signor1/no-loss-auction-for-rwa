export function Hero() {
  return (
    <div className="bg-gradient-to-r from-primary-600 to-primary-800 text-white">
      <div className="container mx-auto px-4 py-20">
        <h1 className="text-5xl font-bold mb-4">No Loss Auction</h1>
        <p className="text-xl mb-8">
          Participate in auctions for Real World Assets without losing your principal
        </p>
        <div className="flex gap-4">
          <button className="bg-white text-primary-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition">
            Connect Wallet
          </button>
          <button className="border-2 border-white px-6 py-3 rounded-lg font-semibold hover:bg-white hover:text-primary-600 transition">
            Learn More
          </button>
        </div>
      </div>
    </div>
  );
}
