import {SignRemoveDataCapMessage} from '../types/TransactionRaw';
import {createVerifyAPI} from './verifyApi';
import {FilecoinApp} from '@zondax/ledger-filecoin';

export const signRemoveDataCap = async (
	ledgerApp: FilecoinApp, // refactor
	message: SignRemoveDataCapMessage,
	indexAccount: number = 1,
) => {
	const verifyAPI = createVerifyAPI();
	const messageWithClientId: SignRemoveDataCapMessage = {
		...message,
		verifiedClient: await verifyAPI.actorAddress(message.verifiedClient),
	};
	const encodedMessage =
		verifyAPI.encodeRemoveDataCapParameters(messageWithClientId);
	const messageBlob = Buffer.from(encodedMessage.toString(), 'hex');
	const signedMessage = await ledgerApp.signRemoveDataCap(
		`m/44'/${import.meta.env.VITE_LOTUS_NODE_CODE}'/0'/0/${indexAccount}`,
		messageBlob,
	);
	console.log('signedMessage', signedMessage);
	const ts_compact = signedMessage.signature_compact.toString('hex');
	const ts_der = signedMessage.signature_der.toString('hex');
	console.log({
		ts_compact,
		ts_der,
		signedMessage,
	});
	return `01${ts_compact}`;
};
