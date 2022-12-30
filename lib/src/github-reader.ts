import { Octokit } from '@octokit/rest';

import { BaseLoggedComponent } from './logger';
import type { Issue, IssueReader, IssueSearchCriteria, IssueType } from './model';

export class GitHubReader extends BaseLoggedComponent implements IssueReader {
    constructor(private readonly client: Octokit) {
        super();
    }

    public static forToken(token: string): IssueReader {
        return new GitHubReader(new Octokit({ auth: token }));
    }

    public async findByCriteria(criteria: IssueSearchCriteria): Promise<Issue[]> {
        const result: Issue[] = [];
        const criteriaCopy: IssueSearchCriteria = { ...criteria };
        let page: Issue[];
        let hasMore: boolean;
        do {
            [page, hasMore] = await this.findPageByCriteria(criteriaCopy);
            result.push(...page);
            if (page.length > 0) {
                criteriaCopy.createdAfter = page[page.length - 1].createdAt;
            }
            if (hasMore) {
                this.logger.debug(`Read a batch of issues, but we're not done yet. Reading next batch.`);
            }
        } while (hasMore);
        return result;
    }

    private async findPageByCriteria(criteria: IssueSearchCriteria): Promise<[Issue[], boolean]> {
        const q = this.buildQuery(criteria);
        const result: Issue[] = [];
        // GitHub only allows reading the first 1000 results
        for (let page = 1; page <= 10; ++page) {
            const response = await this.client.search.issuesAndPullRequests({
                per_page: 100,
                page,
                q,
                sort: 'created',
                order: 'asc',
            });
            this.logger.debug(`Retrieved page ${page} of issues from GitHub.`);
            if (!response.data.items.length) {
                this.logger.debug(`Page was empty, issue list was fully read.`);
                return [result, false];
            }
            result.push(
                ...response.data.items.map(issue => ({
                    id: String(issue.number),
                    type: (issue.pull_request ? 'pr' : 'issue') as IssueType,
                    title: issue.title,
                    state: issue.state,
                    assignee: issue.assignee?.login ?? null,
                    milestone: issue.milestone?.title ?? null,
                    createdBy: issue.user?.login ?? null,
                    closedAt: issue.closed_at ?? null,
                    createdAt: issue.created_at,
                    url: issue.html_url,
                    repository: this.urlToRepoName(issue.repository_url),
                }))
            );
        }
        return [result, true];
    }

    private urlToRepoName(url: string): string {
        const [, , , , ...parts] = url.split('/');
        const result = parts.join('/');
        this.logger.debug(`Derived repository ${result} for url ${url}`);
        return result;
    }

    private buildQuery(criteria: IssueSearchCriteria): string {
        let query = `repo:${criteria.repo}`;
        if (criteria.types.includes('issue') && !criteria.types.includes('pr')) {
            query += ' is:issue';
        } else if (criteria.types.includes('pr') && !criteria.types.includes('issue')) {
            query += ' is:pr';
        }
        if (criteria.createdAfter) {
            query += ` created:>${criteria.createdAfter}`;
        }
        this.logger.debug(`Built search query "${query}" from criteria ${JSON.stringify(criteria)}`);
        return query;
    }
}
