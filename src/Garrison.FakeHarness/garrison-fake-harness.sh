#!/bin/sh
# Wrapper installed as /usr/local/bin/garrison-fake-harness in the worker image.
# GARRISON_FAKE_HARNESS_DLL overrides the location of the published assembly.
exec dotnet "${GARRISON_FAKE_HARNESS_DLL:-/opt/garrison/fake/garrison-fake-harness.dll}" "$@"
