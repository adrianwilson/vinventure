import { IsString, IsNumber, IsOptional, IsDateString, IsEnum, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { BookingStatus } from '@prisma/client';

export class UpdateBookingDto {
  @ApiProperty({ description: 'Booking date (ISO date string)', required: false })
  @IsOptional()
  @IsDateString()
  bookingDate?: string;

  @ApiProperty({ description: 'Number of guests', minimum: 1, required: false })
  @IsOptional()
  @IsNumber()
  @Min(1)
  guestCount?: number;

  @ApiProperty({ description: 'Guest full name', required: false })
  @IsOptional()
  @IsString()
  guestName?: string;

  @ApiProperty({ description: 'Guest email address', required: false })
  @IsOptional()
  @IsString()
  guestEmail?: string;

  @ApiProperty({ description: 'Guest phone number', required: false })
  @IsOptional()
  @IsString()
  guestPhone?: string;

  @ApiProperty({ description: 'Special requests or notes', required: false })
  @IsOptional()
  @IsString()
  specialRequests?: string;

  @ApiProperty({ description: 'Booking status', enum: BookingStatus, required: false })
  @IsOptional()
  @IsEnum(BookingStatus)
  status?: BookingStatus;
}
