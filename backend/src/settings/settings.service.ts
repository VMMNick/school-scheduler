import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SettingsService {
  constructor(private prisma: PrismaService) {}

  async get() {
    let setting = await this.prisma.setting.findFirst();
    if (!setting) {
      setting = await this.prisma.setting.create({
        data: {
          schoolName: "Школа № 42",
          academicYear: "2025-2026",
          maxLessonsPerDay: 7,
          startTime: "08:30",
          weekStart: "monday",
          breaks: [15, 15, 20, 15, 15, 20]
        }
      });
    }
    return setting;
  }

  async save(data: any) {
    const setting = await this.prisma.setting.findFirst();
    if (setting) {
      return this.prisma.setting.update({
        where: { id: setting.id },
        data
      });
    } else {
      return this.prisma.setting.create({ data });
    }
  }
}