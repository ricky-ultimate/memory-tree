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
import { SupabaseAuthGuard } from '../auth/guards/supabase-auth.guard';
import { GetSupabaseUser } from '../common/decorators/supabase-user.decorator';
import type { SupabaseUserPayload } from '../auth/guards/supabase-auth.guard';

@ApiTags('fragments')
@ApiBearerAuth()
@UseGuards(SupabaseAuthGuard)
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
    @GetSupabaseUser() user: SupabaseUserPayload,
  ): Promise<FragmentResponseDto> {
    return this.fragmentsService.create(user.id, createFragmentDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all fragments for the authenticated user' })
  @ApiResponse({ status: 200, description: 'Fragments retrieved successfully', type: PaginatedFragmentsResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async findAll(
    @Query() query: GetFragmentsQueryDto,
    @GetSupabaseUser() user: SupabaseUserPayload,
  ): Promise<PaginatedFragmentsResponseDto> {
    return this.fragmentsService.findAllByUser(user.id, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific fragment by ID' })
  @ApiResponse({ status: 200, description: 'Fragment retrieved successfully', type: FragmentResponseDto })
  @ApiResponse({ status: 404, description: 'Fragment not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async findOne(
    @Param('id') id: string,
    @GetSupabaseUser() user: SupabaseUserPayload,
  ): Promise<FragmentResponseDto> {
    return this.fragmentsService.findOne(id, user.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a fragment' })
  @ApiResponse({ status: 200, description: 'Fragment updated successfully', type: FragmentResponseDto })
  @ApiResponse({ status: 404, description: 'Fragment not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async update(
    @Param('id') id: string,
    @Body() updateFragmentDto: UpdateFragmentDto,
    @GetSupabaseUser() user: SupabaseUserPayload,
  ): Promise<FragmentResponseDto> {
    return this.fragmentsService.update(id, user.id, updateFragmentDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a fragment' })
  @ApiResponse({ status: 204, description: 'Fragment deleted successfully' })
  @ApiResponse({ status: 404, description: 'Fragment not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async remove(
    @Param('id') id: string,
    @GetSupabaseUser() user: SupabaseUserPayload,
  ): Promise<void> {
    return this.fragmentsService.remove(id, user.id);
  }
}
