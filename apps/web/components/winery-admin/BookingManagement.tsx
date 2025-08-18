'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';

interface Booking {
  id: string;
  bookingDate: string;
  guestCount: number;
  totalAmount: number;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';
  guestName: string;
  guestEmail: string;
  guestPhone?: string;
  specialRequests?: string;
  createdAt: string;
  paidAt?: string;
  experience: {
    id: string;
    title: string;
    type: string;
  };
  user: {
    id: string;
    name: string;
    email: string;
  };
}

type BookingFilter = 'all' | 'pending' | 'confirmed' | 'completed' | 'cancelled';
type DateFilter = 'all' | 'today' | 'week' | 'month';

export default function BookingManagement() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [statusFilter, setStatusFilter] = useState<BookingFilter>('all');
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    
    const fetchBookings = async () => {
      try {
        if (!user?.accessToken) {
          setLoading(false);
          return;
        }

        // First get the user's winery
        const wineriesResponse = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001'}/api/wineries/owner/my-wineries`, {
          headers: { 
            'Authorization': `Bearer ${user.accessToken}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (!wineriesResponse.ok) {
          throw new Error(`Failed to fetch wineries: ${wineriesResponse.status}`);
        }
        
        const wineries = await wineriesResponse.json();
        
        if (wineries && wineries.length > 0) {
          const wineryId = wineries[0].id;
          
          // Fetch bookings for this winery
          const bookingsResponse = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001'}/api/bookings/winery/${wineryId}`, {
            headers: { 
              'Authorization': `Bearer ${user.accessToken}`,
              'Content-Type': 'application/json'
            }
          });
          
          if (!bookingsResponse.ok) {
            throw new Error(`Failed to fetch bookings: ${bookingsResponse.status}`);
          }
          
          const bookingsData = await bookingsResponse.json();
          
          // Transform API data to match component interface
          const transformedBookings: Booking[] = bookingsData.bookings?.map((booking: any) => ({
            id: booking.id,
            bookingDate: booking.bookingDate,
            guestCount: booking.guestCount,
            totalAmount: booking.totalAmount,
            status: booking.status,
            guestName: booking.guestName,
            guestEmail: booking.guestEmail,
            guestPhone: booking.guestPhone,
            specialRequests: booking.specialRequests,
            createdAt: booking.createdAt,
            paidAt: booking.paidAt,
            experience: {
              id: booking.experience?.id || '',
              title: booking.experience?.title || '',
              type: booking.experience?.type || ''
            },
            user: {
              id: booking.user?.id || '',
              name: booking.user?.name || booking.guestName,
              email: booking.user?.email || booking.guestEmail
            }
          })) || [];
          
          setBookings(transformedBookings);
        }
      } catch (error) {
        console.error('Failed to fetch bookings:', error);
        // Keep component working if API fails
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, [mounted, user]);

  const handleStatusChange = async (bookingId: string, newStatus: Booking['status']) => {
    try {
      if (!user?.accessToken) {
        alert('Authentication required');
        return;
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001'}/api/bookings/${bookingId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.accessToken}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      // Update local state
      setBookings(prev => prev.map(booking => 
        booking.id === bookingId ? { ...booking, status: newStatus } : booking
      ));
      
      alert(`Booking ${newStatus.toLowerCase()} successfully!`);
    } catch (error) {
      console.error('Failed to update booking:', error);
      alert('Failed to update booking. Please try again.');
    }
  };

  const handleMarkCompleted = async (bookingId: string) => {
    try {
      if (!user?.accessToken) {
        alert('Authentication required');
        return;
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001'}/api/bookings/${bookingId}/complete`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${user.accessToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      setBookings(prev => prev.map(booking => 
        booking.id === bookingId ? { ...booking, status: 'COMPLETED' } : booking
      ));
      
      alert('Booking marked as completed!');
    } catch (error) {
      console.error('Failed to complete booking:', error);
      alert('Failed to mark booking as completed. Please try again.');
    }
  };

  const filteredBookings = bookings.filter(booking => {
    // Status filter
    if (statusFilter !== 'all' && booking.status.toLowerCase() !== statusFilter) {
      return false;
    }

    // Date filter
    const bookingDate = new Date(booking.bookingDate);
    const now = new Date();
    
    switch (dateFilter) {
      case 'today':
        return bookingDate.toDateString() === now.toDateString();
      case 'week':
        const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        return bookingDate >= now && bookingDate <= weekFromNow;
      case 'month':
        const monthFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
        return bookingDate >= now && bookingDate <= monthFromNow;
      default:
        return true;
    }
  });

  const getStatusColor = (status: Booking['status']) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'CONFIRMED':
        return 'bg-blue-100 text-blue-800';
      case 'COMPLETED':
        return 'bg-green-100 text-green-800';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  if (!mounted || loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
        <p className="mt-2 text-gray-600">Loading bookings...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-sm font-medium text-gray-500">Total Bookings</h3>
          <p className="text-2xl font-bold text-gray-900">{bookings.length}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-sm font-medium text-gray-500">Pending</h3>
          <p className="text-2xl font-bold text-yellow-600">
            {bookings.filter(b => b.status === 'PENDING').length}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-sm font-medium text-gray-500">Confirmed</h3>
          <p className="text-2xl font-bold text-blue-600">
            {bookings.filter(b => b.status === 'CONFIRMED').length}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-sm font-medium text-gray-500">Revenue</h3>
          <p className="text-2xl font-bold text-green-600">
            {formatCurrency(bookings.filter(b => b.status === 'COMPLETED' || b.status === 'CONFIRMED').reduce((sum, b) => sum + b.totalAmount, 0))}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex flex-wrap gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as BookingFilter)}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-purple-500 focus:border-purple-500"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value as DateFilter)}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-purple-500 focus:border-purple-500"
            >
              <option value="all">All Dates</option>
              <option value="today">Today</option>
              <option value="week">Next 7 Days</option>
              <option value="month">Next 30 Days</option>
            </select>
          </div>
        </div>
      </div>

      {/* Bookings List */}
      <div className="bg-white rounded-lg shadow-sm">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Bookings ({filteredBookings.length})
          </h3>
        </div>

        {filteredBookings.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">No bookings found for the selected filters.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredBookings.map((booking) => (
              <div key={booking.id} className="p-6 hover:bg-gray-50">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h4 className="text-lg font-medium text-gray-900">
                        {booking.guestName}
                      </h4>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(booking.status)}`}>
                        {booking.status}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                      <div>
                        <span className="font-medium">Experience:</span> {booking.experience.title}
                      </div>
                      <div>
                        <span className="font-medium">Date:</span> {formatDate(booking.bookingDate)}
                      </div>
                      <div>
                        <span className="font-medium">Guests:</span> {booking.guestCount}
                      </div>
                      <div>
                        <span className="font-medium">Email:</span> {booking.guestEmail}
                      </div>
                      <div>
                        <span className="font-medium">Phone:</span> {booking.guestPhone || 'Not provided'}
                      </div>
                      <div>
                        <span className="font-medium">Total:</span> {formatCurrency(booking.totalAmount)}
                      </div>
                    </div>

                    {booking.specialRequests && (
                      <div className="mt-2 text-sm">
                        <span className="font-medium text-gray-700">Special Requests:</span>
                        <span className="text-gray-600 ml-1">{booking.specialRequests}</span>
                      </div>
                    )}

                    <div className="mt-2 text-xs text-gray-500">
                      Booked: {formatDate(booking.createdAt)}
                      {booking.paidAt && (
                        <span className="ml-4">Paid: {formatDate(booking.paidAt)}</span>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col space-y-2 ml-4">
                    <button
                      onClick={() => setSelectedBooking(booking)}
                      className="text-purple-600 hover:text-purple-800 text-sm"
                    >
                      View Details
                    </button>

                    {booking.status === 'PENDING' && (
                      <>
                        <button
                          onClick={() => handleStatusChange(booking.id, 'CONFIRMED')}
                          className="text-green-600 hover:text-green-800 text-sm"
                        >
                          Confirm
                        </button>
                        <button
                          onClick={() => handleStatusChange(booking.id, 'CANCELLED')}
                          className="text-red-600 hover:text-red-800 text-sm"
                        >
                          Cancel
                        </button>
                      </>
                    )}

                    {booking.status === 'CONFIRMED' && new Date(booking.bookingDate) <= new Date() && (
                      <button
                        onClick={() => handleMarkCompleted(booking.id)}
                        className="text-blue-600 hover:text-blue-800 text-sm"
                      >
                        Mark Complete
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Booking Details Modal */}
      {selectedBooking && (
        <BookingDetailsModal 
          booking={selectedBooking}
          onClose={() => setSelectedBooking(null)}
          onStatusChange={handleStatusChange}
        />
      )}
    </div>
  );
}

// Booking Details Modal Component
function BookingDetailsModal({
  booking,
  onClose,
  onStatusChange
}: {
  booking: Booking;
  onClose: () => void;
  onStatusChange: (bookingId: string, status: Booking['status']) => void;
}) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-screen overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-900">Booking Details</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-6 py-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Booking ID</label>
              <p className="text-gray-900">{booking.id}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Status</label>
              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                booking.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                booking.status === 'CONFIRMED' ? 'bg-blue-100 text-blue-800' :
                booking.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                'bg-red-100 text-red-800'
              }`}>
                {booking.status}
              </span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Experience</label>
            <p className="text-gray-900">{booking.experience.title} ({booking.experience.type})</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Date & Time</label>
              <p className="text-gray-900">{formatDate(booking.bookingDate)}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Number of Guests</label>
              <p className="text-gray-900">{booking.guestCount}</p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Guest Information</label>
            <div className="mt-1 space-y-1">
              <p className="text-gray-900">Name: {booking.guestName}</p>
              <p className="text-gray-900">Email: {booking.guestEmail}</p>
              {booking.guestPhone && (
                <p className="text-gray-900">Phone: {booking.guestPhone}</p>
              )}
            </div>
          </div>

          {booking.specialRequests && (
            <div>
              <label className="block text-sm font-medium text-gray-700">Special Requests</label>
              <p className="text-gray-900">{booking.specialRequests}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Total Amount</label>
              <p className="text-gray-900 font-semibold">{formatCurrency(booking.totalAmount)}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Payment Status</label>
              <p className="text-gray-900">{booking.paidAt ? 'Paid' : 'Pending'}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Booking Created</label>
              <p className="text-gray-900">{formatDate(booking.createdAt)}</p>
            </div>
            {booking.paidAt && (
              <div>
                <label className="block text-sm font-medium text-gray-700">Payment Date</label>
                <p className="text-gray-900">{formatDate(booking.paidAt)}</p>
              </div>
            )}
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
          {booking.status === 'PENDING' && (
            <>
              <button
                onClick={() => {
                  onStatusChange(booking.id, 'CONFIRMED');
                  onClose();
                }}
                className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
              >
                Confirm Booking
              </button>
              <button
                onClick={() => {
                  onStatusChange(booking.id, 'CANCELLED');
                  onClose();
                }}
                className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
              >
                Cancel Booking
              </button>
            </>
          )}
          <button
            onClick={onClose}
            className="border border-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-50"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}