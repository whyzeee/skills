---
name: issue-tracker-sync
description: Use when aligning Notion, GitHub Issues, GitLab Issues, Trello, Linear, or Hermes Kanban so one human-facing tracker stays safely mirrored from repo-native trackers.
version: 1.0.0
author: Hermes Agent
license: MIT
platforms: [linux, macos, windows]
metadata:
  hermes:
    tags: [Notion, GitLab, GitHub, issues, sync, task-tracking]
---

# Issue Tracker Sync

Use this for a **safe mirror**: one source of truth, stable external keys, visible sync errors, and no cross-system hard deletes.

## Workflow

1. **Choose the master tracker.** Default to Notion or the user's existing board as the human-facing master, with repo issues as execution mirrors. Completion: exactly one master is named before writes begin.
2. **Inspect both schemas.** Identify title, status, project/repo, external id, external url, source, last synced, sync state, and tombstone fields. Completion: every required field is either mapped to an existing property or explicitly marked to create.
3. **Import before writeback.** Build the first pass as one-direction external tracker -> master tracker. Completion: create/update works once end-to-end before any master -> repo writeback exists.
4. **Upsert by stable key.** Use keys such as `gitlab:{project_id}:{iid}` or `github:{owner}/{repo}:{number}`. Completion: matching never depends on title text.
5. **Tombstone removals.** Map missing/closed/deleted remote state to `Archived`, `Closed`, or `Deleted Externally = true`; never hard-delete across systems. Completion: disappeared external items remain auditable in the master tracker.
6. **Publish sync state.** Write success/error state and last sync time back to the master row. Completion: a human can see `Synced`, `Drift`, `Error`, or `Pending` without reading logs.
7. **Summarize tersely.** Print `fetched/created/updated/archived/errors`. Completion: final output names counts and any failed external keys.

## Minimal Notion Tasks schema

Use this unless the user already has equivalent fields.

| Property | Type | Purpose |
|---|---|---|
| `Name` | title | Task or issue title |
| `Status` | select | Inbox / Todo / Doing / Blocked / Done / Archived |
| `Project` | rich_text or select | Project key |
| `Repo` | url | Repo URL |
| `Tracker` | select | GitLab / GitHub / None / Hermes |
| `External ID` | rich_text | Stable sync key |
| `External URL` | url | Source issue URL |
| `Source` | select | Notion / Hermes / GitLab / GitHub |
| `Last Synced At` | date | Last successful sync |
| `Sync State` | select | Synced / Drift / Error / Pending |
| `Deleted Externally` | checkbox | Tombstone flag |

## Notion API facts

With `Notion-Version: 2025-09-03`:

- Create a database with `POST /v1/databases`.
- Query rows with `POST /v1/data_sources/{data_source_id}/query`.
- Create rows with `POST /v1/pages` and `parent.database_id`.
- Patch data source properties with `PATCH /v1/data_sources/{data_source_id}`.
- Store both IDs: `database_id` for row creation, `data_source_id` for queries.

`POST /v1/data_sources` does not create a database in this API version.

## CLI preferences

Prefer existing authenticated CLIs over new tokens. For self-hosted GitLab, scope API calls with `--hostname <target-host>`.

## Reference

Load `references/notion-gitlab-hermes-tasks.md` for a sanitized Notion + self-hosted GitLab recipe.
