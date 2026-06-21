s = "ط¯ط§ظ„ط©"

try:
    print("cp1252 to utf-8:", s.encode('cp1252').decode('utf-8'))
except Exception as e:
    print("cp1252 error:", e)

try:
    print("windows-1256 to utf-8:", s.encode('windows-1256').decode('utf-8'))
except Exception as e:
    print("windows-1256 error:", e)
