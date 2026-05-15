import { Module } from '@nestjs/common';
import { WineryController } from './winery.controller';
import { WineryService } from './winery.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [WineryController],
  providers: [WineryService],
})
export class WineryModule {}