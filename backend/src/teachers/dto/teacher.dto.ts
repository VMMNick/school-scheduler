import { IsString, IsNotEmpty, IsOptional, IsEmail, MinLength } from 'class-validator';

export class CreateTeacherDto {
  @IsString()
  @IsNotEmpty({ message: 'ПІБ обов’язкове' })
  fullName: string;

  @IsOptional()
  @IsEmail({}, { message: 'Некоректний email' })
  email?: string;

  @IsOptional()
  @IsString()
  @MinLength(6, { message: 'Пароль має бути не менше 6 символів' })
  password?: string;
}

export class UpdateTeacherDto {
  @IsString()
  @IsNotEmpty({ message: 'ПІБ обов’язкове' })
  fullName: string;
}