import io
import sys
import logging
from PIL import Image
from reportlab.pdfgen import canvas
from pypdf import PdfReader, PdfWriter

def create_sample_pdf():
    # Create a small PDF with a drawImage in it
    buf = io.BytesIO()
    c = canvas.Canvas(buf)
    c.drawString(100, 750, "Hello World from Antigravity")
    
    # Create a dummy image
    img = Image.new("RGB", (300, 300), color="blue")
    img_buf = io.BytesIO()
    img.save(img_buf, format="JPEG")
    img_buf.seek(0)
    
    # Draw image to canvas
    c.drawInlineImage(img, 100, 400, width=200, height=200)
    c.showPage()
    c.save()
    return buf.getvalue()

def try_compress_pdf(data_bytes, img_quality=60, max_dim=1200):
    try:
        reader = PdfReader(io.BytesIO(data_bytes))
        writer = PdfWriter()
        
        for page in reader.pages:
            if page.images:
                for img_file in page.images:
                    try:
                        img = Image.open(io.BytesIO(img_file.data))
                        if max(img.size) > max_dim:
                            img.thumbnail((max_dim, max_dim), Image.LANCZOS)
                        img_file.replace(img)
                    except Exception as img_err:
                        print(f"Error compressing PDF image: {img_err}")
            writer.add_page(page)
            
        for page in writer.pages:
            try:
                page.compress_content_keys()
            except Exception as comp_err:
                print(f"Error compressing page content keys: {comp_err}")
                
        out_buf = io.BytesIO()
        writer.write(out_buf)
        return out_buf.getvalue()
    except Exception as e:
        print(f"PDF compression failed: {e}")
        return data_bytes

def main():
    print("Generating sample PDF...")
    pdf_data = create_sample_pdf()
    print(f"Sample PDF size: {len(pdf_data)} bytes")
    
    print("Compressing PDF...")
    compressed_pdf = try_compress_pdf(pdf_data)
    print(f"Compressed PDF size: {len(compressed_pdf)} bytes")
    
    # Verify if the compressed PDF can be parsed
    try:
        reader = PdfReader(io.BytesIO(compressed_pdf))
        print(f"Number of pages in compressed PDF: {len(reader.pages)}")
        # Try reading pages
        for page in reader.pages:
            # Touch page elements
            _ = page.extract_text()
            if page.images:
                print(f"Found {len(page.images)} images in compressed PDF")
                for img in page.images:
                    print(f"Image name: {img.name}, size: {len(img.data)}")
        print("Verification SUCCESSful! PDF is valid and not corrupted.")
    except Exception as verify_err:
        print(f"Verification FAILED: PDF is corrupted! Error: {verify_err}")

if __name__ == "__main__":
    main()
