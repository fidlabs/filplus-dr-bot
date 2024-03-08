import {Octokit} from '@octokit/rest';
import {createAppAuth} from '@octokit/auth-app';
import {type Auth} from './types/auth.js';
import fetch from 'node-fetch';

export async function getOctokitInstance(
	appId: string,
	privateKey: string,
	owner: string,
	repo: string,
): Promise<Octokit> {
	const installationId = await getInstallationId(owner, repo, {
		privateKey,
		appId,
	});

	return new Octokit({
		authStrategy: createAppAuth,
		auth: {
			appId,
			privateKey,
			installationId,
		},
	});
}

async function getInstallationId(owner: string, repo: string, auth: Auth) {
	const appOctokit = new Octokit({
		authStrategy: createAppAuth,
		auth,
		request: {
			// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
			fetch,
		},
	});
	try {
		const {data: installations} = await appOctokit.request(
			'GET /repos/{owner}/{repo}/installation',
			{
				owner,
				repo,
			},
		);

		const installationId = installations.id;
		console.log(`Installation ID for ${owner}/${repo}: ${installationId}`);
		return installationId;
	} catch (error) {
		console.error('Error getting installation ID:', error);
		return null;
	}
}
