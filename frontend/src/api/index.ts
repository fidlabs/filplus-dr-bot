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

const getDataCaps = async () =>
	fetchWithErrorHandling<{dataCaps: DataCap[]}>(`${apiUrl}/datacaps`);

const commentIssueWithSign = async (issueNumber: string) => {
	const config = defaultConfigPostData({issueNumber});
	await fetchWithErrorHandling<void>(`${apiUrl}/post-issue`, config);
};

export {getDataCaps, commentIssueWithSign};
