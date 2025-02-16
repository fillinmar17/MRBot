import * as React from 'react';
import {useReactMessageInternal} from './Message';

export type KeyboardRowProps = {
	children: KeyboardButtonElement | KeyboardButtonElement[];
};
export type KeyboardElement = React.FunctionComponentElement<KeyboardProps>;
export type KeyboardRowElement = React.FunctionComponentElement<KeyboardRowProps>;
export type KeyboardProps = {
	children: KeyboardRowElement | (KeyboardButtonElement | KeyboardRowElement)[];
};


type InteractiveMessageContext = {
	notifyText?: string;
};


export type KeyboardButtonActionProps = {
	type?: 'primary' | 'attention';
	onClick: 'close' | ((ctx: InteractiveMessageContext) => void);
	value: string;
};

export type ClickedReactKeyboardButton = readonly [
	string, // [1] Namescape
	any, // [2] Initial Props
	any[], // [3] Hooks State
	number, // [4] Handler Index
];

export type KeyboardButtonProps = {
	id: string;
	value: string;
	type?: 'primary' | 'attention';
	onClick: (ctx: any) => void;
};

export type KeyboardElement = React.FunctionComponentElement<KeyboardProps>;
export type KeyboardButtonElement = React.FunctionComponentElement<KeyboardButtonProps>;

export const Keyboard = (props: KeyboardProps) => {
	const {keyboard, keyboardHandlers} = useReactMessageInternal();

	// Clear existing keyboard data
	keyboard.length = 0;
	keyboardHandlers.length = 0;

	// Process children to create keyboard layout
	React.Children.forEach(props.children, child => {
		if (React.isValidElement(child)) {
			if (child.type === Button) {
				// Add single button in new row
				keyboard.push([{
					name: child.props.value,
					text: child.props.value,
					type: child.props.type,
					data: JSON.stringify({
						id: child.props.id,
						handlerIndex: keyboardHandlers.length
					})
				}]);
				keyboardHandlers.push(child.props.onClick);
			}
		}
	});

	return null;
};

const Button: React.FC<KeyboardButtonProps> = () => null;

Keyboard.Button = Button;