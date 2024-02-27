import { Octokit } from "octokit";
import { createAppAuth } from '@octokit/auth-app'
import { Auth } from "../types/auth.js";

async function getInstallationId(owner: string, repo: string, auth: Auth) {
  const appOctokit = new Octokit({
    authStrategy: createAppAuth,
    auth,
  });
  try {
    const { data: installations } = await appOctokit.request('GET /repos/{owner}/{repo}/installation', {
      owner,
      repo
    });

    const installationId = installations.id;
    console.log(`Installation ID for ${owner}/${repo}: ${installationId}`);
    return installationId;
  } catch (error) {
    console.error('Error getting installation ID:', error);
    return null;
  }
}

export default getInstallationId