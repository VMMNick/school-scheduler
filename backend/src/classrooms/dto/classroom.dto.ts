import { IsString, IsNotEmpty, IsOptional, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateClassroomDto {
  @IsString()
  @IsNotEmpty({ message: 'Номер/назва кабінету обов’язкові' })
  name: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1, { message: 'Місткість має бути додатним числом' })
  capacity?: number;
}

export class UpdateClassroomDto extends CreateClassroomDto {}