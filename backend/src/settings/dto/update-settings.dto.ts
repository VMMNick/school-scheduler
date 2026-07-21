import { IsString, IsInt, IsOptional, IsArray, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateSettingsDto {
  @IsOptional() @IsString()
  schoolName?: string;

  @IsOptional() @IsString()
  academicYear?: string;

  @IsOptional() @Type(() => Number) @IsInt() @Min(1)
  maxLessonsPerDay?: number;

  @IsOptional() @IsString()
  startTime?: string;

  @IsOptional() @IsString()
  weekStart?: string;

  @IsOptional() @IsArray()
  breaks?: number[];
}