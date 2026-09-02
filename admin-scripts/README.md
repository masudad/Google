# Google Workspace & Chrome Enterprise Admin Scripts

A collection of production-ready automation scripts and utilities for Google Workspace administrators, IT teams, and security engineers.

---

## Catalog of Tools

### 🐍 Active Python Scripts (`python/`)

| Tool | Description | Documentation |
| :--- | :--- | :--- |
| [`MoveMultipleBrowsers.py`](python/MoveMultipleBrowsers.py) | Batch moves enrolled Chrome browsers between OUs via CSV. *(Also available in Admin Console GUI).* | [Guide](python/MoveMultipleBrowsers.md) |
| [`ManagedBookmarks.py`](python/ManagedBookmarks.py) | Deploys managed Chrome bookmarks across specified OUs using Chrome Management Policy API. | [Guide](python/ManagedBookmarks.md) |

### 📜 Google Apps Scripts (`apps-script/`)

| Tool | Description | Documentation |
| :--- | :--- | :--- |
| [`MassAddOUs.gas`](apps-script/MassAddOUs.gas) | Bulk creates and configures Organizational Units (OUs) in Google Workspace directly from a Google Sheet. | [Guide](apps-script/MassAddOUs.md) |
| [`MassAddWifiSettings.gas`](apps-script/MassAddWifiSettings.gas) | Bulk configures enterprise Wi-Fi network profiles for OUs from a Google Sheet template. | [Guide](apps-script/MassAddWifiSettings.md) |

### 🗄️ Deprecated Scripts (`deprecated/`)

| Tool | Status | Reason | Native Alternative |
| :--- | :--- | :--- | :--- |
| [`BlockExtensionBasedOnRiskScore.py`](deprecated/BlockExtensionBasedOnRiskScore.py) | **Deprecated** | Extension risk scores now built into Admin Console. | [Google Admin Console](https://admin.google.com/) > **Devices** > **Chrome** > **Apps & extensions** |
| [`ReleaseScraper.py`](deprecated/ReleaseScraper.py) | **Deprecated** | Web scraper superseded by official feeds and notifications. | [Google Workspace Updates Blog](https://workspaceupdates.googleblog.com/) (RSS) |

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
