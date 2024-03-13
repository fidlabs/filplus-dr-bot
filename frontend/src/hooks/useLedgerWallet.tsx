import {useContext, useState} from 'react';
import FilecoinApp from '@zondax/ledger-filecoin';
import {ConfigLotusNode} from '../types/ConfigLotusNode';
import {mapSeries} from 'bluebird';
import {transactionSerialize} from '@zondax/filecoin-signing-tools/js';
import {LotusMessage, SignRemoveDataCapMessage} from '../types/TransactionRaw';
import {createVerifyAPI} from '../functions/verifyApi';
import TransportWebUSB from '@ledgerhq/hw-transport-webusb';
import {generateSignedMessage} from '../functions/generateSignMessage';
import {DeviceContext} from '../components/Context/DeviceContext';
import {addSignatures} from '../api';

const numberOfWalletAccounts = import.meta.env.VITE_NUMBER_OF_WALLET_ACCOUNTS;
const lotusNodeCode = import.meta.env.VITE_LOTUS_NODE_CODE;

const handleErrors = (response: any) => {
	if (
		response.error_message &&
		response.error_message.toLowerCase().includes('no errors')
	) {
		return response;
	}
	if (
		response.error_message &&
		response.error_message
			.toLowerCase()
			.includes('transporterror: invalild channel')
	) {
		throw new Error(
			'Lost connection with Ledger. Please unplug and replug device.',
		);
	}
	throw new Error(response.error_message);
};

const useLedgerWallet = () => {
	const {ledgerApp, indexAccount} = useContext(DeviceContext);
	const [ledgerBusy, setLedgerBusy] = useState<boolean>(false);
	const [api, setApi] = useState<any>(null);
	const [lotusNode, setLotusNode] = useState<ConfigLotusNode | null>(null);
	const [networkIndex, setNetworkIndex] = useState<number>(0);

	const getAccounts = async (nStart = 0) => {
		const paths = [];

		for (let i = nStart; i < parseInt(numberOfWalletAccounts); i += 1) {
			paths.push(`m/44'/${lotusNodeCode}'/0'/0/${i}`);
		}

		const accounts = await mapSeries(paths, async (path) => {
			const returnLoad = await ledgerApp.getAddressAndPubKey(path);
			const {addrString} = handleErrors(returnLoad);
			return addrString;
		});
		return accounts;
	};

	const sign = async (
		filecoinMessage: LotusMessage = {
			To: 'f02838320',
			From: 'f02838320',
			Nonce: 0,
			Value: '6432423432432',
			GasLimit: 10000000,
			GasFeeCap: '10000000',
			GasPremium: '10000000',
			Method: 1,
			Params: '',
		},
		// co z indexAccount?
		indexAccount: number = 0,
	) => {
		const serializedMessage = transactionSerialize(filecoinMessage);
		//await this.ledgerApp.sign(`m/44'/${this.lotusNode.code}'/0'/0/${indexAccount}`, Buffer.from(serializedMessage, 'hex'))
		const signedMessage = handleErrors(
			await ledgerApp.sign(
				`m/44'/${import.meta.env.VITE_LOTUS_NODE_CODE}'/0'/0/${indexAccount}`,
				Buffer.from(serializedMessage, 'hex'),
			),
		);
		return await generateSignedMessage(filecoinMessage, signedMessage);
	};

	const signRemoveDataCap = async (message: SignRemoveDataCapMessage) => {
		const verifyAPI = createVerifyAPI(sign, getAccounts);
		const messageWithClientId: SignRemoveDataCapMessage = {
			...message,
			dataCapAmount: message.dataCapAmount,
			verifiedClient:
				't01004' || (await verifyAPI.actorAddress(message.verifiedClient)),
		};
		const encodedMessage =
			verifyAPI.encodeRemoveDataCapParameters(messageWithClientId);
		const messageBlob = Buffer.from(encodedMessage, 'hex');
		const signedMessage = await ledgerApp.signRemoveDataCap(
			`m/44'/${import.meta.env.VITE_LOTUS_NODE_CODE}'/0'/0/${indexAccount}`,
			messageBlob,
		);

		const ts_compact = signedMessage.signature_compact.toString('hex');

		const signedMessageData = {
			ts_compact: `01${ts_compact}`,
			clientAddress: message.verifiedClient,
			verified: messageWithClientId.verifiedClient,
			isSignature1: !!message.signature1,
		};
		return signedMessageData;
	};

	type SubmitRemoveData = {
		issueAddress: string;
		dataCapBytes: string;
		notary1: string;
		signature1: string;
		notary2: string;
		signature2: string;
		isProposal: boolean;
		proposalId: string;
	};

	const submitRemoveDataCap = async () => {
		try {
			const verifyAPI = createVerifyAPI(sign, getAccounts);
			const rkAccounts = await getAccounts();
	
			ledgerApp.getAccounts = async () => {
				const paths = [];
	
				for (let i = 0; i < parseInt(numberOfWalletAccounts); i += 1) {
					paths.push(`m/44'/${lotusNodeCode}'/0'/0/${i}`);
				}
	
				const accounts = await mapSeries(paths, async (path) => {
					const returnLoad = await ledgerApp.getAddressAndPubKey(path);
					const {addrString} = handleErrors(returnLoad);
					return addrString;
				});
				return accounts;
			};
	
			const notary1 = 't01007';
			const sig1 = '016c416bee5b9a2bb3e2fa0a75111fcb9f23d9f0666f598074642b0c54a9086a6861cd9de539ed28644eeb2f7a4923a8545056c2efda90e23b8a22401e19a5ce1600';
			const notary2 = 't01008';
			const sig2 = '01a72a8ed012d0e99adfbc4e51c284c1faaadd37904a2017db19617925318c09c46baa983a9f246483adc26be116bdf83fcb4b38b9101bd6863af5257797bde71800';
			const txId = await verifyAPI.proposeRemoveDataCap(
				't01004',
				'1000',
				notary1,
				sig1,
				notary2,
				sig2,
				0,
				ledgerApp,
			);
			console.log("Waiting 10s for confirmation...");
			await new Promise((resolve) => setTimeout(resolve, 10000));
			console.log("Now approving as second root key")
			const pendings = await verifyAPI.pendingRootTransactions();
			console.log(pendings);
			const msigTx = pendings.find(({ parsed: { params, name }}) => (
				name === "removeVerifiedClientDataCap" &&
				params.dataCapAmountToRemove === 4096n &&
				params.verifiedClientToRemove === "t01004" &&
				params.verifierRequest1.verifier === notary1 &&
				params.verifierRequest2.verifier === notary2
			))
			const walletIndex = 1;
			const approveId = await verifyAPI.approvePending('f080', msigTx, walletIndex, ledgerApp);
			console.log(approveId);
		} catch (e: any) {
			console.error('error', e.stack);
		}
	};

	return {
		ledgerBusy,
		api,
		lotusNode,
		networkIndex,
		ledgerApp,
		getAccounts,
		signRemoveDataCap,
		sign,
		submitRemoveDataCap,
	};
};

export default useLedgerWallet;
