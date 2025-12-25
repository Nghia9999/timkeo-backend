import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  Conversation,
  ConversationDocument,
} from './schemas/conversation.schema';
import { Chat, ChatDocument } from './schemas/chat.schema';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { UpdateConversationDto } from './dto/update-conversation.dto';
import { CreateChatDto } from './dto/create-chat.dto';
import { Match, MatchDocument } from '../match/schemas/match.schema';
import { Post, PostDocument } from '../post/schemas/post.schema';

@Injectable()
export class ChatService {
  constructor(
    @InjectModel(Conversation.name)
    private conversationModel: Model<ConversationDocument>,
    @InjectModel(Chat.name)
    private chatModel: Model<ChatDocument>,
    @InjectModel(Post.name)
    private postModel: Model<PostDocument>,
    @InjectModel(Match.name)
    private matchModel: Model<MatchDocument>,
  ) {}

  async createConversation(dto: CreateConversationDto): Promise<Conversation> {
    // Không cho người dùng nhắn tin cho chính mình (người tạo post)
    const post = await this.postModel.findById(dto.postId).exec();
    if (!post) {
      throw new NotFoundException('Post not found');
    }

    const participantIds = dto.participants ?? [];
    if (participantIds.length > 0) {
      const firstParticipantId = participantIds[0];
      if (post.userId.toString() === firstParticipantId) {
        throw new BadRequestException(
          'You cannot create a conversation with yourself (post owner).',
        );
      }
    }

    // Đảm bảo cả người tạo bài (post owner) và người quan tâm đều nằm trong participants
    const allParticipantIds = [
      ...new Set<string>([
        ...participantIds,
        post.userId.toString(), // chủ bài
      ]),
    ];

    const doc = new this.conversationModel({
      ...dto,
      postId: new Types.ObjectId(dto.postId),
      participants: allParticipantIds.map((id) => new Types.ObjectId(id)),
      isMatch: dto.isMatch ?? 'no',
      confirmBy: dto.confirmBy ? new Types.ObjectId(dto.confirmBy) : undefined,
    });
    const conversation = await doc.save();

    // Khi bắt đầu cuộc trò chuyện, tăng số người quan tâm bài đăng
    if (dto.participants && dto.participants.length > 0) {
      const firstParticipantId = dto.participants[0];
      await this.postModel
        .findByIdAndUpdate(
          dto.postId,
          {
            $addToSet: {
              interestedUserId: new Types.ObjectId(firstParticipantId),
            },
          },
          { new: true },
        )
        .exec();
    }

    return conversation;
  }

