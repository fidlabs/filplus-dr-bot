import * as dotenv from "dotenv";
import { Octokit } from "octokit";
import { Issue } from "./types/issue.js";
import { DataCapRequest } from "./types/request.js";
import { processIssue } from "./issueProcessor.js";
import axios, { all } from "axios";
import { createClient } from "redis";

dotenv.config();

(async () => {
  while (true) {
    const client = await createClient({
      url: process.env.REDIS_URL as string,
    })
      .on("error", (err) => console.log("Redis Client Error", err))
      .connect();
    let approvedRequests: DataCapRequest[] = [];
    let octokit = new Octokit({ auth: process.env.GITHUB_API_KEY });

    // get paginated issues for a rtepo
    let issues: Issue[] = await octokit.paginate(
      octokit.rest.issues.listForRepo,
      {
        owner: process.env.OWNER as string,
        repo: process.env.REPO as string,
        labels: "granted",
      }
    );
    for (let issue of issues) {
      let approved = await processIssue(octokit, issue);
      if (approved) approvedRequests.push(approved);
      if (approvedRequests.length % 10 === 0) {
        await Delay(1000);
      }
    }
    for (let request of approvedRequests) {
      if (request.address) {
        const response = await axios.post("https://api.node.glif.io/", {
          jsonrpc: "2.0",
          method: "Filecoin.StateVerifiedClientStatus",
          params: [`${request.address}`, null],
          id: `${request.id}`,
        });
        console.log(response.data);
        let allocation = Number(response.data.result) ?? 0;
        if (
          Number(await client.hGet(request.address, "allocation")) !==
          allocation
        ) {
          await client.hSet(request.address, {
            allocation,
            date: Date.now() as number,
          });
          const value = await client.hGetAll(request.address);
          console.log(value);
        } else {
          console.log(request.address, "- No change in allocation");
        }

        // TODO: Check if application is stale
      }
    }

    await client.disconnect();
    await Delay(1000 * 60 * 5);
  }
})();

async function Delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
