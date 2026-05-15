import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  Req,
  UseGuards,
  BadRequestException
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { BookingService } from './booking.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AuthenticatedRequest } from '../auth/types/authenticated-request';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';
import { BookingStatus } from '@prisma/client';

@ApiTags('Bookings')
@Controller('bookings')
export class BookingController {
  constructor(private readonly bookingService: BookingService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get user bookings' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page' })
  @ApiQuery({ name: 'status', required: false, description: 'Filter by status' })
  async getUserBookings(
    @Req() req: AuthenticatedRequest,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
  ) {
    const filters = {
      status: status as BookingStatus | undefined,
      page: parseInt(page as string) || 1,
      limit: parseInt(limit as string) || 20,
    };

    return await this.bookingService.getUserBookings(req.user.sub, filters);
  }

  @Get('winery/:wineryId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get winery bookings (winery owner only)' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page' })
  @ApiQuery({ name: 'status', required: false, description: 'Filter by status' })
  @ApiQuery({ name: 'experienceId', required: false, description: 'Filter by experience' })
  @ApiQuery({ name: 'startDate', required: false, description: 'Start date filter' })
  @ApiQuery({ name: 'endDate', required: false, description: 'End date filter' })
  async getWineryBookings(
    @Param('wineryId') wineryId: string,
    @Req() req: AuthenticatedRequest,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
    @Query('experienceId') experienceId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const filters = {
      status: status as BookingStatus | undefined,
      experienceId,
      startDate,
      endDate,
      page: parseInt(page as string) || 1,
      limit: parseInt(limit as string) || 20,
    };

    return await this.bookingService.getWineryBookings(wineryId, req.user.sub, filters);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get booking by ID' })
  @ApiResponse({ status: 200, description: 'Booking found' })
  @ApiResponse({ status: 404, description: 'Booking not found' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async findOne(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return await this.bookingService.findOne(id, req.user.sub, req.user.role);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Create new booking' })
  @ApiResponse({ status: 201, description: 'Booking created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - validation errors' })
  @ApiResponse({ status: 404, description: 'Experience not found' })
  async create(@Req() req: AuthenticatedRequest, @Body() createBookingDto: CreateBookingDto) {
    return await this.bookingService.create(req.user.sub, createBookingDto);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Update booking' })
  @ApiResponse({ status: 200, description: 'Booking updated successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Booking not found' })
  async update(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
    @Body() updateBookingDto: UpdateBookingDto,
  ) {
    return await this.bookingService.update(id, req.user.sub, req.user.role, updateBookingDto);
  }

  @Delete(':id/cancel')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Cancel booking' })
  @ApiResponse({ status: 200, description: 'Booking cancelled successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Booking not found' })
  async cancel(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return await this.bookingService.cancel(id, req.user.sub, req.user.role);
  }

  @Post(':id/complete')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Mark booking as completed (winery admin only)' })
  @ApiResponse({ status: 200, description: 'Booking marked as completed' })
  @ApiResponse({ status: 403, description: 'Forbidden - only winery admins' })
  async markCompleted(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return await this.bookingService.markAsCompleted(id, req.user.sub, req.user.role);
  }
}
