import { Type } from 'class-transformer';
import { IsString, IsNotEmpty, IsOptional, IsInt, Min, Max } from 'class-validator';

export class CreateClassDto {
  @IsString()
  @IsNotEmpty({ message: 'Назва класу обов’язкова' })
  name: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(8)
  maxLessonsPerDay?: number;
}

export class UpdateClassDto extends CreateClassDto {}