import {useContext} from 'react';
import {mapSeries} from 'bluebird';
import {transactionSerialize} from '@zondax/filecoin-signing-tools';
import {LotusMessage} from '../types/TransactionRaw';
import {createVerifyAPI} from '../functions/verifyApi';
import {generateSignedMessage} from '../functions/generateSignMessage';
import {DeviceContext} from '../components/Context/DeviceContext';
import {addRootKeySignatures} from '../api';
import {LoadingContext} from '../components/Context/LoaderContext';
import {SubmitRemoveData} from '../types/SubmitRemoveDataCap';
import {handleErrors} from '../functions/handleErrors';
import {PopupContext} from '../components/Context/PopupContext';
import ErrorLoadingLedger from '../components/Errors/ErrorLoadingLedger';
import React from 'react';

const numberOfWalletAccounts = process.env.NUMBER_OF_WALLET_ACCOUNTS || '20';
const lotusNodeCode = process.env.FILECOIN_COIN_TYPE;

const useLedgerWallet = () => {
	const {showPopup} = useContext(PopupContext);
	const {ledgerApp, indexAccount, currentAccount} = useContext(DeviceContext);
	const {setisLoadingTrue, setisLoadingFalse, setLoaderText} =
		useContext(LoadingContext);
	const getAccounts = async (nStart = 0) => {
		const paths = [];

		for (let i = nStart; i < parseInt(numberOfWalletAccounts); i += 1) {
			paths.push(`m/44'/${lotusNodeCode}'/0'/0/${i}`);
		}

		const accounts = await mapSeries(paths, async (path: string) => {
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
		indexAccount?: number,
	) => {
		const serializedMessage = transactionSerialize(filecoinMessage);
		const signedMessage = handleErrors(
			await ledgerApp.sign(
				`m/44'/${process.env.FILECOIN_COIN_TYPE}'/0'/0/${indexAccount ?? '0'}`,
				Buffer.from(serializedMessage, 'hex'),
			),
		);
		return await generateSignedMessage(filecoinMessage, signedMessage);
	};

	const verifyAPI = createVerifyAPI(sign, getAccounts);

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
			setLoaderText('Signing transactions');
			const verifyAPI = createVerifyAPI(sign, getAccounts);

			ledgerApp.getAccounts = async () => {
				const paths = [];

				for (let i = 0; i < parseInt(numberOfWalletAccounts); i += 1) {
					paths.push(`m/44'/${lotusNodeCode}'/0'/0/${i}`);
				}

				const accounts = await mapSeries(paths, async (path: string) => {
					const returnLoad = await ledgerApp.getAddressAndPubKey(path);
					const {addrString} = handleErrors(returnLoad);
					return addrString;
				});
				return accounts;
			};
			const client = await verifyAPI.actorAddress(clientAddress);

			if (!msigTxId) {
				setLoaderText('Please approve the transaction on Ledger');
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
				setLoaderText('Checking transaction state');
				await verifyAPI.stateWaitMessage(txCid); // wait for tx to get confirmed
				await addRootKeySignatures({
					txCid,
					clientAddress,
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
						from: await verifyAPI.actorAddress(txFrom), // ID of account that sent proposeRemoveDataCap - a.k.a. first root key holder to sign
						...removeDatacapRequest,
					},
				};
				setLoaderText('Please approve the transaction on Ledger');
				const approveId = await verifyAPI.approvePending(
					'f080',
					msigTx,
					indexAccount,
					ledgerApp,
					currentAccount,
				);
				setLoaderText('Checking transaction state');
				const responseData = await verifyAPI.stateWaitMessage(approveId);

				if (
					responseData?.ReturnDec?.Applied === true &&
					responseData?.ReturnDec?.Code === 0
				) {
					await addRootKeySignatures({
						clientAddress,
						txCid: approveId,
					});
				}
			}
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
		} catch (e: any) {
			if (e.code === 21781) {
				showPopup(
					<ErrorLoadingLedger />,
					'Error loading data from Ledger device',
				);
			} else {
				showPopup(
					<span>Problem with signing transaction.</span>,
					'Error signing transaction',
				);
			}

			console.error('error', e.stack);
		} finally {
			setisLoadingFalse();
		}
	};

	const actorAddress = async (address: string) => {
		const id = await verifyAPI.actorAddress(address);
		return 'f' + id.substring(1);
	};

	return {
		actorAddress,
		getAccounts,
		sign,
		submitRemoveDataCap,
	};
};

export default useLedgerWallet;
