# Google Workspace & Chrome Enterprise Admin Scripts

A collection of production-ready automation scripts and utilities for Google Workspace administrators, IT teams, and security engineers.

---

## Catalog of Tools

### 🐍 Python Scripts (`python/`)

| Tool | Description | Documentation |
| :--- | :--- | :--- |
| [`BlockExtensionBasedOnRiskScore.py`](python/BlockExtensionBasedOnRiskScore.py) | Automatically assesses and blocks Chrome extensions exceeding risk score thresholds (Crxcavator & Spin.ai). | [Guide](python/BlockExtensionBasedOnRiskScore.md) |
| [`ManagedBookmarks.py`](python/ManagedBookmarks.py) | Deploys managed Chrome bookmarks across specified Organizational Units (OUs) using Chrome Management Policy API. | [Guide](python/ManagedBookmarks.md) |
| [`MoveMultipleBrowsers.py`](python/MoveMultipleBrowsers.py) | Batch moves enrolled Chrome browsers between Organizational Units in Chrome Browser Cloud Management (CBCM). | [Guide](python/MoveMultipleBrowsers.md) |
| [`ReleaseScraper.py`](python/ReleaseScraper.py) | Monitors official Chrome Enterprise release notes and publishes new feature summaries to Slack. | [Guide](python/ReleaseScraper.md) |

### 📜 Google Apps Scripts (`apps-script/`)

| Tool | Description | Documentation |
| :--- | :--- | :--- |
| [`MassAddOUs.gas`](apps-script/MassAddOUs.gas) | Bulk creates and configures Organizational Units (OUs) in Google Workspace directly from a Google Sheet. | [Guide](apps-script/MassAddOUs.md) |
| [`MassAddWifiSettings.gas`](apps-script/MassAddWifiSettings.gas) | Bulk configures enterprise Wi-Fi network profiles for OUs from a Google Sheet template. | [Guide](apps-script/MassAddWifiSettings.md) |

---

## Setup & Prerequisites

Before running the Python scripts, configure a Google Cloud Service Account with domain-wide delegation for Google Workspace.

📖 **See the full setup guide:** [**CONFIG_GUIDE.md**](CONFIG_GUIDE.md)

### Quick Python Environment Setup

```bash
cd admin-scripts/python

# Create and activate a virtual environment
python3 -m venv .venv
source .venv/bin/activate

# Install common dependencies
pip install google-api-python-client google-auth requests lxml
```
