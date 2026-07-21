import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class TeachersService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.teacher.findMany({
      include: { User: true }
    });
  }

  async create(data: any) {
    const rawPassword = data.password || 'Qwerty';
    const hashedPassword = await bcrypt.hash(rawPassword, 10);

    return this.prisma.teacher.create({
      data: {
        User: {
          create: {
            email: data.email || `${data.fullName.toLowerCase().replace(/\s/g, '')}@school.com`,
            password: hashedPassword,
            fullName: data.fullName,
            role: 'TEACHER',
            updatedAt: new Date(),
          }
        }
      },
      include: {
        User: true
      }
    });
  }

  update(id: number, data: any) {
    return this.prisma.teacher.update({
      where: { id },
      data: {
        User: {
          update: {
            fullName: data.fullName
          }
        }
      },
      include: { User: true }
    });
  }

  remove(id: number) {
    return this.prisma.teacher.delete({
      where: { id }
    });
  }
}