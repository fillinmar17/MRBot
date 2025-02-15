import type * as Reconciler from 'react-reconciler';

const DefaultEventPriority = 0b0000000000000000000000000000010;

const UPDATE_SIGNAL = {};

const log = (...args: unknown[]) => console.log(...args);
const xlog = (..._args: unknown[]) => undefined;

log.x = xlog;

export type VirtualContainer = {
	context?: VirtualHostContext;
	entries: VirtualElements[];
	onStart?: (container: VirtualContainer) => void;
	onUpdate?: (container: VirtualContainer) => void;
};

export type VirtualHostContext = {
	id?: unknown;
};

export type VirtualElements = VirtualInstance | VirtualTextInstance;

export type VirtualInstance = {
	type: string;
	props: VirtualInstanceProps;
	entries: VirtualElements[];
};

export type VirtualTextInstance = {
	text: string;
	props?: VirtualInstanceProps;
};

export type VirtualInstanceProps = Record<string, unknown>;

export type VirtualPublicInstance = VirtualInstance;

// export * from 'react-reconciler/src/ReactFiberHostConfigWithNoPersistence';
// export * from 'react-reconciler/src/ReactFiberHostConfigWithNoHydration';
// export * from 'react-reconciler/src/ReactFiberHostConfigWithNoScopes';
// export * from 'react-reconciler/src/ReactFiberHostConfigWithNoTestSelectors';
// export * from 'react-reconciler/src/ReactFiberHostConfigWithNoMicrotasks';
// export * from 'react-reconciler/src/ReactFiberHostConfigWithNoResources';
// export * from 'react-reconciler/src/ReactFiberHostConfigWithNoSingletons';

const insertBefore = (parentInstance: VirtualContainer, entry: VirtualElements, beforeEntry: any) => {
	const entries = parentInstance.entries.filter((x) => x !== entry);
	const idx = entries.indexOf(beforeEntry);

	entries.splice(idx > -1 ? idx : entries.length, 0, entry);
	parentInstance.entries = entries;
};

const removeEntry = (parentInstance: VirtualContainer, entry: VirtualElements) => {
	parentInstance.entries = parentInstance.entries.filter((x) => x !== entry);
	return parentInstance.entries;
};

export const hostConfig: Partial<
	Reconciler.HostConfig<
		string,
		VirtualInstanceProps,
		VirtualContainer,
		VirtualInstance,
		VirtualTextInstance,
		unknown,
		unknown,
		VirtualPublicInstance,
		VirtualHostContext,
		typeof UPDATE_SIGNAL,
		VirtualElements[],
		any,
		any
	>
> = {
	appendInitialChild(parentInstance: VirtualContainer, entry) {
		if (typeof entry === 'string') {
			throw new Error('Text entries should already be flattened.');
		}

		parentInstance.entries.push(entry);
	},

	createInstance(type, props) {
		return {
			type,
			props,
			entries: [],
		};
	},

	createTextInstance(text) {
		return {text};
	},

	finalizeInitialChildren() {
		return false;
	},

	getPublicInstance(instance) {
		return instance as VirtualPublicInstance;
	},

	prepareForCommit() {
		return null;
	},

	prepareUpdate() {
		return UPDATE_SIGNAL;
	},

	resetAfterCommit(container) {
		// console.log('resetAfterCommit');
		container.onUpdate?.(container);
	},

	resetTextContent() {},

	getRootHostContext(container) {
		// console.log('getRootHostContext');
		container.context ??= {};
		container.onStart?.(container);
		return container.context;
	},

	getChildHostContext() {
		return {};
	},

	noTimeout: -1,

	shouldSetTextContent() {
		return false;
	},

	getCurrentEventPriority() {
		return DefaultEventPriority;
	},

	isPrimaryRenderer: true,
	warnsIfNotActing: false,
	supportsMutation: true,

	appendChild(parentInstance, entry) {
		removeEntry(parentInstance, entry).push(entry);
	},

	appendChildToContainer(parentInstance, entry) {
		removeEntry(parentInstance, entry).push(entry);
	},

	insertBefore,
	insertInContainerBefore: insertBefore,

	removeChild: removeEntry,
	removeChildFromContainer: removeEntry,

	commitTextUpdate(entry, prev, next) {
		xlog('commitTextUpdate:', entry, prev, next);
		entry.text = next;
	},

	commitMount() {},

	commitUpdate(instance, _updatePayload, _type, _oldProps, newProps) {
		instance.props = newProps;
	},

	hideInstance() {},
	hideTextInstance() {},
	unhideInstance() {},
	unhideTextInstance() {},

	clearContainer(container) {
		container.entries = [];
	},

	getInstanceFromNode() {
		throw new Error('Not implemented');
	},

	beforeActiveInstanceBlur() {},
	afterActiveInstanceBlur() {},

	preparePortalMount(): void {},
	detachDeletedInstance(): void {},

	// requestPostPaintCallback() {},
	// prepareRendererToRender(): void {},
	// resetRendererAfterRender(): void {},
};
