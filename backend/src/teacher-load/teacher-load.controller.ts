import { Controller, Get, Post, Body, UseGuards, ParseArrayPipe } from '@nestjs/common';
import { TeacherLoadService } from './teacher-load.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { TeacherLoadItemDto } from './dto/teacher-load-item.dto';

@UseGuards(JwtAuthGuard)
@Controller('teacher-load')
export class TeacherLoadController {
  constructor(private readonly teacherLoadService: TeacherLoadService) {}

  @Get()
  findAll() {
    return this.teacherLoadService.findAll();
  }

  @Post('save')
  save(@Body(new ParseArrayPipe({ items: TeacherLoadItemDto })) data: TeacherLoadItemDto[]) {
    return this.teacherLoadService.save(data);
  }
}