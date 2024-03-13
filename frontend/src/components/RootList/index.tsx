import { useEffect, useState } from "react";
import { DataCap } from "../../types/DataCap";
import { getNotarySignatures } from "../../api";
import useLedgerWallet from "../../hooks/useLedgerWallet";
import { Button } from "@mui/material";
import { SignRemoveDataCapMessage } from "../../types/TransactionRaw";

const RootList = () => {
	const [clientWithBothSignatures, setClientWithBothSignatures] = useState<DataCap[] | null>(null);
	const {submitRemoveDataCap} = useLedgerWallet();

	useEffect(() => {
		getNotarySignatures().then((response) => {
			setClientWithBothSignatures(response.clientWithBothSignatures);
		});
	}, []);

	const onSignRemoveDataCap = async () => {
		const signRemoveData = await submitRemoveDataCap();
		debugger;
		// await addSignatures(signRemoveData);
	};
	if (!clientWithBothSignatures) return;
	return (
		<div>
			{clientWithBothSignatures.map((clientWithBothSignatures) => {
				const {member, allocation, issue, stale, signature1} = clientWithBothSignatures;
				const signData: SignRemoveDataCapMessage = {
					verifiedClient: member,
					dataCapAmount: allocation,
					removalProposalID: [Number(issue)],
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
							onClick={() => onSignRemoveDataCap({})}
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