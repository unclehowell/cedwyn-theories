#!/usr/bin/env python3
"""theories_sync.py - build the Theories webapp's own small database. - Cedwyn editors

Reads tools/theories.src.json (the theories in neutral wording) and the central catalogue (data/core/records/*.json on
unclehowell/cedwyn, main by default) and writes data/theories.json with only what this page shows: each theory's title,
summary, status, date added, the evidence IDs for and against it (each resolved to its title, date and holder when the
central catalogue carries it, otherwise to the register that holds it), and what would test it. It then renders the same
entries into index.html between the THEORIES markers, so the page reads with no JavaScript and agents can read plain HTML.
The editorial word gate runs on the output; a banned word stops the sync.

  python3 tools/theories_sync.py                      # read main on GitHub
  python3 tools/theories_sync.py --ref main --ref <branch>   # later refs overlay earlier ones (unmerged catalogue PRs)
  python3 tools/theories_sync.py --core <checkout>/data/core/records
"""
import json, os, re, sys, html, codecs, datetime as dt, urllib.request, urllib.parse
HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
REPO = 'unclehowell/cedwyn'
UA = {'User-Agent': 'cedwyn-theories-sync'}
# the editorial gate's word list, kept ROT13-encoded so this public file does not itself carry the words
BANNED = re.compile(r'\b(' + codecs.decode(r'fnlf|pynvzf?|nppbeqvat gb|urnefnl|hairevsvrq|nyyrtrq|senhq\j*|fgbyra|pbafcvenpl', 'rot13') + r')\b', re.I)
REGISTERS = [  # IDs the central catalogue does not carry live in these registers on the site
    ('EV-', 'Evidence catalogue', '/docs/'), ('MR-', 'Missing-records register', '/research/missing-records/'),
    ('GHF-', 'Legal Wiki evidence', '/wiki/'), ('TOC-', 'That Old Chestnut', '/that-old-chestnut/'),
    ('KF-', 'Kissed Frogs', '/kissed-frogs/'), ('AR-', 'Research Library', '/research/')]

def get(url):
    with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=60) as r:
        return r.read().decode('utf-8')

def load_ref(ref):
    q = urllib.parse.quote(ref, safe='')
    listing = json.loads(get(f'https://api.github.com/repos/{REPO}/contents/data/core/records?ref={q}'))
    return {f['name']: json.loads(get(f'https://raw.githubusercontent.com/{REPO}/{q}/data/core/records/{f["name"]}'))
            for f in listing if f['name'].endswith('.json')}

def load_dir(d):
    return {n: json.load(open(os.path.join(d, n), encoding='utf-8')) for n in sorted(os.listdir(d)) if n.endswith('.json')}

def records(files):
    for name, j in files.items():
        rows = j.get('records', []) if isinstance(j, dict) else (j if isinstance(j, list) else [])
        for r in rows:
            if isinstance(r, dict) and r.get('id'): yield name, r

def register(i):
    for p, t, u in REGISTERS:
        if i.startswith(p): return t, u
    return 'Site record', '/research/'

def resolve(i, note, pool):
    t, u = register(i)
    ref = {'id': i, 'note': note, 'register': t, 'href': u, 'in_central': False}
    if i in pool:
        name, r = pool[i]
        if r.get('public') is not False:
            d = r.get('date'); d = d.get('display') if isinstance(d, dict) else d
            prov = r.get('provenance') or {}
            ref.update({'in_central': True, 'file': name, 'title': r.get('title', i), 'date': d or '',
                        'holder': prov.get('holder') or (r.get('finding') or {}).get('institution') or ''})
    if i.startswith('TOC-'): ref['href'] = '/that-old-chestnut/#cn-' + i.lower()
    return ref

