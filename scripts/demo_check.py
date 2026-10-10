#!/usr/bin/env python3
# ============================================================================
# File: scripts/demo_check.py
# Description: Wrapper to invoke backend/scripts/demo_check.py from workspace root.
# ============================================================================

import sys
from pathlib import Path

backend_script = Path(__file__).resolve().parent.parent / "backend" / "scripts" / "demo_check.py"
if not backend_script.exists():
    backend_script = Path(__file__).resolve().parent / "backend" / "scripts" / "demo_check.py"

if backend_script.exists():
    with open(backend_script, "rb") as f:
        code = compile(f.read(), str(backend_script), "exec")
        exec(code, {"__name__": "__main__", "__file__": str(backend_script)})
else:
    print(f"Cannot find backend demo_check.py at {backend_script}", file=sys.stderr)
    sys.exit(1)
