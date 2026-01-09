/* Wallet Icons - Basic SVG placeholders */
export const WALLET_ICONS = {
  metamask: (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 5 5v-3l5-5v3z" fill="#F6851B"/>
    </svg>
  ),
  coinbase: (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="10" fill="#0052FF"/>
      <path d="M12 7a5 5 0 110 10 5 5 0 010-10z" fill="white"/>
    </svg>
  ),
  rainbow: (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="2" y="2" width="20" height="20" rx="4" fill="url(#rainbow-gradient)"/>
      <defs>
        <linearGradient id="rainbow-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FF6B6B"/>
          <stop offset="33%" stopColor="#4ECDC4"/>
          <stop offset="66%" stopColor="#45B7D1"/>
          <stop offset="100%" stopColor="#96CEB4"/>
        </linearGradient>
      </defs>
    </svg>
  ),
  walletconnect: (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h2v-3H11v3zm0-4h2V7h-2v3zm0-4h2V3h-2v3z" fill="#3B99FC"/>
    </svg>
  ),
  base: (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="10" fill="#0052FF"/>
      <path d="M12 6a6 6 0 110 12 6 6 0 010-12z" fill="white"/>
    </svg>
  ),
  default: (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="2" y="2" width="20" height="20" rx="4" fill="#6B7280"/>
      <path d="M12 7a5 5 0 110 10 5 5 0 010-10z" fill="white"/>
    </svg>
  ),
};
