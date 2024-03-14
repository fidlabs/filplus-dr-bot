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
			return {...datacap, member};
		}),
	);

	await client.disconnect();
	return dataCaps;
};

type Body = {
	issueNumber: number;
	signature: Signature;
};

export const postSignatures = async (body: any, res: Response) => {
	const client = await createClient({url: redisUrl}).connect();
	const {ts_compact, clientAddress} = body;
	console.log(body);

	await client.hSet(clientAddress, {signature1: ts_compact});

	// Res.json({dataCaps});
	await client.disconnect();
};

export const getSignatures = async (body: Body, res: Response) => {
	const client = await createClient({url: redisUrl}).connect();
	const {issueNumber} = body;
	console.log(issueNumber);

	// client.hGet(clientId);

	// const dataCaps = await Promise.all(
	// 	members.map(async (member) => {
	// 		const datacap = await client.hGetAll(member);
	// 		return {...datacap, member};
	// 	}),
	// );

	// res.json({dataCaps});
	await client.disconnect();
};
