import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Query,
  UseGuards,
  Patch,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { FragmentsService } from './fragments.service';
import { CreateFragmentDto } from './dto/create-fragment.dto';
import { UpdateFragmentDto } from './dto/update-fragment.dto';
import { GetFragmentsQueryDto } from './dto/get-fragments-query.dto';
import { FragmentResponseDto, PaginatedFragmentsResponseDto } from './dto/fragment-response.dto';
import { ClerkAuthGuard } from '../auth/guards/clerk-auth.guard';
import { GetUser } from '../common/decorators/get-user.decorator';
import type { UserPayload } from '../auth/guards/clerk-auth.guard';

@ApiTags('fragments')
@ApiBearerAuth()
// @UseGuards(ClerkAuthGuard) // Temporarily disabled for testing
@Controller('fragments')
export class FragmentsController {
  constructor(private readonly fragmentsService: FragmentsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new fragment' })
  @ApiResponse({ status: 201, description: 'Fragment created successfully', type: FragmentResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async create(
    @Body() createFragmentDto: CreateFragmentDto,
    // @GetUser() user: UserPayload, // Temporarily disabled for testing
  ): Promise<FragmentResponseDto> {
    const testUserId = 'test-user-123'; // Temporary test user
    return this.fragmentsService.create(testUserId, createFragmentDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all fragments for the authenticated user' })
  @ApiResponse({ status: 200, description: 'Fragments retrieved successfully', type: PaginatedFragmentsResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async findAll(
    @Query() query: GetFragmentsQueryDto,
    // @GetUser() user: UserPayload, // Temporarily disabled for testing
  ): Promise<PaginatedFragmentsResponseDto> {
    const testUserId = 'test-user-123'; // Temporary test user
    return this.fragmentsService.findAllByUser(testUserId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific fragment by ID' })
  @ApiResponse({ status: 200, description: 'Fragment retrieved successfully', type: FragmentResponseDto })
  @ApiResponse({ status: 404, description: 'Fragment not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async findOne(
    @Param('id') id: string,
    // @GetUser() user: UserPayload, // Temporarily disabled for testing
  ): Promise<FragmentResponseDto> {
    const testUserId = 'test-user-123'; // Temporary test user
    return this.fragmentsService.findOne(id, testUserId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a fragment' })
  @ApiResponse({ status: 200, description: 'Fragment updated successfully', type: FragmentResponseDto })
  @ApiResponse({ status: 404, description: 'Fragment not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async update(
    @Param('id') id: string,
    @Body() updateFragmentDto: UpdateFragmentDto,
    // @GetUser() user: UserPayload, // Temporarily disabled for testing
  ): Promise<FragmentResponseDto> {
    const testUserId = 'test-user-123'; // Temporary test user
    return this.fragmentsService.update(id, testUserId, updateFragmentDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a fragment' })
  @ApiResponse({ status: 204, description: 'Fragment deleted successfully' })
  @ApiResponse({ status: 404, description: 'Fragment not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async remove(
    @Param('id') id: string,
    // @GetUser() user: UserPayload, // Temporarily disabled for testing
  ): Promise<void> {
    const testUserId = 'test-user-123'; // Temporary test user
    return this.fragmentsService.remove(id, testUserId);
  }
}
