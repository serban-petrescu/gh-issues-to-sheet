import { config } from 'dotenv';

import { toGoogleSheets } from '.';

config();

const exporter = toGoogleSheets({
    githubToken: process.env.GITHUB_TOKEN ?? '',
    googleCreds: JSON.parse(process.env.GSHEET_AUTH ?? '{}'),
});

exporter.exportIssues(
    {
        repo: process.env.GITHUB_REPO ?? '',
        types: ['issue'],
    },
    {
        sheetUrl: process.env.GSHEET_URL ?? '',
        deltaUpdate: true,
    }
);
