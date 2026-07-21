import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateSubjectDto {
  @IsString()
  @IsNotEmpty({ message: 'Назва предмета обов’язкова' })
  name: string;

  @IsBoolean()
  @IsOptional()
  isGroupSplit?: boolean;
}

export class UpdateSubjectDto extends CreateSubjectDto {}