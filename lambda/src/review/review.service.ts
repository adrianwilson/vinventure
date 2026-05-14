import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { UserRole, Prisma } from '@prisma/client';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';

interface ReviewFilters {
  wineryId?: string;
  userId?: string;
  rating?: number;
  page?: number;
  limit?: number;
}

@Injectable()
export class ReviewService {
  constructor(private database: DatabaseService) {}

  async create(userId: string, createReviewDto: CreateReviewDto) {
    const { bookingId, rating, comment, images } = createReviewDto;

    // Validate rating
    if (rating < 1 || rating > 5) {
      throw new BadRequestException('Rating must be between 1 and 5');
    }

    // Get booking details and verify ownership
    const booking = await this.database.booking.findUnique({
      where: { id: bookingId },
      include: {
        winery: true,
        review: true, // Check if review already exists
      },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    // Only the booking owner can create a review
    if (booking.userId !== userId) {
      throw new ForbiddenException('You can only review your own bookings');
    }

    // Can only review completed bookings
    if (booking.status !== 'COMPLETED') {
      throw new BadRequestException('You can only review completed bookings');
    }

    // Check if review already exists
    if (booking.review) {
      throw new BadRequestException('A review already exists for this booking');
    }

    // Create the review
    const review = await this.database.review.create({
      data: {
        userId,
        wineryId: booking.wineryId,
        bookingId,
        rating,
        comment,
        images: images || [],
      },
      include: {
        user: {
          select: { id: true, name: true, avatarUrl: true },
        },
        winery: {
          select: { id: true, name: true },
        },
        booking: {
          select: { id: true, bookingDate: true },
        },
      },
    });

    // Update winery rating after creating review
    await this.updateWineryRating(booking.wineryId);

    return review;
  }

  async findAll(filters: ReviewFilters = {}) {
    const {
      wineryId,
      userId,
      rating,
      page = 1,
      limit = 20,
    } = filters;

    const skip = (page - 1) * limit;

    const where: Prisma.ReviewWhereInput = {
      ...(wineryId && { wineryId }),
      ...(userId && { userId }),
      ...(rating && { rating }),
    };

    const [reviews, total] = await Promise.all([
      this.database.review.findMany({
        where,
        include: {
          user: {
            select: { id: true, name: true, avatarUrl: true },
          },
          winery: {
            select: { id: true, name: true, logoUrl: true },
          },
          booking: {
            select: { id: true, bookingDate: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.database.review.count({ where }),
    ]);

    return {
      reviews,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const review = await this.database.review.findUnique({
      where: { id },
      include: {
        user: {
          select: { id: true, name: true, avatarUrl: true },
        },
        winery: {
          select: { id: true, name: true, logoUrl: true },
        },
        booking: {
          select: { id: true, bookingDate: true, guestCount: true },
          include: {
            experience: {
              select: { id: true, title: true, type: true },
            },
          },
        },
      },
    });

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    return review;
  }

  async update(id: string, userId: string, userRole: UserRole, updateReviewDto: UpdateReviewDto) {
    const review = await this.database.review.findUnique({
      where: { id },
      include: { winery: true },
    });

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    // Only review owner or platform admin can update
    if (userRole !== UserRole.PLATFORM_ADMIN && review.userId !== userId) {
      throw new ForbiddenException('You can only update your own reviews');
    }

    // Validate rating if provided
    if (updateReviewDto.rating && (updateReviewDto.rating < 1 || updateReviewDto.rating > 5)) {
      throw new BadRequestException('Rating must be between 1 and 5');
    }

    const updatedReview = await this.database.review.update({
      where: { id },
      data: {
        ...(updateReviewDto.rating && { rating: updateReviewDto.rating }),
        ...(updateReviewDto.comment !== undefined && { comment: updateReviewDto.comment }),
        ...(updateReviewDto.images && { images: updateReviewDto.images }),
      },
      include: {
        user: {
          select: { id: true, name: true, avatarUrl: true },
        },
        winery: {
          select: { id: true, name: true },
        },
      },
    });

    // Update winery rating if rating was changed
    if (updateReviewDto.rating) {
      await this.updateWineryRating(review.wineryId);
    }

    return updatedReview;
  }

  async remove(id: string, userId: string, userRole: UserRole) {
    const review = await this.database.review.findUnique({
      where: { id },
    });

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    // Only review owner or platform admin can delete
    if (userRole !== UserRole.PLATFORM_ADMIN && review.userId !== userId) {
      throw new ForbiddenException('You can only delete your own reviews');
    }

    await this.database.review.delete({
      where: { id },
    });

    // Update winery rating after deleting review
    await this.updateWineryRating(review.wineryId);

    return { message: 'Review deleted successfully' };
  }

  async getWineryReviews(wineryId: string, filters: Partial<ReviewFilters> = {}) {
    const { rating, page = 1, limit = 20 } = filters;
    const skip = (page - 1) * limit;

    const where: Prisma.ReviewWhereInput = {
      wineryId,
      ...(rating && { rating }),
    };

    const [reviews, total, stats] = await Promise.all([
      this.database.review.findMany({
        where,
        include: {
          user: {
            select: { id: true, name: true, avatarUrl: true },
          },
          booking: {
            select: { id: true, bookingDate: true, guestCount: true },
            include: {
              experience: {
                select: { id: true, title: true, type: true },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.database.review.count({ where }),
      this.getWineryReviewStats(wineryId),
    ]);

    return {
      reviews,
      stats,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getUserReviews(userId: string, filters: Partial<ReviewFilters> = {}) {
    const { page = 1, limit = 20 } = filters;
    const skip = (page - 1) * limit;

    const [reviews, total] = await Promise.all([
      this.database.review.findMany({
        where: { userId },
        include: {
          winery: {
            select: { id: true, name: true, logoUrl: true },
          },
          booking: {
            select: { id: true, bookingDate: true },
            include: {
              experience: {
                select: { id: true, title: true, type: true },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.database.review.count({ where: { userId } }),
    ]);

    return {
      reviews,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getWineryReviewStats(wineryId: string) {
    const result = await this.database.review.aggregate({
      where: { wineryId },
      _avg: { rating: true },
      _count: { rating: true },
    });

    // Get rating distribution
    const ratingDistribution = await Promise.all([
      this.database.review.count({ where: { wineryId, rating: 5 } }),
      this.database.review.count({ where: { wineryId, rating: 4 } }),
      this.database.review.count({ where: { wineryId, rating: 3 } }),
      this.database.review.count({ where: { wineryId, rating: 2 } }),
      this.database.review.count({ where: { wineryId, rating: 1 } }),
    ]);

    return {
      averageRating: result._avg.rating ? Math.round(result._avg.rating * 10) / 10 : 0,
      totalReviews: result._count.rating,
      ratingDistribution: {
        5: ratingDistribution[0],
        4: ratingDistribution[1],
        3: ratingDistribution[2],
        2: ratingDistribution[3],
        1: ratingDistribution[4],
      },
    };
  }

  private async updateWineryRating(wineryId: string) {
    const result = await this.database.review.aggregate({
      where: { wineryId },
      _avg: { rating: true },
      _count: { rating: true },
    });

    const averageRating = result._avg.rating;
    const reviewCount = result._count.rating;

    if (reviewCount > 0 && averageRating !== null) {
      await this.database.winery.update({
        where: { id: wineryId },
        data: { rating: Math.round(averageRating * 10) / 10 },
      });
    } else {
      // No reviews, set rating to null
      await this.database.winery.update({
        where: { id: wineryId },
        data: { rating: null },
      });
    }

    return { averageRating, reviewCount };
  }

  async moderateReview(id: string, action: 'approve' | 'hide' | 'delete', moderatorId: string) {
    const review = await this.database.review.findUnique({
      where: { id },
    });

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    switch (action) {
      case 'approve':
        // In a full implementation, you might have a 'status' field
        return { message: 'Review approved' };

      case 'hide':
        // In a full implementation, you might have a 'hidden' field
        return { message: 'Review hidden' };

      case 'delete':
        await this.database.review.delete({ where: { id } });
        await this.updateWineryRating(review.wineryId);
        return { message: 'Review deleted by moderator' };

      default:
        throw new BadRequestException('Invalid moderation action');
    }
  }
}
