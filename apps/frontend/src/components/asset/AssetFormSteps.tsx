'use client';

import { useState } from 'react';
import { AssetFormState, AssetCategory, AssetType, AssetStatus, AssetCondition, AssetAuthenticity, AssetLegalStatus, DocumentType, ValuationMethod, PricingStrategy } from '@/lib/asset-management';
import { BasicInfoForm } from './BasicInfoForm';
import { SpecificationsForm } from './SpecificationsForm';
import { MediaUpload } from './MediaUpload';
import { ValuationForm } from './ValuationForm';
import { PricingForm } from './PricingForm';
import { AuctionParametersForm } from './AuctionParametersForm';

interface AssetFormStepsProps {
  formState: AssetFormState;
  updateFormState: (updates: Partial<AssetFormState>) => void;
  currentStep: number;
  setCurrentStep: (step: number) => void;
  validationErrors: Record<string, string[]>;
}

export function AssetFormSteps({
  formState,
  updateFormState,
  currentStep,
  setCurrentStep,
  validationErrors
}: AssetFormStepsProps) {
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());

  const steps = [
    {
      id: 1,
      title: 'Basic Information',
      description: 'Asset title, description, category, and basic details',
      component: BasicInfoForm
    },
    {
      id: 2,
      title: 'Specifications',
      description: 'Detailed asset specifications and characteristics',
      component: SpecificationsForm
    },
    {
      id: 3,
      title: 'Media Upload',
      description: 'Upload images and documents for your asset',
      component: MediaUpload
    },
    {
      id: 4,
      title: 'Valuation',
      description: 'Asset valuation and appraisal information',
      component: ValuationForm
    },
    {
      id: 5,
      title: 'Pricing',
      description: 'Set pricing strategy and reserve price',
      component: PricingForm
    },
    {
      id: 6,
      title: 'Auction Parameters',
      description: 'Configure auction settings and parameters',
      component: AuctionParametersForm
    }
  ];

  const handleStepChange = (step: number) => {
    // Allow navigation to any step, but mark current step as completed if moving forward
    if (step > currentStep) {
      setCompletedSteps(prev => new Set([...prev, currentStep]));
    }
    setCurrentStep(step);
  };

  const handleNext = () => {
    if (currentStep < steps.length) {
      setCompletedSteps(prev => new Set([...prev, currentStep]));
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const getStepStatus = (stepId: number) => {
    if (completedSteps.has(stepId)) return 'completed';
    if (currentStep === stepId) return 'active';
    return 'pending';
  };

  const CurrentStepComponent = steps[currentStep - 1]?.component;

  return (
    <div className="w-full max-w-6xl mx-auto">
      {/* Step Navigation */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center flex-1">
              <div className="flex items-center">
                <button
                  onClick={() => handleStepChange(step.id)}
                  className={`
                    relative flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-200
                    ${getStepStatus(step.id) === 'completed' 
                      ? 'bg-green-500 border-green-500 text-white' 
                      : getStepStatus(step.id) === 'active'
                      ? 'bg-blue-500 border-blue-500 text-white'
                      : 'bg-white border-gray-300 text-gray-500 hover:border-gray-400'
                    }
                  `}
                >
                  {getStepStatus(step.id) === 'completed' ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <span className="text-sm font-medium">{step.id}</span>
                  )}
                </button>
                <div className="ml-3 hidden sm:block">
                  <p className={`text-sm font-medium ${
                    getStepStatus(step.id) === 'active' ? 'text-blue-600' : 
                    getStepStatus(step.id) === 'completed' ? 'text-green-600' : 'text-gray-500'
                  }`}>
                    {step.title}
                  </p>
                  <p className="text-xs text-gray-500">{step.description}</p>
                </div>
              </div>
              {index < steps.length - 1 && (
                <div className={`flex-1 h-0.5 mx-4 ${
                  completedSteps.has(step.id) ? 'bg-green-500' : 'bg-gray-300'
                }`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Current Step Content */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            {steps[currentStep - 1]?.title}
          </h2>
          <p className="text-gray-600">
            {steps[currentStep - 1]?.description}
          </p>
        </div>

        {CurrentStepComponent && (
          <CurrentStepComponent
            formState={formState}
            updateFormState={updateFormState}
            validationErrors={validationErrors}
          />
        )}
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between">
        <button
          onClick={handlePrevious}
          disabled={currentStep === 1}
          className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Previous
        </button>

        <div className="flex space-x-3">
          {currentStep < steps.length ? (
            <button
              onClick={handleNext}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Next Step
            </button>
          ) : (
            <div className="flex space-x-3">
              <button
                onClick={() => handleStepChange(1)}
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors"
              >
                Review All Steps
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Progress Summary */}
      <div className="mt-8 p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Progress</span>
          <span className="text-sm text-gray-600">
            {completedSteps.size} of {steps.length} steps completed
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${(completedSteps.size / steps.length) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
}
