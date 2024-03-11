import {useState} from 'react';
import FilecoinApp from '@zondax/ledger-filecoin';
import {ConfigLotusNode} from '../types/ConfigLotusNode';
import {mapSeries} from 'bluebird';
import {transactionSerialize} from '@zondax/filecoin-signing-tools/js';
import {LotusMessage, SignRemoveDataCapMessage} from '../types/TransactionRaw';
import {createVerifyAPI} from '../functions/verifyApi';
import TransportWebUSB from '@ledgerhq/hw-transport-webusb';
import {generateSignedMessage} from '../functions/generateSignMessage';

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
	const [ledgerBusy, setLedgerBusy] = useState<boolean>(false);
	const [api, setApi] = useState<any>(null);
	const [lotusNode, setLotusNode] = useState<ConfigLotusNode | null>(null);
	const [networkIndex, setNetworkIndex] = useState<number>(0);
	const [ledgerApp, setLedgerApp] = useState<FilecoinApp | null>(null);

	const loadLedger = async () => {
		try {
			const transport = await TransportWebUSB.create();
			const app = new FilecoinApp(transport);
			setLedgerApp(app);
		} catch (error) {
			console.error('Error loading data from Ledger device:', error);
		}
	};

	const getAccounts = async (nStart = 0) => {
		const paths = [];

		for (let i = nStart; i < numberOfWalletAccounts; i += 1) {
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

	const signRemoveDataCap = async (
		message: SignRemoveDataCapMessage,
		indexAccount: number = 1,
	) => {
		const verifyAPI = createVerifyAPI(sign, getAccounts);
		const messageWithClientId: SignRemoveDataCapMessage = {
			...message,
			verifiedClient: await verifyAPI.actorAddress(message.verifiedClient),
		};
		const encodedMessage =
			verifyAPI.encodeRemoveDataCapParameters(messageWithClientId);
		const messageBlob = Buffer.from(encodedMessage.toString(), 'hex');
		const signedMessage = await ledgerApp.signRemoveDataCap(
			`m/44'/${import.meta.env.VITE_LOTUS_NODE_CODE}'/0'/0/${indexAccount}`,
			messageBlob,
		);
		console.log('signedMessage', signedMessage);
		const ts_compact = signedMessage.signature_compact.toString('hex');
		const ts_der = signedMessage.signature_der.toString('hex');
		console.log({
			ts_compact,
			ts_der,
			signedMessage,
		});
		return `01${ts_compact}`;
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

	const submitRemoveDataCap = async (submitRemoveData: SubmitRemoveData) => {
		const {
			issueAddress,
			dataCapBytes,
			notary1,
			signature1,
			notary2,
			signature2,
			isProposal,
			proposalId,
		} = submitRemoveData;
		try {
			const verifyAPI = createVerifyAPI();
			const rkAccounts = await getAccounts(ledgerApp);
			let action = '';
			let messageID = '';
			const walletIndex = 0; // o co chodzi z wallet index?
			if (isProposal) {
				//await api.proposeRemoveDataCap('t01019', 222080, 't01004', signature1, 't01006', signature2, 2, rootkeyWallet)
				// const messageID = await verifyAPI.proposeRemoveDataCap(
				//   address, //do wyciagniecia z redis
				//   dataCapBytes,
				//   notary1,
				//   signature1,
				//   notary2,
				//   signature2,
				//   walletIndex,
				//   rkAccounts
				// );
				const signature1 =
					'01965394a9a2497c3bb24da74216c393f7b2dbb782387a2cfb8d298cd3e864b8172d97f6ef6c8cb7f079c2af9d8f7290266e9a56850d278f26e9cfc46b3b801e3001';
				const signature2 =
					'0186d1b0ddae5921bf505c602ef3b8650fbfe355ffd95fd94f8c5e324c85d4de45269f1df837e1a0894c6e81ea83dd89bf1e570ba9b0e23d8fe4f07ab05c122c5901';

				const tx = await verifyAPI.proposeRemoveDataCap(
					issueAddress,
					dataCapBytes,
					notary1,
					signature1,
					notary2,
					signature2,
					walletIndex,
					rkAccounts,
				);
				console.log('removal', messageID);
				action = 'proposed';
				// labelsToAdd = [ISSUE_LABELS.DC_REMOVE_RKH_PROPOSED];
			} else {
				// const rootkey = config.networks == 'Mainnet' ? methods.mainnet.rootkey : methods.testnet.rootkey;
				const rootkey = methods.mainnet.rootkey;
				messageID = await verifyAPI.send(
					rootkey.approve(removalRequest.tx?.id, removalRequest.tx?.tx),
					walletIndex,
				);
				action = 'approved';
				// labelsToAdd = [ISSUE_LABELS.DC_REMOVE_RKH_APPROVED, ISSUE_LABELS.DC_REMOVE_COMPLETED];
			}

			//Prawdopodomnie dodawanie komentarza

			// const body = `# RootKey Holder ${action} the dataCap Removal for client ${removalRequest.address} \n > **message CID**: ${messageID}`;

			// await this.context.github.githubOctoGeneric.octokit.issues.createComment({
			//   owner: config.onboardingOwner,
			//   repo: config.onboardingNotaryOwner,
			//   issue_number: removalRequest.issue_number,
			//   body
			// });

			// await this.context.github.githubOctoGeneric.octokit.issues.addLabels({
			//   owner: config.onboardingOwner,
			//   repo: config.onboardingNotaryOwner,
			//   issue_number: removalRequest.issue_number,
			//   labels: labelsToAdd
			// });
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
		loadLedger,
		submitRemoveDataCap,
	};
};

export default useLedgerWallet;