  async updateConversation(
    id: string,
    dto: UpdateConversationDto,
  ): Promise<Conversation> {
    // Load current conversation to implement state transitions
    const current = await this.conversationModel.findById(id).exec();
    if (!current) throw new NotFoundException('Conversation not found');

    // Handle isMatch string state transitions: 'no' -> 'waiting' -> 'confirm'
    if (dto.isMatch) {
      try {
        // Initiate waiting: record waitingBy when moving from 'no' -> 'waiting'
        if (dto.isMatch === 'waiting' && (dto as any).waitingBy) {
          const waiter = (dto as any).waitingBy as string;
          if (current.isMatch === 'no') {
            const updated = await this.conversationModel
              .findByIdAndUpdate(
                id,
                { isMatch: 'waiting', waitingBy: new Types.ObjectId(waiter) },
                { new: true },
              )
              .exec();
            return updated as any;
          }
        }

        // Finalize confirm:
        // - If currently 'waiting' and someone (other user) confirms, set confirmBy = current.waitingBy and remove waitingBy
        if (dto.isMatch === 'confirm') {
          if (current.isMatch === 'waiting' && current.waitingBy) {
            const initiatorId = current.waitingBy.toString();

            // Ensure post hasn't been matched already
            const post = await this.postModel.findById(current.postId).exec();
            if (
              post &&
              (String(post.status || '').toLowerCase() === 'inactive' ||
                post.matchId)
            ) {
              // Another conversation already created a match; revert this conversation to 'no'
              const reverted = await this.conversationModel
                .findByIdAndUpdate(
                  id,
                  { isMatch: 'no', $unset: { waitingBy: '' } },
                  { new: true },
                )
                .exec();
              return reverted as any;
            }

            const updated = await this.conversationModel
              .findByIdAndUpdate(
                id,
                {
                  isMatch: 'confirm',
                  confirmBy: new Types.ObjectId(initiatorId),
                  $unset: { waitingBy: '' },
                },
                { new: true },
              )
              .exec();

            if (!updated) throw new NotFoundException('Conversation not found');

            // Create Match from Post + Conversation
            try {
              if (post) {
                const matchDoc = new this.matchModel({
                  postId: post._id,
                  playersId: current.participants ?? [],
                  sport: post.sport,
                  startTime: post.startTime,
                  endTime: post.endTime,
                  location: post.location,
                  confirmBy: new Types.ObjectId(initiatorId),
                });
                const savedMatch = await matchDoc.save();
                await this.postModel
                  .findByIdAndUpdate(post._id, {
                    status: 'inactive',
                    matchId: savedMatch._id,
                  })
                  .exec();

                // Reset other conversations for this post to 'no' so others cannot confirm
                await this.conversationModel
                  .updateMany(
                    { postId: current.postId, _id: { $ne: updated._id } },
                    { isMatch: 'no', $unset: { waitingBy: '', confirmBy: '' } },
                  )
                  .exec();
              } else {
                // fallback: still mark post inactive
                await this.postModel
                  .findByIdAndUpdate(current.postId, { status: 'inactive' })
                  .exec();
                await this.conversationModel
                  .updateMany(
                    { postId: current.postId, _id: { $ne: updated._id } },
                    { isMatch: 'no', $unset: { waitingBy: '', confirmBy: '' } },
                  )
                  .exec();
              }
            } catch (e) {
              console.error(
                'Failed to create match after conversation confirm:',
                e,
              );
            }

            return updated as any;
          }

          // If current is not 'waiting' but client provided confirmBy (edge case), use it and ensure waitingBy is removed
          if ((dto as any).confirmBy) {
            const confirmer = (dto as any).confirmBy as string;

            // Ensure post hasn't been matched already
            const post = await this.postModel.findById(current.postId).exec();
            if (
              post &&
              (String(post.status || '').toLowerCase() === 'inactive' ||
                post.matchId)
            ) {
              const reverted = await this.conversationModel
                .findByIdAndUpdate(
                  id,
                  { isMatch: 'no', $unset: { waitingBy: '' } },
                  { new: true },
                )
                .exec();
              return reverted as any;
            }

            const updated = await this.conversationModel
              .findByIdAndUpdate(
                id,
                {
                  isMatch: 'confirm',
                  confirmBy: new Types.ObjectId(confirmer),
                  $unset: { waitingBy: '' },
                },
                { new: true },
              )
              .exec();

            if (!updated) throw new NotFoundException('Conversation not found');

            // Create Match from Post + Conversation using provided confirmer as confirmBy
            try {
              if (post) {
                const matchDoc = new this.matchModel({
                  postId: post._id,
                  playersId: current.participants ?? [],
                  sport: post.sport,
                  startTime: post.startTime,
                  endTime: post.endTime,
                  location: post.location,
                  confirmBy: new Types.ObjectId(confirmer),
                });
                const savedMatch = await matchDoc.save();
                await this.postModel
                  .findByIdAndUpdate(post._id, {
                    status: 'inactive',
                    matchId: savedMatch._id,
                  })
                  .exec();

                // Reset other conversations for this post
                await this.conversationModel
                  .updateMany(
                    { postId: current.postId, _id: { $ne: updated._id } },
                    { isMatch: 'no', $unset: { waitingBy: '', confirmBy: '' } },
                  )
                  .exec();
              } else {
                await this.postModel
                  .findByIdAndUpdate(current.postId, { status: 'inactive' })
                  .exec();
                await this.conversationModel
                  .updateMany(
                    { postId: current.postId, _id: { $ne: updated._id } },
                    { isMatch: 'no', $unset: { waitingBy: '', confirmBy: '' } },
                  )
                  .exec();
              }
            } catch (e) {
              console.error(
                'Failed to create match after conversation confirm:',
                e,
              );
            }

            return updated as any;
          }
        }
      } catch (e) {
        console.error('Error handling isMatch transition:', e);
      }
    }

    // Fallback: general update for other fields
    const updated = await this.conversationModel
      .findByIdAndUpdate(id, dto, { new: true })
      .exec();
    if (!updated) throw new NotFoundException('Conversation not found');

    return updated as any;
  }

