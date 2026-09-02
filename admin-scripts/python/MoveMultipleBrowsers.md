
# MoveMultipleBrowsers Script

> [!NOTE]
> **Admin Console Alternative**: Google Admin Console natively supports selecting multiple managed browsers and moving them between Organizational Units directly in the web interface:
> - Navigate to: [**Google Admin Console**](https://admin.google.com/) > **Devices** > **Chrome** > **Managed browsers**
> - Select the checkboxes for target browsers (or select all across pages) and click the **Move** button in the action toolbar.
> - This script is provided as a programmatic CLI alternative for automated migrations from external CSV exports.

## Overview
This Python script, `MoveMultipleBrowsers.py`, is designed to facilitate the movement of multiple Chrome browser devices across different Organizational Units (OUs) in Google Workspace. It is particularly useful for administrators managing a large number of devices from CSV exports.

## Requirements
- Python 3.x
- Google OAuth2 credentials (service account with domain-wide delegation or admin privileges)
- Access to Google Admin SDK Directory API

## Setup Instructions
1. **Service Account Key**: Ensure you have a service account key JSON file from Google Cloud Console with necessary permissions.
2. **Customer ID**: Obtain your Google Workspace customer ID from the Admin Console.
3. **Destination OU Path**: Determine the OU path where the devices need to be moved (e.g., `/Sales/West` or `/`).
4. **Device CSV File**: Prepare a CSV file with device IDs. You can download this CSV from the Admin Console under **Devices > Chrome > Managed browsers > Export**.

## Configuration
Fill in the following fields in the script:
- `SERVICE_ACCOUNT_KEY_PATH`: Path to your service account key JSON file.
- `CUSTOMER_ID`: Your Google Workspace customer ID (e.g., `C01234567` or `my_customer`).
- `DESTINATION_ORG_UNIT_PATH`: The destination OU path where devices will be moved.
- `DEVICE_CSV_PATH`: Path to the CSV file containing device IDs.
- `ADMIN_USER_EMAIL`: (Optional) Admin user email for domain-wide delegation.

## Usage
Run the script in a Python environment. It will process each device ID in the CSV file and move the corresponding devices to the specified OU.

## Support
This script is provided 'as-is' without official support. However, you may report issues or seek help through GitHub issues.

## License
This project is licensed under the MIT License - see the LICENSE file for details.
