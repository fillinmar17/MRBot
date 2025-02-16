/* eslint react/jsx-key:"off" */

import * as React from 'react';

import {Text} from './Text';
import {Title} from './Title';

it('Text', () => {
	expect([
		<Text>String</Text>,
		<Text>{12345}</Text>,
		<Text>Foo {12345}</Text>,
		<Text>
			Foo <Text link="https://ya.ru">link</Text>
		</Text>,
		<Text>
			test<Title>test</Title>
		</Text>,
	]);
});
