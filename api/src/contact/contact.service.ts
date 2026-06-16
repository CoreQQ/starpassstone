import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CreateContactDto } from './contact.dto';

@Injectable()
export class ContactService {
  private readonly logger = new Logger(ContactService.name);

  constructor(private readonly config: ConfigService) {}

  /**
   * Persist / forward an incoming lead. Mirrors the original site, which
   * delivered leads to Telegram. If no Telegram credentials are configured the
   * lead is simply logged so the endpoint stays usable in development.
   */
  async handleLead(dto: CreateContactDto): Promise<void> {
    const lead = { ...dto, at: new Date().toISOString() };
    this.logger.log(`New lead: ${lead.name} / ${lead.phone}`);

    const token = this.config.get<string>('TELEGRAM_BOT_TOKEN');
    const chatId = this.config.get<string>('TELEGRAM_CHAT_ID');
    if (!token || !chatId) return;

    try {
      const text = `🪨 New Starpass Stone lead\nName: ${dto.name}\nPhone: ${dto.phone}`;
      await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, text }),
      });
    } catch (err) {
      this.logger.error('Failed to deliver lead to Telegram', err as Error);
    }
  }
}
