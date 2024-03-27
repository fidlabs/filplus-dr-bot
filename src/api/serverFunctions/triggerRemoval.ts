import {type Response} from 'express';
import {createClient} from 'redis';
import * as dotenv from 'dotenv';
import { LocalWallet } from '../../lib/LocalWallet.js';
import { LotusApi } from '../../lib/LotusApi.js';

dotenv.config();

const redisDatacapAddressesSet = 'datacap-addresses';
const glifUrl = process.env.GLIF_URL ?? 'https://api.node.glif.io/rpc/v0';
const glifToken = process.env.GLIF_TOKEN;
const redisUrl = process.env.REDIS_URL!;
const mnemonic = process.env.MNEMONIC!;

const wallet = new LocalWallet(mnemonic);
const lotusApi = new LotusApi(glifUrl, glifToken);

export const triggerRemoval = async (addressRaw: string, res: Response) => {
	let address = await lotusApi.address(await lotusApi.addressId(addressRaw));
    let allocation;
    try {
     allocation = await lotusApi.getVerifiedClientStatus(address);
    } catch(e) {
        throw new Error("Couldn't fetch client info from chain");
    }

    if (allocation === BigInt(0))
        throw new Error("Client has no allocation");

    const sigs = await signNotaries(address, allocation);

	const redisClient = await createClient({url: redisUrl}).connect();
    await redisClient.hSet(address, {
        stale: "true",
        allocation: allocation.toString(10),
        ...sigs
    });
    await redisClient.sAdd(redisDatacapAddressesSet, [address]);
	await redisClient.disconnect();

	res.json({result: "OK"});
};

async function signNotaries(
	clientAddress: string,
	amount: bigint,
): Promise<{ notary1: string, notary2: string, signature1: string, signature2: string }> {
	const clientAddressId = await lotusApi.addressId(clientAddress);
	const notary1 = await lotusApi.addressId(wallet.getAddress(0));
	const proposalId1 = await lotusApi.getProposalId(notary1, clientAddressId);
	const signature1 = wallet.signRemoveDataCapProposal(
		0,
		clientAddressId,
		amount,
		proposalId1,
	);
	const notary2 = await lotusApi.addressId(wallet.getAddress(1));
	const proposalId2 = await lotusApi.getProposalId(notary2, clientAddressId);
	const signature2 = wallet.signRemoveDataCapProposal(
		1,
		clientAddressId,
		amount,
		proposalId2,
	);

	return {
		signature1,
		notary1,
		signature2,
		notary2,
	};
}