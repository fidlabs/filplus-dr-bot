import {DataCap} from '../types/DataCap';
import {fetchWithErrorHandling} from './errorHandler';

const apiUrl = import.meta.env.VITE_APP_URL ?? 'http://localhost:3000';

const defaultConfigPostData = (body: object) => ({
	method: 'POST',
	headers: {
		'Content-Type': 'application/json',
	},
	body: JSON.stringify(body),
});

const getNotarySignatures= async () =>
	fetchWithErrorHandling<{clientWithBothSignatures: DataCap[]}>(`${apiUrl}/notary-signatures`);

const addRootKeySignatures = async (signature: any) => {
	const config = defaultConfigPostData({...signature});
	await fetchWithErrorHandling<void>(`${apiUrl}/add-root-key-signature`, config);
};

export {getNotarySignatures, addRootKeySignatures};
