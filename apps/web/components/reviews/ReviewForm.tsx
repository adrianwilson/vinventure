'use client';

import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';

interface ReviewFormProps {
  bookingId: string;
  wineryId: string;
  wineryName: string;
  onSubmit: (review: ReviewData) => Promise<void>;
  onCancel: () => void;
}

interface ReviewData {
  rating: number;
  comment: string;
  images: string[];
}

export default function ReviewForm({ 
  bookingId, 
  wineryId, 
  wineryName, 
  onSubmit, 
  onCancel 
}: ReviewFormProps) {
  const { user } = useAuth();
  const [rating, setRating] = useState<number>(0);
  const [hoveredRating, setHoveredRating] = useState<number>(0);
  const [comment, setComment] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!user) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">Please sign in to leave a review.</p>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (rating === 0) {
      setError('Please select a rating');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await onSubmit({
        rating,
        comment: comment.trim(),
        images
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit review');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    // In a real implementation, you would upload to S3 and get URLs
    // For now, we'll use placeholder URLs
    const newImageUrls = Array.from(files).map((file, index) => 
      `https://images.unsplash.com/photo-150607685717747007640${index}?w=400&h=300&fit=crop`
    );
    
    setImages(prev => [...prev, ...newImageUrls]);
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <h3 className="text-xl font-semibold text-gray-900 mb-6">
        Leave a Review for {wineryName}
      </h3>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Rating */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Rating *
          </label>
          <div className="flex items-center space-x-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoveredRating(star)}
                onMouseLeave={() => setHoveredRating(0)}
                className="text-2xl focus:outline-none focus:ring-2 focus:ring-purple-500 rounded"
              >
                <span
                  className={`${
                    star <= (hoveredRating || rating)
                      ? 'text-yellow-400'
                      : 'text-gray-300'
                  } transition-colors`}
                >
                  ★
                </span>
              </button>
            ))}
            <span className="ml-2 text-sm text-gray-600">
              {rating > 0 && (
                <span>
                  {rating} star{rating !== 1 ? 's' : ''}
                </span>
              )}
            </span>
          </div>
        </div>

        {/* Comment */}
        <div>
          <label htmlFor="comment" className="block text-sm font-medium text-gray-700 mb-2">
            Your Review
          </label>
          <textarea
            id="comment"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={4}
            placeholder="Share your experience at this winery..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
          />
        </div>

        {/* Image Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Photos (Optional)
          </label>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageUpload}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
          />
          
          {/* Image Preview */}
          {images.length > 0 && (
            <div className="mt-4 grid grid-cols-3 gap-4">
              {images.map((imageUrl, index) => (
                <div key={index} className="relative">
                  <img
                    src={imageUrl}
                    alt={`Review photo ${index + 1}`}
                    className="w-full h-24 object-cover rounded-md"
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex space-x-3">
          <button
            type="submit"
            disabled={isSubmitting || rating === 0}
            className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white py-2 px-4 rounded-md font-medium transition-colors"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Review'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-900 py-2 px-4 rounded-md font-medium transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}