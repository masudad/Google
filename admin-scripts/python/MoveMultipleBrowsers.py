"""Move Multiple Chrome Browsers between Organizational Units.

NOTE:
Google Admin Console natively supports selecting multiple managed browsers and
moving them between OUs directly in the web UI:
  Devices > Chrome > Managed browsers > Select browsers > Move

This script is useful as an automated CLI alternative for large CSV-based migrations.
"""

import csv
import json
import sys
from typing import List, Optional

from google.auth.transport.requests import AuthorizedSession
from google.oauth2.service_account import Credentials

# /******* BEGIN: Customer to modify this section *******/
# Path to your Google Cloud service account key JSON file
SERVICE_ACCOUNT_KEY_PATH = ""
# Your Google Workspace customer ID (e.g., 'C01234567' or 'my_customer')
CUSTOMER_ID = ""
# The destination OU path (e.g., 'North America/Austin/AUS Managed User' or '/')
DESTINATION_ORG_UNIT_PATH = ""
# Path to the CSV file containing device IDs exported from Google Admin Console
DEVICE_CSV_PATH = ""
# Admin user email for domain-wide delegation (optional)
ADMIN_USER_EMAIL = ""
# Number of devices to move per API request (max recommended: 100)
BATCH_SIZE = 50
# Request timeout in seconds
REQUEST_TIMEOUT = 30
# /******* END: Customer to modify this section *******/

SCOPES = ['https://www.googleapis.com/auth/admin.directory.device.chromebrowsers']


def create_authorized_session(
    service_account_path: str,
    admin_email: Optional[str] = None,
) -> AuthorizedSession:
    """Load credentials and create an AuthorizedSession."""
    with open(service_account_path, "r", encoding="utf-8") as f:
        service_account_info = json.load(f)

    credentials = Credentials.from_service_account_info(
        service_account_info,
        scopes=SCOPES,
    )
    if admin_email and admin_email.strip():
        credentials = credentials.with_subject(admin_email.strip())

    return AuthorizedSession(credentials)


def move_chrome_browsers(
    session: AuthorizedSession,
    customer_id: str,
    destination_ou_path: str,
    device_ids: List[str],
) -> int:
    """Move Chrome browser devices to the destination OU in batches.

    Args:
        session: AuthorizedSession for making Google API requests.
        customer_id: Google Workspace customer ID.
        destination_ou_path: Target Organizational Unit path.
        device_ids: List of device IDs to move.

    Returns:
        Total number of devices successfully processed.
    """
    url = f"https://www.googleapis.com/admin/directory/v1.1beta1/customer/{customer_id}/devices/chromebrowsers/moveChromeBrowsersToOu"
    headers = {'Content-Type': 'application/json'}
    total_moved = 0

    for i in range(0, len(device_ids), BATCH_SIZE):
        batch = device_ids[i:i + BATCH_SIZE]
        payload = json.dumps({
            "org_unit_path": destination_ou_path,
            "resource_ids": batch,
        })

        response = session.request(
            method="POST",
            url=url,
            headers=headers,
            data=payload,
            timeout=REQUEST_TIMEOUT,
        )

        if response.status_code in (200, 204):
            total_moved += len(batch)
            print(f"[{i + 1}-{min(i + len(batch), len(device_ids))}/{len(device_ids)}] Successfully moved {len(batch)} devices.")
        else:
            print(
                f"[{i + 1}-{min(i + len(batch), len(device_ids))}/{len(device_ids)}] Failed with status {response.status_code}: {response.text}",
                file=sys.stderr,
            )

    return total_moved


def main() -> None:
    if not SERVICE_ACCOUNT_KEY_PATH:
        print("Error: SERVICE_ACCOUNT_KEY_PATH is required.", file=sys.stderr)
        sys.exit(1)
    if not CUSTOMER_ID:
        print("Error: CUSTOMER_ID is required.", file=sys.stderr)
        sys.exit(1)
    if not DESTINATION_ORG_UNIT_PATH:
        print("Error: DESTINATION_ORG_UNIT_PATH is required.", file=sys.stderr)
        sys.exit(1)
    if not DEVICE_CSV_PATH:
        print("Error: DEVICE_CSV_PATH is required.", file=sys.stderr)
        sys.exit(1)

    print(f"Reading device list from {DEVICE_CSV_PATH}...")
    device_ids: List[str] = []
    try:
        with open(DEVICE_CSV_PATH, mode="r", encoding="utf-8-sig") as f:
            reader = csv.reader(f)
            header = next(reader, None)
            if not header:
                print("Error: Device CSV file is empty.", file=sys.stderr)
                sys.exit(1)

            # Detect device ID column regardless of casing
            device_id_idx = None
            candidates = {'deviceid', 'device id', 'device_id', 'id'}
            for idx, col_name in enumerate(header):
                cleaned = col_name.strip().lower()
                if cleaned in candidates:
                    device_id_idx = idx
                    break

            if device_id_idx is None:
                device_id_idx = 0
                print(f"Notice: Device ID column not explicitly found by name. Using first column '{header[0]}'.")

            for row in reader:
                if len(row) > device_id_idx:
                    dev_id = row[device_id_idx].strip()
                    if dev_id:
                        device_ids.append(dev_id)
    except Exception as e:
        print(f"Error reading CSV file {DEVICE_CSV_PATH}: {e}", file=sys.stderr)
        sys.exit(1)

    print(f"Found {len(device_ids)} devices to move to '{DESTINATION_ORG_UNIT_PATH}'.")
    session = create_authorized_session(SERVICE_ACCOUNT_KEY_PATH, ADMIN_USER_EMAIL)
    moved_count = move_chrome_browsers(session, CUSTOMER_ID, DESTINATION_ORG_UNIT_PATH, device_ids)
    print(f"Done. Successfully moved {moved_count} of {len(device_ids)} devices.")


if __name__ == '__main__':
    main()