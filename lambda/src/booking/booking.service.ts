import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { BookingStatus, UserRole, Prisma } from '@prisma/client';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';

interface BookingFilters {
  status?: BookingStatus;
  wineryId?: string;
  experienceId?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

@Injectable()
export class BookingService {
  constructor(private database: DatabaseService) {}

  async create(userId: string, createBookingDto: CreateBookingDto) {
    const { experienceId, bookingDate, guestCount, guestName, guestEmail, guestPhone, specialRequests } = createBookingDto;

    // Get experience details
    const experience = await this.database.experience.findUnique({
      where: { id: experienceId, isActive: true },
      include: { winery: true },
    });

    if (!experience) {
      throw new NotFoundException('Experience not found or not active');
    }

    // Validate guest count
    if (guestCount > experience.maxGuests) {
      throw new BadRequestException(`Maximum ${experience.maxGuests} guests allowed for this experience`);
    }

    // Check if booking date is in the future
    const bookingDateTime = new Date(bookingDate);
    if (bookingDateTime <= new Date()) {
      throw new BadRequestException('Booking date must be in the future');
    }

    // Check availability (simple check - in production you'd have more complex availability logic)
    const existingBookings = await this.database.booking.findMany({
      where: {
        experienceId,
        bookingDate: bookingDateTime,
        status: { in: [BookingStatus.PENDING, BookingStatus.CONFIRMED] },
      },
    });

    const totalBooked = existingBookings.reduce((sum, booking) => sum + booking.guestCount, 0);
    if (totalBooked + guestCount > experience.maxGuests) {
      throw new BadRequestException('Not enough availability for this date');
    }

    // Calculate total amount
    const totalAmount = experience.price * guestCount;

    // Create booking
    const booking = await this.database.booking.create({
      data: {
        userId,
        wineryId: experience.wineryId,
        experienceId,
        bookingDate: bookingDateTime,
        guestCount,
        totalAmount,
        guestName,
        guestEmail,
        guestPhone,
        specialRequests,
        status: BookingStatus.PENDING,
      },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
        winery: {
          select: { id: true, name: true, email: true },
        },
        experience: true,
      },
    });

    return booking;
  }

