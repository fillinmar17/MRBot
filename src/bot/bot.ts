import axios from 'axios';

import type {MessageKeyboardButtons} from './keyboard';
import type {ChatCommand, ChatInfo, ChatUpdate} from './types';
import {__VERBOSE_FLAGS__, retry, verbose} from './util';

export type BotInit = {
	/** ID/Имя бота */
	name?: string;

	/** API Host */
	host?: string;

	/** Токен авторизации */
	token: string;

	/** Контекст API */
	context?: string;

	/** https/http */
	protocol?: string;
};

export type BotUpdatesOptions = {
	/** Connection hold time (in seconds) */
	pollTime?: number;
	handleUpdate?: (update: ChatUpdate, raw: unknown) => void;
	handleRawUpdate?: (update: unknown) => void;
};

export type Message = {
	/** Message To */
	to: string;

	/** ID сообщения на которое отвечаем */
	replyTo?: string;

	/** Message Body */
	body: string;

	/** Иконка в начале сообщения */
	icon?: string;

	/** Message body format */
	format: 'text' | 'markdown' | 'html' | 'md2html' | 'jira2md' | 'jira2html' | MessageFormat;

	/** Inline Keyboard */
	keyboard?: MessageKeyboardButtons[];

	verbose?: boolean;
};

export type MessageFormat = Record<string, unknown>;

export type MessagePatch = Pick<Message, 'body' | 'format' | 'keyboard'>;

export type APIResult<R extends Record<string, unknown>> =
	| {
			error: null;
			data: R;
	  }
	| {
			error: unknown;
			data: null;
	  };

export type APIResultList<R extends Record<string, unknown>[]> =
	| {
			error: null;
			data: R;
	  }
	| {
			error: unknown;
			data: null;
	  };

export type MessageSendResult = APIResult<{
	id: string;
}>;

export type MessageDeleteResult = APIResult<{
	id: string;
}>;

export type MemberAddResult = APIResult<{
	failures: Array<{id: string; error: string}>;
}>;

export type ChatMemberListItem = {
	id: string;
	type: 'owner' | 'admin' | 'member';
};
export type MemberListResult = APIResultList<ChatMemberListItem[]>;

export type ChatInfoResult = APIResult<ChatInfo>;

/** Абстрактный Бот */
export abstract class CoreBot {
	// private console = getActiveConsole();
	protected init: Readonly<Required<BotInit>>;
	readonly baseUrl: string;

	constructor(init: BotInit) {
		this.init = {
			name: '<<noname>>',
			host: 'api.unknown.bot',
			context: '/',
			protocol: 'https:',
			...init,
		};

		this.baseUrl = `${this.init.protocol}//${this.init.host}${this.init.context}`;
	}

	/** ID/Имя бота */
	get name() {
		return this.init.name;
	}

	/** Проверка доступности работы */
	public isAvailable() {
		return !!this.init.token;
	}

	/** Базовые параметры при работе с API */
	protected getBaseCallParams(): Record<string, string | number> {
		return {};
	}

	/** Работа с API */
	protected async call<R>(type: 'get' | 'post', method: string, params: Record<string, unknown>) {
		const url = this.url(method);
		console.log('logs url', url, 'method', method, 'type', type)

		try {
			const result = await retry({
				max: 2,
				timeout: 1e3,
				executer: () =>
					axios(url, {
						method: type,
						params: {
							...this.getBaseCallParams(),
							...params,
						},
						timeout: 10000,
					}),
				onError: (error, attempt) => {
					console.error(`[bot] [api] [error] ${type} ${method}`, {
						params,
						attempt,
						error: axios.isAxiosError(error)
							? {
									status: error.response?.status,
									statusText: error?.response?.data?.description,
									headers: error.response?.headers,
							  }
							: `${error}`,
					});
				},
			});

			if (__VERBOSE_FLAGS__.log) {
				console.log(`[bot] [api] [ok] ${type} ${method}`, {
					params,
					headers: {
						date: result.headers['date'],
						'x-response-code': result.headers['x-response-code'],
						'x-response-status': result.headers['x-response-status'],
					},
				});
			}

			return {
				error: null,
				data: result.data as NonNullable<R>,
			};
		} catch (error) {
			return {
				error,
				data: null,
			};
		}
	}

	/** Обработка обновлений от бота */
	protected parseUpdate<T>(
		parse: (raw: T) => ChatUpdate | null,
		raw: T,
		options: BotUpdatesOptions,
	): ChatUpdate | null {
		let update = parse(raw);

		try {
			options.handleRawUpdate?.(raw);
		} catch {}

		verbose('log', 'parseUpdate', raw);

		if (update == null) {
			verbose('log', '[Bot] unknown update:', raw);
			return null;
		}

		if ((update.type === 'message' || update.type === 'post') && update.body != null) {
			const cmd = update.body.match(/^([/#])([a-z_-]+)($|[\S\s]+)/i)!;

			if (cmd) {
				update = {
					id: update.id,
					type: 'command',
					date: update.date,
					chat: update.chat,
					user: 'user' in update ? update.user : null,
					raw: update.body,
					original: update.original,
					command: {
						type: cmd[1][0] as ChatCommand['type'],
						name: cmd[2].toLowerCase(),
						args: update.body.split(/\s+/).slice(1),
					},
					parts: 'parts' in update ? update.parts : null,
				};
			}
		}

		try {
			options.handleUpdate?.(update, raw);
		} catch {}

		return update;
	}

	/** Ответить на callback событие */
	public abstract sendCallbackResponse(
		id: string,
		text?: string,
		showAlert?: boolean,
		url?: string,
	): Promise<boolean>;

	/** Клонировать Бота */
	public abstract clone(init: Partial<BotInit>): CoreBot;

	/** Метод формирования url до API */
	public abstract url(method: string): string;

	/** Отправка ботом сообщения  */
	public abstract sendMessage(message: Message): Promise<MessageSendResult>;

	/** Отправка ботом сообщения  */
	public abstract editMessage(id: string, chatId: string, patch: MessagePatch): Promise<MessageSendResult>;

	/** Удалить сообщени  */
	public abstract deleteMessage(chatId: string, id: string): Promise<APIResult<{id: string}>>;

	/** Получение обновлений от бота */
	public abstract getUpdates(options?: BotUpdatesOptions): Promise<ChatUpdate[]>;

	/** Добавить участика в чат/канал */
	public abstract addMember(chatId: string, members: string[]): Promise<MemberAddResult>;

	/** Получить список участников чата/канала */
	public abstract getMemberList(chatId: string): Promise<MemberListResult>;

	/** Информация о чате */
	public abstract getChatInfo(chatId: string): Promise<ChatInfoResult>;

	/** Прекрепить сообщение */
	public abstract pinMessage(chatId: string, messageId: string, state: boolean): Promise<{ok: boolean}>;
}
