import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class LoginRequestDto {
  @ApiProperty({ example: 'demo' })
  @IsString()
  @IsNotEmpty()
  username!: string;

  @ApiProperty({ example: 'demo123' })
  @IsString()
  @IsNotEmpty()
  password!: string;
}
