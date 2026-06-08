import paramiko

ip = "75.119.156.160"
username = "root"
pwd = "M14149mmhh"

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
try:
    ssh.connect(ip, username=username, password=pwd, timeout=10)
    print("SSH Connection Successful!")
    
    # 1. Check directory contents
    print("=== Contents of /root/apps/backend ===")
    stdin, stdout, stderr = ssh.exec_command("ls -la /root/apps/backend")
    print(stdout.read().decode())
    
    # 2. Check git status
    print("=== Git status ===")
    stdin, stdout, stderr = ssh.exec_command("cd /root/apps/backend && git status")
    print(stdout.read().decode())
    
    # 3. Check git remote
    print("=== Git remote ===")
    stdin, stdout, stderr = ssh.exec_command("cd /root/apps/backend && git remote -v")
    print(stdout.read().decode())

    # 4. Check pm2 list
    print("=== PM2 List ===")
    stdin, stdout, stderr = ssh.exec_command("pm2 list || echo 'pm2 not found'")
    print(stdout.read().decode())

    ssh.close()
except Exception as e:
    print("Failed:", str(e))
