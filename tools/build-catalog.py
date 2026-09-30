from pathlib import Path
import re
p=Path(__file__).resolve().parent.parent
s=(p/'index.html').read_text().replace('<body>','<body class="catalog">')
s=re.sub(r'<title>.*?</title>','<title>MotionAstra · Preview catalog</title>',s)
s=re.sub(r'<link rel="stylesheet" href="css/style.css"\s*/?>',lambda _: '<style>'+(p/'css/style.css').read_text()+'</style>',s)
def script(m):return '<script>\n'+(p/m.group(1)).read_text().replace('</script','<\\/script')+'\n</script>'
s=re.sub(r'<script src="([^"]+)"></script>',script,s)
s += '\n<!-- YU Txt Motion by YUGraphic\n'+(p/'vendor/yu-text-motion/LICENSE.txt').read_text()+'-->\n'
(p/'catalog.html').write_text(s)
