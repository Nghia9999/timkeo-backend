import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document;

@Schema({
  timestamps: true, // Tự động thêm createdAt và updatedAt
})
export class User {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop()
  googleId?: string;

  @Prop()
  avatar?: string;

  @Prop()
  sport?: string;

  @Prop({ type: Object })
  location?: {
    latitude: number;
    longitude: number;
  };

  @Prop({ default: 0 })
  trustScore?: number;

  @Prop({ default: 0 })
  ratingCount?: number;
}

export const UserSchema = SchemaFactory.createForClass(User);
