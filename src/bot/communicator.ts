// import {getPlatformCommunicatorScopeConfig} from '../scope.config';
import {TelegramBot} from '../telegram/bot';
import {VKTeamsBot} from '../vkteams/bot';
import type {
	APIResult,
	BotInit,
	BotUpdatesOptions,
	CoreBot,
	Message,
	MessagePatch,
	MessageSendResult,
} from './bot';
import {getDefaultApiToken, getDefaultCiApiToken, getDefaultProvider} from './env';
import {type MessageKeyboardInit, type MessageKeyboardLayout, MessageKeyboard} from './keyboard';
import type {Chat, ChatCommandEvent, ChatMessageEvent, ChatMetaEvent, ChatUpdate, ChatUser} from './types';
import {lazyInit, parseConfigValue} from './util';

// @ts-ignore
function merge(...list) {
	return list.reduce((result, cfg) => {
		Object.entries(cfg || {}).forEach(([key, val]) => {
			if (val != null) {
				result[key] = val && typeof val === 'object' && result[key] ? merge(result[key], val) : val;
			}
		});
		return result;
	}, {});
}

export type CommunicatorInit = {
	providers?: Record<string, Partial<BotInit> | undefined>;
	defaultProvider?: string;
	handleUpdateEvent?: (update: ChatUpdate, raw: unknown) => void;
	handleRawUpdateEvent?: (update: unknown) => void;
	verbose?: boolean;
};

export type CommunicatorCommandContext = {
	/** Имя команды */
	name: string;

	/** Аргументы */
	args: string[];

	/** Чат */
	chat: Chat;

	/** От кого */
	user: ChatUser | null;

	/** Бот-источник */
	bot: CoreBot;

	/** Провайлер бота */
	provider: string;

	/** Ссылка на Communicator */
	communicator: Communicator;

	/** Ответ сообщение */
	send: (message: Message) => Promise<MessageSendResult>;

	/** Ответ на команду */
	reply: (text: string, init?: Partial<Message>) => Promise<MessageSendResult>;

	/** Ответ в личку */
	sendPrivate: (text: string, init?: Partial<Message>) => Promise<MessageSendResult>;

	/** Редактировать сообщение */
	edit: (id: string, patch: MessagePatch) => Promise<MessageSendResult>;

	/** Удалить сообщение */
	delete: (id?: string) => Promise<APIResult<{id: string}>>;
};

export type CommunicatorAnyTextHandler = (ctx: CommunicatorCommandContext, update: ChatUpdate) => void;
export type CommunicatorCommandHandler = (ctx: CommunicatorCommandContext, evt: ChatCommandEvent) => void;
export type CommunicatorMetaCommandHandler = (ctx: CommunicatorCommandContext, evt: ChatMetaEvent) => void;

export type CommunicatorSendMessageResult = {
	to: {
		value: string;
		provider: string;
	};
	ok: boolean;
	bot: CoreBot;
	provider: string;
	data: null | {
		id: string;
	};
	error: unknown;
};

const VK_TEAMS = 'vkteams';

const BOT_REGISTRY: Record<
	string,
	{
		Bot: {new (init: BotInit): CoreBot};
		defaults: BotInit;
	}
> = {
	telegram: {
		Bot: TelegramBot,
		defaults: {token: ''},
	},
	[VK_TEAMS]: {
		Bot: VKTeamsBot,
		defaults: {token: ''},
	},
};

type GlobalMessageListener = (evt: ChatMessageEvent) => {stop: boolean} | void;

const globalMessageListeners = new Set<GlobalMessageListener>();

/** Communicator для взаимодействия с множественным IM */
export class Communicator {
	static getDefault = lazyInit(() => {
		const defaultProvider = getDefaultProvider();

		return new Communicator({
			defaultProvider,
			providers: {
				[defaultProvider]: {
					name: defaultProvider,
					token: getDefaultApiToken(),
				},
			},
		});
	});

	static getDeployCommunicator = lazyInit(
		() =>
			new Communicator({
				verbose: true,
				defaultProvider: VK_TEAMS,
				providers: {
					[VK_TEAMS]: {
						name: VK_TEAMS,
						token: getDefaultCiApiToken(),
					},
				},
			}),
	);

	static addGlobalMessageListener(handle: GlobalMessageListener): void {
		globalMessageListeners.add(handle);
	}

	static removeGlobalMessageListener(handle: GlobalMessageListener): void {
		globalMessageListeners.delete(handle);
	}

	static createKeyboard<Layout extends MessageKeyboardLayout>(init: MessageKeyboardInit<Layout>) {
		return new MessageKeyboard(init);
	}

	/** Провайдер по умолчанию */
	private defaultProvider: string;

	/** Провайдер бота и его инстанс */
	private botMap: Record<string, CoreBot | undefined>;

	/** Список бот + его провайдер */
	private botList: Array<{
		bot: CoreBot;
		provider: string;
	}> = [];

