import express, {type Application, type Request, type Response} from 'express';
import bodyParser from 'body-parser';
import {
	getClientWithBothSignatures,
	postRootKeySignatures,
} from './serverFunctions/datacaps.js';
import {makeStale} from './serverFunctions/makeStale.js';
import cors from 'cors';

const errorHandler = (handleFunction: () => void, res: Response) => {
	try {
		handleFunction();
	} catch (error) {
		console.error('Error:', error);
		res.status(500).json({error: 'Internal server error'});
	}
};

const app: Application = express();

app.use(cors({
	origin: process.env.CORS_ORIGIN
}));

app.use(bodyParser.json());

app.get('/notary-signatures', async (req: Request, res) => {
	errorHandler(async () => {
		const clientWithBothSignatures = await getClientWithBothSignatures();
		res.json({clientWithBothSignatures});
	}, res);
});

app.post('/add-root-key-signature', async (req: Request, res) => {
	errorHandler(async () => {
		const body = req.body as {
			clientAddress: string;
			txFrom?: string;
			msigTxId: string;
			issueNumber: string;
			rootKeyAddress2?: string;
		};
		await postRootKeySignatures(body, res);
		res.json({message: 'Signature root key added successfully'});
	}, res);
});

if (process.env.DEBUG_STALE_ISSUES === 'true') {
	app.post('/make-stale', async (req: Request, res: Response) => {
		errorHandler(async () => {
			const body = req.body as {address: string};
			await makeStale(body.address, res);
		}, res);
	});
}

const port = process.env.PORT ?? 3000;
app.listen(port, () => {
	console.log(`Server is running on port ${port}`);
});
