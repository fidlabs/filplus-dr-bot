import { Octokit } from "octokit";
import { Issue } from "./types/issue.js";
import { DataCapRequest } from "./types/request.js";
import { remark } from "remark";
import {
  Heading,
  Text,
  Node,
  PhrasingContent,
  RootContent,
  Blockquote,
  BlockContent,
  Paragraph,
} from "mdast";

export const processIssue = async (
  octokit: Octokit,
  issue: Issue
): Promise<DataCapRequest | null> => {
  try {
    let dca: DataCapRequest | null = null;
    let comments = await octokit.paginate(octokit.rest.issues.listComments, {
      owner: process.env.OWNER as string,
      repo: process.env.REPO as string,
      issue_number: issue.number,
      per_page: 100,
    });
    for (let comment of comments) {
      if (comment.user?.login !== process.env.COMMENT_AUTHOR) continue;
      let md = remark.parse(comment.body);

      if (md.children[0].type == "heading") {
        let heading: Heading = md.children[0];
        if (heading.depth == 2) {
          let [, ...props] = md.children;
          let newReq = parseComment(heading, props);
          if (newReq) {
            console.log("New Request");
            dca = newReq;
            dca.issueNumber = issue.number;
            console.log(comment.user?.login);
          }
        }
      }
    }
    console.log(dca);
    return dca;
  } catch (e) {
    console.error(e);
    return null;
  }
  return null;
};

const parseComment = (
  comment: Heading,
  props: RootContent[]
): DataCapRequest | null => {
  if (comment.children[0].type == "text") {
    let text: Text = comment.children[0];
    if (text.value === "DataCap Allocation requested") {
      return parseDataCapRequest(props);
    }
  }
  return null;
};

const parseDataCapRequest = (
  children: RootContent[]
): DataCapRequest | null => {
  let map = new Map<string, string>();
  if (children.length % 2 != 0) {
    children.shift();
  }
  let propCount = children.length / 2;
  for (let i = 0; i < propCount; i++) {
    let key = children[i * 2];
    if (key.type == "heading") {
      let value: Blockquote = children[i * 2 + 1] as any;
      let k: Heading = key;
      let paragraph = value.children[0] as Paragraph;
      if (paragraph.type == "paragraph") {
        map.set(
          (k.children[0] as Text).value,
          (paragraph.children[0] as Text).value
        );
      } else {
        console.log("invalid case:");
        console.log(children);
      }
    }
  }

  let request: DataCapRequest = {
    address: map.get("Client address") as string,
    id: map.get("Id") as string,
    signerAddress: map.get("Multisig Notary address") as string,
    issueNumber: 0,
  };
  return request;
};

export const parseClientName = async (
  octokit: Octokit,
  issueNumber: number
): Promise<string> => {
  let issue = await octokit.rest.issues.get({
    owner: process.env.OWNER as string,
    repo: process.env.REPO as string,
    issue_number: issueNumber,
  });
  let md = remark.parse(issue.data.body ?? "");
  let root = md.children[1] as Heading;
  let paragraph = root.children[0] as any as Text;
  return paragraph.value.trim();
};
