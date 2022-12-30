import { IssueExporter } from './issue-exporter';
import type { IssueReader, IssueWriter, Logger } from './model';

describe('IssueExporter', () => {
    const logger = { info: jest.fn() } as unknown as Logger;
    const reader: IssueReader = { findByCriteria: jest.fn(), setLogger: jest.fn() };
    const writer: IssueWriter = { writeIssues: jest.fn(), setLogger: jest.fn() };
    const exporter = new IssueExporter(reader, writer);
    const props = { sheetUrl: '', deltaUpdate: false };
    const criteria = { repo: '', types: [] };
    jest.mocked(reader.findByCriteria).mockResolvedValue([]);

    describe('exportIssues', () => {
        it('should call the reader and writer', async () => {
            exporter.setLogger(logger);

            await exporter.exportIssues(criteria, props);

            expect(reader.findByCriteria).toHaveBeenCalledTimes(1);
            expect(reader.findByCriteria).toHaveBeenCalledWith(criteria);
            expect(writer.writeIssues).toHaveBeenCalledTimes(1);
            expect(writer.writeIssues).toHaveBeenCalledWith([], props);
        });
    });
    describe('setLogger', () => {
        it('should propagate the logger to both the reader and writer', () => {
            exporter.setLogger(logger);
            expect(reader.setLogger).toHaveBeenCalledWith(logger);
            expect(writer.setLogger).toHaveBeenCalledWith(logger);
        });
        it('should use the passed logger', async () => {
            exporter.setLogger(logger);

            await exporter.exportIssues(criteria, props);

            expect(logger.info).toHaveBeenCalled();
        });
    });
});
