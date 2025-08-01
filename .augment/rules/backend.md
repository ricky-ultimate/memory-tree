---
type: "manual"
---

# MemoryTree Backend Rules for Augment

## 🎯 Project Context
Building MemoryTree - a private life archive app using NestJS + Prisma + PostgreSQL. Focus on production-ready code with proper architecture patterns.

---

## 🏗️ Code Standards & Architecture

### **No Placeholders Policy**
- Never generate placeholder code like `// TODO: implement later`
- Every function must have complete, working implementation
- If implementation is complex, break into smaller, complete functions
- Use proper error handling and validation in all code

### **Module Organization**
```
src/
├── common/           # Shared utilities, decorators, guards
├── config/          # Configuration modules
├── auth/            # Authentication & authorization
├── users/           # User management
├── fragments/       # Core fragment operations
├── branches/        # Fragment relationships
├── search/          # Search functionality
├── reflections/     # AI-powered insights
└── prisma/          # Database service
```

### **File Naming Conventions**
- Use kebab-case for directories: `fragment-analysis/`
- Use kebab-case for files: `create-fragment.dto.ts`
- Controllers: `fragments.controller.ts`
- Services: `fragments.service.ts`
- DTOs: `create-fragment.dto.ts`, `update-fragment.dto.ts`
- Entities: `fragment.entity.ts`

---

## 📝 DTO Requirements

### **Mandatory DTO Structure**
Every endpoint must have proper DTOs with:

```typescript
// Example: create-fragment.dto.ts
import { IsString, IsOptional, IsEnum, IsObject, MaxLength, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { FragmentType } from '@prisma/client';

export class CreateFragmentDto {
  @ApiProperty({
    description: 'Fragment content',
    example: 'Today I realized something important about myself...',
    minLength: 1,
    maxLength: 10000
  })
  @IsString()
  @MinLength(1)
  @MaxLength(10000)
  content: string;

  @ApiPropertyOptional({
    description: 'Type of fragment',
    enum: FragmentType,
    default: FragmentType.TEXT
  })
  @IsOptional()
  @IsEnum(FragmentType)
  type?: FragmentType;

  @ApiPropertyOptional({
    description: 'Additional metadata',
    example: { mood: 'reflective', tags: ['growth', 'insight'] }
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}
```

### **DTO Validation Rules**
- Use class-validator decorators on all properties
- Include Swagger API documentation
- Provide realistic examples
- Set appropriate length limits
- Use enums for restricted values
- Make optional fields explicitly optional with `@IsOptional()`

---

## 🛡️ Service Layer Patterns

### **Service Implementation Standards**
```typescript
@Injectable()
export class FragmentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: Logger,
  ) {}

  async create(userId: string, dto: CreateFragmentDto): Promise<FragmentResponseDto> {
    try {
      const fragment = await this.prisma.fragment.create({
        data: {
          ...dto,
          userId,
          type: dto.type || FragmentType.TEXT,
          metadata: dto.metadata || {},
        },
        include: {
          user: {
            select: { id: true, name: true, email: true }
          }
        }
      });

      return this.mapToResponseDto(fragment);
    } catch (error) {
      this.logger.error(`Failed to create fragment for user ${userId}`, error.stack);
      throw new InternalServerErrorException('Failed to create fragment');
    }
  }

  private mapToResponseDto(fragment: any): FragmentResponseDto {
    return {
      id: fragment.id,
      content: fragment.content,
      type: fragment.type,
      metadata: fragment.metadata,
      createdAt: fragment.createdAt,
      updatedAt: fragment.updatedAt,
      user: fragment.user,
    };
  }
}
```

### **Service Requirements**
- Always inject Logger for proper error tracking
- Use try-catch blocks with meaningful error messages
- Include proper Prisma relations in queries
- Create private mapping methods for DTOs
- Return response DTOs, never raw Prisma objects
- Use transactions for multi-table operations

---

## 🎮 Controller Best Practices

### **Controller Structure**
```typescript
@Controller('fragments')
@ApiTags('Fragments')
@UseGuards(JwtAuthGuard)
export class FragmentsController {
  constructor(private readonly fragmentsService: FragmentsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new fragment' })
  @ApiResponse({ 
    status: 201, 
    description: 'Fragment created successfully',
    type: FragmentResponseDto 
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async create(
    @Body() dto: CreateFragmentDto,
    @GetUser() user: UserPayload,
  ): Promise<FragmentResponseDto> {
    return this.fragmentsService.create(user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get user fragments with pagination' })
  @ApiResponse({ 
    status: 200, 
    description: 'Fragments retrieved successfully',
    type: PaginatedFragmentsResponseDto 
  })
  async findAll(
    @Query() query: GetFragmentsQueryDto,
    @GetUser() user: UserPayload,
  ): Promise<PaginatedFragmentsResponseDto> {
    return this.fragmentsService.findAllByUser(user.id, query);
  }
}
```

### **Controller Requirements**
- Use proper HTTP status codes
- Include comprehensive Swagger documentation
- Use custom decorators (like `@GetUser()`) instead of raw request objects
- Implement proper query parameter DTOs for GET endpoints
- Always use authentication guards
- Group related endpoints with `@ApiTags()`

---

## 🔐 Authentication & Security

### **Custom Decorators**
Create reusable decorators:

```typescript
// common/decorators/get-user.decorator.ts
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface UserPayload {
  id: string;
  email: string;
  name?: string;
}

export const GetUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): UserPayload => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
```

### **Guard Implementation**
```typescript
// auth/guards/jwt-auth.guard.ts
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);
    
    if (!token) {
      throw new UnauthorizedException('No authentication token provided');
    }

    try {
      const payload = await this.jwtService.verifyAsync(token);
      const user = await this.usersService.findById(payload.sub);
      
      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      request.user = {
        id: user.id,
        email: user.email,
        name: user.name,
      };
      
      return true;
    } catch (error) {
      throw new UnauthorizedException('Invalid authentication token');
    }
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
```

