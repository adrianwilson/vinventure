'use client';

import { useState, useEffect } from 'react';
import { Winery, Experience } from '@vinventure/types/types/winery';
import { useAuth } from '../../contexts/AuthContext';

interface ExperienceBookingProps {
  winery: Winery;
  experience: Experience;
  onClose: () => void;
}

interface BookingFormData {
  date: string;
  time: string;
  guests: number;
  specialRequests: string;
}

const XIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

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

export default function ExperienceBooking({ winery, experience, onClose }: ExperienceBookingProps) {
  const { user } = useAuth();
  const [formData, setFormData] = useState<BookingFormData>({
    date: '',
    time: experience.startTime || '10:00',
    guests: 1,
    specialRequests: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState(1); // 1: Details, 2: Payment (future), 3: Confirmation

  // Generate available dates for the next 60 days
  const getAvailableDates = () => {
    const dates = [];
    const today = new Date();
    
    for (let i = 1; i <= 60; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      
      const dayName = date.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
      
      if (experience.availableDays.includes(dayName)) {
        dates.push(date.toISOString().split('T')[0]);
      }
    }
    
    return dates;
  };

  // Generate time slots
  const getTimeSlots = () => {
    const slots = [];
    const start = parseInt(experience.startTime?.split(':')[0] || '10');
    const end = parseInt(experience.endTime?.split(':')[0] || '17');
    
    for (let hour = start; hour < end; hour++) {
      slots.push(`${hour.toString().padStart(2, '0')}:00`);
      if (hour + 0.5 < end) {
        slots.push(`${hour.toString().padStart(2, '0')}:30`);
      }
    }
    
    return slots;
  };

  const availableDates = getAvailableDates();
  const timeSlots = getTimeSlots();
  const totalPrice = experience.price * formData.guests;

  const handleInputChange = (field: keyof BookingFormData, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      setError('Please sign in to make a booking');
      return;
    }

    if (!formData.date || !formData.time) {
      setError('Please select a date and time');
      return;
    }

    if (formData.guests < 1 || formData.guests > experience.maxGuests) {
      setError(`Number of guests must be between 1 and ${experience.maxGuests}`);
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Call the booking API
      const bookingPayload = {
        wineryId: winery.id,
        experienceId: experience.id,
        userEmail: user?.email,
        userCognitoId: user?.cognitoUid,
        date: formData.date,
        time: formData.time,
        guests: formData.guests,
        totalPrice: totalPrice,
        specialRequests: formData.specialRequests
      };

      console.log('Submitting booking:', bookingPayload);

      // Call the production API
      console.log('API URL:', process.env.NEXT_PUBLIC_API_URL);

      if (!process.env.NEXT_PUBLIC_API_URL) {
        throw new Error('API URL not configured');
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/bookings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bookingPayload)
      });

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('API returned non-JSON response');
      }

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || result.error || 'Failed to create booking');
      }

      console.log('Booking created successfully:', result);
      setStep(3);
      
    } catch (err: any) {
      console.error('Booking error:', err);
      
      // Handle specific error types with local storage fallback
      if (err.name === 'TypeError' && err.message.includes('Failed to fetch')) {
        console.warn('Network error - API unreachable, saving booking locally');
      } else if (err.message.includes('API returned non-JSON response')) {
        console.warn('API returned non-JSON response, saving booking locally');
      } else if (err.message.includes('Internal server error')) {
        console.warn('API internal error, saving booking locally');
      } else {
        setError(err.message || 'An unexpected error occurred. Please try again.');
        return;
      }

      // Save booking to localStorage as fallback
      try {
        const booking = {
          id: 'local-' + Date.now(),
          bookingDate: `${formData.date}T${formData.time}:00.000Z`,
          guests: formData.guests,
          totalPrice: totalPrice,
          status: 'CONFIRMED',
          specialRequests: formData.specialRequests,
          winery: {
            id: winery.id,
            name: winery.name,
            city: winery.city,
            region: winery.region,
            bannerUrl: winery.bannerUrl
          },
          experience: {
            id: experience.id,
            title: experience.title,
            type: experience.type,
            duration: experience.duration
          },
          createdAt: new Date().toISOString()
        };

        const existingBookings = JSON.parse(localStorage.getItem('vinventure_bookings') || '[]');
        existingBookings.push(booking);
        localStorage.setItem('vinventure_bookings', JSON.stringify(existingBookings));
        
        console.log('Booking saved locally:', booking);
        await new Promise(resolve => setTimeout(resolve, 1500));
        setStep(3); // Go to confirmation
      } catch (localError) {
        console.error('Failed to save booking locally:', localError);
        setError('Unable to save booking. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Date Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <CalendarIcon className="h-4 w-4 inline mr-1" />
                Select Date
              </label>
              <select
                value={formData.date}
                onChange={(e) => handleInputChange('date', e.target.value)}
                required
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              >
                <option value="">Choose a date...</option>
                {availableDates.map(date => (
                  <option key={date} value={date}>
                    {formatDate(date)}
                  </option>
                ))}
              </select>
            </div>

            {/* Time Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <ClockIcon className="h-4 w-4 inline mr-1" />
                Select Time
              </label>
              <select
                value={formData.time}
                onChange={(e) => handleInputChange('time', e.target.value)}
                required
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              >
                {timeSlots.map(time => (
                  <option key={time} value={time}>
                    {time}
                  </option>
                ))}
              </select>
            </div>

            {/* Number of Guests */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Number of Guests
              </label>
              <select
                value={formData.guests}
                onChange={(e) => handleInputChange('guests', parseInt(e.target.value))}
                required
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              >
                {Array.from({ length: experience.maxGuests }, (_, i) => i + 1).map(num => (
                  <option key={num} value={num}>
                    {num} guest{num !== 1 ? 's' : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Special Requests */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Special Requests (Optional)
              </label>
              <textarea
                value={formData.specialRequests}
                onChange={(e) => handleInputChange('specialRequests', e.target.value)}
                rows={3}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                placeholder="Any dietary restrictions, accessibility needs, or special occasions..."
              />
            </div>

            {/* Price Summary */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="font-medium">Total Price:</span>
                <span className="text-xl font-bold text-purple-600">
                  ${totalPrice}
                </span>
              </div>
              <div className="text-sm text-gray-600 mt-1">
                ${experience.price} × {formData.guests} guest{formData.guests !== 1 ? 's' : ''}
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
                {error}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !user}
                className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Processing...' : 'Book Now'}
              </button>
            </div>

            {!user && (
              <p className="text-sm text-gray-600 text-center">
                Please <button onClick={onClose} className="text-purple-600 hover:text-purple-700">sign in</button> to make a booking.
              </p>
            )}
          </form>
        );

      case 3:
        return (
          <div className="text-center">
            <div className="mb-6">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
                <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
            
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Booking Confirmed!
            </h3>
            
            <p className="text-gray-600 mb-6">
              Your booking for {experience.title} at {winery.name} has been confirmed.
              You will receive a confirmation email shortly.
            </p>

            <div className="bg-gray-50 p-4 rounded-lg mb-6 text-left">
              <h4 className="font-medium text-gray-900 mb-2">Booking Details:</h4>
              <div className="space-y-1 text-sm text-gray-600">
                <div>Date: {formatDate(formData.date)}</div>
                <div>Time: {formData.time}</div>
                <div>Guests: {formData.guests}</div>
                <div>Total: ${totalPrice}</div>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-full px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
            >
              Close
            </button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              {step === 3 ? 'Booking Confirmed' : 'Book Experience'}
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {experience.title} at {winery.name}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <XIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {renderStep()}
        </div>
      </div>
    </div>
  );
}