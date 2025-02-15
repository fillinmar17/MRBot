import * as React from 'react';

import {render} from '.';
// import type {VirtualInstance, VirtualTextInstance} from './host-config';

const act = (fn: () => void) => {
	fn();
	return new Promise((resolve) => setTimeout(resolve, 16));
};

const App = () => {
	const [counter, setCounter] = React.useState(0);
	const handleClick = React.useCallback(() => {
		setCounter((val) => val + 1);
	}, [setCounter]);

	return <button onClick={handleClick}>Counter: {counter}</button>;
};

it('renderer', async () => {
	const result = await render(<App />, {
		entries: [],
	});

	await act(() => {
		(result.entries as any)[0].props.onClick();
	});
});
