'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import LoadingSpinner from '../ui/LoadingSpinner';
import Link from 'next/link';

interface Booking {
  id: string;
  bookingDate: string;
  guests: number;
  totalPrice: number;
  status: 'CONFIRMED' | 'PENDING' | 'CANCELLED';
  specialRequests?: string;
  winery: {
    id: string;
    name: string;
    city: string;
    region: string;
    bannerUrl?: string;
  };
  experience: {
    id: string;
    title: string;
    type: string;
    duration: number;
  };
}

const CalendarIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const ClockIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const UsersIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
  </svg>
);

const MapPinIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

export default function BookingsList() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isLocal, setIsLocal] = useState(false);

  useEffect(() => {
    const fetchBookings = async () => {
      if (!user?.email) return;

      try {
        setLoading(true);
        setError('');

        // Check if we're in the browser
        if (typeof window === 'undefined') {
          return; // Skip on server-side
        }

        if (!process.env.NEXT_PUBLIC_API_URL) {
          throw new Error('Booking service is not configured');
        }

        // Try API call with proper error handling
        try {
          const response = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/api/bookings?userEmail=${encodeURIComponent(user.email)}`,
            {
              method: 'GET',
              headers: {
                'Content-Type': 'application/json',
              },
            }
          );

          const contentType = response.headers.get('content-type');
          if (!contentType || !contentType.includes('application/json')) {
            throw new Error('API_NON_JSON');
          }

          const result = await response.json();

          if (!response.ok) {
            throw new Error(`API_ERROR: ${result.message || result.error || 'Failed to fetch bookings'}`);
          }

          // Success - use API data
          setBookings(result.bookings || []);
          setIsLocal(false);
          console.log('Bookings loaded from API successfully');
          
        } catch (apiError: any) {
          // API failed, fall back to localStorage without logging errors
          if (apiError.name === 'TypeError' || apiError.message.includes('Failed to fetch')) {
            // Network error - silently fall back
            console.log('API unavailable, loading from localStorage');
          } else if (apiError.message.includes('API_NON_JSON')) {
            console.log('API returned non-JSON, loading from localStorage');
          } else if (apiError.message.includes('API_ERROR')) {
            console.log('API error occurred, loading from localStorage');
          } else {
            console.log('Unknown API issue, loading from localStorage');
          }
          
          // Fall back to localStorage
          const localBookings = JSON.parse(localStorage.getItem('vinventure_bookings') || '[]');
          setBookings(localBookings);
          setIsLocal(true);
          setError('');
        }
      } catch (err: any) {
        // This should only catch non-API errors (like missing user email, etc.)
        console.error('Unexpected error in fetchBookings:', err);
        
        // Fall back to localStorage for any unexpected errors
        if (typeof window !== 'undefined') {
          try {
            const localBookings = JSON.parse(localStorage.getItem('vinventure_bookings') || '[]');
            setBookings(localBookings);
            setIsLocal(true);
            setError('');
          } catch (localError) {
            console.error('Failed to load local bookings:', localError);
            setBookings([]);
            setError('');
          }
        } else {
          setBookings([]);
          setError('');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, [user?.email]);

  const formatDateTime = (dateTimeStr: string) => {
    const date = new Date(dateTimeStr);
    return {
      date: date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }),
      time: date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit'
      })
    };
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return 'bg-green-100 text-green-800';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const isUpcoming = (dateTimeStr: string) => {
    return new Date(dateTimeStr) > new Date();
  };

  const upcomingBookings = bookings.filter(booking => isUpcoming(booking.bookingDate));
  const pastBookings = bookings.filter(booking => !isUpcoming(booking.bookingDate));

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner text="Loading your bookings..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 mb-4">{error}</div>
        <Link
          href="/discover"
          className="text-purple-600 hover:text-purple-700 font-medium"
        >
          Discover Wineries to Book
        </Link>
      </div>
    );
  }

  if (bookings.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="mb-4">
          <CalendarIcon className="h-12 w-12 text-gray-400 mx-auto" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No bookings yet</h3>
        <p className="text-gray-600 mb-6">
          You haven't made any wine experience bookings yet. Discover amazing wineries and book your first experience!
        </p>
        <Link
          href="/discover"
          className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-md font-medium transition-colors"
        >
          Discover Wineries
        </Link>
      </div>
    );
  }

  const BookingCard = ({ booking }: { booking: Booking }) => {
    const { date, time } = formatDateTime(booking.bookingDate);
    const upcoming = isUpcoming(booking.bookingDate);

    return (
      <div className={`border rounded-lg p-6 ${upcoming ? 'border-purple-200 bg-purple-50' : 'border-gray-200'}`}>
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {booking.experience.title}
            </h3>
            <p className="text-gray-600">{booking.winery.name}</p>
          </div>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(booking.status)}`}>
            {booking.status}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div className="flex items-center gap-2 text-gray-600">
            <CalendarIcon className="h-4 w-4" />
            <span className="text-sm">{date}</span>
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <ClockIcon className="h-4 w-4" />
            <span className="text-sm">{time} ({booking.experience.duration} min)</span>
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <UsersIcon className="h-4 w-4" />
            <span className="text-sm">{booking.guests} guest{booking.guests !== 1 ? 's' : ''}</span>
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <MapPinIcon className="h-4 w-4" />
            <span className="text-sm">{booking.winery.city}, {booking.winery.region}</span>
          </div>
        </div>

        {booking.specialRequests && (
          <div className="mb-4">
            <span className="text-sm font-medium text-gray-700">Special Requests: </span>
            <span className="text-sm text-gray-600">{booking.specialRequests}</span>
          </div>
        )}

        <div className="flex justify-between items-center">
          <div className="text-lg font-semibold text-gray-900">
            ${booking.totalPrice}
          </div>
          <Link
            href={`/wineries/${booking.winery.id}`}
            className="text-purple-600 hover:text-purple-700 font-medium text-sm"
          >
            View Winery →
          </Link>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8">

      {/* Upcoming Bookings */}
      {upcomingBookings.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Upcoming Experiences ({upcomingBookings.length})
          </h2>
          <div className="space-y-4">
            {upcomingBookings.map((booking) => (
              <BookingCard key={booking.id} booking={booking} />
            ))}
          </div>
        </div>
      )}

      {/* Past Bookings */}
      {pastBookings.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Past Experiences ({pastBookings.length})
          </h2>
          <div className="space-y-4">
            {pastBookings.map((booking) => (
              <BookingCard key={booking.id} booking={booking} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}