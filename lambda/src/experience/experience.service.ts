import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { ExperienceType, UserRole, Prisma } from '@prisma/client';
import { CreateExperienceDto } from './dto/create-experience.dto';
import { UpdateExperienceDto } from './dto/update-experience.dto';

interface ExperienceFilters {
  wineryId?: string;
  type?: string;
  isActive?: boolean;
  page: number;
  limit: number;
}

@Injectable()
export class ExperienceService {
  constructor(private database: DatabaseService) {}

  async findAll(filters: ExperienceFilters) {
    const where: Prisma.ExperienceWhereInput = {};

    if (filters.wineryId) {
      where.wineryId = filters.wineryId;
    }

    if (filters.type) {
      where.type = filters.type as ExperienceType;
    }

    if (filters.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    const skip = (filters.page - 1) * filters.limit;

    const [experiences, total] = await Promise.all([
      this.database.experience.findMany({
        where,
        skip,
        take: filters.limit,
        include: {
          winery: {
            select: { id: true, name: true, city: true, region: true },
          },
          _count: {
            select: {
              bookings: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.database.experience.count({ where }),
    ]);

    return {
      experiences,
      pagination: {
        page: filters.page,
        limit: filters.limit,
        total,
        pages: Math.ceil(total / filters.limit),
      },
    };
  }

  async findOne(id: string) {
    const experience = await this.database.experience.findUnique({
      where: { id },
      include: {
        winery: {
          select: { id: true, name: true, city: true, region: true },
        },
        _count: {
          select: {
            bookings: true,
          },
        },
      },
    });

    if (!experience) {
      throw new NotFoundException('Experience not found');
    }

    return experience;
  }

  async create(userId: string, createData: CreateExperienceDto) {
    // Verify that the user owns the winery
    const winery = await this.database.winery.findUnique({
      where: { id: createData.wineryId },
    });

    if (!winery) {
      throw new NotFoundException('Winery not found');
    }

    if (winery.ownerId !== userId) {
      throw new ForbiddenException('You can only create experiences for your own winery');
    }

    // Validate the experience data
    if (createData.duration < 15 || createData.duration > 480) {
      throw new BadRequestException('Duration must be between 15 and 480 minutes');
    }

    if (createData.price < 0) {
      throw new BadRequestException('Price must be positive');
    }

    if (createData.maxGuests < 1 || createData.maxGuests > 50) {
      throw new BadRequestException('Max guests must be between 1 and 50');
    }

    if (!createData.availableDays || createData.availableDays.length === 0) {
      throw new BadRequestException('At least one available day must be selected');
    }

    const experience = await this.database.experience.create({
      data: {
        title: createData.title,
        description: createData.description,
        type: createData.type,
        duration: createData.duration,
        price: createData.price,
        maxGuests: createData.maxGuests,
        availableDays: createData.availableDays,
        startTime: createData.startTime,
        endTime: createData.endTime,
        images: createData.images,
        ageRestriction: createData.ageRestriction,
        requirements: createData.requirements,
        isActive: createData.isActive,
        wineryId: createData.wineryId,
      },
      include: {
        winery: {
          select: { id: true, name: true, city: true, region: true },
        },
      },
    });

    return experience;
  }

  async update(id: string, userId: string, userRole: UserRole, updateData: UpdateExperienceDto) {
    const experience = await this.database.experience.findUnique({
      where: { id },
      include: {
        winery: true,
      },
    });

    if (!experience) {
      throw new NotFoundException('Experience not found');
    }

    // Check permissions
    if (userRole !== UserRole.PLATFORM_ADMIN && experience.winery.ownerId !== userId) {
      throw new ForbiddenException('You can only update experiences for your own winery');
    }

    // Validate updated data
    if (updateData.duration !== undefined && (updateData.duration < 15 || updateData.duration > 480)) {
      throw new BadRequestException('Duration must be between 15 and 480 minutes');
    }

    if (updateData.price !== undefined && updateData.price < 0) {
      throw new BadRequestException('Price must be positive');
    }

    if (updateData.maxGuests !== undefined && (updateData.maxGuests < 1 || updateData.maxGuests > 50)) {
      throw new BadRequestException('Max guests must be between 1 and 50');
    }

    if (updateData.availableDays !== undefined && updateData.availableDays.length === 0) {
      throw new BadRequestException('At least one available day must be selected');
    }

    const updatedExperience = await this.database.experience.update({
      where: { id },
      data: updateData,
      include: {
        winery: {
          select: { id: true, name: true, city: true, region: true },
        },
      },
    });

    return updatedExperience;
  }

  async remove(id: string, userId: string, userRole: UserRole) {
    const experience = await this.database.experience.findUnique({
      where: { id },
      include: {
        winery: true,
      },
    });

    if (!experience) {
      throw new NotFoundException('Experience not found');
    }

    // Check permissions
    if (userRole !== UserRole.PLATFORM_ADMIN && experience.winery.ownerId !== userId) {
      throw new ForbiddenException('You can only delete experiences for your own winery');
    }

    // Check if there are any active bookings
    const activeBookings = await this.database.booking.count({
      where: {
        experienceId: id,
        status: {
          in: ['PENDING', 'CONFIRMED'],
        },
      },
    });

    if (activeBookings > 0) {
      throw new BadRequestException('Cannot delete experience with active bookings');
    }

    await this.database.experience.delete({
      where: { id },
    });

    return { message: 'Experience deleted successfully' };
  }

  async getAvailability(experienceId: string, date: string) {
    const experience = await this.database.experience.findUnique({
      where: { id: experienceId },
      include: {
        bookings: {
          where: {
            bookingDate: {
              gte: new Date(date),
              lt: new Date(new Date(date).getTime() + 24 * 60 * 60 * 1000),
            },
            status: {
              in: ['PENDING', 'CONFIRMED'],
            },
          },
        },
      },
    });

    if (!experience) {
      throw new NotFoundException('Experience not found');
    }

    // Check if the experience is available on this day of the week
    const dayOfWeek = new Date(date).toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    const isAvailableDay = experience.availableDays.includes(dayOfWeek);

    if (!isAvailableDay) {
      return {
        available: false,
        reason: 'Experience not available on this day',
        maxGuests: experience.maxGuests,
        bookedGuests: 0,
      };
    }

    // Calculate total booked guests for this date
    const bookedGuests = experience.bookings.reduce((total, booking) => total + booking.guestCount, 0);
    const availableSpots = experience.maxGuests - bookedGuests;

    return {
      available: availableSpots > 0,
      availableSpots,
      maxGuests: experience.maxGuests,
      bookedGuests,
      price: experience.price,
      duration: experience.duration,
      startTime: experience.startTime,
      endTime: experience.endTime,
    };
  }
}
