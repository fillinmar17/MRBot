import * as React from 'react';

import {useReactMessageInternal} from './Message';

export type KeyboardProps = {
	children: KeyboardRowElement | (KeyboardButtonElement | KeyboardRowElement)[];
};

export type KeyboardRowProps = {
	children: KeyboardButtonElement | KeyboardButtonElement[];
};

type InteractiveMessageContext = {
	notifyText?: string;
};

export type KeyboardButtonProps = KeyboardButtonActionProps | KeyboardButtonUrlProps;

export type KeyboardButtonActionProps = {
	type?: 'primary' | 'attention';
	onClick: 'close' | ((ctx: InteractiveMessageContext) => void);
	value: string;
};

export type KeyboardButtonUrlProps = {
	name?: string;
	type?: 'primary' | 'attention';
	url: string;
	value: string;
};

export type KeyboardElement = React.FunctionComponentElement<KeyboardProps>;
export type KeyboardRowElement = React.FunctionComponentElement<KeyboardRowProps>;
export type KeyboardButtonElement = React.FunctionComponentElement<KeyboardButtonProps>;

export const Keyboard = (props: KeyboardProps) => {
	const {keyboard, keyboardHandlers} = useReactMessageInternal();

	keyboard.length = 0;
	keyboardHandlers.length = 0;

	return <div>{React.Children.toArray(props.children)}</div>;
};

// const toText = ({children}: KeyboardButtonProps) => {
// 	return Array.isArray(children) ? children.join('') : `${children}`;
// };

const Row: React.FC<KeyboardRowProps> = (props: KeyboardRowProps) => {
	const {keyboard} = useReactMessageInternal();

	keyboard.push([]);

	return <div>{React.Children.toArray(props.children)}</div>;
};

export type ClickedReactKeyboardButton = readonly [
	string, // [1] Namescape
	any, // [2] Initial Props
	any[], // [3] Hooks State
	number, // [4] Handler Index
];

/** Компонент кнопки */
const Button: React.FC<KeyboardButtonProps> = (props) => {
	const {keyboard, hooksState, keyboardHandlers, initialProps, message} = useReactMessageInternal();
	let row = keyboard.length - 1;

	if (row === -1) {
		// Автоматически создаем Row
		row = 0;
		keyboard.push([]);
	}

	if ('url' in props) {
		keyboard[row].push({
			text: props.value,
			url: props.url,
		});
	} else {
		keyboard[row].push({
			name: undefined as any,
			text: props.value,
			type: props.type,
			data: [message.ns, initialProps, hooksState, keyboardHandlers.push(props.onClick) - 1],
		});
	}

	return <div key={`${props.value}`} />;
};

Keyboard.displayName = 'Keyboard';

Keyboard.Row = Row;
Keyboard.Row.displayName = 'Keyboard.Row';

Keyboard.Button = Button;
Keyboard.Button.displayName = 'Keyboard.Button';
