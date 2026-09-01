# Chrome Enterprise Release Scraper

`ReleaseScraper.py` is a Python utility that monitors official Google Chrome Enterprise release notes and automatically sends structured notifications to a Slack channel via incoming webhooks when new features or version updates are published.

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

Run the script directly:

```bash
python ReleaseScraper.py
```
