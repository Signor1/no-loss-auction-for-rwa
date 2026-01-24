'use client';

import React, { useState } from 'react';
// We should use a UI library if available, assuming standard HTML/Tailwind for now or checking for existing UI components
// The existing `UserDashboard.tsx` was using standard elements or imported components.
// I'll stick to basic Tailwind for now.

export const DocumentUpload = ({ onUploadComplete }: { onUploadComplete: () => void }) => {
    const [file, setFile] = useState<File | null>(null);
    const [type, setType] = useState('passport');
    const [category, setCategory] = useState('identity');
    const [country, setCountry] = useState('');
    const [docNumber, setDocNumber] = useState('');
    const [uploading, setUploading] = useState(false);
    const [message, setMessage] = useState('');

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setFile(e.target.files[0]);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file) return;

        setUploading(true);
        setMessage('');

        const formData = new FormData();
        formData.append('document', file);
        formData.append('type', type);
        formData.append('category', category);
        formData.append('metadata', JSON.stringify({
            country,
            issuingAuthority: country, // Simplified
            documentNumber: docNumber,
            issueDate: new Date(),
            expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 year expiry mock
        }));

        try {
            // Assuming a shared fetch wrapper or axios exists, but using fetch for basic implementation
            // Need to handle auth token, usually in a context or cookie. 
            // I'll assume standard fetch with credentials/headers handled elsewhere or I need to add token manually.
            // For now, I'll use a placeholder for the API URL
            const response = await fetch('/api/compliance/documents/upload', {
                method: 'POST',
                // headers can be injected by interceptor, or we add Authorization header if we have token in localStorage
                body: formData
            });

            if (response.ok) {
                setMessage('Document uploaded successfully!');
                setFile(null);
                setDocNumber('');
                onUploadComplete();
            } else {
                setMessage('Upload failed.');
            }
        } catch (error) {
            setMessage('An error occurred.');
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Upload KYC Document</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Document Type</label>
                    <select
                        value={type}
                        onChange={(e) => setType(e.target.value)}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    >
                        <option value="passport">Passport</option>
                        <option value="driving_license">Driving License</option>
                        <option value="national_id">National ID</option>
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Country</label>
                    <input
                        type="text"
                        value={country}
                        onChange={e => setCountry(e.target.value)}
                        required
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Document Number</label>
                    <input
                        type="text"
                        value={docNumber}
                        onChange={e => setDocNumber(e.target.value)}
                        required
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">File</label>
                    <input
                        type="file"
                        onChange={handleFileChange}
                        accept="image/*,application/pdf"
                        required
                        className="mt-1 block w-full text-sm text-gray-500
              file:mr-4 file:py-2 file:px-4
              file:rounded-full file:border-0
              file:text-sm file:font-semibold
              file:bg-indigo-50 file:text-indigo-700
              hover:file:bg-indigo-100"
                    />
                </div>

                <button
                    type="submit"
                    disabled={uploading}
                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                >
                    {uploading ? 'Uploading...' : 'Upload Document'}
                </button>

                {message && (
                    <p className={`mt-2 text-sm ${message.includes('failed') ? 'text-red-600' : 'text-green-600'}`}>
                        {message}
                    </p>
                )}
            </form>
        </div>
    );
};
