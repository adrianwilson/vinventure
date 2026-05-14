import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Req,
  UseGuards,
  BadRequestException,
  Headers,
  RawBody
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { PaymentService } from './payment.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AuthenticatedRequest } from '../auth/types/authenticated-request';
import { CreatePaymentIntentDto } from './dto/create-payment-intent.dto';

@ApiTags('Payments')
@Controller('payments')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post('create-intent')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Create payment intent for booking' })
  @ApiResponse({ status: 200, description: 'Payment intent created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Booking not found' })
  async createPaymentIntent(
    @Req() req: AuthenticatedRequest,
    @Body() createPaymentDto: CreatePaymentIntentDto,
  ) {
    return await this.paymentService.createPaymentIntent(createPaymentDto);
  }

  @Post('confirm/:paymentIntentId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Confirm payment' })
  @ApiResponse({ status: 200, description: 'Payment confirmed successfully' })
  @ApiResponse({ status: 400, description: 'Payment confirmation failed' })
  async confirmPayment(@Param('paymentIntentId') paymentIntentId: string) {
    return await this.paymentService.confirmPayment(paymentIntentId);
  }

  @Post('refund/:bookingId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Process refund for booking' })
  @ApiResponse({ status: 200, description: 'Refund processed successfully' })
  @ApiResponse({ status: 400, description: 'Refund processing failed' })
  async processRefund(
    @Param('bookingId') bookingId: string,
    @Body() refundData: { reason?: string },
  ) {
    return await this.paymentService.processRefund(bookingId, refundData.reason);
  }

  @Get('details/:paymentIntentId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get payment details' })
  @ApiResponse({ status: 200, description: 'Payment details retrieved' })
  async getPaymentDetails(@Param('paymentIntentId') paymentIntentId: string) {
    return await this.paymentService.getPaymentDetails(paymentIntentId);
  }

  @Post('create-customer')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Create Stripe customer' })
  @ApiResponse({ status: 200, description: 'Customer created successfully' })
  async createCustomer(
    @Req() req: AuthenticatedRequest,
    @Body() customerData: { email: string; name?: string },
  ) {
    const { email, name } = customerData;
    return await this.paymentService.createCustomer(email, name);
  }
}

@Controller('webhooks')
@ApiTags('Webhooks')
export class WebhookController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post('stripe')
  @ApiOperation({ summary: 'Stripe webhook endpoint' })
  async handleStripeWebhook(
    @Headers('stripe-signature') signature: string,
    @RawBody() payload: Buffer,
  ) {
    if (!signature) {
      throw new BadRequestException('Missing Stripe signature');
    }

    return await this.paymentService.handleWebhook(signature, payload);
  }
}
