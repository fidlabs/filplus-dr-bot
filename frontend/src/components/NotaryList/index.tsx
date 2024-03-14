import {useEffect, useState} from 'react';
import {addSignatures, getDataCaps} from '../../api';
import {DataCap} from '../../types/DataCap';
import {SignRemoveDataCapMessage} from '../../types/TransactionRaw';
import useLedgerWallet from '../../hooks/useLedgerWallet';
import {TableCell, TableRow, TableHead, Button} from '@mui/material';

const NotaryList = () => {
	const [dataCaps, setDataCaps] = useState<DataCap[] | null>(null);
	const {signRemoveDataCap} = useLedgerWallet();
	useEffect(() => {
		getDataCaps().then((response) => {
			setDataCaps(response.dataCaps);
		});
	}, []);
	console.log(dataCaps);
	const onSignRemoveDataCap = async (signData: SignRemoveDataCapMessage) => {
		const signRemoveData = await signRemoveDataCap(signData);
		await addSignatures(signRemoveData);
	};
	if (!dataCaps) return;
	return (
		<TableHead>
			{dataCaps.map((dataCap) => {
				const {member, allocation, issue, stale, signature1} = dataCap;
				const signData: SignRemoveDataCapMessage = {
					verifiedClient: member,
					dataCapAmount: Number(2000),
					removalProposalID: [0],
					signature1,
				}; // removalProposalID BRAK
				if (parseInt(stale) !== 1) return;
				return (
					<TableRow
						key={member + allocation}
						style={{display: 'flex', gap: '50px'}}
					>
						<TableCell style={{border: 'none'}}>{member}</TableCell>
						<TableCell style={{border: 'none'}}>{allocation}</TableCell>
						<TableCell style={{border: 'none'}}>{issue}</TableCell>
						<TableCell style={{border: 'none'}}>
							<Button
								variant="contained"
								onClick={() => onSignRemoveDataCap(signData)}
							>
								Sign
							</Button>
						</TableCell>
					</TableRow>
				);
			})}
		</TableHead>
	);
};

export default NotaryList;
