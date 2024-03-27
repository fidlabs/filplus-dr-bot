import fs from 'fs';
import {getOctokitInstance} from '../../lib/octokitBuilder.js';
import {type Octokit} from '@octokit/rest';
import * as dotenv from 'dotenv';
dotenv.config();

const appId = process.env.APP_ID ?? 'APP_ID';
const privateKeyPath = process.env.PRIVATE_KEY_PATH ?? './YOUR_PRIVATE_KEY.pem';
const privateKey = fs.readFileSync(privateKeyPath, 'utf8');
const owner = process.env.GOV_OWNER ?? 'OWNER';
const govRepo = process.env.GOV_REPO ?? 'GOV_REPO';

type Body = {
	issueNumber: string;
	txFrom?: string;
	msigTxId?: string;
	isLastComment?: boolean;
};

export const postIssue = async (body: Body) => {
	const {issueNumber, txFrom, msigTxId, isLastComment} = body;
	const requestsOctokit: Octokit = await getOctokitInstance(
		appId,
		privateKey,
		owner,
		govRepo,
	);

	await requestsOctokit.rest.issues.createComment({
		owner,
		repo: govRepo,
		// eslint-disable-next-line @typescript-eslint/naming-convention
		issue_number: Number(issueNumber),
		body: `
### Approve By Root Key

**Msig Pending TxID:** ${msigTxId}
		
**Signer Address:** ${txFrom}
		`,
	});

	if (isLastComment) {
		await requestsOctokit.rest.issues.update({
			owner,
			repo: govRepo,
			// eslint-disable-next-line @typescript-eslint/naming-convention
			issue_number: Number(issueNumber),
			state: 'closed',
		});
	}
};
