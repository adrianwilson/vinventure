import { IsString, IsNumber, IsOptional, IsArray, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateReviewDto {
  @ApiProperty({ description: 'Booking ID to review' })
  @IsString()
  bookingId: string;

  @ApiProperty({ description: 'Rating (1-5 stars)', minimum: 1, maximum: 5 })
  @IsNumber()
  @Min(1)
  @Max(5)
  rating: number;

  @ApiProperty({ description: 'Review comment', required: false })
  @IsOptional()
  @IsString()
  comment?: string;

  @ApiProperty({ description: 'Review image URLs', required: false })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];
}
