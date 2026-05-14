import { IsString, IsOptional, IsObject } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Prisma } from '@prisma/client';

export class UpdateProfileDto {
  @ApiProperty({
    description: 'User full name',
    example: 'John Doe',
    required: false
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({
    description: 'User phone number',
    example: '+1-555-123-4567',
    required: false
  })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({
    description: 'User avatar URL',
    example: 'https://example.com/avatar.jpg',
    required: false
  })
  @IsOptional()
  @IsString()
  avatarUrl?: string;

  @ApiProperty({
    description: 'User preferences object',
    example: { language: 'en', notifications: true },
    required: false
  })
  @IsOptional()
  @IsObject()
  preferences?: Prisma.JsonValue;
}