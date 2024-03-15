import { keyDerive, parseAddress, serializeBigNum } from '@zondax/filecoin-signing-tools/js';
import blake from 'blakejs'
import secp256k1 from 'secp256k1'
import * as cbor from '@ipld/dag-cbor'

export class LocalWallet {
  mnemonic: string;
  lotusNodeCode: number;

  constructor(mnemonic: string) {
    this.mnemonic = mnemonic;
    this.lotusNodeCode = 461; // FIXME take as parameter
  }

  private _getAccount(accountIndex: number) {
    const path = `m/44'/${this.lotusNodeCode}'/0/0/${accountIndex}`;
    const password = '';
    return keyDerive(this.mnemonic, path, password);
  }

  private _getDigest(msg: Buffer) {
    const blakeCtx = blake.blake2bInit(32);
    blake.blake2bUpdate(blakeCtx, msg)
    return blake.blake2bFinal(blakeCtx);
  }

  private _encodeProposal(clientAddressRaw: string, amountToRemoveRaw: bigint, proposalId: number) {
    const clientAddress = parseAddress(clientAddressRaw);
    const amountToRemove = serializeBigNum(amountToRemoveRaw.toString(10));
    const data = [
        clientAddress,
        amountToRemove,
        [proposalId]
    ];
    const encodedParams = Buffer.from(cbor.encode(data)).toString('hex');
    const prefix = Buffer.from('fil_removedatacap:').toString('hex');
    return Buffer.from(prefix + encodedParams, 'hex');
  }

  getAddress(accountIndex: number) {
    return this._getAccount(accountIndex).address;
  }

  signRemoveDataCapProposal(accountIndex: number, clientAddress: string, amountToRemove: bigint, proposalId: number = 0) {
    const account = this._getAccount(accountIndex);
    const proposal = this._encodeProposal(clientAddress, amountToRemove, proposalId);
    const digest = this._getDigest(proposal);
    const signature = secp256k1.ecdsaSign(digest, account.privateKey)
    const compact = Buffer.concat([Buffer.from(signature.signature), Buffer.from([signature.recid])])
    return '01' + compact.toString('hex')
  }
}