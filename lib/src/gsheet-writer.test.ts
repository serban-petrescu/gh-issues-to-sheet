import type { GoogleSpreadsheet, GoogleSpreadsheetRow, GoogleSpreadsheetWorksheet } from 'google-spreadsheet';

import { GSheetWriter, HEADER } from './gsheet-writer';
import type { Issue, Logger } from './model';

describe('GSheetWriter', () => {
    const repository = 'gh-issues-to-sheet';
    const sheetId = '17LEtSJhcH-vRJpBTZaJKG4ABCdIExuNPUdPGuXU72Mw';
    const tabId = '12353454';
    const sheetUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/edit#gid=${tabId}`;

    const logger: Logger = {
        debug: jest.fn(),
        info: jest.fn(),
        error: jest.fn(),
    };
    const tab = {
        clear: jest.fn(),
        setHeaderRow: jest.fn(),
        addRows: jest.fn(),
        getRows: jest.fn(),
    } as unknown as GoogleSpreadsheetWorksheet;
    const doc = { sheetsById: { [tabId]: tab }, loadInfo: jest.fn() } as unknown as GoogleSpreadsheet;
    const sheetFactory = jest.fn().mockResolvedValue(doc);
    const writer = new GSheetWriter(sheetFactory, [0, 0]);
    writer.setLogger(logger);

    function buildIssue(id: string): Issue {
        return {
            id,
            assignee: null,
            createdBy: null,
            type: 'issue',
            title: `Issue ${id}`,
            state: 'closed',
            milestone: null,
            closedAt: null,
            url: `https://github.com/serban-petrescu/gh-issues-to-sheet/issues/${id}`,
            createdAt: `2022-12-30T09:${id.padStart(2, '0')}:00.000Z`,
            repository,
        };
    }

    function buildRow(id: string, changeTitle = false): GoogleSpreadsheetRow {
        const issue = buildIssue(id);
        return {
            ...issue,
            title: changeTitle ? issue.title + ' - Old' : issue.title,
            a1Range: '',
            rowIndex: 0,
            delete: jest.fn(),
            save: jest.fn(),
        };
    }

    describe('writeIssues', () => {
        it('should clear and put when delta update is disabled and empty issue array is passed', async () => {
            await writer.writeIssues([], { sheetUrl, deltaUpdate: false });

            expect(sheetFactory).toHaveBeenCalledWith(sheetId);
            expect(tab.clear).toHaveBeenCalled();
            expect(tab.setHeaderRow).toHaveBeenCalledWith(HEADER);
            expect(tab.addRows).toHaveBeenCalledWith([]);
        });
        it('should clear and put when delta update is disabled and issue array is passed', async () => {
            await writer.writeIssues([buildIssue('1'), buildIssue('2')], { sheetUrl, deltaUpdate: false });

            expect(sheetFactory).toHaveBeenCalledWith(sheetId);
            expect(tab.clear).toHaveBeenCalled();
            expect(tab.setHeaderRow).toHaveBeenCalledWith(HEADER);
            expect(tab.addRows).toHaveBeenCalledWith([
                expect.objectContaining([repository, '1']),
                expect.objectContaining([repository, '2']),
            ]);
        });
        it('should error if the sheet URL is unparsable', async () => {
            await expect(writer.writeIssues([], { sheetUrl: 'BLA', deltaUpdate: false })).rejects.toThrowError();
            expect(logger.error).toHaveBeenCalled();
        });
        it('should add rows when delta updating an empty sheet', async () => {
            jest.mocked(tab.getRows).mockResolvedValue([]);

            await writer.writeIssues([buildIssue('1'), buildIssue('2')], { sheetUrl, deltaUpdate: true });

            expect(sheetFactory).toHaveBeenCalledWith(sheetId);
            expect(tab.setHeaderRow).toHaveBeenCalledWith(HEADER);
            expect(tab.addRows).toHaveBeenCalledWith([
                expect.objectContaining([repository, '1']),
                expect.objectContaining([repository, '2']),
            ]);
        });
        it('should add rows when delta updating an sheet with unknown issues', async () => {
            const rows = [buildRow('3')];
            jest.mocked(tab.getRows).mockResolvedValue(rows);

            await writer.writeIssues([buildIssue('1'), buildIssue('2')], { sheetUrl, deltaUpdate: true });

            expect(sheetFactory).toHaveBeenCalledWith(sheetId);
            expect(tab.setHeaderRow).toHaveBeenCalledWith(HEADER);
            expect(tab.addRows).toHaveBeenCalledWith([
                expect.objectContaining([repository, '1']),
                expect.objectContaining([repository, '2']),
            ]);
            expect(rows[0].save).not.toHaveBeenCalled();
            expect(rows[0].delete).not.toHaveBeenCalled();
        });
        it('should update rows when delta updating an sheet with same changed issues', async () => {
            const rows = [buildRow('1', true), buildRow('2', true)];
            const issues = [buildIssue('1'), buildIssue('2')];
            jest.mocked(tab.getRows).mockResolvedValue(rows);

            await writer.writeIssues([...issues].reverse(), { sheetUrl, deltaUpdate: true });

            expect(sheetFactory).toHaveBeenCalledWith(sheetId);
            expect(tab.setHeaderRow).toHaveBeenCalledWith(HEADER);
            expect(tab.addRows).toHaveBeenCalledWith([]);
            expect(rows[0].save).toHaveBeenCalled();
            expect(rows[0].title).toEqual(issues[0].title);
            expect(rows[0].delete).not.toHaveBeenCalled();
            expect(rows[1].save).toHaveBeenCalled();
            expect(rows[1].title).toEqual(issues[1].title);
            expect(rows[1].delete).not.toHaveBeenCalled();
        });
        it('should not update rows when delta updating an sheet with same unchanged issues', async () => {
            const rows = [buildRow('1'), buildRow('2')];
            const issues = [buildIssue('1'), buildIssue('2')];
            jest.mocked(tab.getRows).mockResolvedValue(rows);

            await writer.writeIssues([...issues].reverse(), { sheetUrl, deltaUpdate: true });

            expect(sheetFactory).toHaveBeenCalledWith(sheetId);
            expect(tab.setHeaderRow).toHaveBeenCalledWith(HEADER);
            expect(tab.addRows).toHaveBeenCalledWith([]);
            expect(rows[0].save).not.toHaveBeenCalled();
            expect(rows[0].delete).not.toHaveBeenCalled();
            expect(rows[1].save).not.toHaveBeenCalled();
            expect(rows[1].delete).not.toHaveBeenCalled();
        });
        it('should retry in case the save fails', async () => {
            const row = buildRow('1', true);
            jest.mocked(row.save).mockRejectedValueOnce(new Error());
            const issue = buildIssue('1');
            jest.mocked(tab.getRows).mockResolvedValue([row]);

            await writer.writeIssues([issue], { sheetUrl, deltaUpdate: true });

            expect(sheetFactory).toHaveBeenCalledWith(sheetId);
            expect(tab.setHeaderRow).toHaveBeenCalledWith(HEADER);
            expect(tab.addRows).toHaveBeenCalledWith([]);
            expect(row.save).toHaveBeenCalled();
            expect(row.delete).not.toHaveBeenCalled();
        });
        it('should retry in case the save fails, throw an error eventually', async () => {
            const error = new Error('Something');
            const row = buildRow('1', true);
            jest.mocked(row.save).mockRejectedValue(error);
            const issue = buildIssue('1');
            jest.mocked(tab.getRows).mockResolvedValue([row]);

            await expect(writer.writeIssues([issue], { sheetUrl, deltaUpdate: true })).rejects.toThrowError(error);

            expect(sheetFactory).toHaveBeenCalledWith(sheetId);
            expect(tab.setHeaderRow).toHaveBeenCalledWith(HEADER);
            expect(row.save).toHaveBeenCalled();
            expect(row.delete).not.toHaveBeenCalled();
            expect(logger.error).toHaveBeenCalled();
        });
    });
});
