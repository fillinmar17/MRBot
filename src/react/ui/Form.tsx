import * as React from 'react';

import {Communicator} from '../../bot/communicator';
import type {ChatMessageEvent} from '../../bot/types';
import {useReactMessage} from './Message';
import {Blockquote, NewLine, Paragraph, Text, TextProps} from './Text';

export type InputTextProps = {
	children: TextProps['children'];
	onInput: (evt: ChatMessageEvent) => void;
};

export type InputTextElement = React.FunctionComponentElement<InputTextProps>;

export const useInputText = (onInput: (evt: ChatMessageEvent) => void) => {
	const {message} = useReactMessage();

	React.useEffect(() => {
		console.log('chat:', message.chat);
		const listener = (evt: ChatMessageEvent) => {
			if (evt.chat.id === message.chat) {
				try {
					console.log('InputText.onInput:', message.chat, message.id, evt.body);
					unsubscribe();
					onInput(evt);
					message.reposition();
				} catch (err) {
					console.error('err:', err);
				}

				return {stop: true};
			}

			return {stop: false};
		};

		const unsubscribe = () => {
			console.log('InputText.unreg:', message.id, message.chat);
			Communicator.removeGlobalMessageListener(listener);
		};

		console.log('InputText.reg:', message.id, message.chat);
		Communicator.addGlobalMessageListener(listener);

		return unsubscribe;
	}, [message, onInput]);
};

export const InputText = (props: InputTextProps) => {
	useInputText(props.onInput);
	return <Paragraph>{props.children}</Paragraph>;
};

type FormData = Record<string, string | undefined>;

export type FormProps<T extends FormData> = {
	initialData: T;
	children: FormItemElement | FormItemElement[];
};

export const Form = <T extends FormData>(props: FormProps<T>) => {
	const {useValue} = useReactMessage();
	const [data, setData] = useValue({...props.initialData});
	const [cursor, setCursor] = useValue('');
	const items = React.Children.toArray(props.children).filter((el) =>
		React.isValidElement<FormItemElement>(el),
	) as FormItemElement[];
	let hideNext = false;

	console.log('cursor:', cursor);

	useInputText(({body}) => {
		items.forEach(({props}, idx) => {
			if (props.name === cursor || (!idx && cursor === '')) {
				setData((data) => ({
					...data,
					[props.name]: body,
				}));

				setCursor(items[idx + 1].props.name);
			}
		});
	});

	return (
		<>
			{items.map(({props: {name, label, children}}, idx) => {
				if (hideNext) {
					return <div key={idx} />;
				}

				if (cursor === '' || cursor === name) {
					hideNext = true;
				}

				return (
					<div key={(name as string) || idx}>
						{hideNext ? (
							<Paragraph>❓ {children}</Paragraph>
						) : (
							<>
								<Paragraph>{label || children}</Paragraph>
								<Blockquote>{data[name] || <Text italic>(неопределенно)</Text>}</Blockquote>
								<NewLine />
							</>
						)}
					</div>
				);
			})}
		</>
	);
};

export type FormItemProps = {
	name: string;
	label?: string;
	children: InputTextProps['children'];
};
type FormItemElement = React.FunctionComponentElement<FormItemProps>;

const FormItem = (props: FormItemProps) => {
	return <>{props.children}</>;
};

Form.displayName = 'Form';
Form.Item = FormItem;
FormItem.displayName = 'Form.Item';
InputText.displayName = 'InputText';
