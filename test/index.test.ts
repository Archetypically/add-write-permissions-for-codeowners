import { jest } from "@jest/globals";
import * as core from "@actions/core";
import * as github from "@actions/github";

import { main } from "../src/index";
import * as helpers from "../src/helpers";
import * as teams from "../src/teams";
import * as collaborators from "../src/collaborators";

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
  jest.mock("../src/helpers");
  jest.mock("../src/teams");
  jest.mock("../src/collaborators");
});

describe("main", () => {
  it("does nothing when there are no CODEOWNERS files", () => {
    const mockCoreError = jest.spyOn(core, "error");
    const mockGetInput = jest.spyOn(core, "getInput");
    mockGetInput.mockReturnValueOnce("true");

    const mockGetFileContents = jest.spyOn(helpers, "getFileContents");
    mockGetFileContents.mockReturnValueOnce([]);

    const mockOctokitGenerator = jest.spyOn(github, "getOctokit");

    expect(() => main()).not.toThrow();
    expect(mockGetFileContents).toHaveBeenCalled();
    expect(mockCoreError).toHaveBeenCalled();

    expect(mockOctokitGenerator).not.toHaveBeenCalled();
  });

  it("does nothing when there are no CODEOWNERS in the file", () => {
    const mockCoreError = jest.spyOn(core, "error");
    const mockGetInput = jest.spyOn(core, "getInput");
    mockGetInput.mockReturnValueOnce("true");

    const mockGetFileContents = jest.spyOn(helpers, "getFileContents");
    mockGetFileContents.mockReturnValueOnce([{ path: "CODEOWNERS", contents: "" }]);

    const mockGetAllCodeowners = jest.spyOn(helpers, "getAllCodeowners");
    mockGetAllCodeowners.mockReturnValueOnce([]);

    const mockOctokitGenerator = jest.spyOn(github, "getOctokit");

    expect(() => main()).not.toThrow();
    expect(mockGetFileContents).toHaveBeenCalled();
    expect(mockGetAllCodeowners).toHaveBeenCalled();
    expect(mockCoreError).not.toHaveBeenCalled();
    expect(mockOctokitGenerator).not.toHaveBeenCalled();
  });

  it("doesn't add access if there was already access", () => {
    process.env.GITHUB_REPOSITORY = "owner/repo";
    const mockCoreError = jest.spyOn(core, "error");
    const mockOctokitGenerator = jest.spyOn(github, "getOctokit");

    const mockGetInput = jest.spyOn(core, "getInput");
    mockGetInput.mockReturnValueOnce("true");

    const mockGetFileContents = jest.spyOn(helpers, "getFileContents");
    mockGetFileContents.mockReturnValueOnce([{ path: "CODEOWNERS", contents: "" }]);

    const mockGetAllCodeowners = jest.spyOn(helpers, "getAllCodeowners");
    mockGetAllCodeowners.mockReturnValueOnce(["Org1/team1", "user-account1"]);

    const mockGetAllTeamsWithAtLeastWriteAccess = jest.spyOn(
      teams,
      "getAllTeamsWithAtLeastWriteAccess"
    );
    mockGetAllTeamsWithAtLeastWriteAccess.mockResolvedValueOnce(["team1"]);

    const mockAddTeamToWriteAccess = jest.spyOn(teams, "addTeamToWriteAccess");

    const mockGetAllDirectCollaboratorsWithAtLeastWriteAccess = jest.spyOn(
      collaborators,
      "getAllDirectCollaboratorsWithAtLeastWriteAccess"
    );
    mockGetAllDirectCollaboratorsWithAtLeastWriteAccess.mockResolvedValueOnce(["user-account1"]);

    const mockAddUserToWriteAccess = jest.spyOn(collaborators, "addUserToWriteAccess");

    expect(() => main()).not.toThrow();
    expect(mockGetFileContents).toHaveBeenCalled();
    expect(mockGetAllCodeowners).toHaveBeenCalled();
    expect(mockCoreError).not.toHaveBeenCalled();
    expect(mockOctokitGenerator).toHaveBeenCalled();
    expect(mockAddTeamToWriteAccess).not.toHaveBeenCalled();
    expect(mockAddUserToWriteAccess).not.toHaveBeenCalled();
  });

  it("adds access as-needed", () => {
    process.env.GITHUB_REPOSITORY = "owner/repo";
    const mockCoreError = jest.spyOn(core, "error");
    const mockOctokitGenerator = jest.spyOn(github, "getOctokit");

    const mockGetInput = jest.spyOn(core, "getInput");
    mockGetInput.mockReturnValueOnce("true");

    const mockGetFileContents = jest.spyOn(helpers, "getFileContents");
    mockGetFileContents.mockReturnValueOnce([{ path: "CODEOWNERS", contents: "" }]);

    const mockGetAllCodeowners = jest.spyOn(helpers, "getAllCodeowners");
    mockGetAllCodeowners.mockReturnValueOnce(["Org1/team1", "user-account1"]);

    const mockGetAllTeamsWithAtLeastWriteAccess = jest.spyOn(
      teams,
      "getAllTeamsWithAtLeastWriteAccess"
    );
    mockGetAllTeamsWithAtLeastWriteAccess.mockResolvedValueOnce([]);

    const mockAddTeamToWriteAccess = jest.spyOn(teams, "addTeamToWriteAccess");
    mockAddTeamToWriteAccess.mockResolvedValueOnce();

    const mockGetAllDirectCollaboratorsWithAtLeastWriteAccess = jest.spyOn(
      collaborators,
      "getAllDirectCollaboratorsWithAtLeastWriteAccess"
    );
    mockGetAllDirectCollaboratorsWithAtLeastWriteAccess.mockResolvedValueOnce([""]);

    const mockAddUserToWriteAccess = jest.spyOn(collaborators, "addUserToWriteAccess");
    mockAddUserToWriteAccess.mockResolvedValueOnce();

    expect(() => main()).not.toThrow();

    expect(mockGetFileContents).toHaveBeenCalled();
    expect(mockGetAllCodeowners).toHaveBeenCalled();
    expect(mockCoreError).not.toHaveBeenCalled();
    expect(mockOctokitGenerator).toHaveBeenCalled();
  });
});
