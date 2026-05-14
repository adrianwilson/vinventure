import { IsString, IsNumber, IsOptional, IsBoolean, IsArray, IsEnum, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ExperienceType } from '@prisma/client';

export class UpdateExperienceDto {
  @ApiProperty({ description: 'Experience title', required: false })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiProperty({ description: 'Experience description', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Experience type', enum: ExperienceType, required: false })
  @IsOptional()
  @IsEnum(ExperienceType)
  type?: ExperienceType;

  @ApiProperty({ description: 'Duration in minutes', required: false })
  @IsOptional()
  @IsNumber()
  @Min(15)
  @Max(480)
  duration?: number;

  @ApiProperty({ description: 'Price per guest', required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number;

  @ApiProperty({ description: 'Maximum number of guests', required: false })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(50)
  maxGuests?: number;

  @ApiProperty({ description: 'Available days of the week', required: false })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  availableDays?: string[];

  @ApiProperty({ description: 'Start time', required: false })
  @IsOptional()
  @IsString()
  startTime?: string;

  @ApiProperty({ description: 'End time', required: false })
  @IsOptional()
  @IsString()
  endTime?: string;

  @ApiProperty({ description: 'Image URLs', required: false })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];

  @ApiProperty({ description: 'Minimum age requirement', required: false })
  @IsOptional()
  @IsNumber()
  ageRestriction?: number;

  @ApiProperty({ description: 'Special requirements', required: false })
  @IsOptional()
  @IsString()
  requirements?: string;

  @ApiProperty({ description: 'Whether the experience is active', required: false })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiProperty({ description: 'Winery ID', required: false })
  @IsOptional()
  @IsString()
  wineryId?: string;
}