	/** Список зарегистрированных коммад */
	private anyText: Array<{
		handle: CommunicatorAnyTextHandler;
		description: string | null;
	}> = [];

	/** Список зарегистрированных коммад */
	private commands: Array<{
		name: string;
		handle: CommunicatorCommandHandler;
		description: string | null;
	}> = [];

	/** Список зарегистрированных мета-коммад (системные события, вроде присоденился к чату и т.п.) */
	private metaCommands: Array<{
		type: ChatMetaEvent['type'];
		handle: CommunicatorMetaCommandHandler;
		description: string | null;
	}> = [];

	constructor(private init: CommunicatorInit) {
		const {providers, defaultProvider} = init;
		console.log('logs CommunicatorInit', init)
		// const platformConfig = getPlatformCommunicatorScopeConfig();

		this.defaultProvider = defaultProvider || VK_TEAMS;

		this.botMap = Object.entries(BOT_REGISTRY).reduce((map, [key, {Bot, defaults}]) => {
			const provider = key as string;

			console.log('logs key, {Bot, defaults', key, {Bot, defaults})
			// todo: think about how to throw current bot
			// const platformBots = platformConfig[provider]?.bot;
			// const botName = platformBots?.default;
			const botName = key;
			const bot = new Bot(
				merge(
					defaults,
					{
						name: botName,
						// todo: think about how to throw token
						// token: parseConfigValue(botName && platformBots?.list?.[botName]),
						token: getDefaultApiToken(),
					},
					providers?.[provider],
				),
			);

			map[provider] = bot;

			this.botList.push({
				bot,
				provider,
			});

			return map;
		}, {} as typeof this.botMap);
	}

	/** Список доступных ботов */
	getAvailableBotList() {
		return this.botList.filter(({bot}) => bot.isAvailable());
	}

	/** Получить провайдера (бота) по его имени */
	getProvider(name: string) {
		return this.botMap[name];
	}

	/** Получение обновления от бота */
	private async getUpdates(provider: string, bot: CoreBot, options?: Pick<BotUpdatesOptions, 'pollTime'>) {
		if (!bot.isAvailable()) {
			return [];
		}

		return await bot.getUpdates({
			...options,
			handleUpdate: (update) => {
				this.processingChatUpdate(provider, bot, update);
			},
			handleRawUpdate: this.init.handleRawUpdateEvent,
		});
	}

	/** Создание контекста */
	public createCommandContext(
		provider: string,
		bot: CoreBot,
		update: ChatUpdate,
	): CommunicatorCommandContext {
		return {
			name: 'command' in update ? update.command.name : update.type,
			args: 'command' in update ? update.command.args : [],

			chat: update.chat,
			user: 'user' in update ? update.user : null,

			bot,
			communicator: this,
			provider,

			send: async (message: Message) => {
				return await bot.sendMessage(message);
			},

			reply: async (
				body: string,
				init: Partial<Pick<Message, 'replyTo' | 'keyboard' | 'format'>> = {},
			) => {
				return await bot.sendMessage({
					format: 'text',
					...init,
					to: update.chat.id,
					replyTo: init.replyTo || update.id,
					body,
				});
			},

			sendPrivate: async (
				body: string,
				init: Partial<Pick<Message, 'to' | 'keyboard' | 'format'>> = {},
			) => {
				return await bot.sendMessage({
					format: 'text',
					...init,
					to: init.to || ('user' in update && update.user?.id) || update.chat.id,
					body,
				});
			},

			edit: async (id: string, patch: MessagePatch) => {
				return bot.editMessage(id, ('user' in update && update.user?.id) as string, patch);
			},

			delete: async (id?: string) => {
				return bot.deleteMessage(update.chat.id, id || (('id' in update && update.id) as string));
			},
		};
	}

	/** Обработка обновления от бота */
	private processingChatUpdate(provider: string, bot: CoreBot, update: ChatUpdate) {
		if (update.type === 'callback') {
			MessageKeyboard.handleCallbackEvent(this, bot, update);
			return;
		}

		if (update.type === 'command') {
			this.commands.forEach(({name, handle}) => {
				if (name !== update.command.name || name === '*') {
					return;
				}

				handle(this.createCommandContext(provider, bot, update), update);
			});
			return;
		}

		if (update.type === 'member:join' || update.type === 'member:left') {
			this.metaCommands.forEach(({type, handle}) => {
				if (type !== update.type) {
					return;
				}

				handle(this.createCommandContext(provider, bot, update), update);
			});
			return;
		}

		let updateStopped = false;

		if (globalMessageListeners.size && update.type === 'message') {
			globalMessageListeners.forEach((fn) => {
				if (!updateStopped) {
					const retVal = fn(update);

					if (retVal && retVal.stop) {
						updateStopped = true;
					}
				}
			});
		}

		if (!updateStopped) {
			this.anyText.forEach(({handle}) => {
				handle(this.createCommandContext(provider, bot, update), update);
			});
		}
	}

