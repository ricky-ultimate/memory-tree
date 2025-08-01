import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
  ConflictException
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBranchDto, BranchType } from './dto/create-branch.dto';
import { UpdateBranchDto } from './dto/update-branch.dto';
import { GetBranchesQueryDto, AutoLinkQueryDto } from './dto/get-branches-query.dto';
import {
  BranchResponseDto,
  PaginatedBranchesResponseDto,
  MemoryTreeResponseDto,
  MemoryTreeNodeDto,
  MemoryTreeEdgeDto,
  BranchFragmentDto
} from './dto/branch-response.dto';
import {
  VisualizationQueryDto,
  VisualizationResponseDto,
  VisualizationNodeDto,
  VisualizationEdgeDto,
  VisualizationLayout,
  NodeSizeBy,
  ColorBy
} from './dto/visualization.dto';

@Injectable()
export class BranchesService {
  private readonly logger = new Logger(BranchesService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateBranchDto): Promise<BranchResponseDto> {
    try {
      // Validate that both fragments exist and belong to the user
      const [sourceFragment, targetFragment] = await Promise.all([
        this.prisma.fragment.findFirst({
          where: { id: dto.sourceId, userId }
        }),
        this.prisma.fragment.findFirst({
          where: { id: dto.targetId, userId }
        })
      ]);

      if (!sourceFragment) {
        throw new NotFoundException('Source fragment not found');
      }
      if (!targetFragment) {
        throw new NotFoundException('Target fragment not found');
      }

      // Prevent self-connections
      if (dto.sourceId === dto.targetId) {
        throw new BadRequestException('Cannot create connection to the same fragment');
      }

      // Check if connection already exists
      const existingBranch = await this.prisma.branch.findFirst({
        where: {
          OR: [
            { sourceId: dto.sourceId, targetId: dto.targetId },
            { sourceId: dto.targetId, targetId: dto.sourceId }
          ]
        }
      });

      if (existingBranch) {
        throw new ConflictException('Connection already exists between these fragments');
      }

      const branch = await this.prisma.branch.create({
        data: {
          sourceId: dto.sourceId,
          targetId: dto.targetId,
          type: dto.type,
          weight: dto.weight || 1.0,
          metadata: dto.metadata || {},
        },
        include: {
          source: true,
          target: true,
        }
      });

      this.logger.log(`Branch created: ${branch.id} (${dto.type})`);
      return this.mapToResponseDto(branch);
    } catch (error) {
      if (error instanceof NotFoundException ||
          error instanceof BadRequestException ||
          error instanceof ConflictException) {
        throw error;
      }

      this.logger.error('Failed to create branch', error.stack);
      throw new InternalServerErrorException('Failed to create connection');
    }
  }

  async findAllByUser(
    userId: string,
    query: GetBranchesQueryDto
  ): Promise<PaginatedBranchesResponseDto> {
    try {
      const { page = 1, limit = 20, type, sourceId, targetId, fragmentId, minWeight, maxWeight, search, startDate, endDate } = query;
      const skip = (page - 1) * limit;

      // Build where clause
      const where: any = {
        OR: [
          { source: { userId } },
          { target: { userId } }
        ]
      };

      if (type) where.type = type;
      if (sourceId) where.sourceId = sourceId;
      if (targetId) where.targetId = targetId;
      if (fragmentId) {
        where.OR = [
          { sourceId: fragmentId },
          { targetId: fragmentId }
        ];
      }
      if (minWeight !== undefined) {
        where.weight = { ...where.weight, gte: minWeight };
      }
      if (maxWeight !== undefined) {
        where.weight = { ...where.weight, lte: maxWeight };
      }
      if (search) {
        where.OR = [
          { source: { content: { contains: search, mode: 'insensitive' } } },
          { target: { content: { contains: search, mode: 'insensitive' } } }
        ];
      }
      if (startDate || endDate) {
        where.createdAt = {};
        if (startDate) where.createdAt.gte = new Date(startDate);
        if (endDate) where.createdAt.lte = new Date(endDate);
      }

      const [branches, total] = await Promise.all([
        this.prisma.branch.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
          include: {
            source: true,
            target: true,
          }
        }),
        this.prisma.branch.count({ where })
      ]);

