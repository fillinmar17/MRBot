import * as React from 'react';

import {NewLine, Paragraph, TextProps} from './Text';

export type TitleProps = TextProps;

export type TitltElement = React.FunctionComponentElement<TitleProps>;

export const Title = (props: TitleProps) => {
	return (
		<div>
			<Paragraph {...{bold: true, ...props}} />
			<NewLine />
		</div>
	);
};

Title.displayName = 'Title';
