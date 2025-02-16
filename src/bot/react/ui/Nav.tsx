import * as React from 'react';

import {Keyboard, KeyboardButtonActionProps, KeyboardButtonProps} from './Keyboard';
import {useReactMessageGroupContext} from './Message';

export type NavProps = {
	children: NavItemElement | NavItemElement[];
};

export type NavElement = React.FunctionComponentElement<NavProps>;
export type NavItemElement = React.FunctionComponentElement<NavItemProps>;

export type NavItemProps = {
	id: string;
	type?: KeyboardButtonProps['type'];
	value: string;
};

export const Nav = (props: NavProps) => {
	const ctx = useReactMessageGroupContext();
	if (!ctx) {
		throw new Error('Nav можно использовать только в Message.Group');
	}

	return (
		<Keyboard>
			{React.Children.map(props.children, (item, idx) => {
				const props = {...item.props} as KeyboardButtonActionProps & NavItemProps;

				if (props.id) {
					props.onClick = () => {
						if (props.id === Nav.BACK_ID) {
							ctx.back();
						} else {
							ctx.setActiveId(props.id);
						}
					};
				}

				return (
					<Keyboard.Row key={props.id || idx}>
						<Keyboard.Button {...props} />
					</Keyboard.Row>
				);
			})}
		</Keyboard>
	);
};

Nav.BACK_ID = '__BACK_ID__';

Nav.Item = ((props) => {
	return <li>{props.value}</li>;
}) as React.FC<NavItemProps>;

Nav.displayName = 'Nav';
// Nav.Back.displayName = 'Nav.Back';
Nav.Item.displayName = 'Nav.Item';
