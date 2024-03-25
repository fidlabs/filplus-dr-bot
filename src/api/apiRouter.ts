import express, {type Request, type Response} from 'express';
import {
	getClientWithBothSignatures,
	postRootKeySignatures,
} from './serverFunctions/datacaps.js';
import {makeStale} from './serverFunctions/makeStale.js';

export const apiRouter = express.Router();

const errorHandler = (handleFunction: () => void, res: Response) => {
	try {
		handleFunction();
	} catch (error) {
		console.error('Error:', error);
		res.status(500).json({error: 'Internal server error'});
	}
};

apiRouter.get('/pending-issues', async (req: Request, res) => {
	errorHandler(async () => {
		const pendings = await getClientWithBothSignatures();
		res.json(pendings);
	}, res);
});

apiRouter.post('/add-root-key-signature', async (req: Request, res) => {
	errorHandler(async () => {
		const body = req.body as {
			txCid: string;
			clientAddress: string;
		};
		try {
			await postRootKeySignatures(body);
		} catch(e: any) {
			console.warn(e);
			res.status(400).json({error: e?.message});
			return;
		}
		res.json({message: 'Signature root key added successfully'});
	}, res);
});

if (process.env.DEBUG_STALE_ISSUES === 'true') {
	apiRouter.post('/make-stale', async (req: Request, res: Response) => {
		errorHandler(async () => {
			const body = req.body as {address: string};
			await makeStale(body.address, res);
		}, res);
	});
}