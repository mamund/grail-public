#!/usr/bin/env python3

import sys
import json

try:
    inputs = json.load(sys.stdin)

    name = inputs.get("name", "world")

    result = {
        "message": f"Hello, {name}!"
    }

    json.dump(result, sys.stdout)
    sys.exit(0)

except Exception as error:
    print(str(error), file=sys.stderr)
    sys.exit(1)
