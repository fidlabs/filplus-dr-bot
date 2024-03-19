import {useContext} from 'react';
import {mapSeries} from 'bluebird';
import {transactionSerialize} from '@zondax/filecoin-signing-tools/js';
import {
	LotusMessage,
} from '../types/TransactionRaw';
import {createVerifyAPI} from '../functions/verifyApi';
import {generateSignedMessage} from '../functions/generateSignMessage';
import {DeviceContext} from '../components/Context/DeviceContext';
import {addRootKeySignatures} from '../api';
import {LoadingContext} from '../components/Context/LoaderContext';
import {SubmitRemoveData} from '../types/SubmitRemoveDataCap';
import {handleErrors} from '../functions/handleErrors';

const numberOfWalletAccounts = import.meta.env.VITE_NUMBER_OF_WALLET_ACCOUNTS;
const lotusNodeCode = import.meta.env.VITE_LOTUS_NODE_CODE;

const useLedgerWallet = () => {
	const {ledgerApp, indexAccount, currentAccount} = useContext(DeviceContext);
	const {setisLoadingTrue, setisLoadingFalse} = useContext(LoadingContext);
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
		indexAccount?: number,
	) => {
		const serializedMessage = transactionSerialize(filecoinMessage);
		//await this.ledgerApp.sign(`m/44'/${this.lotusNode.code}'/0'/0/${indexAccount}`, Buffer.from(serializedMessage, 'hex'))
		const signedMessage = handleErrors(
			await ledgerApp.sign(
				`m/44'/${import.meta.env.VITE_LOTUS_NODE_CODE}'/0'/0/${indexAccount ?? "0"}`,
				Buffer.from(serializedMessage, 'hex'),
			),
		);
		return await generateSignedMessage(filecoinMessage, signedMessage);
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
			issue,
		} = dataToSignRootKey;
		try {
			setisLoadingTrue();
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

			if (!msigTxId) {
				const txCid = await verifyAPI.proposeRemoveDataCap(
					client,
					allocation,
					notary1,
					sig1,
					notary2,
					sig2,
					indexAccount,
					ledgerApp,
					currentAccount,
				);
				const receipt = await verifyAPI.stateWaitMessage(txCid);
				const msigTxId = receipt.ReturnDec.TxnID;
				await addRootKeySignatures({
					issueNumber: issue,
					msigTxId,
					clientAddress,
					txFrom: await verifyAPI.actorAddress(currentAccount),
				});
			} else {
				const removeDatacapRequest = verifyAPI.encodeRemoveDataCapTx(
					await verifyAPI.actorAddress(clientAddress),
					allocation,
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
					currentAccount
				);
				const responseData = await verifyAPI.stateWaitMessage(approveId);

				if (
					responseData?.ReturnDec?.Applied === true &&
					responseData?.ReturnDec?.Code === 0
				) {
					await addRootKeySignatures({
						clientAddress,
						issueNumber: issue,
						msigTxId,
						rootKeyAddress2: await verifyAPI.actorAddress(currentAccount),
					});
				}
			}
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
		} catch (e: any) {
			console.error('error', e.stack);
		} finally {
			setisLoadingFalse();
		}
	};

	return {
		getAccounts,
		sign,
		submitRemoveDataCap,
	};
};

export default useLedgerWallet;
