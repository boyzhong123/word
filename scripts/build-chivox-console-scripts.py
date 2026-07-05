#!/usr/bin/env python3
"""Generate Chivox CMS console scripts for Yilin 4A (units only, batch upload)."""

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / 'data/textbooks/yilin-primary-4a-2024.json'
OUT = ROOT / 'data/textbooks/yilin-4a-2024-cms/console'
BOOK_MATCH = '四上'
WORD_CHAR_RE = re.compile(r"[^A-Za-z0-9'\-\.\s]")

UNITS = [
    'Unit 1 Our school subjects',
    'Unit 2 My day',
    'Unit 3 My week',
    'Unit 4 I like sport',
    'Unit 5 Different toys, same fun',
    'Unit 6 Weather',
    'Unit 7 Seasons',
    'Unit 8 What we wear',
]


def js_str(s: str) -> str:
    return json.dumps(s, ensure_ascii=False)


def build_batch_payload(data):
    units = []
    for unit in data['units']:
        words = []
        sents = []
        for w in unit['words']:
            if WORD_CHAR_RE.search(w['content']):
                sents.append({
                    'type': 'sent',
                    'content': w['content'],
                    'translation': w['translation'],
                })
            else:
                words.append({
                    'type': 'word',
                    'content': w['content'],
                    'translation': w['translation'],
                })
            sents.append({
                'type': 'sent',
                'content': w['sentence'],
                'translation': w['sentenceCn'],
            })
        units.append({
            'name': f"Unit {unit['unit']} {unit['title']}",
            'list': words + sents,
        })
    return units


DELETE_JS = r'''/**
 * Step 0 (optional): delete all units under 牛津译林四上(24版)
 * Paste in https://resm.chivoxapp.com/detail.html?courseId=637
 */
(async function deleteYilin4aUnits() {
  const tree = window.zTreeObj || $.fn.zTree.getZTreeObj('treeDemo');
  if (!tree) return console.error('open detail page first');

  const book = tree.getNodesByFilter(
    n => n.type === 'book' && /四上/.test(n.name || n.oldName || ''),
    true
  );
  if (!book) return console.error('四上 book not found');

  const units = [...(book.children || [])];
  console.log('deleting', units.length, 'units...');

  const delOne = params =>
    new Promise(resolve => {
      Ajax.beforeDelunit({ unitId: params.unitId }, data => {
        if (data.result !== 1) return resolve(false);
        Ajax.deleteunit(
          { bookId: params.bookId, unitId: params.unitId },
          res => resolve(res.result === 1)
        );
      });
    });

  for (const u of units) {
    const ok = await delOne({ bookId: book.id, unitId: u.id });
    if (ok) {
      tree.removeNode(u);
      console.log('deleted', u.name || u.oldName);
    } else {
      console.error('failed', u.name || u.oldName);
    }
  }
  console.log('done');
})();
'''

CREATE_JS = r'''/**
 * Step 1: create 8 units (no 子单元) under 牛津译林四上(24版)
 * Paste in https://resm.chivoxapp.com/detail.html?courseId=637
 */
(async function createYilin4aUnitsOnly() {
  const UNITS = __UNITS__;
  const tree = window.zTreeObj || $.fn.zTree.getZTreeObj('treeDemo');
  if (!tree) return console.error('open detail page first');

  const courseId = Number(
    window.bookId || new URLSearchParams(location.search).get('courseId')
  );
  const book = tree.getNodesByFilter(
    n => n.type === 'book' && /四上/.test(n.name || n.oldName || ''),
    true
  );
  if (!book) return console.error('四上 book not found');

  const addUnit = body =>
    new Promise(resolve => Ajax.unitupdateCourse(body, resolve));

  for (const name of UNITS) {
    const exists = (book.children || []).find(
      u => (u.name || u.oldName) === name
    );
    if (exists) {
      console.log('exists', name, exists.id);
      continue;
    }
    const res = await addUnit({
      courseId,
      bookId: book.id,
      bookType: book.book_type,
      name,
    });
    if (res.result !== 1) {
      console.error('failed', name, res);
      continue;
    }
    const node = res.info.unit;
    node.type = 'unit';
    node.isParent = true;
    node.children = [];
    tree.addNodes(book, node);
    console.log('created', name, node.id);
  }

  tree.expandNode(book, true, false, true);
  console.log('done — click a unit, then run step 2 batch upload');
})();
'''

UPLOAD_JS = r'''/**
 * Step 2: batch upload words then sentences into each unit (sectionId=0)
 * Run AFTER step 1. Paste in same CMS detail page.
 */
(async function uploadYilin4aBatch() {
  const BATCH = __BATCH__;
  const tree = window.zTreeObj || $.fn.zTree.getZTreeObj('treeDemo');
  if (!tree) return console.error('open detail page first');

  const book = tree.getNodesByFilter(
    n => n.type === 'book' && /四上/.test(n.name || n.oldName || ''),
    true
  );
  if (!book) return console.error('四上 book not found');

  const postBatch = body =>
    new Promise(resolve => Ajax.post('resources/batch', body, resolve));

  for (const unitData of BATCH) {
    const unit = tree.getNodesByFilter(
      n =>
        n.type === 'unit' &&
        n.getParentNode()?.id === book.id &&
        (n.name === unitData.name || n.oldName === unitData.name),
      true
    );
    if (!unit) {
      console.error('unit not found', unitData.name);
      continue;
    }

    console.log('uploading', unitData.name, unitData.list.length, 'items...');
    const res = await postBatch({
      unitId: unit.id,
      sectionId: 0,
      list: unitData.list,
    });
    if (res.result === 1) {
      console.log('ok', unitData.name);
    } else {
      console.error('fail', unitData.name, res.message || res);
    }
    await new Promise(r => setTimeout(r, 300));
  }
  console.log('all done — click Unit 1 to verify 单词/句子 tabs');
})();
'''


def main():
    data = json.loads(DATA.read_text(encoding='utf-8'))
    OUT.mkdir(parents=True, exist_ok=True)

    batch = build_batch_payload(data)
    units_js = json.dumps(UNITS, ensure_ascii=False, indent=2)
    batch_js = json.dumps(batch, ensure_ascii=False, indent=2)

    (OUT / '00-delete-units.js').write_text(DELETE_JS, encoding='utf-8')
    (OUT / '01-create-units.js').write_text(
        CREATE_JS.replace('__UNITS__', units_js), encoding='utf-8'
    )
    (OUT / '02-batch-upload.js').write_text(
        UPLOAD_JS.replace('__BATCH__', batch_js), encoding='utf-8'
    )

    readme = f'''# 控制台脚本（仅单元层级）

在 [CMS 四上详情页](https://resm.chivoxapp.com/detail.html?courseId=637) 打开 F12 控制台，按顺序粘贴运行：

| 步骤 | 文件 | 作用 |
|------|------|------|
| 0（可选） | `00-delete-units.js` | 删掉四书下所有单元 |
| 1 | `01-create-units.js` | 建 8 个 Unit（无子单元） |
| 2 | `02-batch-upload.js` | 每单元批量写入：先单词、后句子 |

层级：`书本 → 单元 → 单词/句子`（点击单元时 sectionId=0）

共 {data['meta']['wordCount']} 词条 × 2（单词+例句）≈ {data['meta']['wordCount'] * 2} 条资源。
'''
    (OUT / 'README.md').write_text(readme, encoding='utf-8')

    print(f'wrote {OUT}')
    print(f'units: {len(batch)}, total items: {sum(len(u["list"]) for u in batch)}')


if __name__ == '__main__':
    main()
