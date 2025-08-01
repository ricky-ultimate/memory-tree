import { IsString, IsOptional, IsNumber, Min, Max, IsObject, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum BranchType {
  THEME = 'THEME',
  EMOTION = 'EMOTION',
  TIME = 'TIME',
  MEMORY = 'MEMORY',
  MANUAL = 'MANUAL',
  SEMANTIC = 'SEMANTIC'
}

export class CreateBranchDto {
  @ApiProperty({
    description: 'ID of the source fragment',
    example: 'clxyz123abc'
  })
  @IsString()
  sourceId: string;

  @ApiProperty({
    description: 'ID of the target fragment',
    example: 'clxyz456def'
  })
  @IsString()
  targetId: string;

  @ApiProperty({
    description: 'Type of connection between fragments',
    enum: BranchType,
    example: BranchType.MANUAL
  })
  @IsEnum(BranchType)
  type: BranchType;

  @ApiPropertyOptional({
    description: 'Strength of connection (0.0 - 1.0)',
    minimum: 0,
    maximum: 1,
    example: 0.8
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  weight?: number;

  @ApiPropertyOptional({
    description: 'Additional metadata about the connection',
    example: { reason: 'Both mention feeling anxious about work' }
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}
