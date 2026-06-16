import requests

def test_api():
    base_url = "http://localhost:8001/api"
    
    # We need a token. I'll try to bypass it if I can or use a known one.
    # Since I'm on the server, maybe I can just call the function in a script.
    
    print("Testing /api/connections-stats?project=ايصال")
    # I don't have a token here, but I can check the backend logs if I trigger a request.
    # Actually, I'll just check if the backend function works by calling it directly in a script.
    pass

if __name__ == "__main__":
    test_api()
