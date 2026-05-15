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
  UseGuards
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ExperienceService } from './experience.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AuthenticatedRequest } from '../auth/types/authenticated-request';
import { CreateExperienceDto } from './dto/create-experience.dto';
import { UpdateExperienceDto } from './dto/update-experience.dto';

@ApiTags('Experiences')
@Controller('experiences')
export class ExperienceController {
  constructor(private readonly experienceService: ExperienceService) {}

  @Get()
  @ApiOperation({ summary: 'Get all experiences with filtering and pagination' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page' })
  @ApiQuery({ name: 'wineryId', required: false, description: 'Filter by winery' })
  @ApiQuery({ name: 'type', required: false, description: 'Filter by experience type' })
  @ApiQuery({ name: 'isActive', required: false, description: 'Filter by active status' })
  async findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('wineryId') wineryId?: string,
    @Query('type') type?: string,
    @Query('isActive') isActive?: string,
  ) {
    const filters = {
      wineryId,
      type,
      isActive: isActive === 'true',
      page: parseInt(page as string) || 1,
      limit: parseInt(limit as string) || 20,
    };

    return await this.experienceService.findAll(filters);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get experience by ID' })
  @ApiResponse({ status: 200, description: 'Experience found' })
  @ApiResponse({ status: 404, description: 'Experience not found' })
  async findOne(@Param('id') id: string) {
    return await this.experienceService.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Create new experience' })
  @ApiResponse({ status: 201, description: 'Experience created successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - not winery owner' })
  async create(@Req() req: AuthenticatedRequest, @Body() createExperienceDto: CreateExperienceDto) {
    return await this.experienceService.create(req.user.sub, createExperienceDto);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Update experience' })
  @ApiResponse({ status: 200, description: 'Experience updated successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - not winery owner' })
  async update(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
    @Body() updateExperienceDto: UpdateExperienceDto,
  ) {
    return await this.experienceService.update(
      id,
      req.user.sub,
      req.user.role,
      updateExperienceDto,
    );
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Delete experience' })
  @ApiResponse({ status: 200, description: 'Experience deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - not winery owner' })
  async remove(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return await this.experienceService.remove(id, req.user.sub, req.user.role);
  }

  @Get(':id/availability')
  @ApiOperation({ summary: 'Check availability for experience on specific date' })
  @ApiQuery({ name: 'date', required: true, description: 'Date to check (YYYY-MM-DD)' })
  @ApiResponse({ status: 200, description: 'Availability information' })
  @ApiResponse({ status: 404, description: 'Experience not found' })
  async getAvailability(
    @Param('id') experienceId: string,
    @Query('date') date: string,
  ) {
    return await this.experienceService.getAvailability(experienceId, date);
  }
}
