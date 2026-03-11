import {
  Injectable,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../notifications/email.service';
import { ApplicationStatus, Role } from '@prisma/client';
import { UpdateStatusDto } from './dto/update-status.dto';

@Injectable()
export class ApplicationsService {
  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
  ) {}

  private readonly validTransitions: Record<
    ApplicationStatus,
    ApplicationStatus[]
  > = {
    [ApplicationStatus.APPLIED]: [
      ApplicationStatus.INTERVIEWING,
      ApplicationStatus.CLOSED,
    ],
    [ApplicationStatus.INTERVIEWING]: [
      ApplicationStatus.CONTRACTED,
      ApplicationStatus.CLOSED,
    ],
    [ApplicationStatus.CONTRACTED]: [
      ApplicationStatus.COMPLETED,
      ApplicationStatus.CLOSED,
    ],
    [ApplicationStatus.COMPLETED]: [],
    [ApplicationStatus.CLOSED]: [],
  };

  async updateStatus(id: number, dto: UpdateStatusDto) {
    return this.prisma.$transaction(async (tx) => {
      const application = await tx.application.findUnique({
        where: { id },
        include: { user: true },
      });

      if (!application) {
        throw new NotFoundException(`Application with ID ${id} not found`);
      }

      const user = await tx.user.findUnique({
        where: { email: dto.changedByEmail },
      });

      if (!user) {
        throw new ForbiddenException('User not found');
      }

      // Role-based security (Enforced in Guard, but kept here for defense in depth)
      if (
        dto.status === ApplicationStatus.INTERVIEWING ||
        dto.status === ApplicationStatus.CONTRACTED
      ) {
        if (user.role !== Role.ADMIN && user.role !== Role.COMPANY) {
          throw new ForbiddenException(
            'Only ADMIN or COMPANY roles can transition to INTERVIEWING or CONTRACTED',
          );
        }
      }

      // Transition validation
      const allowed = this.validTransitions[application.status];
      if (!allowed.includes(dto.status)) {
        throw new BadRequestException(
          `Cannot transition from ${application.status} to ${dto.status}`,
        );
      }

      // Contract URL validation
      if (
        dto.status === ApplicationStatus.CONTRACTED &&
        !dto.contractUrl &&
        !application.contractUrl
      ) {
        throw new BadRequestException(
          'A valid contractUrl is required to transition to CONTRACTED',
        );
      }

      const updatedApplication = await tx.application.update({
        where: { id },
        data: {
          status: dto.status,
          contractUrl: dto.contractUrl || application.contractUrl,
        },
      });

      await tx.statusHistory.create({
        data: {
          applicationId: id,
          previousStatus: application.status,
          newStatus: dto.status,
          changedById: user.id,
          metadata: dto.metadata,
        },
      });

      // Email Notification
      if (dto.status === ApplicationStatus.CONTRACTED) {
        try {
          const email: string =
            (application as any).candidateEmail || 'candidate@example.com';
          const url: string = dto.contractUrl || application.contractUrl || '';
          await this.emailService.sendContractEmail(
            email,
            application.candidateName,
            url,
          );
        } catch {
          // Notification failure is logged inside emailService
        }
      }

      return updatedApplication;
    });
  }

  async getHistory(id: number) {
    const history = await this.prisma.statusHistory.findMany({
      where: { applicationId: id },
      include: { changedBy: true },
      orderBy: { timestamp: 'desc' },
    });
    return history;
  }
}
