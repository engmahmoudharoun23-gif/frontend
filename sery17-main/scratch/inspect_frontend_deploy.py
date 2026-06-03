import paramiko

ip = "75.119.156.160"
username = "root"
pwd = "M14149mmhh"

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
try:
    ssh.connect(ip, username=username, password=pwd, timeout=10)
    print("SSH Connection Successful!")
    
    # Check Nginx config files
    print("=== Nginx Sites Enabled ===")
    stdin, stdout, stderr = ssh.exec_command("ls -la /etc/nginx/sites-enabled/")
    print(stdout.read().decode())
    
    print("=== Nginx Sites Enabled Configs ===")
    stdin, stdout, stderr = ssh.exec_command("cat /etc/nginx/sites-enabled/*")
    print(stdout.read().decode())
    
    print("=== Nginx Conf.d Configs ===")
    stdin, stdout, stderr = ssh.exec_command("cat /etc/nginx/conf.d/*")
    print(stdout.read().decode())

    print("=== Find Frontend Directories ===")
    stdin, stdout, stderr = ssh.exec_command("find /root /var/www -name \"index.html\" 2>/dev/null")
    print(stdout.read().decode())

    ssh.close()
except Exception as e:
    print("Failed:", str(e))
