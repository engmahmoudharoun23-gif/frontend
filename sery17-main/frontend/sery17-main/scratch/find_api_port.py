import os

def find_port():
    env_path = "d:/sery17-main/sery17-main/frontend/.env"
    if os.path.exists(env_path):
        with open(env_path, "r", encoding="utf-8") as f:
            print(".env content:")
            print(f.read())
            
    config_path = "d:/sery17-main/sery17-main/frontend/src/config.js"
    if os.path.exists(config_path):
        with open(config_path, "r", encoding="utf-8") as f:
            print("config.js content:")
            print(f.read())

if __name__ == "__main__":
    find_port()
