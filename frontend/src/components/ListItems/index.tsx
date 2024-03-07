import {useContext, useEffect, useState} from 'react';
import Button from '@mui/material/Button';
import {signDataCap} from '../../functions/sign';
import {DeviceContext} from '../../context/DeviceContext';

const ListItems = () => {
	const [dataCaps, setDataCaps] = useState(null);
	const {ledgerApp} = useContext(DeviceContext);

	const fetchData = () => {
		fetch('http://localhost:3000/redis-data')
			.then((response) => {
				if (!response.ok) {
					throw new Error('Network response was not ok');
				}
				return response.json();
			})
			.then((data) => {
				setDataCaps(data);
				console.log('Data from Redis:', data);
			})
			.catch((error) => {
				console.error('There was a problem with your fetch operation:', error);
			});
	};

	useEffect(() => {
		fetchData();
	}, []);

	if (!dataCaps) return;
	return (
		<div>
			<Button variant="contained" onClick={() => signDataCap(ledgerApp)}>
				Connect wallet
			</Button>
			{dataCaps.datacaps.allocation}
		</div>
	);
};

export default ListItems;
