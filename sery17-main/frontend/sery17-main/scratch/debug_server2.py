import http.server
import socketserver
import json

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
        with open("d:/sery17-main/sery17-main/scratch/debug_log.txt", "a", encoding="utf-8") as f:
            f.write(post_data.decode('utf-8') + "\n")
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()

def run():
    with socketserver.TCPServer(("", 9998), Handler) as httpd:
        httpd.serve_forever()

run()
