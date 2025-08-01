import { IsOptional, IsString, IsNumber, Min, IsEnum, IsArray } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { BranchType } from './create-branch.dto';

export class GetBranchesQueryDto {
  @ApiPropertyOptional({
    description: 'Page number for pagination',
    minimum: 1,
    default: 1
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Number of items per page',
    minimum: 1,
    maximum: 100,
    default: 20
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number = 20;

  @ApiPropertyOptional({
    description: 'Filter by branch type',
    enum: BranchType
  })
  @IsOptional()
  @IsEnum(BranchType)
  type?: BranchType;

  @ApiPropertyOptional({
    description: 'Filter by source fragment ID'
  })
  @IsOptional()
  @IsString()
  sourceId?: string;

  @ApiPropertyOptional({
    description: 'Filter by target fragment ID'
  })
  @IsOptional()
  @IsString()
  targetId?: string;

  @ApiPropertyOptional({
    description: 'Filter by fragment ID (either source or target)'
  })
  @IsOptional()
  @IsString()
  fragmentId?: string;

  @ApiPropertyOptional({
    description: 'Minimum connection weight',
    minimum: 0,
    maximum: 1
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minWeight?: number;

  @ApiPropertyOptional({
    description: 'Maximum connection weight',
    minimum: 0,
    maximum: 1
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  maxWeight?: number;

  @ApiPropertyOptional({
    description: 'Search in connection metadata',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Start date for filtering by creation date',
    example: '2024-01-01'
  })
  @IsOptional()
  @IsString()
  startDate?: string;

  @ApiPropertyOptional({
    description: 'End date for filtering by creation date',
    example: '2024-12-31'
  })
  @IsOptional()
  @IsString()
  endDate?: string;
}

export class AutoLinkQueryDto {
  @ApiPropertyOptional({
    description: 'Fragment ID to find connections for'
  })
  @IsOptional()
  @IsString()
  fragmentId?: string;

  @ApiPropertyOptional({
    description: 'Types of connections to create',
    enum: BranchType,
    isArray: true
  })
  @IsOptional()
  @IsArray()
  @IsEnum(BranchType, { each: true })
  @Transform(({ value }) => Array.isArray(value) ? value : [value])
  types?: BranchType[];

  @ApiPropertyOptional({
    description: 'Minimum weight threshold for auto-connections',
    minimum: 0,
    maximum: 1,
    default: 0.3
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minWeight?: number = 0.3;

  @ApiPropertyOptional({
    description: 'Maximum number of connections to create',
    minimum: 1,
    maximum: 50,
    default: 10
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  maxConnections?: number = 10;

  @ApiPropertyOptional({
    description: 'Whether to create bidirectional connections',
    default: false
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  bidirectional?: boolean = false;
}
