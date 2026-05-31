import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiOkResponse,
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Roles } from '../../../auth/presentation/decorators/roles.decorator';
import { JwtAuthGuard } from '../../../auth/presentation/guards/jwt-auth.guard';
import { RolesGuard } from '../../../auth/presentation/guards/roles.guard';
import { CreateMessageUseCase } from '../../application/use-cases/create-message.use-case';
import { GetConversationMessagesUseCase } from '../../application/use-cases/get-conversation-messages.use-case';
import { SearchConversationMessagesUseCase } from '../../application/use-cases/search-conversation-messages.use-case';
import { CreateMessageRequestDto } from '../dto/create-message.request.dto';
import { GetConversationMessagesQueryDto } from '../dto/get-conversation-messages.query.dto';
import { SearchConversationMessagesQueryDto } from '../dto/search-conversation-messages.query.dto';

@ApiTags('messages')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('user', 'admin')
@Controller('api')
export class MessagesController {
  constructor(
    private readonly createMessageUseCase: CreateMessageUseCase,
    private readonly getConversationMessagesUseCase: GetConversationMessagesUseCase,
    private readonly searchConversationMessagesUseCase: SearchConversationMessagesUseCase,
  ) {}

  @Post('messages')
  @ApiOperation({ summary: 'Create a new message' })
  @ApiResponse({ status: 201, description: 'Message created successfully' })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  async createMessage(@Body() request: CreateMessageRequestDto) {
    return this.createMessageUseCase.execute({
      conversationId: request.conversationId,
      content: request.content,
      senderId: request.senderId,
      metadata: request.metadata,
    });
  }

  @Get('conversations/:conversationId/messages')
  @ApiOperation({
    summary: 'Retrieve messages for a conversation with pagination and sorting',
  })
  @ApiParam({ name: 'conversationId', example: 'conversation-123' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 20 })
  @ApiQuery({
    name: 'sortOrder',
    required: false,
    enum: ['asc', 'desc'],
    example: 'desc',
  })
  @ApiOkResponse({ description: 'Conversation messages retrieved successfully' })
  async getConversationMessages(
    @Param('conversationId') conversationId: string,
    @Query() query: GetConversationMessagesQueryDto,
  ) {
    return this.getConversationMessagesUseCase.execute({
      conversationId,
      page: query.page ?? 1,
      limit: query.limit ?? 20,
      sortOrder: query.sortOrder ?? 'desc',
    });
  }

  @Get('conversations/:conversationId/messages/search')
  @ApiOperation({
    summary: 'Search messages in a conversation by content',
  })
  @ApiParam({ name: 'conversationId', example: 'conversation-123' })
  @ApiQuery({ name: 'q', required: true, type: String, example: 'hello' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 20 })
  @ApiOkResponse({ description: 'Conversation messages search completed successfully' })
  async searchConversationMessages(
    @Param('conversationId') conversationId: string,
    @Query() query: SearchConversationMessagesQueryDto,
  ) {
    return this.searchConversationMessagesUseCase.execute({
      conversationId,
      q: query.q,
      page: query.page ?? 1,
      limit: query.limit ?? 20,
    });
  }
}