  async findAll(filters: BookingFilters = {}) {
    const {
      status,
      wineryId,
      experienceId,
      startDate,
      endDate,
      page = 1,
      limit = 20,
    } = filters;

    const skip = (page - 1) * limit;

    const where: Prisma.BookingWhereInput = {
      ...(status && { status }),
      ...(wineryId && { wineryId }),
      ...(experienceId && { experienceId }),
      ...(startDate || endDate) && {
        bookingDate: {
          ...(startDate && { gte: new Date(startDate) }),
          ...(endDate && { lte: new Date(endDate) }),
        },
      },
    };

    const [bookings, total] = await Promise.all([
      this.database.booking.findMany({
        where,
        include: {
          user: {
            select: { id: true, name: true, email: true },
          },
          winery: {
            select: { id: true, name: true },
          },
          experience: {
            select: { id: true, title: true, type: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.database.booking.count({ where }),
    ]);

    return {
      bookings,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string, userId: string, userRole: UserRole) {
    const booking = await this.database.booking.findUnique({
      where: { id },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
        winery: {
          select: { id: true, name: true, email: true, phone: true },
        },
        experience: true,
        review: true,
      },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    // Check permissions
    if (userRole === UserRole.GUEST && booking.userId !== userId) {
      throw new ForbiddenException('You can only view your own bookings');
    }

    if (userRole === UserRole.WINERY_ADMIN) {
      // Check if user owns the winery
      const winery = await this.database.winery.findFirst({
        where: { id: booking.wineryId, ownerId: userId },
      });

      if (!winery) {
        throw new ForbiddenException('You can only view bookings for your own winery');
      }
    }

    return booking;
  }

  async update(id: string, userId: string, userRole: UserRole, updateBookingDto: UpdateBookingDto) {
    const booking = await this.database.booking.findUnique({
      where: { id },
      include: { experience: true },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    // Check permissions
    if (userRole === UserRole.GUEST && booking.userId !== userId) {
      throw new ForbiddenException('You can only update your own bookings');
    }

    if (userRole === UserRole.WINERY_ADMIN) {
      // Check if user owns the winery
      const winery = await this.database.winery.findFirst({
        where: { id: booking.wineryId, ownerId: userId },
      });

      if (!winery) {
        throw new ForbiddenException('You can only update bookings for your own winery');
      }
    }

    // Guests can only update certain fields and only if booking is pending
    if (userRole === UserRole.GUEST) {
      if (booking.status !== BookingStatus.PENDING) {
        throw new BadRequestException('Can only update pending bookings');
      }

      // Restrict what guests can update
      const allowedUpdates: Prisma.BookingUpdateInput = {
        guestName: updateBookingDto.guestName,
        guestEmail: updateBookingDto.guestEmail,
        guestPhone: updateBookingDto.guestPhone,
        specialRequests: updateBookingDto.specialRequests,
      };

      // If changing guest count or date, recalculate total
      if (updateBookingDto.guestCount && updateBookingDto.guestCount !== booking.guestCount) {
        if (updateBookingDto.guestCount > booking.experience.maxGuests) {
          throw new BadRequestException(`Maximum ${booking.experience.maxGuests} guests allowed`);
        }
        allowedUpdates.guestCount = updateBookingDto.guestCount;
        allowedUpdates.totalAmount = booking.experience.price * updateBookingDto.guestCount;
      }

      if (updateBookingDto.bookingDate) {
        const newDate = new Date(updateBookingDto.bookingDate);
        if (newDate <= new Date()) {
          throw new BadRequestException('Booking date must be in the future');
        }
        allowedUpdates.bookingDate = newDate;
      }

      return this.database.booking.update({
        where: { id },
        data: allowedUpdates,
        include: {
          user: { select: { id: true, name: true, email: true } },
          winery: { select: { id: true, name: true } },
          experience: true,
        },
      });
    }

    // Winery admins and platform admins can update status and other fields
    const updateData: Prisma.BookingUpdateInput = {
      ...(updateBookingDto.guestName !== undefined && { guestName: updateBookingDto.guestName }),
      ...(updateBookingDto.guestEmail !== undefined && { guestEmail: updateBookingDto.guestEmail }),
      ...(updateBookingDto.guestPhone !== undefined && { guestPhone: updateBookingDto.guestPhone }),
      ...(updateBookingDto.specialRequests !== undefined && { specialRequests: updateBookingDto.specialRequests }),
      ...(updateBookingDto.guestCount !== undefined && { guestCount: updateBookingDto.guestCount }),
      ...(updateBookingDto.status !== undefined && { status: updateBookingDto.status }),
    };

    if (updateBookingDto.bookingDate) {
      updateData.bookingDate = new Date(updateBookingDto.bookingDate);
    }

    return this.database.booking.update({
      where: { id },
      data: updateData,
      include: {
        user: { select: { id: true, name: true, email: true } },
        winery: { select: { id: true, name: true } },
        experience: true,
      },
    });
  }

  async cancel(id: string, userId: string, userRole: UserRole) {
    const booking = await this.database.booking.findUnique({
      where: { id },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    // Check permissions
    if (userRole === UserRole.GUEST && booking.userId !== userId) {
      throw new ForbiddenException('You can only cancel your own bookings');
    }

    if (userRole === UserRole.WINERY_ADMIN) {
      const winery = await this.database.winery.findFirst({
        where: { id: booking.wineryId, ownerId: userId },
      });

      if (!winery) {
        throw new ForbiddenException('You can only cancel bookings for your own winery');
      }
    }

    // Check if booking can be cancelled
    if (booking.status === BookingStatus.CANCELLED) {
      throw new BadRequestException('Booking is already cancelled');
    }

    if (booking.status === BookingStatus.COMPLETED) {
      throw new BadRequestException('Cannot cancel completed booking');
    }

    // Update booking status
    const updatedBooking = await this.database.booking.update({
      where: { id },
      data: { status: BookingStatus.CANCELLED },
      include: {
        user: { select: { id: true, name: true, email: true } },
        winery: { select: { id: true, name: true } },
        experience: true,
      },
    });

    return updatedBooking;
  }

  async getUserBookings(userId: string, filters: Partial<BookingFilters> = {}) {
    const { status, page = 1, limit = 20 } = filters;
    const skip = (page - 1) * limit;

    const where: Prisma.BookingWhereInput = {
      userId,
      ...(status && { status }),
    };

    const [bookings, total] = await Promise.all([
      this.database.booking.findMany({
        where,
        include: {
          winery: {
            select: { id: true, name: true, logoUrl: true },
          },
          experience: {
            select: { id: true, title: true, type: true, duration: true },
          },
          review: {
            select: { id: true, rating: true },
          },
        },
        orderBy: { bookingDate: 'desc' },
        skip,
        take: limit,
      }),
      this.database.booking.count({ where }),
    ]);

    return {
      bookings,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getWineryBookings(wineryId: string, ownerId: string, filters: Partial<BookingFilters> = {}) {
    // Verify ownership
    const winery = await this.database.winery.findFirst({
      where: { id: wineryId, ownerId },
    });

    if (!winery) {
      throw new ForbiddenException('You can only view bookings for your own winery');
    }

    const { status, experienceId, startDate, endDate, page = 1, limit = 20 } = filters;
    const skip = (page - 1) * limit;

    const where: Prisma.BookingWhereInput = {
      wineryId,
      ...(status && { status }),
      ...(experienceId && { experienceId }),
      ...(startDate || endDate) && {
        bookingDate: {
          ...(startDate && { gte: new Date(startDate) }),
          ...(endDate && { lte: new Date(endDate) }),
        },
      },
    };

    const [bookings, total] = await Promise.all([
      this.database.booking.findMany({
        where,
        include: {
          user: {
            select: { id: true, name: true, email: true },
          },
          experience: {
            select: { id: true, title: true, type: true },
          },
        },
        orderBy: { bookingDate: 'asc' },
        skip,
        take: limit,
      }),
      this.database.booking.count({ where }),
    ]);

    return {
      bookings,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async markAsCompleted(id: string, userId: string, userRole: UserRole) {
    const booking = await this.database.booking.findUnique({
      where: { id },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    // Only winery owners or platform admins can mark as completed
    if (userRole === UserRole.GUEST) {
      throw new ForbiddenException('Guests cannot mark bookings as completed');
    }

    if (userRole === UserRole.WINERY_ADMIN) {
      const winery = await this.database.winery.findFirst({
        where: { id: booking.wineryId, ownerId: userId },
      });

      if (!winery) {
        throw new ForbiddenException('You can only manage bookings for your own winery');
      }
    }

    // Check if booking can be completed
    if (booking.status !== BookingStatus.CONFIRMED) {
      throw new BadRequestException('Only confirmed bookings can be marked as completed');
    }

    // Check if booking date has passed
    if (booking.bookingDate > new Date()) {
      throw new BadRequestException('Cannot complete future bookings');
    }

    return this.database.booking.update({
      where: { id },
      data: { status: BookingStatus.COMPLETED },
      include: {
        user: { select: { id: true, name: true, email: true } },
        winery: { select: { id: true, name: true } },
        experience: true,
      },
    });
  }

  async getAvailability(experienceId: string, date: string) {
    const experience = await this.database.experience.findUnique({
      where: { id: experienceId, isActive: true },
    });

    if (!experience) {
      throw new NotFoundException('Experience not found');
    }

    const targetDate = new Date(date);

    // Get existing bookings for this date
    const existingBookings = await this.database.booking.findMany({
      where: {
        experienceId,
        bookingDate: targetDate,
        status: { in: [BookingStatus.PENDING, BookingStatus.CONFIRMED] },
      },
    });

    const bookedGuests = existingBookings.reduce((sum, booking) => sum + booking.guestCount, 0);
    const availableSpots = experience.maxGuests - bookedGuests;

    return {
      date: targetDate,
      maxGuests: experience.maxGuests,
      bookedGuests,
      availableSpots,
      isAvailable: availableSpots > 0,
      price: experience.price,
    };
  }
}
