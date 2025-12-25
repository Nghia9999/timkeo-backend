import {
  Controller,
  Post as HttpPost,
  Patch,
  Get,
  Body,
  Param,
} from '@nestjs/common';
import { ChatService } from './chat.service';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { UpdateConversationDto } from './dto/update-conversation.dto';
import { ChatGateway } from './chat.gateway';
import { CreateChatDto } from './dto/create-chat.dto';

@Controller('chat')
export class ChatController {
  constructor(
    private readonly chatService: ChatService,
    private readonly chatGateway: ChatGateway,
  ) {
    // assign gateway to property for emits
    this.gateway = chatGateway;
  }

  // inject gateway to emit realtime events on conversation updates
  // (note: ChatGateway is a provider in the same module)
  // We'll set it via property injection to avoid changing constructor signature in some setups
  private _gateway: ChatGateway;

  set gateway(g: ChatGateway) {
    this._gateway = g;
  }

  @HttpPost('conversations')
  createConversation(@Body() dto: CreateConversationDto) {
    return this.chatService.createConversation(dto);
  }

  @Patch('conversations/:id')
  async updateConversation(@Param('id') id: string, @Body() dto: any) {
    const updated = await this.chatService.updateConversation(id, dto);

    try {
      const updatedAny = updated as any;
      const convId = updatedAny._id ?? updatedAny.id;

      // If conversation updated and gateway available, emit to conversation room
      if (convId && this._gateway?.server) {
        const room = convId.toString();
        this._gateway.server.to(room).emit('conversation_updated', updatedAny);

        // notify each participant in their user room
        const participantIds = (updatedAny.participants || []).map((p: any) =>
          p.toString(),
        );
        participantIds.forEach((pid: string) =>
          this._gateway.server.to(`user:${pid}`).emit('conversation_updated', updatedAny),
        );

        // Additionally, emit updated conversation objects for every conversation of the same post
        // so clients viewing other conversation threads for the same post can update their UI.
        try {
          const postId = (updatedAny.postId && (updatedAny.postId._id || updatedAny.postId)) || updatedAny.postId;
          if (postId) {
            const convs = await this.chatService.findConversationsByPost(
              postId.toString(),
            );
            convs.forEach((conv: any) => {
              const rid = conv._id ?? conv.id;
              if (rid) {
                this._gateway.server.to(rid.toString()).emit('conversation_updated', conv);
                // also notify participants of each conversation
                (conv.participants || []).forEach((p: any) =>
                  this._gateway.server.to(`user:${p.toString()}`).emit('conversation_updated', conv),
                );
              }
            });
          }
        } catch (e) {
          // non-fatal: already emitted to updated conversation
          console.error('Failed to broadcast conversation updates for post', e);
        }
      }
    } catch (e) {
      console.error('Failed to emit conversation_updated', e);
    }

    return updated;
  }

  @Get('conversations/post/:postId')
  findByPost(@Param('postId') postId: string) {
    return this.chatService.findConversationsByPost(postId);
  }

  @Get('conversations/user/:userId')
  findByUser(@Param('userId') userId: string) {
    return this.chatService.findConversationsByUser(userId);
  }

  @Get('conversations/user/:userId/details')
  findConversationsWithDetails(@Param('userId') userId: string) {
    return this.chatService.findConversationsWithDetails(userId);
  }

  @Get('conversations/:id')
  findById(@Param('id') id: string) {
    return this.chatService.findConversationById(id);
  }

  @HttpPost('messages')
  createChat(@Body() dto: CreateChatDto) {
    return this.chatService.createChat(dto);
  }

  @Get('messages/:conversationId')
  findChats(@Param('conversationId') conversationId: string) {
    return this.chatService.findChats(conversationId);
  }
}
