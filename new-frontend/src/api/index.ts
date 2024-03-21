import {DataCap} from '../types/DataCap';
import {fetchWithErrorHandling} from './errorHandler';

const apiUrl = process.env.VITE_API_URL ?? 'http://localhost:3000/api';

const defaultConfigPostData = (body: object) => ({
	method: 'POST',
	headers: {
		'Content-Type': 'application/json',
	},
	body: JSON.stringify(body),
});

const getPendingIssues = async () =>
	fetchWithErrorHandling<DataCap[]>(`${apiUrl}/pending-issues`);

const addRootKeySignatures = async (signature: any) => {
	const config = defaultConfigPostData({...signature});
	await fetchWithErrorHandling<void>(`${apiUrl}/add-root-key-signature`, config);
};

export {getPendingIssues, addRootKeySignatures};
