import { decode } from '@ipld/dag-cbor';
import { parseAddress } from '@zondax/filecoin-signing-tools/js';
import { HttpJsonRpcConnector, LotusClient } from 'filecoin.js';
import { Message, MsgLookup } from 'filecoin.js/builds/dist/providers/Types.js';

function isEqualByteArray(a: Uint8Array, b: Uint8Array): boolean {
    if (a.length != b.length) return false;

    for (let i = 0; i < a.length; i++)
        if (a[i] !== b[i])
            return false;

    return true;
}

export class LotusApi {
    client: LotusClient

    constructor(url: string, token?: string) {
        const httpConnector = new HttpJsonRpcConnector({ url, token });
        this.client = new LotusClient(httpConnector);
    }

    async addressId(address: string): Promise<string> {
        const id = await this.client.state.lookupId(address);
        return 'f' + id.substring(1);
    }

    async address(id: string): Promise<string> {
        const addr = await this.client.state.accountKey(id);
        return 'f' + addr.substring(1);
    }

    async getProposalId(verifierAddress: string, clientAddress: string): Promise<number> {
        const verifierId = parseAddress(await this.addressId(verifierAddress));
        const clientId = parseAddress(await this.addressId(clientAddress));
        const key = Buffer.concat([verifierId, clientId])
        const state = await this.client.state.readState('f06');
        const idsCid: { "/": string } = state.State.RemoveDataCapProposalIDs;
        const rawIds = await this.client.chain.readObj(idsCid);
        const decoded: [any, Array<Array<[Uint8Array, [number]]>>] = decode(Buffer.from(rawIds, 'base64'));
        const allEntries = decoded[1].flatMap((entry) => entry);
        const matchedEntry = allEntries.find(([entry_key]) => isEqualByteArray(entry_key, key))
        if (!matchedEntry) return 0;
        return matchedEntry[1][0];
    }

    async getVerifiedClientStatus(clientAddress: string): Promise<bigint> {
        const datacap = await this.client.state.verifiedClientStatus(clientAddress);
        return BigInt(datacap ?? 0);
    }

    async getVerifierStatus(address: string): Promise<bigint | null> {
        const status = await this.client.state.verifierStatus(address)
        return status !== null ? BigInt(status) : null;
    }

    async getMsg(cid: string): Promise<Message> {
        return this.client.chain.getMessage({"/": cid});
    }

    async waitMsg(cid: string): Promise<MsgLookup> {
        return this.client.state.waitMsg({ "/": cid }, 1);
    }
}