	/** Вытягивание обновления */
	async pullUpdates(options?: Pick<BotUpdatesOptions, 'pollTime'>) {
		return Promise.all(
			this.botList.map(({bot, provider: messenger}) => this.getUpdates(messenger, bot, options)),
		).then((batches) => batches.flatMap((u) => u));
	}

	/** Добавление мета-команды (системной) */
	addMetaCommand(type: ChatMetaEvent['type'], handle: CommunicatorMetaCommandHandler): void;
	addMetaCommand(
		type: ChatMetaEvent['type'],
		description: string,
		handle: CommunicatorMetaCommandHandler,
	): void;

	addMetaCommand(
		type: ChatMetaEvent['type'],
		descriptionOrHandle: string | CommunicatorMetaCommandHandler,
		handle?: CommunicatorMetaCommandHandler,
	): void {
		this.metaCommands.push({
			type,
			handle: typeof descriptionOrHandle === 'string' ? handle! : descriptionOrHandle,
			description: typeof descriptionOrHandle === 'string' ? descriptionOrHandle : null,
		});
	}

	/** Добавить слушателя любого текст */
	addAnyListener(handle: CommunicatorAnyTextHandler): void;
	addAnyListener(description: string, handle: CommunicatorAnyTextHandler): void;
	addAnyListener(
		descriptionOrHandle: string | CommunicatorAnyTextHandler,
		handle?: CommunicatorAnyTextHandler,
	): void {
		this.anyText.push({
			handle: typeof descriptionOrHandle === 'string' ? handle! : descriptionOrHandle,
			description: typeof descriptionOrHandle === 'string' ? descriptionOrHandle : null,
		});
	}

	/** Добавление команды */
	addCommand(name: string, handle: CommunicatorCommandHandler): void;
	addCommand(name: string, description: string, handle: CommunicatorCommandHandler): void;
	addCommand(
		name: string,
		descriptionOrHandle: string | CommunicatorCommandHandler,
		handle?: CommunicatorCommandHandler,
	): void {
		this.commands.push({
			name,
			handle: typeof descriptionOrHandle === 'string' ? handle! : descriptionOrHandle,
			description: typeof descriptionOrHandle === 'string' ? descriptionOrHandle : null,
		});
	}

	getMetaCommandList() {
		return this.metaCommands.slice(0);
	}

	getCommandList() {
		return this.commands.slice(0);
	}

	static AUTHOR = process.env['GITLAB_USER_EMAIL'] || process.env['CI_EMAIL'] || 'author';

	/** Отправить сообщение */
	async sendMessage(
		to: typeof Communicator.AUTHOR | string | string[],
		body: string,
		init?: Partial<Message>,
	): Promise<CommunicatorSendMessageResult[]> {
		const toList = ([] as string[]).concat(to).map((val) => {
			if (val.toLowerCase() === Communicator.AUTHOR) {
				val = process.env['GITLAB_USER_EMAIL'] || process.env['CI_EMAIL'] || val;
			}

			const [provider, value] = val.split(':');

			return {
				value: value || provider,
				provider: value ? provider : this.defaultProvider,
			};
		});

		console.log('logs toList', toList)

		return await Promise.all(
			toList.map(async (to) => {
				const bot = this.botMap[to.provider];
				const response = {
					to,
					ok: false,
					bot: bot!,
					provider: to.provider,
					data: null as {id: string} | null,
					error: null as unknown,
				};

				if (!bot || !bot.isAvailable()) {
					response.error = `Provider '${to.provider}' not ${bot ? 'available' : 'defined'}`;
					return response;
				}

				const {data, error} = await bot.sendMessage({
					format: 'text',
					verbose: this.init.verbose,
					...init,
					to: to.value,
					body,
				});

				response.ok = !error && !!data?.id;
				response.data = data;
				response.error = error;

				return response;
			}),
		);
	}

	/** Редактировать сообщение */
	async editMessage(
		id: string,
		to: typeof Communicator.AUTHOR | string,
		patch: MessagePatch,
	): Promise<CommunicatorSendMessageResult> {
		let chatId = to;

		if (to.toLowerCase() === Communicator.AUTHOR) {
			chatId = process.env['GITLAB_USER_EMAIL'] || process.env['CI_EMAIL'] || to;
		}

		const [prov, val] = chatId.split(':');

		const value = val || prov;
		const provider = val ? prov : this.defaultProvider;

		const bot = this.botMap[provider];
		const response = {
			to: {
				value,
				provider,
			},
			ok: false,
			bot: bot!,
			provider,
			data: null as {id: string} | null,
			error: null as unknown,
		};

		if (!bot || !bot.isAvailable()) {
			response.error = `Provider '${provider}' not ${bot ? 'available' : 'defined'}`;
			return response;
		}

		const {data, error} = await bot.editMessage(id, value, patch);

		response.ok = !error && !!data?.id;
		response.data = data;
		response.error = error;

		return response;
	}
}
