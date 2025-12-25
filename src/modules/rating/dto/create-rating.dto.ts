import {
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  Min,
  Max,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateRatingDto {
  @IsMongoId()
  @IsNotEmpty()
  matchId: string;

  @IsMongoId()
  @IsNotEmpty()
  raterId: string;

  @IsMongoId()
  @IsNotEmpty()
  rateeId: string;

  @IsNumber()
  @Min(1)
  @Max(5)
  score: number;

  @IsOptional()
  @IsString()
  comment?: string;
}
