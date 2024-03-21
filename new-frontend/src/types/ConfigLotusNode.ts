export type ConfigLotusNode = {
	name: string;
	code: number;
	url: string;
	token: string | undefined;
	notaryRepo: string;
	notaryOwner: string;
	rkhMultisig: string;
	rkhtreshold: number;
	largeClientRequestAssign: string[];
};
