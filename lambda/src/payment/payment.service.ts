import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import Stripe from 'stripe';
import { DatabaseService } from '../database/database.service';
import { BookingStatus } from '@prisma/client';
import { CreatePaymentIntentDto } from './dto/create-payment-intent.dto';

@Injectable()
export class PaymentService {
  private stripe: Stripe;

  constructor(private database: DatabaseService) {
    const stripeKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeKey) throw new Error('STRIPE_SECRET_KEY environment variable is required');
    this.stripe = new Stripe(stripeKey);
  }

  async createPaymentIntent(createPaymentDto: CreatePaymentIntentDto) {
    const { bookingId, paymentMethodId, currency = 'usd' } = createPaymentDto;

    // Get booking details
    const booking = await this.database.booking.findUnique({
      where: { id: bookingId },
      include: {
        user: true,
        winery: true,
        experience: true,
      },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    if (booking.status !== BookingStatus.PENDING) {
      throw new BadRequestException('Payment can only be processed for pending bookings');
    }

    // Convert amount to cents for Stripe
    const amountInCents = Math.round(booking.totalAmount * 100);

    try {
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: amountInCents,
        currency,
        payment_method: paymentMethodId,
        confirm: !!paymentMethodId,
        confirmation_method: paymentMethodId ? 'automatic' : 'manual',
        metadata: {
          bookingId: booking.id,
          wineryId: booking.wineryId,
          experienceId: booking.experienceId,
          userId: booking.userId,
        },
        description: `${booking.experience.title} at ${booking.winery.name} for ${booking.guestCount} guests`,
        receipt_email: booking.guestEmail,
      });

      // Store payment intent ID in booking
      await this.database.booking.update({
        where: { id: bookingId },
        data: { stripePaymentId: paymentIntent.id },
      });

      return {
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        status: paymentIntent.status,
        amount: booking.totalAmount,
        currency,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new BadRequestException(`Payment processing failed: ${message}`);
    }
  }

  async confirmPayment(paymentIntentId: string) {
    try {
      const paymentIntent = await this.stripe.paymentIntents.retrieve(paymentIntentId);

      if (!paymentIntent.metadata.bookingId) {
        throw new BadRequestException('Invalid payment intent');
      }

      const booking = await this.database.booking.findUnique({
        where: { id: paymentIntent.metadata.bookingId },
      });

      if (!booking) {
        throw new NotFoundException('Associated booking not found');
      }

      if (paymentIntent.status === 'succeeded') {
        // Update booking status to confirmed and record payment
        await this.database.booking.update({
          where: { id: booking.id },
          data: {
            status: BookingStatus.CONFIRMED,
            paidAt: new Date(),
            stripePaymentId: paymentIntentId,
          },
        });

        return {
          success: true,
          bookingId: booking.id,
          paymentStatus: 'succeeded',
          amount: paymentIntent.amount / 100,
        };
      }

      return {
        success: false,
        paymentStatus: paymentIntent.status,
        error: 'Payment not completed',
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new BadRequestException(`Payment confirmation failed: ${message}`);
    }
  }

  async processRefund(bookingId: string, reason?: string) {
    const booking = await this.database.booking.findUnique({
      where: { id: bookingId },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    if (!booking.stripePaymentId) {
      throw new BadRequestException('No payment found for this booking');
    }

    if (booking.status !== BookingStatus.CONFIRMED && booking.status !== BookingStatus.CANCELLED) {
      throw new BadRequestException('Refund can only be processed for confirmed or cancelled bookings');
    }

    try {
      const refund = await this.stripe.refunds.create({
        payment_intent: booking.stripePaymentId,
        reason: reason === 'duplicate' ? 'duplicate' : 'requested_by_customer',
        metadata: {
          bookingId: booking.id,
          originalAmount: booking.totalAmount.toString(),
        },
      });

      // Update booking status
      await this.database.booking.update({
        where: { id: bookingId },
        data: { status: BookingStatus.CANCELLED },
      });

      return {
        success: true,
        refundId: refund.id,
        amount: refund.amount / 100,
        status: refund.status,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new BadRequestException(`Refund processing failed: ${message}`);
    }
  }

  async getPaymentDetails(paymentIntentId: string) {
    try {
      const paymentIntent = await this.stripe.paymentIntents.retrieve(paymentIntentId);
      
      return {
        id: paymentIntent.id,
        amount: paymentIntent.amount / 100,
        currency: paymentIntent.currency,
        status: paymentIntent.status,
        created: new Date(paymentIntent.created * 1000),
        metadata: paymentIntent.metadata,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new BadRequestException(`Failed to retrieve payment details: ${message}`);
    }
  }

  async handleWebhook(signature: string, payload: Buffer) {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!webhookSecret) {
      throw new BadRequestException('Webhook secret not configured');
    }

    try {
      const event = this.stripe.webhooks.constructEvent(payload, signature, webhookSecret);
      
      switch (event.type) {
        case 'payment_intent.succeeded':
          await this.handlePaymentSucceeded(event.data.object as Stripe.PaymentIntent);
          break;
        case 'payment_intent.payment_failed':
          await this.handlePaymentFailed(event.data.object as Stripe.PaymentIntent);
          break;
        case 'refund.created':
          await this.handleRefundCreated(event.data.object as Stripe.Refund);
          break;
        default:
          console.log(`Unhandled event type: ${event.type}`);
      }

      return { received: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new BadRequestException(`Webhook signature verification failed: ${message}`);
    }
  }

  private async handlePaymentSucceeded(paymentIntent: Stripe.PaymentIntent) {
    const bookingId = paymentIntent.metadata.bookingId;
    
    if (bookingId) {
      await this.database.booking.update({
        where: { id: bookingId },
        data: {
          status: BookingStatus.CONFIRMED,
          paidAt: new Date(),
        },
      });
      
      console.log(`Payment succeeded for booking ${bookingId}`);
    }
  }

  private async handlePaymentFailed(paymentIntent: Stripe.PaymentIntent) {
    const bookingId = paymentIntent.metadata.bookingId;
    
    if (bookingId) {
      console.log(`Payment failed for booking ${bookingId}`);
    }
  }

  private async handleRefundCreated(refund: Stripe.Refund) {
    const bookingId = refund.metadata?.bookingId;
    
    if (bookingId) {
      await this.database.booking.update({
        where: { id: bookingId },
        data: { status: BookingStatus.CANCELLED },
      });
      
      console.log(`Refund processed for booking ${bookingId}`);
    }
  }

  async createCustomer(email: string, name?: string) {
    try {
      const customer = await this.stripe.customers.create({
        email,
        name,
      });

      return {
        customerId: customer.id,
        email: customer.email,
        name: customer.name,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new BadRequestException(`Customer creation failed: ${message}`);
    }
  }
}