import { Test, TestingModule } from '@nestjs/testing';
import { RolesGuard } from './roles.guard';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../../prisma/prisma.service';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Role } from '@prisma/client';

describe('RolesGuard', () => {
  let guard: RolesGuard;

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
    },
  };

  const mockReflector = {
    getAllAndOverride: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RolesGuard,
        { provide: Reflector, useValue: mockReflector },
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    guard = module.get<RolesGuard>(RolesGuard);
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  it('should allow access when no roles required', async () => {
    mockReflector.getAllAndOverride.mockReturnValue(undefined);
    const context = createMockContext({});
    expect(await guard.canActivate(context)).toBe(true);
  });

  it('should throw error when email missing', async () => {
    mockReflector.getAllAndOverride.mockReturnValue([Role.ADMIN]);
    const context = createMockContext({});
    await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
  });

  it('should throw error when user not found', async () => {
    mockReflector.getAllAndOverride.mockReturnValue([Role.ADMIN]);
    mockPrismaService.user.findUnique.mockResolvedValue(null);
    const context = createMockContext({ changedByEmail: 'babaoyeoladele@gmail.com' });
    await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
  });

  it('should allow access when user has required role', async () => {
    mockReflector.getAllAndOverride.mockReturnValue([Role.ADMIN]);
    mockPrismaService.user.findUnique.mockResolvedValue({ role: Role.ADMIN });
    const context = createMockContext({ changedByEmail: 'admin@test.com' });
    expect(await guard.canActivate(context)).toBe(true);
  });

  it('should deny access when user lacks required role', async () => {
    mockReflector.getAllAndOverride.mockReturnValue([Role.ADMIN]);
    mockPrismaService.user.findUnique.mockResolvedValue({ role: Role.USER });
    const context = createMockContext({ changedByEmail: 'user@test.com' });
    await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
  });
});

function createMockContext(body: any): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => ({ body }),
    }),
    getHandler: () => ({}),
    getClass: () => ({}),
  } as ExecutionContext;
}
