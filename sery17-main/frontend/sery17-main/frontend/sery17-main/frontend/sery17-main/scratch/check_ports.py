import socket

def check_port(port):
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        try:
            s.bind(("127.0.0.1", port))
            return False # Port is free
        except socket.error:
            return True # Port is in use

print(f"Port 3000 in use: {check_port(3000)}")
print(f"Port 8001 in use: {check_port(8001)}")
print(f"Port 27017 in use: {check_port(27017)}") # MongoDB
