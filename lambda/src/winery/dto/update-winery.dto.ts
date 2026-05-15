import { IsString, IsNumber, IsOptional, IsBoolean, IsArray } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateWineryDto {
  @ApiProperty({ description: 'Winery name', required: false })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ description: 'Winery description', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Contact email', required: false })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiProperty({ description: 'Contact phone', required: false })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ description: 'Website URL', required: false })
  @IsOptional()
  @IsString()
  website?: string;

  @ApiProperty({ description: 'Street address', required: false })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiProperty({ description: 'City', required: false })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiProperty({ description: 'Region', required: false })
  @IsOptional()
  @IsString()
  region?: string;

  @ApiProperty({ description: 'Country', required: false })
  @IsOptional()
  @IsString()
  country?: string;

  @ApiProperty({ description: 'Zip code', required: false })
  @IsOptional()
  @IsString()
  zipCode?: string;

  @ApiProperty({ description: 'Latitude', required: false })
  @IsOptional()
  @IsNumber()
  latitude?: number;

  @ApiProperty({ description: 'Longitude', required: false })
  @IsOptional()
  @IsNumber()
  longitude?: number;

  @ApiProperty({ description: 'Logo URL', required: false })
  @IsOptional()
  @IsString()
  logoUrl?: string;

  @ApiProperty({ description: 'Banner image URL', required: false })
  @IsOptional()
  @IsString()
  bannerUrl?: string;

  @ApiProperty({ description: 'Gallery image URLs', required: false })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];

  @ApiProperty({ description: 'Year founded', required: false })
  @IsOptional()
  @IsNumber()
  foundedYear?: number;

  @ApiProperty({ description: 'Types of wine produced', required: false })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  wineTypes?: string[];

  @ApiProperty({ description: 'Whether the winery is sustainable', required: false })
  @IsOptional()
  @IsBoolean()
  sustainable?: boolean;

  @ApiProperty({ description: 'Whether the winery uses sustainable practices', required: false })
  @IsOptional()
  @IsBoolean()
  sustainablePractices?: boolean;
}
