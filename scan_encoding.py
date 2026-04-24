import os, sys
sys.stdout.reconfigure(encoding='utf-8')

broken_patterns = ['\u00e1\u00bb', '\u00c3', '\u00e2\u20ac', '\u00f0\u0178', '\u00c6\u00b0', '\u00c4']
exts = ('.html', '.js', '.css')
results = []
for root, dirs, files in os.walk('.'):
    dirs[:] = [d for d in dirs if d not in ['.git', 'node_modules']]
    for fn in files:
        if not any(fn.endswith(e) for e in exts):
            continue
        path = os.path.join(root, fn)
        try:
            with open(path, 'r', encoding='utf-8') as f:
                for i, line in enumerate(f, 1):
                    if any(p in line for p in broken_patterns):
                        results.append(path + ':' + str(i) + ': ' + line.rstrip()[:120])
        except Exception as e:
            pass

with open('all_broken.txt', 'w', encoding='utf-8') as f:
    f.write('\n'.join(results) if results else 'CLEAN')
print(str(len(results)) + ' broken lines found')
