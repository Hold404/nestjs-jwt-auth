import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class LoginDto {
  @IsString()
  @MinLength(5, { message: 'Login must be at least 5 characters long' })
  @ApiProperty()
  login: string;

  @IsString()
  @MinLength(6, { message: 'Password must be at least 5 characters long' })
  @ApiProperty()
  password: string;
}
