function getVKTeamsToken() {
	return (
		process.env['WISEVER_MYTEAM_API_TOKEN'] ||
		process.env['MYTEAM_API_TOKEN'] ||
		process.env['CI_MYTEAM_API_TOKEN']
	);
}

export function getDefaultProvider() {
	return process.env['COMMUNICATOR_PROVIDER'] || 'vkteams';
}

export function getDefaultApiToken() {
	return process.env['COMMUNICATOR_API_TOKEN'] || getVKTeamsToken();
}

export function getDefaultCiApiToken() {
	return (
		process.env['MR_DEPLOY_MYTEAM_API_TOKEN'] ||
		process.env['CI_MYTEAM_API_TOKEN'] ||
		process.env['MYTEAM_API_TOKEN'] ||
		undefined
	);
}
