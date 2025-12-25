import {
  IsString,
  IsNotEmpty,
  IsDateString,
  IsOptional,
  IsArray,
} from 'class-validator';

export class CreateMatchDto {
  @IsString()
  @IsNotEmpty()
  postId: string;

  @IsArray()
  @IsOptional()
  playersId?: string[];

  @IsString()
  @IsNotEmpty()
  sport: string;

  @IsDateString()
  @IsNotEmpty()
  startTime: string;

  @IsDateString()
  @IsNotEmpty()
  endTime: string;

  @IsString()
  @IsOptional()
  location?: string;

  @IsString()
  @IsOptional()
  status?: string;

  @IsString()
  @IsOptional()
  confirmBy?: string;
}
