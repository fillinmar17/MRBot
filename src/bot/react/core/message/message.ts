import {createOpenPromise} from 'o-promise';
import {createElement, FC} from 'react';

import type {CoreBot, Message} from '../../../bot';
import {Communicator} from '../../../communicator';
import type {MessageKeyboardButtons, MessageKeyboardContext} from '../../../keyboard';
import {Form as UIForm, InputText as UIInputText} from '../../ui/Form';
import {
	ClickedReactKeyboardButton,
	Keyboard as UIKeyboard,
	KeyboardButtonActionProps,
} from '../../ui/Keyboard';
import {List as UIList} from '../../ui/List';
import {Message as UIMessage, MessageContextProvider} from '../../ui/Message';
import {Nav as UINav} from '../../ui/Nav';
import {
	Blockquote as UIBlockquote,
	Code as UICode,
	Link as UILink,
	Mention as UIMention,
	NewLine as UINewLine,
	Paragraph as UIParagraph,
	Text as UIText,
} from '../../ui/Text';
import {Title as UITitle} from '../../ui/Title';
import {containerToString, render} from '../renderer';
import type {VirtualContainer} from '../renderer/host-config';
import {ErrorBoundary} from './error';
import {createReactMessageHooks, ReactMessageHooks} from './hooks';
import {withRetry} from './withRetry';

export type ReactMessageComponent<T> = FC<
	T &
		ReactMessageHooks & {
			ui: {
				Title: typeof UITitle;
				Paragraph: typeof UIParagraph;
				Link: typeof UILink;
				Mention: typeof UIMention;
				Text: typeof UIText;
				Code: typeof UICode;
				List: typeof UIList;
				Blockquote: typeof UIBlockquote;
				Message: typeof UIMessage;
				Nav: typeof UINav;
				Keyboard: typeof UIKeyboard;
				Form: typeof UIForm;
				InputText: typeof UIInputText;
				NewLine: typeof UINewLine;
			};
		}
>;

export type ReactMessageInit = {
	ns: string;
	/** ID Сообщения */
	id?: string;
	/** Куда отправить */
	to: string;
	/** ID сообщения на которое отвечаем */
	replyTo?: string;
	/** Бот используемый для отправки */
	bot: Pick<CoreBot, 'sendMessage' | 'editMessage' | 'deleteMessage'>;
	/** Инзачальные props компонента */
	initialProps: any;
	/** Минимальное время перед применением изменений */
	minApplyDelay?: number;
	/** Время жизни сообщения в памяти */
	ttl?: number;
	/** @internal Состояние хуков */
	hooksState: any[];
};

export type ReactMessageContext = {
	bot: ReactMessageInit['bot'];
	message: ReactMessage;
	forceUpdate: () => void;
} & ReactMessageHooks;

export type ReactMessageContextInternal = ReactMessageContext & {
	initialProps: any;
	keyboard: MessageKeyboardButtons[];
	keyboardHandlers: KeyboardButtonActionProps['onClick'][];
	hooksState: {current: any}[];
};

export class ReactMessage {
	static all = new Map<number, ReactMessage>();
	static components = new Map<string, ReactMessageComponent<any>>();

	static describe<T>(ns: string, component: ReactMessageComponent<T>) {
		ReactMessage.components.set(ns, component);

		console.log('react describe')

		return {
			send: async (
				to: string,
				initialProps: T,
				init: Partial<Pick<ReactMessageInit, 'bot' | 'minApplyDelay'>> = {},
				id?: string,
			) => {
				const message = new ReactMessage({
					ns,
					to,
					initialProps,
					hooksState: [],
					minApplyDelay: 1100,
					...init,
					id,
					bot: init.bot ?? Communicator.getDefault().getProvider('telegram')!,
				});

				console.log('logs message.context', message.context)

				return message.apply('force');
			},
		};
	}

	static async handleCallbackEvent(ctx: MessageKeyboardContext<ClickedReactKeyboardButton>) {
		const {
			button,
			message: {id},
			chat,
			bot,
		} = ctx;
		const [ns, initialProps, hooksState, handlerIdx] = button;
		console.log('logs ReactMessage.all', ReactMessage.all)
		const message =
			ReactMessage.all.get(Number(id)) ||
			new ReactMessage({
				id,
				ns,
				to: chat.id,
				initialProps,
				hooksState,
				bot,
			});

		console.log('[ReactMessage] handleCallbackEvent check:', message.readState, {
			id,
			ns,
			initialProps,
			hooksState,
		});

		if (!message.readState) {
			await message.apply('only-render');
		}

		const handler = message.context?.keyboardHandlers[handlerIdx];

		console.log('[ReactMessage] handleCallbackEvent exec:', button, handler);

		if (handler === 'close') {
			message.destroy(true);
		} else if (handler) {
			handler({});
		}

		setTimeout(() => {
			if (!message.applyLock) {
				message.apply();
			}
		}, 30);
	}

