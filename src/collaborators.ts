import * as core from "@actions/core";

import { HydratedOctokit } from "./types";

export async function getAllDirectCollaboratorsWithAtLeastWriteAccess(
  octokit: HydratedOctokit,
  owner: string,
  repo: string
): Promise<string[]> {
  const { data } = await octokit.rest.repos.listCollaborators({
    owner,
    repo,
    affiliation: "direct",
  });
  const collaborators = data
    .filter(({ permissions }) => {
      return permissions?.admin || permissions?.push;
    })
    .map(({ login }) => {
      return login;
    });

  return [...new Set(collaborators)];
}

export async function addUserToWriteAccess(
  octokit: HydratedOctokit,
  owner: string,
  repo: string,
  username: string,
  isDryRun: boolean
): Promise<void> {
  if (isDryRun) {
    core.notice(
      `Would have added '${username}' to '${owner}/${repo}' with write access, but dry-run is enabled.`
    );
  } else {
    await octokit.rest.repos.addCollaborator({
      owner,
      repo,
      username,
      permission: "push",
    });
    core.notice(`Added '${username}' to '${owner}/${repo}' with write access.`);
  }
}
