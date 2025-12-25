import {
  IsString,
  IsEmail,
  IsOptional,
  IsNumber,
  Min,
  Max,
  IsUrl,
  ValidateNested,
  IsObject,
  MinLength,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';

class LocationPointDto {
  @IsNumber({}, { message: 'Latitude must be a number' })
  @Min(-90, { message: 'Latitude must be between -90 and 90' })
  @Max(90, { message: 'Latitude must be between -90 and 90' })
  latitude: number;

  @IsNumber({}, { message: 'Longitude must be a number' })
  @Min(-180, { message: 'Longitude must be between -180 and 180' })
  @Max(180, { message: 'Longitude must be between -180 and 180' })
  longitude: number;
}

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @MinLength(2, { message: 'Name must be at least 2 characters long' })
  @MaxLength(100, { message: 'Name must not exceed 100 characters' })
  name?: string;

  @IsOptional()
  @IsEmail({}, { message: 'Email must be a valid email address' })
  email?: string;

  @IsOptional()
  @IsString()
  googleId?: string;

  @IsOptional()
  @IsUrl({}, { message: 'Avatar must be a valid URL' })
  avatar?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50, { message: 'Sport must not exceed 50 characters' })
  sport?: string;

  @IsOptional()
  @IsNumber()
  @Min(0, { message: 'Point must be greater than or equal to 0' })
  point?: number;

  @IsOptional()
  @ValidateNested()
  @Type(() => LocationPointDto)
  @IsObject({
    message: 'Location must be an object with latitude and longitude',
  })
  location?: LocationPointDto;

  @IsOptional()
  @IsNumber()
  @Min(0, { message: 'Trust score must be greater than or equal to 0' })
  @Max(100, { message: 'Trust score must be less than or equal to 100' })
  trustScore?: number;
}
