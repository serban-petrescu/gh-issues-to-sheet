import * as core from '@actions/core';
import type { IssueType } from 'gh-issues-to-sheet-lib';
import { toGoogleSheets } from 'gh-issues-to-sheet-lib';

async function run(): Promise<void> {
    try {
        const exporter = toGoogleSheets({
            githubToken: core.getInput('githubToken'),
            googleCreds: JSON.parse(core.getInput('sheetCreds')),
        });
        exporter.setLogger(core);
        await exporter.exportIssues(
            {
                repo: core.getInput('repository'),
                types: core
                    .getInput('issueTypes')
                    .split(',')
                    .map(s => s.trim().toLowerCase()) as IssueType[],
            },
            {
                sheetUrl: core.getInput('sheetUrl'),
                deltaUpdate: core.getBooleanInput('deltaUpdate'),
            }
        );
    } catch (error) {
        if (error instanceof Error) {
            core.setFailed(error.message);
        } else {
            core.setFailed(`An unknown error occured: ${String(error)}`);
        }
    }
}

// eslint-disable-next-line @typescript-eslint/no-floating-promises
run();
