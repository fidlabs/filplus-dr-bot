import FilecoinApp from '@zondax/ledger-filecoin';
import {transactionSerialize} from '@zondax/filecoin-signing-tools/js';
import {LotusMessage} from '../types/TransactionRaw';
import {handleErrors} from './handleErrors';

const generateSignedMessage = async (
	filecoinMessage: LotusMessage,
	signedMessage: any,
) => {
	return JSON.stringify({
		Message: {
			From: filecoinMessage.From,
			GasLimit: filecoinMessage.GasLimit,
			GasFeeCap: filecoinMessage.GasFeeCap,
			GasPremium: filecoinMessage.GasPremium,
			Method: filecoinMessage.Method,
			Nonce: filecoinMessage.Nonce,
			Params: Buffer.from(filecoinMessage.Params, 'hex').toString('base64'),
			To: filecoinMessage.To,
			Value: filecoinMessage.Value,
		},
		Signature: {
			Data: signedMessage.signature_compact.toString('base64'),
			Type: 1,
			//Type: signedMessage.signature.type,
		},
	});
};

export const sign = async (
	ledgerApp: FilecoinApp,
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
	indexAccount: number = 0,
) => {
	const serializedMessage = transactionSerialize(filecoinMessage);
	//await this.ledgerApp.sign(`m/44'/${this.lotusNode.code}'/0'/0/${indexAccount}`, Buffer.from(serializedMessage, 'hex'))
	const signedMessage = handleErrors(
		await ledgerApp.sign(
			`m/44'/${import.meta.env.VITE_LOTUS_NODE_CODE}'/0'/0/${indexAccount}`,
			Buffer.from(serializedMessage, 'hex'),
		),
	);
	return await generateSignedMessage(filecoinMessage, signedMessage);
};
