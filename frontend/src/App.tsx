import './App.css';
import Box from '@mui/material/Box';
import {useContext} from 'react';
import {DeviceContext} from './components/Context/DeviceContext';
import BoxWithButton from './components/BoxWithButton';
import Content from './components/Content';

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
