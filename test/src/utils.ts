import type { IssueExporter } from 'gh-issues-to-sheet-lib';
import { toGoogleSheets } from 'gh-issues-to-sheet-lib';
import { GoogleSpreadsheet } from 'google-spreadsheet';

export const SHEET_ID = '1JsAPGa4gKLE5vp_-Ph8WqzP6klpMt6R34k-ps2_-3Jo';
export const REPO = 'serban-petrescu/gh-issues-to-sheet-test-issues';

export const HEADER = ['repository', 'id', 'type', 'title', 'state', 'url', 'assignee', 'milestone', 'createdBy', 'createdAt', 'closedAt'];
export const ACTUAL_ISSUES = [
    [
        'serban-petrescu/gh-issues-to-sheet-test-issues',
        '1',
        'issue',
        'First',
        'closed',
        'https://github.com/serban-petrescu/gh-issues-to-sheet-test-issues/issues/1',
        'serban-petrescu',
        'Milestone',
        'serban-petrescu',
        '2023-01-01T13:50:08Z',
        '2023-01-01T13:50:45Z',
    ],
    [
        'serban-petrescu/gh-issues-to-sheet-test-issues',
        '2',
        'issue',
        'Second',
        'open',
        'https://github.com/serban-petrescu/gh-issues-to-sheet-test-issues/issues/2',
        'serban-petrescu',
        'Milestone',
        'serban-petrescu',
        '2023-01-01T13:50:14Z',
        '',
    ],
    [
        'serban-petrescu/gh-issues-to-sheet-test-issues',
        '3',
        'issue',
        'Third',
        'open',
        'https://github.com/serban-petrescu/gh-issues-to-sheet-test-issues/issues/3',
        '',
        '',
        'serban-petrescu',
        '2023-01-01T13:50:19Z',
        '',
    ],
    [
        'serban-petrescu/gh-issues-to-sheet-test-issues',
        '4',
        'pr',
        'Fourth',
        'closed',
        'https://github.com/serban-petrescu/gh-issues-to-sheet-test-issues/pull/4',
        'serban-petrescu',
        'Milestone',
        'serban-petrescu',
        '2023-01-01T13:51:32Z',
        '2023-01-01T13:51:55Z',
    ],
    [
        'serban-petrescu/gh-issues-to-sheet-test-issues',
        '5',
        'pr',
        'Fifth',
        'open',
        'https://github.com/serban-petrescu/gh-issues-to-sheet-test-issues/pull/5',
        '',
        '',
        'serban-petrescu',
        '2023-01-01T13:53:44Z',
        '',
    ],
];

export const EXTRA_ISSUES = [
    [
        'serban-petrescu/gh-issues-to-sheet-test-issues',
        '6',
        'pr',
        'Sixth',
        'closed',
        'https://github.com/serban-petrescu/gh-issues-to-sheet-test-issues/pull/6',
        'serban-petrescu',
        'Milestone',
        'serban-petrescu',
        '2023-01-01T13:55:32Z',
        '2023-01-01T13:55:56Z',
    ],
    [
        'serban-petrescu/gh-issues-to-sheet-test-issues',
        '7',
        'issue',
        'Seventh',
        'open',
        'https://github.com/serban-petrescu/gh-issues-to-sheet-test-issues/pull/7',
        '',
        '',
        'serban-petrescu',
        '2023-01-01T13:57:01Z',
        '',
    ],
];

export async function getGoogleSheet(): Promise<GoogleSpreadsheet> {
    const sheet = new GoogleSpreadsheet(SHEET_ID);
    await sheet.useServiceAccountAuth(JSON.parse(process.env.GSHEET_AUTH ?? '{}'));
    await sheet.loadInfo();
    return sheet;
}

export async function getIssueExporter(): Promise<IssueExporter> {
    return toGoogleSheets({
        githubToken: process.env.GITHUB_TOKEN ?? '',
        googleCreds: JSON.parse(process.env.GSHEET_AUTH ?? '{}'),
    });
}

export async function seedFullTab(sheet: GoogleSpreadsheet): Promise<string> {
    const tab = sheet.sheetsByTitle['full'];
    await tab.clear();
    return tab.sheetId;
}

export async function seedIssuesTab(sheet: GoogleSpreadsheet): Promise<string> {
    const tab = sheet.sheetsByTitle['issues'];
    await tab.clear();
    return tab.sheetId;
}

export async function seedPrsTab(sheet: GoogleSpreadsheet): Promise<string> {
    const tab = sheet.sheetsByTitle['prs'];
    await tab.clear();
    return tab.sheetId;
}

export async function seedBlankTab(sheet: GoogleSpreadsheet): Promise<string> {
    const tab = sheet.sheetsByTitle['blank'];
    await tab.clear();
    return tab.sheetId;
}

export async function seedIdenticalTab(sheet: GoogleSpreadsheet): Promise<string> {
    const tab = sheet.sheetsByTitle['identical'];
    await tab.clear();
    await tab.setHeaderRow(HEADER);
    await tab.addRows(ACTUAL_ISSUES);
    return tab.sheetId;
}

export async function seedDisjunctTab(sheet: GoogleSpreadsheet): Promise<string> {
    const tab = sheet.sheetsByTitle['disjunct'];
    await tab.clear();
    await tab.setHeaderRow(HEADER);
    await tab.addRows(EXTRA_ISSUES);
    return tab.sheetId;
}

export async function seedUpdatableTab(sheet: GoogleSpreadsheet): Promise<string> {
    const tab = sheet.sheetsByTitle['updatable'];
    await tab.clear();
    await tab.setHeaderRow(HEADER);
    const clone = ACTUAL_ISSUES.map(r => [...r]);
    clone.forEach(row => {
        row[3] += ' Old';
        row[4] = 'open';
        row[10] = '';
    });
    await tab.addRows(clone);
    return tab.sheetId;
}

export async function seedPartialTab(sheet: GoogleSpreadsheet): Promise<string> {
    const tab = sheet.sheetsByTitle['partial'];
    await tab.clear();
    await tab.setHeaderRow(HEADER);
    const clone = ACTUAL_ISSUES.slice(0, 3).map(r => [...r]);
    clone.forEach(row => {
        row[3] += ' Old';
        row[4] = 'open';
        row[10] = '';
    });
    await tab.addRows([...clone, ...EXTRA_ISSUES]);
    return tab.sheetId;
}

export async function getSheetData(sheet: GoogleSpreadsheet, tabId: string): Promise<string[][]> {
    const tab = sheet.sheetsById[tabId];
    await tab.loadCells();
    const result: string[][] = [];
    for (let row = 0; row < ACTUAL_ISSUES.length + EXTRA_ISSUES.length + 1; ++row) {
        const current: string[] = [];
        for (let column = 0; column < HEADER.length; ++column) {
            current.push(String(tab.getCell(row, column).value ?? ''));
        }
        if (current.some(v => !!v)) {
            result.push(current);
        } else {
            return result;
        }
    }
    return result;
}
