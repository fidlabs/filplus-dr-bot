import './App.css';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import {useContext, useState} from 'react';
import NotaryList from './components/NotaryList';
import RootList from './components/RootList';
// import useAccounts from './hooks/useAccounts';
import {DeviceContext} from './components/Context/DeviceContext';
import { IconButton, Typography } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

enum ListState {
	NOTARY = 'notary',
	ROOT = 'root',
}

function BoxWithButton({children, onClick}) {
	return (
		<Box
			onClick={onClick}
			className="container"
			sx={{
				display: 'flex',
				justifyContent: 'center',
				alignItems: 'center',
				width: 400,
				height: 400,
				border: '2px solid #1976d2',
				color: '#1976d2',
				transition: 'background-color 0.3s',
				'&:hover': {
					backgroundColor: '#1976d2',
					color: 'white',
				},
				cursor: 'pointer',
			}}
		>
			{children}
		</Box>
	);
}

function Content() {
	const [listState, setListState] = useState<ListState | null>(null);
	return (
		<>
			{!listState && (
				<>
					<BoxWithButton onClick={() => setListState(ListState.NOTARY)}>
						Choose Notary List
					</BoxWithButton>
					<BoxWithButton onClick={() => setListState(ListState.ROOT)}>
						Choose Root Key Holder List
					</BoxWithButton>
				</>
			)}
			{listState && (
				<div>
					<IconButton onClick={() => setListState(null)} color="inherit" aria-label="back">
						<ArrowBackIcon />
						<Typography variant="button">Back</Typography>
					</IconButton>
					{listState === ListState.NOTARY && <NotaryList />}
					{listState === ListState.ROOT && <RootList />}
				</div>
			)}
		</>
	);
}

function App() {
	const {loadLedgerData, ledgerApp} = useContext(DeviceContext);
	return (
		<div>
			<Box
				my={4}
				display="flex"
				alignItems="center"
				justifyContent="center"
				gap={4}
				p={20}
			>
				{!ledgerApp ? (
					<BoxWithButton onClick={loadLedgerData}>Connect wallet</BoxWithButton>
				) : (
					<Content />
				)}
			</Box>
		</div>
	);
}

export default App;
