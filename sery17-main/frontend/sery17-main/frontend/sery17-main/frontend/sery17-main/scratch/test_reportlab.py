from reportlab.platypus import SimpleDocTemplate, Table, TableStyle
from reportlab.lib import colors
import io

try:
    output = io.BytesIO()
    doc = SimpleDocTemplate(output)
    elements = []
    
    # 1 row only (header)
    data = [["Col1", "Col2"]]
    table = Table(data)
    
    # Apply style that targets row 1
    table.setStyle(TableStyle([
        ('FONTSIZE', (0, 1), (-1, -1), 8)
    ]))
    
    elements.append(table)
    doc.build(elements)
    print("SUCCESS: No error thrown!")
except Exception as e:
    print(f"FAILED with error: {type(e).__name__}: {e}")
