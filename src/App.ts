import * as dotenv from 'dotenv';
import {type Octokit} from '@octokit/rest';
import {type Issue} from './types/issue.js';
import {type DataCapRequest} from './types/request.js';
import {parseClientName, processIssue} from './issueProcessor.js';
import axios, {all} from 'axios';
import {createClient} from 'redis';
import fs from 'fs';
import {createAppAuth} from '@octokit/auth-app';
import {getOctokitInstance} from './octokitBuilder.js';
import {LocalWallet} from './lib/LocalWallet.js';
import {LotusApi} from './lib/LotusApi.js';

dotenv.config();

const redisDatacapAddressesSet = 'datacap-addresses';
const appId = process.env.APP_ID ?? 'APP_ID';
const privateKeyPath = process.env.PRIVATE_KEY_PATH ?? './YOUR_PRIVATE_KEY.pem';
const privateKey = fs.readFileSync(privateKeyPath, 'utf8');
const owner = process.env.OWNER ?? 'OWNER';
const repo = process.env.REPO ?? 'REPO';
const govOwner = process.env.GOV_OWNER ?? 'govOwner';
const govRepo = process.env.GOV_REPO ?? 'govRepo';
const monitoringInterval = Number(process.env.MONITORING_INTERVAL) || 3600;
const glifUrl = process.env.GLIF_URL ?? 'https://api.glif.io';
const glifToken = process.env.GLIF_TOKEN;
const mnemonic = process.env.MNEMONIC ?? 'mnemonic';

// Start the Express server

(async () => {
	// eslint-disable-next-line no-constant-condition
	while (true) {
		const client = await createClient({
			url: process.env.REDIS_URL!,
		})
			.on('error', (err) => {
				console.log('Redis Client Error', err);
			})
			.connect(); // TODO: RedisClientType<M, F, S>

		const requestsOctokit: Octokit = await getOctokitInstance(
			appId,
			privateKey,
			owner,
			repo,
		);
		const govOctokit: Octokit = await getOctokitInstance(
			appId,
			privateKey,
			govOwner,
			govRepo,
		);
		const approvedRequests = await getApprovedRequests(requestsOctokit);
		if (approvedRequests.length > 0) {
			const addresses = await indexAllocations(client, approvedRequests);
			await handleStaleIssues(
				addresses,
				client,
				requestsOctokit,
				govOctokit,
			).catch((e) => {
				console.log(e);
			});
		} else {
			console.log(
				`No approved requests found in the repo '${owner}/${repo}' issues.`,
			);
		}

		await client.disconnect();
		await delay(monitoringInterval * 1000);
	}
})();

// TODO: Move these functions to a separate file? What are the conventions in TS?
async function getApprovedRequests(
	octokit: Octokit,
): Promise<DataCapRequest[]> {
	const approvedRequests: DataCapRequest[] = [];
	// Get paginated issues for a repo
	const issues: Issue[] = await octokit.paginate(
		octokit.rest.issues.listForRepo,
		{
			owner,
			repo,
			labels: 'granted',
		},
	);

	for (const issue of issues) {
		const approved = await processIssue(octokit, issue);
		if (approved) {
			approvedRequests.push(approved);
		}

		if (approvedRequests.length % 10 === 0) {
			await delay(1000);
		}
	}

	return approvedRequests;
}

async function indexAllocations(
	client: any, // TODO: RedisClientType<M, F, S>
	approvedRequests: DataCapRequest[],
): Promise<string[]> {
	let addresses: string[] = [];
	for (const request of approvedRequests) {
		if (request.address) {
			const api = new LotusApi(glifUrl, glifToken);
			const allocation = await api.getVerifiedClientStatus(request.address);
			const cachedAllocation = await client.hGet(request.address, 'allocation');
			if (cachedAllocation === allocation) {
				console.log(request.address, '- No change in allocation');
			} else {
				await client.hSet(request.address, {
					allocation,
					date: Date.now(),
					issue: request.issueNumber,
				});
				console.log(
					'Allocation updated for:',
					request.address,
					' - before:',
					cachedAllocation / 1024 ** 3,
					'GB',
					' - after:',
					allocation / 1024 ** 3,
					'GB',
					'diff:',
					(allocation - cachedAllocation) / 1024 ** 3,
					'GB',
				);
			}

			addresses.push(request.address);
		}
	}

	// Update the list of addresses in redis
	await client.sAdd(redisDatacapAddressesSet, addresses);
	addresses = (await client.sMembers(redisDatacapAddressesSet)) as string[];
	return addresses;
}

