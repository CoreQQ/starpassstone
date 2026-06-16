import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ContactController } from './contact/contact.controller';
import { ContactService } from './contact/contact.service';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true })],
  controllers: [ContactController],
  providers: [ContactService],
})
export class AppModule {}
