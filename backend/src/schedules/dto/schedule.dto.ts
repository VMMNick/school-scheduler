import { IsArray, IsInt, IsOptional, IsString, Max, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class ScheduleSlotDto {
  @Type(() => Number) @IsInt() @Min(0) @Max(4)
  day: number;

  @Type(() => Number) @IsInt() @Min(1) @Max(8)
  period: number;

  @Type(() => Number) @IsInt()
  teacherId: number;

  @Type(() => Number) @IsInt()
  classId: number;

  @Type(() => Number) @IsInt()
  subjectId: number;

  @IsOptional() @IsString()
  room?: string;
}

export class SaveScheduleDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ScheduleSlotDto)
  schedule: ScheduleSlotDto[];

  @IsOptional() @Type(() => Number) @IsInt()
  weekNumber?: number;
}

export class GenerateScheduleDto {
  @IsOptional() @Type(() => Number) @IsInt()
  weekNumber?: number;

  @IsOptional() @Type(() => Number) @IsInt()
  teacherId?: number;
}

export class FindWeekQueryDto {
  @IsOptional() @IsString()
  weekNumber?: string;
}