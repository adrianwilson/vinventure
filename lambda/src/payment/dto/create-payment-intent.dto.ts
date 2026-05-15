import { IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreatePaymentIntentDto {
  @ApiProperty({ description: 'Booking ID to create payment for' })
  @IsString()
  bookingId: string;

  @ApiProperty({ description: 'Stripe payment method ID', required: false })
  @IsOptional()
  @IsString()
  paymentMethodId?: string;

  @ApiProperty({ description: 'Payment currency', required: false, default: 'usd' })
  @IsOptional()
  @IsString()
  currency?: string;
}
