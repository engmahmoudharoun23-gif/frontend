import re

filepath = 'frontend/src/pages/ReportForm.js'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# Fix 1: deleteExistingImage
content = content.replace(
    'await axios.delete(`${API}/reports/${id}/images/${index}`);',
    'await axios.delete(`${API}/reports/${id}/images/${index}`, { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } });'
)

# Fix 2: fetchReport
content = content.replace(
    'const response = await axios.get(`${API}/reports/${id}?exclude_images=true`);',
    'const response = await axios.get(`${API}/reports/${id}?exclude_images=true`, { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } });'
)

# Fix 3: fetchReportImages
content = content.replace(
    'const response = await axios.get(`${API}/reports/${id}/images`);',
    'const response = await axios.get(`${API}/reports/${id}/images`, { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } });'
)

# Fix 4: config in handleSubmit
content = content.replace(
    '''      const config = {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 30000,
      };''',
    '''      const config = {
        headers: { 
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${localStorage.getItem("token")}`
        },
        timeout: 30000,
      };'''
)

# Fix 5: uploadImagesInBackground
content = content.replace(
    '''        await axios.post(`${API}/reports/${reportId}/images`, imageForm, {
          headers: { 'Content-Type': 'multipart/form-data' },''',
    '''        await axios.post(`${API}/reports/${reportId}/images`, imageForm, {
          headers: { 
            'Content-Type': 'multipart/form-data',
            'Authorization': `Bearer ${localStorage.getItem("token")}`
          },'''
)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)
print("Updated ReportForm.js with auth headers")
