import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsDateString,
  IsArray,
  IsObject,
} from 'class-validator';

export class CreatePostDto {
  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsString()
  @IsNotEmpty()
  sport: string;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsOptional()
  content?: string;

  @IsDateString()
  @IsNotEmpty()
  startTime: string;

  @IsDateString()
  @IsNotEmpty()
  endTime: string;

  // Accept a location object with latitude and longitude (frontend will send { latitude, longitude })
  @IsOptional()
  @IsObject()
  location?: { latitude: number; longitude: number };

  @IsString()
  @IsOptional()
  status?: string;

  @IsArray()
  @IsOptional()
  interestedUserId?: string[];

  @IsString()
  @IsOptional()
  image?: string;

  @IsString()
  @IsOptional()
  matchId?: string;
}
