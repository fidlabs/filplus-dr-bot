import {useState} from 'react';
import {ConfigLotusNode} from '../types/ConfigLotusNode';
import {createVerifyAPI} from '../functions/verifyApi';
import signer from '@zondax/filecoin-signing-tools/js';
import {
	transactionSign,
	transactionSerialize,
} from '@zondax/filecoin-signing-tools/js';
import {LotusMessage} from '../types/TransactionRaw';

const mnemonicDefault =
	'robot matrix ribbon husband feature attitude noise imitate matrix shaft resist cliff lab now gold menu grocery truth deliver camp about stand consider number';

const numberOfWalletAccounts = import.meta.env.VITE_NUMBER_OF_WALLET_ACCOUNTS;
const lotusNodeCode = import.meta.env.VITE_LOTUS_NODE_CODE;

const useBurnerWallet = () => {
	const [networkIndex, setNetworkIndex] = useState<number>(0);
	const [lotusNode, setLotusNode] = useState<ConfigLotusNode | null>(null);
	const [api, setApi] = useState<any>(null);
	const [mnemonic, setMnemonic] = useState<string>(mnemonicDefault);

	const loadWallet = async (networkIndex: number) => {
		setNetworkIndex(networkIndex);
		setLotusNode(lotusNode);
		// setApi(createVerifyAPI());
	};

	const importSeed = async (seedphrase: string) => {
		setMnemonic(seedphrase);
	};

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
				signer.keyDerive(mnemonic, `m/44'/${lotusNodeCode}'/0/0/${i}`, '')
					.address,
			);
		}
		return accounts;
	};

	const sign = async (filecoinMessage: LotusMessage, indexAccount: number) => {
		const private_hexstring = signer.keyDerive(
			mnemonic,
			`m/44'/${lotusNodeCode}'/0/0/${indexAccount}`,
			'',
		).private_hexstring;
		return transactionSign(filecoinMessage, private_hexstring);
	};

	return {
		loadWallet,
		networkIndex,
		lotusNode,
		api,
		getAccounts,
		sign,
		importSeed,
	};
};

export default useBurnerWallet;
