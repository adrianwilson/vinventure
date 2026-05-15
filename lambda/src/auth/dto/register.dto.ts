import { IsEmail, IsString, MinLength, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ 
    description: 'User email address',
    example: 'user@example.com' 
  })
  @IsEmail()
  email: string;

  @ApiProperty({ 
    description: 'User password (minimum 8 characters)',
    example: 'securePassword123' 
  })
  @IsString()
  @MinLength(8)
  password: string;

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
    example: '+1234567890',
    required: false 
  })
  @IsOptional()
  @IsString()
  phone?: string;
}