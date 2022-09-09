import * as fs from "fs";
import * as core from "@actions/core";

import { FileContentMapping } from "./types";

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

  return [...new Set(allCodeowners)].map((owner) => {
    return owner.replaceAll("@", "");
  });
}
