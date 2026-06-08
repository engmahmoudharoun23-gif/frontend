import paramiko

ip = "75.119.156.160"
username = "root"
passwords = ["M14149mmhh"]

for pwd in passwords:
    print(f"Trying password: {pwd} ...")
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    try:
        ssh.connect(ip, username=username, password=pwd, timeout=10)
        print("Success: SSH Connection Successful!")
        stdin, stdout, stderr = ssh.exec_command("hostname; uname -a")
        print("Output:", stdout.read().decode())
        ssh.close()
        break
    except Exception as e:
        print("Failed:", str(e))
        ssh.close()
