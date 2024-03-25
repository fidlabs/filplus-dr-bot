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
	TableContainer,
	Table,
} from '@mui/material';
import {DeviceContext} from '../Context/DeviceContext';

const headers = [
	'Client Name',
	'Client Address',
	'Removed Datacap',
	'Github Link',
	'Signatures',
	'',
];

const RootList = () => {
	const [pendingIssues, setPendingIssues] = useState<DataCap[]>([]);
	const {currentAccount} = useContext(DeviceContext);
	const {submitRemoveDataCap, actorAddress} = useLedgerWallet();
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

  return (
    <TableContainer>
      <Table>
        <TableHead>
          <TableRow>
            {headers.map((header, index) => (
              <TableCell key={header + index} align="center">
                {header}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {pendingIssues.map((pendingIssue, index) => {
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
            const submitRemoveData = {
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

            if (stale !== 'true') return null;

            const isAlreadySignByUser = txFrom === currentId;
            return (
              <TableRow key={index}>
                <TableCell align="center">{clientName}</TableCell>
                <TableCell align="center">{member}</TableCell>
                <TableCell align="center">{allocation}</TableCell>
                <TableCell align="center">
                  <a href={linkIssueGov}>Issue Link</a>
                </TableCell>
                <TableCell align="center">{txFrom ? '1/2' : '0/2'}</TableCell>
                <TableCell align="center">
                  <Button
                    disabled={isAlreadySignByUser}
                    variant="contained"
                    onClick={() =>
                      !isAlreadySignByUser && onSignRemoveDataCap(submitRemoveData)
                    }
                  >
                    {isAlreadySignByUser ? 'Already Signed' : 'Sign'}
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default RootList;
