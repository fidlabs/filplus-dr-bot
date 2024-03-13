import {createContext, useState} from 'react';
import TransportWebUSB from '@ledgerhq/hw-transport-webusb';
import FilecoinApp from '@zondax/ledger-filecoin';
import {mapSeries} from 'bluebird';
import {handleErrors} from '../../functions/handleErrors';
import {DeviceContextType, DeviceProviderProps} from './DeviceTypes';

const DeviceContext = createContext<DeviceContextType>({
	ledgerApp: null,
	loadLedgerData: () => {}, // Default empty function
	currentAccount: null,
	indexAccount: 0,
	setIndexAccount: () => {},
	accounts: null,
	changeAccount: () => {},
});
const DeviceProvider = ({children}: DeviceProviderProps) => {
	const [ledgerApp, setLedgerApp] = useState<FilecoinApp | null>(null);
	const [currentAccount, setCurrentAccount] = useState<string | null>(null);
	const [indexAccount, setIndexAccount] = useState<number>(0);
	const [accounts, setAccounts] = useState<string[] | null>(null);

	const getAccounts = async (ledgerApp: FilecoinApp) => {
		const paths = [];
		for (
			let i = 0;
			i < Number(import.meta.env.VITE_NUMBER_OF_WALLET_ACCOUNTS);
			i += 1
		) {
			paths.push(`m/44'/${import.meta.env.VITE_LOTUS_NODE_CODE}'/0'/0/${i}`);
		}
		const accounts = await mapSeries(paths, async (path: string) => {
			const returnLoad = await ledgerApp.getAddressAndPubKey(path);
			const {addrString} = handleErrors(returnLoad);
			return addrString;
		});
		return accounts;
	};

	const loadLedgerData = async () => {
		try {
			const transport = await TransportWebUSB.create();
			const app = new FilecoinApp(transport);
			setLedgerApp(app);
			const accounts = await getAccounts(app);
			console.log(accounts)
			setAccounts(accounts)
			setCurrentAccount(accounts[indexAccount]);
		} catch (error) {
			console.error('Error loading data from Ledger device:', error);
		}
	};

	const changeAccount = (account: string, index : number) => {
		setCurrentAccount(account);
		setIndexAccount(index);
	}

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
