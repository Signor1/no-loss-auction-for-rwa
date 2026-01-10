'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAccount } from 'wagmi';

// Types for asset management
export interface Asset {
  id: string;
  title: string;
  description: string;
  longDescription: string;
  category: AssetCategory;
  subcategory: string;
  assetType: AssetType;
  location?: string;
  specifications: Record<string, any>;
  images: AssetImage[];
  documents: AssetDocument[];
  valuation: AssetValuation;
  pricing: AssetPricing;
  auctionParameters: AuctionParameters;
  metadata: AssetMetadata;
  status: AssetStatus;
  createdAt: number;
  updatedAt: number;
  createdBy: string;
  isDraft: boolean;
  publishedAt?: number;
}

export interface AssetImage {
  id: string;
  url: string;
  ipfsHash?: string;
  caption?: string;
  isPrimary: boolean;
  order: number;
  uploadedAt: number;
}

export interface AssetDocument {
  id: string;
  name: string;
  type: DocumentType;
  url: string;
  ipfsHash?: string;
  size: number;
  uploadedAt: number;
  description?: string;
}

export interface AssetValuation {
  amount: string;
  currency: string;
  date: string;
  method: ValuationMethod;
  appraiser?: string;
  appraisalReport?: string;
  confidence: 'high' | 'medium' | 'low';
}

export interface AssetPricing {
  reservePrice: string;
  buyNowPrice?: string;
  currency: string;
  pricingStrategy: PricingStrategy;
  priceHistory?: Array<{
    price: string;
    date: string;
    source: string;
  }>;
}

export interface AuctionParameters {
  startTime?: number;
  endTime?: number;
  minBidIncrement: string;
  withdrawalPenalty: number;
  settlementPeriod: number;
  autoSettle: boolean;
  secureEscrow: boolean;
  noLossGuarantee: boolean;
  maxBidders?: number;
  bidExtensionPeriod?: number;
}

export interface AssetMetadata {
  tags: string[];
  features: string[];
  condition: Condition;
  authenticity: Authenticity;
  legalStatus: LegalStatus;
  certifications: Certification[];
  restrictions: string[];
  additionalInfo: Record<string, any>;
}

export type AssetCategory = 
  | 'real-estate' 
  | 'art' 
  | 'commodities' 
  | 'intellectual-property' 
  | 'financial-instruments'
  | 'vehicles'
  | 'jewelry'
  | 'collectibles'
  | 'other';

export type AssetType = 
  | 'residential-property'
  | 'commercial-property'
  | 'land'
  | 'painting'
  | 'sculpture'
  | 'digital-art'
  | 'nft'
  | 'gold'
  | 'silver'
  | 'oil'
  | 'cryptocurrency'
  | 'patent'
  | 'trademark'
  | 'copyright'
  | 'stock'
  | 'bond'
  | 'car'
  | 'motorcycle'
  | 'boat'
  | 'watch'
  | 'diamond'
  | 'vintage'
  | 'other';

export type DocumentType = 
  | 'deed'
  | 'title'
  | 'appraisal'
  | 'certificate'
  | 'inspection'
  | 'insurance'
  | 'legal'
  | 'technical'
  | 'photo'
  | 'video'
  | 'other';

export type ValuationMethod = 
  | 'comparative-market-analysis'
  | 'cost-approach'
  | 'income-approach'
  | 'expert-appraisal'
  | 'automated-valuation'
  | 'other';

export type PricingStrategy = 
  | 'fixed-price'
  | 'auction-only'
  | 'auction-or-buy-now'
  | 'negotiable'
  | 'best-offer';

export type AssetStatus = 
  | 'draft'
  | 'pending-review'
  | 'published'
  | 'in-auction'
  | 'sold'
  | 'delisted'
  | 'suspended';

export type Condition = 
  | 'new'
  | 'like-new'
  | 'good'
  | 'fair'
  | 'poor'
  | 'needs-restoration';

export type Authenticity = 
  | 'verified-authentic'
  | 'authenticated'
  | 'unverified'
  | 'questionable'
  | 'replica'
  | 'fake';

export type LegalStatus = 
  | 'clear-title'
  | 'encumbered'
  | 'disputed'
  | 'pending-verification'
  | 'restricted'
  | 'international';

export interface Certification {
  id: string;
  name: string;
  issuer: string;
  date: string;
  expiryDate?: string;
  documentUrl: string;
  verified: boolean;
}

// Asset form validation
export interface AssetFormValidation {
  isValid: boolean;
  errors: Record<string, string>;
  warnings: Record<string, string>;
}

