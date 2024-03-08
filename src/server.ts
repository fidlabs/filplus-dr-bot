import express, {type Application, type Request, type Response} from 'express';
import bodyParser from 'body-parser';
import {getDataCaps} from './serverFunctions/datacaps.js';
import {postIssue} from './serverFunctions/postIssue.js';

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

app.post('/post-issue', async (req: Request, res) => {
	errorHandler(async () => {
		const body = req.body as {issueNumber: number};
		await postIssue(body);
	}, res);
});

app.get('/datacaps', async (req: Request, res: Response) => {
	errorHandler(async () => getDataCaps(res), res);
});

const port = process.env.PORT ?? 3000;
app.listen(port, () => {
	console.log(`Server is running on port ${port}`);
});
