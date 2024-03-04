export type Issue = {
	id: number;
	url: string;
	number: number;
	state: string;
	title: string;
	body?: string | undefined;
};
