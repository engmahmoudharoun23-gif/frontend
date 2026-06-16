with open("server.py", "r", encoding="utf-8") as f:
    for i, line in enumerate(f):
        if "init-all" in line:
            print(f"Line {i+1}: {line.strip()}")
