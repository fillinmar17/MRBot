import {
	APIResult,
	BotInit,
	BotUpdatesOptions,
	ChatInfoResult,
	CoreBot,
	MemberAddResult,
	Message,
	MessagePatch,
} from '../bot/bot';
import type {ChatUpdate} from '../bot/types';
import {telegramUpdateToChatUpdate} from './processing';
import type {TelegramResponse, TelegramUpdate} from './types';

export class TelegramBot extends CoreBot {
	private lastUpdated = 0;

	constructor(init: BotInit) {
		super({
			host: 'api.telegram.org',
			...init,
			context: init.context || '/bot',
		});
	}

	public override clone(init: Partial<BotInit>): TelegramBot {
		return new TelegramBot({
			...this.init,
			...init,
		});
	}

	public override url(method: string): string {
		return `${this.baseUrl}${this.init.token}/${method}`;
	}

	public override async sendMessage(message: Message) {
		console.log('logs in sendMessage message', message)
		const {error, data} = await this.call<{
			ok: boolean;
			result: {
				message_id: number;
			};
		}>('post', 'sendMessage', {
			chat_id: message.to,
			text: message.body,
			// parse_mode: message.format,
			reply_to_message_id: message.replyTo,
		});

		if (error) {
			return {
				error: (error as any)?.response?.status || error,
				data: null,
			};
		}

		return {
			error: null,
			data: {
				id: `${data!.result.message_id}`,
			},
		};
	}

	public override editMessage(_id: string, _chatId: string, _patch: MessagePatch) {
		return Promise.reject({error: 'Not supported "editMessage"'});
	}

	public override deleteMessage(_chatId: string, _id: string): Promise<APIResult<{id: string}>> {
		return Promise.reject({error: 'Not supported "deleteMessage"'});
	}

	public override addMember(_chatId: string, _members: string[]): Promise<MemberAddResult> {
		return Promise.reject({error: 'Not supported "addMember"'});
	}

	public async getChatInfo(_: string): Promise<ChatInfoResult> {
		return Promise.reject({error: 'Not supported "getChatInfo"'});
	}

	public async pinMessage() {
		return Promise.reject({error: 'Not supported "pinMessage"'});
	}

	public async getMemberList() {
		return Promise.reject({error: 'Not supported "getMemberList"'});
	}

	public async sendCallbackResponse() {
		return Promise.reject({error: 'Not supported "sendCallbackResponse"'});
	}

	public override async getUpdates(options: BotUpdatesOptions) {
		console.log('logs getUpdates');
		const {data} = await this.call<TelegramResponse<TelegramUpdate[]>>('post', 'getUpdates', {
			offset: this.lastUpdated,
		});

		if (!data) {
			return [];
		}

		return data.result.reduce((updates, raw) => {
			const update = this.parseUpdate(telegramUpdateToChatUpdate, raw, options);

			if (update) {
				updates.push(update);
			}

			this.lastUpdated = raw.update_id + 1;

			return updates;
		}, [] as ChatUpdate[]);
	}
}
