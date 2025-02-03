import * as React from 'react';

import type {ReactMessageContext, ReactMessageContextInternal} from '../core/message/message';
import type {TextProps} from './Text';
import {Title} from './Title';

/** Core-конекст для работы с BotAPI */
const MessageContext = React.createContext<ReactMessageContext>({} as any);

export type MessageContextProviderProps = {
	value: ReactMessageContext;
	children?: React.ReactNode;
};

export const MessageContextProvider: React.FC<MessageContextProviderProps> = ({value, children}) => {
	const [, forceUpdate] = React.useReducer((rev) => rev + 1, 0);
	return <MessageContext.Provider value={{...value, forceUpdate}}>{children}</MessageContext.Provider>;
};

/** Использование Core-контекста */
export const useReactMessage = (): ReactMessageContext => {
	return React.useContext(MessageContext);
};

/** Internal Core-контекста */
export const useReactMessageInternal = (): ReactMessageContextInternal => {
	return React.useContext(MessageContext) as any;
};

/** Контекст групповых сообщений */
const MessageGroupContext = React.createContext<null | Readonly<{
	activeId: string;
	history: string[];
	setActiveId: (id: string) => void;
	back: () => void;
}>>(null);

/** Использование Группового-контекста */
export const useReactMessageGroupContext = () => {
	return React.useContext(MessageGroupContext)!;
};

/** Свойсва сообщения */
export type MessageProps = {
	id?: string;
	title?: TextProps['children'];
	children: React.ReactNode;
};

/** Основной контекйнер сообщения */
export const Message = (props: MessageProps) => {
	const group = useReactMessageGroupContext();
	if (group && group.activeId !== props.id) {
		return <div />;
	}

	return (
		<div>
			{props.title && <Title>{props.title}</Title>}
			{props.children}
		</div>
	);
};

Message.displayName = 'Message';

/** Свойства группы сообщений */
export type MessageGroupProps = {
	initialId: string;
	title?: TextProps['children'];
	children: React.ReactNode;
};

const useMessageGroupContextValue = (activeId: string) => {
	const {useValue} = useReactMessage();
	const [groupState, setGroupState] = useValue([activeId]);
	const setActiveId = (id: string) => {
		setGroupState((state) => {
			if (state[0] === id) {
				return state;
			}

			return [id, ...state];
		});
	};
	const back = () => {
		setGroupState((state) => {
			if (state.length === 1) {
				return state;
			}

			return state.slice(1);
		});
	};

	return {
		groupState: Array.isArray(groupState) ? groupState : [activeId],
		setActiveId,
		back,
	};
};

/** Группа сообщений */
const Group: React.FC<MessageGroupProps> = (props) => {
	const raw = useMessageGroupContextValue(props.initialId);
	const ctx = {
		activeId: raw.groupState[0],
		history: raw.groupState.slice(1),
		setActiveId: raw.setActiveId,
		back: raw.back,
	};

	return (
		<MessageGroupContext.Provider value={ctx}>
			{props.title && <Title>{props.title}</Title>}
			{props.children}
		</MessageGroupContext.Provider>
	);
};

Group.displayName = 'Message.Group';
Message.Group = Group;
