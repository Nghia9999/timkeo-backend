import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type RatingDocument = Rating & Document;

@Schema({ timestamps: true })
export class Rating {
  @Prop({ type: Types.ObjectId, ref: 'Match', required: true })
  matchId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  raterId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  rateeId: Types.ObjectId;

  @Prop({ required: true, min: 1, max: 5 })
  score: number;

  @Prop()
  comment?: string;
}

export const RatingSchema = SchemaFactory.createForClass(Rating);
