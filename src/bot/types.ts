export type Flat<T> = {
	[K in keyof T]: T[K];
};

export type OptionalKeys<T, K extends keyof T> = Flat<Omit<T, K> & Partial<Pick<T, K>>>;

export type Chat = {
	id: string;
	title: string;
	type: 'private' | 'group' | 'channel';
};

export type ChatUser = {
	id: string;
	name: string;
	login: string;
	isBot: boolean;
};

export type ChatCommand = {
	type: '/' | '#';
	name: string;
	args: string[];
};

export type ChatUpdate =
	| ChatCommandEvent
	| ChatCallbackEvent
	| ChatPostEvent
	| ChatMessageEvent
	| ChatChangePhotoEvent
	| ChatMetaEvent;

export interface ChatEvent<T extends string> {
	id: string;
	type: T;
	date: Date;
	chat: Chat;
	original: unknown;
}

export type ChatMessageMeta = {
	links: string[];
	mentions: string[];
};

export type ChatMessagePart = ChatMessagePartMessage | ChatMessagePartFile | ChatMessagePartMention;

export type ChatMessagePartFile = {
	type: 'file';
	meta: undefined;
	body: undefined;
	file: {
		id: string;
		type: string;
	};
};

export type ChatMessagePartMention = {
	type: 'mention';
	meta: undefined;
	body: undefined;
	user: {
		id: string;
		firstName: string;
		lastName: string;
	};
};

export type ChatMessagePartMessage = {
	id: string;
	type: 'reply' | 'forward';
	date: Date;
	user: ChatUser | null;
	parts: ChatMessagePart[] | null;
	body: string;
	meta: ChatMessageMeta;
};

export interface ChatCallbackEvent extends ChatEvent<'callback'> {
	id: string;
	data: string;
	user: ChatUser;
	message: Required<Pick<ChatMessageEvent, 'id' | 'body' | 'format'>>;
	update_id: number;
}

export interface ChatCommandEvent extends ChatEvent<'command'> {
	raw: string;
	user: ChatUser | null;
	command: ChatCommand;
	parts: null | ChatMessagePart[];
}

export interface ChatPostEvent extends ChatEvent<'post'> {
	parts: null | ChatMessagePart[];
	body?: string;
}

export interface ChatMessageEvent extends ChatEvent<'message'> {
	user: ChatUser | null;
	parts: null | ChatMessagePart[];
	meta: ChatMessageMeta;
	format: any;
	body?: string;
}

export interface ChatChangePhotoEvent extends ChatEvent<'chat:photo'> {
	user: ChatUser;
}

export type ChatMetaEvent = ChatMemberEvent;

export interface ChatMemberEvent extends ChatEvent<'member:join' | 'member:left'> {
	user: ChatUser | null;
	members: ChatUser[];
}

export type ChatInfo = ChatUserInfo | ChatUserGroupOrChannelInfo;

export type ChatBaseInfo<T extends string> = {
	/** ID */
	id: string;

	/** Типа чата */
	type: T;

	/** Ия чата: (firstName + lastName) || nick для чата/канала title */
	name: string;

	/** Описание чата */
	description?: string;

	/** Ссылка на чат */
	inviteLink: string;

	/** public, для юзера true */
	public: boolean;

	/** Язык? */
	language?: string;
};

export type ChatUserGroupOrChannelInfo = ChatBaseInfo<'group' | 'channel'> & {
	rules?: string;
	joinModeration?: boolean;
};

export type ChatUserInfo = ChatBaseInfo<'user'> & {
	firstName?: string;
	lastName?: string;
	nick?: string;
	isBot?: boolean;
};
