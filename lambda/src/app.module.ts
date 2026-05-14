import { Module } from '@nestjs/common';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './auth/auth.module';
import { WineryModule } from './winery/winery.module';
import { BookingModule } from './booking/booking.module';
import { PaymentModule } from './payment/payment.module';
import { ReviewModule } from './review/review.module';
import { ExperienceModule } from './experience/experience.module';
import { HealthController } from './health/health.controller';

@Module({
  imports: [
    DatabaseModule,
    AuthModule,
    WineryModule,
    BookingModule,
    PaymentModule,
    ReviewModule,
    ExperienceModule,
  ],
  controllers: [HealthController],
  providers: [],
})
export class AppModule {}