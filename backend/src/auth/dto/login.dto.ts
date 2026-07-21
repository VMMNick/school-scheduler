import { IsEmail, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @IsEmail({}, { message: 'Некоректний email' })
  email: string;

  @IsString()
  @MinLength(1, { message: 'Пароль обов’язковий' })
  password: string;
}