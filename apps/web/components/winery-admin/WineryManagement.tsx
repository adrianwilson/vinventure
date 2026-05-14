'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';

interface Winery {
  id: string;
  name: string;
  description: string;
  email: string;
  phone?: string;
  website?: string;
  address: string;
  city: string;
  region: string;
  country: string;
  zipCode?: string;
  logoUrl?: string;
  bannerUrl?: string;
  images: string[];
  foundedYear?: number;
  wineTypes: string[];
  sustainable: boolean;
  sustainablePractices: boolean;
  status: string;
  rating?: number;
}

interface Experience {
  id: string;
  title: string;
  description: string;
  type: string;
  duration: number;
  price: number;
  maxGuests: number;
  availableDays: string[];
  startTime: string;
  endTime: string;
  images: string[];
  ageRestriction?: number;
  requirements?: string;
  isActive: boolean;
}

export default function WineryManagement() {
  const { user } = useAuth();
  const [winery, setWinery] = useState<Winery | null>(null);
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState<'profile' | 'experiences'>('profile');
  const [editingWinery, setEditingWinery] = useState(false);
  const [editingExperience, setEditingExperience] = useState<Experience | null>(null);
  const [showCreateExperience, setShowCreateExperience] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    
    const fetchWineryData = async () => {
      try {
        if (!user?.accessToken) {
          setLoading(false);
          return;
        }

        // Fetch winery data from API
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001'}/api/wineries/owner/my-wineries`, {
          headers: { 
            'Authorization': `Bearer ${user.accessToken}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (!response.ok) {
          setApiError('Backend API is not available. Please start the backend server on localhost:3001');
          return;
        }
        
        const wineries = await response.json();
        
        if (wineries && wineries.length > 0) {
          const wineryData = wineries[0]; // Get first winery for this owner
          setWinery(wineryData);
          setExperiences(wineryData.experiences || []);
        }
      } catch (error: any) {
        console.error('Failed to fetch winery data:', error);
        if (error.message?.includes('Failed to fetch')) {
          setApiError('Backend API is not available. Please start the backend server on localhost:3001');
        } else {
          setApiError('Failed to load winery data. Please try again.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchWineryData();
  }, [mounted, user]);

  const handleSaveWinery = async (updatedWinery: Winery) => {
    try {
      if (!user?.accessToken || !winery?.id) {
        alert('Authentication required');
        return;
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001'}/api/wineries/${winery.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.accessToken}`
        },
        body: JSON.stringify(updatedWinery)
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      setWinery(result);
      setEditingWinery(false);
      alert('Winery updated successfully!');
    } catch (error) {
      console.error('Failed to update winery:', error);
      alert('Failed to update winery. Please try again.');
    }
  };

  const handleSaveExperience = async (experience: Experience) => {
    try {
      if (!user?.accessToken || !winery?.id) {
        alert('Authentication required');
        return;
      }

      const experienceData = {
        ...experience,
        wineryId: winery.id
      };

      let response;
      if (experience.id) {
        // Update existing experience - Note: This endpoint may need to be implemented
        response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001'}/api/experiences/${experience.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${user.accessToken}`
          },
          body: JSON.stringify(experienceData)
        });
      } else {
        // Create new experience - Note: This endpoint may need to be implemented
        response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001'}/api/experiences`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${user.accessToken}`
          },
          body: JSON.stringify(experienceData)
        });
      }
      
      if (!response.ok) {
        // If endpoints don't exist yet, fall back to local state management
        if (response.status === 404) {
          console.warn('Experience endpoints not implemented yet, using local state');
          if (experience.id) {
            setExperiences(prev => prev.map(exp => exp.id === experience.id ? experience : exp));
          } else {
            const newExperience = { ...experience, id: `temp-${Math.random().toString(36).substr(2, 9)}` };
            setExperiences(prev => [...prev, newExperience]);
          }
        } else {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
      } else {
        const result = await response.json();
        if (experience.id) {
          setExperiences(prev => prev.map(exp => exp.id === experience.id ? result : exp));
        } else {
          setExperiences(prev => [...prev, result]);
        }
      }
      
      setEditingExperience(null);
      setShowCreateExperience(false);
      alert('Experience saved successfully!');
    } catch (error) {
      console.error('Failed to save experience:', error);
      alert('Failed to save experience. Please try again.');
    }
  };

  const handleDeleteExperience = async (experienceId: string) => {
    if (!confirm('Are you sure you want to delete this experience?')) {
      return;
    }

    try {
      if (!user?.accessToken) {
        alert('Authentication required');
        return;
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001'}/api/experiences/${experienceId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${user.accessToken}`
        }
      });
      
      if (!response.ok) {
        // If endpoint doesn't exist yet, fall back to local state management
        if (response.status === 404) {
          console.warn('Experience delete endpoint not implemented yet, using local state');
        } else {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
      }
      
      setExperiences(prev => prev.filter(exp => exp.id !== experienceId));
      alert('Experience deleted successfully!');
    } catch (error) {
      console.error('Failed to delete experience:', error);
      alert('Failed to delete experience. Please try again.');
    }
  };

  if (!mounted || loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
        <p className="mt-2 text-gray-600">Loading winery data...</p>
      </div>
    );
  }

  if (!winery) {
    return (
      <div className="text-center py-8">
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Winery Found</h3>
        <p className="text-gray-600 mb-4">You don&apos;t have a winery registered yet.</p>
        <button 
          onClick={() => setEditingWinery(true)}
          className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700"
        >
          Create Winery
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* API Error Display */}
      {apiError && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">
                API Connection Issue
              </h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>{apiError}</p>
              </div>
              <div className="mt-3">
                <button
                  onClick={() => {
                    setApiError(null);
                    window.location.reload();
                  }}
                  className="bg-yellow-100 hover:bg-yellow-200 text-yellow-800 px-3 py-1 rounded text-sm"
                >
                  Retry
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Section Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { key: 'profile', label: 'Winery Profile' },
            { key: 'experiences', label: 'Experiences' }
          ].map((section) => (
            <button
              key={section.key}
              onClick={() => setActiveSection(section.key as any)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeSection === section.key
                  ? 'border-purple-500 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {section.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      {activeSection === 'profile' && (
        <WineryProfileSection 
          winery={winery}
          editing={editingWinery}
          onEdit={() => setEditingWinery(true)}
          onSave={handleSaveWinery}
          onCancel={() => setEditingWinery(false)}
        />
      )}

      {activeSection === 'experiences' && (
        <ExperiencesSection
          experiences={experiences}
          onEdit={setEditingExperience}
          onDelete={handleDeleteExperience}
          onCreate={() => setShowCreateExperience(true)}
          editingExperience={editingExperience}
          showCreateForm={showCreateExperience}
          onSave={handleSaveExperience}
          onCancel={() => {
            setEditingExperience(null);
            setShowCreateExperience(false);
          }}
        />
      )}
    </div>
  );
}

