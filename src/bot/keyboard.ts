import {ReactMessage} from './react/core/message/message';
import type {CoreBot, Message, MessageSendResult} from './bot';
import type {Communicator} from './communicator';
import type {Chat, ChatCallbackEvent, ChatUser} from './types';
import {ClickedReactKeyboardButton} from "../bot/react/ui/Keyboard";

export type MessageKeyboardButtons = Array<MessageKeyboardButtonData | MessageKeyboardButtonUrl>;

type ButtonBaseData = {
	type?: 'primary' | 'attention';
	text?: string;
};

export type MessageKeyboardButtonData = ButtonBaseData & {
	name: string;
	data?: unknown;
};

export type MessageKeyboardButtonUrl = ButtonBaseData & {
	url: string;
};

export type MessageKeyboardLayout = {
	[name: string]: (...args: any[]) => MessageKeyboardButtons[];
};

export type MessageKeyboardInit<Layout extends MessageKeyboardLayout> = {
	id?: string;
	layout: Layout;
	handle: (ctx: MessageKeyboardContext<ClickedKeyboardButton>, button: ClickedKeyboardButton) => void;
};

let nextId = 0;

export type ClickedKeyboardButton = {
	kid: string;
	name: string;
	data: unknown;
};

export class MessageKeyboardContext<T> {
	/** Callback ID */
	readonly id: string;
	readonly chat: Chat;
	readonly user: ChatUser;
	readonly message: ChatCallbackEvent['message'];
	readonly originalMessage: ChatCallbackEvent['original'];

	constructor(readonly bot: CoreBot, evt: ChatCallbackEvent, readonly button: Readonly<T>) {
		this.id = evt.id;
		this.chat = evt.chat;
		this.user = evt.user;
		this.message = evt.message;
		this.originalMessage = evt.original;
	}

	public async answer(notifyText?: string | null, keyboard?: MessageKeyboardButtons[] | null) {
		const {bot, chat, message} = this;

		if (notifyText !== null) {
			await bot.sendCallbackResponse(this.id, notifyText);
		}

		if (keyboard !== undefined) {
			await bot.editMessage(message.id, chat.id, {
				body: message.body,
				format: message.format,
				keyboard: keyboard !== null ? keyboard : undefined,
			});
		}
	}

	public async reply(body: string, init: Partial<Pick<Message, 'replyTo' | 'keyboard' | 'format'>> = {}) {
		console.log('logs reply')
		return await this.bot.sendMessage({
			format: 'text',
			...init,
			to: this.chat.id,
			replyTo: init.replyTo || this.message.id,
			body,
		});
	}

	public send(init: Message): Promise<MessageSendResult>;
	public send(body: string, init?: Partial<Message>): Promise<MessageSendResult>;
	public send(initOrBody: string | Message, init?: Partial<Message>): Promise<MessageSendResult> {
		console.log('logs send keyboard')
		const body = typeof initOrBody === 'string' ? initOrBody : initOrBody.body;

		return this.bot.sendMessage({
			to: this.chat.id,
			format: 'md2html',
			body,
			...(typeof initOrBody === 'string' ? init : initOrBody),
		});
	}

	public edit(body: string, init?: Partial<Message>) {
		console.log('logs edit keyboard')
		return this.bot.editMessage(this.message.id, this.chat.id, {
			format: 'md2html',
			body,
			...init,
		});
	}

	public async delete(notifyText?: string, showAlert?: boolean, url?: string) {
		if (notifyText) {
			await this.bot.sendCallbackResponse(this.id, notifyText, showAlert, url);
		}

		return this.bot.deleteMessage(this.chat.id, this.message.id);
	}
}

const keyboards = new Map<string, MessageKeyboard<any>>();

const prepareKeyboardRows = (kid: string, rows: MessageKeyboardButtons[]) => {
	console.log('prepareKeyboardRows:', kid, rows);

	return rows.map((buttons) =>
		buttons.map((button) => {
			const text = button.text || ('name' in button ? button.name : '<unname>');

			if ('url' in button) {
				return {
					...button,
					text,
				};
			}

			return {
				...button,
				text,
				data: {
					...button,
					kid,
					text,
				},
			};
		}),
	);
};

export class MessageKeyboard<Layout extends MessageKeyboardLayout> {
	readonly id;
	readonly layout: Layout;

	static handleCallbackEvent = async (
		_communicator: Communicator,
		bot: CoreBot,
		evt: ChatCallbackEvent,
	) => {
		console.log('handleKeyboardCallbackEvent:', evt);

		const callbackData: ClickedKeyboardButton | ClickedReactKeyboardButton = JSON.parse(evt.data);
		console.log('logs callbackData', callbackData)
		if ('id' in callbackData && 'handlerIndex' in callbackData) {
			console.log('logs ReactMessage.all.keys', ReactMessage.all.keys())
			const message = ReactMessage.all.get(Number(evt.id));
			if (!message) {
				console.log('Message not found')
				// throw new Error('Message not found');
				return;
			}

			const handler = message.context?.keyboardHandlers[callbackData.handlerIndex];
			console.log('logs handler found', !!handler)
			if (handler) {
				await handler(evt);
				return;
			}
		}

		if (Array.isArray(callbackData)) {
			ReactMessage.handleCallbackEvent(
				new MessageKeyboardContext<ClickedReactKeyboardButton>(
					bot,
					evt,
					callbackData as ClickedReactKeyboardButton,
				),
			);
			return;
		}
	};

	constructor(private init: MessageKeyboardInit<Layout>) {
		this.id = `${init.id || ++nextId}`;
		this.layout = Object.entries(init.layout).reduce((layout, [key, rows]) => {
			layout[key] = (...args: any[]) => prepareKeyboardRows(this.id, (rows as any)(...args));
			return layout;
		}, {} as any);

		keyboards.set(this.id, this);
	}

	private handle(ctx: MessageKeyboardContext<ClickedKeyboardButton>, button: ClickedKeyboardButton) {
		console.log('handle keyboard:', button, 'ctx', ctx, 'this', this);
		this.init.handle.call(this, ctx, button);
	}
}
