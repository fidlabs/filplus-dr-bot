import {useEffect, useState} from 'react';
import Button from '@mui/material/Button';
import {commentIssueWithSign, getDataCaps} from '../../api';
import {DataCap} from '../../types/DataCap';

const ListItems = () => {
	const [dataCaps, setDataCaps] = useState<DataCap[] | null>(null);

	useEffect(() => {
		getDataCaps().then((response) => {
			setDataCaps(response.dataCaps);
		});
	}, []);

	if (!dataCaps) return;
	return (
		<div>
			{dataCaps.map((datacap) => {
				return (
					<div key={datacap.member} style={{display: 'flex', gap: '50px'}}>
						<span>{datacap.member}</span>
						<Button
							variant="contained"
							onClick={() => commentIssueWithSign(datacap.issue)} // TODO - HERE SHOULD BE SIGN, after sign method, should be comment on github with this sign
						>
							Sign
						</Button>
					</div>
				);
			})}
		</div>
	);
};

export default ListItems;
