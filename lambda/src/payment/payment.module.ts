import { Module } from '@nestjs/common';
import { PaymentController, WebhookController } from './payment.controller';
import { PaymentService } from './payment.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [PaymentController, WebhookController],
  providers: [PaymentService],
})
export class PaymentModule {}