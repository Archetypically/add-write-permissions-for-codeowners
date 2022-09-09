import { jest } from "@jest/globals";
import * as core from "@actions/core";

import { addTeamToWriteAccess, getAllTeamsWithAtLeastWriteAccess } from "../src/teams";
import { HydratedOctokit } from "../src/types";

beforeAll(() => {
  jest.spyOn(core, "debug").mockImplementation(() => {});
  jest.spyOn(core, "info").mockImplementation(() => {});
  jest.spyOn(core, "error").mockImplementation(() => {});
  jest.spyOn(core, "notice").mockImplementation(() => {});
  jest.spyOn(core, "setOutput").mockImplementation(() => {});
  jest.spyOn(core, "setFailed").mockImplementation(() => {});
});

beforeEach(() => {
  jest.resetAllMocks();
});

describe("getAllTeamsWithAtLeastWriteAccess", () => {
  it("should return an empty array if no teams have write access", async () => {
    jest.mock("../src/types");
    const octokit = {
      rest: {
        repos: {
          listTeams: jest.fn().mockReturnValue({ data: [] }),
        },
      },
    };
    const owner = "owner";
    const repo = "repo";

    const result = await getAllTeamsWithAtLeastWriteAccess(
      octokit as unknown as HydratedOctokit,
      owner,
      repo
    );

    expect(result).toEqual([]);
  });

  it("should return an array of team slugs if teams have write access", async () => {
    const octokit = {
      rest: {
        repos: {
          listTeams: jest.fn().mockReturnValue({
            data: [
              { slug: "team1", permission: "admin" },
              { slug: "team2", permission: "push" },
              { slug: "team3", permission: "pull" },
            ],
          }),
        },
      },
    };
    const owner = "owner";
    const repo = "repo";

    const result = await getAllTeamsWithAtLeastWriteAccess(
      octokit as unknown as HydratedOctokit,
      owner,
      repo
    );

    expect(result).toEqual(["team1", "team2"]);
  });

  it("unique-ifies the result", async () => {
    const octokit = {
      rest: {
        repos: {
          listTeams: jest.fn().mockReturnValue({
            data: [
              { slug: "team1", permission: "admin" },
              { slug: "team1", permission: "push" },
              { slug: "team1", permission: "pull" },
            ],
          }),
        },
      },
    };
    const owner = "owner";
    const repo = "repo";

    const result = await getAllTeamsWithAtLeastWriteAccess(
      octokit as unknown as HydratedOctokit,
      owner,
      repo
    );

    expect(result).toEqual(["team1"]);
  });
});

describe("addTeamToWriteAccess", () => {
  it("should add a team to a repo with write access", async () => {
    jest.mock("../src/types");
    const octokit = {
      rest: {
        teams: {
          addOrUpdateRepoPermissionsInOrg: jest.fn(),
        },
      },
    };
    const owner = "owner";
    const repo = "repo";
    const team = "team";
    const isDryRun = false;

    await addTeamToWriteAccess(octokit as unknown as HydratedOctokit, owner, repo, team, isDryRun);

    expect(octokit.rest.teams.addOrUpdateRepoPermissionsInOrg).toHaveBeenCalledWith({
      org: owner,
      owner: owner,
      repo,
      team_slug: team,
      permission: "push",
    });
  });

  it("does not add a team to a repo with write access if dry-run is enabled", async () => {
    jest.mock("../src/types");
    const octokit = {
      rest: {
        teams: {
          addOrUpdateRepoPermissionsInOrg: jest.fn(),
        },
      },
    };
    const owner = "owner";
    const repo = "repo";
    const team = "team";
    const isDryRun = true;

    await addTeamToWriteAccess(octokit as unknown as HydratedOctokit, owner, repo, team, isDryRun);

    expect(octokit.rest.teams.addOrUpdateRepoPermissionsInOrg).not.toHaveBeenCalled();
  });
});
