import os

for log in ["backend/server_log.txt", "backend/server_startup_log.txt", "backend/debug_log.txt"]:
    if os.path.exists(log):
        print(f"=== Log: {log} ===")
        with open(log, "r", encoding="utf-8", errors="ignore") as f:
            lines = f.readlines()
            for line in lines[-30:]:
                print(line.strip())