---

## 🗄️ Database Best Practices

### **Prisma Query Patterns**
```typescript
// Always use proper error handling and transactions
async createFragmentWithBranches(
  userId: string, 
  fragmentData: CreateFragmentDto,
  relatedFragmentIds: string[]
): Promise<FragmentWithBranchesDto> {
  return this.prisma.$transaction(async (tx) => {
    const fragment = await tx.fragment.create({
      data: {
        ...fragmentData,
        userId,
      },
    });

    if (relatedFragmentIds.length > 0) {
      await tx.branch.createMany({
        data: relatedFragmentIds.map(targetId => ({
          sourceId: fragment.id,
          targetId,
          type: 'RELATED',
          weight: 1.0,
        })),
      });
    }

    return tx.fragment.findUnique({
      where: { id: fragment.id },
      include: {
        branchesA: {
          include: {
            target: {
              select: { id: true, content: true, type: true }
            }
          }
        },
        branchesB: {
          include: {
            source: {
              select: { id: true, content: true, type: true }
            }
          }
        }
      }
    });
  });
}
```

### **Database Rules**
- Always use transactions for multi-table operations
- Use proper `select` and `include` to avoid over-fetching
- Implement soft deletes for important data
- Use database-level constraints where possible
- Create indexes for frequently queried fields

---

## 📊 Response DTO Patterns

### **Consistent Response Structure**
```typescript
// Base response interfaces
export interface BaseResponseDto {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PaginatedResponseDto<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Specific response DTOs
export class FragmentResponseDto implements BaseResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  content: string;

  @ApiProperty({ enum: FragmentType })
  type: FragmentType;

  @ApiProperty()
  metadata: Record<string, any>;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty({ type: () => UserSummaryDto })
  user: UserSummaryDto;
}
```

---

## 🧪 Testing Requirements

### **Service Tests**
```typescript
describe('FragmentsService', () => {
  let service: FragmentsService;
  let prismaService: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FragmentsService,
        {
          provide: PrismaService,
          useValue: createMockPrismaService(),
        },
        {
          provide: Logger,
          useValue: createMockLogger(),
        },
      ],
    }).compile();

    service = module.get<FragmentsService>(FragmentsService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  describe('create', () => {
    it('should create a fragment successfully', async () => {
      const userId = 'user-123';
      const dto: CreateFragmentDto = {
        content: 'Test fragment',
        type: FragmentType.TEXT,
      };

      const mockFragment = {
        id: 'fragment-123',
        ...dto,
        userId,
        createdAt: new Date(),
        updatedAt: new Date(),
        user: { id: userId, name: 'Test User', email: 'test@example.com' },
      };

      jest.spyOn(prismaService.fragment, 'create').mockResolvedValue(mockFragment);

      const result = await service.create(userId, dto);

      expect(result).toEqual({
        id: mockFragment.id,
        content: mockFragment.content,
        type: mockFragment.type,
        metadata: {},
        createdAt: mockFragment.createdAt,
        updatedAt: mockFragment.updatedAt,
        user: mockFragment.user,
      });
    });
  });
});
```

---

## 🚀 Performance Guidelines

### **Optimization Rules**
- Use database indexes for all frequently queried fields
- Implement proper pagination (never return unbounded results)
- Use Redis for caching expensive queries
- Lazy load relationships only when needed
- Use database-level aggregations instead of application-level calculations

### **Query Optimization**
```typescript
// Good: Efficient pagination with cursor
async findFragmentsPaginated(
  userId: string, 
  cursor?: string, 
  limit: number = 20
): Promise<PaginatedFragmentsResponseDto> {
  const fragments = await this.prisma.fragment.findMany({
    where: { userId },
    take: limit + 1, // +1 to check if there are more results
    ...(cursor && {
      cursor: { id: cursor },
      skip: 1, // Skip the cursor
    }),
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      content: true,
      type: true,
      createdAt: true,
      // Only select what we need
    },
  });

  const hasMore = fragments.length > limit;
  const data = hasMore ? fragments.slice(0, -1) : fragments;

  return {
    data: data.map(this.mapToResponseDto),
    pagination: {
      hasMore,
      nextCursor: hasMore ? data[data.length - 1].id : null,
    },
  };
}
```

---

## 🎯 Code Generation Instructions

When generating code for MemoryTree:

1. **Always start with proper DTOs** - Create input/output DTOs before controllers
2. **Include complete error handling** - Never skip try-catch blocks or proper error responses
3. **Use dependency injection properly** - Constructor injection with proper typing
4. **Include Swagger documentation** - Every endpoint must have proper API docs
5. **Follow the established patterns** - Use the same structure as existing modules
6. **Write production-ready code** - No TODOs, no placeholders, complete implementations
7. **Use proper TypeScript** - Strict typing, interfaces, and proper null handling
8. **Include logging** - Use NestJS Logger for all error cases and important operations

---

## 🔧 Module Template

When creating new modules, use this structure:

```
new-module/
├── dto/
│   ├── create-new-module.dto.ts
│   ├── update-new-module.dto.ts
│   ├── new-module-response.dto.ts
│   └── new-module-query.dto.ts
├── guards/                    # If module-specific guards needed
├── decorators/               # If module-specific decorators needed
├── new-module.controller.ts
├── new-module.service.ts
├── new-module.module.ts
└── tests/
    ├── new-module.controller.spec.ts
    └── new-module.service.spec.ts
```

This ensures consistent structure across all modules while maintaining the production-ready, no-placeholder approach you prefer.