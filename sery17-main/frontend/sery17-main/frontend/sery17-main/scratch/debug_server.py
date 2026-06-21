import http.server
import socketserver
import json
import threading

class Handler(http.server.SimpleHTTPRequestHandler):
    def do_OPTIONS(self):
        self.send_response(200, "ok")
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header("Access-Control-Allow-Headers", "X-Requested-With, Content-type")
        self.end_headers()

    def do_POST(self):
        content_length = int(self.headers['Content-Length'])
        post_data = self.rfile.read(content_length)
        print("====== DEBUG DATA FROM BROWSER ======")
        print(post_data.decode('utf-8'))
        print("=====================================")
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()

def run():
    with socketserver.TCPServer(("", 9999), Handler) as httpd:
        print("Debug server serving at port 9999")
        httpd.serve_forever()

run()
