import {transactionSerialize} from '@zondax/filecoin-signing-tools/js';
import {Buffer} from 'buffer';

// const generateSignedMessage = async (
// 	filecoinMessage: any,
// 	signedMessage: any,
// ) => {
// 	return JSON.stringify({
// 		Message: {
// 			From: filecoinMessage.from,
// 			GasLimit: filecoinMessage.gaslimit,
// 			GasFeeCap: filecoinMessage.gasfeecap,
// 			GasPremium: filecoinMessage.gaspremium,
// 			Method: filecoinMessage.method,
// 			Nonce: filecoinMessage.nonce,
// 			Params: Buffer.from(filecoinMessage.params, 'hex').toString('base64'),
// 			To: filecoinMessage.to,
// 			Value: filecoinMessage.value,
// 		},
// 		Signature: {
// 			Data: signedMessage.signature_compact.toString('base64'),
// 			Type: 1,
// 			//Type: signedMessage.signature.type,
// 		},
// 	});
// };

export const signDataCap = async (ledgerApp: any) => {
	const lotusNodeCode = 44; // up it
	const indexAccount = 0;
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

	const signedMessage = await ledgerApp.sign(
		`m/44'/${lotusNodeCode}'/0'/0/${indexAccount}`,
		Buffer.from(filecoinMessage, 'hex'),
	);
	console.log(filecoinMessage);
	return signedMessage;
	// return generateSignedMessage(filecoinMessage, signedMessage);
};
