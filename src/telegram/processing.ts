import type {
	Chat,
	ChatChangePhotoEvent,
	ChatMemberEvent,
	ChatMessageEvent,
	ChatPostEvent,
	ChatUpdate,
	ChatUser,
} from '../core/types';
import type {
	TelegramChatChannel,
	TelegramChatGroup,
	TelegramChatPrivate,
	TelegramUpdate,
	TelegramUpdateChannelPost,
	TelegramUpdateChatMember,
	TelegramUpdateMessage,
	TelegramUser,
} from './types';

function getUserName(raw: Pick<TelegramUser, 'first_name' | 'last_name'>) {
	return `${raw.first_name} ${raw.last_name || ''}`.trim();
}

function telegramUserToChatUser(raw: TelegramUser): ChatUser {
	return {
		id: `${raw.id}`,
		name: getUserName(raw),
		login: raw.username,
		isBot: raw.is_bot,
	};
}

function telegramChatToChat(raw: TelegramChatPrivate | TelegramChatGroup | TelegramChatChannel): Chat {
	return {
		id: `${raw.id}`,
		type: raw.type,
		title: 'title' in raw ? raw.title : getUserName(raw),
	};
}

function telegramMessageToChatUpdate(
	raw: TelegramUpdateMessage['message'],
): ChatChangePhotoEvent | ChatMessageEvent | ChatMemberEvent | null {
	const evt = {
		id: `${raw.message_id}`,
		date: new Date(raw.date * 1000),
		chat: telegramChatToChat(raw.chat),
		user: telegramUserToChatUser(raw.from),
	};

	if ('new_chat_photo' in raw) {
		return {
			...evt,
			original: raw,
			type: 'chat:photo',
		};
	}

	if ('text' in raw) {
		return {
			...evt,
			original: raw,
			type: 'message',
			body: raw.text,
			meta: {links: [], mentions: []},
			parts: null, // todo
			format: {},
		};
	}

	return {
		...evt,
		original: raw,
		type: 'new_chat_member' in raw || 'group_chat_created' in raw ? 'member:join' : 'member:left',
		members: [],
	};
}

function telegramChannelEventToChatUpdate(raw: TelegramUpdateChannelPost['channel_post']): ChatPostEvent {
	return {
		id: `${raw.message_id}`,
		original: raw,
		date: new Date(raw.date * 1000),
		type: 'post',
		chat: telegramChatToChat(raw.chat),
		body: raw.text,
		parts: null, // todo
	};
}

function telegramMyChatMemberToChatUpdate(raw: TelegramUpdateChatMember['my_chat_member']): ChatMemberEvent {
	const status = raw.new_chat_member.status;

	return {
		id: '',
		original: raw,
		date: new Date(raw.date * 1000),
		type: status === 'left' || status === 'kicked' ? 'member:left' : 'member:join',
		chat: telegramChatToChat(raw.chat),
		user: telegramUserToChatUser(raw.from),
		members: [],
	};
}

export function telegramUpdateToChatUpdate(raw: TelegramUpdate): ChatUpdate | null {
	if ('message' in raw) {
		return telegramMessageToChatUpdate(raw.message);
	}

	if ('channel_post' in raw) {
		return telegramChannelEventToChatUpdate(raw.channel_post);
	}

	if ('my_chat_member' in raw) {
		return telegramMyChatMemberToChatUpdate(raw.my_chat_member);
	}

	return null;
}
