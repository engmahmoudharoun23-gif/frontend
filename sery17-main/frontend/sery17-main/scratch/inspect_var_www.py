import paramiko

ip = "75.119.156.160"
username = "root"
pwd = "M14149mmhh"

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
try:
    ssh.connect(ip, username=username, password=pwd, timeout=10)
    print("SSH Connection Successful!")
    
    print("=== Contents of /var/www/html ===")
    stdin, stdout, stderr = ssh.exec_command("ls -la /var/www/html")
    print(stdout.read().decode())
    
    print("=== Git status of /var/www/html (if it is a git repo) ===")
    stdin, stdout, stderr = ssh.exec_command("cd /var/www/html && git status")
    print(stdout.read().decode())
    print(stderr.read().decode())
    
    print("=== Git remote of /var/www/html (if it is a git repo) ===")
    stdin, stdout, stderr = ssh.exec_command("cd /var/www/html && git remote -v")
    print(stdout.read().decode())

    ssh.close()
except Exception as e:
    print("Failed:", str(e))
