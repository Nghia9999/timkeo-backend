import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type PostDocument = Post & Document;

@Schema({ timestamps: true })
export class Post {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ required: true })
  sport: string;

  @Prop({ required: true })
  title: string;

  @Prop()
  content?: string;

  @Prop({ required: true })
  startTime: Date;

  @Prop({ required: true })
  endTime: Date;

  @Prop({ type: Object })
  location?: {
    latitude: number;
    longitude: number;
  };

  @Prop({ default: 'active' })
  status?: string;

  @Prop({ type: [Types.ObjectId], ref: 'User', default: [] })
  interestedUserId?: Types.ObjectId[];

  @Prop()
  image?: string;

  @Prop({ type: Types.ObjectId, ref: 'Match' })
  matchId?: Types.ObjectId;
}

export const PostSchema = SchemaFactory.createForClass(Post);