def main(argv):
    refs, core, i = [], None, 0
    while i < len(argv):
        if argv[i] == '--ref': refs.append(argv[i + 1]); i += 2
        elif argv[i] == '--core': core = argv[i + 1]; i += 2
        else: sys.exit(__doc__)
    src = json.load(open(os.path.join(HERE, 'tools', 'theories.src.json'), encoding='utf-8'))
    pool, sources = {}, []
    if core:
        for name, r in records(load_dir(core)): pool[r['id']] = (name, r)
        sources.append({'local': core})
    else:
        for ref in (refs or ['main']):
            files = load_ref(ref)
            for name, r in records(files): pool[r['id']] = (name, r)
            sources.append({'ref': ref, 'files': sorted(files)})
    out = []
    for t in src['theories']:
        out.append({'id': t['id'], 'title': t['title'], 'added': t['added'], 'status': t['status'],
                    'status_label': t['status_label'], 'summary': t['summary'],
                    'evidence_for': [resolve(a, b, pool) for a, b in t.get('for', [])],
                    'against': t.get('against', []),
                    'test': t.get('test', ''), 'test_ids': [resolve(x, '', pool) for x in t.get('tests_ids', [])],
                    'see': t.get('see', [])})
    out.sort(key=lambda e: (e['added'], e['id']), reverse=True)
    db = {'schema': 'theories/1', 'synced_at': dt.datetime.utcnow().strftime('%Y-%m-%dT%H:%M:%SZ'), 'sources': sources,
          'framing': "Each entry is the family's open working theory, not checked, shown with what cuts against it.",
          'counts': {'theories': len(out), 'open': sum(e['status'] == 'open' for e in out),
                     'tested': sum(e['status'] == 'tested' for e in out),
                     'evidence_ids': sum(len(e['evidence_for']) + len(e['test_ids']) for e in out),
                     'in_central': sum(r['in_central'] for e in out for r in e['evidence_for'] + e['test_ids'])},
          'theories': out}
    text = json.dumps(db, ensure_ascii=False, indent=1)
    bad = sorted({m.group(0) for m in BANNED.finditer(text)})
    if bad: sys.exit('banned words in output: %s' % bad)
    open(os.path.join(HERE, 'data', 'theories.json'), 'w', encoding='utf-8').write(text + '\n')
    render(db)
    print(json.dumps(db['counts']))

def e_(s): return html.escape(str(s or ''), quote=True)
def fd(iso):
    try: d = dt.date.fromisoformat(iso[:10]); return f'{d.day} {d.strftime("%B %Y")}'
    except Exception: return iso or ''
def chip(r):
    lab = r['id'] + (' · ' + r['note'] if r.get('note') else '')
    tip = r.get('title') or r['register']
    return f'<a class="th-ev" href="{e_(r["href"])}" title="{e_(tip)}">{e_(lab)}</a>'

def render(db):
    cards = []
    for e in db['theories']:
        fr = ''.join(f'<li>{chip(r)}</li>' for r in e['evidence_for']) or '<li class="th-none">No record yet supports it.</li>'
        ag = ''.join(f'<li>{e_(x)}</li>' for x in e['against']) or '<li class="th-none">Nothing recorded yet.</li>'
        tid = (' ' + ' '.join(chip(r) for r in e['test_ids'])) if e['test_ids'] else ''
        see = ' · '.join(f'<a href="{e_(u)}">{e_(t)}</a>' for t, u in e['see'])
        cards.append(
            f'<article class="th-card" id="th-{e_(e["id"].lower())}" data-status="{e_(e["status"])}">'
            f'<p class="th-meta"><span class="th-id">{e_(e["id"])}</span> <span class="th-st th-st-{e_(e["status"])}">{e_(e["status_label"])}</span>'
            f' <span>added <time datetime="{e_(e["added"])}">{fd(e["added"])}</time></span></p>'
            f'<h3>{e_(e["title"])}</h3><p class="th-sum">{e_(e["summary"])}</p>'
            f'<div class="th-pair"><div class="th-for"><p class="th-lab">Records it rests on</p><ul>{fr}</ul></div>'
            f'<div class="th-against"><p class="th-lab">What cuts against it</p><ul>{ag}</ul></div></div>'
            f'<p class="th-test"><b>What would test it:</b> {e_(e["test"])}{tid}</p>'
            + (f'<p class="th-see">{see}</p>' if see else '') + '</article>')
    c = db['counts']
    stats = (f'<p class="th-stats"><b>{c["theories"]}</b> working theories · <b>{c["open"]}</b> open · <b>{c["tested"]}</b> tested'
             f' · synced {fd(db["synced_at"])}</p>')
    p = os.path.join(HERE, 'index.html'); h = open(p, encoding='utf-8').read()
    h = re.sub(r'<!--THEORIES:STATS-->.*?<!--/THEORIES:STATS-->', lambda m: '<!--THEORIES:STATS-->' + stats + '<!--/THEORIES:STATS-->', h, flags=re.S)
    h = re.sub(r'<!--THEORIES:ENTRIES-->.*?<!--/THEORIES:ENTRIES-->', lambda m: '<!--THEORIES:ENTRIES-->' + ''.join(cards) + '<!--/THEORIES:ENTRIES-->', h, flags=re.S)
    open(p, 'w', encoding='utf-8').write(h)

if __name__ == '__main__':
    main(sys.argv[1:])
