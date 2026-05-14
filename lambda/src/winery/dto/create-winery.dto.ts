import { IsString, IsNumber, IsOptional, IsBoolean, IsArray } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateWineryDto {
  @ApiProperty({ description: 'Winery name' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Winery description', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Contact email' })
  @IsString()
  email: string;

  @ApiProperty({ description: 'Contact phone', required: false })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ description: 'Website URL', required: false })
  @IsOptional()
  @IsString()
  website?: string;

  @ApiProperty({ description: 'Street address' })
  @IsString()
  address: string;

  @ApiProperty({ description: 'City' })
  @IsString()
  city: string;

  @ApiProperty({ description: 'Region' })
  @IsString()
  region: string;

  @ApiProperty({ description: 'Country' })
  @IsString()
  country: string;

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
