import { TemplateContract } from '../contracts/template.contract';
import { ChannelContract } from '../contracts/channel.contract';
import { CommunicationException } from '../exceptions/communication.exception';
import { CommunicationChannel } from '../contracts/notification.contract';

export class CommunicationRegistry {
  private static templates = new Map<string, TemplateContract>();
  private static channels = new Map<CommunicationChannel, ChannelContract>();

  static registerTemplate(template: TemplateContract): void {
    if (this.templates.has(template.template_id)) {
      throw CommunicationException.registry(`Template ${template.template_id} is already registered`);
    }
    this.templates.set(template.template_id, template);
  }

  static getTemplate(templateId: string): TemplateContract {
    const t = this.templates.get(templateId);
    if (!t) throw CommunicationException.registry(`Template ${templateId} not found`);
    return t;
  }

  static registerChannel(channel: ChannelContract): void {
    if (this.channels.has(channel.channelType)) {
      throw CommunicationException.registry(`Channel ${channel.channelType} is already registered`);
    }
    this.channels.set(channel.channelType, channel);
  }

  static getChannel(channelType: CommunicationChannel): ChannelContract {
    const c = this.channels.get(channelType);
    if (!c) throw CommunicationException.registry(`Channel ${channelType} not found`);
    return c;
  }
}
