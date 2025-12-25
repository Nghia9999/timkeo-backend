import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type MatchDocument = Match & Document;

@Schema({ timestamps: true })
export class Match {
  @Prop({ type: Types.ObjectId, ref: 'Post', required: true })
  postId: Types.ObjectId;

  @Prop({ type: [Types.ObjectId], ref: 'User', default: [] })
  playersId?: Types.ObjectId[];

  @Prop({ required: true })
  sport: string;

  @Prop({ required: true })
  startTime: Date;

  @Prop({ required: true })
  endTime: Date;

  @Prop({ type: Object })
  location?: {
    latitude: number;
    longitude: number;
  };

  @Prop({ default: 'confirm' })
  status?: string;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  confirmBy?: Types.ObjectId;
}

export const MatchSchema = SchemaFactory.createForClass(Match);
