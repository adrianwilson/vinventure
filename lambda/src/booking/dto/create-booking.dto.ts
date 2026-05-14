import { IsString, IsNumber, IsOptional, IsDateString, IsEmail, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateBookingDto {
  @ApiProperty({ description: 'Experience ID to book' })
  @IsString()
  experienceId: string;

  @ApiProperty({ description: 'Booking date (ISO date string)', example: '2026-06-15T10:00:00Z' })
  @IsDateString()
  bookingDate: string;

  @ApiProperty({ description: 'Number of guests', minimum: 1 })
  @IsNumber()
  @Min(1)
  guestCount: number;

  @ApiProperty({ description: 'Guest full name' })
  @IsString()
  guestName: string;

  @ApiProperty({ description: 'Guest email address' })
  @IsEmail()
  guestEmail: string;

  @ApiProperty({ description: 'Guest phone number', required: false })
  @IsOptional()
  @IsString()
  guestPhone?: string;

  @ApiProperty({ description: 'Special requests or notes', required: false })
  @IsOptional()
  @IsString()
  specialRequests?: string;
}
