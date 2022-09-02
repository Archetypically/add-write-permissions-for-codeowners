import { jest } from "@jest/globals";
import * as core from "@actions/core";

import { getFileContents } from "../src/index";

const TEST_CODEOWNERS_FILE_CONTENTS = String(
  "file1.txt @test1\n" + "file2.txt @test2 @test3\n" + "file3.txt @org1/team1\n"
);

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

describe("getFileContents", () => {
  describe("when filePath is specified", () => {
    test("and the file does not exist", () => {
      const mockGetInput = jest.spyOn(core, "getInput");
      mockGetInput.mockReturnValueOnce("does-not-exist");

      expect(getFileContents()).toEqual([]);
    });

    test("and the file exists", () => {
      const mockGetInput = jest.spyOn(core, "getInput");
      mockGetInput.mockReturnValueOnce("test/fixtures/CODEOWNERS");

      expect(getFileContents()).toEqual([
        {
          path: "test/fixtures/CODEOWNERS",
          contents: TEST_CODEOWNERS_FILE_CONTENTS,
        },
      ]);
    });
  });

  describe("when filePath is not specified", () => {
    test("and none of the files exist", () => {
      const mockGetInput = jest.spyOn(core, "getInput");
      mockGetInput.mockReturnValueOnce("");
      expect(getFileContents([])).toEqual([]);
    });

    test("and one of the files exists", () => {
      const mockGetInput = jest.spyOn(core, "getInput");
      mockGetInput.mockReturnValueOnce("");
      expect(getFileContents(["test/fixtures/CODEOWNERS"])).toEqual([
        {
          path: "test/fixtures/CODEOWNERS",
          contents: TEST_CODEOWNERS_FILE_CONTENTS,
        },
      ]);
    });

    test("and multiple of the files exists", () => {
      const mockGetInput = jest.spyOn(core, "getInput");
      mockGetInput.mockReturnValueOnce("");
      expect(getFileContents(["test/fixtures/CODEOWNERS", "test/fixtures/CODEOWNERS"])).toEqual([
        {
          path: "test/fixtures/CODEOWNERS",
          contents: TEST_CODEOWNERS_FILE_CONTENTS,
        },
        {
          path: "test/fixtures/CODEOWNERS",
          contents: TEST_CODEOWNERS_FILE_CONTENTS,
        },
      ]);
    });
  });
});
