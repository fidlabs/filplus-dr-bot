import { RestEndpointMethodTypes } from "@octokit/plugin-rest-endpoint-methods";
import * as dotenv from "dotenv";
import { Octokit, App } from "octokit";
import { Issue } from "./types/issue";
import { GrantedRequest, processIssue } from "./types/request";
dotenv.config();

(async () => {
  let approvedRequests: GrantedRequest[] = [];
  let octokit = new Octokit({ auth: process.env.GITHUB_API_KEY });

  // get paginated issues for a rtepo
  let issues = await octokit
    .paginate(octokit.rest.issues.listForRepo, {
      owner: "filecoin-project",
      repo: "filecoin-plus-large-datasets",
      labels: "granted",
    })
    .then((issues) => {
      return issues.map((i) => i as Issue);
    });

  for (let issue of issues) {
    let approved = await processIssue(octokit, issue);
    approvedRequests.push(approved);
    if (approvedRequests.length % 10 === 0) {
      // await Delay(1000);
      break; // #TODO: remove this later when authenticated properly
    }
  }
  console.table(approvedRequests);
})();

async function Delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
