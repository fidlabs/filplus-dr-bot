import {createClient} from 'redis';
import * as dotenv from 'dotenv';
import {postIssue} from './postIssue.js';
import { LotusApi } from '../../lib/LotusApi.js';
import { Message } from 'filecoin.js/builds/dist/providers/Types.js';
import * as filecoinAddress from '@glif/filecoin-address';
import { decode as decodeCbor } from '@ipld/dag-cbor';

dotenv.config();

const redisUrl = process.env.REDIS_URL!;
const glifUrl = process.env.GLIF_URL ?? 'https://api.node.glif.io/rpc/v0';
const glifToken = process.env.GLIF_TOKEN;
const redisDatacapAddressesSet = 'datacap-addresses';

type BodyRootKey = {
	clientAddress: string;
	txCid: string;
};

function bytesToBig(p: Uint8Array): bigint {
	let acc = BigInt(0);
	for (let i = 0; i < p.length; i++) {
		acc *= BigInt(256);
		acc += BigInt(p[i]);
	}
	return acc;
}

const encodeAddress = (bytes: Uint8Array) => filecoinAddress.encode('f', new filecoinAddress.Address(bytes));

const handleFirstSignature = async (declaredClientAddress: string, api: LotusApi, msg: Message, msgReturn: any) => {
	const proposalRaw: [Buffer, Buffer, number, string] = decodeCbor(Buffer.from(msg.Params, 'base64'));

	if (!Array.isArray(proposalRaw) || proposalRaw.length != 4)
		throw new Error("Invalid data of proposed message");

	const proposal = {
		to: encodeAddress(proposalRaw[0]),
		amount: proposalRaw[1],
		method: proposalRaw[2],
		params: proposalRaw[3],
	};

	if (proposal.to != "f06")
		throw new Error("Proposed message isn't to Verifreg");

	if (proposal.amount.length != 0)
		throw new Error("Proposed message transfers some FIL!");

	if (proposal.method != 7)
		throw new Error("Proposed message method isn't removeVerifiedClientDataCap");

	const params: any = decodeCbor(Buffer.from(proposal.params, 'base64'));

	if(!Array.isArray(params) || params.length != 4)
		throw new Error("Invalid remove params");

	const parsedProposal = {
		clientId: await api.addressId(encodeAddress(params[0])),
		amountToRemove: bytesToBig(params[1]),
		notary1: await api.addressId(encodeAddress(params[2][0])),
		signature1: Buffer.from(params[2][1]).toString('hex'),
		notary2: await api.addressId(encodeAddress(params[3][0])),
		signature2: Buffer.from(params[3][1]).toString('hex'),
	}
	const clientAddress = await api.address(parsedProposal.clientId);
	if (clientAddress != declaredClientAddress)
		throw new Error("Client address mismatch");

	const client = await createClient({url: redisUrl}).connect();
	const expectedRaw = await client.hGetAll(clientAddress);

	if (parsedProposal.amountToRemove !== BigInt(expectedRaw.allocation))
		throw new Error("Proposed datacap amount to remove doesn't match");

	if (parsedProposal.notary1 !== expectedRaw.notary1)
		throw new Error("Notary1 mismatch");

	if (parsedProposal.notary2 !== expectedRaw.notary2)
		throw new Error("Notary2 mismatch");

	if (parsedProposal.signature1 !== expectedRaw.signature1)
		throw new Error("signature1 mismatch");

	if (parsedProposal.signature2 !== expectedRaw.signature2)
		throw new Error("signature2 mismatch");

	await client.hSet(clientAddress, {
		msigTxId: msgReturn.TxnID,
		txFrom: await api.addressId(msg.From)
	});

	const issueGov = await client.hGet(clientAddress, 'issueGov');
	await client.disconnect();
	await postIssue({
		issueNumber: issueGov!,
		txFrom: msg.From,
		isLastComment: false,
		msigTxId: msgReturn.TxnID,
	});
}

const handleSecondSignature = async (clientAddress: string, msg: Message, msgReturn: any) => {
	if (!msgReturn.Applied)
		throw new Error("Approve didn't apply the tx");

	//if (msgReturn.Code !== 0)
	//	throw new Error("Removal failed"); // FIXME we should probably reset the process, as maybe the sigs got outdated?

	const params = decodeCbor(Buffer.from(msg.Params, 'base64'));

	if(!Array.isArray(params) || params.length < 1)
		throw new Error("Invalid remove params");

	const client = await createClient({url: redisUrl}).connect();
	const expectedMsigId = await client.hGet(clientAddress, 'msigTxId');
	const approvedMsigId = params[0];

	if (!expectedMsigId || approvedMsigId != parseInt(expectedMsigId))
		throw new Error("Approve for unexpected multisig transaction");

	const issueGov = await client.hGet(clientAddress, 'issueGov');

	await client.hSet(clientAddress, {
		isFinished: "true",
		rootKeyAddress2: msg.From,
	});
	await client.disconnect();

	await postIssue({
		issueNumber: issueGov!,
		txFrom: msg.From,
		isLastComment: true,
		msigTxId: expectedMsigId,
	});
}

export const postRootKeySignatures = async (
	body: BodyRootKey,
) => {
	const {clientAddress, txCid} = body;

	const lotusApi = new LotusApi(glifUrl, glifToken);
	const { Receipt, ReturnDec } = await lotusApi.waitMsg(txCid);
	const msg = await lotusApi.getMsg(txCid);

	if (msg.To != "f080" && msg.To != "t080")
		throw new Error("Not root multisig TX");

	if (Receipt.ExitCode != 0)
		throw new Error("Tx failed onchain");


	if (msg.Method === 3) {
		// approve
		await handleSecondSignature(clientAddress, msg, ReturnDec);
	} else if (msg.Method === 2) {
		// propose
		await handleFirstSignature(clientAddress, lotusApi, msg, ReturnDec);
	} else {
		throw new Error("Not propose or approve method");
	}
};

export const getClientWithBothSignatures = async () => {
	const client = await createClient({url: redisUrl}).connect();
	const members = await client.sMembers(redisDatacapAddressesSet);
	const clientWithBothSignatures = await Promise.all(
		members.map(async (member) => {
			const filecoinClient = await client.hGetAll(member);
			const checkIfSignature
				= filecoinClient.signature1 && filecoinClient.signature2;
			if (checkIfSignature && filecoinClient.isFinished !== "true") {
				return {...filecoinClient, member};
			}
		}),
	);
	const filteredClientWithBothSignatures = clientWithBothSignatures.filter(
		(item) => item,
	);
	await client.disconnect();
	return filteredClientWithBothSignatures;
};
