import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CreateRatingDto } from './dto/create-rating.dto';
import { UpdateRatingDto } from './dto/update-rating.dto';
import { Rating, RatingDocument } from './schemas/rating.schema';
import { User, UserDocument } from '../user/schemas/user.schema';
import { Match, MatchDocument } from '../match/schemas/match.schema';

@Injectable()
export class RatingService {
  constructor(
    @InjectModel(Rating.name) private ratingModel: Model<RatingDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Match.name) private matchModel: Model<MatchDocument>,
  ) {}

  async create(dto: CreateRatingDto): Promise<Rating> {
    // Kiểm tra match tồn tại và đã confirmed
    const match = await this.matchModel.findById(dto.matchId).exec();
    if (!match) throw new NotFoundException('Match not found');
    // Only 'confirm' status is considered confirmed for rating
    if (match.status !== 'confirm') {
      throw new BadRequestException(
        'Match is not confirmed, rating not allowed.',
      );
    }
    // Kiểm tra người đánh giá thuộc match
    const players = (match.playersId ?? []).map((id) => id.toString());
    if (
      players.length &&
      (!players.includes(dto.raterId) || !players.includes(dto.rateeId))
    ) {
      throw new BadRequestException(
        'Only matched players can rate each other.',
      );
    }

    // Đảm bảo 1 match chỉ được 1 lần rating cho cặp (rater, ratee)
    const existing = await this.ratingModel
      .findOne({
        matchId: new Types.ObjectId(dto.matchId),
        raterId: new Types.ObjectId(dto.raterId),
        rateeId: new Types.ObjectId(dto.rateeId),
      })
      .exec();
    if (existing) {
      throw new BadRequestException(
        'You have already rated this user for this match.',
      );
    }

    const doc = new this.ratingModel({
      ...dto,
      matchId: new Types.ObjectId(dto.matchId),
      raterId: new Types.ObjectId(dto.raterId),
      rateeId: new Types.ObjectId(dto.rateeId),
    });
    const rating = await doc.save();

    // Sau khi rating được tạo, cập nhật trustScore và ratingCount cho ratee
    await this.recalculateUserTrustScore(dto.rateeId);

    return rating;
  }

  async findByMatch(matchId: string): Promise<Rating[]> {
    return this.ratingModel
      .find({ matchId: new Types.ObjectId(matchId) })
      .exec();
  }

  async findByRatee(rateeId: string): Promise<Rating[]> {
    return this.ratingModel
      .find({ rateeId: new Types.ObjectId(rateeId) })
      .exec();
  }

  private async recalculateUserTrustScore(rateeId: string): Promise<void> {
    const ratings = await this.findByRatee(rateeId);

    if (!ratings.length) {
      await this.userModel
        .findByIdAndUpdate(rateeId, { trustScore: 0, ratingCount: 0 })
        .exec();
      return;
    }

    const total = ratings.reduce((sum, r) => sum + r.score, 0);
    const avg = total / ratings.length; // 1–5

    let trustScore = (avg / 5) * 100; // 0–100
    if (trustScore < 0) trustScore = 0;
    if (trustScore > 100) trustScore = 100;

    await this.userModel
      .findByIdAndUpdate(rateeId, {
        trustScore,
        ratingCount: ratings.length,
      })
      .exec();
  }

  async update(id: string, dto: UpdateRatingDto): Promise<Rating> {
    const updated = await this.ratingModel
      .findByIdAndUpdate(id, dto, { new: true })
      .exec();
    if (!updated) throw new NotFoundException('Rating not found');
    return updated;
  }

  async remove(id: string): Promise<Rating> {
    const deleted = await this.ratingModel.findByIdAndDelete(id).exec();
    if (!deleted) throw new NotFoundException('Rating not found');
    return deleted;
  }
}
