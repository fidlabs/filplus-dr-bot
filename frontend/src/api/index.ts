import {DataCap} from '../types/DataCap';
import {Signature} from '../types/Signature';
import {fetchWithErrorHandling} from './errorHandler';

const apiUrl = import.meta.env.VITE_APP_URL ?? 'http://localhost:3000';

const defaultConfigPostData = (body: object) => ({
	method: 'POST',
	headers: {
		'Content-Type': 'application/json',
	},
	body: JSON.stringify(body),
});

const getDataCaps = async () =>
	fetchWithErrorHandling<{dataCaps: DataCap[]}>(`${apiUrl}/datacaps`);

	const getNotarySignatures= async () =>
	fetchWithErrorHandling<{clientWithBothSignatures: DataCap[]}>(`${apiUrl}/notary-signatures`);

const commentIssueWithSign = async (
	issueNumber: string,
	signature: Signature,
) => {
	const config = defaultConfigPostData({issueNumber, signature});
	await fetchWithErrorHandling<void>(`${apiUrl}/post-issue`, config);
};

const addSignatures = async (signature: any) => {
	const config = defaultConfigPostData({...signature});
	await fetchWithErrorHandling<void>(`${apiUrl}/add-signature`, config);
};

const addRootKeySignatures = async (signature: any) => {
	const config = defaultConfigPostData({...signature});
	await fetchWithErrorHandling<void>(`${apiUrl}/add-root-key-signature`, config);
};

export {getDataCaps, commentIssueWithSign, addSignatures, getNotarySignatures, addRootKeySignatures};
