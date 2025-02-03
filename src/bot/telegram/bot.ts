import {
	APIResult,
	BotInit,
	BotUpdatesOptions,
	ChatInfoResult,
	CoreBot,
	MemberAddResult,
	Message,
	MessagePatch,
} from '../bot';
import type {ChatUpdate} from '../types';
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

	public override async sendMessage(message: Message, id?: number) {
		const sendMessageMethod = 'sendMessage';
		const editMessageMethod = 'editMessageText';
		let reply_markup: string = '';
		if (message.keyboard) {
			const inlineKeyboardArray = message.keyboard.map(row =>
				row.map(button => ({
					text: button.text,
					callback_data: button.data,
					url: button.url
				}))
			);

			reply_markup = JSON.stringify({
				inline_keyboard: inlineKeyboardArray
			});
		}

		const {error, data} = await this.call<{
			ok: boolean;
			result: {
				message_id: number;
			};
		}>('post', id ? editMessageMethod :sendMessageMethod, {
			chat_id: message.to,
			text: message.body,
			reply_markup: reply_markup,
			parse_mode: message.format,
			reply_to_message_id: message.replyTo,
			message_id: id
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
				id: data!.result.message_id,
			},
		};
	}

	public override editMessage(_id: string, _chatId: string, _patch: MessagePatch) {
		// use send message
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
