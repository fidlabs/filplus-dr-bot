import {useState} from 'react';
import {ConfigLotusNode} from '../types/ConfigLotusNode';
import {
	transactionSign,
	transactionSerialize,
} from '../../libs/filecoin-signing-tools/js/src';
import {LotusMessage} from '../types/TransactionRaw';
import {keyDerive} from '../../filecoin-signing-tools';

const mnemonic =
	'robot matrix ribbon husband feature attitude noise imitate matrix shaft resist cliff lab now gold menu grocery truth deliver camp about stand consider number';

const numberOfWalletAccounts = import.meta.env.VITE_NUMBER_OF_WALLET_ACCOUNTS;
const lotusNodeCode = import.meta.env.VITE_LOTUS_NODE_CODE;

const useBurnerWallet = () => {
	const [networkIndex, setNetworkIndex] = useState<number>(0);
	const [lotusNode, setLotusNode] = useState<ConfigLotusNode | null>(null);
	const [api, setApi] = useState<any>(null);

	const loadWallet = async (networkIndex: number) => {
		setNetworkIndex(networkIndex);
		setLotusNode(lotusNode);
		// setApi(createVerifyAPI());
	};

	// const importSeed = async (seedphrase: string) => {
	// 	setMnemonic(seedphrase);
	// };

	// const selectNetwork = async (nodeIndex: number) => {
	//   const
	//     this.lotusNode = config.lotusNodes[nodeIndex]
	//     this.loadWallet(this.networkIndex)
	//     return this
	// }

	const getAccounts = async (nStart = 0) => {
		const accounts = [];
		for (let i = nStart; i < numberOfWalletAccounts; i += 1) {
			accounts.push(
				keyDerive(mnemonic, `m/44'/${lotusNodeCode}'/0/0/${i}`, '').address,
			);
		}
		return accounts;
	};

	const sign = async (filecoinMessage: LotusMessage, indexAccount: number) => {
		const message: LotusMessage = {
			To: 'f02838320',
			From: 'f02838320',
			Nonce: 0,
			Value: '6432423432432',
			GasLimit: 10000000,
			GasFeeCap: '10000000',
			GasPremium: '10000000',
			Method: 1,
			Params: '',
		};
		const private_hexstring = keyDerive(
			mnemonic,
			`m/44'/${lotusNodeCode}'/0/0/0`,
			'',
		).private_hexstring;
		const privateHexstringBuffer = Buffer.from(private_hexstring.toString(), 'hex');
		return transactionSign(message, privateHexstringBuffer);
	};

	return {
		loadWallet,
		networkIndex,
		lotusNode,
		api,
		getAccounts,
		sign,
		// importSeed,
	};
};

export default useBurnerWallet;
