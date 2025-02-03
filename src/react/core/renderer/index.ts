/* eslint new-cap:"off" */

import type {ReactNode} from 'react';
import Reconciler from 'react-reconciler';

import {hostConfig, VirtualContainer, VirtualInstance, VirtualTextInstance} from './host-config';

const reconcilerInstance = Reconciler(hostConfig as Required<typeof hostConfig>);

export const render = (reactElement: ReactNode, hostElement: VirtualContainer) => {
	return new Promise<VirtualContainer>((resolve) => {
		const container = reconcilerInstance.createContainer(
			hostElement,
			1,
			null,
			false,
			false,
			'',
			(err) => {
				console.error('reconciler:', err);
			},
			null,
		);

		reconcilerInstance.updateContainer(reactElement, container, null, () => {
			resolve(hostElement);
		});
	});
};

export const containerToString = (
	container: VirtualContainer | VirtualInstance | VirtualTextInstance,
): string => {
	if ('text' in container) {
		return container.text;
	}

	const content = container.entries.map(containerToString).join('');

	if (!('type' in container)) {
		return content;
	}

	if (container.type === 'div') {
		return content;
	}

	let attributes = '';
	if (container.type === 'a') {
		attributes += ` href="${container.props.href}"`;
	}

	return `<${container.type}${attributes}>${content}</${container.type}>`;
};

export const renderToString = async (reactElement: ReactNode) => {
	const container = await render(reactElement, {
		entries: [],
	});

	return containerToString(container);
};
