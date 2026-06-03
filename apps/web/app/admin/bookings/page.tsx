'use client';

import { useState, useEffect, useCallback } from 'react';

interface BookingData {
  id: string;
  bookingDate: string;
  guests: number;
  totalPrice: number;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';
  paymentStatus: 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';
  paymentIntentId?: string;
  specialRequests?: string;
  winery: {
    id: string;
    name: string;
    city: string;
    region: string;
  };
  experience: {
    id: string;
    title: string;
    type: string;
    duration: number;
  };
  user: {
    name: string;
    email: string;
  };
  createdAt: string;
}

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState<BookingData[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<BookingData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [paymentFilter, setPaymentFilter] = useState<string>('ALL');
  const [dateFilter, setDateFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchBookings();
  }, []);

  const applyFilters = useCallback(() => {
    let filtered = [...bookings];

    // Status filter
    if (statusFilter !== 'ALL') {
      filtered = filtered.filter(booking => booking.status === statusFilter);
    }

    // Payment filter
    if (paymentFilter !== 'ALL') {
      filtered = filtered.filter(booking => booking.paymentStatus === paymentFilter);
    }

    // Date filter
    if (dateFilter) {
      const filterDate = new Date(dateFilter);
      filtered = filtered.filter(booking => {
        const bookingDate = new Date(booking.bookingDate);
        return bookingDate.toDateString() === filterDate.toDateString();
      });
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(booking =>
        booking.user.name.toLowerCase().includes(query) ||
        booking.user.email.toLowerCase().includes(query) ||
        booking.winery.name.toLowerCase().includes(query) ||
        booking.experience.title.toLowerCase().includes(query)
      );
    }

    setFilteredBookings(filtered);
  }, [bookings, statusFilter, paymentFilter, dateFilter, searchQuery]);

  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  const fetchBookings = async () => {
    setLoading(true);
    setError('');
    try {
      // TODO: Replace with actual API call
      // For now, using mock data
      const mockBookings: BookingData[] = [
        {
          id: 'booking_1',
          bookingDate: '2024-01-15T14:00:00Z',
          guests: 4,
          totalPrice: 120,
          status: 'CONFIRMED',
          paymentStatus: 'PAID',
          paymentIntentId: 'pi_test_123',
          specialRequests: 'Dietary restrictions: vegetarian',
          winery: {
            id: '1',
            name: 'Sunset Valley Winery',
            city: 'Napa',
            region: 'California'
          },
          experience: {
            id: 'exp_1',
            title: 'Premium Wine Tasting',
            type: 'TASTING',
            duration: 90
          },
          user: {
            name: 'John Doe',
            email: 'john@example.com'
          },
          createdAt: '2024-01-10T10:00:00Z'
        },
        {
          id: 'booking_2',
          bookingDate: '2024-01-20T16:00:00Z',
          guests: 2,
          totalPrice: 80,
          status: 'PENDING',
          paymentStatus: 'PENDING',
          winery: {
            id: '2',
            name: 'Mountain View Estates',
            city: 'Sonoma',
            region: 'California'
          },
          experience: {
            id: 'exp_2',
            title: 'Vineyard Tour & Tasting',
            type: 'TOUR',
            duration: 120
          },
          user: {
            name: 'Jane Smith',
            email: 'jane@example.com'
          },
          createdAt: '2024-01-12T15:30:00Z'
        },
        {
          id: 'booking_3',
          bookingDate: '2024-01-18T13:00:00Z',
          guests: 6,
          totalPrice: 180,
          status: 'CONFIRMED',
          paymentStatus: 'PAID',
          paymentIntentId: 'pi_test_456',
          winery: {
            id: '1',
            name: 'Sunset Valley Winery',
            city: 'Napa',
            region: 'California'
          },
          experience: {
            id: 'exp_3',
            title: 'Private Event',
            type: 'PRIVATE_EVENT',
            duration: 180
          },
          user: {
            name: 'Mike Johnson',
            email: 'mike@example.com'
          },
          createdAt: '2024-01-08T09:15:00Z'
        }
      ];

      setBookings(mockBookings);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to fetch bookings';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const updateBookingStatus = async (bookingId: string, newStatus: BookingData['status']) => {
    setLoading(true);
    setError('');
    try {
      // TODO: Implement actual API call
      setBookings(prev => prev.map(booking =>
        booking.id === bookingId ? { ...booking, status: newStatus } : booking
      ));
      setSuccess(`Booking status updated to ${newStatus}`);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to update booking status';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status: string, type: 'booking' | 'payment') => {
    const baseClasses = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium';
    
    if (type === 'booking') {
      switch (status) {
        case 'CONFIRMED':
          return `${baseClasses} bg-green-100 text-green-800`;
        case 'PENDING':
          return `${baseClasses} bg-yellow-100 text-yellow-800`;
        case 'CANCELLED':
          return `${baseClasses} bg-red-100 text-red-800`;
        case 'COMPLETED':
          return `${baseClasses} bg-blue-100 text-blue-800`;
        default:
          return `${baseClasses} bg-gray-100 text-gray-800`;
      }
    } else {
      switch (status) {
        case 'PAID':
          return `${baseClasses} bg-green-100 text-green-800`;
        case 'PENDING':
          return `${baseClasses} bg-yellow-100 text-yellow-800`;
        case 'FAILED':
          return `${baseClasses} bg-red-100 text-red-800`;
        case 'REFUNDED':
          return `${baseClasses} bg-purple-100 text-purple-800`;
        default:
          return `${baseClasses} bg-gray-100 text-gray-800`;
      }
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Booking Management</h1>
          <div className="text-sm text-gray-500">
            Total Bookings: {filteredBookings.length}
          </div>
        </div>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-md">
            {error}
          </div>
        )}

        {success && (
          <div className="p-4 bg-green-50 border border-green-200 text-green-700 rounded-md">
            {success}
          </div>
        )}

        {/* Filters */}
        <div className="bg-white p-6 rounded-lg shadow space-y-4">
          <h3 className="text-lg font-medium text-gray-900">Filters</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Booking Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="ALL">All Statuses</option>
                <option value="PENDING">Pending</option>
                <option value="CONFIRMED">Confirmed</option>
                <option value="CANCELLED">Cancelled</option>
                <option value="COMPLETED">Completed</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Payment Status
              </label>
              <select
                value={paymentFilter}
                onChange={(e) => setPaymentFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="ALL">All Payment Status</option>
                <option value="PENDING">Pending Payment</option>
                <option value="PAID">Paid</option>
                <option value="FAILED">Failed</option>
                <option value="REFUNDED">Refunded</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Booking Date
              </label>
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search
              </label>
              <input
                type="text"
                placeholder="Search by name, email, winery..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <button
            onClick={() => {
              setStatusFilter('ALL');
              setPaymentFilter('ALL');
              setDateFilter('');
              setSearchQuery('');
            }}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            Clear All Filters
          </button>
        </div>

        {/* Bookings Table */}
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          {loading ? (
            <div className="p-8 text-center">
              <div className="text-gray-500">Loading bookings...</div>
            </div>
          ) : filteredBookings.length === 0 ? (
            <div className="p-8 text-center">
              <div className="text-gray-500">No bookings found matching your criteria.</div>
            </div>
          ) : (
            <ul className="divide-y divide-gray-200">
              {filteredBookings.map((booking) => (
                <li key={booking.id} className="px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-medium text-gray-900">
                          {booking.experience.title}
                        </h3>
                        <span className={getStatusBadge(booking.status, 'booking')}>
                          {booking.status}
                        </span>
                        <span className={getStatusBadge(booking.paymentStatus, 'payment')}>
                          {booking.paymentStatus}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm text-gray-600">
                        <div>
                          <strong>Customer:</strong> {booking.user.name}<br />
                          <strong>Email:</strong> {booking.user.email}
                        </div>
                        <div>
                          <strong>Winery:</strong> {booking.winery.name}<br />
                          <strong>Location:</strong> {booking.winery.city}, {booking.winery.region}
                        </div>
                        <div>
                          <strong>Date:</strong> {formatDate(booking.bookingDate)}<br />
                          <strong>Guests:</strong> {booking.guests} • <strong>Total:</strong> ${booking.totalPrice}
                        </div>
                      </div>

                      {booking.specialRequests && (
                        <div className="mt-2 text-sm text-gray-600">
                          <strong>Special Requests:</strong> {booking.specialRequests}
                        </div>
                      )}

                      {booking.paymentIntentId && (
                        <div className="mt-2 text-xs text-gray-500">
                          Payment ID: {booking.paymentIntentId}
                        </div>
                      )}
                    </div>

                    <div className="ml-4 flex items-center space-x-2">
                      <select
                        value={booking.status}
                        onChange={(e) => updateBookingStatus(booking.id, e.target.value as BookingData['status'])}
                        className="text-sm border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        disabled={loading}
                      >
                        <option value="PENDING">Pending</option>
                        <option value="CONFIRMED">Confirmed</option>
                        <option value="CANCELLED">Cancelled</option>
                        <option value="COMPLETED">Completed</option>
                      </select>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500">Total Revenue</h3>
            <p className="text-2xl font-bold text-gray-900">
              ${filteredBookings.filter(b => b.paymentStatus === 'PAID').reduce((sum, b) => sum + b.totalPrice, 0)}
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500">Confirmed Bookings</h3>
            <p className="text-2xl font-bold text-green-600">
              {filteredBookings.filter(b => b.status === 'CONFIRMED').length}
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500">Pending Bookings</h3>
            <p className="text-2xl font-bold text-yellow-600">
              {filteredBookings.filter(b => b.status === 'PENDING').length}
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500">Total Guests</h3>
            <p className="text-2xl font-bold text-blue-600">
              {filteredBookings.reduce((sum, b) => sum + b.guests, 0)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}