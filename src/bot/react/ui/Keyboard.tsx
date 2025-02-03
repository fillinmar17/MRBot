import * as React from 'react';
import {useReactMessageInternal} from './Message';
import type {MessageKeyboardButtonData, MessageKeyboardButtonUrl} from '../../keyboard';

export type KeyboardRowProps = {
	children: KeyboardButtonElement | KeyboardButtonElement[];
};
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
	onClick?: (ctx: any) => void;
	url?: string;
};

export type KeyboardElement = React.FunctionComponentElement<KeyboardProps>;
export type KeyboardButtonElement = React.FunctionComponentElement<KeyboardButtonProps>;

export const Keyboard = (props: KeyboardProps) => {
	const {keyboard, keyboardHandlers} = useReactMessageInternal();

	keyboard.length = 0;
	keyboardHandlers.length = 0;

	// Process children to create keyboard layout
	React.Children.forEach(props.children, child => {
		if (React.isValidElement(child)) {
			if (child.type === Row) {
				// Create a new row array
				const rowButtons: (MessageKeyboardButtonData | MessageKeyboardButtonUrl)[] = [];
				
				// Process row children
				React.Children.forEach((child.props as KeyboardRowProps).children, button => {
					if (React.isValidElement<KeyboardButtonProps>(button) && button.type === Button) {
						if (button.props.url) {
							// Add URL button for inline keyboard
							rowButtons.push({
								name: button.props.id,
								text: button.props.value,
								url: button.props.url
							} as MessageKeyboardButtonUrl);
						} else {
							// Add callback button for inline keyboard
							rowButtons.push({
								name: button.props.id,
								text: button.props.value,
								data: JSON.stringify({
									id: button.props.id,
									handlerIndex: keyboardHandlers.length
								})
							} as MessageKeyboardButtonData);
							if (button.props.onClick) {
								keyboardHandlers.push(button.props.onClick);
							}
						}
					}
				});
				
				// Add the row to keyboard
				if (rowButtons.length > 0) {
					keyboard.push(rowButtons);
				}
			} else if (React.isValidElement<KeyboardButtonProps>(child) && child.type === Button) {
				if (child.props.url) {
					// Add URL button for inline keyboard
					keyboard.push([{
						name: child.props.id,
						text: child.props.value,
						url: child.props.url
					} as MessageKeyboardButtonUrl]);
				} else {
					// Add callback button for inline keyboard
					keyboard.push([{
						name: child.props.id,
						text: child.props.value,
						data: JSON.stringify({
							id: child.props.id,
							handlerIndex: keyboardHandlers.length
						})
					} as MessageKeyboardButtonData]);
					if (child.props.onClick) {
						keyboardHandlers.push(child.props.onClick);
					}
				}
			}
		}
	});

	return null;
};

const Button: React.FC<KeyboardButtonProps> = () => null;
const Row: React.FC<KeyboardRowProps> = () => null;

Keyboard.Button = Button;
Keyboard.Row = Row;