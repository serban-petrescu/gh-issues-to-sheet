import type { GoogleSpreadsheetRow, GoogleSpreadsheetWorksheet, ServiceAccountCredentials } from 'google-spreadsheet';
import { GoogleSpreadsheet } from 'google-spreadsheet';

import { BaseLoggedComponent } from './logger';
import type { Issue, IssueWriter, SheetProps } from './model';

const HEADER = ['repository', 'id', 'type', 'title', 'state', 'url', 'assignee', 'milestone', 'createdBy', 'createdAt', 'closedAt'];

export class GSheetWriter extends BaseLoggedComponent implements IssueWriter {
    constructor(private readonly sheetFactory: (id: string) => Promise<GoogleSpreadsheet>) {
        super();
    }

    public static forServiceAccountCredentials(creds: ServiceAccountCredentials): IssueWriter {
        return new GSheetWriter(async sheetId => {
            const doc = new GoogleSpreadsheet(sheetId);
            doc.useServiceAccountAuth(creds);
            return doc;
        });
    }

    public async writeIssues(issues: Issue[], props: SheetProps): Promise<void> {
        const [sheetId, tabId] = this.parseSheetUrl(props.sheetUrl);
        const doc = await this.sheetFactory(sheetId);
        await doc.loadInfo();
        this.logger.debug(`Loaded the sheet.`);
        const tab = doc.sheetsById[tabId];
        if (props.deltaUpdate) {
            await this.writeIssuesDelta(tab, issues);
            this.logger.debug(`Finished syncing the issues in the sheet.`);
        } else {
            await tab.clear();
            this.logger.debug(`Cleared the sheet.`);
            await this.writeIssuesFull(tab, issues);
            this.logger.debug(`Wrote the issues to the sheet.`);
        }
    }

    private async writeIssuesFull(tab: GoogleSpreadsheetWorksheet, issues: Issue[]): Promise<void> {
        await tab.setHeaderRow(HEADER);
        await tab.addRows(issues.map(this.convertIssueToRow));
    }

    private async writeIssuesDelta(tab: GoogleSpreadsheetWorksheet, issues: Issue[]): Promise<void> {
        await tab.setHeaderRow(HEADER);
        const rows = await tab.getRows();
        this.logger.info(`Loaded ${rows.length} existing rows from the sheet.`);
        const updated = new Set<number>();
        for (const row of rows) {
            const index = issues.findIndex(i => i.id === row.id && i.repository === row.repository);
            if (index !== -1) {
                await this.updateRow(row, issues[index]);
                updated.add(index);
            } else {
                this.logger.debug(`Didn't find ${row.id} in the issue list; skipping.`);
            }
        }
        const newIssues = issues.filter((_, index) => !updated.has(index));
        this.logger.info(`Adding ${newIssues.length} new issues at the end of the sheet.`);
        await tab.addRows(newIssues.map(this.convertIssueToRow));
    }

    private async updateRow(row: GoogleSpreadsheetRow, issue: Issue): Promise<void> {
        const updates = [
            this.updateField(row, issue, 'type'),
            this.updateField(row, issue, 'title'),
            this.updateField(row, issue, 'state'),
            this.updateField(row, issue, 'url'),
            this.updateField(row, issue, 'assignee'),
            this.updateField(row, issue, 'milestone'),
            this.updateField(row, issue, 'createdBy'),
            this.updateField(row, issue, 'createdAt'),
            this.updateField(row, issue, 'closedAt'),
        ];
        if (updates.some(v => v)) {
            await this.retry(() => row.save());
            this.logger.debug(`Updated ${row.id} with the latest data.`);
        } else {
            this.logger.debug(`Issue ${row.id} was already up to date.`);
        }
    }

    private async retry(cb: () => Promise<void>): Promise<void> {
        let error: unknown;
        for (const sleep of [0, 1000, 3000, 9000, 27000, 81000]) {
            await new Promise(resolve => setTimeout(resolve, sleep));
            try {
                await cb();
                return;
            } catch (e) {
                error = e;
                this.logger.info(`Got error while executing retry ${String(e)}`);
            }
        }
        throw error;
    }

    private updateField(row: GoogleSpreadsheetRow, issue: Issue, field: keyof Issue): boolean {
        const value = issue[field] ?? '';
        if (row[field] !== value && (value || row[field])) {
            row[field] = value;
            return true;
        }
        return false;
    }

    private convertIssueToRow(issue: Issue): string[] {
        return [
            issue.repository,
            issue.id,
            issue.type,
            issue.title,
            issue.state,
            issue.url,
            issue.assignee ?? '',
            issue.milestone ?? '',
            issue.createdBy ?? '',
            issue.createdAt,
            issue.closedAt ?? '',
        ];
    }

    private parseSheetUrl(url: string): [string, string] {
        //https://docs.google.com/spreadsheets/d/17LEtSJhcH-vRJpBTZaJKG4esuMIExuNPUdPGuXU72Mw/edit#gid=0
        const matches = url.match(/^https:\/\/docs.google.com\/spreadsheets\/d\/([^/]+)(?:\/[^#]+#gid=([0-9]+))$/);
        if (matches) {
            const result: [string, string] = [matches[1], matches[2] ?? '0'];
            this.logger.debug(`Parsed sheet URL: sheetId = ${result[0]}, tabId = ${result[1]}.`);
            return result;
        } else {
            this.logger.error(`Got an unparseable sheet URL: ${url}.`);
            throw new Error('Invalid google sheet URL');
        }
    }
}
