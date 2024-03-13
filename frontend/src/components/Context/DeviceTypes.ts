import {ReactNode} from 'react';
import FilecoinApp from '@zondax/ledger-filecoin';

export type DeviceContextType = {
	ledgerApp: FilecoinApp | null;
	loadLedgerData: () => void; // Function to trigger data loading
	currentAccount: string | null;
	indexAccount: number;
	setIndexAccount: React.Dispatch<React.SetStateAction<number>>;
	accounts: string[] | null;
	changeAccount: (account: string, index: number) => void;
};

export type DeviceProviderProps = {
	children: ReactNode;
};
