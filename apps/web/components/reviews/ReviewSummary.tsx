'use client';

interface ReviewSummaryProps {
  averageRating: number;
  totalReviews: number;
  ratingDistribution?: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
}

function StarRating({ rating, size = 'md' }: { rating: number; size?: 'sm' | 'md' | 'lg' }) {
  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-xl'
  };

  return (
    <div className="flex items-center">
      {[1, 2, 3, 4, 5].map((star) => (
        <span
          key={star}
          className={`${sizeClasses[size]} ${
            star <= Math.round(rating) ? 'text-yellow-400' : 'text-gray-300'
          }`}
        >
          ★
        </span>
      ))}
    </div>
  );
}

export default function ReviewSummary({ 
  averageRating, 
  totalReviews, 
  ratingDistribution 
}: ReviewSummaryProps) {
  if (totalReviews === 0) {
    return (
      <div className="bg-gray-50 rounded-lg p-6 text-center">
        <StarRating rating={0} size="lg" />
        <p className="text-lg font-semibold text-gray-900 mt-2">No ratings yet</p>
        <p className="text-gray-600">Be the first to leave a review!</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border p-6">
      <div className="flex items-center space-x-6">
        {/* Overall Rating */}
        <div className="text-center">
          <div className="text-4xl font-bold text-gray-900 mb-1">
            {averageRating.toFixed(1)}
          </div>
          <StarRating rating={averageRating} size="lg" />
          <p className="text-sm text-gray-600 mt-1">
            {totalReviews} review{totalReviews !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Rating Distribution */}
        {ratingDistribution && (
          <div className="flex-1">
            <h4 className="font-medium text-gray-900 mb-3">Rating breakdown</h4>
            <div className="space-y-2">
              {[5, 4, 3, 2, 1].map((rating) => {
                const count = ratingDistribution[rating as keyof typeof ratingDistribution] || 0;
                const percentage = totalReviews > 0 ? (count / totalReviews) * 100 : 0;
                
                return (
                  <div key={rating} className="flex items-center space-x-3">
                    <span className="text-sm text-gray-600 w-4">{rating}</span>
                    <span className="text-yellow-400 text-sm">★</span>
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-yellow-400 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="text-sm text-gray-600 w-8">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Quick Stats */}
      <div className="mt-6 pt-6 border-t grid grid-cols-3 gap-4 text-center">
        <div>
          <div className="text-lg font-semibold text-gray-900">
            {((ratingDistribution?.[5] || 0) / Math.max(totalReviews, 1) * 100).toFixed(0)}%
          </div>
          <div className="text-sm text-gray-600">5-star reviews</div>
        </div>
        <div>
          <div className="text-lg font-semibold text-gray-900">
            {(((ratingDistribution?.[4] || 0) + (ratingDistribution?.[5] || 0)) / Math.max(totalReviews, 1) * 100).toFixed(0)}%
          </div>
          <div className="text-sm text-gray-600">4+ stars</div>
        </div>
        <div>
          <div className="text-lg font-semibold text-gray-900">
            {averageRating >= 4 ? 'Excellent' : averageRating >= 3 ? 'Good' : averageRating >= 2 ? 'Fair' : 'Poor'}
          </div>
          <div className="text-sm text-gray-600">Overall rating</div>
        </div>
      </div>
    </div>
  );
}