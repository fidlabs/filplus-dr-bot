import { Buffer } from 'buffer';
import TransportWebUSB from '@ledgerhq/hw-transport-webusb';
import FilecoinApp from '@zondax/ledger-filecoin';
import { transactionSerialize } from '@zondax/filecoin-signing-tools/js';


const connectWallet = async () => {
  try {
    const transport = await TransportWebUSB.create();
    const ledgerApp = new FilecoinApp(transport);
    const filecoinMessage = transactionSerialize({
      To: 'f02838320',
      From: 'f02838320',
      Nonce: 0,
      Value: '6432423432432',
      GasLimit: 10000000,
      GasFeeCap: '10000000',
      GasPremium: '10000000',
      Method: 1,
      Params: '',
    });
    //   export type TransactionRaw = {
    //     To: string;
    //     From: string;
    //     Nonce: number;
    //     Value: string;
    //     GasLimit: number;
    //     GasFeeCap: string;
    //     GasPremium: string;
    //     Method: number;
    //     Params: string;
    // };
    //await this.ledgerApp.sign(`m/44'/${this.lotusNode.code}'/0'/0/${indexAccount}`, Buffer.from(serializedMessage, 'hex'))
    const signedMessage = await ledgerApp.sign(
      `m/44'/1'/0'/0/0`,
      Buffer.from(filecoinMessage, 'hex')
    );
    console.log(signedMessage);
  } catch (e) {
    console.log(e);
  }
};

const signRemoveDataCap = async () => {
  try {
    // const transport = await TransportWebUSB.create();
    // const ledgerApp = new FilecoinApp(transport);
    const filecoinMessage = transactionSerialize({
      To: 'f02838320',
      From: 'f02838320',
      Nonce: 0,
      Value: '6432423432432',
      GasLimit: 10000000,
      GasFeeCap: '10000000',
      GasPremium: '10000000',
      Method: 1,
      Params: '',
    });
    const verifiersWallet = { verifier_mnemonic, path };
    console.log(verifiersWallet);
    // const api = new VerifyAPI(
    //   VerifyAPI.standAloneProvider(endpointUrl, {
    //     token,
    //   }),
    //   verifiersWallet
    // );
    // console.log(api);
    // const api = new VerifyAPI(
    //   VerifyAPI.browserProvider(
    //     'https://node.glif.io/space06/lotus/rpc/v1',
    //     'dsa'
    //   ),
    //   ledgerApp
    // );
    // console.log(api);
    // const message = {
    //   VerifiedClient: idAddress,
    //   DataCapAmount: dataCapBytes,
    //   RemovalProposalID: 0, //hardcoding it to 0 for now
    // }
    return;
    const signedRemoveDataCap = await ledgerApp.signRemoveDataCap(
      `m/44'/1'/0'/0/0`,
      Buffer.from(filecoinMessage, 'hex')
    );
    console.log(signedRemoveDataCap);
  } catch (e) {
    console.log(e);
  }
};