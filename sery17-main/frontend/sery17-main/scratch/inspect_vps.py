import paramiko

ip = "75.119.156.160"
username = "root"
pwd = "M14149mmhh"

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
try:
    ssh.connect(ip, username=username, password=pwd, timeout=10)
    print("SSH Connection Successful!")
    
    # 1. Check running Python processes
    print("=== Running Python Processes ===")
    stdin, stdout, stderr = ssh.exec_command("ps aux | grep python")
    print(stdout.read().decode())
    
    # 2. Find server.py files on the system
    print("=== Location of server.py ===")
    stdin, stdout, stderr = ssh.exec_command("find / -name \"server.py\" 2>/dev/null")
    print(stdout.read().decode())
    
    # 3. Check systemd services
    print("=== Systemd Services ===")
    stdin, stdout, stderr = ssh.exec_command("systemctl list-units --type=service | grep -E 'wfm|api|backend|python|server'")
    print(stdout.read().decode())

    ssh.close()
except Exception as e:
    print("Failed:", str(e))
