import { LotusMessage } from "../types/TransactionRaw";

export const generateSignedMessage = async (
	filecoinMessage: LotusMessage,
	signedMessage: any,
) => {
	return {
		Message: {
			From: filecoinMessage.From,
			GasLimit: filecoinMessage.GasLimit,
			GasFeeCap: filecoinMessage.GasFeeCap,
			GasPremium: filecoinMessage.GasPremium,
			Method: filecoinMessage.Method,
			Nonce: filecoinMessage.Nonce,
			Params: filecoinMessage.Params,
			To: filecoinMessage.To,
			Value: filecoinMessage.Value,
		},
		Signature: {
			Data: signedMessage.signature_compact.toString('base64'),
			Type: 1,
			//Type: signedMessage.signature.type,
		},
	};
};