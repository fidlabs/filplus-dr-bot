import { Octokit } from "octokit";
import { Issue } from "./issue.js";

export type DataCapRequest = {
  address: string;
  id: string;
  signerAddress: string;
};
