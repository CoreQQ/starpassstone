import { Body, Controller, Post, HttpCode } from '@nestjs/common';
import { ContactService } from './contact.service';
import { CreateContactDto } from './contact.dto';

@Controller('contact')
export class ContactController {
  constructor(private readonly contact: ContactService) {}

  @Post()
  @HttpCode(200)
  async create(@Body() dto: CreateContactDto) {
    await this.contact.handleLead(dto);
    return { ok: true };
  }
}
