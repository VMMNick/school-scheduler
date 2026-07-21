import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { SchedulesService } from './schedules.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { FindWeekQueryDto, SaveScheduleDto, GenerateScheduleDto } from './dto/schedule.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('schedules')
export class SchedulesController {
  constructor(private readonly schedulesService: SchedulesService) {}

  @Get('week')
  findWeek(@Query() query: FindWeekQueryDto) {
    return this.schedulesService.findWeek(query.weekNumber ? +query.weekNumber : 1);
  }

  @Roles('ADMIN')
  @Post('save')
  save(@Body() data: SaveScheduleDto) {
    return this.schedulesService.save(data);
  }

  @Roles('ADMIN')
  @Post('generate')
  generate(@Body() body: GenerateScheduleDto) {
    return this.schedulesService.generate(
      body.weekNumber || 1,
      body.teacherId ? +body.teacherId : undefined
    );
  }
}
