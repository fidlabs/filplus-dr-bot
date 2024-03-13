import {VerifyAPI} from '../../filecoin-verifier-tools/VerifyAPI';
import {LotusMessage} from '../types/TransactionRaw';
import {FilecoinApp} from '@zondax/ledger-filecoin';

type Sign = (
	filecoinMessage?: LotusMessage,
	indexAccount?: number,
) => Promise<string>;

const apiToken = import.meta.env.VITE_VERIFY_API_TOKEN
const verifyApiUrl = import.meta.env.VITE_VERIFY_API_URL

export const createVerifyAPI = (
	sign: Sign,
	getAccounts: (nStart?: number) => Promise<any[]>,
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
