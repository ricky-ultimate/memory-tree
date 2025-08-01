import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsNumber, IsEnum, IsArray, Min, Max } from 'class-validator';
import { Type, Transform } from 'class-transformer';

export enum VisualizationLayout {
  FORCE = 'force',
  HIERARCHICAL = 'hierarchical', 
  CIRCULAR = 'circular',
  TIMELINE = 'timeline'
}

export enum NodeSizeBy {
  CONNECTIONS = 'connections',
  CONTENT_LENGTH = 'content_length',
  RECENCY = 'recency',
  UNIFORM = 'uniform'
}

export enum ColorBy {
  TYPE = 'type',
  MOOD = 'mood',
  TAGS = 'tags',
  TIME = 'time',
  CONNECTIONS = 'connections'
}

export class VisualizationQueryDto {
  @ApiPropertyOptional({
    description: 'Layout algorithm for the visualization',
    enum: VisualizationLayout,
    default: VisualizationLayout.FORCE
  })
  @IsOptional()
  @IsEnum(VisualizationLayout)
  layout?: VisualizationLayout = VisualizationLayout.FORCE;

  @ApiPropertyOptional({
    description: 'What to base node size on',
    enum: NodeSizeBy,
    default: NodeSizeBy.CONNECTIONS
  })
  @IsOptional()
  @IsEnum(NodeSizeBy)
  nodeSizeBy?: NodeSizeBy = NodeSizeBy.CONNECTIONS;

  @ApiPropertyOptional({
    description: 'What to base node color on',
    enum: ColorBy,
    default: ColorBy.TYPE
  })
  @IsOptional()
  @IsEnum(ColorBy)
  colorBy?: ColorBy = ColorBy.TYPE;

  @ApiPropertyOptional({
    description: 'Minimum connection weight to include',
    minimum: 0,
    maximum: 1,
    default: 0.1
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(1)
  minWeight?: number = 0.1;

  @ApiPropertyOptional({
    description: 'Filter by fragment types',
    isArray: true
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) => Array.isArray(value) ? value : [value])
  fragmentTypes?: string[];

  @ApiPropertyOptional({
    description: 'Filter by connection types',
    isArray: true
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) => Array.isArray(value) ? value : [value])
  connectionTypes?: string[];

  @ApiPropertyOptional({
    description: 'Filter by tags',
    isArray: true
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) => Array.isArray(value) ? value : [value])
  tags?: string[];

  @ApiPropertyOptional({
    description: 'Start date for time-based filtering',
    example: '2024-01-01'
  })
  @IsOptional()
  @IsString()
  startDate?: string;

  @ApiPropertyOptional({
    description: 'End date for time-based filtering',
    example: '2024-12-31'
  })
  @IsOptional()
  @IsString()
  endDate?: string;

  @ApiPropertyOptional({
    description: 'Focus on specific fragment and its connections',
  })
  @IsOptional()
  @IsString()
  focusFragmentId?: string;

  @ApiPropertyOptional({
    description: 'Maximum depth from focus fragment (if specified)',
    minimum: 1,
    maximum: 5,
    default: 2
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(5)
  maxDepth?: number = 2;
}

export class VisualizationNodeDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  content: string;

  @ApiProperty()
  type: string;

  @ApiProperty()
  tags: string[];

  @ApiProperty()
  mood?: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  connectionCount: number;

  @ApiProperty()
  size: number;

  @ApiProperty()
  color: string;

  @ApiProperty()
  x?: number;

  @ApiProperty()
  y?: number;

  @ApiProperty()
  cluster?: string;
}

export class VisualizationEdgeDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  source: string;

  @ApiProperty()
  target: string;

  @ApiProperty()
  type: string;

  @ApiProperty()
  weight: number;

  @ApiProperty()
  color: string;

  @ApiProperty()
  width: number;

  @ApiProperty()
  metadata: Record<string, any>;
}

export class VisualizationResponseDto {
  @ApiProperty({ type: [VisualizationNodeDto] })
  nodes: VisualizationNodeDto[];

  @ApiProperty({ type: [VisualizationEdgeDto] })
  edges: VisualizationEdgeDto[];

  @ApiProperty()
  layout: VisualizationLayout;

  @ApiProperty()
  stats: {
    totalNodes: number;
    totalEdges: number;
    clusters: number;
    timeSpan: {
      start: Date;
      end: Date;
      days: number;
    };
    colorLegend: Record<string, string>;
    sizeLegend: {
      min: number;
      max: number;
      metric: string;
    };
  };
}
