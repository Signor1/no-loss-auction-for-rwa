'use client';

import { useState, useEffect } from 'react';
import { useAssetManagement, validateAssetForm, AssetFormState } from '@/lib/asset-management';
import { AssetFormSteps } from './AssetFormSteps';
import { AssetPreview } from './AssetPreview';
import { AssetFormValidation } from './AssetFormValidation';

export function AssetListing() {
  const {
    assets,
    formState,
    isLoading,
    isCreating,
    isUploading,
    uploadProgress,
    saveDraft,
    publishAsset,
    uploadToIPFS,
    updateFormState,
    resetForm,
    validateAssetForm,
  } = useAssetManagement();

  const [currentStep, setCurrentStep] = useState(1);
  const [showPreview, setShowPreview] = useState(false);
  const [validation, setValidation] = useState(validateAssetForm());
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Form steps
  const formSteps = [
    { id: 1, title: 'Basic Information', description: 'Asset details and categorization' },
    { id: 2, title: 'Specifications', description: 'Technical specifications and features' },
    { id: 3, title: 'Media', description: 'Images and documents upload' },
    { id: 4, title: 'Valuation', description: 'Asset valuation and appraisal' },
    { id: 5, title: 'Pricing', description: 'Pricing strategy and auction parameters' },
    { id: 6, title: 'Review', description: 'Review and publish your asset' },
  ];

  // Validate form on step change
  useEffect(() => {
    const validation = validateAssetForm();
    setValidation(validation);
    setErrors(validation.errors);
  }, [formState]);

  const handleNextStep = () => {
    if (currentStep < formSteps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePreviousStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleStepClick = (stepId: number) => {
    // Only allow going to previous steps or next step if current step is valid
    if (stepId <= currentStep || validation.isValid) {
      setCurrentStep(stepId);
    }
  };

  const handleSaveDraft = async () => {
    setIsSavingDraft(true);
    try {
      await saveDraft();
      // Show success message
      alert('Draft saved successfully!');
    } catch (error) {
      console.error('Failed to save draft:', error);
      alert('Failed to save draft. Please try again.');
    } finally {
      setIsSavingDraft(false);
    }
  };

  const handlePublish = async () => {
    if (!validation.isValid) {
      alert('Please fix all errors before publishing.');
      return;
    }

    setIsPublishing(true);
    try {
      const asset = await saveDraft();
      await publishAsset(asset.id);
      alert('Asset published successfully!');
      resetForm();
      setCurrentStep(1);
    } catch (error) {
      console.error('Failed to publish asset:', error);
      alert('Failed to publish asset. Please try again.');
    } finally {
      setIsPublishing(false);
    }
  };

  const handleImageUpload = async (files: FileList) => {
    const uploadPromises = Array.from(files).map(async (file) => {
      const result = await uploadToIPFS(file);
      if (result.success) {
        return {
          id: Date.now().toString() + Math.random().toString(),
          url: result.url,
          ipfsHash: result.ipfsHash,
          isPrimary: formState.images.length === 0,
          order: formState.images.length,
          uploadedAt: Date.now(),
        };
      }
      return null;
    });

    const uploadedImages = await Promise.all(uploadPromises);
    const validImages = uploadedImages.filter(img => img !== null);

    updateFormState('images', {
      images: [...formState.images, ...validImages],
    });
  };

  const handleDocumentUpload = async (files: FileList) => {
    const uploadPromises = Array.from(files).map(async (file) => {
      const result = await uploadToIPFS(file);
      if (result.success) {
        return {
          id: Date.now().toString() + Math.random().toString(),
          name: file.name,
          type: 'other' as any,
          url: result.url,
          ipfsHash: result.ipfsHash,
          size: file.size,
          uploadedAt: Date.now(),
        };
      }
      return null;
    });

    const uploadedDocs = await Promise.all(uploadPromises);
    const validDocs = uploadedDocs.filter(doc => doc !== null);

    updateFormState('documents', {
      documents: [...formState.documents, ...validDocs],
    });
  };

  const setPrimaryImage = (imageId: string) => {
    updateFormState('images', {
      images: formState.images.map(img => ({
        ...img,
        isPrimary: img.id === imageId,
      })),
    });
  };

  const removeImage = (imageId: string) => {
    updateFormState('images', {
      images: formState.images.filter(img => img.id !== imageId),
    });
  };

  const removeDocument = (documentId: string) => {
    updateFormState('documents', {
      documents: formState.documents.filter(doc => doc.id !== documentId),
    });
  };

  const getStepProgress = () => {
    return (currentStep / formSteps.length) * 100;
  };

  const isStepValid = (stepId: number) => {
    // Basic validation for each step
    switch (stepId) {
      case 1:
        return formState.basicInfo.title.trim().length >= 10 &&
               formState.basicInfo.description.trim().length >= 50 &&
               formState.basicInfo.category &&
               formState.basicInfo.assetType;
      case 2:
        return true; // Specifications are optional
      case 3:
        return formState.images.length > 0 && formState.images.some(img => img.isPrimary);
      case 4:
        return formState.valuation.amount && parseFloat(formState.valuation.amount) > 0 &&
               formState.valuation.date;
      case 5:
        return formState.pricing.reservePrice && parseFloat(formState.pricing.reservePrice) > 0;
      case 6:
        return validation.isValid;
      default:
        return false;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading asset management...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Create Asset Listing</h1>
              <p className="text-gray-600 mt-1">List your RWA asset for auction</p>
            </div>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={handleSaveDraft}
                disabled={isSavingDraft}
                className="bg-gray-600 hover:bg-gray-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg font-medium"
              >
                {isSavingDraft ? 'Saving...' : 'Save Draft'}
              </button>
              
              <button
                onClick={() => setShowPreview(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium"
              >
                Preview
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              {formSteps.map((step, index) => (
                <button
                  key={step.id}
                  onClick={() => handleStepClick(step.id)}
                  disabled={step.id > currentStep + 1}
                  className={`flex items-center space-x-2 ${
                    step.id <= currentStep
                      ? 'text-blue-600'
                      : step.id === currentStep + 1 && !isStepValid(currentStep)
                      ? 'text-gray-400'
                      : 'text-gray-400'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    step.id < currentStep
                      ? 'bg-blue-600 text-white'
                      : step.id === currentStep
                      ? 'bg-blue-100 text-blue-600 border-2 border-blue-600'
                      : step.id === currentStep + 1 && !isStepValid(currentStep)
                      ? 'bg-gray-200 text-gray-400'
                      : 'bg-gray-200 text-gray-400'
                  }`}>
                    {step.id < currentStep ? '✓' : step.id}
                  </div>
                  <div className="text-left">
                    <div className="text-sm font-medium">{step.title}</div>
                    <div className="text-xs text-gray-500">{step.description}</div>
                  </div>
                </button>
              ))}
            </div>
            
            <div className="text-sm text-gray-600">
              Step {currentStep} of {formSteps.length}
            </div>
          </div>
          
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${getStepProgress()}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form Content */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <AssetFormSteps
                currentStep={currentStep}
                formState={formState}
                updateFormState={updateFormState}
                errors={errors}
                onImageUpload={handleImageUpload}
                onDocumentUpload={handleDocumentUpload}
                setPrimaryImage={setPrimaryImage}
                removeImage={removeImage}
                removeDocument={removeDocument}
                isUploading={isUploading}
                uploadProgress={uploadProgress}
              />
              
              {/* Navigation */}
              <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200">
                <button
                  onClick={handlePreviousStep}
                  disabled={currentStep === 1}
                  className="bg-gray-200 hover:bg-gray-300 disabled:bg-gray-100 disabled:cursor-not-allowed text-gray-800 px-6 py-2 rounded-lg font-medium"
                >
                  Previous
                </button>
                
                <div className="flex space-x-3">
                  {currentStep < formSteps.length && (
                    <button
                      onClick={handleNextStep}
                      disabled={!isStepValid(currentStep)}
                      className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-6 py-2 rounded-lg font-medium"
                    >
                      Next
                    </button>
                  )}
                  
                  {currentStep === formSteps.length && (
                    <button
                      onClick={handlePublish}
                      disabled={!validation.isValid || isPublishing}
                      className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-6 py-2 rounded-lg font-medium"
                    >
                      {isPublishing ? 'Publishing...' : 'Publish Asset'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="space-y-6">
              {/* Form Validation */}
              <AssetFormValidation validation={validation} />
              
              {/* Quick Stats */}
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Asset Stats</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Completion</span>
                    <span className="text-sm font-medium">{getStepProgress().toFixed(0)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Images</span>
                    <span className="text-sm font-medium">{formState.images.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Documents</span>
                    <span className="text-sm font-medium">{formState.documents.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Status</span>
                    <span className="text-sm font-medium text-blue-600">Draft</span>
                  </div>
                </div>
              </div>

              {/* Tips */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-blue-900 mb-4">Tips</h3>
                <div className="space-y-2 text-sm text-blue-800">
                  {currentStep === 1 && (
                    <>
                      <p>• Provide detailed and accurate descriptions</p>
                      <p>• Choose the most appropriate category</p>
                      <p>• Include location for physical assets</p>
                    </>
                  )}
                  {currentStep === 2 && (
                    <>
                      <p>• Be specific with technical specifications</p>
                      <p>• Include all relevant features</p>
                      <p>• Provide accurate measurements</p>
                    </>
                  )}
                  {currentStep === 3 && (
                    <>
                      <p>• Upload high-quality images</p>
                      <p>• Include multiple angles</p>
                      <p>• Set a primary image</p>
                    </>
                  )}
                  {currentStep === 4 && (
                    <>
                      <p>• Get professional appraisals</p>
                      <p>• Include supporting documents</p>
                      <p>• Be realistic with valuations</p>
                    </>
                  )}
                  {currentStep === 5 && (
                    <>
                      <p>• Research market prices</p>
                      <p>• Set competitive reserve prices</p>
                      <p>• Consider auction parameters</p>
                    </>
                  )}
                  {currentStep === 6 && (
                    <>
                      <p>• Review all information carefully</p>
                      <p>• Ensure all required fields are complete</p>
                      <p>• Preview before publishing</p>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-gray-900">Asset Preview</h3>
                <button
                  onClick={() => setShowPreview(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            <div className="p-6">
              <AssetPreview asset={formState} />
            </div>
            
            <div className="p-6 border-t border-gray-200">
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowPreview(false)}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-6 py-2 rounded-lg font-medium"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    setShowPreview(false);
                    handlePublish();
                  }}
                  disabled={!validation.isValid}
                  className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-6 py-2 rounded-lg font-medium"
                >
                  Publish
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
