import {
  Controller,
  Patch,
  Get,
  Param,
  Body,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { ApplicationsService } from './applications.service';
import { UpdateStatusDto } from './dto/update-status.dto';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';

@Controller('api/applications')
@UseGuards(RolesGuard)
export class ApplicationsController {
  constructor(private readonly applicationsService: ApplicationsService) {}

  @Patch(':id/status')
  @Roles(Role.ADMIN, Role.COMPANY)
  async updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateStatusDto: UpdateStatusDto,
  ) {
    return this.applicationsService.updateStatus(id, updateStatusDto);
  }

  @Get(':id/history')
  async getHistory(@Param('id', ParseIntPipe) id: number) {
    return this.applicationsService.getHistory(id);
  }
}
