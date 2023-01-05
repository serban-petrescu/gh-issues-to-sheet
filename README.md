[![Release](https://github.com/serban-petrescu/gh-issues-to-sheet/actions/workflows/release.yml/badge.svg)](https://github.com/serban-petrescu/gh-issues-to-sheet/actions/workflows/release.yml)

# Sync GitHub issues to a sheet

This action exports all the issues and pull requests of a repository from GitHub to a tab of a Google Sheet. It can perform either a full export (i.e. clear the sheet + write the new data) or a delta export (i.e. update/append only the modified/new issues).

# Upcoming features

If this action gains any traction, I'll add support for pushing data into Excel (Sharepoint/OneDrive hosted). Please submit any other suggestions via a issue on the action's repository.

# Usage

<!-- start usage -->

```yaml
- uses: serban-petrescu/gh-issues-to-sheet@v1
  with:
      # Repository name with owner. For example, actions/checkout
      # Default: ${{ github.repository }}
      repository: ''
      # Personal access token (PAT) used to read the issues/pull requests of the given
      # repository. Note that at this time, using fine-grained tokens (GitHub beta)
      # does not work with simultaneously reading issues AND prs in the same run.
      # Default: ${{ github.token }}
      token: ''
      # The types of issues to read. Possible values:
      #  - issue - only reads regular issues, no pull requests.
      #  - pr - only reads pull requests, no issues.
      #  - issue,pr - reads both regular issues and pull requests.
      # Default: issue
      issue-types: 'issue|pr|issue,pr'
      # If set to true, it will perform a delta update by inspecting the data already
      # present in the target sheet:
      #  - If an issue already exists as a row of the sheet, it will update the row
      #    with the latest data.
      #  - If an issues is missing in the sheet, it will append a new row with the
      #    latest data.
      #  - If a row does not correspond to any current issue, it will skip it.
      # Otherwise, the action will clear the target tab and then dump the issues in
      # the tab.
      delta-update: false
      # The full URL of the target sheet, including the tab ID ("gid" hash param).
      sheet-url: 'https://docs.google.com/spreadsheets/d/1kkhx.../edit#gid=0'
      # A set of Google service account credentials that have at least Editor access
      # to the sheet above. See the official Google documentation: 
      # https://developers.google.com/workspace/guides/create-credentials#service-account
      sheet-creds: '{"type": "service_account",...}'
```

<!-- end usage -->

# Scenarios

## Export the issues each time an issue is created/closed

```yaml
name: Export issues

on:
    issues:
        types: [opened, closed]

jobs:
    run-sync:
        runs-on: ubuntu-latest
        steps:
            - uses: serban-petrescu/gh-issues-to-sheet@v1
              with:
                  sheet-url: https://docs.google.com/spreadsheets/d/1kkhxNIh7Q5ALvlDRarB5RfU_2p57IE0FRnJhQxDiw2w/edit#gid=843890819
                  sheet-creds: ${{ secrets.GSHEET_CREDS }}
                  delta-update: true

```

# License

The scripts and documentation in this project are released under the [MIT License](LICENSE).
