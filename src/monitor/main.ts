import * as dotenv from 'dotenv';
import { type Octokit } from '@octokit/rest';
import { type Issue } from '../types/issue.js';
import { type DataCapRequest } from '../types/request.js';
import { parseClientName, processIssue } from '../lib/issueProcessor.js';
import { RedisClientType, createClient } from 'redis';
import fs from 'fs';
import { getOctokitInstance } from '../lib/octokitBuilder.js';
import { LocalWallet } from '../lib/LocalWallet.js';
import { LotusApi } from '../lib/LotusApi.js';

dotenv.config();

const redisDatacapAddressesSet = 'datacap-addresses';
const appId = process.env.APP_ID!;
const privateKeyPath = process.env.PRIVATE_KEY_PATH!;
const privateKey = fs.readFileSync(privateKeyPath, 'utf8');
const owner = process.env.OWNER!;
const repo = process.env.REPO!;
const govOwner = process.env.GOV_OWNER!;
const govRepo = process.env.GOV_REPO!;
const monitoringInterval = Number(process.env.MONITORING_INTERVAL) || 3600;
const glifUrl = process.env.GLIF_URL ?? 'https://api.node.glif.io/rpc/v0';
const glifToken = process.env.GLIF_TOKEN;
const mnemonic = process.env.MNEMONIC!;
const staleThreshold = Number(process.env.ALLOCATION_STALE_THRESHOLD_DAYS!);
const wallet = new LocalWallet(mnemonic);

(async () => {
	// eslint-disable-next-line no-constant-condition

	await verifyNotary(wallet.getAddress(0));
	await verifyNotary(wallet.getAddress(1));

	while (true) {
		const client = createClient({
			url: process.env.REDIS_URL,
		}) as RedisClientType;

		client.on('error', (err) => {
			console.error('Redis Client Error', err);
		});

		await client.connect();

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
				console.error(e);
			});
		} else {
			console.log(
				`No approved requests found in the repo '${owner}/${repo}' issues.`,
			);
		}

		await client.disconnect();
		console.log(`Done, sleeping for ${monitoringInterval}s`);
		await delay(monitoringInterval * 1000);
	}
})();

// TODO: Move these functions to a separate file
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
	client: RedisClientType,
	approvedRequests: DataCapRequest[],
): Promise<string[]> {
	let addresses: string[] = [];
	for (const request of approvedRequests) {
		if (!request.address) continue;
		const api = new LotusApi(glifUrl, glifToken);
		let allocation: bigint;
		try {
			allocation = await api.getVerifiedClientStatus(request.address);
		} catch (e) {
			console.error(`Failed to get status for client ${request.address}`, e);
			continue;
		}

		const prevSeenAllocationStr: string = (await client.hGet(request.address, 'allocation')) ?? "-1";
		const prevSeenAllocation = BigInt(prevSeenAllocationStr ?? -1);
		if (prevSeenAllocation !== allocation) {
			await client.hSet(request.address, {
				allocation: allocation.toString(10),
				date: Date.now(),
				issue: request.issueNumber,
				stale: "false",
				isFinished: "false",
				txFrom: "",
				rootKeyAddress2: "",
				msigTxId: "",
				issueGov: "",
				signature1: "",
				notary1: "",
				signature2: "",
				notary2: "",
			});
			console.log(
				'Allocation updated for:',
				request.address,
				' - before:',
				prevSeenAllocation / BigInt(1024 ** 3),
				'GB',
				' - after:',
				allocation / BigInt(1024 ** 3),
				'GB',
				'diff:',
				(allocation - prevSeenAllocation) / BigInt(1024 ** 3),
				'GB',
			);
		}

		addresses.push(request.address);
	}

	// Update the list of addresses in redis
	if (addresses.length > 0)
		await client.sAdd(redisDatacapAddressesSet, addresses);
	addresses = (await client.sMembers(redisDatacapAddressesSet)) as string[];
	return addresses;
}

