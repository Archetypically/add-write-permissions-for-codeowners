import { jest } from "@jest/globals";
import * as core from "@actions/core";

import {
  getAllDirectCollaboratorsWithAtLeastWriteAccess,
  addUserToWriteAccess,
} from "../src/collaborators";
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

describe("getAllDirectCollaboratorsWithAtLeastWriteAccess", () => {
  it("should return an empty array if no collaborators have write access", async () => {
    jest.mock("../src/types");
    const octokit = {
      rest: {
        repos: {
          listCollaborators: jest.fn().mockReturnValue({ data: [] }),
        },
      },
    };
    const owner = "owner";
    const repo = "repo";

    const result = await getAllDirectCollaboratorsWithAtLeastWriteAccess(
      octokit as unknown as HydratedOctokit,
      owner,
      repo
    );

    expect(result).toEqual([]);
  });

  it("should return an array of usernames if collaborators have write access", async () => {
    const octokit = {
      rest: {
        repos: {
          listCollaborators: jest.fn().mockReturnValue({
            data: [
              { login: "user1", permissions: { admin: true } },
              { login: "user2", permissions: { push: true } },
              { login: "user3", permissions: { pull: true } },
            ],
          }),
        },
      },
    };
    const owner = "owner";
    const repo = "repo";

    const result = await getAllDirectCollaboratorsWithAtLeastWriteAccess(
      octokit as unknown as HydratedOctokit,
      owner,
      repo
    );

    expect(result).toEqual(["user1", "user2"]);
  });

  it("unique-ifies the result", async () => {
    const octokit = {
      rest: {
        repos: {
          listCollaborators: jest.fn().mockReturnValue({
            data: [
              { login: "user1", permissions: { admin: true } },
              { login: "user1", permissions: { push: true } },
            ],
          }),
        },
      },
    };
    const owner = "owner";
    const repo = "repo";

    const result = await getAllDirectCollaboratorsWithAtLeastWriteAccess(
      octokit as unknown as HydratedOctokit,
      owner,
      repo
    );

    expect(result).toEqual(["user1"]);
  });
});

describe("addCollaboratorToWriteAccess", () => {
  it("should add a collaborator to the repo", async () => {
    const octokit = {
      rest: {
        repos: {
          addCollaborator: jest.fn(),
        },
      },
    };
    const owner = "owner";
    const repo = "repo";
    const username = "username";
    const isDryRun = false;

    await addUserToWriteAccess(
      octokit as unknown as HydratedOctokit,
      owner,
      repo,
      username,
      isDryRun
    );

    expect(octokit.rest.repos.addCollaborator).toHaveBeenCalledWith({
      owner,
      repo,
      username,
      permission: "push",
    });
  });

  it("should not add a collaborator to the repo if dry-run is enabled", async () => {
    const octokit = {
      rest: {
        repos: {
          addCollaborator: jest.fn(),
        },
      },
    };
    const owner = "owner";
    const repo = "repo";
    const username = "username";
    const isDryRun = true;

    await addUserToWriteAccess(
      octokit as unknown as HydratedOctokit,
      owner,
      repo,
      username,
      isDryRun
    );

    expect(octokit.rest.repos.addCollaborator).not.toHaveBeenCalled();
  });
});
