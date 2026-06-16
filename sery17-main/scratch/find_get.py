with open('d:/sery17-main/sery17-main/backend/server.py', 'r', encoding='utf-8') as f:
    lines = f.readlines()
    for i, line in enumerate(lines):
        if '@api_router.get("/projects")' in line:
            print("Found at line:", i+1)
            for j in range(i, i+20):
                if j < len(lines):
                    print(lines[j].rstrip())
            break
