// import {jiraTextToMarkdown} from '@mail-core/jira/src/jira/text';
import {marked, Renderer} from 'marked';
import {createOpenPromise} from 'o-promise';

import type {CoreBot, Message, MessageFormat} from './bot';

export const __VERBOSE_FLAGS__ = {
	log: process.env['COMMUNICATOR_LOG'] === 'true',
};

/** @see https://github.com/type-challenges/type-challenges/issues/3721 */
type Split<S extends string, SEP extends string> = string extends S
	? string[]
	: S extends `${infer A}${SEP}${infer B}`
	? [A, ...(B extends '' ? [] : Split<B, SEP>)]
	: SEP extends ''
	? []
	: [S];

type BaseFormat = Extract<Message['format'], string>;

const PARSE_MODE_MAP: Record<BaseFormat, 'MarkdownV2' | 'HTML' | undefined> = {
	text: undefined,

	html: 'HTML',
	md2html: 'HTML',
	jira2html: 'HTML',

	markdown: 'MarkdownV2',
	jira2md: 'MarkdownV2',
};

const markedRenderer = new Renderer();

markedRenderer.link = function (href, title, text) {
	if (!href || href.startsWith('mailto:')) {
		return text;
	}

	return `<a href="${href}"${title ? ` title="${title}"` : ``}>${text}</a>`;
};

export function removeIndent(str = '') {
	const match = str.match(/^(?:\s*\n+)?([ \t]+)/);

	if (!match) {
		return str.trim();
	}

	const reRemove = new RegExp(`^[ \\t]{0,${match[1].length}}`);

	return str
		.trim()
		.split(/\n/)
		.map((line) => line.replace(reRemove, ''))
		.join('\n');
}

export function parseConfigValue(value?: string) {
	return value && value.startsWith('$') ? process.env[value.slice(1).trim()] : value;
}

