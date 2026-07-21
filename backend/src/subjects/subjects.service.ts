import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SubjectsService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.subject.findMany();
  }

  create(data: any) {
    return this.prisma.subject.create({
      data: { name: data.name, isGroupSplit: Boolean(data.isGroupSplit) }
    });
  }

  update(id: number, data: any) {
    return this.prisma.subject.update({
      where: { id },
      data: { name: data.name, isGroupSplit: Boolean(data.isGroupSplit) }
    });
  }

  remove(id: number) {
    return this.prisma.subject.delete({
      where: { id }
    });
  }
}