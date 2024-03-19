import {type Octokit} from '@octokit/rest';
import {type Issue} from '../types/issue.js';
import {type DataCapRequest} from '../types/request.js';
import {remark} from 'remark';
import {
	type Heading,
	type Text,
	Node,
	PhrasingContent,
	type RootContent,
	type Blockquote,
	BlockContent,
	type Paragraph,
} from 'mdast';

export const processIssue = async (
	octokit: Octokit,
	issue: Issue,
): Promise<DataCapRequest | undefined> => {
	try {
		let dca: DataCapRequest | undefined;
		const comments = await octokit.paginate(octokit.rest.issues.listComments, {
			owner: process.env.OWNER!,
			repo: process.env.REPO!,
			// eslint-disable-next-line @typescript-eslint/naming-convention
			issue_number: issue.number,
			// eslint-disable-next-line @typescript-eslint/naming-convention
			per_page: 100,
		});
		for (const comment of comments) {
			if (comment.user?.login !== process.env.COMMENT_AUTHOR) {
				continue;
			}

			const md = remark.parse(comment.body);

			if (md.children[0].type === 'heading') {
				const heading: Heading = md.children[0];
				if (heading.depth === 2) {
					const [, ...props] = md.children;
					const newReq = parseComment(heading, props);
					// eslint-disable-next-line max-depth
					if (newReq) {
						dca = newReq;
						dca.issueNumber = issue.number;
					}
				}
			}
		}
		return dca;
	} catch (e) {
		console.error(e);
		return undefined;
	}
};

const parseComment = (
	comment: Heading,
	props: RootContent[],
): DataCapRequest | undefined => {
	if (comment.children[0].type === 'text') {
		const text: Text = comment.children[0];
		if (text.value === 'DataCap Allocation requested') {
			return parseDataCapRequest(props);
		}
	}

	return undefined;
};

const parseDataCapRequest = (
	children: RootContent[],
): DataCapRequest | undefined => {
	const map = new Map<string, string>();
	if (children.length % 2 !== 0) {
		children.shift();
	}

	const propCount = children.length / 2;
	for (let i = 0; i < propCount; i++) {
		const key = children[i * 2];
		if (key.type === 'heading') {
			const value: Blockquote = children[i * 2 + 1] as Blockquote;
			const k: Heading = key;
			const paragraph = value.children[0] as Paragraph;
			if (paragraph.type === 'paragraph') {
				map.set(
					(k.children[0] as Text).value,
					(paragraph.children[0] as Text).value,
				);
			} else {
				console.log('invalid case:');
				console.log(children);
			}
		}
	}

	const request: DataCapRequest = {
		address: map.get('Client address')!,
		id: map.get('Id')!,
		signerAddress: map.get('Multisig Notary address')!,
		issueNumber: 0,
	};
	return request;
};

export const parseClientName = async (
	octokit: Octokit,
	issueNumber: number,
): Promise<string> => {
	const issue = await octokit.rest.issues.get({
		owner: process.env.OWNER!,
		repo: process.env.REPO!,
		// eslint-disable-next-line @typescript-eslint/naming-convention
		issue_number: issueNumber,
	});
	const md = remark.parse(issue.data.body ?? '');
	const root = md.children[1] as Heading;
	const paragraph = root.children[0] as any as Text;
	return paragraph.value.trim();
};
