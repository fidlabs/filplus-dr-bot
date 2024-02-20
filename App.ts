import { RestEndpointMethodTypes } from '@octokit/plugin-rest-endpoint-methods';
import * as dotenv from 'dotenv';
import { Octokit, App } from 'octokit';
import { Issue } from './types/issue.js';
import { DataCapRequest } from './types/request.js';
import { processIssue } from './issueProcessor.js';
import axios from 'axios';
import { createClient } from 'redis';

dotenv.config();

(async () => {
  const client = await createClient()
    .on('error', (err) => console.log('Redis Client Error', err))
    .connect();

  while (true) {
    let approvedRequests: DataCapRequest[] = [];
    let octokit = new Octokit({ auth: process.env.GITHUB_API_KEY });

    // get paginated issues for a rtepo
    let issues = await octokit
      .paginate(octokit.rest.issues.listForRepo, {
        owner: 'filecoin-project',
        repo: 'filecoin-plus-large-datasets',
        labels: 'granted'
      })
      .then((issues) => {
        return issues.map((i) => i as Issue);
      });

    for (let issue of issues) {
      let approved = await processIssue(octokit, issue);
      approvedRequests.push(approved);
      if (approvedRequests.length % 10 === 0) {
        await Delay(1000);
      }
    }
    for (let request of approvedRequests) {
      if (request.address) {
        const response = await axios.post('https://api.node.glif.io/', {
          jsonrpc: '2.0',
          method: 'Filecoin.StateVerifiedClientStatus',
          params: [`${request.address}`, null],
          id: `${request.id}`
        });
        console.log(response.data);
        debugger;
        await client.hSet(request.address, { allocation: response.data.result, date: new Date().toString() });
        const value = await client.hGetAll(request.address);
        console.log(value);
        debugger;
      }
    }

    await Delay(1000 * 60 * 5);
  }
  await client.disconnect();
})();

async function Delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
