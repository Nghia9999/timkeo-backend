import {
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatService } from './chat.service';
import { CreateChatDto } from './dto/create-chat.dto';

@WebSocketGateway({ cors: true })
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(private readonly chatService: ChatService) {}

  // Provide a setter so other providers (e.g., controller) can access this gateway instance
  setGatewayForControllers() {
    // no-op placeholder to allow DI
  }

  handleConnection(client: Socket) {
    // Optional logging
  }

  handleDisconnect(client: Socket) {
    // Optional logging
  }

  @SubscribeMessage('join_conversation')
  handleJoinConversation(
    @MessageBody() data: { conversationId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const room = data.conversationId;
    client.join(room);
    return { joined: room };
  }

  @SubscribeMessage('join_user')
  handleJoinUser(
    @MessageBody() data: { userId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const room = `user:${data.userId}`;
    client.join(room);
    return { joined: room };
  }

  @SubscribeMessage('send_message')
  async handleSendMessage(@MessageBody() payload: CreateChatDto) {
    const saved = await this.chatService.createChat(payload);
    const room = saved.conversationId.toString();
    // Emit to conversation room
    this.server.to(room).emit('new_message', saved);

    // Also emit to each participant's user room so they receive notifications
    try {
      const conv = await this.chatService.findConversationById(room);
      const participantIds: string[] = (conv.participants || []).map((p: any) =>
        p.toString(),
      );
      const senderId = saved.senderId?.toString();
      // Broadcast to user rooms except the sender to avoid duplicate delivery
      participantIds
        .filter((pid) => pid !== senderId)
        .forEach((pid) =>
          this.server.to(`user:${pid}`).emit('new_message', saved),
        );
    } catch (e) {
      // ignore errors but keep conversation-room emit
      console.error('Failed to broadcast to user rooms', e);
    }
    return saved;
  }
}
