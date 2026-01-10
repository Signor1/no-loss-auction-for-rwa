'use client';

import { useState, useRef } from 'react';
import { useKYCVerification, DocumentType } from '@/lib/kyc-verification';

export function IdentityVerification() {
  const {
    verification,
    isLoading,
    isUploading,
    uploadProgress,
    uploadDocument,
    submitVerification
  } = useKYCVerification();

  const [activeStep, setActiveStep] = useState(0);
  const [selectedDocumentType, setSelectedDocumentType] = useState<DocumentType>('passport');
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const documentTypes: { type: DocumentType; label: string; description: string; icon: string }[] = [
    { type: 'passport', label: 'Passport', description: 'Valid passport document', icon: '📋' },
    { type: 'drivers_license', label: 'Driver\'s License', description: 'Government-issued driver\'s license', icon: '🚗' },
    { type: 'national_id', label: 'National ID', description: 'National identification card', icon: '🆔' },
    { type: 'government_id', label: 'Government ID', description: 'Other government-issued ID', icon: '🏛️' }
  ];

  const proofOfAddressTypes: { type: DocumentType; label: string; description: string; icon: string }[] = [
    { type: 'utility_bill', label: 'Utility Bill', description: 'Recent utility bill (last 3 months)', icon: '💡' },
    { type: 'bank_statement', label: 'Bank Statement', description: 'Recent bank statement (last 3 months)', icon: '🏦' },
    { type: 'proof_of_address', label: 'Proof of Address', description: 'Official proof of residence', icon: '📍' }
  ];

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'not_started': '#6B7280',
      'in_progress': '#3B82F6',
      'completed': '#10B981',
      'failed': '#EF4444',
      'pending': '#F59E0B',
      'in_review': '#8B5CF6',
      'approved': '#10B981',
      'rejected': '#EF4444',
      'expired': '#6B7280'
    };
    return colors[status] || '#6B7280';
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      'not_started': 'Not Started',
      'in_progress': 'In Progress',
      'completed': 'Completed',
      'failed': 'Failed',
      'pending': 'Pending',
      'in_review': 'In Review',
      'approved': 'Approved',
      'rejected': 'Rejected',
      'expired': 'Expired'
    };
    return labels[status] || status;
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files[0]);
    }
  };

  const handleFileUpload = async (file: File) => {
    try {
      await uploadDocument(file, selectedDocumentType);
    } catch (error) {
      console.error('Error uploading file:', error);
    }
  };

  const handleSelfieUpload = async (file: File) => {
    try {
      await uploadDocument(file, 'selfie');
    } catch (error) {
      console.error('Error uploading selfie:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading verification status...</p>
        </div>
      </div>
    );
  }

  if (!verification) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">🔍</span>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Verification Not Available</h3>
          <p className="text-gray-600">Unable to load verification information</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Identity Verification</h1>
              <p className="text-gray-600">Complete your KYC verification to unlock full platform features</p>
            </div>
            <div className="flex items-center space-x-2">
              <div className="px-3 py-1 rounded-full text-sm font-medium" style={{ 
                backgroundColor: getStatusColor(verification.status) + '20',
                color: getStatusColor(verification.status)
              }}>
                {getStatusLabel(verification.status)}
              </div>
              <div className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium">
                {verification.complianceLevel.toUpperCase()}
              </div>
            </div>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-8">
            {verification.verificationSteps.map((step, index) => (
              <div key={step.id} className="flex items-center flex-1">
                <div className="flex items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium ${
                    step.status === 'completed' ? 'bg-green-100 text-green-800' :
                    step.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                    step.status === 'failed' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    {step.status === 'completed' ? '✓' : index + 1}
                  </div>
                  <div className="ml-3">
                    <div className="text-sm font-medium text-gray-900">{step.name}</div>
                    <div className="text-xs text-gray-600">{step.description}</div>
                  </div>
                </div>
                {index < verification.verificationSteps.length - 1 && (
                  <div className="flex-1 h-px bg-gray-300 mx-4"></div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          {activeStep === 0 && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-6">Personal Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
                  <input
                    type="text"
                    defaultValue={verification.personalInfo.firstName}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
                  <input
                    type="text"
                    defaultValue={verification.personalInfo.lastName}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Date of Birth</label>
                  <input
                    type="date"
                    defaultValue={verification.personalInfo.dateOfBirth}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nationality</label>
                  <select
                    defaultValue={verification.personalInfo.nationality}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="US">United States</option>
                    <option value="UK">United Kingdom</option>
                    <option value="CA">Canada</option>
                    <option value="AU">Australia</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Occupation</label>
                  <input
                    type="text"
                    defaultValue={verification.personalInfo.occupation}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Source of Funds</label>
                  <select
                    defaultValue={verification.personalInfo.sourceOfFunds}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="employment">Employment</option>
                    <option value="business">Business</option>
                    <option value="investments">Investments</option>
                    <option value="inheritance">Inheritance</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {activeStep === 1 && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-6">Identity Verification</h3>
              
              {/* Document Type Selection */}
              <div className="mb-6">
                <h4 className="text-md font-medium text-gray-900 mb-4">Select Document Type</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {documentTypes.map((docType) => (
                    <button
                      key={docType.type}
                      onClick={() => setSelectedDocumentType(docType.type)}
                      className={`p-4 border rounded-lg text-left transition-colors ${
                        selectedDocumentType === docType.type
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <span className="text-2xl">{docType.icon}</span>
                        <div>
                          <div className="font-medium text-gray-900">{docType.label}</div>
                          <div className="text-sm text-gray-600">{docType.description}</div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* File Upload */}
              <div>
                <h4 className="text-md font-medium text-gray-900 mb-4">Upload Document</h4>
                <div
                  className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                    dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
                  }`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                >
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl">📄</span>
                  </div>
                  <p className="text-gray-900 mb-2">Drag and drop your document here</p>
                  <p className="text-gray-600 text-sm mb-4">or</p>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Browse Files
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,.pdf"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <p className="text-gray-500 text-xs mt-4">
                    Supported formats: JPG, PNG, PDF (Max 10MB)
                  </p>
                </div>

                {isUploading && (
                  <div className="mt-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-600">Uploading...</span>
                      <span className="text-sm text-gray-600">{uploadProgress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      ></div>
                    </div>
                  </div>
                )}
              </div>

              {/* Uploaded Documents */}
              {verification.documents.filter(doc => ['passport', 'drivers_license', 'national_id', 'government_id'].includes(doc.type)).length > 0 && (
                <div className="mt-6">
                  <h4 className="text-md font-medium text-gray-900 mb-4">Uploaded Documents</h4>
                  <div className="space-y-3">
                    {verification.documents
                      .filter(doc => ['passport', 'drivers_license', 'national_id', 'government_id'].includes(doc.type))
                      .map((doc) => (
                        <div key={doc.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center">
                              <span className="text-lg">📄</span>
                            </div>
                            <div>
                              <div className="font-medium text-gray-900">{doc.name}</div>
                              <div className="text-sm text-gray-600">
                                {(doc.fileSize / 1024 / 1024).toFixed(2)} MB • {new Date(doc.uploadedAt).toLocaleDateString()}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                              doc.status === 'verified' ? 'bg-green-100 text-green-800' :
                              doc.status === 'rejected' ? 'bg-red-100 text-red-800' :
                              'bg-yellow-100 text-yellow-800'
                            }`}>
                              {doc.status.charAt(0).toUpperCase() + doc.status.slice(1)}
                            </span>
                            <button className="text-blue-600 hover:text-blue-800 text-sm">
                              View
                            </button>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeStep === 2 && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-6">Address Verification</h3>
              
              {/* Address Form */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Street Address</label>
                  <input
                    type="text"
                    defaultValue={verification.addressInfo.street}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
                  <input
                    type="text"
                    defaultValue={verification.addressInfo.city}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">State/Province</label>
                  <input
                    type="text"
                    defaultValue={verification.addressInfo.state}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Postal Code</label>
                  <input
                    type="text"
                    defaultValue={verification.addressInfo.postalCode}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Country</label>
                  <select
                    defaultValue={verification.addressInfo.country}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="US">United States</option>
                    <option value="UK">United Kingdom</option>
                    <option value="CA">Canada</option>
                    <option value="AU">Australia</option>
                  </select>
                </div>
              </div>

              {/* Proof of Address Upload */}
              <div>
                <h4 className="text-md font-medium text-gray-900 mb-4">Proof of Address</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {proofOfAddressTypes.map((docType) => (
                    <button
                      key={docType.type}
                      onClick={() => setSelectedDocumentType(docType.type)}
                      className={`p-4 border rounded-lg text-left transition-colors ${
                        selectedDocumentType === docType.type
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <span className="text-2xl">{docType.icon}</span>
                        <div>
                          <div className="font-medium text-gray-900">{docType.label}</div>
                          <div className="text-sm text-gray-600">{docType.description}</div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>

                <div className="mt-4">
                  <div
                    className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                      dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
                    }`}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                  >
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="text-2xl">📄</span>
                    </div>
                    <p className="text-gray-900 mb-2">Drag and drop your document here</p>
                    <p className="text-gray-600 text-sm mb-4">or</p>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Browse Files
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*,.pdf"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                    <p className="text-gray-500 text-xs mt-4">
                      Supported formats: JPG, PNG, PDF (Max 10MB)
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeStep === 3 && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-6">Selfie Verification</h3>
              
              <div className="text-center mb-8">
                <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-4xl">📸</span>
                </div>
                <h4 className="text-lg font-medium text-gray-900 mb-2">Take a Selfie</h4>
                <p className="text-gray-600 mb-4">
                  We need to verify your identity with a selfie. Make sure you're in a well-lit area and your face is clearly visible.
                </p>
              </div>

              <div className="max-w-md mx-auto">
                <div
                  className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                    dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
                  }`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                >
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl">📸</span>
                  </div>
                  <p className="text-gray-900 mb-2">Upload your selfie</p>
                  <p className="text-gray-600 text-sm mb-4">or</p>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Take Photo
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    capture="user"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleSelfieUpload(e.target.files[0]);
                      }
                    }}
                    className="hidden"
                  />
                  <p className="text-gray-500 text-xs mt-4">
                    Supported formats: JPG, PNG (Max 5MB)
                  </p>
                </div>

                <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                  <h5 className="font-medium text-blue-900 mb-2">Tips for a good selfie:</h5>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Face the camera directly</li>
                    <li>• Ensure good lighting</li>
                    <li>• Remove sunglasses and hats</li>
                    <li>• Keep a neutral expression</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between mt-8">
            <button
              onClick={() => setActiveStep(Math.max(0, activeStep - 1))}
              disabled={activeStep === 0}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            
            {activeStep < verification.verificationSteps.length - 1 ? (
              <button
                onClick={() => setActiveStep(Math.min(verification.verificationSteps.length - 1, activeStep + 1))}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Next
              </button>
            ) : (
              <button
                onClick={submitVerification}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Submit Verification
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