      const totalPages = Math.ceil(total / limit);

      return {
        data: branches.map(this.mapToResponseDto.bind(this)),
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
      this.logger.error(`Failed to fetch branches for user ${userId}`, error.stack);
      throw new InternalServerErrorException('Failed to fetch connections');
    }
  }

  async findOne(id: string, userId: string): Promise<BranchResponseDto> {
    try {
      const branch = await this.prisma.branch.findFirst({
        where: {
          id,
          OR: [
            { source: { userId } },
            { target: { userId } }
          ]
        },
        include: {
          source: true,
          target: true,
        }
      });

      if (!branch) {
        throw new NotFoundException('Connection not found');
      }

      return this.mapToResponseDto(branch);
    } catch (error) {
      if (error instanceof NotFoundException) throw error;

      this.logger.error(`Failed to fetch branch ${id} for user ${userId}`, error.stack);
      throw new InternalServerErrorException('Failed to fetch connection');
    }
  }

  async update(id: string, userId: string, dto: UpdateBranchDto): Promise<BranchResponseDto> {
    try {
      // First check if branch exists and user has access
      const existingBranch = await this.prisma.branch.findFirst({
        where: {
          id,
          OR: [
            { source: { userId } },
            { target: { userId } }
          ]
        }
      });

      if (!existingBranch) {
        throw new NotFoundException('Connection not found');
      }

      const branch = await this.prisma.branch.update({
        where: { id },
        data: {
          ...(dto.type && { type: dto.type }),
          ...(dto.weight !== undefined && { weight: dto.weight }),
          metadata: {
            ...((existingBranch.metadata as Record<string, any>) || {}),
            ...(dto.metadata || {}),
          },
        },
        include: {
          source: true,
          target: true,
        }
      });

      this.logger.log(`Branch ${id} updated successfully for user ${userId}`);
      return this.mapToResponseDto(branch);
    } catch (error) {
      if (error instanceof NotFoundException) throw error;

      this.logger.error(`Failed to update branch ${id} for user ${userId}`, error.stack);
      throw new InternalServerErrorException('Failed to update connection');
    }
  }

  async remove(id: string, userId: string): Promise<void> {
    try {
      const branch = await this.prisma.branch.findFirst({
        where: {
          id,
          OR: [
            { source: { userId } },
            { target: { userId } }
          ]
        }
      });

      if (!branch) {
        throw new NotFoundException('Connection not found');
      }

      await this.prisma.branch.delete({
        where: { id }
      });

      this.logger.log(`Branch ${id} deleted successfully for user ${userId}`);
    } catch (error) {
      if (error instanceof NotFoundException) throw error;

      this.logger.error(`Failed to delete branch ${id} for user ${userId}`, error.stack);
      throw new InternalServerErrorException('Failed to delete connection');
    }
  }

  async getMemoryTree(userId: string): Promise<MemoryTreeResponseDto> {
    try {
      const [fragments, branches] = await Promise.all([
        this.prisma.fragment.findMany({
          where: { userId },
          include: {
            _count: {
              select: {
                branchesFrom: true,
                branchesTo: true,
              }
            }
          }
        }),
        this.prisma.branch.findMany({
          where: {
            OR: [
              { source: { userId } },
              { target: { userId } }
            ]
          },
          include: {
            source: true,
            target: true,
          }
        })
      ]);

      // Build nodes
      const nodes: MemoryTreeNodeDto[] = fragments.map(fragment => ({
        id: fragment.id,
        content: fragment.content,
        type: fragment.type,
        tags: (fragment.metadata as any)?.tags || [],
        mood: (fragment.metadata as any)?.mood,
        createdAt: fragment.createdAt,
        connectionCount: fragment._count.branchesFrom + fragment._count.branchesTo,
      }));

      // Build edges
      const edges: MemoryTreeEdgeDto[] = branches.map(branch => ({
        id: branch.id,
        source: branch.sourceId,
        target: branch.targetId,
        type: branch.type as BranchType,
        weight: branch.weight,
        metadata: branch.metadata as Record<string, any>,
      }));

      // Calculate stats
      const connectionTypes = branches.reduce((acc, branch) => {
        acc[branch.type] = (acc[branch.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const stats = {
        totalFragments: fragments.length,
        totalConnections: branches.length,
        averageConnections: fragments.length > 0 ? branches.length / fragments.length : 0,
        strongestConnection: branches.length > 0 ? Math.max(...branches.map(b => b.weight)) : 0,
        connectionTypes,
      };

      return { nodes, edges, stats };
    } catch (error) {
      this.logger.error(`Failed to get memory tree for user ${userId}`, error.stack);
      throw new InternalServerErrorException('Failed to get memory tree');
    }
  }

  async autoLinkFragments(userId: string, query: AutoLinkQueryDto): Promise<BranchResponseDto[]> {
    try {
      const { fragmentId, types = [BranchType.THEME, BranchType.EMOTION, BranchType.TIME], minWeight = 0.3, maxConnections = 10, bidirectional = false } = query;

      let fragments: any[];
      if (fragmentId) {
        // Find connections for a specific fragment
        const targetFragment = await this.prisma.fragment.findFirst({
          where: { id: fragmentId, userId }
        });
        if (!targetFragment) {
          throw new NotFoundException('Fragment not found');
        }

        fragments = await this.prisma.fragment.findMany({
          where: {
            userId,
            id: { not: fragmentId },
            // Exclude fragments that already have connections
            AND: [
              {
                NOT: {
                  branchesFrom: {
                    some: { targetId: fragmentId }
                  }
                }
              },
              {
                NOT: {
                  branchesTo: {
                    some: { sourceId: fragmentId }
                  }
                }
              }
            ]
          }
        });
      } else {
        // Find connections for all fragments
        fragments = await this.prisma.fragment.findMany({
          where: { userId },
          orderBy: { createdAt: 'desc' },
          take: 100 // Limit to recent fragments for performance
        });
      }

      const connections: Array<{
        sourceId: string;
        targetId: string;
        type: BranchType;
        weight: number;
        metadata: Record<string, any>;
      }> = [];

      // Process each fragment for auto-linking
      for (const fragment of fragments) {
        if (fragmentId && fragment.id === fragmentId) continue;

        const candidates = fragmentId
          ? [await this.prisma.fragment.findUnique({ where: { id: fragmentId } })]
          : fragments.filter((f: any) => f.id !== fragment.id);

        for (const candidate of candidates) {
          if (!candidate) continue;

          const connectionData = this.calculateConnectionStrength(fragment, candidate, types);

          if (connectionData.weight >= minWeight) {
            connections.push({
              sourceId: fragment.id,
              targetId: candidate.id,
              type: connectionData.type,
              weight: connectionData.weight,
              metadata: connectionData.metadata,
            });

            if (bidirectional && connectionData.weight > 0.5) {
              connections.push({
                sourceId: candidate.id,
                targetId: fragment.id,
                type: connectionData.type,
                weight: connectionData.weight,
                metadata: connectionData.metadata,
              });
            }
          }
        }
      }

      // Sort by weight and limit
      const topConnections = connections
        .sort((a, b) => b.weight - a.weight)
        .slice(0, maxConnections);

      // Create the connections in database
      const createdBranches: BranchResponseDto[] = [];
      for (const conn of topConnections) {
        try {
          const branch = await this.create(userId, {
            sourceId: conn.sourceId,
            targetId: conn.targetId,
            type: conn.type,
            weight: conn.weight,
            metadata: conn.metadata,
          });
          createdBranches.push(branch);
        } catch (error) {
          // Skip if connection already exists or other error
          this.logger.warn(`Failed to create auto-connection: ${error.message}`);
        }
      }

      this.logger.log(`Auto-linked ${createdBranches.length} fragments for user ${userId}`);
      return createdBranches;
    } catch (error) {
      if (error instanceof NotFoundException) throw error;

      this.logger.error(`Failed to auto-link fragments for user ${userId}`, error.stack);
      throw new InternalServerErrorException('Failed to auto-link fragments');
    }
  }

  private calculateConnectionStrength(
    fragment1: any,
    fragment2: any,
    allowedTypes: BranchType[]
  ): { type: BranchType; weight: number; metadata: Record<string, any> } {
    const scores: Array<{ type: BranchType; weight: number; metadata: Record<string, any> }> = [];

    // Time-based connections
    if (allowedTypes.includes(BranchType.TIME)) {
      const timeDiff = Math.abs(
        new Date(fragment1.createdAt).getTime() - new Date(fragment2.createdAt).getTime()
      );
      const daysDiff = timeDiff / (1000 * 60 * 60 * 24);

      // Stronger connection for fragments created closer in time
      let timeWeight = 0;
      if (daysDiff <= 1) timeWeight = 0.9;
      else if (daysDiff <= 7) timeWeight = 0.7;
      else if (daysDiff <= 30) timeWeight = 0.5;
      else if (daysDiff <= 90) timeWeight = 0.3;

      if (timeWeight > 0) {
        scores.push({
          type: BranchType.TIME,
          weight: timeWeight,
          metadata: { daysDifference: Math.round(daysDiff) }
        });
      }
    }

    // Tag-based connections
    if (allowedTypes.includes(BranchType.THEME)) {
      const tags1 = (fragment1.metadata as any)?.tags || [];
      const tags2 = (fragment2.metadata as any)?.tags || [];

      if (tags1.length > 0 && tags2.length > 0) {
        const commonTags = tags1.filter((tag: string) => tags2.includes(tag));
        const tagWeight = commonTags.length / Math.max(tags1.length, tags2.length);

        if (tagWeight > 0.2) {
          scores.push({
            type: BranchType.THEME,
            weight: Math.min(tagWeight * 1.2, 1.0),
            metadata: { commonTags, similarity: tagWeight }
          });
        }
      }
    }

    // Emotion-based connections
    if (allowedTypes.includes(BranchType.EMOTION)) {
      const mood1 = (fragment1.metadata as any)?.mood;
      const mood2 = (fragment2.metadata as any)?.mood;

      if (mood1 && mood2) {
        if (mood1 === mood2) {
          scores.push({
            type: BranchType.EMOTION,
            weight: 0.8,
            metadata: { sharedMood: mood1 }
          });
        } else {
          // Similar emotions (could be expanded with emotion similarity mapping)
          const emotionSimilarity = this.getEmotionSimilarity(mood1, mood2);
          if (emotionSimilarity > 0.3) {
            scores.push({
              type: BranchType.EMOTION,
              weight: emotionSimilarity,
              metadata: { mood1, mood2, similarity: emotionSimilarity }
            });
          }
        }
      }
    }

    // Content similarity (basic keyword matching)
    if (allowedTypes.includes(BranchType.SEMANTIC)) {
      const contentSimilarity = this.calculateContentSimilarity(fragment1.content, fragment2.content);
      if (contentSimilarity > 0.3) {
        scores.push({
          type: BranchType.SEMANTIC,
          weight: contentSimilarity,
          metadata: { contentSimilarity }
        });
      }
    }

    // Return the strongest connection
    if (scores.length === 0) {
      return { type: BranchType.MANUAL, weight: 0, metadata: {} };
    }

    return scores.reduce((best, current) =>
      current.weight > best.weight ? current : best
    );
  }

  private getEmotionSimilarity(mood1: string, mood2: string): number {
    // Simple emotion similarity mapping - can be expanded with more sophisticated emotion analysis
    const emotionGroups = {
      positive: ['happy', 'joy', 'excited', 'grateful', 'content', 'peaceful', 'optimistic'],
      negative: ['sad', 'angry', 'frustrated', 'anxious', 'worried', 'stressed', 'overwhelmed'],
      neutral: ['calm', 'thoughtful', 'reflective', 'curious', 'focused'],
      energetic: ['excited', 'motivated', 'energetic', 'passionate', 'enthusiastic'],
      low: ['tired', 'drained', 'melancholy', 'quiet', 'subdued']
    };

    // Find which groups each mood belongs to
    const groups1 = Object.keys(emotionGroups).filter(group =>
      emotionGroups[group as keyof typeof emotionGroups].includes(mood1.toLowerCase())
    );
    const groups2 = Object.keys(emotionGroups).filter(group =>
      emotionGroups[group as keyof typeof emotionGroups].includes(mood2.toLowerCase())
    );

    // Calculate similarity based on shared groups
    const commonGroups = groups1.filter(group => groups2.includes(group));
    if (commonGroups.length > 0) {
      return 0.6; // Moderate similarity for same emotion group
    }

    return 0; // No similarity
  }

  private calculateContentSimilarity(content1: string, content2: string): number {
    // Simple keyword-based similarity - can be enhanced with NLP/embeddings
    const words1 = content1.toLowerCase().split(/\s+/).filter(word => word.length > 3);
    const words2 = content2.toLowerCase().split(/\s+/).filter(word => word.length > 3);

    if (words1.length === 0 || words2.length === 0) return 0;

    const commonWords = words1.filter(word => words2.includes(word));
    const similarity = commonWords.length / Math.max(words1.length, words2.length);

    return Math.min(similarity * 1.5, 1.0); // Boost similarity slightly
  }

  async getVisualization(userId: string, query: VisualizationQueryDto): Promise<VisualizationResponseDto> {
    try {
      // Build filters
      const fragmentWhere: any = { userId };
      const branchWhere: any = {
        OR: [
          { source: { userId } },
          { target: { userId } }
        ]
      };

      if (query.fragmentTypes?.length) {
        fragmentWhere.type = { in: query.fragmentTypes };
      }
      if (query.tags?.length) {
        fragmentWhere.metadata = {
          path: ['tags'],
          array_contains: query.tags
        };
      }
      if (query.startDate || query.endDate) {
        fragmentWhere.createdAt = {};
        if (query.startDate) fragmentWhere.createdAt.gte = new Date(query.startDate);
        if (query.endDate) fragmentWhere.createdAt.lte = new Date(query.endDate);
      }
      if (query.connectionTypes?.length) {
        branchWhere.type = { in: query.connectionTypes };
      }
      if (query.minWeight) {
        branchWhere.weight = { gte: query.minWeight };
      }

      // Get data
      let [fragments, branches] = await Promise.all([
        this.prisma.fragment.findMany({
          where: fragmentWhere,
          include: {
            _count: {
              select: {
                branchesFrom: true,
                branchesTo: true,
              }
            }
          }
        }),
        this.prisma.branch.findMany({
          where: branchWhere,
          include: {
            source: true,
            target: true,
          }
        })
      ]);

      // Focus filtering if specified
      if (query.focusFragmentId) {
        const connectedFragmentIds = this.getConnectedFragments(
          query.focusFragmentId,
          branches,
          query.maxDepth || 2
        );
        fragments = fragments.filter(f => connectedFragmentIds.has(f.id));
        branches = branches.filter(b =>
          connectedFragmentIds.has(b.sourceId) && connectedFragmentIds.has(b.targetId)
        );
      }

      // Calculate node properties
      const nodes: VisualizationNodeDto[] = fragments.map(fragment => {
        const connectionCount = fragment._count.branchesFrom + fragment._count.branchesTo;

        return {
          id: fragment.id,
          content: fragment.content,
          type: fragment.type,
          tags: (fragment.metadata as any)?.tags || [],
          mood: (fragment.metadata as any)?.mood,
          createdAt: fragment.createdAt,
          connectionCount,
          size: this.calculateNodeSize(fragment, connectionCount, query.nodeSizeBy),
          color: this.calculateNodeColor(fragment, query.colorBy),
          cluster: this.calculateCluster(fragment, query.colorBy),
        };
      });

      // Calculate edge properties
      const edges: VisualizationEdgeDto[] = branches.map(branch => ({
        id: branch.id,
        source: branch.sourceId,
        target: branch.targetId,
        type: branch.type,
        weight: branch.weight,
        color: this.calculateEdgeColor(branch),
        width: Math.max(1, branch.weight * 5),
        metadata: branch.metadata as Record<string, any>,
      }));

      // Calculate stats
      const dates = fragments.map(f => f.createdAt);
      const minDate = dates.length > 0 ? new Date(Math.min(...dates.map(d => d.getTime()))) : new Date();
      const maxDate = dates.length > 0 ? new Date(Math.max(...dates.map(d => d.getTime()))) : new Date();
      const daysDiff = Math.ceil((maxDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24));

      const stats = {
        totalNodes: nodes.length,
        totalEdges: edges.length,
        clusters: new Set(nodes.map(n => n.cluster)).size,
        timeSpan: {
          start: minDate,
          end: maxDate,
          days: daysDiff,
        },
        colorLegend: this.generateColorLegend(query.colorBy, fragments),
        sizeLegend: {
          min: Math.min(...nodes.map(n => n.size)),
          max: Math.max(...nodes.map(n => n.size)),
          metric: query.nodeSizeBy || NodeSizeBy.CONNECTIONS,
        },
      };

      return {
        nodes,
        edges,
        layout: query.layout || VisualizationLayout.FORCE,
        stats,
      };
    } catch (error) {
      this.logger.error(`Failed to get visualization for user ${userId}`, error.stack);
      throw new InternalServerErrorException('Failed to get visualization');
    }
  }

  private mapToResponseDto(branch: any): BranchResponseDto {
    return {
      id: branch.id,
      type: branch.type,
      weight: branch.weight,
      metadata: branch.metadata || {},
      createdAt: branch.createdAt,
      updatedAt: branch.updatedAt,
      source: this.mapFragmentDto(branch.source),
      target: this.mapFragmentDto(branch.target),
    };
  }

  private mapFragmentDto(fragment: any): BranchFragmentDto {
    return {
      id: fragment.id,
      content: fragment.content,
      type: fragment.type,
      createdAt: fragment.createdAt,
      tags: (fragment.metadata as any)?.tags || [],
      mood: (fragment.metadata as any)?.mood,
    };
  }

  private getConnectedFragments(
    startFragmentId: string,
    branches: any[],
    maxDepth: number
  ): Set<string> {
    const connected = new Set<string>([startFragmentId]);
    const queue = [{ id: startFragmentId, depth: 0 }];

    while (queue.length > 0) {
      const { id, depth } = queue.shift()!;

      if (depth >= maxDepth) continue;

      for (const branch of branches) {
        if (branch.sourceId === id && !connected.has(branch.targetId)) {
          connected.add(branch.targetId);
          queue.push({ id: branch.targetId, depth: depth + 1 });
        }
        if (branch.targetId === id && !connected.has(branch.sourceId)) {
          connected.add(branch.sourceId);
          queue.push({ id: branch.sourceId, depth: depth + 1 });
        }
      }
    }

    return connected;
  }

  private calculateNodeSize(fragment: any, connectionCount: number, sizeBy?: NodeSizeBy): number {
    const baseSize = 10;
    const maxSize = 50;

    switch (sizeBy) {
      case NodeSizeBy.CONNECTIONS:
        return Math.min(baseSize + connectionCount * 5, maxSize);
      case NodeSizeBy.CONTENT_LENGTH:
        return Math.min(baseSize + fragment.content.length / 10, maxSize);
      case NodeSizeBy.RECENCY:
        const daysSinceCreation = (Date.now() - new Date(fragment.createdAt).getTime()) / (1000 * 60 * 60 * 24);
        return Math.min(baseSize + Math.max(0, 30 - daysSinceCreation), maxSize);
      case NodeSizeBy.UNIFORM:
      default:
        return baseSize + 5;
    }
  }

  private calculateNodeColor(fragment: any, colorBy?: ColorBy): string {
    const colors = {
      TEXT: '#3B82F6',
      AUDIO: '#10B981',
      DREAM: '#8B5CF6',
      QUOTE: '#F59E0B',
      FEELING: '#EF4444',
      REFLECTION: '#6366F1',
    };

    switch (colorBy) {
      case ColorBy.TYPE:
        return colors[fragment.type as keyof typeof colors] || '#6B7280';
      case ColorBy.MOOD:
        return this.getMoodColor((fragment.metadata as any)?.mood);
      case ColorBy.TIME:
        return this.getTimeColor(fragment.createdAt);
      case ColorBy.CONNECTIONS:
        // Will be calculated based on connection count
        return '#6B7280';
      default:
        return colors[fragment.type as keyof typeof colors] || '#6B7280';
    }
  }

  private calculateCluster(fragment: any, colorBy?: ColorBy): string {
    switch (colorBy) {
      case ColorBy.TYPE:
        return fragment.type;
      case ColorBy.MOOD:
        return (fragment.metadata as any)?.mood || 'neutral';
      case ColorBy.TAGS:
        const tags = (fragment.metadata as any)?.tags || [];
        return tags.length > 0 ? tags[0] : 'untagged';
      case ColorBy.TIME:
        const date = new Date(fragment.createdAt);
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      default:
        return fragment.type;
    }
  }

  private calculateEdgeColor(branch: any): string {
    const colors = {
      THEME: '#3B82F6',
      EMOTION: '#EF4444',
      TIME: '#10B981',
      MEMORY: '#8B5CF6',
      MANUAL: '#F59E0B',
      SEMANTIC: '#6366F1',
    };
    return colors[branch.type as keyof typeof colors] || '#6B7280';
  }

  private getMoodColor(mood?: string): string {
    if (!mood) return '#6B7280';

    const moodColors = {
      happy: '#10B981',
      sad: '#3B82F6',
      angry: '#EF4444',
      anxious: '#F59E0B',
      peaceful: '#8B5CF6',
      excited: '#EC4899',
      calm: '#06B6D4',
      frustrated: '#DC2626',
      grateful: '#059669',
      worried: '#D97706',
    };

    return moodColors[mood.toLowerCase() as keyof typeof moodColors] || '#6B7280';
  }

  private getTimeColor(createdAt: Date): string {
    const now = new Date();
    const daysDiff = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24);

    if (daysDiff <= 1) return '#10B981'; // Green for recent
    if (daysDiff <= 7) return '#3B82F6'; // Blue for this week
    if (daysDiff <= 30) return '#F59E0B'; // Orange for this month
    if (daysDiff <= 90) return '#8B5CF6'; // Purple for this quarter
    return '#6B7280'; // Gray for older
  }

  private generateColorLegend(colorBy?: ColorBy, fragments?: any[]): Record<string, string> {
    switch (colorBy) {
      case ColorBy.TYPE:
        return {
          'TEXT': '#3B82F6',
          'AUDIO': '#10B981',
          'DREAM': '#8B5CF6',
          'QUOTE': '#F59E0B',
          'FEELING': '#EF4444',
          'REFLECTION': '#6366F1',
        };
      case ColorBy.MOOD:
        const moods = new Set(fragments?.map(f => (f.metadata as any)?.mood).filter(Boolean));
        const legend: Record<string, string> = {};
        moods.forEach(mood => {
          legend[mood] = this.getMoodColor(mood);
        });
        return legend;
      case ColorBy.TIME:
        return {
          'Today': '#10B981',
          'This Week': '#3B82F6',
          'This Month': '#F59E0B',
          'This Quarter': '#8B5CF6',
          'Older': '#6B7280',
        };
      default:
        return {};
    }
  }
}
