import { Module } from '@nestjs/common';
import { AuthModule } from './modules/auth/auth.module';
import { MessagesModule } from './modules/messages/messages.module';

@Module({
  imports: [AuthModule, MessagesModule],
})
export class AppModule {}
