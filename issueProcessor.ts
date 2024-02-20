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
): Promise<DataCapRequest> => {
  let dca: DataCapRequest = {
    address: "",
    id: "",
    signerAddress: "",
  };
  let comments = await octokit.rest.issues.listComments({
    owner: "filecoin-project",
    repo: "filecoin-plus-large-datasets",
    issue_number: issue.number,
    per_page: 100,
  });
  console.log("Comments found: " + comments.data.length);
  for (let comment of comments.data) {
    let md = remark.parse(comment.body);

    if (md.children[0].type == "heading") {
      let heading: Heading = md.children[0];
      if (heading.depth == 2) {
        let [, ...props] = md.children;
        parseComment(heading, props, dca);
      }
    }
  }
  console.log(dca);
  return dca;
};

const parseComment = (
  comment: Heading,
  props: RootContent[],
  request: DataCapRequest
) => {
  if (comment.children[0].type == "text") {
    let text: Text = comment.children[0];
    if (text.value === "DataCap Allocation requested") {
      console.log("Request found");
      parseDataCapRequest(props, request);
    }
  }
};

const parseDataCapRequest = (
  children: RootContent[],
  request: DataCapRequest
) => {
  let propCount = children.length / 2;
  let map = new Map<string, string>();
  for (let i = 0; i < propCount; i++) {
    let key = children[i * 2];
    if (key.type == "heading") {
      let value: Blockquote = children[i * 2 + 1] as any;
      let k: Heading = key;
      map.set(
        (k.children[0] as Text).value,
        ((value.children[0] as Paragraph).children[0] as Text).value
      );
    }
  }

  request.address = map.get("Client address") as string;
  request.id = map.get("Id") as string;
  request.signerAddress = map.get("Multisig Notary address") as string;
};
