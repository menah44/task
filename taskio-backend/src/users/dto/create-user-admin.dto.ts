import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class CreateUserAdminDto {
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @IsNotEmpty()
  username!: string;

  @IsNotEmpty()
  firstName!: string;

  @IsNotEmpty()
  lastName!: string;

  @MinLength(6)
  password!: string;

  @IsString()
  role!: string;
}
