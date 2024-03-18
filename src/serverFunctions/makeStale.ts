import {type Response} from 'express';
import {createClient} from 'redis';
import * as dotenv from 'dotenv';

dotenv.config();

const redisUrl = process.env.REDIS_URL!;

export const makeStale = async (address: string, res: Response) => {
	const client = await createClient({url: redisUrl}).connect();
	const result = await client.hSet(address, {date: 0});

	res.json({result});
	await client.disconnect();
};
