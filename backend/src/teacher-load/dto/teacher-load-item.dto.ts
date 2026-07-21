import { IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class TeacherLoadItemDto {
  @Type(() => Number)
  @IsInt({ message: 'teacherId має бути числом' })
  teacherId: number;

  @Type(() => Number)
  @IsInt({ message: 'subjectId має бути числом' })
  subjectId: number;

  @Type(() => Number)
  @IsInt({ message: 'classId має бути числом' })
  classId: number;

  @Type(() => Number)
  @IsInt()
  @Min(1, { message: 'Кількість годин має бути більшою за 0' })
  hoursPerWeek: number;
}