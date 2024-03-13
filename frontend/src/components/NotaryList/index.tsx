import {useEffect, useState} from 'react';
import Button from '@mui/material/Button';
import {addSignatures, commentIssueWithSign, getDataCaps} from '../../api';
import {DataCap} from '../../types/DataCap';
import {SignRemoveDataCapMessage} from '../../types/TransactionRaw';
import useLedgerWallet from '../../hooks/useLedgerWallet';
import useBurnerWallet from '../../hooks/useBurnerWallet';

const NotaryList = () => {
	const [dataCaps, setDataCaps] = useState<DataCap[] | null>(null);
	const {ledgerApp, signRemoveDataCap} = useLedgerWallet();
	const {sign} = useBurnerWallet();

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
		<div>
			{dataCaps.map((dataCap) => {
				const {member, allocation, issue, stale, signature1} = dataCap;
				const signData: SignRemoveDataCapMessage = {
					verifiedClient: 't01004',
					dataCapAmount: '1000',
					removalProposalID: [0],
					signature1,
				}; // removalProposalID BRAK
				if (parseInt(stale) !== 1) return;
				return (
					<div key={member + allocation} style={{display: 'flex', gap: '50px'}}>
						<span>{member}</span>
						<span>{allocation}</span>
						<span>{issue}</span>
						<Button
							variant="contained"
							onClick={() => onSignRemoveDataCap(signData)}
						>
							Sign
						</Button>
					</div>
				);
			})}
		</div>
	);
};

export default NotaryList;
