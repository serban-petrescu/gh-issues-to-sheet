import type { Octokit } from '@octokit/rest';

import { GitHubReader } from './github-reader';
import type { Logger } from './model';

describe('GitHubReader', () => {
    const repository = 'gh-issues-to-sheet';
    const logger: Logger = {
        debug: jest.fn(),
        info: jest.fn(),
        error: jest.fn(),
    };
    const issuesAndPullRequests = jest.fn();
    const mockOctokit = { search: { issuesAndPullRequests } } as unknown as Octokit;
    const reader = new GitHubReader(mockOctokit);
    reader.setLogger(logger);

    function makeGhIssue(number: number): object {
        return {
            number,
            title: `Issue ${String(number)}`,
            state: 'closed',
            html_url: `https://github.com/serban-petrescu/gh-issues-to-sheet/issues/${number}`,
            created_at: `2022-12-30T09:${String(number).padStart(2, '0')}:00.000Z`,
            closed_at: '2022-12-30T10:00:00.000Z',
            repository_url: 'https://github.com/serban-petrescu/gh-issues-to-sheet',
        };
    }

    describe('findByCriteria', () => {
        it('should return empty for empty query result', async () => {
            jest.mocked(issuesAndPullRequests)
                .mockReset()
                .mockResolvedValue({ data: { items: [] } });

            const result = await reader.findByCriteria({ repo: 'repo', types: ['issue'] });

            expect(result).toEqual([]);
        });
        it('should stop once an empty page is received', async () => {
            jest.mocked(issuesAndPullRequests)
                .mockReset()
                .mockResolvedValueOnce({ data: { items: [makeGhIssue(1)] } })
                .mockResolvedValueOnce({ data: { items: [makeGhIssue(2)] } })
                .mockResolvedValueOnce({ data: { items: [] } });

            const result = await reader.findByCriteria({ repo: 'repo', types: ['issue'] });

            expect(result).toMatchObject([
                { id: '1', repository },
                { id: '2', repository },
            ]);
            expect(issuesAndPullRequests).toHaveBeenCalledTimes(3);
            expect(issuesAndPullRequests).toHaveBeenNthCalledWith(1, expect.objectContaining({ page: 1 }));
            expect(issuesAndPullRequests).toHaveBeenNthCalledWith(2, expect.objectContaining({ page: 2 }));
            expect(issuesAndPullRequests).toHaveBeenNthCalledWith(3, expect.objectContaining({ page: 3 }));
        });
        it('should filter for issues when only issues are requested', async () => {
            jest.mocked(issuesAndPullRequests)
                .mockReset()
                .mockResolvedValue({ data: { items: [] } });

            await reader.findByCriteria({ repo: 'repo', types: ['issue'] });

            expect(issuesAndPullRequests).toHaveBeenCalledWith(expect.objectContaining({ q: 'repo:repo is:issue' }));
        });
        it('should filter for PRs when only PRs are requested', async () => {
            jest.mocked(issuesAndPullRequests)
                .mockReset()
                .mockResolvedValue({ data: { items: [] } });

            await reader.findByCriteria({ repo: 'repo', types: ['pr'] });

            expect(issuesAndPullRequests).toHaveBeenCalledWith(expect.objectContaining({ q: 'repo:repo is:pr' }));
        });
        it('should only filter for repo if both issues and PRs are requested', async () => {
            jest.mocked(issuesAndPullRequests)
                .mockReset()
                .mockResolvedValue({ data: { items: [] } });

            await reader.findByCriteria({ repo: 'repo', types: ['issue', 'pr'] });

            expect(issuesAndPullRequests).toHaveBeenCalledWith(expect.objectContaining({ q: 'repo:repo' }));
        });
        it('should partition based on creation date', async () => {
            jest.mocked(issuesAndPullRequests)
                .mockReset()
                .mockResolvedValueOnce({ data: { items: [makeGhIssue(1)] } })
                .mockResolvedValueOnce({ data: { items: [makeGhIssue(2)] } })
                .mockResolvedValueOnce({ data: { items: [makeGhIssue(3)] } })
                .mockResolvedValueOnce({ data: { items: [makeGhIssue(4)] } })
                .mockResolvedValueOnce({ data: { items: [makeGhIssue(5)] } })
                .mockResolvedValueOnce({ data: { items: [makeGhIssue(6)] } })
                .mockResolvedValueOnce({ data: { items: [makeGhIssue(7)] } })
                .mockResolvedValueOnce({ data: { items: [makeGhIssue(8)] } })
                .mockResolvedValueOnce({ data: { items: [makeGhIssue(9)] } })
                .mockResolvedValueOnce({ data: { items: [makeGhIssue(10)] } })
                .mockResolvedValueOnce({ data: { items: [makeGhIssue(11)] } })
                .mockResolvedValueOnce({ data: { items: [] } });

            const result = await reader.findByCriteria({ repo: 'repo', types: ['issue'] });

            expect(result).toMatchObject([
                { id: '1', repository },
                { id: '2', repository },
                { id: '3', repository },
                { id: '4', repository },
                { id: '5', repository },
                { id: '6', repository },
                { id: '7', repository },
                { id: '8', repository },
                { id: '9', repository },
                { id: '10', repository },
                { id: '11', repository },
            ]);
            expect(issuesAndPullRequests).toHaveBeenCalledTimes(12);
            expect(issuesAndPullRequests).toHaveBeenNthCalledWith(
                1,
                expect.objectContaining({
                    page: 1,
                    q: 'repo:repo is:issue',
                    sort: 'created',
                    order: 'asc',
                })
            );
            expect(issuesAndPullRequests).toHaveBeenNthCalledWith(
                2,
                expect.objectContaining({
                    page: 2,
                    q: 'repo:repo is:issue',
                    sort: 'created',
                    order: 'asc',
                })
            );
            expect(issuesAndPullRequests).toHaveBeenNthCalledWith(
                11,
                expect.objectContaining({
                    page: 1,
                    sort: 'created',
                    order: 'asc',
                    q: 'repo:repo is:issue created:>2022-12-30T09:10:00.000Z',
                })
            );
            expect(issuesAndPullRequests).toHaveBeenNthCalledWith(
                12,
                expect.objectContaining({
                    page: 2,
                    sort: 'created',
                    order: 'asc',
                    q: 'repo:repo is:issue created:>2022-12-30T09:10:00.000Z',
                })
            );
        });
    });
});
