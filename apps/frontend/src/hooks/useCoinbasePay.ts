'use client';

import { useState, useCallback } from 'react';
import { useAccount } from 'wagmi';

export function useCoinbasePay() {
    const { address } = useAccount();
    const [isOpening, setIsOpening] = useState(false);

    const generatePayUrl = useCallback(() => {
        if (!address) return null;

        const baseUrl = 'https://pay.coinbase.com/buy/select-asset';
        const params = new URLSearchParams({
            appId: process.env.NEXT_PUBLIC_COINBASE_APP_ID || 'no-loss-auction',
            destinationWallets: JSON.stringify([
                {
                    address,
                    blockchains: ['base', 'ethereum'],
                    assets: ['ETH', 'USDC'],
                },
            ]),
        });

        return `${baseUrl}?${params.toString()}`;
    }, [address]);

    const openCoinbasePay = useCallback(() => {
        const url = generatePayUrl();
        if (url) {
            setIsOpening(true);
            window.open(url, '_blank', 'width=500,height=700');
            setTimeout(() => setIsOpening(false), 2000);
        }
    }, [generatePayUrl]);

    return {
        openCoinbasePay,
        isOpening,
        isAvailable: !!address,
    };
}
