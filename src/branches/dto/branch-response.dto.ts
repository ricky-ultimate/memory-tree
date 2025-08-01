import { ApiProperty } from '@nestjs/swagger';
import { BranchType } from './create-branch.dto';

export class BranchFragmentDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  content: string;

  @ApiProperty()
  type: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  tags: string[];

  @ApiProperty()
  mood?: string;
}

export class BranchResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ enum: BranchType })
  type: BranchType;

  @ApiProperty()
  weight: number;

  @ApiProperty()
  metadata: Record<string, any>;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty({ type: BranchFragmentDto })
  source: BranchFragmentDto;

  @ApiProperty({ type: BranchFragmentDto })
  target: BranchFragmentDto;
}

export class PaginatedBranchesResponseDto {
  @ApiProperty({ type: [BranchResponseDto] })
  data: BranchResponseDto[];

  @ApiProperty()
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export class MemoryTreeNodeDto {
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
}

export class MemoryTreeEdgeDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  source: string;

  @ApiProperty()
  target: string;

  @ApiProperty({ enum: BranchType })
  type: BranchType;

  @ApiProperty()
  weight: number;

  @ApiProperty()
  metadata: Record<string, any>;
}

export class MemoryTreeResponseDto {
  @ApiProperty({ type: [MemoryTreeNodeDto] })
  nodes: MemoryTreeNodeDto[];

  @ApiProperty({ type: [MemoryTreeEdgeDto] })
  edges: MemoryTreeEdgeDto[];

  @ApiProperty()
  stats: {
    totalFragments: number;
    totalConnections: number;
    averageConnections: number;
    strongestConnection: number;
    connectionTypes: Record<string, number>;
  };
}
