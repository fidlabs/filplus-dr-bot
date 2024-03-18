export type SubmitRemoveData = {
  allocation: bigint;
  notary1: string;
  sig1: string;
  notary2: string;
  sig2: string;
  clientAddress: string;
  msigTxId?: string;
  txFrom?: string;
  issue?: string;
};