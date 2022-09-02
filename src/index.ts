/* eslint-disable no-process-env */
import { inspect } from "util";
import * as fs from "fs";

import * as core from "@actions/core";
import * as github from "@actions/github";
import { Octokit } from "@octokit/core";
import { PaginateInterface } from "@octokit/plugin-paginate-rest";
import { Api } from "@octokit/plugin-rest-endpoint-methods/dist-types/types";

interface FileContentMapping {
  path: string;
  contents: string;
}

interface HydratedOctokit extends Octokit, Api {
  paginate: PaginateInterface;
}

export function getFileContents(
  defaultFileDetectionLocations: string[] = ["CODEOWNERS", "docs/CODEOWNERS", ".github/CODEOWNERS"]
): FileContentMapping[] {
  const filePath = core.getInput("file-path", { required: true });
  let locationsToCheck = defaultFileDetectionLocations;
  if (filePath.length > 0) {
    const thisPlatformPath = core.toPlatformPath(filePath);
    core.debug(`Using specified path: ${thisPlatformPath}`);

    locationsToCheck = [thisPlatformPath];
  } else {
    core.info("Did not find specified input path, using default detection method.");
  }
  const existingPaths = locationsToCheck.filter((path) => {
    return fs.existsSync(path);
  });

  return existingPaths.map((path) => {
    core.notice(`Found CODEOWNERS file at '${path}' to operate on.`);
    return {
      path,
      contents: fs.readFileSync(path, "utf8"),
    };
  });
}

export function getAllCodeowners(fileContents: FileContentMapping[]): string[] {
  const allCodeowners: string[] = fileContents
    .map(({ contents }) => {
      return contents
        .split("\n")
        .filter((line) => {
          return !line.startsWith("#") && line.length > 0;
        })
        .map((line) => {
          const [_path, ...owners] = line.split(" ");
          return owners;
        })
        .flat();
    })
    .flat();

  return [...new Set(allCodeowners)];
}

export async function getAllTeamsWithAtLeastWriteAccess(
  octokit: HydratedOctokit,
  owner: string,
  repo: string
): Promise<string[]> {
  let { data } = await octokit.rest.repos.listTeams({ owner, repo });
  console.log(data);
  const teams = data
    .filter(({ permission }) => {
      return ["admin", "push"].includes(permission);
    })
    .map(({ slug }) => {
      return slug;
    });

  return [...new Set(teams)];
}

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

    const githubToken = core.getInput("github-token", { required: true });
    const octokit = github.getOctokit(githubToken);

    const allTeamsWithAtLeastWriteAccess = await getAllTeamsWithAtLeastWriteAccess(
      octokit,
      github.context.repo.owner,
      github.context.repo.repo
    );
    core.notice(`Found ${allTeamsWithAtLeastWriteAccess.length} unique teams with write access.`);
    core.debug(`All teams with write access: ${allTeamsWithAtLeastWriteAccess}`);
  } catch (error: any) {
    core.debug(inspect(error, false, 2, true));
    core.setOutput("success", false);
    core.setFailed(error.message);
  }
}

if (process.env.NODE_ENV !== "test") {
  main();
}
