import fs from 'fs';
import {getOctokitInstance} from '../octokitBuilder.js';
import {type Octokit} from '@octokit/rest';
import * as dotenv from 'dotenv';
dotenv.config();

const appId = process.env.APP_ID ?? 'APP_ID';
const privateKeyPath = process.env.PRIVATE_KEY_PATH ?? './YOUR_PRIVATE_KEY.pem';
const privateKey = fs.readFileSync(privateKeyPath, 'utf8');
const owner = process.env.OWNER ?? 'OWNER';
const repo = process.env.REPO ?? 'REPO';

type Body = {
	issueNumber: number;
};

export const postIssue = async (body: Body) => {
	const {issueNumber} = body;
	const requestsOctokit: Octokit = await getOctokitInstance(
		appId,
		privateKey,
		owner,
		repo,
	);

	await requestsOctokit.rest.issues.createComment({
		owner,
		repo,
		// eslint-disable-next-line @typescript-eslint/naming-convention
		issue_number: issueNumber,
		body: 'story data after sign',
	});
};
