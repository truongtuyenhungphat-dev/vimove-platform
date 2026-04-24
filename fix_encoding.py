import ftfy, os, sys
sys.stdout.reconfigure(encoding='utf-8')

files_to_fix = [
    'index.html',
    'css/components.css',
    'css/sprint1.css',
    'css/workflow.css',
]

for path in files_to_fix:
    with open(path, 'r', encoding='utf-8') as f:
        text = f.read()
    fixed = ftfy.fix_text(text)
    if fixed != text:
        with open(path, 'w', encoding='utf-8') as f:
            f.write(fixed)
        print('Fixed: ' + path)
    else:
        print('Clean:  ' + path)

print('Done.')
