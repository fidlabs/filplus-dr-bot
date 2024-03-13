import express, {type Application, type Request, type Response} from 'express';
import bodyParser from 'body-parser';
import {
	getClientWithBothSignatures,
	getDataCaps,
	postSignatures,
} from './serverFunctions/datacaps.js';
import {postIssue} from './serverFunctions/postIssue.js';
import {makeStale} from './serverFunctions/makeStale.js';
import {type Signature} from './types/signature.js';

const errorHandler = (handleFunction: () => void, res: Response) => {
	try {
		handleFunction();
	} catch (error) {
		console.error('Error:', error);
		res.status(500).json({error: 'Internal server error'});
	}
};

const app: Application = express();

app.use(bodyParser.json());
app.use((req, res, next) => {
	res.header('Access-Control-Allow-Origin', 'http://localhost:8000');
	res.header(
		'Access-Control-Allow-Methods',
		'GET, POST, OPTIONS, PUT, PATCH, DELETE',
	);
	res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
	next();
});

app.post('/add-signature', async (req: Request, res) => {
	errorHandler(async () => {
		const body = req.body as {issueNumber: number; signature: Signature};
		await postSignatures(body, res);
	}, res);
});

app.get('/notary-signatures', async (req: Request, res) => {
	errorHandler(async () => {
		const clientWithBothSignatures = await getClientWithBothSignatures();
		res.json({clientWithBothSignatures});
	}, res);
});

app.post('/post-issue', async (req: Request, res) => {
	errorHandler(async () => {
		const body = req.body as {issueNumber: number; signature: Signature};
		await postIssue(body);
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

app.get('/datacaps', async (req: Request, res: Response) => {
	errorHandler(async () => {
		const dataCaps = await getDataCaps();
		res.json({dataCaps});
	}, res);
});

const port = process.env.PORT ?? 3000;
app.listen(port, () => {
	console.log(`Server is running on port ${port}`);
});
