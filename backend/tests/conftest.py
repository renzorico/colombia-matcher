"""
conftest.py — pytest configuration for the backend test suite.

Adds the backend root directory to sys.path so that imports like
`from loader import ...` and `from scorer import ...` resolve correctly
when pytest is run from any working directory.
"""

import sys
from pathlib import Path

# Insert the backend root (one level above this file's parent) at the
# front of sys.path so all backend modules are importable as top-level.
_BACKEND_ROOT = Path(__file__).parent.parent
if str(_BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(_BACKEND_ROOT))