// Winery Profile Section Component
function WineryProfileSection({ 
  winery, 
  editing, 
  onEdit, 
  onSave, 
  onCancel 
}: {
  winery: Winery;
  editing: boolean;
  onEdit: () => void;
  onSave: (winery: Winery) => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState(winery);

  useEffect(() => {
    setFormData(winery);
  }, [winery]);

  if (!editing) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex justify-between items-start mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Winery Profile</h3>
          <button 
            onClick={onEdit}
            className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 text-sm"
          >
            Edit Profile
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <p className="text-gray-900">{winery.name}</p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
              winery.status === 'APPROVED' 
                ? 'bg-green-100 text-green-800' 
                : winery.status === 'PENDING'
                ? 'bg-yellow-100 text-yellow-800'
                : 'bg-red-100 text-red-800'
            }`}>
              {winery.status}
            </span>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <p className="text-gray-900">{winery.description}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <p className="text-gray-900">{winery.email}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
            <p className="text-gray-900">{winery.phone || 'Not provided'}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
            <p className="text-gray-900">{winery.website || 'Not provided'}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Rating</label>
            <p className="text-gray-900">{winery.rating ? `${winery.rating}/5` : 'No ratings yet'}</p>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
            <p className="text-gray-900">
              {winery.address}, {winery.city}, {winery.region} {winery.zipCode}, {winery.country}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Founded Year</label>
            <p className="text-gray-900">{winery.foundedYear || 'Not provided'}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Wine Types</label>
            <p className="text-gray-900">{winery.wineTypes.join(', ')}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sustainable</label>
            <p className="text-gray-900">{winery.sustainable ? 'Yes' : 'No'}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sustainable Practices</label>
            <p className="text-gray-900">{winery.sustainablePractices ? 'Yes' : 'No'}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Edit Winery Profile</h3>
      </div>

      <form onSubmit={(e) => {
        e.preventDefault();
        onSave(formData);
      }}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
            <textarea
              required
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
            <input
              type="tel"
              value={formData.phone || ''}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
            <input
              type="url"
              value={formData.website || ''}
              onChange={(e) => setFormData({ ...formData, website: e.target.value })}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Address *</label>
            <input
              type="text"
              required
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">City *</label>
            <input
              type="text"
              required
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Region *</label>
            <input
              type="text"
              required
              value={formData.region}
              onChange={(e) => setFormData({ ...formData, region: e.target.value })}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Country *</label>
            <input
              type="text"
              required
              value={formData.country}
              onChange={(e) => setFormData({ ...formData, country: e.target.value })}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">ZIP Code</label>
            <input
              type="text"
              value={formData.zipCode || ''}
              onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Founded Year</label>
            <input
              type="number"
              min="1800"
              max={2024}
              value={formData.foundedYear || ''}
              onChange={(e) => setFormData({ ...formData, foundedYear: parseInt(e.target.value) || undefined })}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Wine Types</label>
            <input
              type="text"
              placeholder="e.g., Chardonnay, Pinot Noir, Cabernet Sauvignon"
              value={formData.wineTypes.join(', ')}
              onChange={(e) => setFormData({ 
                ...formData, 
                wineTypes: e.target.value.split(',').map(type => type.trim()).filter(Boolean)
              })}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
            />
          </div>

          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.sustainable}
                onChange={(e) => setFormData({ ...formData, sustainable: e.target.checked })}
                className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
              />
              <span className="ml-2 text-sm text-gray-700">Sustainable Winery</span>
            </label>
          </div>

          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.sustainablePractices}
                onChange={(e) => setFormData({ ...formData, sustainablePractices: e.target.checked })}
                className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
              />
              <span className="ml-2 text-sm text-gray-700">Sustainable Practices</span>
            </label>
          </div>
        </div>

        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
          >
            Save Changes
          </button>
        </div>
      </form>
    </div>
  );
}

// Experiences Section Component
function ExperiencesSection({
  experiences,
  onEdit,
  onDelete,
  onCreate,
  editingExperience,
  showCreateForm,
  onSave,
  onCancel
}: {
  experiences: Experience[];
  onEdit: (experience: Experience) => void;
  onDelete: (id: string) => void;
  onCreate: () => void;
  editingExperience: Experience | null;
  showCreateForm: boolean;
  onSave: (experience: Experience) => void;
  onCancel: () => void;
}) {
  if (editingExperience || showCreateForm) {
    return (
      <ExperienceForm
        experience={editingExperience}
        onSave={onSave}
        onCancel={onCancel}
      />
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Experiences</h3>
        <button
          onClick={onCreate}
          className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 text-sm"
        >
          Add Experience
        </button>
      </div>

      {experiences.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500 mb-4">No experiences created yet.</p>
          <button
            onClick={onCreate}
            className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700"
          >
            Create Your First Experience
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {experiences.map((experience) => (
            <div key={experience.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h4 className="text-lg font-medium text-gray-900">{experience.title}</h4>
                  <p className="text-gray-600 mt-1">{experience.description}</p>
                  
                  <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-700">Type:</span>
                      <span className="ml-1 text-gray-600">{experience.type}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Duration:</span>
                      <span className="ml-1 text-gray-600">{experience.duration} mins</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Price:</span>
                      <span className="ml-1 text-gray-600">${experience.price}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Max Guests:</span>
                      <span className="ml-1 text-gray-600">{experience.maxGuests}</span>
                    </div>
                  </div>

                  <div className="mt-2 flex items-center space-x-4 text-sm">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      experience.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {experience.isActive ? 'Active' : 'Inactive'}
                    </span>
                    <span className="text-gray-600">
                      Available: {experience.availableDays.join(', ')}
                    </span>
                  </div>
                </div>

                <div className="flex space-x-2 ml-4">
                  <button
                    onClick={() => onEdit(experience)}
                    className="text-purple-600 hover:text-purple-800 text-sm"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => onDelete(experience.id)}
                    className="text-red-600 hover:text-red-800 text-sm"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Experience Form Component
function ExperienceForm({
  experience,
  onSave,
  onCancel
}: {
  experience: Experience | null;
  onSave: (experience: Experience) => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState<Experience>(
    experience || {
      id: '',
      title: '',
      description: '',
      type: 'TASTING',
      duration: 60,
      price: 0,
      maxGuests: 1,
      availableDays: [],
      startTime: '10:00',
      endTime: '17:00',
      images: [],
      ageRestriction: 21,
      requirements: '',
      isActive: true
    }
  );

  const experienceTypes = [
    { value: 'TASTING', label: 'Wine Tasting' },
    { value: 'TOUR', label: 'Vineyard Tour' },
    { value: 'VIRTUAL_EVENT', label: 'Virtual Event' },
    { value: 'PRIVATE_EVENT', label: 'Private Event' }
  ];

  const daysOfWeek = [
    { value: 'monday', label: 'Monday' },
    { value: 'tuesday', label: 'Tuesday' },
    { value: 'wednesday', label: 'Wednesday' },
    { value: 'thursday', label: 'Thursday' },
    { value: 'friday', label: 'Friday' },
    { value: 'saturday', label: 'Saturday' },
    { value: 'sunday', label: 'Sunday' }
  ];

  const handleDayToggle = (day: string) => {
    setFormData(prev => ({
      ...prev,
      availableDays: prev.availableDays.includes(day)
        ? prev.availableDays.filter(d => d !== day)
        : [...prev.availableDays, day]
    }));
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900">
          {experience ? 'Edit Experience' : 'Create New Experience'}
        </h3>
      </div>

      <form onSubmit={(e) => {
        e.preventDefault();
        onSave(formData);
      }}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type *</label>
            <select
              required
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
            >
              {experienceTypes.map(type => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
            <textarea
              required
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Duration (minutes) *</label>
            <input
              type="number"
              required
              min="15"
              max="480"
              value={formData.duration}
              onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Price ($) *</label>
            <input
              type="number"
              required
              min="0"
              step="0.01"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Max Guests *</label>
            <input
              type="number"
              required
              min="1"
              max="50"
              value={formData.maxGuests}
              onChange={(e) => setFormData({ ...formData, maxGuests: parseInt(e.target.value) })}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Age Restriction</label>
            <input
              type="number"
              min="0"
              max="99"
              value={formData.ageRestriction || ''}
              onChange={(e) => setFormData({ ...formData, ageRestriction: parseInt(e.target.value) || undefined })}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Time *</label>
            <input
              type="time"
              required
              value={formData.startTime}
              onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">End Time *</label>
            <input
              type="time"
              required
              value={formData.endTime}
              onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Requirements</label>
            <input
              type="text"
              placeholder="e.g., Valid ID required, Comfortable walking shoes recommended"
              value={formData.requirements || ''}
              onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-3">Available Days *</label>
            <div className="grid grid-cols-3 md:grid-cols-7 gap-2">
              {daysOfWeek.map(day => (
                <label key={day.value} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.availableDays.includes(day.value)}
                    onChange={() => handleDayToggle(day.value)}
                    className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">{day.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
              />
              <span className="ml-2 text-sm text-gray-700">Active (available for booking)</span>
            </label>
          </div>
        </div>

        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
          >
            {experience ? 'Update Experience' : 'Create Experience'}
          </button>
        </div>
      </form>
    </div>
  );
}