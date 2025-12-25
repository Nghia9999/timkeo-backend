import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ChatService } from './chat.service';
import { ChatController } from './chat.controller';
import { ChatGateway } from './chat.gateway';
import {
  Conversation,
  ConversationSchema,
} from './schemas/conversation.schema';
import { Chat, ChatSchema } from './schemas/chat.schema';
import { Post, PostSchema } from '../post/schemas/post.schema';
import { Match, MatchSchema } from '../match/schemas/match.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Conversation.name, schema: ConversationSchema },
      { name: Chat.name, schema: ChatSchema },
      { name: Post.name, schema: PostSchema },
      { name: Match.name, schema: MatchSchema },
    ]),
  ],
  controllers: [ChatController],
  providers: [ChatService, ChatGateway],
  exports: [ChatService],
})
export class ChatModule {}
