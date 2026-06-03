import paramiko

ip = "75.119.156.160"
username = "root"
pwd = "M14149mmhh"

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
try:
    ssh.connect(ip, username=username, password=pwd, timeout=10)
    print("SSH Connection Successful!")
    
    print("=== Contents of /etc/nginx/sites-available ===")
    stdin, stdout, stderr = ssh.exec_command("ls -la /etc/nginx/sites-available")
    print(stdout.read().decode())
    
    ssh.close()
except Exception as e:
    print("Failed:", str(e))
