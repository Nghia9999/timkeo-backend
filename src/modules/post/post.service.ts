import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { Post, PostDocument } from './schemas/post.schema';

@Injectable()
export class PostService {
  constructor(@InjectModel(Post.name) private postModel: Model<PostDocument>) {}

  async create(createPostDto: CreatePostDto): Promise<Post> {
    // sanitize location: ensure it's an object with numeric latitude and longitude
    let location: { latitude: number; longitude: number } | undefined =
      undefined;
    if (createPostDto.location && typeof createPostDto.location === 'object') {
      const loc = createPostDto.location as any;
      const lat = Number(loc.latitude);
      const lng = Number(loc.longitude);
      if (!Number.isNaN(lat) && !Number.isNaN(lng)) {
        location = { latitude: lat, longitude: lng };
      }
    }

    const doc = new this.postModel({
      ...createPostDto,
      userId: new Types.ObjectId(createPostDto.userId),
      matchId: createPostDto.matchId
        ? new Types.ObjectId(createPostDto.matchId)
        : undefined,
      interestedUserId: createPostDto.interestedUserId?.map(
        (id) => new Types.ObjectId(id),
      ),
      location,
    });
    return doc.save();
  }

  async findAll(): Promise<Post[]> {
    return this.postModel
      .find()
      .populate('userId', 'name avatar sport trustScore ratingCount')
      .populate('interestedUserId', '_id')
      .exec();
  }

  async findOne(id: string): Promise<Post> {
    const post = await this.postModel.findById(id).exec();
    if (!post) throw new NotFoundException('Post not found');
    return post;
  }

  async update(id: string, dto: UpdatePostDto): Promise<Post> {
    // sanitize location in update dto as well
    const updatePayload: any = { ...dto };
    if ((dto as any).location && typeof (dto as any).location === 'object') {
      const loc = (dto as any).location;
      const lat = Number(loc.latitude);
      const lng = Number(loc.longitude);
      if (!Number.isNaN(lat) && !Number.isNaN(lng)) {
        updatePayload.location = { latitude: lat, longitude: lng };
      } else {
        delete updatePayload.location;
      }
    }

    const updated = await this.postModel
      .findByIdAndUpdate(id, updatePayload, { new: true })
      .exec();
    if (!updated) throw new NotFoundException('Post not found');
    return updated;
  }

  async remove(id: string): Promise<Post> {
    const deleted = await this.postModel.findByIdAndDelete(id).exec();
    if (!deleted) throw new NotFoundException('Post not found');
    return deleted;
  }
}
