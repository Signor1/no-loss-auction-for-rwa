import mongoose, { Document, Schema } from 'mongoose';

export enum ContractStatus {
    ACTIVE = 'active',
    PAUSED = 'paused',
    DEPRECATED = 'deprecated',
    UPGRADING = 'upgrading'
}

export interface ISmartContract extends Document {
    name: string;
    address: string;
    network: 'base_mainnet' | 'base_sepolia' | 'ethereum_mainnet' | 'other';
    version: string;
    abi?: string;
    proxyAddress?: string;
    logicAddress?: string; // If using proxy, actual logic implementation
    ownerAddress: string;
    status: ContractStatus;
    isUpgradable: boolean;
    isEmergencyPausable: boolean;
    lastPausedAt?: Date;
    pausedBy?: string;
    metadata: Record<string, any>;
    createdAt: Date;
    updatedAt: Date;
}

const SmartContractSchema = new Schema<ISmartContract>({
    name: { type: String, required: true, index: true },
    address: { type: String, required: true, unique: true, index: true },
    network: { type: String, enum: ['base_mainnet', 'base_sepolia', 'ethereum_mainnet', 'other'], default: 'base_mainnet' },
    version: { type: String, required: true },
    abi: String,
    proxyAddress: String,
    logicAddress: String,
    ownerAddress: { type: String, required: true },
    status: { type: String, enum: Object.values(ContractStatus), default: ContractStatus.ACTIVE },
    isUpgradable: { type: Boolean, default: false },
    isEmergencyPausable: { type: Boolean, default: true },
    lastPausedAt: Date,
    pausedBy: String,
    metadata: { type: Map, of: Schema.Types.Mixed }
}, {
    timestamps: true
});

export const SmartContract = mongoose.model<ISmartContract>('SmartContract', SmartContractSchema);
