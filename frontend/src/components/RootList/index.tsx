import {useEffect, useState} from 'react';
import {DataCap} from '../../types/DataCap';
import {getNotarySignatures} from '../../api';
import useLedgerWallet from '../../hooks/useLedgerWallet';
import {SubmitRemoveData} from '../../types/SubmitRemoveDataCap';
import {TableCell, TableRow, TableHead, Button} from '@mui/material';

const RootList = () => {
	const [clientWithBothSignatures, setClientWithBothSignatures] = useState<
		DataCap[] | null
	>(null);
	const {submitRemoveDataCap} = useLedgerWallet();
	console.log(clientWithBothSignatures);
	useEffect(() => {
		getNotarySignatures().then((response) => {
			setClientWithBothSignatures(response.clientWithBothSignatures);
		});
	}, []);
	const onSignRemoveDataCap = async (submitRemoveData: SubmitRemoveData) => {
		const signRemoveData = await submitRemoveDataCap(submitRemoveData);
		console.log(signRemoveData);
	};
	if (!clientWithBothSignatures || clientWithBothSignatures.length < 1) return;
	return (
		<TableHead>
			{clientWithBothSignatures.map((clientWithBothSignatures) => {
				const {
					member,
					allocation,
					issue,
					stale,
					signature1,
					notary1,
					signature2,
					notary2,
					txFrom,
					msigTxId,
				} = clientWithBothSignatures;
				const submitRemoveData: SubmitRemoveData = {
					allocation: Number(2000),
					sig1: signature1 || '',
					notary1: notary1 || '',
					notary2: notary2 || '',
					sig2: signature2 || '',
					txFrom,
					msigTxId,
					clientAddress: member,
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
								onClick={() => onSignRemoveDataCap(submitRemoveData)}
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

export default RootList;
