import * as React from 'react';

import {useReactMessage} from '../../ui/Message';

type SetStateFunction<T> = (prev: T) => T;

export const createReactMessageHooks = (values: any[]) => {
	let cursor = 0;

	return {
		__internal_resetHooks__() {
			cursor = 0;
			values.length = 0;
		},

		useValue<T>(initialValue: T): readonly [T, (patch: T | SetStateFunction<T>) => void] {
			const idx = cursor++;
			const ref = React.useRef(values[idx] ?? initialValue);
			const {forceUpdate} = useReactMessage();

			values[idx] = ref.current;
			console.log('useValue:', {value: ref.current, initial: initialValue, idx}, values);

			return [
				ref.current,
				(patch) => {
					if (typeof patch === 'function') {
						ref.current = (patch as SetStateFunction<T>)(ref.current);
					} else {
						ref.current = patch;
					}

					values[idx] = ref.current;
					forceUpdate();
				},
			];
		},
	};
};

export type ReactMessageHooks = Omit<ReturnType<typeof createReactMessageHooks>, '__internal_resetHooks__'>;
