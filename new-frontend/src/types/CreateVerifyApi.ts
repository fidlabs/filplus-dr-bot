import { Signature } from './Signature';
import {LotusMessage} from './TransactionRaw';

export type Sign = (
	filecoinMessage: LotusMessage,
	indexAccount?: number,
) => Promise<{ Message: LotusMessage, Signature: Signature}>;