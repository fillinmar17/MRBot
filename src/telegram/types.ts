export type TelegramResponse<R> = {
	ok: boolean;
	result: R;
};

export type TelegramUpdate =
	// Updates
	TelegramUpdateMessage | TelegramUpdateChannelPost | TelegramUpdateChatMember;

export type TelegramUpdateMessage = {
	update_id: number;
	message:
		| TelegramUpdateMessageText
		| TelegramUpdateMessageGroupChatCreated
		| TelegramUpdateMessageNewChatPhoto
		| TelegramUpdateMessageLeftChatMember
		| TelegramUpdateMessageNewChatMember;
};

export type TelegramUpdateMessageText = {
	date: number;
	message_id: number;
	from: TelegramUser;
	chat: TelegramChatPrivate;
	text: string;
	entities: TelegramUpdateEntry[];
};

export type TelegramUpdateMessageGroupChatCreated = {
	date: number;
	message_id: number;
	from: TelegramUser;
	chat: TelegramChatGroup;
	group_chat_created: true;
};

export type TelegramUpdateMessageNewChatPhoto = {
	date: number;
	message_id: number;
	from: TelegramUser;
	chat: TelegramChatGroup;
	new_chat_photo: unknown[];
};

export type TelegramUpdateMessageNewChatMember = {
	date: number;
	message_id: number;
	from: TelegramUser;
	chat: TelegramChatGroup;
	new_chat_participant: TelegramUser;
	new_chat_member: TelegramUser;
};

export type TelegramUpdateMessageLeftChatMember = {
	date: number;
	message_id: number;
	from: TelegramUser;
	chat: TelegramChatGroup;
	left_chat_participant: TelegramUser;
	left_chat_member: TelegramUser;
};

export type TelegramUpdateChannelPost = {
	update_id: number;
	channel_post: {
		date: number;
		message_id: number;
		from: TelegramUser;
		sender_chat: TelegramChatChannel;
		chat: TelegramChatChannel;
		text: string;
		entities: TelegramUpdateEntry[];
	};
};

export type TelegramChatMemberStatus = TelegramChatMemberLeft | TelegramChatMemberAdmin;

export type TelegramChatMemberLeft = {
	user: TelegramUser;
	status: 'left' | 'kicked';
};

export type TelegramChatMemberAdmin = {
	user: TelegramChatChannel;
	status: 'administrator';
	can_be_edited: boolean;
	can_manage_chat: boolean;
	can_change_info: boolean;
	can_post_messages: boolean;
	can_edit_messages: boolean;
	can_delete_messages: boolean;
	can_invite_users: boolean;
	can_restrict_members: boolean;
	can_promote_members: boolean;
	can_manage_voice_chats: boolean;
	is_anonymous: boolean;
};

export type TelegramUpdateChatMember = {
	update_id: number;
	my_chat_member: {
		date: number;
		from: TelegramUser;
		chat: TelegramChatChannel;
		old_chat_member: TelegramChatMemberStatus;
		new_chat_member: TelegramChatMemberStatus;
	};
};

export type TelegramUser = {
	id: number;
	is_bot: boolean;
	username: string;
	first_name: string;
	last_name?: string;
	language_code: string;
};

export type TelegramChatPrivate = {
	id: number;
	first_name: string;
	last_name?: string;
	username: string;
	type: 'private';
};

export type TelegramChatGroup = {
	id: number;
	title: string;
	type: 'group';
	all_members_are_administrators: boolean;
};

export type TelegramChatChannel = {
	id: number;
	title: string;
	type: 'channel';
};

export type TelegramUpdateEntry = unknown;
