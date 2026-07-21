import { Module } from '@nestjs/common';
import { TeacherLoadController } from './teacher-load.controller';
import { TeacherLoadService } from './teacher-load.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [TeacherLoadController],
  providers: [TeacherLoadService],
})
export class TeacherLoadModule {}