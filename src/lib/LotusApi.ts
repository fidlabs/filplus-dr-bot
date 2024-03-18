import { decode } from '@ipld/dag-cbor';
import { parseAddress } from '@zondax/filecoin-signing-tools/js';
import { HttpJsonRpcConnector, LotusClient } from 'filecoin.js';

function isEqualByteArray(a: Uint8Array, b: Uint8Array): boolean {
    if (a.length != b.length) return false;

    for (let i = 0; i < a.length; i++)
        if (a[i] !== b[i])
            return false;

    return true;
}

export class LotusApi {
    client: LotusClient

    constructor(url: string, token: string) {
        const httpConnector = new HttpJsonRpcConnector({ url, token });
        this.client = new LotusClient(httpConnector);
    }

    async addressId(address: string): Promise<string> {
        return await this.client.state.lookupId(address);
    }

    async getProposalId(verifierAddress: string, clientAddress: string): Promise<number> {
        const verifierId = parseAddress(await this.addressId(verifierAddress));
        const clientId = parseAddress(await this.addressId(clientAddress));
        const key = Buffer.concat([verifierId, clientId])
        const state = await this.client.state.readState('f06');
        const idsCid: { "/": string } = state.State.RemoveDataCapProposalIDs;
        const rawIds = await this.client.chain.readObj(idsCid);
        const decoded: any = decode(Buffer.from(rawIds, 'base64'));
        const matchedEntry = decoded[1].find((entry: any) => isEqualByteArray(entry[0][0], key));
        if (!matchedEntry) return 0;
        return matchedEntry[0][1][0];
    }
}