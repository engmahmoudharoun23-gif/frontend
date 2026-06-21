import urllib.request

url = "https://frontend-virid-three-41.vercel.app/?nocache=1"
req = urllib.request.Request(
    url, 
    headers={
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
    }
)
try:
    with urllib.request.urlopen(req) as response:
        print("Status:", response.status)
        for key, val in response.headers.items():
            print(f"{key}: {val}")
except Exception as e:
    print("Error:", e)
