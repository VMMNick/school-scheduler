import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ClassroomsService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.classroom.findMany();
  }

  create(data: any) {
    return this.prisma.classroom.create({
      data: { 
        name: data.name,
        capacity: data.capacity || 30 
      }
    });
  }

  update(id: number, data: any) {
    return this.prisma.classroom.update({
      where: { id },
      data: { 
        name: data.name,
        capacity: data.capacity 
      }
    });
  }

  remove(id: number) {
    return this.prisma.classroom.delete({
      where: { id }
    });
  }
}