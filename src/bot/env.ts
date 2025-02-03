export function getDefaultProvider() {
	return process.env['COMMUNICATOR_PROVIDER'] || 'vkteams';
}

export function getDefaultApiToken() {
	return process.env['COMMUNICATOR_API_TOKEN'];
}

export function getBotType() {
	return process.env['BOT_TYPE'] || 'telegram';
}

export function getMongoDBUrl() {
	return process.env['MONGO_URI'] || '';
}
