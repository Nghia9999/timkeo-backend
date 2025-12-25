import {
  IsArray,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateConversationDto {
  @IsString()
  @IsNotEmpty()
  postId: string;

  @IsArray()
  @IsOptional()
  participants?: string[];

  @IsString()
  @IsOptional()
  @IsIn(['no', 'waiting', 'confirm'])
  isMatch?: 'no' | 'waiting' | 'confirm';

  @IsString()
  @IsOptional()
  confirmBy?: string;
}
