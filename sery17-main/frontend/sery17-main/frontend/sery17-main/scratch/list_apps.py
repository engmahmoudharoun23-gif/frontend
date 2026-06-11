import paramiko

ip = "75.119.156.160"
username = "root"
pwd = "M14149mmhh"

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
try:
    ssh.connect(ip, username=username, password=pwd, timeout=10)
    print("SSH Connection Successful!")
    
    print("=== Contents of /root ===")
    stdin, stdout, stderr = ssh.exec_command("ls -la /root")
    print(stdout.read().decode())
    
    print("=== Contents of /root/apps ===")
    stdin, stdout, stderr = ssh.exec_command("ls -la /root/apps")
    print(stdout.read().decode())
    
    print("=== Listening Ports (netstat -tulnp) ===")
    stdin, stdout, stderr = ssh.exec_command("netstat -tulnp")
    print(stdout.read().decode())
    print(stderr.read().decode())

    ssh.close()
except Exception as e:
    print("Failed:", str(e))
