import paramiko

ip = "75.119.156.160"
username = "root"
pwd = "M14149mmhh"

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
try:
    ssh.connect(ip, username=username, password=pwd, timeout=10)
    print("SSH Connection Successful!")
    
    # Find all .git directories on the system
    print("=== Git Repositories on VPS ===")
    stdin, stdout, stderr = ssh.exec_command("find / -name \".git\" -type d 2>/dev/null")
    print(stdout.read().decode())
    
    ssh.close()
except Exception as e:
    print("Failed:", str(e))
