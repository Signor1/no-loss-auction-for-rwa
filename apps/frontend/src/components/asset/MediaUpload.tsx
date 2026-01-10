'use client';

import { useState, useRef } from 'react';
import { AssetFormState, AssetImage, AssetDocument, DocumentType, DOCUMENT_TYPES } from '@/lib/asset-management';

interface MediaUploadProps {
  formState: AssetFormState;
  updateFormState: (updates: Partial<AssetFormState>) => void;
  validationErrors: Record<string, string[]>;
}

export function MediaUpload({ formState, updateFormState, validationErrors }: MediaUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const documentInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = async (files: FileList) => {
    setIsUploading(true);
    setUploadProgress(0);

    const newImages: AssetImage[] = [];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert(`File ${file.name} is not an image`);
        continue;
      }

      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        alert(`File ${file.name} is too large (max 10MB)`);
        continue;
      }

      try {
        // Simulate IPFS upload
        setUploadProgress((i / files.length) * 100);
        
        // Create preview URL
        const previewUrl = URL.createObjectURL(file);
        
        const newImage: AssetImage = {
          id: `img_${Date.now()}_${i}`,
          url: previewUrl,
          ipfsHash: `QmHash${Date.now()}${i}`, // Simulated IPFS hash
          filename: file.name,
          mimeType: file.type,
          size: file.size,
          isPrimary: formState.images.length === 0 && i === 0, // First image is primary by default
          uploadedAt: Date.now()
        };

        newImages.push(newImage);
        
        // Simulate upload delay
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        console.error('Error uploading image:', error);
        alert(`Failed to upload ${file.name}`);
      }
    }

    // Update form state with new images
    const updatedImages = [...formState.images, ...newImages];
    updateFormState({ images: updatedImages });
    
    setIsUploading(false);
    setUploadProgress(100);
    
    // Reset file input
    if (imageInputRef.current) {
      imageInputRef.current.value = '';
    }
  };

  const handleDocumentUpload = async (files: FileList) => {
    setIsUploading(true);
    setUploadProgress(0);

    const newDocuments: AssetDocument[] = [];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      // Validate file type
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      if (!allowedTypes.includes(file.type)) {
        alert(`File ${file.name} is not a supported document type`);
        continue;
      }

      // Validate file size (max 20MB)
      if (file.size > 20 * 1024 * 1024) {
        alert(`File ${file.name} is too large (max 20MB)`);
        continue;
      }

      try {
        // Simulate IPFS upload
        setUploadProgress((i / files.length) * 100);
        
        const newDocument: AssetDocument = {
          id: `doc_${Date.now()}_${i}`,
          ipfsHash: `QmDocHash${Date.now()}${i}`, // Simulated IPFS hash
          filename: file.name,
          mimeType: file.type,
          size: file.size,
          documentType: 'other' as DocumentType, // Default, user can change
          description: '',
          uploadedAt: Date.now()
        };

        newDocuments.push(newDocument);
        
        // Simulate upload delay
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        console.error('Error uploading document:', error);
        alert(`Failed to upload ${file.name}`);
      }
    }

    // Update form state with new documents
    const updatedDocuments = [...formState.documents, ...newDocuments];
    updateFormState({ documents: updatedDocuments });
    
    setIsUploading(false);
    setUploadProgress(100);
    
    // Reset file input
    if (documentInputRef.current) {
      documentInputRef.current.value = '';
    }
  };

  const removeImage = (imageId: string) => {
    const updatedImages = formState.images.filter(img => img.id !== imageId);
    
    // If removing primary image, set first remaining image as primary
    if (formState.images.find(img => img.id === imageId)?.isPrimary && updatedImages.length > 0) {
      updatedImages[0].isPrimary = true;
    }
    
    updateFormState({ images: updatedImages });
  };

  const setPrimaryImage = (imageId: string) => {
    const updatedImages = formState.images.map(img => ({
      ...img,
      isPrimary: img.id === imageId
    }));
    updateFormState({ images: updatedImages });
  };

  const removeDocument = (documentId: string) => {
    const updatedDocuments = formState.documents.filter(doc => doc.id !== documentId);
    updateFormState({ documents: updatedDocuments });
  };

  const updateDocumentType = (documentId: string, documentType: DocumentType) => {
    const updatedDocuments = formState.documents.map(doc =>
      doc.id === documentId ? { ...doc, documentType } : doc
    );
    updateFormState({ documents: updatedDocuments });
  };

  const updateDocumentDescription = (documentId: string, description: string) => {
    const updatedDocuments = formState.documents.map(doc =>
      doc.id === documentId ? { ...doc, description } : doc
    );
    updateFormState({ documents: updatedDocuments });
  };

  return (
    <div className="space-y-6">
      {/* Image Upload */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Asset Images</h3>
        
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
          <input
            ref={imageInputRef}
            type="file"
            multiple
            accept="image/*"
            onChange={(e) => e.target.files && handleImageUpload(e.target.files)}
            className="hidden"
            id="image-upload"
          />
          <label htmlFor="image-upload" className="cursor-pointer">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="mt-2 text-sm text-gray-600">
              Click to upload images or drag and drop
            </p>
            <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB each</p>
          </label>
        </div>

        {isUploading && (
          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Uploading...</span>
              <span className="text-sm text-gray-600">{Math.round(uploadProgress)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Image Gallery */}
        {formState.images.length > 0 && (
          <div className="mt-6">
            <h4 className="text-sm font-medium text-gray-700 mb-3">Uploaded Images ({formState.images.length})</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {formState.images.map((image) => (
                <div key={image.id} className="relative group">
                  <div className="aspect-square rounded-lg overflow-hidden bg-gray-100">
                    <img
                      src={image.url}
                      alt={image.filename}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  {image.isPrimary && (
                    <div className="absolute top-2 left-2 bg-blue-600 text-white text-xs px-2 py-1 rounded">
                      Primary
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center space-x-2">
                    {!image.isPrimary && (
                      <button
                        onClick={() => setPrimaryImage(image.id)}
                        className="p-2 bg-white rounded-lg text-gray-700 hover:bg-gray-100"
                        title="Set as primary"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </button>
                    )}
                    <button
                      onClick={() => removeImage(image.id)}
                      className="p-2 bg-white rounded-lg text-red-600 hover:bg-red-50"
                      title="Remove image"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                  <p className="mt-1 text-xs text-gray-600 truncate">{image.filename}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {validationErrors.images && (
          <p className="mt-2 text-sm text-red-600">{validationErrors.images[0]}</p>
        )}
      </div>

      {/* Document Upload */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Supporting Documents</h3>
        
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
          <input
            ref={documentInputRef}
            type="file"
            multiple
            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
            onChange={(e) => e.target.files && handleDocumentUpload(e.target.files)}
            className="hidden"
            id="document-upload"
          />
          <label htmlFor="document-upload" className="cursor-pointer">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="mt-2 text-sm text-gray-600">
              Click to upload documents or drag and drop
            </p>
            <p className="text-xs text-gray-500">PDF, DOC, DOCX, JPG, PNG up to 20MB each</p>
          </label>
        </div>

        {/* Document List */}
        {formState.documents.length > 0 && (
          <div className="mt-6">
            <h4 className="text-sm font-medium text-gray-700 mb-3">Uploaded Documents ({formState.documents.length})</h4>
            <div className="space-y-3">
              {formState.documents.map((document) => (
                <div key={document.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3 flex-1">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{document.filename}</p>
                      <div className="flex items-center space-x-2 mt-1">
                        <select
                          value={document.documentType}
                          onChange={(e) => updateDocumentType(document.id, e.target.value as DocumentType)}
                          className="text-xs px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          {DOCUMENT_TYPES.map((type) => (
                            <option key={type.value} value={type.value}>
                              {type.label}
                            </option>
                          ))}
                        </select>
                        <input
                          type="text"
                          value={document.description}
                          onChange={(e) => updateDocumentDescription(document.id, e.target.value)}
                          placeholder="Add description..."
                          className="text-xs px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent flex-1"
                        />
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => removeDocument(document.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Remove document"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {validationErrors.documents && (
          <p className="mt-2 text-sm text-red-600">{validationErrors.documents[0]}</p>
        )}
      </div>

      {/* Guidelines */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="text-sm font-medium text-blue-900 mb-2">Upload Guidelines</h4>
        <div className="text-sm text-blue-800 space-y-2">
          <div>
            <strong>Images:</strong>
            <ul className="ml-4 mt-1 space-y-1">
              <li>• Upload high-quality images from multiple angles</li>
              <li>• Include close-ups of important details</li>
              <li>• Ensure good lighting and clear focus</li>
              <li>• First image will be set as primary by default</li>
            </ul>
          </div>
          <div>
            <strong>Documents:</strong>
            <ul className="ml-4 mt-1 space-y-1">
              <li>• Include certificates of authenticity</li>
              <li>• Add appraisal reports and valuations</li>
              <li>• Provide ownership documentation</li>
              <li>• Include any relevant legal paperwork</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
