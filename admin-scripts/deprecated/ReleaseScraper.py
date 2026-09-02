"""DEPRECATION NOTICE:
===================
This script is DEPRECATED and retained for historical reference only.

Chrome Enterprise release updates can be followed natively through:
- Google Workspace Updates Blog (RSS feed): https://workspaceupdates.googleblog.com/
- Official Chrome Enterprise release email notifications in Google Admin Console
"""

import argparse
import json
import re
import shelve
import sys
import time
from typing import Any, Dict, List

from lxml import html
import requests

# Constants
URL = "https://support.google.com/chrome/a/answer/7679408?hl=ja"
SLACK_WEBHOOK_URL = ""
MAIN_CONTENT_XPATH = '//div[@class="cc"]//td/a/text()'
RELEASE_NUMBER_XPATH = '//div[@class="cc"]/h2/text()'
STORAGE_FILE = "page_content.db"
CHECK_INTERVAL = 24 * 60 * 60  # 24 hours in seconds
REQUEST_TIMEOUT = 30


def clean_policy_url_or_text(text: str) -> str:
    """Safely strip the Chrome Enterprise policy URL prefix."""
    prefix = "https://chromeenterprise.google/policies/#"
    if text.startswith(prefix):
        return text[len(prefix):]
    return text


def fetch_page_content() -> Dict[str, Any]:
    session = requests.Session()
    response = session.get(URL, timeout=REQUEST_TIMEOUT)
    response.raise_for_status()
    content = response.content.decode('utf-8')
    tree = html.fromstring(content)

    main_content_nodes = tree.xpath(MAIN_CONTENT_XPATH)
    main_content = [str(m).strip() for m in main_content_nodes if str(m).strip()]

    # Reliably find the Chrome release version (e.g. "Chrome 147")
    release_number = "Unknown"
    for h2 in tree.xpath('//div[@class="cc"]//h2'):
        h2_text = ''.join(h2.xpath('.//text()')).strip()
        match = re.search(r'Chrome\s+(\d+)', h2_text)
        if match:
            release_number = f"Chrome {match.group(1)}"
            break

    # Extract top-level feature items (excluding sub-bullets inside other lists)
    feature_elements = tree.xpath('//div[@class="cc"]//ul[not(ancestor::li)]/li')

    features: List[Dict[str, Any]] = []
    for feature in feature_elements:
        # Features have their main title in a direct <strong> element
        title_nodes = feature.xpath('./strong//text()')
        if not title_nodes:
            continue
        title = ''.join(title_nodes).strip()

        # Find the enclosing or immediately preceding section header
        browser_os_console_nodes = feature.xpath('preceding::h2[1]//text()')
        browser_os_console = (
            ''.join(browser_os_console_nodes).strip()
            if browser_os_console_nodes
            else "Unknown Section"
        )

        details: List[str] = []
        detail_elements = feature.xpath('.//p')

        for detail in detail_elements:
            text_parts: List[str] = []
            if detail.text:
                text_parts.append(detail.text.strip())

            for node in detail.iterchildren():
                if node.tag == 'a':
                    u_tag = node.find('.//u')
                    if u_tag is not None and u_tag.text is not None:
                        link_text = u_tag.text.strip()
                    else:
                        link_text = node.text.strip() if node.text else "Link"

                    link_url = node.get('href', 'No URL')

                    link_text = clean_policy_url_or_text(link_text)
                    if link_url.startswith("https://chromeenterprise.google/policies/#"):
                        link_text = clean_policy_url_or_text(link_url)

                    if link_url != '#top':
                        text_parts.append(f"<{link_url}|{link_text}>")

                elif node.tag == 'strong':
                    bold_text = node.text.strip() if node.text else ""
                    if bold_text:
                        text_parts.append(f"*{bold_text}*")
                elif node.tag == 'em':
                    italic_text = node.text.strip() if node.text else ""
                    if italic_text:
                        text_parts.append(f"_{italic_text}_")
                elif node.tag == 'code':
                    code_text = node.text.strip() if node.text else ""
                    if code_text:
                        text_parts.append(f"`{code_text}`")

                if node.tail:
                    text_parts.append(node.tail.strip())

            full_detail = ' '.join(part for part in text_parts if part).strip()
            if full_detail:
                details.append(full_detail)

        # Extract direct link from the feature item itself (or fall back to the release page URL)
        feature_links = [
            link for link in feature.xpath('.//a/@href')
            if link and not link.startswith('#')
        ]
        feature_url = feature_links[0] if feature_links else URL

        features.append({
            'title': title,
            'details': details,
            'releaseNum': release_number,
            'whichSec': browser_os_console,
            'url': feature_url,
        })

    return {
        "Main Content": "\n".join(main_content),
        "Release Number": release_number,
        "Browser OS Console": browser_os_console if 'browser_os_console' in locals() else "",
        "Features": features,
    }


