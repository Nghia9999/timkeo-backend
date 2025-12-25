import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ConversationDocument = Conversation & Document;

@Schema({ timestamps: true })
export class Conversation {
  @Prop({ type: Types.ObjectId, ref: 'Post', required: true })
  postId: Types.ObjectId;

  @Prop({ type: [Types.ObjectId], ref: 'User', default: [] })
  participants: Types.ObjectId[];

  // @Prop({ default: false })
  // isMatch: boolean;
  @Prop({
    type: String,
    enum: ['no', 'waiting', 'confirm'],
    default: 'no',
  })
  isMatch: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: false })
  confirmBy?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: false })
  waitingBy?: Types.ObjectId;
}

export const ConversationSchema = SchemaFactory.createForClass(Conversation);
