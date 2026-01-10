'use client';

import { useState, useRef, ChangeEvent } from 'react';
import { useUserProfile } from '@/lib/user-profile';

export function ProfileManagement() {
  const { 
    profile, 
    updateProfile, 
    uploadAvatar, 
    isUpdating, 
    isUploadingAvatar, 
    avatarUploadProgress,
    formatDate 
  } = useUserProfile();

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    displayName: '',
    username: '',
    email: '',
    bio: '',
    location: '',
    website: '',
    twitter: '',
    discord: '',
    telegram: ''
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize form data when profile loads
  useState(() => {
    if (profile) {
      setFormData({
        displayName: profile.displayName || '',
        username: profile.username || '',
        email: profile.email || '',
        bio: profile.bio || '',
        location: profile.location || '',
        website: profile.website || '',
        twitter: profile.twitter || '',
        discord: profile.discord || '',
        telegram: profile.telegram || ''
      });
    }
  });

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = async () => {
    if (!profile) return;

    try {
      await updateProfile(formData);
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
    }
  };

  const handleCancel = () => {
    if (profile) {
      setFormData({
        displayName: profile.displayName || '',
        username: profile.username || '',
        email: profile.email || '',
        bio: profile.bio || '',
        location: profile.location || '',
        website: profile.website || '',
        twitter: profile.twitter || '',
        discord: profile.discord || '',
        telegram: profile.telegram || ''
      });
    }
    setIsEditing(false);
  };

  const handleAvatarUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      await uploadAvatar(file);
    } catch (error) {
      console.error('Error uploading avatar:', error);
    }
  };

  const getVerificationBadgeColor = (level: string) => {
    const colors: Record<string, string> = {
      'basic': '#3B82F6',
      'enhanced': '#8B5CF6',
      'premium': '#F59E0B'
    };
    return colors[level] || '#6B7280';
  };

  if (!profile) {
    return (
      <div className="p-6 text-center">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl">👤</span>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Profile Not Found</h3>
        <p className="text-gray-600">Unable to load profile information</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Profile Management</h2>
        <p className="text-gray-600">Manage your personal information and public profile</p>
      </div>

      {/* Profile Header */}
      <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg p-6 mb-6">
        <div className="flex items-start space-x-6">
          {/* Avatar Section */}
          <div className="relative">
            <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-200">
              <img 
                src={profile.avatar} 
                alt={profile.displayName}
                className="w-full h-full object-cover"
              />
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploadingAvatar}
              className="absolute bottom-0 right-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center hover:bg-blue-700 disabled:opacity-50"
            >
              {isUploadingAvatar ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                '📷'
              )}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarUpload}
              className="hidden"
            />
            {isUploadingAvatar && (
              <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
                <div className="text-white text-xs">{avatarUploadProgress}%</div>
              </div>
            )}
          </div>

          {/* Profile Info */}
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-2">
              <h3 className="text-2xl font-bold text-gray-900">{profile.displayName}</h3>
              <span 
                className="px-3 py-1 text-xs font-medium rounded-full text-white"
                style={{ backgroundColor: getVerificationBadgeColor(profile.verificationLevel) }}
              >
                {profile.verificationLevel.toUpperCase()}
              </span>
              {profile.isVerified && (
                <span className="text-blue-600 text-lg">✓</span>
              )}
            </div>
            <p className="text-gray-600 mb-2">@{profile.username}</p>
            <div className="flex items-center space-x-4 text-sm text-gray-500">
              <span>📍 {profile.location || 'Not specified'}</span>
              <span>📅 Joined {formatDate(profile.joinDate)}</span>
              <span>⭐ {profile.reputation} reputation</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-2">
            {!isEditing ? (
              <>
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Edit Profile
                </button>
                <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                  Share Profile
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={handleSave}
                  disabled={isUpdating}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                >
                  {isUpdating ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  onClick={handleCancel}
                  disabled={isUpdating}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
                >
                  Cancel
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Profile Form */}
      <div className="space-y-6">
        {/* Basic Information */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Display Name
              </label>
              <input
                type="text"
                name="displayName"
                value={formData.displayName}
                onChange={handleInputChange}
                disabled={!isEditing}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
                placeholder="Your display name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Username
              </label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                disabled={!isEditing}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
                placeholder="@username"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                disabled={!isEditing}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
                placeholder="your@email.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Location
              </label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                disabled={!isEditing}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
                placeholder="City, Country"
              />
            </div>
          </div>
        </div>

        {/* Bio */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Bio</h3>
          <textarea
            name="bio"
            value={formData.bio}
            onChange={handleInputChange}
            disabled={!isEditing}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
            placeholder="Tell us about yourself..."
            maxLength={500}
          />
          <div className="mt-2 text-sm text-gray-500">
            {formData.bio.length}/500 characters
          </div>
        </div>

        {/* Social Links */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Social Links</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Website
              </label>
              <input
                type="url"
                name="website"
                value={formData.website}
                onChange={handleInputChange}
                disabled={!isEditing}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
                placeholder="https://yourwebsite.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Twitter
              </label>
              <input
                type="text"
                name="twitter"
                value={formData.twitter}
                onChange={handleInputChange}
                disabled={!isEditing}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
                placeholder="@username"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Discord
              </label>
              <input
                type="text"
                name="discord"
                value={formData.discord}
                onChange={handleInputChange}
                disabled={!isEditing}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
                placeholder="username#1234"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Telegram
              </label>
              <input
                type="text"
                name="telegram"
                value={formData.telegram}
                onChange={handleInputChange}
                disabled={!isEditing}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
                placeholder="@username"
              />
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Profile Statistics</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-gray-900">{profile.reputation}</div>
              <div className="text-sm text-gray-600">Reputation Score</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-gray-900">{profile.totalTransactions.toLocaleString()}</div>
              <div className="text-sm text-gray-600">Total Transactions</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-gray-900">${profile.totalVolume.toLocaleString()}</div>
              <div className="text-sm text-gray-600">Total Volume</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-gray-900 capitalize">{profile.verificationLevel}</div>
              <div className="text-sm text-gray-600">Verification Level</div>
            </div>
          </div>
        </div>

        {/* Account Status */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Account Status</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-gray-700">Account Status</span>
              <span className={`px-3 py-1 text-sm font-medium rounded-full ${
                profile.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {profile.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-700">Verification Status</span>
              <span className={`px-3 py-1 text-sm font-medium rounded-full text-white`}
                style={{ backgroundColor: getVerificationBadgeColor(profile.verificationLevel) }}
              >
                {profile.verificationLevel.toUpperCase()}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-700">Member Since</span>
              <span className="text-gray-900">{formatDate(profile.joinDate)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-700">Last Updated</span>
              <span className="text-gray-900">{formatDate(profile.lastUpdated)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
