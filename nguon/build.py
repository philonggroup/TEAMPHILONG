# -*- coding: utf-8 -*-
"""Chuyen 18 artboard .dc.html cua canvas Design -> 1 file giaoban.html (SPA) chay tren GitHub Pages.
Giu NGUYEN 100% markup/CSS cua demo, chi:
  - thay cac {{hole}} cua runtime Design bang markup that + class de JS dieu khien
  - doi href "X.dc.html" -> "#X" (router hash)
  - gan data-k vao cac o so co nguon that de lop live ghi de
"""
import json, os, re, sys
from bs4 import BeautifulSoup

SRC = sys.argv[1]
OUT = sys.argv[2]

cv = json.load(open(os.path.join(SRC, 'canvas.json'), encoding='utf-8'))
ORDER = cv['order']
BOARDS = cv['boards']

def inner_xdc(path):
    s = open(path, encoding='utf-8').read()
    m = re.search(r'<x-dc>(.*)</x-dc>', s, re.S)
    body = m.group(1)
    tot = re.search(r'const total = (\d+)', s)
    return body, (int(tot.group(1)) if tot else 0)

def key(name):            # Main.dc.html -> Main
    return name[:-len('.dc.html')]

screens = []
for name in ORDER:
    body, total = inner_xdc(os.path.join(SRC, name))
    soup = BeautifulSoup(body, 'html.parser')
    for h in soup.find_all('helmet'):
        h.decompose()
    root = soup.find('div')

    # --- 1. href -> hash router
    for a in root.find_all('a', href=True):
        if a['href'].endswith('.dc.html'):
            a['href'] = '#' + key(a['href'])

    # --- 2. dong ho dem nguoc: thay {{hole}} bang markup that
    for el in root.find_all(style=re.compile(r'\{\{tBg\}\}')):
        el['style'] = el['style'].replace('{{tBg}}', '#E7F5EC').replace('{{tFg}}', '#1E6B3A')
        el['class'] = el.get('class', []) + ['pl-timer']
    for el in root.find_all(string=re.compile(r'\{\{tCap\}\}')):
        sp = el.parent
        sp.string = 'CÒN LẠI'
        sp['class'] = sp.get('class', []) + ['pl-tcap']
    for el in root.find_all(string=re.compile(r'\{\{tText\}\}')):
        sp = el.parent
        mm, ss = divmod(total, 60)
        sp.string = '%02d:%02d' % (mm, ss)
        sp['class'] = sp.get('class', []) + ['pl-ttext']
    for b in root.find_all('button'):
        oc = b.get('onclick') or b.get('onClick') or ''
        if '{{toggle}}' in oc:
            del b['onclick']
            b['class'] = b.get('class', []) + ['pl-ttoggle']
            b['type'] = 'button'
            b.string = 'Tạm dừng'
        elif '{{reset}}' in oc:
            del b['onclick']
            b['class'] = b.get('class', []) + ['pl-treset']
            b['type'] = 'button'

    # --- 3. badge "SO MINH HOA" -> JS doi thanh SO LIEU LIVE
    for el in root.find_all(string=re.compile(r'SỐ MINH HỌA')):
        sp = el.parent
        sp['class'] = sp.get('class', []) + ['pl-badge-nguon']

    k = key(name)

    # --- 3b. nhan tuan tren sidebar + tieu de man, de lop live ghi dung tuan that
    for el in root.find_all(string=re.compile(r'Giao ban tuần \d+')):
        el.parent['data-k'] = 'nhan.sidebar'
    h1 = root.find('h1')
    if h1 is not None and re.search(r'Toàn cảnh tuần', h1.get_text()):
        h1['data-k'] = 'nhan.tieude'
    for el in root.find_all(string=re.compile(r'Số tuần \d')):
        el.parent['data-k'] = 'nhan.khoangngay'
    for el in root.find_all(string=re.compile(r'Thứ Hai \d{2}/\d{2}/\d{4}')):
        el.parent['data-k'] = 'nhan.ngayhop'
    for el in root.find_all(string=re.compile(r'CSKH trung tâm')):
        sp = el.parent
        while sp is not None and sp.name not in ('span', 'div'):
            sp = sp.parent
        if sp is not None:
            sp['data-k'] = 'cskh.dong'

    # --- 4. gan data-k cho man Toan canh (Main)
    if k == 'Main':
        # 4 the KPI + the bieu do: hang <div style="display: flex; gap: 10px">
        row = root.find('div', style=re.compile(r'^display: flex; gap: 10px$'))
        if row:
            cards = row.find_all('div', recursive=False)
            for i, ck in enumerate(['dt', 'laigop', 'atx', 'datlich']):
                if i >= len(cards):
                    break
                c = cards[i]
                spans = c.find_all('span')
                # [0]=gia tri, [1]=/ don vi, [2]=%, [3]=badge
                if len(spans) >= 4:
                    spans[0]['data-k'] = 'tong.%s.val' % ck
                    spans[1]['data-k'] = 'tong.%s.unit' % ck
                    spans[2]['data-k'] = 'tong.%s.pct' % ck
                    spans[3]['data-k'] = 'tong.%s.badge' % ck
                lab = c.find('div')
                if lab:
                    lab['data-k'] = 'tong.%s.label' % ck
            if len(cards) >= 5:  # the bieu do 4 tuan
                bars = cards[4].find_all('div', style=re.compile(r'width: 30px'))
                for j, bd in enumerate(bars):
                    sp = bd.find_all('span')
                    bar = bd.find('div')
                    if len(sp) >= 2:
                        sp[0]['data-k'] = 'chart.%d.pct' % j
                        sp[1]['data-k'] = 'chart.%d.nhan' % j
                    if bar is not None:
                        bar['data-k'] = 'chart.%d.bar' % j
        # nhan xet dieu phoi
        nx = root.find('div', style=re.compile(r'grid-template-columns: repeat\(3, minmax\(0, 1fr\)\)'))
        if nx:
            for j, sp in enumerate(nx.find_all('span', recursive=False)):
                sp['data-k'] = 'nhanxet.%d' % j
        # 3 the chi nhanh
        crow = root.find('div', style=re.compile(r'display: flex; gap: 12px; flex: 1; min-height: 0'))
        if crow:
            for i, card in enumerate(crow.find_all('div', recursive=False)):
                card['data-k'] = 'cn.%d.the' % i
                head = card.find('div')
                if head:
                    hs = head.find_all('span')
                    if len(hs) >= 2:
                        hs[0]['data-k'] = 'cn.%d.ten' % i
                        hs[1]['data-k'] = 'cn.%d.muc' % i
                quick = card.find('div', style=re.compile(r'background: #EAF2F8; border-radius: 6px'))
                if quick:
                    quick['data-k'] = 'cn.%d.docnhanh' % i
                rows = card.find_all('div', style=re.compile(r'grid-template-columns: 78px 1fr 44px 58px'))
                for j, r in enumerate(rows):
                    sp = r.find_all('span', recursive=False)
                    if len(sp) >= 4:
                        sp[0]['data-k'] = 'cn.%d.r%d.nhom' % (i, j)
                        sp[1]['data-k'] = 'cn.%d.r%d.ten' % (i, j)
                        sp[2]['data-k'] = 'cn.%d.r%d.pct' % (i, j)
                        b = sp[3].find('span')
                        (b or sp[3])['data-k'] = 'cn.%d.r%d.badge' % (i, j)
                goo = card.find('div', style=re.compile(r'justify-content: space-between; font-size: 12px; color: #5F6B7A'))
                if goo:
                    goo['data-k'] = 'cn.%d.google' % i
                foot = card.find('div', style=re.compile(r'margin-top: auto'))
                if foot:
                    fs = foot.find('span')
                    if fs:
                        fs['data-k'] = 'cn.%d.canhbao' % i

    # --- 5. gan data-k cho 3 man chi tiet chi nhanh (GB3*)
    if k.startswith('GB3'):
        rows = root.find_all('div', style=re.compile(r'grid-template-columns: 1fr 64px 38px 52px'))
        for j, r in enumerate(rows):
            sp = r.find_all('span', recursive=False)
            if len(sp) >= 4:
                sp[0]['data-k'] = 'ct.r%d.ten' % j
                sp[1]['data-k'] = 'ct.r%d.so' % j
                sp[2]['data-k'] = 'ct.r%d.pct' % j
                b = sp[3].find('span')
                (b or sp[3])['data-k'] = 'ct.r%d.badge' % j
        bars = root.find_all('div', style=re.compile(r'width: 30px'))
        for j, bd in enumerate(bars):
            sp = bd.find_all('span')
            bar = bd.find('div')
            if len(sp) >= 2:
                sp[0]['data-k'] = 'ctchart.%d.pct' % j
                sp[1]['data-k'] = 'ctchart.%d.nhan' % j
            if bar is not None:
                bar['data-k'] = 'ctchart.%d.bar' % j

    # --- 6. gan data-k cho bang viec tuan truoc (GB2) va bang chot viec (GB6)
    if k == 'GB2ViecCu':
        rows = root.find_all('div', style=re.compile(r'grid-template-columns: 170px minmax\(0, 1fr\) 70px 150px'))
        for j, r in enumerate(rows):
            r['data-k'] = 'vtt.r%d' % j   # r0 = header
    if k == 'GB6ChotViec':
        for j, r in enumerate(root.find_all('div', style=re.compile(r'grid-template-columns:'))):
            r['data-k'] = 'ck.r%d' % j

    b = BOARDS[name]
    screens.append({
        'id': k, 'w': b['w'], 'h': b['h'], 'total': total,
        'title': b.get('title', k), 'html': root.decode()
    })

json.dump(screens, open(OUT, 'w', encoding='utf-8'), ensure_ascii=False)
print('OK %d man' % len(screens))
for s in screens:
    print('  %-16s %4dx%-5d %4ds  %s' % (s['id'], s['w'], s['h'], s['total'], s['title']))
