import { Test, TestingModule } from '@nestjs/testing';
import { ApplicationsService } from './applications.service';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../notifications/email.service';
import { ApplicationStatus, Role } from '@prisma/client';
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';

describe('ApplicationsService', () => {
  let service: ApplicationsService;

  const mockPrismaService = {
    $transaction: jest.fn((cb) => cb(mockPrismaService)),
    application: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
    statusHistory: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
  };

  const mockEmailService = {
    sendContractEmail: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ApplicationsService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: EmailService, useValue: mockEmailService },
      ],
    }).compile();

    service = module.get<ApplicationsService>(ApplicationsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('updateStatus', () => {
    it('should throw NotFoundException if application does not exist', async () => {
      mockPrismaService.application.findUnique.mockResolvedValue(null);
      await expect(
        service.updateStatus(1, {
          status: ApplicationStatus.INTERVIEWING,
          changedByEmail: 'babaoyeoladele@gmail.com',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if user does not exist', async () => {
      mockPrismaService.application.findUnique.mockResolvedValue({
        id: 1,
        status: ApplicationStatus.APPLIED,
      });
      mockPrismaService.user.findUnique.mockResolvedValue(null);
      await expect(
        service.updateStatus(1, {
          status: ApplicationStatus.INTERVIEWING,
          changedByEmail: 'babaoyeoladele@gmail.com',
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw ForbiddenException if user role is not allowed for INTERVIEWING', async () => {
      mockPrismaService.application.findUnique.mockResolvedValue({
        id: 1,
        status: ApplicationStatus.APPLIED,
      });
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: 1,
        role: Role.USER,
      });
      await expect(
        service.updateStatus(1, {
          status: ApplicationStatus.INTERVIEWING,
          changedByEmail: 'babaoyeoladele@gmail.com',
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw BadRequestException for invalid transition', async () => {
      mockPrismaService.application.findUnique.mockResolvedValue({
        id: 1,
        status: ApplicationStatus.APPLIED,
      });
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: 1,
        role: Role.ADMIN,
      });
      await expect(
        service.updateStatus(1, {
          status: ApplicationStatus.COMPLETED,
          changedByEmail: 'babaoyeoladele@gmail.com',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if contractUrl is missing for CONTRACTED status', async () => {
      mockPrismaService.application.findUnique.mockResolvedValue({
        id: 1,
        status: ApplicationStatus.INTERVIEWING,
      });
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: 1,
        role: Role.ADMIN,
      });
      await expect(
        service.updateStatus(1, {
          status: ApplicationStatus.CONTRACTED,
          changedByEmail: 'babaoyeoladele@gmail.com',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should transition status successfully and send email', async () => {
      const app = {
        id: 1,
        status: ApplicationStatus.INTERVIEWING,
        candidateName: 'John',
        candidateEmail: 'john@example.com',
      };
      const user = { id: 1, role: Role.ADMIN, email: 'admin@test.com' };
      mockPrismaService.application.findUnique.mockResolvedValue(app);
      mockPrismaService.user.findUnique.mockResolvedValue(user);
      mockPrismaService.application.update.mockResolvedValue({
        ...app,
        status: ApplicationStatus.CONTRACTED,
      });

      const dto = {
        status: ApplicationStatus.CONTRACTED,
        changedByEmail: 'admin@test.com',
        contractUrl: 'http://link.com',
      };
      const result = await service.updateStatus(1, dto);

      expect(result.status).toBe(ApplicationStatus.CONTRACTED);
      expect(mockEmailService.sendContractEmail).toHaveBeenCalledWith(
        'john@example.com',
        'John',
        'http://link.com',
      );
      expect(mockPrismaService.statusHistory.create).toHaveBeenCalled();
    });
  });
});
