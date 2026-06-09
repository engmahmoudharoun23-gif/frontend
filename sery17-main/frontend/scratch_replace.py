import os

path = r'd:\sery17-main\sery17-main\backend\server.py'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace('{"_id": 0, "image": 0, "images": 0}', '{"_id": 0}')
content = content.replace('{"_id": 0, "files": 0, "file_url": 0}', '{"_id": 0}')
content = content.replace('{"_id": 0, "images": 0}', '{"_id": 0}')
content = content.replace('{"_id": 0, "image": 0}', '{"_id": 0}')

# Add /compress-pdf endpoint if not exists
pdf_endpoint = """
import fitz  # PyMuPDF
import base64

@api_router.post("/compress-pdf")
async def compress_pdf(data: dict, current_user: User = Depends(get_current_user)):
    pdf_base64 = data.get("pdf", "")
    if not pdf_base64.startswith("data:application/pdf"):
        return {"pdf": pdf_base64}
        
    try:
        header, encoded = pdf_base64.split(",", 1)
        pdf_bytes = base64.b64decode(encoded)
        
        # Compress using PyMuPDF
        doc = fitz.open("pdf", pdf_bytes)
        
        # Basic optimization
        new_bytes = doc.write(garbage=4, deflate=True, clean=True)
        doc.close()
        
        new_base64 = header + "," + base64.b64encode(new_bytes).decode('utf-8')
        return {"pdf": new_base64}
    except Exception as e:
        print("PDF compression error:", str(e))
        return {"pdf": pdf_base64}

app.include_router(api_router)
"""
if "/compress-pdf" not in content:
    content = content.replace('app.include_router(api_router)', pdf_endpoint)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Replacement complete")
