export type VKEvent = VKNewMessageEvent | VKNewChatMembersEvent | VKLeftChatMembersEvent | VKCallbackEvent;

export type VKChatUser = {
	userId: string;
	nick?: string;
	firstName: string;
	lastName: string;
};

export type VKChat = VKChatPrivate | VKChatChannel;

export type VKChatPrivate = {
	chatId: string;
	type: 'private';
};

export type VKChatChannel = {
	chatId: string;
	title: string;
	type: 'channel';
};

export type VKNewMessagePartReply = {
	payload: {
		message: {
			from?: VKChatUser;
			msgId: string;
			parts?: VKNewMessagePart[];
			text: string;
			format?: VKMessageFormat;
			timestamp: number;
		};
	};
	type: 'reply';
};

export type VKNewMessagePartForward = {
	payload: {
		message: {
			from?: VKChatUser;
			msgId: string;
			parts?: VKNewMessagePart[];
			text: string;
			format?: VKMessageFormat;
			timestamp: number;
		};
	};
	type: 'forward';
};

export type VKNewMessagePartFile = {
	payload: {
		fileId: string;
		type: string;
	};
	type: 'file';
};

export type VKNewMessagePartMention = {
	payload: {
		firstName: string;
		lastName: string;
		userId: string;
	};
	type: 'mention';
};

export type VKNewMessagePart =
	| VKNewMessagePartReply
	| VKNewMessagePartForward
	| VKNewMessagePartFile
	| VKNewMessagePartMention;

type VKBaseEvent<Type extends string, Payload extends Record<string, unknown>> = {
	eventId: number;
	type: Type;
	payload: Payload & {
		chat: VKChat;
		msgId: string;
		timestamp: number;
	};
};

export type VKMessageFormat = {
	link?: {
		length: number;
		offset: number;
		url: string;
	}[];
	mention?: {
		length: number;
		offset: number;
	}[];
};

export type VKNewMessageEvent = VKBaseEvent<
	'newMessage',
	{
		from?: VKChatUser;
		text: string;
		format?: VKMessageFormat;
		parts?: VKNewMessagePart[];
	}
>;

export type VKCallbackEvent = VKBaseEvent<
	'callbackQuery',
	{
		queryId: string;
		callbackData: string;
		from: VKChatUser;
		message: VKNewMessageEvent['payload'];
	}
>;

export type VKNewChatMembersEvent = VKBaseEvent<
	'newChatMembers',
	{
		addedBy: VKChatUser;
		chat: VKChatChannel;
		newMembers: VKChatUser[];
	}
>;

export type VKLeftChatMembersEvent = VKBaseEvent<
	'leftChatMembers',
	{
		chat: VKChatChannel;
		leftMembers: VKChatUser[];
	}
>;

export type VKChatInfo =
	| {
			ok: true;
			type: 'private';
			firstName?: string;
			lastName?: string;
			nick?: string;
			about?: string;
			isBot?: boolean;
			language?: string;
	  }
	| {
			ok: true;
			type: 'group' | 'channel';
			title?: string;
			about?: string;
			rules?: string;
			inviteLink?: string;
			public: boolean;
			joinModeration?: boolean;
	  };
