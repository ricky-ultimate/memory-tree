import {
  Injectable,
  Logger,
  NotFoundException,
  InternalServerErrorException
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { FragmentType } from 'generated/prisma';
import { CreateFragmentDto } from './dto/create-fragment.dto';
import { UpdateFragmentDto } from './dto/update-fragment.dto';
import { GetFragmentsQueryDto } from './dto/get-fragments-query.dto';
import {
  FragmentResponseDto,
  PaginatedFragmentsResponseDto
} from './dto/fragment-response.dto';

@Injectable()
export class FragmentsService {
  private readonly logger = new Logger(FragmentsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateFragmentDto): Promise<FragmentResponseDto> {
    try {
      const fragment = await this.prisma.fragment.create({
        data: {
          content: dto.content,
          type: dto.type || FragmentType.TEXT,
          userId,
          metadata: {
            ...(dto.metadata || {}),
            tags: dto.tags || [],
            mood: dto.mood,
          },
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
            }
          }
        }
      });

      this.logger.log(`Fragment created successfully for user ${userId}`);
      return this.mapToResponseDto(fragment);
    } catch (error) {
      this.logger.error(`Failed to create fragment for user ${userId}`, error.stack);
      throw new InternalServerErrorException('Failed to create fragment');
    }
  }

  async findAllByUser(
    userId: string,
    query: GetFragmentsQueryDto
  ): Promise<PaginatedFragmentsResponseDto> {
    try {
      const { page = 1, limit = 20, type, search, tags, mood, startDate, endDate } = query;
      const skip = (page - 1) * limit;

      // Build where clause
      const where: any = { userId };

      if (type) where.type = type;
      if (search) {
        where.content = { contains: search, mode: 'insensitive' };
      }
      if (startDate || endDate) {
        where.createdAt = {};
        if (startDate) where.createdAt.gte = new Date(startDate);
        if (endDate) where.createdAt.lte = new Date(endDate);
      }
      if (tags?.length) {
        where.metadata = {
          path: ['tags'],
          array_contains: tags
        };
      }
      if (mood) {
        where.metadata = {
          path: ['mood'],
          equals: mood
        };
      }

      const [fragments, total] = await Promise.all([
        this.prisma.fragment.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
          include: {
            user: {
              select: { id: true, email: true, name: true }
            }
          }
        }),
        this.prisma.fragment.count({ where })
      ]);

      const totalPages = Math.ceil(total / limit);

      return {
        data: fragments.map(this.mapToResponseDto),
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        }
      };
    } catch (error) {
      this.logger.error(`Failed to fetch fragments for user ${userId}`, error.stack);
      throw new InternalServerErrorException('Failed to fetch fragments');
    }
  }

  async findOne(id: string, userId: string): Promise<FragmentResponseDto> {
    try {
      const fragment = await this.prisma.fragment.findFirst({
        where: { id, userId },
        include: {
          user: {
            select: { id: true, email: true, name: true }
          }
        }
      });

      if (!fragment) {
        throw new NotFoundException('Fragment not found');
      }

      return this.mapToResponseDto(fragment);
    } catch (error) {
      if (error instanceof NotFoundException) throw error;

      this.logger.error(`Failed to fetch fragment ${id} for user ${userId}`, error.stack);
      throw new InternalServerErrorException('Failed to fetch fragment');
    }
  }

  async update(id: string, userId: string, dto: UpdateFragmentDto): Promise<FragmentResponseDto> {
    try {
      // First check if fragment exists and belongs to user
      const existingFragment = await this.prisma.fragment.findFirst({
        where: { id, userId }
      });

      if (!existingFragment) {
        throw new NotFoundException('Fragment not found');
      }

      const fragment = await this.prisma.fragment.update({
        where: { id },
        data: {
          ...(dto.content && { content: dto.content }),
          ...(dto.type && { type: dto.type }),
          metadata: {
            ...((existingFragment.metadata as Record<string, any>) || {}),
            ...(dto.metadata || {}),
            ...(dto.tags && { tags: dto.tags }),
            ...(dto.mood && { mood: dto.mood }),
          },
        },
        include: {
          user: {
            select: { id: true, email: true, name: true }
          }
        }
      });

      this.logger.log(`Fragment ${id} updated successfully for user ${userId}`);
      return this.mapToResponseDto(fragment);
    } catch (error) {
      if (error instanceof NotFoundException) throw error;

      this.logger.error(`Failed to update fragment ${id} for user ${userId}`, error.stack);
      throw new InternalServerErrorException('Failed to update fragment');
    }
  }

  async remove(id: string, userId: string): Promise<void> {
    try {
      const fragment = await this.prisma.fragment.findFirst({
        where: { id, userId }
      });

      if (!fragment) {
        throw new NotFoundException('Fragment not found');
      }

      await this.prisma.fragment.delete({
        where: { id }
      });

      this.logger.log(`Fragment ${id} deleted successfully for user ${userId}`);
    } catch (error) {
      if (error instanceof NotFoundException) throw error;

      this.logger.error(`Failed to delete fragment ${id} for user ${userId}`, error.stack);
      throw new InternalServerErrorException('Failed to delete fragment');
    }
  }

  private mapToResponseDto(fragment: any): FragmentResponseDto {
    return {
      id: fragment.id,
      content: fragment.content,
      type: fragment.type,
      tags: fragment.metadata?.tags || [],
      mood: fragment.metadata?.mood,
      metadata: fragment.metadata || {},
      createdAt: fragment.createdAt,
      updatedAt: fragment.updatedAt,
      user: {
        id: fragment.user.id,
        email: fragment.user.email,
        name: fragment.user.name,
      }
    };
  }
}
