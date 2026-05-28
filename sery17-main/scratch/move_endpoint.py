import sys

def move_endpoint():
    with open('backend/server.py', 'r', encoding='utf-8') as f:
        lines = f.readlines()
        
    start_idx = -1
    end_idx = -1
    target_idx = -1
    
    for i, line in enumerate(lines):
        if line.startswith('@api_router.get("/reports/consultant-notes")'):
            start_idx = i
        if line.startswith('@api_router.get("/reports/{report_id}", response_model=ReportResponse)'):
            target_idx = i
            
    if start_idx == -1 or target_idx == -1:
        print('Not found', start_idx, target_idx)
        return
        
    for i in range(start_idx+1, len(lines)):
        if lines[i].startswith('app.include_router(api_router)'):
            end_idx = i
            break
            
    chunk = lines[start_idx:end_idx]
    
    del lines[start_idx:end_idx]
    
    # ensure there's an empty line after the chunk
    if chunk[-1].strip() != "":
        chunk.append("\n\n")
        
    for c in reversed(chunk):
        lines.insert(target_idx, c)
        
    with open('backend/server.py', 'w', encoding='utf-8') as f:
        f.writelines(lines)
        
    print('Moved successfully')

move_endpoint()
