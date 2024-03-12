import {useEffect, useState} from 'react';
import {mapSeries} from 'bluebird';
import {handleErrors} from '../functions/handleErrors';
import {FilecoinApp} from '@zondax/ledger-filecoin';

const getAccounts = async (ledgerApp: FilecoinApp) => {
	const paths = [];
	for (let i = 0; i < import.meta.env.VITE_NUMBER_OF_WALLET_ACCOUNTS; i += 1) {
		paths.push(`m/44'/${import.meta.env.VITE_LOTUS_NODE_CODE}'/0'/0/${i}`);
	}
	const accounts = await mapSeries(paths, async (path: any) => {
		const returnLoad = await ledgerApp.getAddressAndPubKey(path);
		console.log(returnLoad)
		const {addrString} = handleErrors(returnLoad);
		return addrString;
	});
	return accounts;
};

const useAccounts = (ledgerApp: FilecoinApp) => {
	const [indexAddress, setIndexAddress] = useState<null | number>(null);
	const [activeAccount, setActiveAccount] = useState<any>(null);
	const [accounts, setAccounts] = useState<any>(null);

	const selectAccount = (index: number) => {
		setIndexAddress(index);
		setActiveAccount(accounts[index]);
	};

	useEffect(() => {
		getAccounts(ledgerApp).then((accounts) => {
			setAccounts(accounts);
		});
	}, [ledgerApp]);
	return {
		indexAddress,
		accounts,
		setIndexAddress,
		selectAccount,
		activeAccount,
	};
};

export default useAccounts;
