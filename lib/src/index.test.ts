import { toGoogleSheets } from '.';
import { IssueExporter } from './issue-exporter';

describe('index', () => {
    describe('toGoogleSheets', () => {
        it('should instantiate the exporter', () => {
            const result = toGoogleSheets({
                githubToken: 'ghp_faketokenhere',
                googleCreds: {
                    client_email: 'someone@example.com',
                    private_key: '-----BEGIN PRIVATE KEY-----\nasdasdad\n-----END PRIVATE KEY-----\n',
                },
            });
            expect(result).toBeInstanceOf(IssueExporter);
        });
    });
});
