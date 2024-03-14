import {createContext, useContext, useState} from 'react';
import TransportWebUSB from '@ledgerhq/hw-transport-webusb';
import FilecoinApp from '@zondax/ledger-filecoin';
import {mapSeries} from 'bluebird';
import {handleErrors} from '../../functions/handleErrors';
import {DeviceContextType, ReactChildren} from './ContextTypes';
import {LoadingContext} from './LoaderContext';

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
	const {changeIsLoadingState} = useContext(LoadingContext);
	const [ledgerApp, setLedgerApp] = useState<FilecoinApp | null>(null);
	const [currentAccount, setCurrentAccount] = useState<string | null>(null);
	const [indexAccount, setIndexAccount] = useState<number>(0);
	const [accounts, setAccounts] = useState<string[] | null>(null);
	console.log(currentAccount);
	const getAccounts = async (ledgerApp: FilecoinApp) => {
		const paths = [];
		for (
			let i = 0;
			i < Number(import.meta.env.VITE_NUMBER_OF_WALLET_ACCOUNTS);
			i += 1
		) {
			paths.push(`m/44'/${import.meta.env.VITE_LOTUS_NODE_CODE}'/0'/0/${i}`);
		}
		const accountsPromises = await mapSeries(paths, async (path: string) => {
			const returnLoad = await ledgerApp.getAddressAndPubKey(path);
			const {addrString} = handleErrors(returnLoad);
			return addrString;
		});
		const accounts = await Promise.all(accountsPromises);
		return accounts;
	};

	const loadLedgerData = async () => {
		try {
			const transport = await TransportWebUSB.create();
			const app = new FilecoinApp(transport);
			setLedgerApp(app);
			changeIsLoadingState();
			const accounts = await getAccounts(app);
			setAccounts(accounts);
			changeIsLoadingState();
			setCurrentAccount(accounts[indexAccount]);
		} catch (error) {
			console.error('Error loading data from Ledger device:', error);
		}
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
