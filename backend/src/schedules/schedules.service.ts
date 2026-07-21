import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SchedulesService {
  constructor(private prisma: PrismaService) {}

  private isGroupSplitSubject(subject?: { isGroupSplit?: boolean | null } | null) {
    return Boolean(subject?.isGroupSplit);
  }

  private getLinkedClassKey(className?: string | null, isGroupSplitSubject?: boolean | null) {
    const normalized = (className || '').trim().toLowerCase();
    if (!isGroupSplitSubject) {
      return `single:${normalized}`;
    }

    if (normalized) {
      return `class:${normalized}`;
    }

    const gradeMatch = normalized.match(/(\d+)/);
    if (gradeMatch) {
      return `grade:${gradeMatch[1]}`;
    }

    return `single:${normalized}`;
  }

  async findWeek(weekNumber: number = 1) {
    return this.prisma.scheduleSlot.findMany({
      where: { weekNumber },
      include: {
        Teacher: { include: { User: true } },
        Subject: true,
        ClassGroup: true,
        Classroom: true,
      },
      orderBy: [
        { day: 'asc' },
        { period: 'asc' }
      ]
    });
  }

  async save(data: any) {
    const { schedule, weekNumber = 1 } = data;

    if (!schedule || !Array.isArray(schedule)) {
      return { success: false, message: "Невірний формат" };
    }

    await this.prisma.scheduleSlot.deleteMany({ where: { weekNumber } });

    const created = await this.prisma.scheduleSlot.createMany({
      data: schedule.map(slot => ({
        weekNumber,
        day: slot.day,
        period: slot.period,
        teacherId: slot.teacherId,
        classId: slot.classId,
        subjectId: slot.subjectId,
        room: slot.room || '101',
      })),
      skipDuplicates: true,
    });

    return { success: true, message: `Збережено ${created.count} слотів`, count: created.count };
  }

  async generate(weekNumber: number = 1, teacherId?: number) {
    const targetLoads = await this.prisma.teacherLoad.findMany({
      where: teacherId ? { teacherId } : undefined,
      include: { teacher: { include: { User: true } }, subject: true, class: true },
    });

    if (targetLoads.length === 0) {
      return {
        success: false,
        message: teacherId
          ? 'Для цього вчителя не задано навантаження (TeacherLoad) — нема що генерувати'
          : 'Немає даних у teacher-load — нема з чого генерувати розклад',
      };
    }

    const splitSubjectLoads = targetLoads.filter(load => this.isGroupSplitSubject(load.subject));
    const splitSubjectIds = splitSubjectLoads.map(load => load.subjectId);

    const partnerLoads = splitSubjectIds.length > 0
      ? await this.prisma.teacherLoad.findMany({
          where: { subjectId: { in: splitSubjectIds } },
          include: { teacher: { include: { User: true } }, subject: true, class: true },
        })
      : [];

    const linkedPartnerLoads = partnerLoads.filter(partner => {
      const target = splitSubjectLoads.find(targetLoad =>
        targetLoad.subjectId === partner.subjectId &&
        this.getLinkedClassKey(targetLoad.class?.name, true) === this.getLinkedClassKey(partner.class?.name, true)
      );
      return Boolean(target);
    });

    const loadsById = new Map<number, any>();
    for (const load of [...targetLoads, ...linkedPartnerLoads]) {
      loadsById.set(load.id, load);
    }
    const loads = Array.from(loadsById.values());

    const teacherIdsToClear = teacherId ? new Set<number>([teacherId]) : undefined;
    if (teacherId) {
      for (const load of linkedPartnerLoads) {
        teacherIdsToClear?.add(load.teacherId);
      }
    }

    const classrooms = await this.prisma.classroom.findMany();
    if (classrooms.length === 0) {
      return { success: false, message: 'Немає жодного кабінету — нема куди розставляти уроки' };
    }
    // Кабінети поки не перевіряємо на конфлікти — беремо перший, це окрема задача на потім.
    const defaultRoom = classrooms[0];

    await this.prisma.scheduleSlot.deleteMany({
      where: teacherId && teacherIdsToClear
        ? { weekNumber, teacherId: { in: Array.from(teacherIdsToClear) } }
        : { weekNumber },
    });

    const settings = await this.prisma.setting.findFirst({ orderBy: { id: 'asc' } });
    const classGroups = await this.prisma.classGroup.findMany({ select: { id: true, maxLessonsPerDay: true } });
    const defaultMaxLessonsPerDay = settings?.maxLessonsPerDay ?? 7;
    const classMaxLessons = new Map<number, number>();
    for (const classGroup of classGroups) {
      classMaxLessons.set(classGroup.id, classGroup.maxLessonsPerDay ?? defaultMaxLessonsPerDay);
    }

    const existingSlots = await this.prisma.scheduleSlot.findMany({
      where: { weekNumber },
      include: { Subject: true },
    });

    const teacherBusy = new Set(existingSlots.map(s => `${s.teacherId}-${s.day}-${s.period}`));
    const classSlotsByKey = new Map<string, Array<{ subjectId: number; isGroupSplit: boolean }>>();
    const classPeriodsByDay = new Map<string, Set<number>>();

    const addClassPeriod = (classId: number, day: number, period: number) => {
      const periodKey = `${classId}-${day}`;
      const existing = classPeriodsByDay.get(periodKey) ?? new Set<number>();
      existing.add(period);
      classPeriodsByDay.set(periodKey, existing);
    };

    const isClassDayLimitReached = (classId: number, day: number) => {
      const periodKey = `${classId}-${day}`;
      const count = classPeriodsByDay.get(periodKey)?.size ?? 0;
      return count >= (classMaxLessons.get(classId) ?? defaultMaxLessonsPerDay);
    };

    for (const slot of existingSlots) {
      const key = `${slot.classId}-${slot.day}-${slot.period}`;
      if (!classSlotsByKey.has(key)) classSlotsByKey.set(key, []);
      classSlotsByKey.get(key)!.push({
        subjectId: slot.subjectId,
        isGroupSplit: this.isGroupSplitSubject(slot.Subject),
      });
      addClassPeriod(slot.classId, slot.day, slot.period);
    }

    const DAYS = [0, 1, 2, 3, 4];
    const PERIODS = [1, 2, 3, 4, 5, 6, 7, 8];

    const hasClassConflict = (classKey: string, subjectId: number, isGroupSplit: boolean) => {
      const existingClassSlots = classSlotsByKey.get(classKey) ?? [];
      if (!isGroupSplit) {
        return existingClassSlots.length > 0;
      }
      return existingClassSlots.some(slot => !slot.isGroupSplit || slot.subjectId !== subjectId);
    };

    const generated: any[] = [];
    const skipped: string[] = [];

    const groupedLoads = new Map<string, Array<{ load: any; remainingHours: number }>>();
    for (const load of loads) {
      const isGroupSplit = this.isGroupSplitSubject(load.subject);
      const classKey = this.getLinkedClassKey(load.class?.name, isGroupSplit);
      const groupKey = isGroupSplit
        ? `${load.subjectId}:${classKey}`
        : `${load.teacherId}:${load.subjectId}:${load.classId}`;

      if (!groupedLoads.has(groupKey)) {
        groupedLoads.set(groupKey, []);
      }
      groupedLoads.get(groupKey)!.push({
        load,
        remainingHours: load.hoursPerWeek,
      });
    }

    for (const groupEntries of groupedLoads.values()) {
      const isGroupSplit = this.isGroupSplitSubject(groupEntries[0]?.load.subject);
      let dayCursor = 0;

      if (isGroupSplit) {
        let attemptsWithoutProgress = 0;

        while (groupEntries.some(entry => entry.remainingHours > 0) && attemptsWithoutProgress < DAYS.length * PERIODS.length) {
          const day = DAYS[dayCursor % DAYS.length];
          dayCursor++;

          let placed = false;
          for (const period of PERIODS) {
            const classLimitReached = groupEntries.some(entry => isClassDayLimitReached(entry.load.classId, day));
            if (classLimitReached) continue;

            let allFree = groupEntries.every(entry => {
              if (entry.remainingHours <= 0) return true;
              const teacherKey = `${entry.load.teacherId}-${day}-${period}`;
              const classKey = `${entry.load.classId}-${day}-${period}`;
              return !teacherBusy.has(teacherKey) && !hasClassConflict(classKey, entry.load.subjectId, true);
            });

            if (!allFree) continue;

            const addedClasses = new Set<number>();
            for (const entry of groupEntries) {
              if (entry.remainingHours <= 0) continue;

              const classKey = `${entry.load.classId}-${day}-${period}`;
              generated.push({
                weekNumber,
                day,
                period,
                teacherId: entry.load.teacherId,
                classId: entry.load.classId,
                subjectId: entry.load.subjectId,
                room: defaultRoom.name,
              });

              teacherBusy.add(`${entry.load.teacherId}-${day}-${period}`);
              const existingClassSlots = classSlotsByKey.get(classKey) ?? [];
              classSlotsByKey.set(classKey, [
                ...existingClassSlots,
                { subjectId: entry.load.subjectId, isGroupSplit: true },
              ]);
              addedClasses.add(entry.load.classId);
              entry.remainingHours--;
            }

            addedClasses.forEach(classId => addClassPeriod(classId, day, period));
            placed = true;
            break;
          }

          attemptsWithoutProgress = placed ? 0 : attemptsWithoutProgress + 1;
        }

        for (const entry of groupEntries) {
          if (entry.remainingHours > 0) {
            skipped.push(
              `${entry.load.teacher?.User?.fullName ?? entry.load.teacherId}: не вистачило вільних слотів для "${entry.load.subject?.name}" у класі "${entry.load.class?.name}" (не розставлено ${entry.remainingHours} год.)`
            );
          }
        }

        continue;
      }

      for (const entry of groupEntries) {
        let remainingHours = entry.remainingHours;
        let entryDayCursor = 0;
        let attemptsWithoutProgress = 0;

        while (remainingHours > 0 && attemptsWithoutProgress < DAYS.length * PERIODS.length) {
          const day = DAYS[entryDayCursor % DAYS.length];
          entryDayCursor++;

          let placed = false;
          for (const period of PERIODS) {
              if (isClassDayLimitReached(entry.load.classId, day)) continue;

            const teacherKey = `${entry.load.teacherId}-${day}-${period}`;
            const classKey = `${entry.load.classId}-${day}-${period}`;
            const isFree = !teacherBusy.has(teacherKey) && !hasClassConflict(classKey, entry.load.subjectId, false);
            if (!isFree) continue;

            generated.push({
              weekNumber,
              day,
              period,
              teacherId: entry.load.teacherId,
              classId: entry.load.classId,
              subjectId: entry.load.subjectId,
              room: defaultRoom.name,
            });

            teacherBusy.add(teacherKey);
            classSlotsByKey.set(classKey, [
              ...classSlotsByKey.get(classKey) ?? [],
              { subjectId: entry.load.subjectId, isGroupSplit: false },
            ]);
            addClassPeriod(entry.load.classId, day, period);
            remainingHours--;
            placed = true;
            break;
          }

          attemptsWithoutProgress = placed ? 0 : attemptsWithoutProgress + 1;
        }

        if (remainingHours > 0) {
          skipped.push(
            `${entry.load.teacher?.User?.fullName ?? entry.load.teacherId}: не вистачило вільних слотів для "${entry.load.subject?.name}" у класі "${entry.load.class?.name}" (не розставлено ${remainingHours} год.)`
          );
        }
      }
    }

    const result = await this.prisma.scheduleSlot.createMany({
      data: generated,
      skipDuplicates: true,
    });

    return {
      success: true,
      message: teacherId
        ? `Розклад вчителя згенеровано (${result.count} уроків)`
        : `Розклад на ${weekNumber} тиждень згенеровано (${result.count} слотів)!`,
      count: result.count,
      skipped,
    };
  }
}
