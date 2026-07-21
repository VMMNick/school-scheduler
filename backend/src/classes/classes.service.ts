import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ClassesService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.classGroup.findMany();
  }

  create(data: any) {
    return this.prisma.classGroup.create({
      data: {
        name: data.name,
        maxLessonsPerDay: typeof data.maxLessonsPerDay === 'number' ? data.maxLessonsPerDay : undefined,
      }
    });
  }

  update(id: number, data: any) {
    return this.prisma.classGroup.update({
      where: { id },
      data: {
        name: data.name,
        maxLessonsPerDay: typeof data.maxLessonsPerDay === 'number' ? data.maxLessonsPerDay : undefined,
      }
    });
  }

  remove(id: number) {
    return this.prisma.classGroup.delete({
      where: { id }
    });
  }
}