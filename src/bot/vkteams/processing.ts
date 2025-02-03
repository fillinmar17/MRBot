import type {Chat, ChatMessageMeta, ChatMessagePart, ChatUpdate, ChatUser} from '../bot/types';
import type {
	VKCallbackEvent,
	VKChat,
	VKChatUser,
	VKEvent,
	VKLeftChatMembersEvent,
	VKMessageFormat,
	VKNewChatMembersEvent,
	VKNewMessageEvent,
	VKNewMessagePart,
} from './types';

function getUserName(raw: Pick<VKChatUser, 'firstName' | 'lastName' | 'userId'>) {
	return `${raw.firstName} ${raw.lastName || ''}`.trim() || 'userId';
}

function vkUserToChatUser(raw: VKChatUser): ChatUser {
	const login = raw.nick || raw.userId;

	return {
		id: `${raw.userId}`,
		name: getUserName(raw),
		login,
		isBot: login.endsWith('bot'), // todo: hmmmm?????
	};
}

function vkChatToChat(chat: VKChat, user?: VKChatUser): Chat {
	return {
		id: chat.chatId,
		title: ('title' in chat && chat.title) || (user && vkUserToChatUser(user).name) || '<unknown>',
		type: chat.type,
	};
}

function vkTimestampToDate(value: number): Date {
	return new Date(value * 1000);
}

function chatUpdate(payload: VKEvent['payload']) {
	return {
		id: payload.msgId,
		date: vkTimestampToDate(payload.timestamp),
		chat: vkChatToChat(payload.chat, 'from' in payload ? payload.from : undefined),
	};
}

function vkFormatLinkToMeta({format, text}: {format?: VKMessageFormat; text?: string}): ChatMessageMeta {
	const mentions: string[] = [];

	text?.replace(/@\[([^\]]+)\]/g, (_, email) => {
		mentions.push(email);
		return _;
	});

	return {
		links: (format?.link || []).map(({url}) => url),
		mentions,
	};
}

function vkMessagePartsToChatMessageParts(parts?: VKNewMessagePart[]): null | ChatMessagePart[] {
	if (parts == null) {
		return null;
	}

	return parts
		.filter(({type}) => type === 'file' || type === 'forward' || type === 'reply' || type === 'mention')
		.map<ChatMessagePart>(({type, payload}) => {
			console.log('vkMessagePartsToChatMessageParts:', type, payload);

			if (type === 'file') {
				return {
					type,
					file: {
						id: payload.fileId,
						type: payload.type,
					},
				};
			}

			if (type === 'mention') {
				return {
					type,
					user: {
						id: payload.userId,
						firstName: payload.firstName,
						lastName: payload.lastName,
					},
				};
			}

			const {message} = payload;

			return {
				id: message.msgId,
				type,
				user: message.from ? vkUserToChatUser(message.from) : null,
				date: vkTimestampToDate(message.timestamp),
				meta: vkFormatLinkToMeta(message),
				parts: vkMessagePartsToChatMessageParts(message.parts),
				body: message.text,
			};
		});
}

function vkNewMessageEventToChatUpdate({payload}: VKNewMessageEvent): ChatUpdate {
	return {
		...chatUpdate(payload),
		original: payload,
		type: 'message',
		user: payload.from ? vkUserToChatUser(payload.from) : null,
		body: payload.text,
		format: payload.format,
		meta: vkFormatLinkToMeta(payload),
		parts: vkMessagePartsToChatMessageParts(payload.parts),
	};
}

function vkNewChatMembersToChatUpdate({payload}: VKNewChatMembersEvent): ChatUpdate {
	return {
		...chatUpdate(payload),
		original: payload,
		type: 'member:join',
		user: payload.addedBy ? vkUserToChatUser(payload.addedBy) : null,
		members: payload.newMembers.map(vkUserToChatUser),
	};
}

function vkLeftChatMembersToChatUpdate({payload}: VKLeftChatMembersEvent): ChatUpdate {
	return {
		...chatUpdate(payload),
		original: payload,
		type: 'member:left',
		user: null,
		members: payload.leftMembers as any[],
	};
}

function vkCallbackEventToChatUpdate({payload}: VKCallbackEvent): ChatUpdate {
	const {from, message, callbackData, queryId} = payload;

	return {
		id: queryId,
		type: 'callback',
		original: payload,
		date: new Date(),
		chat: vkChatToChat(message.chat),
		user: vkUserToChatUser(from),
		data: callbackData,
		message: {
			id: message.msgId,
			body: message.text,
			format: message.format!,
		},
	};
}

export function vkEventToChatUpdate(event: VKEvent): ChatUpdate | null {
	if (event.type === 'newChatMembers') {
		return vkNewChatMembersToChatUpdate(event);
	}

	if (event.type === 'leftChatMembers') {
		return vkLeftChatMembersToChatUpdate(event);
	}

	if (event.type === 'newMessage') {
		return vkNewMessageEventToChatUpdate(event);
	}

	if (event.type === 'callbackQuery') {
		return vkCallbackEventToChatUpdate(event);
	}

	return null;
}
