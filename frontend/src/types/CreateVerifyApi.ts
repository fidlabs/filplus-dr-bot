import {LotusMessage} from './TransactionRaw';

export type Sign = (
	filecoinMessage: LotusMessage,
	indexAccount?: number,
) => Promise<string>;