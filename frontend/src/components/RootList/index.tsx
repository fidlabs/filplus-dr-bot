import { useEffect, useState } from "react";
import { DataCap } from "../../types/DataCap";
import { getNotarySignatures } from "../../api";
import useLedgerWallet from "../../hooks/useLedgerWallet";
import { Button } from "@mui/material";
import { SubmitRemoveData } from "../../types/SubmitRemoveDataCap";

const RootList = () => {
	const [clientWithBothSignatures, setClientWithBothSignatures] = useState<DataCap[] | null>(null);
	const {submitRemoveDataCap} = useLedgerWallet();

	useEffect(() => {
		getNotarySignatures().then((response) => {
			setClientWithBothSignatures(response.clientWithBothSignatures);
		});
	}, []);
	const onSignRemoveDataCap = async (submitRemoveData: SubmitRemoveData) => {
		const signRemoveData = await submitRemoveDataCap(submitRemoveData);
    console.log(signRemoveData)
	};
	if (!clientWithBothSignatures || clientWithBothSignatures.length < 1) return;
	return (
		<div>
			{clientWithBothSignatures.map((clientWithBothSignatures) => {
				const {member, allocation, issue, stale, signature1, notary1, signature2, notary2, txFrom, msigTxId} = clientWithBothSignatures;
				const submitRemoveData: SubmitRemoveData = {
          allocation: Number(allocation),
          sig1: signature1 || '',
          notary1: notary1 || '',
          notary2 : notary2 || '',
          sig2: signature2 || '',
					txFrom,
          msigTxId,
          clientAddress: member,
				}; // removalProposalID BRAK

				if (parseInt(stale) !== 1) return;
				return (
					<div key={member + allocation} style={{display: 'flex', gap: '50px'}}>
						<span>{member}</span>
						<span>{allocation}</span>
						<span>{issue}</span>
						<Button
							variant="contained"
							onClick={() => onSignRemoveDataCap(submitRemoveData)}
						>
							Sign
						</Button>
					</div>
				);
			})}
		</div>
	);
};

export default RootList;