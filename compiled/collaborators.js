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
exports.addUserToWriteAccess = exports.getAllDirectCollaboratorsWithAtLeastWriteAccess = void 0;
const core = __importStar(require("@actions/core"));
async function getAllDirectCollaboratorsWithAtLeastWriteAccess(octokit, owner, repo) {
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
exports.getAllDirectCollaboratorsWithAtLeastWriteAccess = getAllDirectCollaboratorsWithAtLeastWriteAccess;
async function addUserToWriteAccess(octokit, owner, repo, username, isDryRun) {
    if (isDryRun) {
        core.notice(`Would have added '${username}' to '${owner}/${repo}' with write access, but dry-run is enabled.`);
    }
    else {
        await octokit.rest.repos.addCollaborator({
            owner,
            repo,
            username,
            permission: "push",
        });
        core.notice(`Added '${username}' to '${owner}/${repo}' with write access.`);
    }
}
exports.addUserToWriteAccess = addUserToWriteAccess;
