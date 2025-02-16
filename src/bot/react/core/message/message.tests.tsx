import * as React from 'react';

import {useReactMessage} from '../../ui/Message';
import {ReactMessage} from './message';

describe('ReactMessage', () => {
	const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

	const MyDate = () => {
		const {useValue} = useReactMessage();
		const [value] = useValue('2023');
		return <>{`${value}`}</>;
	};

	const MyBool = () => {
		const {useValue} = useReactMessage();
		const [value] = useValue(false);
		return <>{`${value}`}</>;
	};

	const unitTest = ReactMessage.describe<{
		debug: (type: any, setType: any) => void;
	}>('unit/test', ({useValue, debug}) => {
		const [type, setType] = useValue('date');
		debug(type, setType);
		console.log('type:', type);
		return type === 'date' ? <MyDate /> : <MyBool />;
	});

	it('send', async () => {
		const log: any[] = [];
		const debugSetType = {current: null as any};
		const _msg = await unitTest.send(
			'test',
			{
				debug(_, setType) {
					debugSetType.current = setType;
				},
			},
			{
				minApplyDelay: 1,
				bot: {
					async sendMessage(message) {
						log.push(['send', message.body]);

						return {
							error: null,
							data: {id: '1'},
						};
					},

					async editMessage(id, _, message) {
						log.push(['edit', message.body]);

						return {
							error: null,
							data: {id},
						} as any;
					},

					async deleteMessage() {
						return {} as any;
					},
				},
			},
		);

		await sleep(30);
		expect(log).toEqual([['send', '2023']]);

		debugSetType.current('bool');
		await sleep(30);

		expect(log).toEqual([
			['send', '2023'],
			['edit', 'false'],
		]);
	});
});
