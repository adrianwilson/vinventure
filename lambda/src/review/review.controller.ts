import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  Req,
  UseGuards,
  ForbiddenException
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ReviewService } from './review.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AuthenticatedRequest } from '../auth/types/authenticated-request';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';

@ApiTags('Reviews')
@Controller('reviews')
export class ReviewController {
  constructor(private readonly reviewService: ReviewService) {}

  @Get()
  @ApiOperation({ summary: 'Get all reviews with filtering' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page' })
  @ApiQuery({ name: 'wineryId', required: false, description: 'Filter by winery' })
  @ApiQuery({ name: 'rating', required: false, description: 'Filter by rating' })
  async findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('wineryId') wineryId?: string,
    @Query('rating') rating?: string,
  ) {
    const filters = {
      wineryId,
      rating: rating ? parseInt(rating) : undefined,
      page: parseInt(page as string) || 1,
      limit: parseInt(limit as string) || 20,
    };

    return await this.reviewService.findAll(filters);
  }

  @Get('winery/:wineryId')
  @ApiOperation({ summary: 'Get reviews for a specific winery' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page' })
  @ApiQuery({ name: 'rating', required: false, description: 'Filter by rating' })
  @ApiResponse({ status: 200, description: 'Winery reviews retrieved' })
  async getWineryReviews(
    @Param('wineryId') wineryId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('rating') rating?: string,
  ) {
    const filters = {
      rating: rating ? parseInt(rating) : undefined,
      page: parseInt(page as string) || 1,
      limit: parseInt(limit as string) || 20,
    };

    return await this.reviewService.getWineryReviews(wineryId, filters);
  }

  @Get('winery/:wineryId/stats')
  @ApiOperation({ summary: 'Get review statistics for a winery' })
  @ApiResponse({ status: 200, description: 'Review statistics retrieved' })
  async getWineryStats(@Param('wineryId') wineryId: string) {
    return await this.reviewService.getWineryReviewStats(wineryId);
  }

  @Get('user/my-reviews')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get current user reviews' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page' })
  async getUserReviews(
    @Req() req: AuthenticatedRequest,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const filters = {
      page: parseInt(page as string) || 1,
      limit: parseInt(limit as string) || 20,
    };

    return await this.reviewService.getUserReviews(req.user.sub, filters);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get review by ID' })
  @ApiResponse({ status: 200, description: 'Review found' })
  @ApiResponse({ status: 404, description: 'Review not found' })
  async findOne(@Param('id') id: string) {
    return await this.reviewService.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Create a new review' })
  @ApiResponse({ status: 201, description: 'Review created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - validation errors' })
  @ApiResponse({ status: 403, description: 'Forbidden - not booking owner' })
  @ApiResponse({ status: 404, description: 'Booking not found' })
  async create(@Req() req: AuthenticatedRequest, @Body() createReviewDto: CreateReviewDto) {
    return await this.reviewService.create(req.user.sub, createReviewDto);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Update review' })
  @ApiResponse({ status: 200, description: 'Review updated successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - not review owner' })
  @ApiResponse({ status: 404, description: 'Review not found' })
  async update(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
    @Body() updateReviewDto: UpdateReviewDto,
  ) {
    return await this.reviewService.update(id, req.user.sub, req.user.role, updateReviewDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Delete review' })
  @ApiResponse({ status: 200, description: 'Review deleted successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - not review owner' })
  @ApiResponse({ status: 404, description: 'Review not found' })
  async remove(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return await this.reviewService.remove(id, req.user.sub, req.user.role);
  }

  @Post(':id/moderate')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Moderate review (admin only)' })
  @ApiResponse({ status: 200, description: 'Review moderated successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - admin only' })
  async moderate(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
    @Body() moderateDto: { action: 'approve' | 'hide' | 'delete' },
  ) {
    if (req.user.role !== 'PLATFORM_ADMIN') {
      throw new ForbiddenException('Only platform admins can moderate reviews');
    }
    return await this.reviewService.moderateReview(id, moderateDto.action, req.user.sub);
  }
}
