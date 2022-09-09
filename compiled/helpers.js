"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllCodeowners = exports.getFileContents = void 0;
const fs = __importStar(require("fs"));
const core = __importStar(require("@actions/core"));
function getFileContents(defaultFileDetectionLocations = ["CODEOWNERS", "docs/CODEOWNERS", ".github/CODEOWNERS"]) {
    const filePath = core.getInput("file-path", { required: true });
    let locationsToCheck = defaultFileDetectionLocations;
    if (filePath.length > 0) {
        const thisPlatformPath = core.toPlatformPath(filePath);
        core.debug(`Using specified path: ${thisPlatformPath}`);
        locationsToCheck = [thisPlatformPath];
    }
    else {
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
exports.getFileContents = getFileContents;
function getAllCodeowners(fileContents) {
    const allCodeowners = fileContents
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
exports.getAllCodeowners = getAllCodeowners;
