import { Test, TestingModule } from '@nestjs/testing';
import { ApplicationsController } from './applications.controller';
import { ApplicationsService } from './applications.service';
import { ApplicationStatus } from '@prisma/client';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../prisma/prisma.service';

describe('ApplicationsController', () => {
  let controller: ApplicationsController;
  let service: ApplicationsService;

  const mockApplicationsService = {
    updateStatus: jest.fn(),
    getHistory: jest.fn(),
  };

  const mockPrismaService = {
    user: { findUnique: jest.fn() },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ApplicationsController],
      providers: [
        { provide: ApplicationsService, useValue: mockApplicationsService },
        { provide: PrismaService, useValue: mockPrismaService },
        RolesGuard,
        Reflector,
      ],
    }).compile();

    controller = module.get<ApplicationsController>(ApplicationsController);
    service = module.get<ApplicationsService>(ApplicationsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should update application status', async () => {
    const dto = {
      status: ApplicationStatus.INTERVIEWING,
      changedByEmail: 'admin@example.com',
    };
    const result = { id: 1, status: ApplicationStatus.INTERVIEWING };
    mockApplicationsService.updateStatus.mockResolvedValue(result);

    expect(await controller.updateStatus(1, dto)).toBe(result);
    expect(mockApplicationsService.updateStatus).toHaveBeenCalledWith(1, dto);
  });

  it('should get application history', async () => {
    const history = [{ id: 1, previousStatus: ApplicationStatus.APPLIED }];
    mockApplicationsService.getHistory.mockResolvedValue(history);

    expect(await controller.getHistory(1)).toBe(history);
    expect(mockApplicationsService.getHistory).toHaveBeenCalledWith(1);
  });
});
