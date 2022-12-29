import { BaseLoggedComponent } from './logger';
import type { IssueReader, IssueSearchCriteria, IssueWriter, Logger, SheetProps } from './model';

export class IssueExporter extends BaseLoggedComponent {
    constructor(private readonly reader: IssueReader, private readonly writer: IssueWriter) {
        super();
    }

    public async exportIssues(criteria: IssueSearchCriteria, props: SheetProps) {
        const issues = await this.reader.findByCriteria(criteria);
        this.logger.info(`Read ${issues.length} issues from GitHub.`);
        await this.writer.writeIssues(issues, props);
    }

    public setLogger(logger: Logger): void {
        super.setLogger(logger);
        this.reader.setLogger(logger);
        this.writer.setLogger(logger);
    }
}