export function prepareMessage(
	body: string,
	{format: originFormat, icon}: Partial<Message> = {},
): {body: string} & (
	| {format: MessageFormat; parseMode: undefined}
	| {format: undefined; parseMode: 'MarkdownV2' | 'HTML' | undefined}
) {
	if (originFormat && typeof originFormat !== 'string') {
		return {body, format: originFormat, parseMode: undefined};
	}

	const format = originFormat || 'markdown';
	const slicedFormat = (format.split('2') as Split<BaseFormat, '2'>[number][]).map((f) =>
		f === 'markdown' ? 'md' : f,
	);
	body = removeIndent(body);

	// if (slicedFormat.includes('jira')) {
	// 	body = jiraTextToMarkdown(body);
	// }

	if (format === 'jira2html' || slicedFormat.includes('md')) {
		body = body
			.replace(/^(>i|i>) /gm, '> ℹ️ ')
			.replace(/^(!>|>!) /gm, '> ⚠️')
			.replace(/^(\?>|>\?) /gm, '> ❔');

		if (slicedFormat[slicedFormat.length - 1] === 'md') {
			body = body
				/**
				 * @todo пожаловаться в VkTeams за паленый парсер Markdown
				 */
				.replace(/\*\*/g, '*')
				/**
				 * Все специальные символы, которые не являются обозначением начала или конца стиля,
				 * должны быть экранированы с помощью обратного слеша "\".
				 * @link https://teams.vk.com/botapi/tutorial/?lang=ru#Format_Markdown
				 */
				.replace(/(?<=\w)[*_~](?=\w)/g, '\\$&')
				.replace(/(?<=\s)[*_~](?=\s)/g, '\\$&')
				/**
				 * Не поддерживают unordered lists со "*"
				 * @link https://www.markdownguide.org/basic-syntax/#unordered-lists
				 */
				.replace(/(?<=^\s*)\\?[*+](?=\s)/gm, '-')
				/**
				 * Не поддерживают Heading
				 */
				.replace(/^#+\s+(.*)/gm, '*$1*');
		}
	}

	if (slicedFormat.includes('html')) {
		if (format === 'jira2html' || format === 'md2html') {
			body = body
				.replace(/</g, '&lt;')
				.replace(/>/g, (_, i, raw) => (!i || raw[i - 1] === '\n' ? '>' : '&gt;'));

			body = marked(body, {
				sanitize: false,
				smartypants: true,
				xhtml: false,
				mangle: false,
				renderer: markedRenderer,
			});
		}

		body = body
			.replace(/<p>|<br\/?>/g, '\n')
			.replace(/<\/p>/g, '')
			.replace(/&quot;/g, '"')
			.replace(/<(\/?)(hr)>/g, '—'.repeat(10))
			.replace(/(<[^a][a-z\d]+)[^>]*/g, '$1')
			.replace(/<blockquote>\n+/g, '\n<blockquote>')
			.replace(/\n\n+<blockquote>/g, '\n<blockquote>')
			.replace(/<\/blockquote>\n\n+/g, '</blockquote>\n\n')
			.replace(/<pre><code>/g, '<pre>')
			.replace(/<\/code><\/pre>/g, '</pre>')
			.trim();
	}

	return {
		format: undefined,
		body: icon ? `${icon} ${body}` : body,
		parseMode: PARSE_MODE_MAP[format],
	};
}

export type CommunicatorBotInteractiveMessageEnv = {
	bot: CoreBot;
	tick: number;
	startTime: number;
	elapsedTime: number;
	message?: Message;
	stop: () => void;
};

type CommunicatorBotInteractiveWorker = (
	env: CommunicatorBotInteractiveMessageEnv,
) => Promise<Message | undefined>;

type CommunicatorBotInteractiveMessageText = {
	id?: string | undefined;
	setText: (value: string) => void;
	stop: (body?: string, init?: Partial<Message>) => Promise<void>;
	stopped: Promise<boolean>;
};

type CommunicatorBotInteractiveMessageWorker = {
	id?: string | undefined;
	setText: (value: string) => void;
	stop: (body?: string) => Promise<void>;
	stopped: Promise<boolean>;
};

/** Создать сообщение «процесса» */
function createCommunicatorInteractiveMessage(
	bot: CoreBot,
	messageOrWorker?: (Message & {id?: string}) | CommunicatorBotInteractiveWorker,
): CommunicatorBotInteractiveMessageText | CommunicatorBotInteractiveMessageWorker {
	const startTime = Date.now();
	const nextText: string[] = [];
	const initialMessage = typeof messageOrWorker === 'function' ? undefined : messageOrWorker;
	const worker =
		typeof messageOrWorker === 'function'
			? messageOrWorker
			: async ({message = initialMessage}) => {
					return {
						...message!,
						body: nextText.shift() || message!.body,
					};
			  };
	let active = true;
	let lock = Promise.resolve(true);
	let lastMessage: Message | undefined;
	let id: string | undefined = initialMessage?.id;
	let tick = 0;
	let pid: ReturnType<typeof setTimeout> | undefined;
	const [stopped, stoppedResolve] = createOpenPromise<boolean>();

	const stop = async (body?: string, init?: Partial<Message>) => {
		active = false;
		clearTimeout(pid!);

		await lock.then(async () => {
			if (id && body && lastMessage) {
				await bot.editMessage(id, lastMessage.to, {
					...lastMessage,
					...init,
					body,
				});
			}

			stoppedResolve(true);
		});
	};

	const setText = (value: string) => {
		nextText.push(value);
	};

	const nextTick = () => {
		lock = lock.then(async () => {
			if (!active) {
				return true;
			}

			const message = await worker({
				bot,
				tick,
				startTime,
				elapsedTime: Date.now() - startTime,
				message: lastMessage,
				stop,
			});

			if (!message) {
				return true;
			}

			if (!id) {
				const {data} = await bot.sendMessage(message);
				id = data?.id;
			} else if (message.body !== lastMessage?.body) {
				await bot.editMessage(id, message.to, message);
			}

			tick++;
			lastMessage = message;
			pid = setTimeout(nextTick, 1500);

			return true;
		});
	};

	nextTick();

	return {
		get id() {
			return id;
		},
		setText,
		stop,
		stopped,
	};
}

export {createCommunicatorInteractiveMessage};

export type RetryInit<Result> = {
	max: number;
	timeout: number;
	executer: () => Result;
	onError: (err: unknown, attempt: number) => void;
};

export const retry = async <Result>({
	max,
	timeout,
	executer,
	onError,
}: RetryInit<Result>): Promise<Result> => {
	let error: unknown;

	for (let attempt = 0; attempt <= max; attempt++) {
		try {
			return await executer();
		} catch (err) {
			error = err;
			onError(err, attempt);
			await new Promise((resolve) => setTimeout(resolve, timeout));
		}
	}

	throw error || new Error(`Max retries (${max + 1})`);
};

export const once = <T extends any[]>(func: (...args: T) => void) => {
	let was = false;
	return (...args: T) => {
		if (was) {
			return;
		}
		was = true;
		return func(...args);
	};
};

/**
 * Создает инстанс один раз и возвращает геттер инстанса
 * @param fabric фабрика создания инстанса
 * @returns геттер на инстанс
 */
export const lazyInit = <Value, Args extends any[] = []>(fabric: (...args: Args) => Value) => {
	// eslint-disable-next-line init-declarations
	let value: Value;
	const init = once<Args>((...args) => {
		value = fabric(...args);
	});
	return (...args: Args) => {
		init(...args);
		return value;
	};
};
