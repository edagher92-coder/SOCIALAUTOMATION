"""
AdPilot OS — executable engine (the part most ads tools don't ship).

Dependency-free Python that turns ad exports into metrics, a 0-100 health score,
and SAFE decision proposals (never a live-ad edit). This is the executable source
of truth for every formula in the docs; qa/ test cases run against it.

Modules:
    metrics    - all metric formulas (zero-division safe)
    health     - canonical 13-factor health score (0-100)
    schema     - universal schema + Meta/TikTok column mapping
    decisions  - safe verdict engine (keep/kill/scale/refresh/fix-tracking/...)
    ingest     - CSV -> normalised rows with computed metrics
    report     - numbers-first text report builder
"""

from . import metrics, health, schema, decisions, audit, ingest, report  # noqa: F401

__version__ = "1.1.0"
