import {type Response} from 'express';
import {createClient} from 'redis';
import * as dotenv from 'dotenv';
import {type Signature} from '../types/signature.js';

dotenv.config();

const redisUrl = process.env.REDIS_URL!;
const redisDatacapAddressesSet = 'datacap-addresses';

export const getDataCaps = async () => {
	const client = await createClient({url: redisUrl}).connect();
	const members = await client.sMembers(redisDatacapAddressesSet);
	const dataCaps = await Promise.all(
		members.map(async (member) => {
			const datacap = await client.hGetAll(member);
			if (!(datacap.signature1 && datacap.signature2)) {
				return {...datacap, member};
			}
		}),
	);
	const filteredData = dataCaps.filter((item) => item);

	await client.disconnect();
	return filteredData;
};

type Body = {
	ts_compact: string;
	clientAddress: string;
	notaryAddres: string;
};

export const postSignatures = async (body: Body, res: Response) => {
	const client = await createClient({url: redisUrl}).connect();
	const {ts_compact: tsCompact, clientAddress, notaryAddres} = body;
	const isSignature1 = await client.hGet(clientAddress, 'signature1');

	const field = isSignature1 ? 'signature2' : 'signature1';
	const value = tsCompact;

	const notaryField = isSignature1 ? 'notary2' : 'notary1';
	const notaryValue = notaryAddres;

	await client.hSet(clientAddress, {
		[field]: value,
		[notaryField]: notaryValue,
	});

	await client.disconnect();
};

type BodyRootKey = {
	clientAddress: string;
	txFrom?: string;
	msigTxId?: string;
};

export const postRootKeySignatures = async (
	body: BodyRootKey,
	res: Response,
) => {
	const client = await createClient({url: redisUrl}).connect();
	const {msigTxId, clientAddress, txFrom} = body;
	const isTxFrom = await client.hGet(clientAddress, 'txFrom');
	if (isTxFrom) {
		await client.hSet(clientAddress, {
			isFinished: true,
		});
	} else {
		await client.hSet(clientAddress, {
			msigTxId,
			txFrom,
		});
	}

	await client.disconnect();
};

export const getClientWithBothSignatures = async () => {
	const client = await createClient({url: redisUrl}).connect();
	const members = await client.sMembers(redisDatacapAddressesSet);
	const clientWithBothSignatures = await Promise.all(
		members.map(async (member) => {
			const filecoinClient = await client.hGetAll(member);
			const checkIfSignature = filecoinClient.signature1 && filecoinClient.signature2;
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
