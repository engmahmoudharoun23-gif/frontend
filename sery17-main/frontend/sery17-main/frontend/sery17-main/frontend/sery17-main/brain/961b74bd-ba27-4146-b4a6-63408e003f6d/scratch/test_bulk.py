import urllib.request
import json
import sys

# Replace with a valid admin token if we had one. Since we don't, we will expect 401.
# BUT wait! If the error is 400 or 422 (validation error), it might happen BEFORE auth!
# Actually, Depends(get_current_user) runs first.

req = urllib.request.Request(
    'http://localhost:8001/api/deleted-items/bulk-permanent-delete',
    data=json.dumps({"items": [{"type": "report", "id": "123"}]}).encode('utf-8'),
    headers={'Content-Type': 'application/json'}
)

try:
    response = urllib.request.urlopen(req)
    print("STATUS:", response.status)
    print("BODY:", response.read().decode('utf-8'))
except urllib.error.HTTPError as e:
    print("HTTP ERROR:", e.code)
    print("ERROR BODY:", e.read().decode('utf-8'))
except Exception as e:
    print("ERROR:", str(e))
