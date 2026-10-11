"""Garrison SDK for Python.

Example:
    from garrison_sdk import GarrisonClient
    client = GarrisonClient("http://127.0.0.1:8700")
    client.login("admin@garrison", "password")
    run = client.agents.invoke("my-agent", "Summarize the release notes", wait=True)
    print(run["status"], run.get("resultText"))
"""

from .client import GarrisonClient, GarrisonError, RUN_EXECUTORS, SECRET_STATUSES, TERMINAL_STATUSES

__all__ = ["GarrisonClient", "GarrisonError", "RUN_EXECUTORS", "SECRET_STATUSES", "TERMINAL_STATUSES"]
__version__ = "0.1.0-alpha"
