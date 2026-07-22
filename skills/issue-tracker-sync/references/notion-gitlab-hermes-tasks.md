# Notion + self-hosted GitLab sync recipe

Use this as a generic recipe for mirroring a self-hosted GitLab project into a Notion Tasks database. Fill in local IDs and URLs at runtime; do not commit private workspace values into the skill.

## Intent

Notion is the human-facing master tracker. Repo issue trackers mirror execution work into Notion. Updates must be visible and reversible; deletes must become tombstones, not hard deletes.

## Notion Tasks database

Required runtime values:

```text
database_id: <notion_database_id>
data_source_id: <notion_data_source_id>
```

Use `database_id` for row creation with `POST /v1/pages`. Use `data_source_id` for queries with `POST /v1/data_sources/{id}/query`.

Properties:

```text
Name, Status, Project, Repo, Tracker, External ID, External URL,
Source, Last Synced At, Sync State, Deleted Externally
```

## Notion API pitfall

With `Notion-Version: 2025-09-03`, this fails for database creation:

```text
POST /v1/data_sources
```

Error signature:

```text
Creating new databases with data sources is not supported in this endpoint for API version 2025-09-03 and later. Use the Create Database API instead.
```

Use this instead:

```text
POST /v1/databases
```

If the new database only exposes `Name`, patch properties on the data source:

```text
PATCH /v1/data_sources/{data_source_id}
```

## GitLab access

Use `glab` when it is already authenticated. For self-hosted GitLab, scope calls with `--hostname`:

```bash
glab api --hostname <gitlab_host> "projects/<project_id>/issues?state=all&per_page=100&order_by=updated_at&sort=desc"
```

A failing `gitlab.com` account in `glab auth status` is not fatal if the target self-hosted host API call works.

## Stable keys

Use a stable key per external issue:

```text
gitlab:<project_id>:<iid>
github:<owner>/<repo>:<number>
```

Closed external issues usually map to `Status = Done` and `Sync State = Synced` unless the user has a different status policy.

## Safe first script

1. GitLab -> Notion only.
2. Upsert by `External ID`.
3. Preserve active Notion statuses such as `Doing` and `Blocked` unless the user asks GitLab to override them.
4. Mark disappeared external issues as archived/tombstoned.
5. Print `fetched/created/updated/errors`.

Add Notion -> GitLab writeback only after this script runs cleanly once.