async function handleStaleIssues(
	addresses: string[],
	client: any, // TODO: RedisClientType<M, F, S>
	datacapOctokit: Octokit,
	govOctokit: Octokit,
) {
	const staleThreshold = Number(process.env.ALLOCATION_STALE_THRESHOLD_DAYS);
	for (const address of addresses) {
		const res = (await client.hGetAll(address)) as Record<string, string>;
		console.log(res)
		const entry = {
			allocationBytes: BigInt(res.allocation),
			allocation: Number(res.allocation),
			date: Number(res.date),
			stale: res.stale as string | undefined,
			issue: Number(res.issue),
		};

		if (entry.stale) {
			continue;
		}

		if (Date.now() - entry.date > staleThreshold * 24 * 60 * 60 * 1000) {
			await client.hSet(address, {stale: 1});

			console.log('Stale allocation removed for:', address);

			await datacapOctokit.rest.issues.createComment({
				owner,
				repo,
				// eslint-disable-next-line @typescript-eslint/naming-convention
				issue_number: entry.issue,
				body: `This application has been stale for ${staleThreshold} days. This application will have it’s allocation retracted, and will be closed. Please feel free to apply again when you are ready.`,
			});

			await datacapOctokit.rest.issues.update({
				owner,
				repo,
				// eslint-disable-next-line @typescript-eslint/naming-convention
				issue_number: entry.issue,
				state: 'closed',
			});

			const clientName = await parseClientName(datacapOctokit, entry.issue);
			let allocationConverted = entry.allocation / 1024 ** 4;
			let allocationUnit = 'TiB';
			if (allocationConverted > 1024) {
				allocationConverted /= 1024;
				allocationUnit = 'PiB';
			}

			const issue = await govOctokit.rest.issues.create({
				owner: govOwner,
				repo: govRepo,
				title: `DataCap Removal for Issue #${entry.issue}`,
				body: `### Client Application URL or Application Number
[${entry.issue}](https://github.com/${owner}/${repo}/issues/${entry.issue})

### Client Name
${clientName}

### Client Address
${address}

### Amount of DataCap to be removed
${allocationConverted.toFixed(1)} ${allocationUnit}`,
				labels: ['DcRemoveRequest'],
			});

			await client.hSet(address, {
				issueGov: issue.data.number,
			});

			console.log('Stale allocation removal proposed for:', address);

			await signNotaries(address, entry.allocationBytes, client).catch((e) => {
				console.error(e, 'Faild to signNotaries for address:', address);
			});
			console.log('Notaries signed for client:', address);
		}
	}
}

async function signNotaries(
	clientAddress: string,
	amount: bigint,
	client: any,
) {
	const wallet = new LocalWallet(mnemonic);
	const api = new LotusApi(glifUrl, glifToken);
	const clinetAdress1 = await api.addressId(clientAddress);
	const notary1 = await api.addressId(wallet.getAddress(0));
	const proposalId1 = await api.getProposalId(notary1, clinetAdress1);
	const signature1 = wallet.signRemoveDataCapProposal(
		0,
		clinetAdress1,
		amount,
		proposalId1,
	);
	const notary2 = await api.addressId(wallet.getAddress(1));
	const proposalId2 = await api.getProposalId(notary2, clinetAdress1);
	const signature2 = wallet.signRemoveDataCapProposal(
		1,
		clinetAdress1,
		amount,
		proposalId2,
	);

	await client.hSet(clientAddress, {
		signature1,
		notary1,
		signature2,
		notary2,
	});
}

async function delay(ms: number) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}
