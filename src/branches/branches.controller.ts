import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { BranchesService } from './branches.service';
import { SupabaseAuthGuard } from '../auth/guards/supabase-auth.guard';
import { GetSupabaseUser } from '../common/decorators/supabase-user.decorator';
import type { SupabaseUserPayload } from '../auth/guards/supabase-auth.guard';
import { CreateBranchDto } from './dto/create-branch.dto';
import { UpdateBranchDto } from './dto/update-branch.dto';
import { GetBranchesQueryDto, AutoLinkQueryDto } from './dto/get-branches-query.dto';
import {
  BranchResponseDto,
  PaginatedBranchesResponseDto,
  MemoryTreeResponseDto
} from './dto/branch-response.dto';
import { VisualizationQueryDto, VisualizationResponseDto } from './dto/visualization.dto';

@ApiTags('branches')
@ApiBearerAuth()
@UseGuards(SupabaseAuthGuard)
@Controller('branches')
export class BranchesController {
  constructor(private readonly branchesService: BranchesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new connection between fragments' })
  @ApiResponse({ status: 201, description: 'Connection created successfully', type: BranchResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 404, description: 'Fragment not found' })
  @ApiResponse({ status: 409, description: 'Connection already exists' })
  create(@Body() createBranchDto: CreateBranchDto, @GetSupabaseUser() user: SupabaseUserPayload): Promise<BranchResponseDto> {
    return this.branchesService.create(user.id, createBranchDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all connections for the current user' })
  @ApiResponse({ status: 200, description: 'Connections retrieved successfully', type: PaginatedBranchesResponseDto })
  findAll(@Query() query: GetBranchesQueryDto, @GetSupabaseUser() user: SupabaseUserPayload): Promise<PaginatedBranchesResponseDto> {
    return this.branchesService.findAllByUser(user.id, query);
  }

  @Get('memory-tree')
  @ApiOperation({ summary: 'Get the complete memory tree visualization data' })
  @ApiResponse({ status: 200, description: 'Memory tree data retrieved successfully', type: MemoryTreeResponseDto })
  getMemoryTree(@GetSupabaseUser() user: SupabaseUserPayload): Promise<MemoryTreeResponseDto> {
    return this.branchesService.getMemoryTree(user.id);
  }

  @Get('visualization')
  @ApiOperation({ summary: 'Get enhanced visualization data with customizable layout and styling' })
  @ApiResponse({ status: 200, description: 'Visualization data retrieved successfully', type: VisualizationResponseDto })
  getVisualization(@Query() query: VisualizationQueryDto, @GetSupabaseUser() user: SupabaseUserPayload): Promise<VisualizationResponseDto> {
    return this.branchesService.getVisualization(user.id, query);
  }

  @Post('auto-link')
  @ApiOperation({ summary: 'Automatically create connections between fragments' })
  @ApiResponse({ status: 201, description: 'Auto-connections created successfully', type: [BranchResponseDto] })
  @ApiResponse({ status: 404, description: 'Fragment not found (when fragmentId specified)' })
  autoLink(@Query() query: AutoLinkQueryDto, @GetSupabaseUser() user: SupabaseUserPayload): Promise<BranchResponseDto[]> {
    return this.branchesService.autoLinkFragments(user.id, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific connection by ID' })
  @ApiResponse({ status: 200, description: 'Connection retrieved successfully', type: BranchResponseDto })
  @ApiResponse({ status: 404, description: 'Connection not found' })
  findOne(@Param('id') id: string, @GetSupabaseUser() user: SupabaseUserPayload): Promise<BranchResponseDto> {
    return this.branchesService.findOne(id, user.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a connection' })
  @ApiResponse({ status: 200, description: 'Connection updated successfully', type: BranchResponseDto })
  @ApiResponse({ status: 404, description: 'Connection not found' })
  update(@Param('id') id: string, @Body() updateBranchDto: UpdateBranchDto, @GetSupabaseUser() user: SupabaseUserPayload): Promise<BranchResponseDto> {
    return this.branchesService.update(id, user.id, updateBranchDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a connection' })
  @ApiResponse({ status: 204, description: 'Connection deleted successfully' })
  @ApiResponse({ status: 404, description: 'Connection not found' })
  remove(@Param('id') id: string, @GetSupabaseUser() user: SupabaseUserPayload): Promise<void> {
    return this.branchesService.remove(id, user.id);
  }
}
