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
  Request,
  HttpCode,
  HttpStatus
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { BranchesService } from './branches.service';
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
@Controller('branches')
export class BranchesController {
  constructor(private readonly branchesService: BranchesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new connection between fragments' })
  @ApiResponse({ status: 201, description: 'Connection created successfully', type: BranchResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 404, description: 'Fragment not found' })
  @ApiResponse({ status: 409, description: 'Connection already exists' })
  create(@Request() req: any, @Body() createBranchDto: CreateBranchDto): Promise<BranchResponseDto> {
    const userId = req.user?.id || 'test-user-123'; // TODO: Replace with actual auth
    return this.branchesService.create(userId, createBranchDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all connections for the current user' })
  @ApiResponse({ status: 200, description: 'Connections retrieved successfully', type: PaginatedBranchesResponseDto })
  findAll(@Request() req: any, @Query() query: GetBranchesQueryDto): Promise<PaginatedBranchesResponseDto> {
    const userId = req.user?.id || 'test-user-123'; // TODO: Replace with actual auth
    return this.branchesService.findAllByUser(userId, query);
  }

  @Get('memory-tree')
  @ApiOperation({ summary: 'Get the complete memory tree visualization data' })
  @ApiResponse({ status: 200, description: 'Memory tree data retrieved successfully', type: MemoryTreeResponseDto })
  getMemoryTree(@Request() req: any): Promise<MemoryTreeResponseDto> {
    const userId = req.user?.id || 'test-user-123'; // TODO: Replace with actual auth
    return this.branchesService.getMemoryTree(userId);
  }

  @Get('visualization')
  @ApiOperation({ summary: 'Get enhanced visualization data with customizable layout and styling' })
  @ApiResponse({ status: 200, description: 'Visualization data retrieved successfully', type: VisualizationResponseDto })
  getVisualization(@Request() req: any, @Query() query: VisualizationQueryDto): Promise<VisualizationResponseDto> {
    const userId = req.user?.id || 'test-user-123'; // TODO: Replace with actual auth
    return this.branchesService.getVisualization(userId, query);
  }

  @Post('auto-link')
  @ApiOperation({ summary: 'Automatically create connections between fragments' })
  @ApiResponse({ status: 201, description: 'Auto-connections created successfully', type: [BranchResponseDto] })
  @ApiResponse({ status: 404, description: 'Fragment not found (when fragmentId specified)' })
  autoLink(@Request() req: any, @Query() query: AutoLinkQueryDto): Promise<BranchResponseDto[]> {
    const userId = req.user?.id || 'test-user-123'; // TODO: Replace with actual auth
    return this.branchesService.autoLinkFragments(userId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific connection by ID' })
  @ApiResponse({ status: 200, description: 'Connection retrieved successfully', type: BranchResponseDto })
  @ApiResponse({ status: 404, description: 'Connection not found' })
  findOne(@Request() req: any, @Param('id') id: string): Promise<BranchResponseDto> {
    const userId = req.user?.id || 'test-user-123'; // TODO: Replace with actual auth
    return this.branchesService.findOne(id, userId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a connection' })
  @ApiResponse({ status: 200, description: 'Connection updated successfully', type: BranchResponseDto })
  @ApiResponse({ status: 404, description: 'Connection not found' })
  update(@Request() req: any, @Param('id') id: string, @Body() updateBranchDto: UpdateBranchDto): Promise<BranchResponseDto> {
    const userId = req.user?.id || 'test-user-123'; // TODO: Replace with actual auth
    return this.branchesService.update(id, userId, updateBranchDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a connection' })
  @ApiResponse({ status: 204, description: 'Connection deleted successfully' })
  @ApiResponse({ status: 404, description: 'Connection not found' })
  remove(@Request() req: any, @Param('id') id: string): Promise<void> {
    const userId = req.user?.id || 'test-user-123'; // TODO: Replace with actual auth
    return this.branchesService.remove(id, userId);
  }
}
