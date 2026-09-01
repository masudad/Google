# Google Workspace & Chrome Enterprise Toolkit

A comprehensive toolkit for Google Workspace, Chrome Enterprise, and Google Cloud administrators, security engineers, and IT architects.

This repository brings together two main components:
1. **[Secure Gateway Studio](secure-gateway-studio/)**: A full-stack web studio and Chrome Extension for designing, validating, and deploying Google Cloud BeyondCorp Private Security Gateway architectures and Chrome Enterprise Premium (CEP) evaluations.
2. **[Admin Automation Scripts](admin-scripts/)**: Production-ready Python and Google Apps Script utilities for Chrome Browser Cloud Management (CBCM), risk-based extension blocking, managed bookmarks, and organizational unit (OU) operations.

---

## 📁 Repository Structure

```text
.
├── admin-scripts/                # Google Workspace & Chrome administrative tools
│   ├── README.md                 # Tools overview and quickstart guide
│   ├── CONFIG_GUIDE.md           # Service Account and Workspace authentication guide
│   ├── python/                   # Python management scripts & documentation
│   └── apps-script/              # Google Apps Script (.gas) spreadsheet utilities
│
├── secure-gateway-studio/        # Secure Gateway Studio suite
│   ├── README.md                 # Architecture, prerequisites, and runtime documentation
│   ├── extension/                # ⚡ Chrome Extension (Actively maintained runtime)
│   ├── backend/                  # ⚠️ FastAPI backend (Deprecated legacy reference)
│   ├── frontend/                 # ⚠️ Vite + React UI (Deprecated legacy reference)
│   ├── infrastructure/           # IAM role definitions and policies
│   ├── design/                   # Architecture diagrams and UI mockups
│   └── docs/                     # Test matrix and enterprise readiness guides
│
└── docs/                         # Public GitHub Pages landing site & review contract
```

---

## 🚀 Quick Navigation

### 1. Secure Gateway Studio (`secure-gateway-studio/`)
Simplifies the planning, approval, and execution of zero-trust private access for managed Chrome browsers via Google Cloud BeyondCorp Security Gateway.

* **⚡ Chrome Extension (`extension/`):** **Active & primary runtime.** Supports in-browser discovery, zero-trust gateway configuration, and CEP evaluation baselines.
* **⚠️ Backend & Frontend (`backend/`, `frontend/`):** *Deprecated.* Retained as historical reference implementations.

👉 **Get Started:** [**Secure Gateway Studio README**](secure-gateway-studio/README.md) \| [**Extension Guide**](secure-gateway-studio/extension/README.md)

---

### 2. Workspace & Chrome Admin Scripts (`admin-scripts/`)

| Category | Script | Description |
| :--- | :--- | :--- |
| **Python** | [`BlockExtensionBasedOnRiskScore.py`](admin-scripts/python/BlockExtensionBasedOnRiskScore.py) | Assesses & blocks high-risk Chrome extensions (Crxcavator & Spin.ai). |
| **Python** | [`ManagedBookmarks.py`](admin-scripts/python/ManagedBookmarks.py) | Centralizes Chrome bookmark deployment via Chrome Policy API. |
| **Python** | [`MoveMultipleBrowsers.py`](admin-scripts/python/MoveMultipleBrowsers.py) | Bulk moves enrolled Chrome browsers across Organizational Units (OUs). |
| **Python** | [`ReleaseScraper.py`](admin-scripts/python/ReleaseScraper.py) | Scrapes Chrome Enterprise release notes and sends diffs to Slack. |
| **Apps Script** | [`MassAddOUs.gas`](admin-scripts/apps-script/MassAddOUs.gas) | Bulk creates Google Workspace Organizational Units via Google Sheets. |
| **Apps Script** | [`MassAddWifiSettings.gas`](admin-scripts/apps-script/MassAddWifiSettings.gas) | Bulk provisions enterprise Wi-Fi configurations to OUs via Google Sheets. |

👉 **Get Started:** [**Admin Scripts Catalog**](admin-scripts/README.md) \| [**Configuration Guide**](admin-scripts/CONFIG_GUIDE.md)

---

## ⚠️ Disclaimer

This repository is an **independent open-source project**. It is **not built, endorsed, or supported by Google LLC**, and is not affiliated with Google.
* "Google", "Google Workspace", "Google Cloud", "Chrome", and "Chrome Enterprise Premium" are trademarks of Google LLC.
* All scripts and tools are provided **as-is**, without warranty of any kind. Always test changes in a non-production test Organizational Unit or disposable GCP project first.

---

## 📄 License

Licensed under the [Apache License 2.0](LICENSE).
