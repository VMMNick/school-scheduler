import { Module } from '@nestjs/common';
import { SchedulesModule } from './schedules/schedules.module';
import { TeachersModule } from './teachers/teachers.module';
import { ClassesModule } from './classes/classes.module';
import { SubjectsModule } from './subjects/subjects.module';
import { ClassroomsModule } from './classrooms/classrooms.module';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { TeacherLoadModule } from './teacher-load/teacher-load.module';
import { SettingsModule } from './settings/settings.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    SchedulesModule,
    TeachersModule,
    ClassesModule,
    SubjectsModule,
    ClassroomsModule,
    TeacherLoadModule,
    SettingsModule,
  ],
})
export class AppModule {}