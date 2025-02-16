import {
	BotInit,
	BotUpdatesOptions,
	ChatInfoResult,
	ChatMemberListItem,
	CoreBot,
	Message,
	MessagePatch,
	MessageSendResult,
} from '../bot';
import type {ChatUpdate} from '../types';
import {prepareMessage} from '../util';
import {vkEventToChatUpdate} from './processing';
import type {VKChatInfo, VKEvent} from './types';

const R_MENTION_ESCAPE = /@\[([^\]]+)\]/g;

const inlineKeyboard = ({keyboard}: Pick<Message, 'keyboard'>) => {
	if (!keyboard || !keyboard.length) {
		return undefined;
	}

	return JSON.stringify(
		keyboard.map((row) =>
			row.map((btn) => {
				const item = {
					text: btn.text,
					style: btn.type,
				};

				return 'url' in btn
					? {...item, url: btn.url}
					: {...item, callbackData: JSON.stringify(btn.data)};
			}),
		),
	);
};

/**
 * VKTeams Bot
 * - https://myteam.mail.ru/botapi/
 */
export class VKTeamsBot extends CoreBot {
	private lastEventId = 0;

	constructor(init: BotInit) {
		super({
			host: 'api.internal.myteam.mail.ru',
			...init,
			context: init.context || '/bot/v1',
		});
	}

	public override clone(init: Partial<BotInit>): VKTeamsBot {
		return new VKTeamsBot({
			...this.init,
			...init,
		});
	}

	protected override getBaseCallParams() {
		return {
			token: this.init.token,
		};
	}

	protected prepareMessage<T extends MessagePatch>(msg: T): T & {parseMode: string | undefined} {
		const message = prepareMessage(msg.body, msg);
		const {format, parseMode} = message;
		let {body} = message;

		if (!msg.format || msg.format === 'markdown') {
			body = body.replace(R_MENTION_ESCAPE, '@\\[$1\\]');
		}

		return {
			...msg,
			format,
			body,
			parseMode,
		};
	}

	public override url(method: string) {
		return `${this.baseUrl}/${method}`;
	}

	public override async sendMessage(original: Message) {
		const pre = this.prepareMessage(original);
		const data = {
			chatId: pre.to,
			text: pre.body,
			replyMsgId: pre.replyTo,
			format: pre.format,
			parseMode: pre.parseMode,
			inlineKeyboardMarkup: inlineKeyboard(original),
		};

		console.log('log sendMessage', {data});

		const result = await this.call<{
			ok: boolean;
			description?: string;
			msgId?: string;
		}>('get', 'messages/sendText', data);

		const error = result.error || result.data?.description;

		if (error) {
			console.log({type: 'error', verbose: original.verbose}, {error});
			return {error, data: null};
		}

		const id = result.data!.msgId!;

		return {
			error: null,
			data: {
				id,
			},
		};
	}

	public override async editMessage(
		msgId: string,
		chatId: string,
		patch: MessagePatch,
	): Promise<MessageSendResult> {
		const pre = this.prepareMessage(patch);
		const data = {
			msgId,
			chatId,
			text: pre.body,
			format: pre.format,
			parseMode: pre.parseMode,
			inlineKeyboardMarkup: inlineKeyboard(patch),
		};

		const result = await this.call<{ok: boolean}>('get', 'messages/editText', data);

		if (result.error || !result.data?.ok) {
			return {error: result.error || new Error('Edit message failed'), data: null};
		}

		return {
			error: null,
			data: {
				id: msgId,
			},
		};
	}

	public override async deleteMessage(chatId: string, id: string) {
		const result = await this.call<{ok: boolean}>('get', 'messages/deleteMessages', {
			chatId,
			msgId: id,
		});

		const error = result.error;
		if (error) {
			return {error, data: null};
		}

		return {
			error: null,
			data: {
				id,
			},
		};
	}

