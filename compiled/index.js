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
exports.main = void 0;
/* eslint-disable no-process-env */
const util_1 = require("util");
const core = __importStar(require("@actions/core"));
const github = __importStar(require("@actions/github"));
const helpers_1 = require("./helpers");
const teams_1 = require("./teams");
const collaborators_1 = require("./collaborators");
async function main() {
    try {
        const isDryRun = (core.getInput("dry-run", { required: false }) || "false") === "true";
        if (isDryRun) {
            core.notice('"dry-run" enabled; will not make changes.');
        }
        const currentCodeowners = (0, helpers_1.getFileContents)();
        if (currentCodeowners.length === 0) {
            const errorMsg = "No CODEOWNERS file(s) found.";
            core.error(errorMsg);
            throw new Error(errorMsg);
        }
        const allCodeowners = (0, helpers_1.getAllCodeowners)(currentCodeowners);
        core.notice(`Found ${allCodeowners.length} unique codeowners.`);
        core.debug(`All codeowners: ${(0, util_1.inspect)(allCodeowners)}`);
        if (allCodeowners.length === 0) {
            core.notice("No CODEOWNERS found; nothing to do.");
            return;
        }
        const teamCodeowners = allCodeowners.filter((codeowner) => {
            return codeowner.includes("/");
        });
        core.notice(`Found ${teamCodeowners.length} unique team codeowners.`);
        core.debug(`Team codeowners: ${(0, util_1.inspect)(teamCodeowners)}`);
        const userCodeowners = allCodeowners.filter((codeowner) => {
            return !codeowner.includes("/");
        });
        core.notice(`Found ${userCodeowners.length} unique user codeowners.`);
        core.debug(`User codeowners: ${(0, util_1.inspect)(userCodeowners)}`);
        const githubToken = core.getInput("github-token", { required: true });
        const octokit = github.getOctokit(githubToken);
        const failedTeams = [];
        const failedUsers = [];
        // TEAM-Y OPERATIONS
        if (teamCodeowners.length > 0) {
            const allTeamsWithAtLeastWriteAccess = await (0, teams_1.getAllTeamsWithAtLeastWriteAccess)(octokit, github.context.repo.owner, github.context.repo.repo);
            core.info(`Found ${allTeamsWithAtLeastWriteAccess.length} teams with at least write access.`);
            core.debug(`All teams with at least write access: ${(0, util_1.inspect)(allTeamsWithAtLeastWriteAccess)}`);
            teamCodeowners.forEach(async (team) => {
                const [orgName, teamSlug] = team.replaceAll("@", "").split("/");
                core.debug(`Found org: '${orgName}' and team: '${teamSlug}' from '${team}'.`);
                if (allTeamsWithAtLeastWriteAccess.includes(teamSlug)) {
                    core.notice(`Team '${teamSlug}' already has at least write access; skipping.`);
                }
                else {
                    await (0, teams_1.addTeamToWriteAccess)(octokit, orgName, github.context.repo.repo, teamSlug, isDryRun).catch((error) => {
                        failedTeams.push(teamSlug);
                        core.warning(`Failed to give write access to team '${teamSlug}': ${error}`);
                    });
                }
            });
        }
        else {
            core.notice("No team codeowners found; skipping team operations.");
        }
        // USER-Y OPERATIONS HERE
        if (userCodeowners.length > 0) {
            const allUsersWithAtLeastWriteAccess = await (0, collaborators_1.getAllDirectCollaboratorsWithAtLeastWriteAccess)(octokit, github.context.repo.owner, github.context.repo.repo);
            core.info(`Found ${allUsersWithAtLeastWriteAccess.length} users with at least write access.`);
            core.debug(`All users with at least write access: ${(0, util_1.inspect)(allUsersWithAtLeastWriteAccess)}`);
            userCodeowners.forEach(async (user) => {
                if (allUsersWithAtLeastWriteAccess.includes(user)) {
                    core.notice(`User '${user}' already has at least write access; skipping.`);
                }
                else {
                    await (0, collaborators_1.addUserToWriteAccess)(octokit, github.context.repo.owner, github.context.repo.repo, user, isDryRun).catch((error) => {
                        failedUsers.push(user);
                        core.warning(`Failed to give write access to user '${user}': ${error}`);
                    });
                }
            });
        }
        else {
            core.notice("No user codeowners found; skipping user operations.");
        }
        if (failedTeams.length > 0 || failedUsers.length > 0) {
            const errorMsg = `Failed to give write access to teams: ${failedTeams.join(", ")}. ` +
                `Failed to give write access to users: ${failedUsers.join(", ")}.`;
            throw new Error(errorMsg);
        }
    }
    catch (error) {
        core.debug((0, util_1.inspect)(error, false, 2, true));
        core.setOutput("success", false);
        core.setFailed(error.message);
    }
}
exports.main = main;
if (process.env.NODE_ENV !== "test") {
    main();
}
