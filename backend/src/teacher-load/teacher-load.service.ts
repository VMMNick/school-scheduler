import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TeacherLoadService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.teacherLoad.findMany({
      include: {
        teacher: { include: { User: true } },
        subject: true,
        class: true
      }
    });
  }

  async save(data: any[]) {
    await this.prisma.teacherLoad.deleteMany({});

    const created = await this.prisma.teacherLoad.createMany({
      data: data.map(item => ({
        teacherId: item.teacherId,
        subjectId: item.subjectId,
        classId: item.classId,
        hoursPerWeek: item.hoursPerWeek,
      })),
      skipDuplicates: true,
    });

    return { 
      success: true, 
      message: 'Навантаження збережено', 
      count: created.count 
    };
  }
}