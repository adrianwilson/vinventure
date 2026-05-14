import { Injectable, NotFoundException, ForbiddenException, ConflictException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { WineryStatus, UserRole, Prisma } from '@prisma/client';
import { CreateWineryDto } from './dto/create-winery.dto';
import { UpdateWineryDto } from './dto/update-winery.dto';

interface WineryFilters {
  search?: string;
  region?: string;
  wineTypes?: string[];
  sustainable?: boolean;
  featured?: boolean;
  status?: WineryStatus;
  latitude?: number;
  longitude?: number;
  radius?: number; // in km
  page?: number;
  limit?: number;
}

@Injectable()
export class WineryService {
  constructor(private database: DatabaseService) {}

  async findAll(filters: WineryFilters = {}) {
    const {
      search,
      region,
      wineTypes,
      sustainable,
      featured,
      status = WineryStatus.APPROVED,
      latitude,
      longitude,
      radius,
      page = 1,
      limit = 20,
    } = filters;

    const skip = (page - 1) * limit;
    
    // Build where clause
    const where: Prisma.WineryWhereInput = {
      status,
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
          { city: { contains: search, mode: 'insensitive' } },
          { region: { contains: search, mode: 'insensitive' } },
        ],
      }),
      ...(region && { region: { contains: region, mode: 'insensitive' } }),
      ...(wineTypes && wineTypes.length > 0 && { 
        wineTypes: { 
          hasSome: wineTypes 
        } 
      }),
      ...(typeof sustainable === 'boolean' && { sustainable }),
      ...(typeof featured === 'boolean' && { featured }),
    };

    // Location-based filtering (simple distance calculation)
    if (latitude && longitude && radius) {
      // This is a simplified version - in production, you'd use PostGIS or similar
      const latRange = radius / 111; // Rough conversion: 1 degree ≈ 111 km
      const lngRange = radius / (111 * Math.cos(latitude * Math.PI / 180));
      
      where.latitude = {
        gte: latitude - latRange,
        lte: latitude + latRange,
      };
      where.longitude = {
        gte: longitude - lngRange,
        lte: longitude + lngRange,
      };
    }

    const [wineries, total] = await Promise.all([
      this.database.winery.findMany({
        where,
        include: {
          owner: {
            select: { id: true, name: true, email: true },
          },
          experiences: {
            where: { isActive: true },
            take: 3, // Preview of experiences
          },
          _count: {
            select: {
              reviews: true,
              bookings: true,
            },
          },
        },
        orderBy: [
          { featured: 'desc' },
          { rating: 'desc' },
          { createdAt: 'desc' },
        ],
        skip,
        take: limit,
      }),
      this.database.winery.count({ where }),
    ]);

    return {
      wineries,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string, includeAll = false) {
    const winery = await this.database.winery.findUnique({
      where: { id },
      include: {
        owner: {
          select: { id: true, name: true, email: true },
        },
        experiences: {
          where: includeAll ? {} : { isActive: true },
          orderBy: { createdAt: 'desc' },
        },
        reviews: {
          include: {
            user: {
              select: { id: true, name: true, avatarUrl: true },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: includeAll ? undefined : 10,
        },
        _count: {
          select: {
            reviews: true,
            bookings: true,
            favorites: true,
          },
        },
      },
    });

    if (!winery) {
      throw new NotFoundException('Winery not found');
    }

    return winery;
  }

  async create(userId: string, createWineryDto: CreateWineryDto) {
    // Check if user already has a winery
    const existingWinery = await this.database.winery.findFirst({
      where: { ownerId: userId },
    });

    if (existingWinery) {
      throw new ConflictException('User already owns a winery');
    }

    // Update user role to WINERY_ADMIN
    await this.database.user.update({
      where: { id: userId },
      data: { role: UserRole.WINERY_ADMIN },
    });

    const winery = await this.database.winery.create({
      data: {
        ...createWineryDto,
        ownerId: userId,
        status: WineryStatus.PENDING,
        wineTypes: createWineryDto.wineTypes || [],
        images: createWineryDto.images || [],
      },
      include: {
        owner: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    return winery;
  }

  async update(id: string, userId: string, userRole: UserRole, updateData: UpdateWineryDto) {
    const winery = await this.database.winery.findUnique({
      where: { id },
    });

    if (!winery) {
      throw new NotFoundException('Winery not found');
    }

    // Check permissions
    if (userRole !== UserRole.PLATFORM_ADMIN && winery.ownerId !== userId) {
      throw new ForbiddenException('You can only update your own winery');
    }

    const updatedWinery = await this.database.winery.update({
      where: { id },
      data: {
        ...updateData,
        ...(updateData.wineTypes && { wineTypes: updateData.wineTypes }),
        ...(updateData.images && { images: updateData.images }),
      },
      include: {
        owner: {
          select: { id: true, name: true, email: true },
        },
        experiences: {
          where: { isActive: true },
        },
      },
    });

    return updatedWinery;
  }

  async remove(id: string, userId: string, userRole: UserRole) {
    const winery = await this.database.winery.findUnique({
      where: { id },
    });

    if (!winery) {
      throw new NotFoundException('Winery not found');
    }

    // Check permissions
    if (userRole !== UserRole.PLATFORM_ADMIN && winery.ownerId !== userId) {
      throw new ForbiddenException('You can only delete your own winery');
    }

    await this.database.winery.delete({
      where: { id },
    });

    return { message: 'Winery deleted successfully' };
  }

  async updateStatus(id: string, status: WineryStatus) {
    const winery = await this.database.winery.findUnique({
      where: { id },
    });

    if (!winery) {
      throw new NotFoundException('Winery not found');
    }

    const updatedWinery = await this.database.winery.update({
      where: { id },
      data: { status },
      include: {
        owner: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    return updatedWinery;
  }

  async getWineriesByOwner(ownerId: string) {
    const wineries = await this.database.winery.findMany({
      where: { ownerId },
      include: {
        experiences: {
          where: { isActive: true },
        },
        _count: {
          select: {
            reviews: true,
            bookings: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return wineries;
  }

  async updateRating(wineryId: string) {
    // Calculate average rating from reviews
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
        data: { rating: Math.round(averageRating * 10) / 10 }, // Round to 1 decimal
      });
    }

    return { averageRating, reviewCount };
  }
}