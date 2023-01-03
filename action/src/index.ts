import * as core from '@actions/core';
import type { IssueType } from 'gh-issues-to-sheet-lib';
import { toGoogleSheets } from 'gh-issues-to-sheet-lib';

async function run(): Promise<void> {
    try {
        const exporter = toGoogleSheets({
            githubToken: core.getInput('token', { required: true }),
            googleCreds: JSON.parse(core.getInput('sheet-creds', { required: true })),
        });
        exporter.setLogger(core);
        await exporter.exportIssues(
            {
                repo: core.getInput('repository', { required: true }),
                types: (core.getInput('issue-types') || 'issue').split(',').map(s => s.trim().toLowerCase()) as IssueType[],
            },
            {
                sheetUrl: core.getInput('sheet-url', { required: true }),
                deltaUpdate: core.getBooleanInput('delta-update') || false,
            }
        );
    } catch (error) {
        if (error instanceof Error) {
            core.setFailed(error.message);
        } else {
            core.setFailed(`An unknown error occurred: ${String(error)}`);
        }
    }
}

// eslint-disable-next-line @typescript-eslint/no-floating-promises
run();
