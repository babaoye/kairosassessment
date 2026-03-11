import { IsEnum, IsString, IsOptional, IsUrl } from 'class-validator';
import { ApplicationStatus } from '@prisma/client';

export class UpdateStatusDto {
  @IsEnum(ApplicationStatus)
  status: ApplicationStatus;

  @IsOptional()
  @IsString()
  metadata?: string;

  @IsOptional()
  @IsUrl()
  contractUrl?: string;

  @IsString()
  changedByEmail: string;
}