	public override async getUpdates(options: BotUpdatesOptions) {
		const {data} = await this.call<{events: VKEvent[]}>('get', 'events/get', {
			lastEventId: this.lastEventId,
			pollTime: Math.max(options.pollTime || 1, 1),
		});

		if (!data) {
			return [];
		}

		if (!Array.isArray(data.events)) {
			return [];
		}

		return data.events.reduce<ChatUpdate[]>((updates, raw) => {
			const update = this.parseUpdate(vkEventToChatUpdate, raw, options);

			if (update) {
				updates.push(update);
			}

			this.lastEventId = raw.eventId;

			return updates;
		}, []);
	}

	public async getChatInfo(chatId: string): Promise<ChatInfoResult> {
		try {
			const {data, error} = await this.call<
				| {
						ok: false;
						description: 'Invalid chatId' | string;
				  }
				| VKChatInfo
			>('get', 'chats/getInfo', {
				chatId,
			});

			if (error || !data?.ok) {
				return {
					error: error || new Error(!data?.ok ? data?.description : ''),
					data: null,
				};
			}

			if (data.type === 'private') {
				return {
					error: null,
					data: {
						id: chatId,
						type: 'user',
						inviteLink: `https://u.internal.myteam.mail.ru/profile/${chatId}`,
						name:
							data.firstName && data.lastName
								? `${data.firstName} ${data.lastName}`
								: data.nick || data.firstName || data.lastName || '',
						public: true,
						description: data.about,
						firstName: data.firstName,
						lastName: data.lastName,
						nick: data.nick,
						language: data.language,
						isBot: data.isBot,
					},
				};
			}

			return {
				error: null,
				data: {
					id: chatId,
					type: data.type,
					name: data.title || '',
					inviteLink: data.inviteLink || '',
					public: data.public,
					description: data.about,
					joinModeration: data.joinModeration,
					rules: data.rules,
				},
			};
		} catch (error) {
			console.log('error', 'getChatInfo.chatId:', chatId, error);
			return {error, data: null};
		}
	}

	public override async addMember(chatId: string, members: string[]) {
		const {data} = await this.call<{
			failures: Array<{id: string; error: string}>;
		}>('get', 'chats/members/add', {
			chatId,
			members: JSON.stringify(members.map((sn) => ({sn}))),
		});

		return {error: null, data};
	}

	public override async getMemberList(chatId: string) {
		const members: ChatMemberListItem[] = [];
		const fetch = async (cursor?: string) => {
			const {data} = await this.call<{
				cursor?: string;
				members?: {
					userId: string;
					creator?: boolean;
					admin?: boolean;
				}[];
			}>('get', 'chats/getMembers', {
				chatId,
				cursor,
			});

			data?.members?.forEach((member) => {
				members.push({
					id: member.userId,
					type: member.creator ? 'owner' : member.admin ? 'admin' : 'member',
				});
			});

			if (data?.cursor) {
				await fetch(data?.cursor);
			}
		};

		await fetch();

		return {
			error: null,
			data: members,
		};
	}

	public override async pinMessage(chatId: string, msgId: string, state = true) {
		const {data} = await this.call<{ok: boolean}>(
			'get',
			state ? 'chats/pinMessage' : 'chats/unpinMessage',
			{
				chatId,
				msgId,
			},
		);

		console.log('log', 'pinMessage:', chatId, msgId, state, data);

		return data!;
	}

	public async sendCallbackResponse(queryId: string, text?: string, showAlert?: boolean, url?: string) {
		const {data} = await this.call<{ok: boolean}>('get', 'messages/answerCallbackQuery', {
			queryId,
			text,
			showAlert,
			url,
		});

		console.log('log', 'sendCallbackResponse:', queryId, data);

		return !!data?.ok;
	}

	public async getFileInfo(id: string) {
		const {data} = await this.call<{
			type: string;
			size: number;
			filename: string;
			url: string;
		}>('get', 'files/getInfo', {
			fileId: id,
		});

		console.log('log', 'getFileInfo:', id, data);

		return data;
	}
}
