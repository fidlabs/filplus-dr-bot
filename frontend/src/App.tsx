import './App.css';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import {useContext} from 'react';
import {DeviceContext} from './context/DeviceContext';
import ListItems from './components/ListItems';

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
				sx={{border: '2px solid grey'}}
			>
				{ledgerApp ? (
					<Box
						my={4}
						display="flex"
						flexDirection="column"
						alignItems="center"
						gap={4}
						p={20}
						sx={{border: '2px solid grey'}}
					>
						<Button variant="contained" onClick={loadLedgerData}>
							Connect wallet
						</Button>
					</Box>
				) : (
					<ListItems />
				)}
			</Box>
		</div>
	);
}

export default App;
