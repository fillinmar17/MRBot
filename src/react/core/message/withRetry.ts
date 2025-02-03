import type {MessageSendResult} from '../../../core/bot';

/** Минимальная задержка при повторе */
const MIN_RETRY_SLEEP = 1100;

/** Текущая задержка перед повтором */
let currentRetrySleep = MIN_RETRY_SLEEP;

/** Очередб запросов */
let queue = Promise.resolve<void>(undefined);

export const withRetry = (task: () => Promise<MessageSendResult>): Promise<MessageSendResult> => {
	return new Promise((resolve) => {
		queue = queue.then(async () => {
			const result = await task();

			console.log('withRetry:', result);

			if (/ratelimit/i.test(`${result.error}`)) {
				await new Promise((resolve) => setTimeout(resolve, currentRetrySleep));
				currentRetrySleep += MIN_RETRY_SLEEP;
			} else {
				currentRetrySleep = MIN_RETRY_SLEEP;
				resolve(result);
				return;
			}

			withRetry(task);
		});
	});
};
