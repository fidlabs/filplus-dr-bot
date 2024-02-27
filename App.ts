import * as dotenv from "dotenv";
import { Octokit } from "@octokit/rest";
import { Issue } from "./types/issue.js";
import { DataCapRequest } from "./types/request.js";
import { processIssue } from "./issueProcessor.js";
import axios, { all } from "axios";
import { createClient } from "redis";
import getInstallationId from "./src/getInstallationId.js";
import fs from 'fs'
import { createAppAuth } from '@octokit/auth-app'

dotenv.config();

const REDIS_DATACAP_ADDRESSES_SET = "datacap-addresses";
const appId = process.env.APP_ID || 'APP_ID';
const privateKeyPath = process.env.PRIVATE_KEY_PATH || './YOUR_PRIVATE_KEY.pem';
const privateKey = fs.readFileSync(privateKeyPath, 'utf8');
const owner = process.env.OWNER || "OWNER";
const repo = process.env.REPO || "REPO";

(async () => {
  while (true) {
    const client = await createClient({
      url: process.env.REDIS_URL as string,
    })
      .on("error", (err) => console.log("Redis Client Error", err))
      .connect();
    let approvedRequests: DataCapRequest[] = [];

    const installationId = await getInstallationId(owner, repo, {privateKey, appId})

    let octokit = new Octokit({ 
      authStrategy: createAppAuth,
      auth:  {
        appId,
        privateKey,
        installationId
      }
    });

    // get paginated issues for a rtepo
    let issues: Issue[] = await octokit.paginate(
      octokit.rest.issues.listForRepo,
      {
        owner,
        repo,
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
    let addresses: string[] = [];
    for (let request of approvedRequests) {
      if (request.address) {
        const response = await axios.post("https://api.node.glif.io/", {
          jsonrpc: "2.0",
          method: "Filecoin.StateVerifiedClientStatus",
          params: [`${request.address}`, null],
          id: `${request.id}`,
        });
        let allocation = Number(response.data.result) ?? 0;
        let cachedAllocation = Number(
          await client.hGet(request.address, "allocation")
        );
        if (cachedAllocation !== allocation) {
          await client.hSet(request.address, {
            allocation,
            date: Date.now() as number,
          });
          console.log(
            "Allocation updated for:",
            request.address,
            " - before:",
            cachedAllocation / 1024 ** 3,
            "GB",
            " - after:",
            allocation / 1024 ** 3,
            "GB",
            "diff:",
            (allocation - cachedAllocation) / 1024 ** 3,
            "GB"
          );
        } else {
          console.log(request.address, "- No change in allocation");
        }
        addresses.push(request.address);
      }
    }
    // Update the list of addresses in redis
    await client.sAdd(REDIS_DATACAP_ADDRESSES_SET, addresses);

    // check for stale allocations
    addresses = await client.sMembers(REDIS_DATACAP_ADDRESSES_SET);
    let staleThreshold = Number(process.env.ALLOCATION_STALE_THRESHOLD_DAYS);
    for (let address of addresses) {
      let entry: { allocation: number; date: number; stale?: string | null } =
        await client.hGetAll(address).then((res) => {
          return {
            allocation: Number(res.allocation),
            date: Number(res.date),
            stale: res.stale,
          };
        });
      if (entry.stale) continue;

      if (Date.now() - entry.date > staleThreshold * 24 * 60 * 60 * 1000) {
        await client.hSet(address, { stale: 1 });
        console.log("Stale allocation removed for:", address);
      }
    }
    await client.disconnect();
    await Delay(1000 * 60 * 5);
  }
})();

async function Delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