// Asset creation form state
export interface AssetFormState {
  basicInfo: {
    title: string;
    description: string;
    longDescription: string;
    category: AssetCategory;
    subcategory: string;
    assetType: AssetType;
    location: string;
  };
  specifications: Record<string, any>;
  images: AssetImage[];
  documents: AssetDocument[];
  valuation: AssetValuation;
  pricing: AssetPricing;
  auctionParameters: AuctionParameters;
  metadata: AssetMetadata;
}

// IPFS integration
export interface IPFSUploadResult {
  success: boolean;
  ipfsHash: string;
  url: string;
  error?: string;
}

// Mock data for development
const MOCK_ASSETS: Asset[] = [
  {
    id: '1',
    title: 'Luxury Manhattan Penthouse',
    description: 'Prime real estate in heart of Manhattan',
    longDescription: 'This exceptional penthouse apartment represents one of Manhattan\'s most prestigious residential opportunities...',
    category: 'real-estate' as AssetCategory,
    subcategory: 'luxury-residential',
    assetType: 'residential-property' as AssetType,
    location: 'Manhattan, New York, USA',
    specifications: {
      bedrooms: 3,
      bathrooms: 3.5,
      squareFootage: 4200,
      yearBuilt: 2019,
      parkingSpaces: 2,
      doorman: true,
      elevator: true,
      terrace: true,
      smartHome: true,
    },
    images: [
      {
        id: 'img_1',
        url: '/api/placeholder/asset/1-1',
        isPrimary: true,
        order: 0,
        uploadedAt: Date.now(),
      },
      {
        id: 'img_2',
        url: '/api/placeholder/asset/1-2',
        isPrimary: false,
        order: 1,
        uploadedAt: Date.now(),
      },
    ],
    documents: [
      {
        id: 'doc_1',
        name: 'Property Deed',
        type: 'deed' as DocumentType,
        url: '/api/documents/deed.pdf',
        size: 2048576,
        uploadedAt: Date.now(),
        description: 'Official property deed',
      },
    ],
    valuation: {
      amount: '5250000',
      currency: 'USD',
      date: '2024-01-15',
      method: 'comparative-market-analysis' as ValuationMethod,
      appraiser: 'Manhattan Appraisal Services',
      confidence: 'high' as const,
    },
    pricing: {
      reservePrice: '5000000',
      buyNowPrice: '5500000',
      currency: 'USD',
      pricingStrategy: 'auction-or-buy-now' as PricingStrategy,
    },
    auctionParameters: {
      minBidIncrement: '25000',
      withdrawalPenalty: 5,
      settlementPeriod: 30,
      autoSettle: true,
      secureEscrow: true,
      noLossGuarantee: true,
    },
    metadata: {
      tags: ['luxury', 'manhattan', 'penthouse', 'prime-location'],
      features: ['city-view', 'doorman', 'parking', 'terrace', 'smart-home'],
      condition: 'like-new' as Condition,
      authenticity: 'verified-authentic' as Authenticity,
      legalStatus: 'clear-title' as LegalStatus,
      certifications: [],
      restrictions: [],
    },
    status: 'draft' as AssetStatus,
    createdAt: Date.now() - 86400000,
    updatedAt: Date.now() - 3600000,
    createdBy: '0x1234567890abcdef1234567890abcdef12345678',
    isDraft: true,
  },
];