async function handleStaleIssues(
	addresses: string[],
	client: RedisClientType,
	datacapOctokit: Octokit,
	govOctokit: Octokit,
) {
	for (const address of addresses) {
		const res = (await client.hGetAll(address)) as Record<string, string>;
		const entry = {
			allocation: BigInt(res.allocation),
			date: Number(res.date),
			stale: res.stale,
			issue: Number(res.issue),
		};

		if (entry.allocation === BigInt(0) || entry.stale == "true") {
			continue;
		}

		if (Date.now() - entry.date > staleThreshold * 24 * 60 * 60 * 1000) {
			console.log('Starting removal process for:', address);

			const sigs = await signNotaries(address, entry.allocation);

			await closeApplicationIssue(datacapOctokit, entry.issue);

			const clientName = await parseClientName(datacapOctokit, entry.issue);
			const issueGov = await createGovIssue(govOctokit, entry.issue, clientName, address, entry.allocation);

			await client.hSet(address, {
				issueGov,
				stale: "true",
				...sigs
			});
		}
	}
}

async function closeApplicationIssue(datacapOctokit: Octokit, issue_number: number) {
	await datacapOctokit.rest.issues.createComment({
		owner,
		repo,
		// eslint-disable-next-line @typescript-eslint/naming-convention
		issue_number,
		body: `This application has been stale for ${staleThreshold} days. This application will have it’s allocation retracted and will be closed. Please feel free to apply again when you are ready.`,
	});

	await datacapOctokit.rest.issues.update({
		owner,
		repo,
		// eslint-disable-next-line @typescript-eslint/naming-convention
		issue_number,
		state: 'closed',
	});
}

async function createGovIssue(govOctokit: Octokit, issue_number: number, clientName: string, address: string, allocation: bigint): Promise<number> {
	let allocationConverted = Number(allocation / BigInt(1024 ** 4));
	let allocationUnit = 'TiB';
	if (allocationConverted > 1024) {
		allocationConverted /= 1024;
		allocationUnit = 'PiB';
	}

	const issue = await govOctokit.rest.issues.create({
		owner: govOwner,
		repo: govRepo,
		title: `DataCap Removal for Issue #${issue_number}`,
		body: `### Client Application URL or Application Number
[${issue_number}](https://github.com/${owner}/${repo}/issues/${issue_number})

### Client Name
${clientName}

### Client Address
${address}

### Amount of DataCap to be removed
${allocationConverted.toFixed(1)} ${allocationUnit}`,
		labels: ['DcRemoveRequest'],
	});
	return issue.data.number;
}



async function signNotaries(
	clientAddress: string,
	amount: bigint,
): Promise<{ notary1: string, notary2: string, signature1: string, signature2: string }> {
	const api = new LotusApi(glifUrl, glifToken);
	const clientAddressId = await api.addressId(clientAddress);
	const notary1 = await api.addressId(wallet.getAddress(0));
	const proposalId1 = await api.getProposalId(notary1, clientAddressId);
	const signature1 = wallet.signRemoveDataCapProposal(
		0,
		clientAddressId,
		amount,
		proposalId1,
	);
	const notary2 = await api.addressId(wallet.getAddress(1));
	const proposalId2 = await api.getProposalId(notary2, clientAddressId);
	const signature2 = wallet.signRemoveDataCapProposal(
		1,
		clientAddressId,
		amount,
		proposalId2,
	);

	return {
		signature1,
		notary1,
		signature2,
		notary2,
	};
}

async function verifyNotary(maybeNotary: string) {
	const api = new LotusApi(glifUrl, glifToken);
	let status = null;
	try {
		status = await api.getVerifierStatus(maybeNotary);
	} catch(e: any) {
		if (e?.message !== "actor not found") {
			throw e;
		}
	}

	if(status === null) {
		console.error(`${maybeNotary} isn't a verifier onchain. Update your MNEMONIC or make it a verifier. Exiting...`);
		process.exit(1);
	}
}

async function delay(ms: number) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}
