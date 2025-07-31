import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UserResponseDto {
  @ApiProperty({
    description: 'User ID',
    example: 'user_2NiWoBO2hdTpKxMjYDqmHHGMaZb',
  })
  id: string;

  @ApiProperty({
    description: 'User email address',
    example: 'user@example.com',
  })
  email: string;

  @ApiPropertyOptional({
    description: 'User display name',
    example: 'John Doe',
  })
  name?: string;

  @ApiProperty({
    description: 'Account creation date',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Last update date',
  })
  updatedAt: Date;

  @ApiPropertyOptional({
    description: 'Number of fragments created by user',
    example: 42,
  })
  fragmentCount?: number;
}
