export type Logger = {
    debug: (message: string) => void;
    info: (message: string) => void;
    error: (message: string) => void;
};

export type WithLogger = {
    setLogger: (logger: Logger) => void;
};

export type IssueType = 'issue' | 'pr';

export type Issue = {
    id: string;
    type: IssueType;
    title: string;
    assignee: string | null;
    state: string;
    milestone: string | null;
    url: string;
    repository: string;
    createdBy: string | null;
    createdAt: string;
    closedAt: string | null;
};

export type IssueSearchCriteria = {
    repo: string;
    types: IssueType[];
    createdAfter?: string;
};

export type IssueReader = WithLogger & {
    findByCriteria: (criteria: IssueSearchCriteria) => Promise<Issue[]>;
};

export type SheetProps = {
    sheetUrl: string;
    deltaUpdate: boolean;
};

export type IssueWriter = WithLogger & {
    writeIssues: (issues: Issue[], props: SheetProps) => Promise<void>;
};
