import { Octokit } from "@octokit/core";
import { PaginateInterface } from "@octokit/plugin-paginate-rest";
import { Api } from "@octokit/plugin-rest-endpoint-methods/dist-types/types";

export interface HydratedOctokit extends Octokit, Api {
  paginate: PaginateInterface;
}

export interface FileContentMapping {
  path: string;
  contents: string;
}
