import {useEffect, useState} from 'react';
import Button from '@mui/material/Button';
import {commentIssueWithSign, getDataCaps} from '../../api';
import {DataCap} from '../../types/DataCap';
import {SignRemoveDataCapMessage} from '../../types/TransactionRaw';
import useLedgerWallet from '../../hooks/useLedgerWallet';
import useBurnerWallet from '../../hooks/useBurnerWallet';

const NotaryList = () => {
	const [dataCaps, setDataCaps] = useState<DataCap[] | null>(null);
	const {ledgerApp, signRemoveDataCap} = useLedgerWallet();
	const { sign } = useBurnerWallet()

	useEffect(() => {
		getDataCaps().then((response) => {
			setDataCaps(response.dataCaps);
		});
	}, []);

	const onSignRemoveDataCap = async (
		signData: SignRemoveDataCapMessage,
		issue: string,
	) => {
		const signRemoveData = await signRemoveDataCap(signData);
		if (signRemoveData) {
			console.log(signRemoveData)
			await commentIssueWithSign(issue, signRemoveData.Signature);
		}
	};
	if (!dataCaps) return;
	return (
		<div>
			{dataCaps.map((dataCap) => {
				const {member, allocation, issue, stale} = dataCap;
				const signData: SignRemoveDataCapMessage = {
					verifiedClient: 't01004',
					dataCapAmount: allocation,
					removalProposalID: [0],
				}; // removalProposalID BRAK
				if (parseInt(stale) !== 1) return;
				return (
					<div key={member + allocation} style={{display: 'flex', gap: '50px'}}>
						<span>{member}</span>
						<span>{allocation}</span>
						<span>{issue}</span>
						<Button
							variant="contained"
							onClick={() => onSignRemoveDataCap(signData, issue)} // TODO - HERE SHOULD BE SIGN, after sign method, should be comment on github with this sign
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
