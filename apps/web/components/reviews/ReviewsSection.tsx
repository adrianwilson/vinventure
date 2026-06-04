'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import ReviewSummary from './ReviewSummary';
import ReviewList from './ReviewList';
import ReviewForm from './ReviewForm';

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  images: string[];
  createdAt: string;
  user: {
    id: string;
    displayName: string | null;
    email: string;
  };
}

interface ReviewData {
  rating: number;
  comment: string;
  images: string[];
}

interface ReviewsSectionProps {
  wineryId: string;
  wineryName: string;
  userBookings?: Array<{
    id: string;
    status: string;
    hasReview: boolean;
  }>;
}

// Mock data for development
const mockReviews: Review[] = [
  {
    id: '1',
    rating: 5,
    comment: 'Absolutely amazing experience! The wine tasting was exceptional and the staff was incredibly knowledgeable. The vineyard views were breathtaking and made for a perfect afternoon.',
    images: [
      'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1474552226712-ac0f0961a954?w=400&h=300&fit=crop'
    ],
    createdAt: '2024-01-20T15:30:00Z',
    user: {
      id: 'user1',
      displayName: 'Sarah Johnson',
      email: 'sarah@example.com'
    }
  },
  {
    id: '2',
    rating: 4,
    comment: 'Great wine selection and beautiful setting. The tour was informative and the tasting room staff was friendly. Would definitely recommend to wine lovers!',
    images: ['https://images.unsplash.com/photo-1510076857177-7470076d4098?w=400&h=300&fit=crop'],
    createdAt: '2024-01-18T14:20:00Z',
    user: {
      id: 'user2',
      displayName: 'Michael Chen',
      email: 'michael@example.com'
    }
  },
  {
    id: '3',
    rating: 5,
    comment: 'Perfect for a romantic getaway! The wine was outstanding and the ambiance was exactly what we were looking for.',
    images: [],
    createdAt: '2024-01-15T12:15:00Z',
    user: {
      id: 'user3',
      displayName: null,
      email: 'couple@example.com'
    }
  }
];

const mockRatingDistribution = {
  5: 2,
  4: 1,
  3: 0,
  2: 0,
  1: 0
};

export default function ReviewsSection({ 
  wineryId, 
  wineryName, 
  userBookings = [] 
}: ReviewsSectionProps) {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<string | null>(null);
  const [averageRating, setAverageRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);

  // Load reviews on component mount
  useEffect(() => {
    loadReviews();
  }, [wineryId]);

  const loadReviews = async () => {
    setLoading(true);
    try {
      // In a real implementation, this would be an API call
      // const response = await fetch(`/api/wineries/${wineryId}/reviews`);
      // const data = await response.json();
      
      // Using mock data for now
      await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API delay
      setReviews(mockReviews);
      setTotalReviews(mockReviews.length);
      setAverageRating(
        mockReviews.reduce((sum, review) => sum + review.rating, 0) / mockReviews.length
      );
    } catch (error) {
      console.error('Failed to load reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitReview = async (reviewData: ReviewData) => {
    if (!selectedBooking) return;

    try {
      // In a real implementation, this would be an API call
      // const response = await fetch(`/api/bookings/${selectedBooking}/review`, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(reviewData)
      // });
      
      // Mock successful submission
      if (!user) return;

      const newReview: Review = {
        id: `review_${Date.now()}`,
        ...reviewData,
        createdAt: new Date().toISOString(),
        user: {
          id: user.sub || user.username,
          displayName: user.displayName ?? null,
          email: user.email
        }
      };

      setReviews(prev => [newReview, ...prev]);
      setTotalReviews(prev => prev + 1);
      setAverageRating(prev => {
        const newTotal = totalReviews + 1;
        return ((prev * totalReviews) + reviewData.rating) / newTotal;
      });

      setShowReviewForm(false);
      setSelectedBooking(null);
    } catch {
      throw new Error('Failed to submit review');
    }
  };

  // Find eligible bookings (completed and without reviews)
  const eligibleBookings = userBookings.filter(
    booking => booking.status === 'CONFIRMED' && !booking.hasReview
  );

  const canLeaveReview = user && eligibleBookings.length > 0;

  return (
    <div className="space-y-8">
      {/* Reviews Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Reviews & Ratings</h2>
        
        {canLeaveReview && !showReviewForm && (
          <button
            onClick={() => {
              setSelectedBooking(eligibleBookings[0].id);
              setShowReviewForm(true);
            }}
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md font-medium transition-colors"
          >
            Write a Review
          </button>
        )}
      </div>

      {/* Review Form */}
      {showReviewForm && selectedBooking && (
        <ReviewForm
          bookingId={selectedBooking}
          wineryId={wineryId}
          wineryName={wineryName}
          onSubmit={handleSubmitReview}
          onCancel={() => {
            setShowReviewForm(false);
            setSelectedBooking(null);
          }}
        />
      )}

      {/* Review Summary */}
      <ReviewSummary
        averageRating={averageRating}
        totalReviews={totalReviews}
        ratingDistribution={mockRatingDistribution}
      />

      {/* Reviews List */}
      <div>
        <h3 className="text-xl font-semibold text-gray-900 mb-6">
          Customer Reviews ({totalReviews})
        </h3>
        <ReviewList
          reviews={reviews}
          loading={loading}
          canLoadMore={false}
        />
      </div>

      {/* No Reviews CTA */}
      {totalReviews === 0 && !loading && !showReviewForm && (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <div className="text-gray-400 mb-4">
            <svg className="mx-auto h-16 w-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No reviews yet</h3>
          <p className="text-gray-600 mb-4">
            Help others discover this amazing winery by sharing your experience!
          </p>
          {canLeaveReview && (
            <button
              onClick={() => {
                setSelectedBooking(eligibleBookings[0].id);
                setShowReviewForm(true);
              }}
              className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-md font-medium transition-colors"
            >
              Write the First Review
            </button>
          )}
        </div>
      )}
    </div>
  );
}