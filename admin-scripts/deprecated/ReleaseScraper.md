# Chrome Enterprise Release Scraper

> [!WARNING]
> **DEPRECATED**: This script is deprecated and retained for historical reference only.
> Official Chrome Enterprise release updates can be tracked natively through:
> - [Google Workspace Updates Blog](https://workspaceupdates.googleblog.com/) (RSS feed available)
> - Official Chrome Enterprise release email announcements configured in the Google Admin Console.

`ReleaseScraper.py` was a Python utility that monitors official Google Chrome Enterprise release notes and automatically sends structured notifications to a Slack channel via incoming webhooks when new features or version updates are published.

---

## Features

- **Automated Web Scraping**: Periodically parses Google Chrome Enterprise release announcement pages (`https://support.google.com/chrome/a/answer/7679408`).
- **Diff Detection**: Uses a local SQLite / shelve database (`page_content.db`) to track previously seen announcements and only posts newly added features or release versions.
- **Rich Slack Formatting**: Formats release summaries with bold titles, category sections (Browser, OS, Console), and direct links to policy documentation.
- **Configurable Polling Interval**: Default checks once every 24 hours.

---

## Prerequisites

- **Python 3.10+**
- Required Python libraries:
  ```bash
  pip install requests lxml
  ```

---

## Configuration

Open `ReleaseScraper.py` and configure the constants at the top of the file:

```python
# Slack incoming webhook URL
SLACK_WEBHOOK_URL = "https://hooks.slack.com/services/YOUR/WEBHOOK/URL"

# Monitoring interval in seconds (default: 24 hours)
CHECK_INTERVAL = 24 * 60 * 60

# Database file to store page state
STORAGE_FILE = "page_content.db"
```

---

## Usage

### Run Continuously (Daemon Mode)
Runs an infinite monitoring loop checking every 24 hours:

```bash
python ReleaseScraper.py
```

### Run Once (Cron / CI / Scheduled Tasks)
Runs a single update check and exits immediately (exit code 0):

```bash
python ReleaseScraper.py --once
```

---

## Alternatives
Administrators can also follow Chrome Enterprise updates natively via:
- Google Workspace Updates Blog (RSS feed available)
- Chrome Enterprise Release Notes email announcements in Google Cloud / Admin Console settings.
