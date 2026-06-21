import sys

def fix_mojibake(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Attempt to fix chunks
    fixed_chars = []
    
    # We will try to encode to windows-1256 and decode to utf-8
    # But only for characters that are actually corrupted (they fall into the arabic range that was misread)
    # Actually, the simplest way is to encode the whole string to windows-1256. 
    # Any ascii character encodes to itself in windows-1256.
    
    try:
        raw_bytes = content.encode('windows-1256')
        fixed_content = raw_bytes.decode('utf-8')
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(fixed_content)
        print("Fixed completely via windows-1256!")
    except Exception as e:
        print("Whole file fix failed. Doing character by character fallback. Error:", e)
        # Fallback if there are mixed characters
        res = ""
        for i, c in enumerate(content):
            try:
                b = c.encode('windows-1256')
                res += b.decode('utf-8')
            except:
                res += c
        # The character by character approach doesn't work for multi-byte utf-8 sequences
        # We need a buffer
        
        buffer = bytearray()
        fixed_string = ""
        
        for c in content:
            if ord(c) < 128:
                if buffer:
                    try:
                        fixed_string += buffer.decode('utf-8')
                    except:
                        fixed_string += buffer.decode('windows-1256', errors='replace')
                    buffer = bytearray()
                fixed_string += c
            else:
                try:
                    buffer.extend(c.encode('windows-1256'))
                except:
                    # character cannot be encoded in windows-1256
                    if buffer:
                        try:
                            fixed_string += buffer.decode('utf-8')
                        except:
                            fixed_string += buffer.decode('windows-1256', errors='replace')
                        buffer = bytearray()
                    fixed_string += c
                    
        if buffer:
            try:
                fixed_string += buffer.decode('utf-8')
            except:
                fixed_string += buffer.decode('windows-1256', errors='replace')
                
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(fixed_string)
        print("Fixed via buffer method!")

fix_mojibake('frontend/src/pages/Reports.js')
