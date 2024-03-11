import {VerifyAPI} from '../../filecoin-verifier-tools/VerifyAPI';
import {LotusMessage} from '../types/TransactionRaw';
import {FilecoinApp} from '@zondax/ledger-filecoin';

type Sign = (
	ledgerApp: FilecoinApp,
	filecoinMessage?: LotusMessage,
	indexAccount?: number,
) => Promise<string>;

export const createVerifyAPI = (
	sign: Sign,
	getAccounts: (nStart?: number) => Promise<any[]>,
): VerifyAPI => {
	return new VerifyAPI(
		VerifyAPI.browserProvider('http://127.0.0.1:1234', {
			token:
				'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJBbGxvdyI6WyJyZWFkIiwid3JpdGUiLCJzaWduIiwiYWRtaW4iXX0.Zw9-PRz4WxJIfi3NGDY8uLC3zqS-zQPccPe7OqK2Cgk',
		}),
		{sign, getAccounts},
		// this.lotusNode.name !== 'Mainnet' // if node != Mainnet => testnet = true
	);
};
