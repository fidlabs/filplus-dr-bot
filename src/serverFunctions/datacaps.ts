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

	await client.disconnect();
	return dataCaps;
};

type Body = {
	ts_compact: string;
	clientAddress: string;
	verified: string;
};

export const postSignatures = async (body: Body, res: Response) => {
	const client = await createClient({url: redisUrl}).connect();
	const {ts_compact: tsCompact, clientAddress, verified} = body;
	const isSignature1 = await client.hGet(clientAddress, 'signature1');

	const field = isSignature1 ? 'signature1' : 'signature2';
	const value = tsCompact;

	const notaryField = isSignature1 ? 'notary1' : 'notary2';
	const notaryValue = verified;

	await client.hSet(clientAddress, {
		[field]: value,
		[notaryField]: notaryValue,
	});

	await client.disconnect();
};

export const getClientWithBothSignatures = async () => {
	const client = await createClient({url: redisUrl}).connect();
	const members = await client.sMembers(redisDatacapAddressesSet);
	const clientWithBothSignatures = await Promise.all(
		members.map(async (member) => {
			const filecoinClient = await client.hGetAll(member);
			if (filecoinClient.signature1 && filecoinClient.signature2) {
				return {...filecoinClient, member};
			}
		}),
	);
	await client.disconnect();
	return clientWithBothSignatures;
};
