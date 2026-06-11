import requests

def main():
    # Login as Abdelmonem
    login_res = requests.post("http://localhost:8001/api/auth/login", json={
        "username": "Eng Abdelmonem Shamshoom",
        "password": "123456"
    })
    
    if login_res.status_code != 200:
        print(f"Login failed: {login_res.text}")
        return
        
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    # Request water connections
    res = requests.get("http://localhost:8001/api/water-connections", headers=headers)
    print("API Response status:", res.status_code)
    data = res.json()
    if isinstance(data, dict) and "connections" in data:
        conns = data["connections"]
    else:
        conns = data
        
    print(f"Total connections in list: {len(conns)}")
    for c in conns:
        print(f"ID: {c.get('id')}, Gov: {c.get('governorate')}, Customer: {c.get('customer_name')}")

if __name__ == "__main__":
    main()
