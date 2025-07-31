import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { FragmentType } from 'generated/prisma';

export class UserSummaryDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  email: string;

  @ApiPropertyOptional()
  name?: string;
}

export class FragmentResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  content: string;

  @ApiProperty({ enum: FragmentType })
  type: FragmentType;

  @ApiPropertyOptional()
  tags?: string[];

  @ApiPropertyOptional()
  mood?: string;

  @ApiProperty()
  metadata: Record<string, any>;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty({ type: () => UserSummaryDto })
  user: UserSummaryDto;
}

export class PaginatedFragmentsResponseDto {
  @ApiProperty({ type: [FragmentResponseDto] })
  data: FragmentResponseDto[];

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
