import { transactionSerialize } from "@zondax/filecoin-signing-tools/js";
import { LotusMessage } from "../types/TransactionRaw";
import { generateSignedMessage } from "./generateSignMessage";
import { handleErrors } from "./handleErrors";
import FilecoinApp from '@zondax/ledger-filecoin';

export const sign = async (
  filecoinMessage: LotusMessage = {
    To: 'f02838320',
    From: 'f02838320',
    Nonce: 0,
    Value: '6432423432432',
    GasLimit: 10000000,
    GasFeeCap: '10000000',
    GasPremium: '10000000',
    Method: 1,
    Params: '',
  },
  // co z indexAccount?
  indexAccount?: number,
  ledgerApp: FilecoinApp
) => {
  const serializedMessage = transactionSerialize(filecoinMessage);
  //await this.ledgerApp.sign(`m/44'/${this.lotusNode.code}'/0'/0/${indexAccount}`, Buffer.from(serializedMessage, 'hex'))
  const signedMessage = handleErrors(
    await ledgerApp.sign(
      `m/44'/${import.meta.env.VITE_LOTUS_NODE_CODE}'/0'/0/${indexAccount ?? '0'}`,
      Buffer.from(serializedMessage, 'hex'),
    ),
  );
  return await generateSignedMessage(filecoinMessage, signedMessage);
};