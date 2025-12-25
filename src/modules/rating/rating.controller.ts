import {
  Controller,
  Post as HttpPost,
  Patch,
  Delete,
  Get,
  Body,
  Param,
} from '@nestjs/common';
import { RatingService } from './rating.service';
import { CreateRatingDto } from './dto/create-rating.dto';
import { UpdateRatingDto } from './dto/update-rating.dto';

@Controller('ratings')
export class RatingController {
  constructor(private readonly ratingService: RatingService) {}

  @HttpPost()
  create(@Body() dto: CreateRatingDto) {
    return this.ratingService.create(dto);
  }

  @Get('match/:matchId')
  findByMatch(@Param('matchId') matchId: string) {
    return this.ratingService.findByMatch(matchId);
  }

  @Get('user/:rateeId')
  findByRatee(@Param('rateeId') rateeId: string) {
    return this.ratingService.findByRatee(rateeId);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateRatingDto) {
    return this.ratingService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.ratingService.remove(id);
  }
}
