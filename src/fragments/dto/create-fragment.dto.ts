import {
  IsString,
  IsOptional,
  IsEnum,
  IsObject,
  MaxLength,
  MinLength,
  IsArray,
  ArrayMaxSize,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { FragmentType } from 'generated/prisma';

export class CreateFragmentDto {
  @ApiProperty({
    description: 'Fragment content - your thoughts, feelings, or memories',
    example:
      'Today I realized that growth happens in the quiet moments between big decisions...',
    minLength: 1,
    maxLength: 10000,
  })
  @IsString()
  @MinLength(1, { message: 'Content cannot be empty' })
  @MaxLength(10000, { message: 'Content too long (max 10,000 characters)' })
  content: string;

  @ApiPropertyOptional({
    description: 'Type of fragment',
    enum: FragmentType,
    default: FragmentType.TEXT,
    example: FragmentType.REFLECTION,
  })
  @IsOptional()
  @IsEnum(FragmentType, { message: 'Invalid fragment type' })
  type?: FragmentType;

  @ApiPropertyOptional({
    description: 'Tags for organizing fragments',
    example: ['growth', 'insight', 'relationships'],
    maxItems: 10,
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(10, { message: 'Maximum 10 tags allowed' })
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({
    description: 'Mood or emotional state',
    example: 'reflective',
    maxLength: 50,
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  mood?: string;

  @ApiPropertyOptional({
    description: 'Additional metadata',
    example: { location: 'home', weather: 'rainy', energy: 7 },
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}
