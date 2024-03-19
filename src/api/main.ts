import express from 'express';
import bodyParser from 'body-parser';
import {apiRouter} from './apiRouter.js';
import cors from 'cors';

const app = express();

app.use(cors({
	origin: process.env.CORS_ORIGIN
}));

app.use(bodyParser.json());

app.use("/api", apiRouter);

const port = process.env.PORT ?? 3000;
app.listen(port, () => {
	console.log(`Server is running on port ${port}`);
});
