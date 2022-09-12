/* eslint-disable no-process-env */
import { inspect } from "util";

import * as core from "@actions/core";
import * as github from "@actions/github";

import { getAllCodeowners, getFileContents } from "./helpers";
import { addTeamToWriteAccess, getAllTeamsWithAtLeastWriteAccess } from "./teams";
import {
  addUserToWriteAccess,
  getAllDirectCollaboratorsWithAtLeastWriteAccess,
} from "./collaborators";

export async function main() {
  try {
    const isDryRun: boolean = (core.getInput("dry-run", { required: false }) || "false") === "true";
    if (isDryRun) {
      core.notice('"dry-run" enabled; will not make changes.');
    }

    const currentCodeowners = getFileContents();
    if (currentCodeowners.length === 0) {
      const errorMsg = "No CODEOWNERS file(s) found.";
      core.error(errorMsg);
      throw new Error(errorMsg);
    }

    const allCodeowners = getAllCodeowners(currentCodeowners);
    core.notice(`Found ${allCodeowners.length} unique codeowners.`);
    core.debug(`All codeowners: ${inspect(allCodeowners)}`);

    if (allCodeowners.length === 0) {
      core.notice("No CODEOWNERS found; nothing to do.");
      return;
    }

    const teamCodeowners = allCodeowners.filter((codeowner) => {
      return codeowner.includes("/");
    });
    core.notice(`Found ${teamCodeowners.length} unique team codeowners.`);
    core.debug(`Team codeowners: ${inspect(teamCodeowners)}`);

    const userCodeowners = allCodeowners.filter((codeowner) => {
      return !codeowner.includes("/");
    });
    core.notice(`Found ${userCodeowners.length} unique user codeowners.`);
    core.debug(`User codeowners: ${inspect(userCodeowners)}`);

    const githubToken = core.getInput("github-token", { required: true });
    const octokit = github.getOctokit(githubToken);

    const failedTeams: string[] = [];
    const failedUsers: string[] = [];

    // TEAM-Y OPERATIONS
    if (teamCodeowners.length > 0) {
      const allTeamsWithAtLeastWriteAccess = await getAllTeamsWithAtLeastWriteAccess(
        octokit,
        github.context.repo.owner,
        github.context.repo.repo
      );
      core.info(`Found ${allTeamsWithAtLeastWriteAccess.length} teams with at least write access.`);
      core.debug(
        `All teams with at least write access: ${inspect(allTeamsWithAtLeastWriteAccess)}`
      );

      teamCodeowners.forEach(async (team) => {
        const [orgName, teamSlug] = team.replaceAll("@", "").split("/");
        core.debug(`Found org: '${orgName}' and team: '${teamSlug}' from '${team}'.`);
        if (allTeamsWithAtLeastWriteAccess.includes(teamSlug)) {
          core.notice(`Team '${teamSlug}' already has at least write access; skipping.`);
        } else {
          await addTeamToWriteAccess(
            octokit,
            orgName,
            github.context.repo.repo,
            teamSlug,
            isDryRun
          ).catch((error) => {
            failedTeams.push(teamSlug);
            core.warning(`Failed to give write access to team '${teamSlug}': ${error}`);
          });
        }
      });
    } else {
      core.notice("No team codeowners found; skipping team operations.");
    }

    // USER-Y OPERATIONS HERE
    if (userCodeowners.length > 0) {
      const allUsersWithAtLeastWriteAccess = await getAllDirectCollaboratorsWithAtLeastWriteAccess(
        octokit,
        github.context.repo.owner,
        github.context.repo.repo
      );
      core.info(`Found ${allUsersWithAtLeastWriteAccess.length} users with at least write access.`);
      core.debug(
        `All users with at least write access: ${inspect(allUsersWithAtLeastWriteAccess)}`
      );
      userCodeowners.forEach(async (user) => {
        if (allUsersWithAtLeastWriteAccess.includes(user)) {
          core.notice(`User '${user}' already has at least write access; skipping.`);
        } else {
          await addUserToWriteAccess(
            octokit,
            github.context.repo.owner,
            github.context.repo.repo,
            user,
            isDryRun
          ).catch((error) => {
            failedUsers.push(user);
            core.warning(`Failed to give write access to user '${user}': ${error}`);
          });
        }
      });
    } else {
      core.notice("No user codeowners found; skipping user operations.");
    }

    if (failedTeams.length > 0 || failedUsers.length > 0) {
      const errorMsg =
        `Failed to give write access to teams: ${failedTeams.join(", ")}. ` +
        `Failed to give write access to users: ${failedUsers.join(", ")}.`;
      throw new Error(errorMsg);
    }
  } catch (error: any) {
    core.debug(inspect(error, false, 2, true));
    core.setOutput("success", false);
    core.setFailed(error.message);
  }
}

if (process.env.NODE_ENV !== "test") {
  main();
}
