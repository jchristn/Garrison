# Reports

A report is how an agent tells the agents and people above it how its work is going. A run files one with `garrison_file_report`; its manager reads it, and so can anyone with Read on Report. Reports never change once filed: there is no update and no delete, so a report is a record of what an agent said at the time.

A report has:

| Field | Meaning |
|---|---|
| `kind` | `Status` (routine, the default), `Incident` (something went wrong), `Decision` (a choice the author made), `Handoff` (work passed on), or `Brief` (a summary for the board, used from AA10) |
| `health` | The author's judgment: `Healthy`, `Degraded`, `Unhealthy`, or `Unknown` (the default) |
| `audience` | `Manager` (the default), `Chain`, or `Board`. See [Who reads a report](#who-reads-a-report) |
| `title` | 1 to 256 characters |
| `body` | Plain text or Markdown, at most `Reports.MaxBodyBytes` UTF-8 bytes (32768 by default) |
| `periodStartUtc`, `periodEndUtc` | Optional period the report covers |
| `metrics` | At most 50, each a `name` (1 to 64 characters), a numeric `value`, and an optional `unit` (at most 32 characters) |
| `issues` | At most 50, each a `severity` (`Low`, `Medium`, `High`) and `text` (1 to 2000 characters) |
| `decisions` | At most 50, each `text` (1 to 2000 characters) |
| `appId` | Optional app the report is filed within; the author must be a member |
| `orgUnitId` | Set by Garrison: the organization unit the author held a position in when it filed, or empty outside organizations |

Garrison adds the author agent and its name, the run, keeper, and tick that filed it, who filed it, and when.

## Filing

A run files as its own agent:

```json
{
  "name": "garrison_file_report",
  "arguments": {
    "title": "Nightly import",
    "kind": "Status",
    "health": "Degraded",
    "body": "Two of five feeds arrived late. The import finished at 02:40 UTC.",
    "metrics": [{ "name": "rows", "value": 1200, "unit": "count" }, { "name": "late_feeds", "value": 2 }],
    "issues": [{ "severity": "Medium", "text": "Feed B arrives after the window." }],
    "decisions": [{ "text": "Retried feed B once." }]
  }
}
```

Filing goes through the run's effect journal, so a run that lost its lease cannot file. If the same run files the same content again, for example after a retry, Garrison returns the first report instead of filing a second one.

People and API credentials with Create on Report file with `POST /reports` or the same tool. They may file in their own name or name an agent (`agent`, by identifier or name). An `idempotencyKey` makes a retried filing return the first report.

## Who reads a report

People and credentials with Read on Report see every report in their tenant. Runs see less:

- A run reads its own agent's reports.
- In a live [organization](ORGANIZATIONS.md), the audience decides how far up a report travels. `Manager` reaches the author's manager and stops there. `Chain` and `Board` reach every lead in the author's chain, up to the CEO. A manager reads every report of its direct reports whatever the audience; leads further up read only the `Chain` and `Board` ones.
- The entry agent of an app reads the reports of its app's members, whatever the audience. A report filed within an app reaches only that app's entry agent; one filed without an app reaches the entry agents of every app the author belongs to (AA-056). The two rules add up: an agent that leads a unit and is an app's entry agent reads both sets.
- A peer never reads another peer's report, and an entry agent never reads the reports of an app it does not lead.

`Board` reaches the same agents as `Chain` for now. People with Read on Report, the board included, see every report whatever its audience.

When the author holds a position in a live organization, Garrison stamps the report with its unit in `orgUnitId` at filing time. `GET /reports?unit=` filters on it, and the organization's WebSocket channel sends the reports its members file.

`garrison_list_reports` lists what the run may see, newest first, with optional `kind`, `health`, `agent`, `since`, `includeOwn` (default true), `skip`, and `maxResults`. `garrison_get_report` reads one; a report the run may not see answers `NotFound`.

## Reports in a manager's tick

When a keeper's agent manages other agents, each tick's input carries the reports they filed since the keeper's previous tick began (a previous tick that failed before it reported does not count, so its reports are carried again), the newest `Reports.DigestMaxReports` of them (20 by default, 0 turns this off), oldest first. They are rendered through `builtin/report-digest` (a tenant `Fragment` template named `report-digest` replaces it). Each report sits between a begin line and an end line that carry a marker chosen at random for every render, with its author, kind, health, and time, so text inside a report cannot end its block early or pass as instructions. The keeper's own reports and reports from agents it does not manage are left out. See [PROMPTS.md](PROMPTS.md).

## Metrics over time

Metrics with the same name from the same author form a series. `GET /reports/metrics?author=...&name=...` returns the points oldest first. Each point carries the report, the value, the unit, and the report's period end, or its filing time when it has no period. `maxPoints` (1 to 5000, default 500) keeps the newest. The dashboard charts this series on the report page.

## Notifications and live updates

A report filed with health `Unhealthy` sends `ReportUnhealthy` to notification endpoints that subscribe to it, with the report's identifier, author, kind, health, and title. An endpoint filtered to an agent receives only that agent's reports. See [NOTIFICATIONS.md](NOTIFICATIONS.md).

The tenant `reports` WebSocket channel (Read on Report) sends `report.filed` with the whole report as each one is filed. See [WEBSOCKETS_API.md](../WEBSOCKETS_API.md).

## Settings

| Setting | Default | Range | Meaning |
|---|---|---|---|
| `Reports.MaxBodyBytes` (cluster) | `32768` | 256 to 262144 | Most UTF-8 bytes in a report body |
| `Reports.DigestMaxReports` (cluster) | `20` | 0 to 200 | Most subordinate reports in a keeper tick's input; 0 leaves them out |

## Permissions

| Action | Permission | Built-in roles |
|---|---|---|
| List and read reports and metric series | Read on Report | Viewer, Auditor, AgentOperator, AgentDeveloper, Editor, TenantAdmin |
| File a report as a person | Create on Report | AgentDeveloper, Editor, TenantAdmin |

Runs never use these permissions; they follow the rules in [Who reads a report](#who-reads-a-report).

## Treat report text as untrusted

Titles, bodies, issues, and decisions are written by agents, and an agent may have copied something hostile into its report. Garrison puts report text into a prompt only through `builtin/report-digest`, framed as data. The tools return it as data. Audit records and server logs name the report, its kind, and its health, never its text. Never put credentials in a report.

## Retention

Reports are kept with their tenant. Deleting an agent keeps its reports and the name it had when it filed them; deleting a tenant deletes its reports. `garrison.reports` counts filings by kind and health. See [TELEMETRY.md](TELEMETRY.md).
