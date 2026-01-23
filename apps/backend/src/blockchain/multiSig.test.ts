import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MultiSig } from './multiSig';
import { MultiSigWallet } from '../models/MultiSigWallet';
import { MultiSigTransaction } from '../models/MultiSigTransaction';
import { Logger } from '../utils/logger';

// Mock models
vi.mock('../models/MultiSigWallet', () => ({
    MultiSigWallet: {
        create: vi.fn(),
        findOne: vi.fn(),
        find: vi.fn()
    }
}));

vi.mock('../models/MultiSigTransaction', () => ({
    MultiSigTransaction: {
        create: vi.fn(),
        findOne: vi.fn(),
        find: vi.fn(),
        updateMany: vi.fn()
    }
}));

// Mock ethers
vi.mock('ethers', () => ({
    ethers: {
        Wallet: vi.fn().mockImplementation(() => ({
            signMessage: vi.fn().mockResolvedValue('0xsignature'),
            address: '0xsigner'
        })),
        utils: {
            solidityKeccak256: vi.fn().mockReturnValue('0xhash'),
            defaultAbiCoder: {
                encode: vi.fn().mockReturnValue('0xencoded')
            },
            arrayify: vi.fn(),
            splitSignature: vi.fn().mockReturnValue({ v: 27, r: '0xr', s: '0xs' }),
            getAddress: vi.fn().mockReturnValue('0xvalidatedAddr'),
            createAddress: vi.fn().mockReturnValue('0xnewAddr')
        },
        providers: {
            JsonRpcProvider: vi.fn().mockImplementation(() => ({
                getTransactionCount: vi.fn().mockResolvedValue(1)
            }))
        }
    }
}));

describe('MultiSig Service', () => {
    let multiSig: MultiSig;
    const mockLogger = {
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
        debug: vi.fn()
    } as unknown as Logger;

    beforeEach(() => {
        vi.clearAllMocks();
        multiSig = new MultiSig(mockLogger);
    });

    describe('createWallet', () => {
        it('should create a wallet and persist it', async () => {
            const config = {
                id: 'wallet1',
                name: 'Test Wallet',
                description: 'Test',
                owners: ['0x1', '0x2'],
                requiredSignatures: 2,
                chainId: 8453
            };

            vi.mocked(MultiSigWallet.create).mockResolvedValue(config as any);

            const wallet = await multiSig.createWallet(config);

            expect(MultiSigWallet.create).toHaveBeenCalledWith(expect.objectContaining({
                id: 'wallet1',
                owners: ['0x1', '0x2'],
                requiredSignatures: 2
            }));
            expect(wallet).toEqual(config);
        });

        it('should throw error for invalid config', async () => {
            const config = {
                id: 'wallet1',
                name: 'Test Wallet',
                description: 'Test',
                owners: [], // Invalid
                requiredSignatures: 2,
                chainId: 8453
            };

            await expect(multiSig.createWallet(config)).rejects.toThrow('At least one owner is required');
        });
    });

    describe('createTransaction', () => {
        it('should create a transaction and persist it', async () => {
            const walletMock = { id: 'wallet1', address: '0xwallet', nonce: 0, chainId: 8453, requiredSignatures: 2, owners: ['0x1', '0x2'] };
            vi.mocked(MultiSigWallet.findOne).mockResolvedValue(walletMock as any);

            const txOptions = {
                walletId: 'wallet1',
                to: '0xrecipient',
                value: '100'
            };

            vi.mocked(MultiSigTransaction.create).mockResolvedValue({ ...txOptions, id: 'tx1' } as any);

            await multiSig.createTransaction(txOptions);

            expect(MultiSigTransaction.create).toHaveBeenCalled();
        });
    });
});
