import express, {type Application, type Request, type Response} from 'express';
import {createClient} from 'redis';
import * as dotenv from 'dotenv';

dotenv.config();

// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
const app: Application = express();

app.use((req, res, next) => {
	res.header('Access-Control-Allow-Origin', 'http://localhost:8000');
	res.header(
		'Access-Control-Allow-Methods',
		'GET, POST, OPTIONS, PUT, PATCH, DELETE',
	);
	res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
	next();
});

app.get('/redis-data', async (req: Request, res: Response) => {
	try {
		const client = await createClient({
			url: process.env.REDIS_URL!,
		})
			.on('error', (err) => {
				console.log('Redis Client Error', err);
			})
			.connect();

		const redisDatacapAddressesSet = 'datacap-addresses';
		// const data = await client.get('some-key');
		// const members = await client.sMembers(redisDatacapAddressesSet);
		// members.map(() => {
		//   return await client.hGetAll(address);
		// })
		const address = 'f1x5bd4bafvlawsz5e7otja66y27lfdwsbvh2vxdi';
		const datacaps = await client.hGetAll(address);
		// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
		res.json({datacaps});

		await client.disconnect();
	} catch (error) {
		console.error('Error fetching data from Redis:', error);
		res.status(500).json({error: 'Internal server error'});
	}
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
	console.log(`Server is running on port ${port}`);
});
