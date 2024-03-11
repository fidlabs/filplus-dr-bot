import './App.css';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import {useState} from 'react';
import NotaryList from './components/NotaryList';
import RootList from './components/RootList';
import useAccounts from './hooks/useAccounts';
import useLedgerWallet from './hooks/useLedgerWallet';
import {FilecoinApp} from '@zondax/ledger-filecoin';

enum ListState {
	NOTARY = 'notary',
	ROOT = 'root',
}

function Content({ledgerApp}: {ledgerApp: FilecoinApp}) {
	const {accounts, selectAccount, activeAccount} = useAccounts(ledgerApp);
	const [listState, setListState] = useState<ListState | null>(null);

	return (
		<div>
			<Button onClick={() => setListState(ListState.NOTARY)}>
				Choose Notary List
			</Button>
			<Button onClick={() => setListState(ListState.ROOT)}>
				Choose Root Key Holder List
			</Button>
			{accounts && (
				<select
					value={activeAccount}
					onChange={(e) => selectAccount(parseInt(e.target.value))}
				>
					{accounts.map((account) => (
						<option value={account}>{account}</option>
					))}
				</select>
			)}
			<div>
				{listState === ListState.NOTARY && <NotaryList />}
				{listState === ListState.ROOT && <RootList />}
			</div>
		</div>
	);
}

function App() {
	const {ledgerApp, loadLedger} = useLedgerWallet();
	return (
		<div>
			<Box
				my={4}
				display="flex"
				alignItems="center"
				justifyContent="center"
				gap={4}
				p={20}
				sx={{border: '2px solid grey'}}
			>
				{!ledgerApp ? (
					<Box
						my={4}
						display="flex"
						flexDirection="column"
						alignItems="center"
						gap={4}
						p={20}
						sx={{border: '2px solid grey'}}
					>
						<Button variant="contained" onClick={loadLedger}>
							Connect wallet
						</Button>
					</Box>
				) : (
					<Content ledgerApp={ledgerApp} />
				)}
			</Box>
		</div>
	);
}

export default App;
