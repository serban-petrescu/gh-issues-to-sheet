import { config } from 'dotenv';

import { toGoogleSheets } from '.';

config();

const exporter = toGoogleSheets({
    githubToken: process.env.GITHUB_TOKEN ?? '',
    googleCreds: JSON.parse(process.env.GSHEET_AUTH ?? '{}'),
});

// eslint-disable-next-line @typescript-eslint/no-floating-promises
exporter.exportIssues(
    {
        repo: process.env.GITHUB_REPO ?? '',
        types: ['issue', 'pr'],
    },
    {
        sheetUrl: process.env.GSHEET_URL ?? '',
        deltaUpdate: true,
    }
);
