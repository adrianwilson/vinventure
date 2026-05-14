import { IsString, IsNumber, IsOptional, IsBoolean, IsArray, IsEnum, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ExperienceType } from '@prisma/client';

export class CreateExperienceDto {
  @ApiProperty({ description: 'Experience title' })
  @IsString()
  title: string;

  @ApiProperty({ description: 'Experience description' })
  @IsString()
  description: string;

  @ApiProperty({ description: 'Experience type', enum: ExperienceType })
  @IsEnum(ExperienceType)
  type: ExperienceType;

  @ApiProperty({ description: 'Duration in minutes', minimum: 15, maximum: 480 })
  @IsNumber()
  @Min(15)
  @Max(480)
  duration: number;

  @ApiProperty({ description: 'Price per guest' })
  @IsNumber()
  @Min(0)
  price: number;

  @ApiProperty({ description: 'Maximum number of guests', minimum: 1, maximum: 50 })
  @IsNumber()
  @Min(1)
  @Max(50)
  maxGuests: number;

  @ApiProperty({ description: 'Available days of the week', example: ['monday', 'tuesday'] })
  @IsArray()
  @IsString({ each: true })
  availableDays: string[];

  @ApiProperty({ description: 'Start time', example: '10:00' })
  @IsString()
  startTime: string;

  @ApiProperty({ description: 'End time', example: '17:00' })
  @IsString()
  endTime: string;

  @ApiProperty({ description: 'Image URLs' })
  @IsArray()
  @IsString({ each: true })
  images: string[];

  @ApiProperty({ description: 'Minimum age requirement', required: false })
  @IsOptional()
  @IsNumber()
  ageRestriction?: number;

  @ApiProperty({ description: 'Special requirements', required: false })
  @IsOptional()
  @IsString()
  requirements?: string;

  @ApiProperty({ description: 'Whether the experience is active' })
  @IsBoolean()
  isActive: boolean;

  @ApiProperty({ description: 'Winery ID this experience belongs to' })
  @IsString()
  wineryId: string;
}
