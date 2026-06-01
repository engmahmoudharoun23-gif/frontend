with open('scratch/db_names_output.txt', 'rb') as f:
    content = f.read()
    try:
        print(content.decode('utf-16'))
    except:
        print(content.decode('utf-8'))
