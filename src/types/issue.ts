export type Issue = {
	id: number;
	url: string;
	number: number;
	state: string;
	title: string;
	// That's how github octokit types it, not my problem
	// eslint-disable-next-line @typescript-eslint/ban-types
	body?: string | null | undefined;
};
