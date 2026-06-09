import requests
res = requests.get('http://127.0.0.1:8001/api/reports/stats?project=مشروع المحافظات الغربية')
print(res.status_code)
print(res.json())
