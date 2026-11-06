from pathlib import Path
import argparse, base64, gzip, json
parser=argparse.ArgumentParser()
parser.add_argument('--offline',type=Path,help='Write a self-contained HTML file')
args=parser.parse_args()
root=Path(__file__).resolve().parents[1]
tools=root/'tools'
html=(tools/'template.html').read_text(encoding='utf-8')
data=json.loads((tools/'metadata.json').read_text(encoding='utf-8'))
if args.offline:
    data['glyphs']=json.loads(gzip.decompress((root/'docs/assets/bank.json.gz').read_bytes()))
    data['font']=base64.b64encode((root/'fonts/kuraikura-Regular.ttf').read_bytes()).decode()
for marker,name in [('STYLE','style.css'),('ENGINE','engine.js'),('APP','app.js')]:
    html=html.replace('/*'+marker+'*/',(tools/name).read_text(encoding='utf-8'))
html=html.replace('/*DATA*/',json.dumps(data,ensure_ascii=False,separators=(',',':')).replace('<','\\u003c'))
target=args.offline or root/'docs/index.html'
target.parent.mkdir(parents=True,exist_ok=True)
target.write_text(html,encoding='utf-8')
print(target)
