import paramiko
import os

ip = "75.119.156.160"
username = "root"
pwd = "M14149mmhh"

local_base = r"d:\sery17-main\sery17-main\backend"
remote_base = "/root/apps/backend"

files_to_upload = [
    ("app/api/routes/users.py", "app/api/routes/users.py"),
    ("app/config/settings.py", "app/config/settings.py"),
    ("app/database/mongodb.py", "app/database/mongodb.py"),
    ("app/models/user.py", "app/models/user.py"),
    ("app/services/user_service.py", "app/services/user_service.py"),
    ("server.py", "server.py"),
    ("server_recovered.py", "server_recovered.py"),
]

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
try:
    ssh.connect(ip, username=username, password=pwd, timeout=15)
    print("Success: SSH Connected!")

    # 1. Backup remote files
    print("Backing up remote files...")
    backup_cmd = (
        "mkdir -p /root/apps/backend/backup_before_deploy && "
        "cp -r /root/apps/backend/app /root/apps/backend/backup_before_deploy/ && "
        "cp /root/apps/backend/server.py /root/apps/backend/backup_before_deploy/ && "
        "cp /root/apps/backend/server_recovered.py /root/apps/backend/backup_before_deploy/"
    )
    stdin, stdout, stderr = ssh.exec_command(backup_cmd)
    exit_status = stdout.channel.recv_exit_status()
    if exit_status == 0:
        print("Backup created successfully.")
    else:
        print("Warning: Backup failed with status", exit_status)

    # 2. Upload files via SFTP
    sftp = ssh.open_sftp()
    for local_rel, remote_rel in files_to_upload:
        local_path = os.path.join(local_base, local_rel.replace("/", os.sep))
        remote_path = f"{remote_base}/{remote_rel}"
        print(f"Uploading {local_path} -> {remote_path} ...")
        sftp.put(local_path, remote_path)
    sftp.close()
    print("All files uploaded successfully!")

    # 3. Kill running process
    print("Stopping running backend process...")
    ssh.exec_command("pkill -9 -f 'uvicorn server:app'")
    
    # 4. Start backend in background using nohup
    print("Starting backend server in background...")
    deploy_cmd = "cd /root/apps/backend && nohup venv/bin/python -m uvicorn server:app --host 127.0.0.1 --port 8000 > nohup.out 2>&1 &"
    ssh.exec_command(deploy_cmd)
    
    # 5. Check if it's running
    import time
    time.sleep(3)
    print("Checking if backend is running...")
    stdin, stdout, stderr = ssh.exec_command("ps aux | grep uvicorn | grep -v grep")
    status = stdout.read().decode()
    if status:
        print("Success! Backend process is active:")
        print(status)
    else:
        print("Warning: Backend process was not found running. Check nohup.out:")
        stdin, stdout, stderr = ssh.exec_command("tail -n 20 /root/apps/backend/nohup.out")
        print(stdout.read().decode())

    ssh.close()
except Exception as e:
    print("Error during deployment:", str(e))
