#!/usr/bin/env python3
"""Garrison Agent Studio walkthrough with the Python SDK.

It applies the support triage bundle (an agentic app with three agents), opens a studio draft from that app, lists the
architect prompts and selects one for an agent architect (creating an architect on the fake harness when none exists),
and chats with the app through its end-user gateway.

Usage:
    python examples/agent_studio.py [baseUrl] [bundlePath]

The access key and secret key come from GARRISON_ACCESS_KEY and GARRISON_SECRET_KEY, or are prompted without echo.
The server needs a worker that can run the fake harness (garrison-fake-harness on its PATH).
"""

import getpass
import os
import sys

from garrison_sdk import GarrisonClient

HERE = os.path.dirname(os.path.abspath(__file__))
DEFAULT_BUNDLE = os.path.join(HERE, "..", "..", "..", "examples", "agentic-apps", "support-triage", "support-triage.yaml")
APP = "support-triage"
ARCHITECT_DEPLOYMENT = "agent-architect-sdk"
FAKE_HARNESS_PROFILE = "hrn_builtin_fake"


def main() -> int:
    base_url = sys.argv[1] if len(sys.argv) > 1 else "http://127.0.0.1:8700"
    bundle_path = sys.argv[2] if len(sys.argv) > 2 else DEFAULT_BUNDLE
    client = GarrisonClient(base_url)
    client.login_with_keys(os.environ.get("GARRISON_ACCESS_KEY") or getpass.getpass("Access key: "),
                           os.environ.get("GARRISON_SECRET_KEY") or getpass.getpass("Secret key: "))

    # 1. Create the app from a bundle. Applying again changes nothing.
    with open(bundle_path, encoding="utf-8") as handle:
        applied = client.manifests.apply(handle.read())
    print(f"Applied {applied['documentCount']} documents: {applied['createdCount']} created, "
          f"{applied['updatedCount']} updated, {applied['unchangedCount']} unchanged, {applied['failedCount']} failed")
    if applied["failedCount"]:
        return 1

    # 2. Open a studio draft holding the app and everything it references.
    draft = client.studio_drafts.create("Support triage changes", from_app=APP)
    print(f"Studio draft {draft['id']} (version {draft['version']}) holds {len(draft['items'])} items:")
    for item in draft["items"]:
        print(f"  {item['kind']}/{item['name']}")
    diff = client.studio_drafts.diff(draft["id"])
    print(f"Draft is {'valid' if diff.get('valid') else 'not valid'} against live configuration")

    # 3. List architect prompts and select one for an agent architect.
    prompts = client.studio_drafts.list_architect_prompts()["objects"]
    for entry in prompts:
        print(f"Architect prompt {entry['name']} (version {entry['currentVersion']}, built-in {entry['isBuiltIn']})")
    architects = client.studio_drafts.list_architects(max_results=1)["objects"]
    if architects:
        architect = architects[0]
    else:
        architect = client.studio_drafts.create_architect({"name": ARCHITECT_DEPLOYMENT, "harnessProfileId": FAKE_HARNESS_PROFILE})
        print(f"Created architect {architect['name']} ({architect['id']})")
    selection = client.studio_drafts.set_architect_prompt(architect["id"], prompts[0]["id"])
    print(f"Architect {selection['deploymentId']} uses {selection['architectPromptName']}")

    # 4. Chat with the app through its gateway as an anonymous end user.
    gateway = client.app_gateway(APP)
    info = gateway.info()
    print(f"{info['displayName']}: {info.get('welcomeText') or ''}")
    gateway.start_session()
    started = gateway.start_conversation("My invoice was charged twice.")
    for item in gateway.stream_turn(started["conversationId"], started["turn"]["runId"]):
        if item["event"] == "turn.status":
            print(f"  turn {item['data']['status']}")
    turn = gateway.wait_for_turn(started["conversationId"], started["turn"]["runId"])
    print(f"Turn {turn['status']}: {turn.get('answer') or turn.get('error')}")
    gateway.end_session()

    client.studio_drafts.delete(draft["id"])
    return 0 if turn["status"] == "Succeeded" else 1


if __name__ == "__main__":
    sys.exit(main())
