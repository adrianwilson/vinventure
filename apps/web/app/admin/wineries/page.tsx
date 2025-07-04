'use client';

import { useState, useEffect } from 'react';
import { Winery, WineryStatus, ExperienceType, WINE_TYPES, EXPERIENCE_TYPE_LABELS } from '@vinventure/types/types/winery';

interface WineryFormData {
  name: string;
  description: string;
  email: string;
  phone: string;
  website: string;
  address: string;
  city: string;
  region: string;
  country: string;
  zipCode: string;
  wineTypes: string[];
  sustainable: boolean;
  featured: boolean;
  foundedYear: string;
  status: WineryStatus;
}

interface ExperienceFormData {
  title: string;
  description: string;
  type: ExperienceType;
  duration: string;
  price: string;
  maxGuests: string;
  availableDays: string[];
  startTime: string;
  endTime: string;
  ageRestriction: string;
  requirements: string;
  isActive: boolean;
}

const DAYS_OF_WEEK = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

export default function AdminWineriesPage() {
  const [activeTab, setActiveTab] = useState<'list' | 'create' | 'edit'>('list');
  const [wineries, setWineries] = useState<Winery[]>([]);
  const [selectedWinery, setSelectedWinery] = useState<Winery | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const [wineryForm, setWineryForm] = useState<WineryFormData>({
    name: '',
    description: '',
    email: '',
    phone: '',
    website: '',
    address: '',
    city: '',
    region: '',
    country: 'Canada',
    zipCode: '',
    wineTypes: [],
    sustainable: false,
    featured: false,
    foundedYear: '',
    status: WineryStatus.PENDING
  });

  const [experienceForm, setExperienceForm] = useState<ExperienceFormData>({
    title: '',
    description: '',
    type: ExperienceType.TASTING,
    duration: '60',
    price: '0',
    maxGuests: '8',
    availableDays: [],
    startTime: '10:00',
    endTime: '17:00',
    ageRestriction: '',
    requirements: '',
    isActive: true
  });

  const [showExperienceForm, setShowExperienceForm] = useState(false);

  useEffect(() => {
    if (activeTab === 'list') {
      fetchWineries();
    }
  }, [activeTab]);

  const fetchWineries = async () => {
    setLoading(true);
    setError('');
    try {
      // For now, use mock data since we don't have winery API endpoints yet
      const mockWineries: Winery[] = [
        {
          id: '1',
          name: 'Sunset Valley Winery',
          description: 'A family-owned winery specializing in premium red wines',
          email: 'info@sunsetvalley.com',
          phone: '555-0123',
          website: 'https://sunsetvalley.com',
          status: WineryStatus.APPROVED,
          address: '123 Vineyard Lane',
          city: 'Napa',
          region: 'California',
          country: 'USA',
          zipCode: '94558',
          latitude: 38.2975,
          longitude: -122.2869,
          logoUrl: null,
          bannerUrl: null,
          images: [],
          foundedYear: 1985,
          wineTypes: ['Red', 'White'],
          sustainable: true,
          rating: 4.5,
          featured: true,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z'
        },
        {
          id: '2',
          name: 'Mountain View Estates',
          description: 'Boutique winery with organic practices',
          email: 'contact@mountainview.com',
          phone: '555-0456',
          website: 'https://mountainview.com',
          status: WineryStatus.PENDING,
          address: '456 Hill Road',
          city: 'Sonoma',
          region: 'California',
          country: 'USA',
          zipCode: '95476',
          latitude: 38.291,
          longitude: -122.458,
          logoUrl: null,
          bannerUrl: null,
          images: [],
          foundedYear: 2010,
          wineTypes: ['Red', 'Rosé', 'Sparkling'],
          sustainable: true,
          rating: 4.2,
          featured: false,
          createdAt: '2024-01-02T00:00:00Z',
          updatedAt: '2024-01-02T00:00:00Z'
        }
      ];
      setWineries(mockWineries);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch wineries');
    } finally {
      setLoading(false);
    }
  };

  const handleWinerySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // TODO: Implement actual API call
      const wineryData = {
        ...wineryForm,
        foundedYear: wineryForm.foundedYear ? parseInt(wineryForm.foundedYear) : null
      };

      if (selectedWinery) {
        setSuccess('Winery updated successfully!');
      } else {
        setSuccess('Winery created successfully!');
      }

      // Reset form and go back to list
      setWineryForm({
        name: '',
        description: '',
        email: '',
        phone: '',
        website: '',
        address: '',
        city: '',
        region: '',
        country: 'Canada',
        zipCode: '',
        wineTypes: [],
        sustainable: false,
        featured: false,
        foundedYear: '',
        status: WineryStatus.PENDING
      });
      setSelectedWinery(null);
      setActiveTab('list');
      fetchWineries();
    } catch (err: any) {
      setError(err.message || 'Failed to save winery');
    } finally {
      setLoading(false);
    }
  };

  const handleEditWinery = (winery: Winery) => {
    setSelectedWinery(winery);
    setWineryForm({
      name: winery.name,
      description: winery.description || '',
      email: winery.email,
      phone: winery.phone || '',
      website: winery.website || '',
      address: winery.address,
      city: winery.city,
      region: winery.region,
      country: winery.country,
      zipCode: winery.zipCode || '',
      wineTypes: winery.wineTypes,
      sustainable: winery.sustainable,
      featured: winery.featured || false,
      foundedYear: winery.foundedYear?.toString() || '',
      status: winery.status
    });
    setActiveTab('edit');
  };

  const handleStatusChange = async (wineryId: string, newStatus: WineryStatus) => {
    setLoading(true);
    setError('');
    try {
      // TODO: Implement actual API call
      setWineries(prev => prev.map(w => 
        w.id === wineryId ? { ...w, status: newStatus } : w
      ));
      setSuccess(`Winery status updated to ${newStatus}`);
    } catch (err: any) {
      setError(err.message || 'Failed to update status');
    } finally {
      setLoading(false);
    }
  };

  const filteredWineries = wineries.filter(winery =>
    winery.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    winery.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
    winery.region.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderWineryList = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Winery Management</h2>
        <button
          onClick={() => setActiveTab('create')}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
        >
          Add New Winery
        </button>
      </div>

      <div className="mb-4">
        <input
          type="text"
          placeholder="Search wineries..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full max-w-md px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {filteredWineries.map((winery) => (
            <li key={winery.id} className="px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-3">
                    <h3 className="text-lg font-medium text-gray-900 truncate">
                      {winery.name}
                    </h3>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      winery.status === WineryStatus.APPROVED
                        ? 'bg-green-100 text-green-800'
                        : winery.status === WineryStatus.PENDING
                        ? 'bg-yellow-100 text-yellow-800'
                        : winery.status === WineryStatus.REJECTED
                        ? 'bg-red-100 text-red-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {winery.status}
                    </span>
                    {winery.featured && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                        Featured
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    {winery.city}, {winery.region} • {winery.email}
                  </p>
                  <div className="mt-2 flex items-center space-x-4">
                    <span className="text-sm text-gray-500">
                      Wine Types: {winery.wineTypes.join(', ')}
                    </span>
                    {winery.sustainable && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                        Sustainable
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <select
                    value={winery.status}
                    onChange={(e) => handleStatusChange(winery.id, e.target.value as WineryStatus)}
                    className="text-sm border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    disabled={loading}
                  >
                    {Object.values(WineryStatus).map(status => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                  <button
                    onClick={() => handleEditWinery(winery)}
                    className="text-blue-600 hover:text-blue-900 text-sm font-medium"
                  >
                    Edit
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );

  const renderWineryForm = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">
          {selectedWinery ? 'Edit Winery' : 'Create New Winery'}
        </h2>
        <button
          onClick={() => {
            setActiveTab('list');
            setSelectedWinery(null);
          }}
          className="text-gray-600 hover:text-gray-900"
        >
          ← Back to List
        </button>
      </div>

      <form onSubmit={handleWinerySubmit} className="space-y-6 bg-white p-6 rounded-lg shadow">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Winery Name *
            </label>
            <input
              type="text"
              required
              value={wineryForm.name}
              onChange={(e) => setWineryForm(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email *
            </label>
            <input
              type="email"
              required
              value={wineryForm.email}
              onChange={(e) => setWineryForm(prev => ({ ...prev, email: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Phone
            </label>
            <input
              type="tel"
              value={wineryForm.phone}
              onChange={(e) => setWineryForm(prev => ({ ...prev, phone: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Website
            </label>
            <input
              type="url"
              value={wineryForm.website}
              onChange={(e) => setWineryForm(prev => ({ ...prev, website: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Address *
            </label>
            <input
              type="text"
              required
              value={wineryForm.address}
              onChange={(e) => setWineryForm(prev => ({ ...prev, address: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              City *
            </label>
            <input
              type="text"
              required
              value={wineryForm.city}
              onChange={(e) => setWineryForm(prev => ({ ...prev, city: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Region *
            </label>
            <input
              type="text"
              required
              value={wineryForm.region}
              onChange={(e) => setWineryForm(prev => ({ ...prev, region: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Country *
            </label>
            <input
              type="text"
              required
              value={wineryForm.country}
              onChange={(e) => setWineryForm(prev => ({ ...prev, country: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ZIP Code
            </label>
            <input
              type="text"
              value={wineryForm.zipCode}
              onChange={(e) => setWineryForm(prev => ({ ...prev, zipCode: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Founded Year
            </label>
            <input
              type="number"
              min="1800"
              max="2024"
              value={wineryForm.foundedYear}
              onChange={(e) => setWineryForm(prev => ({ ...prev, foundedYear: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              value={wineryForm.status}
              onChange={(e) => setWineryForm(prev => ({ ...prev, status: e.target.value as WineryStatus }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {Object.values(WineryStatus).map(status => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description
          </label>
          <textarea
            rows={4}
            value={wineryForm.description}
            onChange={(e) => setWineryForm(prev => ({ ...prev, description: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Describe the winery..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Wine Types
          </label>
          <div className="grid grid-cols-3 gap-2">
            {WINE_TYPES.map(type => (
              <label key={type} className="flex items-center">
                <input
                  type="checkbox"
                  checked={wineryForm.wineTypes.includes(type)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setWineryForm(prev => ({ ...prev, wineTypes: [...prev.wineTypes, type] }));
                    } else {
                      setWineryForm(prev => ({ ...prev, wineTypes: prev.wineTypes.filter(t => t !== type) }));
                    }
                  }}
                  className="mr-2"
                />
                {type}
              </label>
            ))}
          </div>
        </div>

        <div className="flex items-center space-x-6">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={wineryForm.sustainable}
              onChange={(e) => setWineryForm(prev => ({ ...prev, sustainable: e.target.checked }))}
              className="mr-2"
            />
            Sustainable Practices
          </label>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={wineryForm.featured}
              onChange={(e) => setWineryForm(prev => ({ ...prev, featured: e.target.checked }))}
              className="mr-2"
            />
            Featured Winery
          </label>
        </div>

        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => {
              setActiveTab('list');
              setSelectedWinery(null);
            }}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Saving...' : (selectedWinery ? 'Update Winery' : 'Create Winery')}
          </button>
        </div>
      </form>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-md">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 text-green-700 rounded-md">
            {success}
          </div>
        )}

        {activeTab === 'list' && renderWineryList()}
        {(activeTab === 'create' || activeTab === 'edit') && renderWineryForm()}
      </div>
    </div>
  );
}