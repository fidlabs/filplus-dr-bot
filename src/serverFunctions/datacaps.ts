import {type Response} from 'express';
import {createClient} from 'redis';
import * as dotenv from 'dotenv';

dotenv.config();

const redisUrl = process.env.REDIS_URL!;
const redisDatacapAddressesSet = 'datacap-addresses';

export const getDataCaps = async (res: Response) => {
	const client = await createClient({url: redisUrl}).connect();
	const members = await client.sMembers(redisDatacapAddressesSet);
	const dataCaps = await Promise.all(
		members.map(async (member) => {
			const datacap = await client.hGetAll(member);
			return {...datacap, member};
		}),
	);

	res.json({dataCaps});
	await client.disconnect();
};
