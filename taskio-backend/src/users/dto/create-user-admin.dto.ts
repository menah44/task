import { IsEmail, IsNotEmpty, IsEnum, IsOptional, MinLength } from 'class-validator';

export class CreateUserAdminDto {
  @IsOptional()
  name?: string;

  @IsEmail({}, { message: 'Please enter a valid email address.' })
  @IsNotEmpty({ message: 'Email is required.' })
  email!: string;

  @MinLength(6, { message: 'Password must be at least 6 characters long.' })
  @IsNotEmpty({ message: 'Password is required.' })
  password!: string;

  @IsEnum(['ADMIN', 'USER'], { message: 'Role must be either ADMIN or USER.' })
  @IsNotEmpty({ message: 'Role is required.' })
  role!: 'ADMIN' | 'USER';
}
