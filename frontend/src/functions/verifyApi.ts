import {VerifyAPI} from '../../filecoin-verifier-tools/VerifyAPI';
import {getAccounts} from './getAccounts';
import {sign} from './sign';

export const createVerifyAPI = (): VerifyAPI => {
	//class VerifyAPI { constructor(lotusClient: any, walletContext: any, testnet?: boolean);
	return new VerifyAPI(
		'http://127.0.0.1:1234',
		{
			token: async () =>
				'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJBbGxvdyI6WyJyZWFkIiwid3JpdGUiLCJzaWduIiwiYWRtaW4iXX0.slNp0Ij0CpRP_gg8X75RM8GJ4oSJm58HFxBSdNiSogQ',
		},
		// this.lotusNode.name !== 'Mainnet' // if node != Mainnet => testnet = true
	);
};
