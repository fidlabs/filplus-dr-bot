import { Octokit } from "octokit";
import { Issue } from "./issue";

export type GrantedRequest = {
  allocation: string;
  address: string;
  id: string;
  signerAddress: string;
};

export const processIssue = async (
  octokit: Octokit,
  issue: Issue
): Promise<GrantedRequest> => {
  let req: GrantedRequest = {
    allocation: "",
    address: "",
    id: "",
    signerAddress: "",
  };
  let comments = await octokit.rest.issues.listComments({
    owner: "filecoin-project",
    repo: "filecoin-plus-large-datasets",
    issue_number: issue.number,
    per_page: 50,
  });
  console.log("Comments found: " + comments.data.length);
  for (let comment of comments.data) {
    if (comment.body?.includes("## Request Approved"))
      console.log("Approved comment found: " + comment.body);
    else continue;
    let lines = comment.body?.split("\n").filter((l) => l.length > 0);
    for (let i = 0; i < lines.length; i++) {
      {
        if (lines[i].includes("### Address")) {
          req.address = lines[i + 1].split(">")[1].trim();
          i++;
        } else if (lines[i].includes("### Datacap Allocated")) {
          req.allocation = lines[i + 1].split(">")[1].trim();
          i++;
        } else if (lines[i].includes("### Signer Address")) {
          req.signerAddress = lines[i + 1].split(">")[1].trim();
          i++;
        } else if (lines[i].includes("### Id")) {
          req.id = lines[i + 1].split(">")[1].trim();
          i++;
        }
      }
    }
  }
  return req;
};
