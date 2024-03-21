import {VerifyAPI} from '../filecoin-verifier-tools/VerifyAPI';
import { Sign } from '../types/CreateVerifyApi'

const apiToken = process.env.VITE_VERIFY_API_TOKEN
const verifyApiUrl = process.env.VITE_VERIFY_API_URL

export const createVerifyAPI = (
	sign: Sign,
	getAccounts: (nStart?: number) => Promise<string[]>,
): VerifyAPI => {
	return new VerifyAPI(
		VerifyAPI.browserProvider(verifyApiUrl, {
			token:
			apiToken,
		}),
		{sign, getAccounts},
		true,
		// this.lotusNode.name !== 'Mainnet' // if node != Mainnet => testnet = true
	);
};
