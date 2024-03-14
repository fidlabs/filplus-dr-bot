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
import {addRootKeySignatures, addSignatures} from '../api';
import {LoadingContext} from '../components/Context/LoaderContext';
import {SubmitRemoveData} from '../types/SubmitRemoveDataCap';

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
	const {ledgerApp, indexAccount, currentAccount} = useContext(DeviceContext);
	const {changeIsLoadingState} = useContext(LoadingContext);
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
		indexAccount: number,
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
		changeIsLoadingState();
		const signedMessage = await ledgerApp.signRemoveDataCap(
			`m/44'/${import.meta.env.VITE_LOTUS_NODE_CODE}'/0'/0/${indexAccount}`,
			messageBlob,
		);
		changeIsLoadingState();

		const ts_compact = signedMessage.signature_compact.toString('hex');

		const signedMessageData = {
			ts_compact: `01${ts_compact}`,
			clientAddress: message.verifiedClient,
			notaryAddres: await verifyAPI.actorAddress(currentAccount),
			isSignature1: !!message.signature1,
		};
		return signedMessageData;
	};

	const submitRemoveDataCap = async (dataToSignRootKey: SubmitRemoveData) => {
		const {
			allocation,
			notary1,
			sig1,
			notary2,
			sig2,
			clientAddress,
			msigTxId,
			txFrom,
		} = dataToSignRootKey;
		try {
			changeIsLoadingState();
			const verifyAPI = createVerifyAPI(sign, getAccounts);

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
			const client = await verifyAPI.actorAddress(clientAddress);
			const amountToRemove = allocation.toString(16);
			changeIsLoadingState();
			if (!msigTxId) {
				// needs to be hex string
				const txCid = await verifyAPI.proposeRemoveDataCap(
					client,
					amountToRemove,
					notary1,
					sig1,
					notary2,
					sig2,
					indexAccount,
					ledgerApp,
				);
				const receipt = await verifyAPI.stateWaitMessage(txCid);
				const msigTxId = receipt.ReturnDec.TxnID;
				await addRootKeySignatures({
					msigTxId,
					clientAddress,
					txFrom: await verifyAPI.actorAddress(currentAccount),
				});
				// console.log('msig tx id', msigTxId);
				// console.log('All pendings', await verifyAPI.pendingRootTransactions());

				// console.log('Now approving as second root key');
			} else {
				const removeDatacapRequest = verifyAPI.encodeRemoveDataCapTx(
					client,
					amountToRemove,
					notary1,
					sig1,
					notary2,
					sig2,
				);

				const msigTx = {
					id: msigTxId,
					tx: {
						from: txFrom, // ID of account that sent proposeRemoveDataCap - a.k.a. first root key holder to sign
						...removeDatacapRequest,
					},
				};

				const approveId = await verifyAPI.approvePending(
					'f080',
					msigTx,
					indexAccount,
					ledgerApp,
				);
				console.log(approveId);
				console.log('stateWaitMessage for', approveId);
				console.log(await verifyAPI.stateWaitMessage(approveId));
				changeIsLoadingState();
			}
		} catch (e: any) {
			console.error('error', e.stack);
			changeIsLoadingState();
		}
	};

	return {
		getAccounts,
		signRemoveDataCap,
		sign,
		submitRemoveDataCap,
	};
};

export default useLedgerWallet;