  async findConversationsByPost(postId: string): Promise<Conversation[]> {
    return this.conversationModel
      .find({ postId: new Types.ObjectId(postId) })
      .lean()
      .exec();
  }

  async createChat(dto: CreateChatDto): Promise<Chat> {
    const conversation = await this.conversationModel
      .findById(new Types.ObjectId(dto.conversationId))
      .exec();
    if (!conversation) throw new NotFoundException('Conversation not found');

    const doc = new this.chatModel({
      ...dto,
      conversationId: new Types.ObjectId(dto.conversationId),
      senderId: new Types.ObjectId(dto.senderId),
    });
    const saved = await doc.save();

    // Cập nhật updatedAt của conversation, đảm bảo người gửi nằm trong participants
    // và được tính là người quan tâm bài đăng
    await Promise.all([
      this.conversationModel
        .findByIdAndUpdate(
          dto.conversationId,
          {
            updatedAt: new Date(),
            $addToSet: {
              participants: new Types.ObjectId(dto.senderId),
            },
          },
          { new: true },
        )
        .exec(),
      this.postModel
        .findByIdAndUpdate(
          conversation.postId,
          {
            $addToSet: {
              interestedUserId: new Types.ObjectId(dto.senderId),
            },
          },
          { new: true },
        )
        .exec(),
    ]);

    return saved;
  }

  async findChats(conversationId: string): Promise<Chat[]> {
    return this.chatModel
      .find({ conversationId: new Types.ObjectId(conversationId) })
      .sort({ createdAt: 1 })
      .limit(100)
      .lean()
      .exec();
  }

  async findConversationsByUser(userId: string): Promise<Conversation[]> {
    return this.conversationModel
      .find({ participants: new Types.ObjectId(userId) })
      .sort({ updatedAt: -1 })
      .lean()
      .exec();
  }

  async findConversationsWithDetails(userId: string) {
    const conversations = await this.conversationModel
      .find({ participants: new Types.ObjectId(userId) })
      .populate('postId', 'title sport userId')
      .populate('participants', 'name avatar')
      .sort({ updatedAt: -1 })
      .lean()
      .exec();

    // Lấy last message cho mỗi conversation
    const conversationsWithLastMessage = await Promise.all(
      conversations.map(async (conv) => {
        const lastMessage = await this.chatModel
          .findOne({ conversationId: conv._id })
          .sort({ createdAt: -1 })
          .lean()
          .exec();

        // Tìm người đối thoại (không phải user hiện tại)
        const otherParticipant = conv.participants.find(
          (p: any) => p._id.toString() !== userId,
        );

        // Lấy post owner nếu chưa có trong participants
        const post = await this.postModel
          .findById(conv.postId)
          .populate('userId', 'name avatar')
          .lean()
          .exec();

        return {
          ...conv,
          lastMessage: lastMessage || null,
          otherParticipant: otherParticipant || (post?.userId as any) || null,
          postTitle: (conv.postId as any)?.title || '',
          postSport: (conv.postId as any)?.sport || '',
        };
      }),
    );

    return conversationsWithLastMessage;
  }

  async findConversationById(id: string): Promise<Conversation> {
    const conv = await this.conversationModel.findById(id).lean().exec();
    if (!conv) throw new NotFoundException('Conversation not found');
    return conv as any;
  }
}