def send_to_slack(features: List[Dict[str, Any]]) -> None:
    if not SLACK_WEBHOOK_URL:
        print("Notice: SLACK_WEBHOOK_URL is not set. Skipping Slack notification.")
        return

    for feature in features:
        if not feature['details']:
            continue

        slack_message_body = '\n'.join(feature['details'])
        release_num = feature['releaseNum']
        sec = feature['whichSec']
        if "今後の予定" in sec:
            release_num = ""

        feature_url = (
            f"https://support.google.com{feature['url']}"
            if feature['url'].startswith('/')
            else feature['url']
        )

        slack_payload = {
            "blocks": [
                {
                    "type": "divider"
                },
                {
                    "type": "header",
                    "text": {
                        "type": "plain_text",
                        "text": f"{feature['title']}",
                        "emoji": True
                    }
                },
                {
                    "type": "section",
                    "text": {
                        "type": "mrkdwn",
                        "text": f"{sec} : {release_num}".strip(" :")
                    },
                    "accessory": {
                        "type": "button",
                        "text": {
                            "type": "plain_text",
                            "text": "Release Note はこちら",
                            "emoji": True
                        },
                        "value": "Release Note はこちら",
                        "url": feature_url or URL,
                        "action_id": "button-action"
                    }
                },
                {
                    "type": "section",
                    "text": {
                        "type": "mrkdwn",
                        "text": f"{slack_message_body}",
                    }
                },
                {
                    "type": "divider"
                }
            ]
        }
        try:
            response = requests.post(
                SLACK_WEBHOOK_URL,
                data=json.dumps(slack_payload),
                headers={'Content-Type': 'application/json; charset=utf-8'},
                timeout=REQUEST_TIMEOUT,
            )
            response.raise_for_status()
            print(f"Sent feature '{feature['title']}' to Slack.")
        except Exception as e:
            print(f"Failed to send Slack notification for '{feature['title']}': {e}", file=sys.stderr)


def check_for_updates() -> None:
    current_content = fetch_page_content()

    with shelve.open(STORAGE_FILE) as db:
        last_content = db.get("last_content", {})

        if current_content["Features"] != last_content.get("Features", []):
            print(f"Changes detected: {len(current_content['Features'])} features.")
            send_to_slack(current_content["Features"])
            db["last_content"] = current_content
        else:
            print("No changes detected.")


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Monitor Chrome Enterprise release notes and post updates to Slack."
    )
    parser.add_argument(
        "--once",
        action="store_true",
        help="Run a single check and exit immediately (ideal for cron or scheduled tasks)",
    )
    args = parser.parse_args()

    print("=" * 80, file=sys.stderr)
    print("DEPRECATION NOTICE: ReleaseScraper.py is deprecated.", file=sys.stderr)
    print("Chrome Enterprise release updates can be followed natively via RSS:", file=sys.stderr)
    print("  https://workspaceupdates.googleblog.com/", file=sys.stderr)
    print("=" * 80, file=sys.stderr)

    print("Starting Chrome Enterprise release note monitor...")
    if args.once:
        check_for_updates()
        return

    while True:
        try:
            check_for_updates()
        except Exception as e:
            print(f"Error during check: {e}", file=sys.stderr)
        time.sleep(CHECK_INTERVAL)


if __name__ == "__main__":
    main()
