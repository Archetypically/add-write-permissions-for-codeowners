import * as core from "@actions/core";

import { HydratedOctokit } from "./types";

export async function getAllTeamsWithAtLeastWriteAccess(
  octokit: HydratedOctokit,
  owner: string,
  repo: string
): Promise<string[]> {
  let { data } = await octokit.rest.repos.listTeams({ owner, repo });
  const teams = data
    .filter(({ permission }) => {
      return ["admin", "push"].includes(permission);
    })
    .map(({ slug }) => {
      return slug;
    });

  return [...new Set(teams)];
}

export async function addTeamToWriteAccess(
  octokit: HydratedOctokit,
  owner: string,
  repo: string,
  team: string,
  isDryRun: boolean
): Promise<void> {
  if (isDryRun) {
    core.notice(
      `Would have added ${team} to ${owner}/${repo} with write access, but dry-run is enabled.`
    );
  } else {
    await octokit.rest.teams.addOrUpdateRepoPermissionsInOrg({
      org: owner,
      owner: owner,
      repo,
      team_slug: team,
      permission: "push",
    });
    core.notice(`Added '${team}' to '${owner}/${repo}' with write access.`);
  }
}
