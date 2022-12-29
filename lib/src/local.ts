import { config } from 'dotenv';

import { toGoogleSheets } from '.';

config();

const exporter = toGoogleSheets({
    githubToken: process.env.GITHUB_TOKEN ?? '',
    googleCreds: JSON.parse(process.env.GSHEET_AUTH ?? '{}'),
});

exporter.exportIssues(
    {
        repo: 'trilogy-group/aurea-insidesales-telephony-5k',
        types: ['issue'],
    },
    {
        sheetUrl: 'https://docs.google.com/spreadsheets/d/1kkhxNIh7Q5ZLvlDRarB5RfU_2p57IE0FRnJhQxDiw1w/edit#gid=843890819',
        deltaUpdate: true,
    }
);
