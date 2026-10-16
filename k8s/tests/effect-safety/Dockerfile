# Test-only layer on the already built worker image; it adds no production harness or product version changes.
ARG BASE_IMAGE=jchristn77/garrison-worker:v0.1.0-alpha
FROM ${BASE_IMAGE}
USER root
COPY fixture.mjs /opt/garrison/effect-fixture.mjs
RUN printf '#!/bin/sh\nexec node /opt/garrison/effect-fixture.mjs "$@"\n' > /usr/local/bin/garrison-effect-fixture \
 && chmod 755 /usr/local/bin/garrison-effect-fixture
USER 10001
