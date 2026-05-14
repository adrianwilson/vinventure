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
import { WineryService } from './winery.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AuthenticatedRequest } from '../auth/types/authenticated-request';
import { CreateWineryDto } from './dto/create-winery.dto';
import { UpdateWineryDto } from './dto/update-winery.dto';

@ApiTags('Wineries')
@Controller('wineries')
export class WineryController {
  constructor(private readonly wineryService: WineryService) {}

  @Get()
  @ApiOperation({ summary: 'Get all wineries with filtering and pagination' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page' })
  @ApiQuery({ name: 'region', required: false, description: 'Filter by region' })
  @ApiQuery({ name: 'wineTypes', required: false, description: 'Filter by wine types (comma-separated)' })
  @ApiQuery({ name: 'sustainable', required: false, description: 'Filter by sustainability' })
  @ApiQuery({ name: 'featured', required: false, description: 'Filter by featured status' })
  @ApiQuery({ name: 'search', required: false, description: 'Search in name and description' })
  @ApiQuery({ name: 'latitude', required: false, description: 'Latitude for location search' })
  @ApiQuery({ name: 'longitude', required: false, description: 'Longitude for location search' })
  @ApiQuery({ name: 'radius', required: false, description: 'Search radius in km' })
  async findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('region') region?: string,
    @Query('wineTypes') wineTypes?: string,
    @Query('sustainable') sustainable?: string,
    @Query('featured') featured?: string,
    @Query('search') search?: string,
    @Query('latitude') latitude?: string,
    @Query('longitude') longitude?: string,
    @Query('radius') radius?: string,
  ) {
    const filters = {
      region,
      wineTypes: wineTypes ? wineTypes.split(',') : undefined,
      sustainable: sustainable === 'true',
      featured: featured === 'true',
      search,
      latitude: latitude ? parseFloat(latitude) : undefined,
      longitude: longitude ? parseFloat(longitude) : undefined,
      radius: radius ? parseFloat(radius) : undefined,
      page: parseInt(page as string) || 1,
      limit: parseInt(limit as string) || 20,
    };

    return await this.wineryService.findAll(filters);
  }

  @Get('owner/my-wineries')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get wineries owned by current user' })
  @ApiResponse({ status: 200, description: 'Wineries retrieved' })
  async getMyWineries(@Req() req: AuthenticatedRequest) {
    return await this.wineryService.getWineriesByOwner(req.user.sub);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get winery by ID' })
  @ApiResponse({ status: 200, description: 'Winery found' })
  @ApiResponse({ status: 404, description: 'Winery not found' })
  async findOne(@Param('id') id: string) {
    return await this.wineryService.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Create new winery' })
  @ApiResponse({ status: 201, description: 'Winery created successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 409, description: 'User already owns a winery' })
  async create(@Req() req: AuthenticatedRequest, @Body() createWineryDto: CreateWineryDto) {
    return await this.wineryService.create(req.user.sub, createWineryDto);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Update winery' })
  @ApiResponse({ status: 200, description: 'Winery updated successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - not winery owner' })
  async update(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
    @Body() updateWineryDto: UpdateWineryDto,
  ) {
    return await this.wineryService.update(
      id,
      req.user.sub,
      req.user.role,
      updateWineryDto,
    );
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Delete winery' })
  @ApiResponse({ status: 200, description: 'Winery deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - not winery owner' })
  async remove(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return await this.wineryService.remove(id, req.user.sub, req.user.role);
  }
}
