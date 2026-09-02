# Deprecated Admin Scripts

This directory contains legacy and deprecated administration utilities for Google Workspace and Chrome Enterprise. They are preserved for historical reference and archival purposes only.

---

## Catalog of Deprecated Tools

| Tool | Status | Reason for Deprecation | Native Alternative |
| :--- | :--- | :--- | :--- |
| [`BlockExtensionBasedOnRiskScore.py`](BlockExtensionBasedOnRiskScore.py) | **Deprecated** | Google Admin Console natively includes Extension Risk Assessment and policy workflows. | [Google Admin Console](https://admin.google.com/) > **Devices** > **Chrome** > **Apps & extensions** |
| [`ReleaseScraper.py`](ReleaseScraper.py) | **Deprecated** | Web scraper superseded by official RSS and email release channels. | [Google Workspace Updates Blog](https://workspaceupdates.googleblog.com/) (RSS) & Admin Console release notifications |

---

## Details & Migration Paths

### 1. `BlockExtensionBasedOnRiskScore.py`
- **Why it was deprecated**: Chrome Enterprise Core now integrates risk scores directly from Crxcavator, Spin.ai, and Google threat intelligence into the Google Admin Console. Admins can inspect risk metrics, review extension permissions, and set installation policies (Block, Allow, Force install) without writing code, managing service accounts, or handling OAuth tokens.
- **Documentation**: [BlockExtensionBasedOnRiskScore.md](BlockExtensionBasedOnRiskScore.md)
- **Official Guide**: [Manage extensions in the Admin console](https://support.google.com/chrome/a/answer/9296680)

### 2. `ReleaseScraper.py`
- **Why it was deprecated**: Scraping HTML help center pages is fragile against UI redesigns. Chrome Enterprise updates can be reliably tracked via official RSS feeds and Google Workspace notifications.
- **Documentation**: [ReleaseScraper.md](ReleaseScraper.md)
- **Official Feeds**: [Google Workspace Updates Blog](https://workspaceupdates.googleblog.com/)
