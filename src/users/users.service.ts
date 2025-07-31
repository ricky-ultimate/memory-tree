import { Injectable, Logger, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserResponseDto } from './dto/user-response.dto';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(createUserDto: CreateUserDto): Promise<UserResponseDto> {
    try {
      const user = await this.prisma.user.create({
        data: {
          id: createUserDto.id, // Clerk user ID
          email: createUserDto.email,
          name: createUserDto.name,
        },
      });

      this.logger.log(`User created successfully: ${user.id}`);
      return this.mapToResponseDto(user);
    } catch (error) {
      this.logger.error(`Failed to create user: ${createUserDto.email}`, error.stack);
      throw new InternalServerErrorException('Failed to create user');
    }
  }

  async findOrCreate(userData: { id: string; email: string; name?: string }): Promise<UserResponseDto> {
    try {
      let user = await this.prisma.user.findUnique({
        where: { id: userData.id },
      });

      if (!user) {
        user = await this.prisma.user.create({
          data: userData,
        });
        this.logger.log(`New user created from auth: ${user.id}`);
      }

      return this.mapToResponseDto(user);
    } catch (error) {
      this.logger.error(`Failed to find or create user: ${userData.id}`, error.stack);
      throw new InternalServerErrorException('Failed to process user');
    }
  }

  async findOne(id: string): Promise<UserResponseDto> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id },
        include: {
          _count: {
            select: { fragments: true },
          },
        },
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      return {
        ...this.mapToResponseDto(user),
        fragmentCount: user._count.fragments,
      };
    } catch (error) {
      if (error instanceof NotFoundException) throw error;

      this.logger.error(`Failed to fetch user: ${id}`, error.stack);
      throw new InternalServerErrorException('Failed to fetch user');
    }
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<UserResponseDto> {
    try {
      const user = await this.prisma.user.update({
        where: { id },
        data: {
          ...(updateUserDto.name && { name: updateUserDto.name }),
          ...(updateUserDto.email && { email: updateUserDto.email }),
        },
      });

      this.logger.log(`User updated successfully: ${id}`);
      return this.mapToResponseDto(user);
    } catch (error) {
      this.logger.error(`Failed to update user: ${id}`, error.stack);
      throw new InternalServerErrorException('Failed to update user');
    }
  }

  async remove(id: string): Promise<void> {
    try {
      await this.prisma.user.delete({
        where: { id },
      });

      this.logger.log(`User deleted successfully: ${id}`);
    } catch (error) {
      this.logger.error(`Failed to delete user: ${id}`, error.stack);
      throw new InternalServerErrorException('Failed to delete user');
    }
  }

  private mapToResponseDto(user: any): UserResponseDto {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
