// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const generateSignedMessage = async (filecoinMessage: any, signedMessage: any) => {

  return JSON.stringify({
    Message: {
      From: filecoinMessage.from,
      GasLimit: filecoinMessage.gaslimit,
      GasFeeCap: filecoinMessage.gasfeecap,
      GasPremium: filecoinMessage.gaspremium,
      Method: filecoinMessage.method,
      Nonce: filecoinMessage.nonce,
      Params: Buffer.from(filecoinMessage.params, "hex").toString(
        "base64"
      ),
      To: filecoinMessage.to,
      Value: filecoinMessage.value,
    },
    Signature: {
      Data: signedMessage.signature_compact.toString('base64'),
      Type: 1
      //Type: signedMessage.signature.type,
    },
  });
}