import type { ServiceAccountCredentials } from 'google-spreadsheet';

import { GitHubReader } from './github-reader';
import { GSheetWriter } from './gsheet-writer';
import { IssueExporter } from './issue-exporter';
import type { IssueType, Logger } from './model';

type ExporterToGSheetsProps = {
    githubToken: string;
    googleCreds: ServiceAccountCredentials;
};

export function toGoogleSheets(props: ExporterToGSheetsProps): IssueExporter {
    const reader = GitHubReader.forToken(props.githubToken);
    const writer = GSheetWriter.forServiceAccountCredentials(props.googleCreds);
    return new IssueExporter(reader, writer);
}

export type { Logger, IssueType, IssueExporter };
