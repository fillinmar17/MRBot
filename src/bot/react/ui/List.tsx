import * as React from 'react';

import {NewLine, TextProps} from './Text';

export type ListProps = {
	ordered?: boolean;
	children: ListElement | ListElement[];
};

export type ListElement = React.FunctionComponentElement<ListProps>;

export type ListItemProps = {
	children: TextProps['children'];
};

export const List = (props: ListProps) => {
	const ListTag = props.ordered ? 'ol' : 'ul';

	return (
		<div>
			<ListTag>{props.children}</ListTag>
			<NewLine />
		</div>
	);
};

List.Item = ((props) => {
	return <li>{props.children}</li>;
}) as React.FC<ListItemProps>;

List.displayName = 'List';
List.Item.displayName = 'List.Item';
