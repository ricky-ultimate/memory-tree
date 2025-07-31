import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Fragment, FragmentType } from 'generated/prisma';

@Injectable()
export class FragmentsService {
  constructor(private prisma: PrismaService) {}

  async create(data: {
    content: string;
    type?: FragmentType;
    userId: string;
    metadata?: any;
  }): Promise<Fragment> {
    return this.prisma.fragment.create({
      data: {
        content: data.content,
        type: data.type || 'TEXT',
        userId: data.userId,
        metadata: data.metadata || {},
      },
    });
  }

  async findAllByUser(userId: string): Promise<Fragment[]> {
    return this.prisma.fragment.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, userId: string): Promise<Fragment | null> {
    return this.prisma.fragment.findFirst({
      where: { id, userId },
    });
  }

  async remove(id: string, userId: string): Promise<Fragment> {
    return this.prisma.fragment.delete({
      where: { id },
    });
  }
}
