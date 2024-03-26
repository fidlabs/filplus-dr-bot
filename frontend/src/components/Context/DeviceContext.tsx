import React, {createContext, useContext, useState} from 'react';
import TransportWebUSB from '@ledgerhq/hw-transport-webusb';
import FilecoinApp from '@zondax/ledger-filecoin';
import {mapSeries} from 'bluebird';
import {handleErrors} from '../../functions/handleErrors';
import {DeviceContextType, ReactChildren} from './ContextTypes';
import {LoadingContext} from './LoaderContext';
import {PopupContext} from './PopupContext';
import {createVerifyAPI} from '../../functions/verifyApi';
import useLedgerWallet from '../../hooks/useLedgerWallet';
import ErrorLoadingLedger from '../Errors/ErrorLoadingLedger';

const DeviceContext = createContext<DeviceContextType>({
	ledgerApp: null,
	loadLedgerData: () => {}, // Default empty function
	currentAccount: null,
	indexAccount: 0,
	setIndexAccount: () => {},
	accounts: null,
	changeAccount: () => {},
});
const DeviceProvider = ({children}: ReactChildren) => {
	const {showPopup} = useContext(PopupContext);
	const {setisLoadingFalse, setisLoadingTrue, setLoaderText} =
		useContext(LoadingContext);
	const {getAccounts: getAccountsWallet, sign} = useLedgerWallet();
	const [ledgerApp, setLedgerApp] = useState<any>(null);
	const [currentAccount, setCurrentAccount] = useState<string | null>(null);
	const [indexAccount, setIndexAccount] = useState<number>(0);
	const [accounts, setAccounts] = useState<string[] | null>(null);
	const getAccounts = async (ledgerApp: any) => {
		const verifyAPI = createVerifyAPI(sign, getAccountsWallet);
		const rootkeys = await verifyAPI.listRootkeys();
		const rootKeysId = await Promise.all(
			rootkeys.map(async (item: string) => verifyAPI.actorKey(item)),
		);

		const paths = [];
		for (let i = 0; i < Number(process.env.NUMBER_OF_WALLET_ACCOUNTS); i += 1) {
			paths.push(`m/44'/${process.env.FILECOIN_COIN_TYPE}'/0'/0/${i}`);
		}
		const accountsPromises = await mapSeries(paths, async (path: string) => {
			const returnLoad = await ledgerApp.getAddressAndPubKey(path);
			const {addrString} = handleErrors(returnLoad);
			return addrString;
		});
		const accounts = await Promise.all(accountsPromises);

		const finalFilteredAccounts = accounts.filter((address) => {
			const sanitizedAddress = address.substring(1); // Remove the first character ('t' or 'f')
			return rootKeysId.some(
				(rootKey: string) => rootKey.substring(1) === sanitizedAddress,
			);
		});
		if (finalFilteredAccounts.length < 1) {
			showPopup(
				<div>
					Unfortunately, there is no address associated with your Ledger device
					that has root key permissions.
				</div>,
				'The root key address could not be found.',
			);
		}
		return finalFilteredAccounts;
	};

	const loadLedgerData = async () => {
		setisLoadingTrue();
		try {
			setLoaderText('Loading ledger device');
			const transport = await TransportWebUSB.create();
			const app = new FilecoinApp(transport);
			setLedgerApp(app);
			setLoaderText('Loading accounts');
			const accounts = await getAccounts(app);
			setAccounts(accounts);
			setCurrentAccount(accounts[indexAccount]);
		} catch (error) {
			showPopup(
				<ErrorLoadingLedger />,
				'Error loading data from Ledger device',
			);
			console.error('Error loading data from Ledger device:', error);
		}
		setisLoadingFalse();
	};

	const changeAccount = (account: string, index: number) => {
		setCurrentAccount(account);
		setIndexAccount(index);
	};

	return (
		<DeviceContext.Provider
			value={{
				ledgerApp,
				loadLedgerData,
				currentAccount,
				indexAccount,
				setIndexAccount,
				accounts,
				changeAccount,
			}}
		>
			{children}
		</DeviceContext.Provider>
	);
};

export {DeviceContext, DeviceProvider};
