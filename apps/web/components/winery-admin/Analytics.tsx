'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';

interface AnalyticsData {
  totalBookings: number;
  totalRevenue: number;
  averageRating: number;
  totalReviews: number;
  bookingsByMonth: Array<{ month: string; bookings: number; revenue: number }>;
  experiencePerformance: Array<{
    id: string;
    title: string;
    bookings: number;
    revenue: number;
    averageRating: number;
  }>;
  recentReviews: Array<{
    id: string;
    rating: number;
    comment: string;
    userName: string;
    experienceTitle: string;
    createdAt: string;
  }>;
}

export default function Analytics() {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'30days' | '90days' | '6months' | '1year'>('30days');
  const [mounted, setMounted] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    
    const fetchAnalytics = async () => {
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
          setApiError('Backend API is not available. Please start the backend server on localhost:3001');
          return;
        }
        
        const wineries = await wineriesResponse.json();
        
        if (wineries && wineries.length > 0) {
          const winery = wineries[0];
          
          // Fetch bookings for analytics
          const bookingsResponse = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001'}/api/bookings/winery/${winery.id}`, {
            headers: { 
              'Authorization': `Bearer ${user.accessToken}`,
              'Content-Type': 'application/json'
            }
          });
          
          // Fetch reviews for analytics
          const reviewsResponse = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001'}/api/reviews/winery/${winery.id}`, {
            headers: { 
              'Authorization': `Bearer ${user.accessToken}`,
              'Content-Type': 'application/json'
            }
          });
          
          let bookingsData = { bookings: [] };
          let reviewsData = { reviews: [] };
          
          if (bookingsResponse.ok) {
            bookingsData = await bookingsResponse.json();
          }
          
          if (reviewsResponse.ok) {
            reviewsData = await reviewsResponse.json();
          }
          
          // Calculate analytics from raw data
          const bookings = bookingsData.bookings || [];
          const reviews = reviewsData.reviews || [];
          
          // Filter bookings by time range
          const now = new Date();
          const daysBack = {
            '30days': 30,
            '90days': 90,
            '6months': 180,
            '1year': 365
          }[timeRange];
          
          const cutoffDate = new Date(now.getTime() - daysBack * 24 * 60 * 60 * 1000);
          const filteredBookings = bookings.filter((booking: any) => 
            new Date(booking.createdAt) >= cutoffDate
          );
          
          // Calculate total bookings and revenue
          const totalBookings = filteredBookings.length;
          const completedBookings = filteredBookings.filter((b: any) => b.status === 'COMPLETED' || b.status === 'CONFIRMED');
          const totalRevenue = completedBookings.reduce((sum: number, booking: any) => sum + booking.totalAmount, 0);
          
          // Calculate monthly breakdown (last 4 months)
          const monthlyData = [];
          for (let i = 3; i >= 0; i--) {
            const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const nextMonth = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
            
            const monthBookings = filteredBookings.filter((booking: any) => {
              const bookingDate = new Date(booking.createdAt);
              return bookingDate >= monthDate && bookingDate < nextMonth;
            });
            
            const monthRevenue = monthBookings
              .filter((b: any) => b.status === 'COMPLETED' || b.status === 'CONFIRMED')
              .reduce((sum: number, booking: any) => sum + booking.totalAmount, 0);
            
            monthlyData.push({
              month: monthDate.toLocaleDateString('en-US', { month: 'short' }),
              bookings: monthBookings.length,
              revenue: monthRevenue
            });
          }
          
          // Calculate experience performance
          const experienceMap = new Map();
          filteredBookings.forEach((booking: any) => {
            const expId = booking.experience?.id;
            if (expId) {
              if (!experienceMap.has(expId)) {
                experienceMap.set(expId, {
                  id: expId,
                  title: booking.experience.title,
                  bookings: 0,
                  revenue: 0,
                  ratings: []
                });
              }
              
              const exp = experienceMap.get(expId);
              exp.bookings++;
              if (booking.status === 'COMPLETED' || booking.status === 'CONFIRMED') {
                exp.revenue += booking.totalAmount;
              }
            }
          });
          
          // Add review ratings to experiences
          reviews.forEach((review: any) => {
            const expId = review.experience?.id;
            if (expId && experienceMap.has(expId)) {
              experienceMap.get(expId).ratings.push(review.rating);
            }
          });
          
          const experiencePerformance = Array.from(experienceMap.values()).map(exp => ({
            ...exp,
            averageRating: exp.ratings.length > 0 
              ? exp.ratings.reduce((sum: number, rating: number) => sum + rating, 0) / exp.ratings.length
              : 0
          }));
          
          // Get recent reviews
          const recentReviews = reviews
            .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .slice(0, 3)
            .map((review: any) => ({
              id: review.id,
              rating: review.rating,
              comment: review.comment,
              userName: review.user?.name || 'Anonymous',
              experienceTitle: review.experience?.title || 'Unknown Experience',
              createdAt: review.createdAt
            }));
          
          const analyticsData: AnalyticsData = {
            totalBookings,
            totalRevenue,
            averageRating: winery.rating || 0,
            totalReviews: reviews.length,
            bookingsByMonth: monthlyData,
            experiencePerformance,
            recentReviews
          };
          
          setAnalytics(analyticsData);
        }
      } catch (error: any) {
        console.error('Failed to fetch analytics:', error);
        if (error.message?.includes('Failed to fetch')) {
          setApiError('Backend API is not available. Please start the backend server on localhost:3001');
        } else {
          setApiError('Failed to load analytics data. Please try again.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [mounted, user, timeRange]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <svg
        key={i}
        className={`w-4 h-4 ${i < rating ? 'text-yellow-400' : 'text-gray-300'}`}
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
      </svg>
    ));
  };

  if (!mounted || loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
        <p className="mt-2 text-gray-600">Loading analytics...</p>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No analytics data available.</p>
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

      {/* Time Range Selector */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-900">Analytics Dashboard</h3>
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as any)}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-purple-500 focus:border-purple-500"
          >
            <option value="30days">Last 30 Days</option>
            <option value="90days">Last 90 Days</option>
            <option value="6months">Last 6 Months</option>
            <option value="1year">Last Year</option>
          </select>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500">Total Bookings</h3>
              <p className="text-2xl font-bold text-gray-900">{analytics.totalBookings}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500">Total Revenue</h3>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(analytics.totalRevenue)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500">Average Rating</h3>
              <p className="text-2xl font-bold text-gray-900">{analytics.averageRating}/5</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500">Total Reviews</h3>
              <p className="text-2xl font-bold text-gray-900">{analytics.totalReviews}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bookings & Revenue Chart */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Bookings & Revenue Trends</h3>
          <div className="space-y-4">
            {analytics.bookingsByMonth.map((data, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700 w-12">{data.month}</span>
                <div className="flex-1 mx-4">
                  <div className="flex items-center space-x-2">
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-purple-600 h-2 rounded-full" 
                        style={{ width: `${(data.bookings / 20) * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-sm text-gray-600 w-16">{data.bookings} bookings</span>
                  </div>
                </div>
                <span className="text-sm font-medium text-gray-900 w-20 text-right">
                  {formatCurrency(data.revenue)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Experience Performance */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Experience Performance</h3>
          <div className="space-y-4">
            {analytics.experiencePerformance.map((experience) => (
              <div key={experience.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-medium text-gray-900">{experience.title}</h4>
                  <div className="flex items-center space-x-1">
                    {renderStars(Math.round(experience.averageRating))}
                    <span className="text-sm text-gray-600 ml-1">{experience.averageRating}</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Bookings:</span>
                    <span className="font-medium text-gray-900 ml-1">{experience.bookings}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Revenue:</span>
                    <span className="font-medium text-gray-900 ml-1">{formatCurrency(experience.revenue)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Reviews */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Reviews</h3>
        <div className="space-y-4">
          {analytics.recentReviews.map((review) => (
            <div key={review.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center space-x-2">
                  <span className="font-medium text-gray-900">{review.userName}</span>
                  <div className="flex items-center space-x-1">
                    {renderStars(review.rating)}
                  </div>
                </div>
                <span className="text-sm text-gray-500">{formatDate(review.createdAt)}</span>
              </div>
              <p className="text-gray-700 text-sm mb-2">{review.comment}</p>
              <span className="text-xs text-gray-500">Experience: {review.experienceTitle}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Export Options */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Export Data</h3>
        <div className="flex space-x-4">
          <button 
            onClick={() => alert('Export feature coming soon!')}
            className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 text-sm"
          >
            Export Bookings (CSV)
          </button>
          <button 
            onClick={() => alert('Export feature coming soon!')}
            className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 text-sm"
          >
            Export Reviews (CSV)
          </button>
          <button 
            onClick={() => alert('Report generation coming soon!')}
            className="border border-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-50 text-sm"
          >
            Generate Report (PDF)
          </button>
        </div>
      </div>
    </div>
  );
}