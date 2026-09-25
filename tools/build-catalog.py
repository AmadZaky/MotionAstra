from pathlib import Path
import re
p=Path(__file__).resolve().parent.parent
s=(p/'index.html').read_text().replace('<body>','<body class="catalog">').replace('<title>MotionAstra 2.5.4</title>','<title>MotionAstra 2.5 · Preview catalog</title>')
s=s.replace('<link rel="stylesheet" href="css/style.css">','<style>'+(p/'css/style.css').read_text()+'</style>')
def script(m):return '<script>\n'+(p/m.group(1)).read_text().replace('</script','<\\/script')+'\n</script>'
s=re.sub(r'<script src="([^"]+)"></script>',script,s)
(p/'catalog.html').write_text(s)
