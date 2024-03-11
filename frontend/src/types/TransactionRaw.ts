export type LotusMessage = {
	To: string;
	From: string;
	Nonce: number;
	Value: string;
	GasPremium: string;
	GasLimit: number;
	GasFeeCap: string;
	Method: number;
	Params: string;
};

export type SignRemoveDataCapMessage = {
	verifiedClient: string; // idAddress
	dataCapAmount: string;
	removalProposalID: number[];
};