	private data: ReactMessageInit;
	private hostContainer: VirtualContainer | null;
	private openDisposed = createOpenPromise<boolean>();
	private applyId: ReturnType<typeof setTimeout> | undefined;
	private applyLock = false;
	private context: ReactMessageContextInternal | undefined;
	private hooks: ReturnType<typeof createReactMessageHooks> | undefined;
	private ttlId: ReturnType<typeof setTimeout>;

	public readState?: 'init' | 'render' | 'interactive' = undefined;
	public interactive = false;
	public destroyed = false;

	constructor(private init: ReactMessageInit) {
		this.data = {...init};
		this.hostContainer = {
			entries: [],
			onStart: () => {
				console.log('~'.repeat(15), 'onStart', this.readState, '~'.repeat(15));

				if (this.readState !== 'render') {
					this.hooks?.__internal_resetHooks__();
				}

				this.readState = 'interactive';
			},
			onUpdate: () => {
				this.apply();
				console.log('-'.repeat(15), 'onUpdate', '-'.repeat(15));
			},
		};

		console.log('[new] ReactMessage:',  JSON.stringify(init));

		this.ttlId = setTimeout(() => {
			this.destroy();
		}, init.ttl || 60 * 60 * 1000);
	}

	get id() {
		return this.data.id || '';
	}

	get ns() {
		return this.data.ns;
	}

	get chat() {
		return this.data.to;
	}

	async reposition() {
		const {id, to, bot} = this.data;

		if (id) {
			this.interactive = false;
			this.data.id = undefined;

			bot.deleteMessage(to, id);
			this.apply('force');
		}
	}

	private async render() {
		this.readState = 'render';

		this.hooks = createReactMessageHooks(this.init.hooksState);
		this.context = {
			...this.hooks,
			bot: this.init.bot,
			message: this,
			hooksState: this.init.hooksState,
			keyboard: [],
			keyboardHandlers: [],
			initialProps: this.init.initialProps,
			forceUpdate: () => {},
		};

		const component = ReactMessage.components.get(this.ns)!;

		console.log('[ReactMessage#render] ns:', {ns: this.ns, component});

		const element = createElement(
			ErrorBoundary,
			{},
			createElement(
				MessageContextProvider,
				{value: this.context},
				createElement(component, {
					...this.init.initialProps,
					...this.hooks,
					ui: {
						Title: UITitle,
						Paragraph: UIParagraph,
						Link: UILink,
						Mention: UIMention,
						Text: UIText,
						Code: UICode,
						List: UIList,
						Blockquote: UIBlockquote,
						Message: UIMessage,
						Nav: UINav,
						Keyboard: UIKeyboard,
						Form: UIForm,
						InputText: UIInputText,
						NewLine: UINewLine,
					},
				}),
			),
		);

		const renderedResult = await render(element, this.hostContainer!);
		console.log('logs renderedResult', renderedResult);
	}

	private async apply(mode?: 'force' | 'only-render') {

		const force = !!mode;

		if (this.destroyed || (!force && this.applyLock)) {
			return this;
		}

		this.applyLock = true;
		clearTimeout(this.applyId);

		if (!this.readState) {
			this.readState = 'init';
			await this.render();
		}

		console.log('logs apply data',this.data )
		const {id, to, bot, replyTo} = this.data;

		if (id) {
			const idNumber = Number(id);
			if (ReactMessage.all.get(idNumber) !== this) {
				ReactMessage.all.get(idNumber)?.destroy();
			}

			ReactMessage.all.set(idNumber, this);
		}

		this.applyId = setTimeout(
			async () => {
				if (this.destroyed || mode === 'only-render') {
					this.applyLock = false;
					return;
				}

				const msg: Message = {
					to,
					replyTo,
					format: 'html',
					body: containerToString(this.hostContainer!),
					keyboard: this.context?.keyboard,
				};

				console.log(
					`[${mode}]`,
					'react message:',
					msg.body,
					msg.keyboard?.flat().map((x: any) => [x.text, x.data]),
				);

				console.log('log msg', msg.keyboard)
				const result = await withRetry(() => bot.sendMessage(msg, id));


				if (result.data?.id) {
					console.log('logs before ReactMessage.all.set  result.data?.id:', result.data?.id)
					ReactMessage.all.set(Number(result.data?.id), this);
				}

				console.log('log result', result, 'ReactMessage.all', ReactMessage.all)

				if (!result.error) {
					this.data.id = result.data?.id;
					this.applyLock = false;
					this.interactive = true;
				}
			},
			!force && id ? this.init.minApplyDelay : 30,
		);

		return this;
	}

	get disposed() {
		return this.openDisposed.promise;
	}

	async destroy(remove?: boolean) {
		clearTimeout(this.ttlId);

		this.interactive = false;
		this.destroyed = true;

		ReactMessage.all.delete(Number(this.id));

		if (this.hostContainer) {
			render(null, this.hostContainer);

			this.hooks?.__internal_resetHooks__();
			this.hostContainer = null;

			if (remove) {
				await this.init.bot.deleteMessage(this.chat, this.id);
			}
		}

		this.openDisposed.resolve(true);
	}
}
