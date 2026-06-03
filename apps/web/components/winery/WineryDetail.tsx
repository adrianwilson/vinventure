'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Winery, Experience, EXPERIENCE_TYPE_LABELS } from '../../types/winery';
import ExperienceBooking from './ExperienceBooking';
import ReviewsSection from '../reviews/ReviewsSection';
import FavoriteButton from '../favorites/FavoriteButton';
import { useFavorites } from '../../contexts/FavoritesContext';

interface WineryDetailProps {
  winery: Winery;
}

// Icon components
const MapPinIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const StarIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="currentColor" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
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

const PhoneIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
  </svg>
);

const GlobeIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
  </svg>
);

export default function WineryDetail({ winery }: WineryDetailProps) {
  const { isFavorite, toggleFavorite } = useFavorites();
  const [selectedExperience, setSelectedExperience] = useState<Experience | null>(null);
  const [showBooking, setShowBooking] = useState(false);

  const handleBookExperience = (experience: Experience) => {
    setSelectedExperience(experience);
    setShowBooking(true);
  };

  const handleCloseBooking = () => {
    setShowBooking(false);
    setSelectedExperience(null);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link
            href="/discover"
            className="text-purple-600 hover:text-purple-700 font-medium inline-flex items-center"
          >
            ← Back to Discovery
          </Link>
        </div>
      </div>

      {/* Hero Section */}
      <div className="relative h-64 md:h-96 bg-gray-300">
        {winery.bannerUrl || winery.images?.[0] ? (
          <Image
            unoptimized
            src={winery.bannerUrl || winery.images[0]}
            alt={winery.name}
            fill
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            <svg className="w-24 h-24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}
        <div className="absolute inset-0 bg-black bg-opacity-30" />
        
        {/* Badges */}
        <div className="absolute top-4 left-4 flex gap-2">
          {winery.featured && (
            <span className="bg-purple-600 text-white px-3 py-1 rounded-full text-sm font-semibold">
              Featured
            </span>
          )}
          {winery.sustainable && (
            <span className="bg-green-600 text-white px-3 py-1 rounded-full text-sm font-semibold">
              Sustainable
            </span>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Title and Rating */}
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <h1 className="text-3xl font-bold text-gray-900">{winery.name}</h1>
                </div>
                <div className="flex items-center gap-4">
                  {winery.rating && (
                    <div className="flex items-center gap-2">
                      <StarIcon className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                      <span className="text-lg font-semibold">{winery.rating.toFixed(1)}</span>
                      {winery._count?.reviews && (
                        <span className="text-gray-600">
                          ({winery._count.reviews} reviews)
                        </span>
                      )}
                    </div>
                  )}
                  <FavoriteButton
                    wineryId={winery.id}
                    isFavorite={isFavorite(winery.id)}
                    onToggleFavorite={toggleFavorite}
                    size="lg"
                  />
                </div>
              </div>

              {/* Location */}
              <div className="flex items-center gap-2 text-gray-600 mb-4">
                <MapPinIcon className="h-5 w-5" />
                <span>{winery.address}, {winery.city}, {winery.region}</span>
              </div>

              {/* Description */}
              <p className="text-gray-700 leading-relaxed mb-4">
                {winery.description}
              </p>

              {/* Wine Types */}
              <div className="flex flex-wrap gap-2">
                {winery.wineTypes.map(type => (
                  <span
                    key={type}
                    className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm"
                  >
                    {type}
                  </span>
                ))}
              </div>
            </div>

            {/* Experiences */}
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Experiences</h2>
              
              {winery.experiences && winery.experiences.length > 0 ? (
                <div className="space-y-6">
                  {winery.experiences.map((experience) => (
                    <div key={experience.id} className="border border-gray-200 rounded-lg p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-xl font-semibold text-gray-900 mb-2">
                            {experience.title}
                          </h3>
                          <span className="inline-block px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                            {EXPERIENCE_TYPE_LABELS[experience.type]}
                          </span>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-gray-900">
                            ${experience.price}
                          </div>
                          <div className="text-sm text-gray-600">per person</div>
                        </div>
                      </div>

                      <p className="text-gray-700 mb-4">{experience.description}</p>

                      {/* Experience Details */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div className="flex items-center gap-2 text-gray-600">
                          <ClockIcon className="h-4 w-4" />
                          <span>{experience.duration} minutes</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-600">
                          <UsersIcon className="h-4 w-4" />
                          <span>Up to {experience.maxGuests} guests</span>
                        </div>
                        {experience.rating && (
                          <div className="flex items-center gap-2 text-gray-600">
                            <StarIcon className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                            <span>{experience.rating.toFixed(1)} rating</span>
                          </div>
                        )}
                      </div>

                      {/* Available Days */}
                      <div className="mb-4">
                        <span className="text-sm font-medium text-gray-700">Available: </span>
                        <span className="text-sm text-gray-600">
                          {experience.availableDays.map(day => 
                            day.charAt(0).toUpperCase() + day.slice(1)
                          ).join(', ')}
                        </span>
                        <span className="text-sm text-gray-600 ml-2">
                          ({experience.startTime} - {experience.endTime})
                        </span>
                      </div>

                      {/* Requirements */}
                      {experience.requirements && (
                        <div className="mb-4">
                          <span className="text-sm font-medium text-gray-700">Requirements: </span>
                          <span className="text-sm text-gray-600">{experience.requirements}</span>
                        </div>
                      )}

                      {/* Age Restriction */}
                      {experience.ageRestriction && (
                        <div className="mb-4">
                          <span className="text-sm font-medium text-gray-700">Age Restriction: </span>
                          <span className="text-sm text-gray-600">{experience.ageRestriction}+</span>
                        </div>
                      )}

                      {/* Book Button */}
                      <button
                        onClick={() => handleBookExperience(experience)}
                        className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 px-4 rounded-md font-medium transition-colors"
                      >
                        Book Experience
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-600">No experiences available at this time.</p>
              )}
            </div>

            {/* Reviews Section */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <ReviewsSection 
                wineryId={winery.id} 
                wineryName={winery.name}
                userBookings={[]}
              />
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            {/* Contact Information */}
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h3>
              
              <div className="space-y-3">
                {winery.phone && (
                  <div className="flex items-center gap-3">
                    <PhoneIcon className="h-5 w-5 text-gray-400" />
                    <a href={`tel:${winery.phone}`} className="text-purple-600 hover:text-purple-700">
                      {winery.phone}
                    </a>
                  </div>
                )}
                
                {winery.website && (
                  <div className="flex items-center gap-3">
                    <GlobeIcon className="h-5 w-5 text-gray-400" />
                    <a 
                      href={winery.website} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-purple-600 hover:text-purple-700"
                    >
                      Visit Website
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* Winery Info */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Winery Information</h3>
              
              <div className="space-y-3">
                {winery.foundedYear && (
                  <div>
                    <span className="text-sm font-medium text-gray-700">Founded: </span>
                    <span className="text-sm text-gray-600">{winery.foundedYear}</span>
                  </div>
                )}
                
                <div>
                  <span className="text-sm font-medium text-gray-700">Region: </span>
                  <span className="text-sm text-gray-600">{winery.region}</span>
                </div>
                
                {winery.sustainable && (
                  <div>
                    <span className="text-sm font-medium text-gray-700">Sustainability: </span>
                    <span className="text-sm text-green-600">Certified Sustainable</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Booking Modal */}
      {showBooking && selectedExperience && (
        <ExperienceBooking
          winery={winery}
          experience={selectedExperience}
          onClose={handleCloseBooking}
        />
      )}
    </div>
  );
}