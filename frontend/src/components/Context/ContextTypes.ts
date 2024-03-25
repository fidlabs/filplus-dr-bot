import {ReactNode} from 'react';
// eslint-disable-next-line @typescript-eslint/no-explicit-any

export type DeviceContextType = {
	ledgerApp: any;
	loadLedgerData: () => void; // Function to trigger data loading
	currentAccount: string | null;
	indexAccount: number;
	setIndexAccount: React.Dispatch<React.SetStateAction<number>>;
	accounts: string[] | null;
	changeAccount: (account: string, index: number) => void;
};

export type ReactChildren = {
	children: ReactNode;
};

export type LoadingContextTypes = {
	isLoading: boolean,
	changeIsLoadingState: () => void,
	setisLoadingTrue: () => void,
	setisLoadingFalse: () => void,
	loaderText: string | null,
	setLoaderText: (text: string) => void,
}
