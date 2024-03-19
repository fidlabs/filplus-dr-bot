import {type Response} from 'express';
import {createClient} from 'redis';
import * as dotenv from 'dotenv';
import {postIssue} from './postIssue.js';

dotenv.config();

const redisUrl = process.env.REDIS_URL!;
const redisDatacapAddressesSet = 'datacap-addresses';

type BodyRootKey = {
	clientAddress: string;
	txFrom?: string;
	msigTxId: string;
	issueNumber: string;
	rootKeyAddress2?: string;
};

export const postRootKeySignatures = async (
	body: BodyRootKey,
	res: Response,
) => {
	const client = await createClient({url: redisUrl}).connect();
	const {msigTxId, clientAddress, txFrom, issueNumber, rootKeyAddress2} = body;
	const isTxFrom = Boolean(await client.hGet(clientAddress, 'txFrom'));
	const issueGov = await client.hGet(clientAddress, 'issueGov');
	const nameProperties = isTxFrom ? 'rootKeyAddress2' : 'txFrom';
	const valueProperties = isTxFrom ? rootKeyAddress2 : txFrom;
	await postIssue({
		issueNumber: issueGov!,
		txFrom: isTxFrom ? rootKeyAddress2 : txFrom,
		isLastComment: isTxFrom,
		msigTxId,
	});

	if (isTxFrom) {
		await client.hSet(clientAddress, {
			msigTxId,
			[nameProperties]: valueProperties ?? '',
			isFinished: 'true',
		});
	} else {
		await client.hSet(clientAddress, {
			msigTxId,
			[nameProperties]: valueProperties ?? '',
		});
	}

	await client.disconnect();
};

export const getClientWithBothSignatures = async () => {
	const client = await createClient({url: redisUrl}).connect();
	const members = await client.sMembers(redisDatacapAddressesSet);
	console.log(members);
	const clientWithBothSignatures = await Promise.all(
		members.map(async (member) => {
			const filecoinClient = await client.hGetAll(member);
			const checkIfSignature
				= filecoinClient.signature1 && filecoinClient.signature2;
			console.log(filecoinClient)
			if (checkIfSignature && !filecoinClient.isFinished) {
				return {...filecoinClient, member};
			}
		}),
	);
	const filteredClientWithBothSignatures = clientWithBothSignatures.filter(
		(item) => item,
	);
	await client.disconnect();
	return filteredClientWithBothSignatures;
};
