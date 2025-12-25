import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CreateMatchDto } from './dto/create-match.dto';
import { UpdateMatchDto } from './dto/update-match.dto';
import { Match, MatchDocument } from './schemas/match.schema';

@Injectable()
export class MatchService {
  constructor(
    @InjectModel(Match.name) private matchModel: Model<MatchDocument>,
  ) {}

  async create(createMatchDto: CreateMatchDto): Promise<Match> {
    const doc = new this.matchModel({
      ...createMatchDto,
      postId: new Types.ObjectId(createMatchDto.postId),
      playersId: createMatchDto.playersId?.map((id) => new Types.ObjectId(id)),
      confirmBy: createMatchDto.confirmBy
        ? new Types.ObjectId(createMatchDto.confirmBy)
        : undefined,
    });
    return doc.save();
  }

  async findAll(): Promise<Match[]> {
    return this.matchModel.find().exec();
  }

  async findOne(id: string): Promise<Match> {
    const match = await this.matchModel.findById(id).exec();
    if (!match) throw new NotFoundException('Match not found');
    return match;
  }

  async update(id: string, dto: UpdateMatchDto): Promise<Match> {
    const updated = await this.matchModel
      .findByIdAndUpdate(id, dto, { new: true })
      .exec();
    if (!updated) throw new NotFoundException('Match not found');
    return updated;
  }

  async remove(id: string): Promise<Match> {
    const deleted = await this.matchModel.findByIdAndDelete(id).exec();
    if (!deleted) throw new NotFoundException('Match not found');
    return deleted;
  }
}