export function useAssetManagement() {
  const { address } = useAccount();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [currentAsset, setCurrentAsset] = useState<Asset | null>(null);
  const [formState, setFormState] = useState<AssetFormState>({
    basicInfo: {
      title: '',
      description: '',
      longDescription: '',
      category: 'real-estate',
      subcategory: '',
      assetType: 'residential-property',
      location: '',
    },
    specifications: {},
    images: [],
    documents: [],
    valuation: {
      amount: '',
      currency: 'USD',
      date: '',
      method: 'comparative-market-analysis',
      confidence: 'medium',
    },
    pricing: {
      reservePrice: '',
      currency: 'USD',
      pricingStrategy: 'auction-only',
    },
    auctionParameters: {
      minBidIncrement: '0.01',
      withdrawalPenalty: 5,
      settlementPeriod: 7,
      autoSettle: true,
      secureEscrow: true,
      noLossGuarantee: true,
    },
    metadata: {
      tags: [],
      features: [],
      condition: 'good',
      authenticity: 'verified-authentic',
      legalStatus: 'clear-title',
      certifications: [],
      restrictions: [],
    },
  });

  // Load assets
  useEffect(() => {
    if (address) {
      loadAssets();
    }
  }, [address]);

  const loadAssets = async () => {
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      setAssets(MOCK_ASSETS);
    } catch (error) {
      console.error('Failed to load assets:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Validate asset form
  const validateAssetForm = (): AssetFormValidation => {
    const errors: Record<string, string> = {};
    const warnings: Record<string, string> = {};

    // Basic info validation
    if (!formState.basicInfo.title.trim()) {
      errors.title = 'Title is required';
    } else if (formState.basicInfo.title.length < 10) {
      errors.title = 'Title must be at least 10 characters';
    }

    if (!formState.basicInfo.description.trim()) {
      errors.description = 'Description is required';
    } else if (formState.basicInfo.description.length < 50) {
      errors.description = 'Description must be at least 50 characters';
    }

    if (!formState.basicInfo.category) {
      errors.category = 'Category is required';
    }

    if (!formState.basicInfo.assetType) {
      errors.assetType = 'Asset type is required';
    }

    // Pricing validation
    if (!formState.pricing.reservePrice || parseFloat(formState.pricing.reservePrice) <= 0) {
      errors.reservePrice = 'Reserve price must be greater than 0';
    }

    if (formState.pricing.buyNowPrice && parseFloat(formState.pricing.buyNowPrice) <= parseFloat(formState.pricing.reservePrice)) {
      errors.buyNowPrice = 'Buy now price must be greater than reserve price';
    }

    // Valuation validation
    if (!formState.valuation.amount || parseFloat(formState.valuation.amount) <= 0) {
      errors.valuationAmount = 'Valuation amount must be greater than 0';
    }

    if (!formState.valuation.date) {
      errors.valuationDate = 'Valuation date is required';
    }

    // Images validation
    if (formState.images.length === 0) {
      errors.images = 'At least one image is required';
    } else if (!formState.images.some(img => img.isPrimary)) {
      errors.primaryImage = 'A primary image must be selected';
    }

    // Warnings
    if (formState.pricing.reservePrice && formState.valuation.amount) {
      const reservePrice = parseFloat(formState.pricing.reservePrice);
      const valuation = parseFloat(formState.valuation.amount);
      if (reservePrice > valuation * 0.8) {
        warnings.reservePrice = 'Reserve price is high compared to valuation (80% of valuation)';
      }
    }

    if (formState.auctionParameters.withdrawalPenalty > 10) {
      warnings.withdrawalPenalty = 'High withdrawal penalty may discourage bidders';
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
      warnings,
    };
  };

  // Save asset draft
  const saveDraft = async () => {
    if (!address) return;

    setIsCreating(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const newAsset: Asset = {
        id: Date.now().toString(),
        ...formState,
        status: 'draft',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        createdBy: address,
        isDraft: true,
      };

      setAssets(prev => [newAsset, ...prev]);
      return newAsset;
    } catch (error) {
      console.error('Failed to save draft:', error);
      throw error;
    } finally {
      setIsCreating(false);
    }
  };

  // Publish asset
  const publishAsset = async (assetId: string) => {
    setIsUpdating(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setAssets(prev => 
        prev.map(asset => 
          asset.id === assetId 
            ? { 
                ...asset, 
                status: 'published',
                isDraft: false,
                publishedAt: Date.now(),
                updatedAt: Date.now(),
              }
            : asset
        )
      );
    } catch (error) {
      console.error('Failed to publish asset:', error);
      throw error;
    } finally {
      setIsUpdating(false);
    }
  };

  // Upload to IPFS
  const uploadToIPFS = async (file: File): Promise<IPFSUploadResult> => {
    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Simulate IPFS upload
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      await new Promise(resolve => setTimeout(resolve, 2000));
      
      clearInterval(progressInterval);
      setUploadProgress(100);

      const ipfsHash = `Qm${Math.random().toString(16).substr(2, 46)}`;
      const url = `https://ipfs.io/ipfs/${ipfsHash}`;

      return {
        success: true,
        ipfsHash,
        url,
      };
    } catch (error) {
      console.error('Failed to upload to IPFS:', error);
      return {
        success: false,
        ipfsHash: '',
        url: '',
        error: error instanceof Error ? error.message : 'Upload failed',
      };
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  // Update form state
  const updateFormState = (section: keyof AssetFormState, data: any) => {
    setFormState(prev => ({
      ...prev,
      [section]: { ...prev[section], ...data },
    }));
  };

  // Reset form
  const resetForm = () => {
    setFormState({
      basicInfo: {
        title: '',
        description: '',
        longDescription: '',
        category: 'real-estate',
        subcategory: '',
        assetType: 'residential-property',
        location: '',
      },
      specifications: {},
      images: [],
      documents: [],
      valuation: {
        amount: '',
        currency: 'USD',
        date: '',
        method: 'comparative-market-analysis',
        confidence: 'medium',
      },
      pricing: {
        reservePrice: '',
        currency: 'USD',
        pricingStrategy: 'auction-only',
      },
      auctionParameters: {
        minBidIncrement: '0.01',
        withdrawalPenalty: 5,
        settlementPeriod: 7,
        autoSettle: true,
        secureEscrow: true,
        noLossGuarantee: true,
      },
      metadata: {
        tags: [],
        features: [],
        condition: 'good',
        authenticity: 'verified-authentic',
        legalStatus: 'clear-title',
        certifications: [],
        restrictions: [],
      },
    });
  };

  // Get asset statistics
  const getAssetStats = useMemo(() => {
    const totalAssets = assets.length;
    const publishedAssets = assets.filter(a => a.status === 'published').length;
    const draftAssets = assets.filter(a => a.isDraft).length;
    const inAuctionAssets = assets.filter(a => a.status === 'in-auction').length;
    const soldAssets = assets.filter(a => a.status === 'sold').length;

    return {
      totalAssets,
      publishedAssets,
      draftAssets,
      inAuctionAssets,
      soldAssets,
    };
  }, [assets]);

  return {
    // Data
    assets,
    currentAsset,
    formState,
    isLoading,
    isCreating,
    isUpdating,
    isUploading,
    uploadProgress,
    getAssetStats,
    
    // Actions
    loadAssets,
    saveDraft,
    publishAsset,
    uploadToIPFS,
    updateFormState,
    resetForm,
    setCurrentAsset,
    validateAssetForm,
  };
}

// Asset categories and types
export const ASSET_CATEGORIES: Array<{ value: AssetCategory; label: string; icon: string }> = [
  { value: 'real-estate', label: 'Real Estate', icon: '🏠' },
  { value: 'art', label: 'Art & Collectibles', icon: '🎨' },
  { value: 'commodities', label: 'Commodities', icon: '📈' },
  { value: 'intellectual-property', label: 'Intellectual Property', icon: '💡' },
  { value: 'financial-instruments', label: 'Financial Instruments', icon: '💰' },
  { value: 'vehicles', label: 'Vehicles', icon: '🚗' },
  { value: 'jewelry', label: 'Jewelry', icon: '💎' },
  { value: 'collectibles', label: 'Collectibles', icon: '📦' },
  { value: 'other', label: 'Other', icon: '📋' },
];

export const ASSET_TYPES: Record<AssetCategory, Array<{ value: AssetType; label: string }>> = {
  'real-estate': [
    { value: 'residential-property', label: 'Residential Property' },
    { value: 'commercial-property', label: 'Commercial Property' },
    { value: 'land', label: 'Land' },
  ],
  'art': [
    { value: 'painting', label: 'Painting' },
    { value: 'sculpture', label: 'Sculpture' },
    { value: 'digital-art', label: 'Digital Art' },
    { value: 'nft', label: 'NFT' },
  ],
  'commodities': [
    { value: 'gold', label: 'Gold' },
    { value: 'silver', label: 'Silver' },
    { value: 'oil', label: 'Oil' },
    { value: 'cryptocurrency', label: 'Cryptocurrency' },
  ],
  'intellectual-property': [
    { value: 'patent', label: 'Patent' },
    { value: 'trademark', label: 'Trademark' },
    { value: 'copyright', label: 'Copyright' },
  ],
  'financial-instruments': [
    { value: 'stock', label: 'Stock' },
    { value: 'bond', label: 'Bond' },
  ],
  'vehicles': [
    { value: 'car', label: 'Car' },
    { value: 'motorcycle', label: 'Motorcycle' },
    { value: 'boat', label: 'Boat' },
  ],
  'jewelry': [
    { value: 'watch', label: 'Watch' },
    { value: 'diamond', label: 'Diamond' },
  ],
  'collectibles': [
    { value: 'vintage', label: 'Vintage' },
  ],
  'other': [
    { value: 'other', label: 'Other' },
  ],
};

export const DOCUMENT_TYPES: Array<{ value: DocumentType; label: string; icon: string }> = [
  { value: 'deed', label: 'Deed', icon: '📄' },
  { value: 'title', label: 'Title', icon: '📜' },
  { value: 'appraisal', label: 'Appraisal', icon: '📊' },
  { value: 'certificate', label: 'Certificate', icon: '🏆' },
  { value: 'inspection', label: 'Inspection', icon: '🔍' },
  { value: 'insurance', label: 'Insurance', icon: '🛡️' },
  { value: 'legal', label: 'Legal', icon: '⚖️' },
  { value: 'technical', label: 'Technical', icon: '🔧' },
  { value: 'photo', label: 'Photo', icon: '📷' },
  { value: 'video', label: 'Video', icon: '🎥' },
  { value: 'other', label: 'Other', icon: '📋' },
];
