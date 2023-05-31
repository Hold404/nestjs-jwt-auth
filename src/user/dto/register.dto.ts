import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class RegisterDto {
  @IsString()
  @MinLength(5, { message: 'Login must be at least 5 characters long' })
  @ApiProperty()
  login: string;

  @IsEmail()
  @ApiProperty()
  email: string;

  @IsString()
  @MinLength(6, { message: 'Password must be at least 5 characters long' })
  @ApiProperty()
  password: string;
}
