"""Garrison SDK for Python.

Example:
    from garrison_sdk import GarrisonClient
    client = GarrisonClient("http://127.0.0.1:8700")
    client.login("admin@garrison", "password")
    run = client.agents.invoke("my-agent", "Summarize the release notes", wait=True)
    print(run["status"], run.get("resultText"))
"""

from .client import (APPROVAL_DECISIONS, APPROVAL_KINDS, APPROVAL_RULE_ACTIONS, APPROVAL_SOURCES, APPROVAL_STATUSES,
                     CONVERSATION_FALLBACK_REASONS, ExecutorCapabilities, ExecutorRequirements, GarrisonClient, GarrisonError,
                     PIPELINE_REVIEW_DECISIONS, PIPELINE_REVIEW_SOURCES, PIPELINE_REVIEW_STATUSES, PIPELINE_RUN_OUTCOMES,
                     PIPELINE_RUN_STATUSES, PIPELINE_RUN_TERMINAL_STATUSES, PIPELINE_STAGE_STATUSES, RUN_EXECUTORS,
                     SECRET_STATUSES, TERMINAL_STATUSES)

__all__ = ["APPROVAL_DECISIONS", "APPROVAL_KINDS", "APPROVAL_RULE_ACTIONS", "APPROVAL_SOURCES", "APPROVAL_STATUSES",
           "CONVERSATION_FALLBACK_REASONS", "ExecutorCapabilities", "ExecutorRequirements", "GarrisonClient", "GarrisonError",
           "PIPELINE_REVIEW_DECISIONS", "PIPELINE_REVIEW_SOURCES", "PIPELINE_REVIEW_STATUSES", "PIPELINE_RUN_OUTCOMES",
           "PIPELINE_RUN_STATUSES", "PIPELINE_RUN_TERMINAL_STATUSES", "PIPELINE_STAGE_STATUSES", "RUN_EXECUTORS",
           "SECRET_STATUSES", "TERMINAL_STATUSES"]
__version__ = "0.1.0-alpha"
