import { config } from 'dotenv';
import type { IssueExporter } from 'gh-issues-to-sheet-lib';
import type { GoogleSpreadsheet } from 'google-spreadsheet';

import {
    ACTUAL_ISSUES,
    EXTRA_ISSUES,
    getGoogleSheet,
    getIssueExporter,
    getSheetData,
    HEADER,
    REPO,
    seedBlankTab,
    seedDisjunctTab,
    seedFullTab,
    seedIdenticalTab,
    seedIssuesTab,
    seedPartialTab,
    seedPrsTab,
    seedUpdatableTab,
    SHEET_ID,
} from './utils';

config();

describe('toGoogleSheets', () => {
    let exporter: IssueExporter;
    let sheet: GoogleSpreadsheet;

    beforeAll(async () => {
        exporter = await getIssueExporter();
        sheet = await getGoogleSheet();
    });

    it('should export all issues and PRs to a blank sheet', async () => {
        const tabId = await seedFullTab(sheet);

        await exporter.exportIssues(
            {
                repo: REPO,
                types: ['issue', 'pr'],
            },
            {
                sheetUrl: `https://docs.google.com/spreadsheets/d/${SHEET_ID}/edit#gid=${tabId}`,
                deltaUpdate: false,
            }
        );

        const data = await getSheetData(sheet, tabId);
        expect(data).toEqual([HEADER, ...ACTUAL_ISSUES]);
    });

    it('should export all issues to a blank sheet', async () => {
        const tabId = await seedIssuesTab(sheet);

        await exporter.exportIssues(
            {
                repo: REPO,
                types: ['issue'],
            },
            {
                sheetUrl: `https://docs.google.com/spreadsheets/d/${SHEET_ID}/edit#gid=${tabId}`,
                deltaUpdate: false,
            }
        );

        const data = await getSheetData(sheet, tabId);
        expect(data).toEqual([HEADER, ...ACTUAL_ISSUES.filter(i => i[2] === 'issue')]);
    });

    it('should export all PRs to a blank sheet', async () => {
        const tabId = await seedPrsTab(sheet);

        await exporter.exportIssues(
            {
                repo: REPO,
                types: ['pr'],
            },
            {
                sheetUrl: `https://docs.google.com/spreadsheets/d/${SHEET_ID}/edit#gid=${tabId}`,
                deltaUpdate: false,
            }
        );

        const data = await getSheetData(sheet, tabId);
        expect(data).toEqual([HEADER, ...ACTUAL_ISSUES.filter(i => i[2] === 'pr')]);
    });

    it('should export all issues to a blank sheet via delta update', async () => {
        const tabId = await seedBlankTab(sheet);

        await exporter.exportIssues(
            {
                repo: REPO,
                types: ['issue', 'pr'],
            },
            {
                sheetUrl: `https://docs.google.com/spreadsheets/d/${SHEET_ID}/edit#gid=${tabId}`,
                deltaUpdate: true,
            }
        );

        const data = await getSheetData(sheet, tabId);
        expect(data).toEqual([HEADER, ...ACTUAL_ISSUES]);
    });

    it('should export all issues to a sheet with disjunct contents via delta update', async () => {
        const tabId = await seedDisjunctTab(sheet);

        await exporter.exportIssues(
            {
                repo: REPO,
                types: ['issue', 'pr'],
            },
            {
                sheetUrl: `https://docs.google.com/spreadsheets/d/${SHEET_ID}/edit#gid=${tabId}`,
                deltaUpdate: true,
            }
        );

        const data = await getSheetData(sheet, tabId);
        expect(data).toEqual([HEADER, ...EXTRA_ISSUES, ...ACTUAL_ISSUES]);
    });

    it('should export all issues to a sheet with already up-to-date contents via delta update', async () => {
        const tabId = await seedIdenticalTab(sheet);

        await exporter.exportIssues(
            {
                repo: REPO,
                types: ['issue', 'pr'],
            },
            {
                sheetUrl: `https://docs.google.com/spreadsheets/d/${SHEET_ID}/edit#gid=${tabId}`,
                deltaUpdate: true,
            }
        );

        const data = await getSheetData(sheet, tabId);
        expect(data).toEqual([HEADER, ...ACTUAL_ISSUES]);
    });

    it('should export all issues to a sheet with out-of-date contents via delta update', async () => {
        const tabId = await seedUpdatableTab(sheet);

        await exporter.exportIssues(
            {
                repo: REPO,
                types: ['issue', 'pr'],
            },
            {
                sheetUrl: `https://docs.google.com/spreadsheets/d/${SHEET_ID}/edit#gid=${tabId}`,
                deltaUpdate: true,
            }
        );

        const data = await getSheetData(sheet, tabId);
        expect(data).toEqual([HEADER, ...ACTUAL_ISSUES]);
    });

    it('should export all issues to a sheet with mixed contents via delta update', async () => {
        const tabId = await seedPartialTab(sheet);

        await exporter.exportIssues(
            {
                repo: REPO,
                types: ['issue', 'pr'],
            },
            {
                sheetUrl: `https://docs.google.com/spreadsheets/d/${SHEET_ID}/edit#gid=${tabId}`,
                deltaUpdate: true,
            }
        );

        const data = await getSheetData(sheet, tabId);
        expect(data).toEqual([HEADER, ...ACTUAL_ISSUES.slice(0, 3), ...EXTRA_ISSUES, ...ACTUAL_ISSUES.slice(3)]);
    });
});
