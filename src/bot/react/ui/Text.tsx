import * as React from 'react';

export type TextProps = {
	italic?: boolean;
	bold?: boolean;
	underline?: boolean;
	link?: string;
	code?: boolean;
	children: React.ReactNode;
};

export type TextElement = React.FunctionComponentElement<TextProps>;
export type ParagraphElement = React.FunctionComponentElement<TextProps>;
export type NewLineElement = React.FunctionComponentElement<any>;

export const Text: React.FC<TextProps> = (props) => {
	let children: React.ReactNode = props.children;

	if (props.underline) {
		children = <u>{children}</u>;
	}

	if (props.italic) {
		children = <i>{children}</i>;
	}

	if (props.bold) {
		children = <b>{children}</b>;
	}

	if (props.code) {
		children = <code>{children}</code>;
	}

	if (props.link) {
		children = <a href={props.link}>{children}</a>;
	}

	return <>{children}</>;
};

export const NewLine = () => {
	return <>{'\n'}</>;
};

export const Paragraph: React.FC<TextProps> = (props) => {
	return (
		<div>
			<Text {...props} />
			<NewLine />
		</div>
	);
};

export const Code = (props: Pick<TextProps, 'children'>) => {
	return <code>{props.children}</code>;
};

export const Blockquote = (props: Pick<TextProps, 'children'>) => {
	return (
		<>
			<blockquote>{props.children}</blockquote>
			<NewLine />
		</>
	);
};

export type LinkProps = TextProps & {
	url: string;
};

export const Link = (props: LinkProps) => {
	return (
		<a href={props.url}>
			<Text {...props} />
		</a>
	);
};

export type MentionProps = Omit<TextProps, 'children'> & {
	user: string;
};

export const Mention = (props: MentionProps) => {
	return <Text {...props}>@[{props.user}]</Text>;
};

Text.displayName = 'Text';
Link.displayName = 'Link';
Mention.displayName = 'Mention';
Code.displayName = 'Code';
Blockquote.displayName = 'Blockquote';
Paragraph.displayName = 'Paragraph';
NewLine.displayName = 'NewLine';
