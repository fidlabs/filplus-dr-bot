import React, {useContext, useEffect, useState} from 'react';
import {DataCap} from '../../types/DataCap';
import {getPendingIssues} from '../../api';
import useLedgerWallet from '../../hooks/useLedgerWallet';
import {SubmitRemoveData} from '../../types/SubmitRemoveDataCap';
import {
	TableCell,
	TableRow,
	TableHead,
	Button,
	TableBody,
	Box,
} from '@mui/material';
import {DeviceContext} from '../Context/DeviceContext';

const RootList = () => {
	const [pendingIssues, setPendingIssues] = useState<DataCap[]>([]);
	const {submitRemoveDataCap, actorAddress} = useLedgerWallet();
	const {currentAccount} = useContext(DeviceContext);
	const [currentId, setCurrentId] = useState<string | null>(null);

	useEffect(() => {
		getNotaryList();
	}, []);
	useEffect(() => {
		setCurrentId(null);
		(async () => {
			if(currentAccount)
				setCurrentId(await actorAddress(currentAccount));
		})()
	}, [currentAccount]);

	const getNotaryList = async () => {
		const issues = await getPendingIssues();
		setPendingIssues(issues);
	};
	const onSignRemoveDataCap = async (submitRemoveData: SubmitRemoveData) => {
		await submitRemoveDataCap(submitRemoveData);
		await getNotaryList();
	};
	if (!pendingIssues) {
		return <div>Loading...</div>;
	}

	if (pendingIssues.length < 1) {
		return <div>No issues found...</div>;
	}

	const cellStyle = {border: 'none'};
	return (
		<Box>
			<TableHead>
				<TableRow style={{display: 'flex', gap: '50px'}}>
					<TableCell style={cellStyle}>Client Name</TableCell>
					<TableCell style={cellStyle}>Client Address</TableCell>
					<TableCell style={cellStyle}>Removed Datacap</TableCell>
					<TableCell style={cellStyle}>Github Link</TableCell>
					<TableCell style={cellStyle}>Signatures</TableCell>
				</TableRow>
			</TableHead>
			<TableBody>
				{pendingIssues.map((pendingIssue) => {
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
						clientName,
						linkIssueGov,
					} = pendingIssue;
					const submitRemoveData: SubmitRemoveData = {
						allocation: BigInt(allocation),
						sig1: signature1 || '',
						notary1: notary1 || '',
						notary2: notary2 || '',
						sig2: signature2 || '',
						txFrom,
						msigTxId,
						clientAddress: member,
						issue,
					};

					if (stale !== 'true') return;
					const isAlreadySignByUser = txFrom === currentId;
					return (
						<TableRow
							key={member + allocation}
							style={{display: 'flex', gap: '50px'}}
						>
							<TableCell style={cellStyle}>{clientName}</TableCell>
							<TableCell style={cellStyle}>{member}</TableCell>
							<TableCell style={cellStyle}>{allocation}</TableCell>
							<TableCell style={cellStyle}>
								<a href={linkIssueGov}>Issue Link</a>
							</TableCell>
							<TableCell style={cellStyle}>{txFrom ? '1/2' : '0/2'}</TableCell>
							<TableCell style={cellStyle}>
								<Button
									disabled={isAlreadySignByUser}
									variant="contained"
									onClick={() =>
										!isAlreadySignByUser &&
										onSignRemoveDataCap(submitRemoveData)
									}
								>
									{isAlreadySignByUser ? 'Already Signed' : 'Sign'}
								</Button>
							</TableCell>
						</TableRow>
					);
				})}
			</TableBody>
		</Box>
	);
};

export default RootList;
