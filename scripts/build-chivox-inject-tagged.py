#!/usr/bin/env python3
"""Generate Chivox CMS import script with per-section tagging (Words/Cartoon/Story)."""

from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA_FILE = ROOT / 'data/textbooks/yilin-primary-4a-2024.json'
CMS_DIR = ROOT / 'data/textbooks/yilin-4a-2024-cms'
OUT = CMS_DIR / 'console' / '03-inject-tagged-editor.js'

SECTION_SPECS = [
    ('Lead-in', 'lead-in.txt'),
    ('Words', 'words.txt'),
    ('Cartoon Time', 'cartoon.txt'),
    ('Story Time', 'story.txt'),
]

CHARACTER_NAMES = [
    'Wang Bing',
    'Liu Tao',
    'Liu Jiajia',
    'Zhang Hua',
    'Mr Green',
    'Miss Li',
    'Mike',
    'Su Hai',
    'Su Yang',
    'Yang Ling',
    'Bobby',
    'Sam',
    'Tina',
    'Mum',
    'Dad',
    'Mrs Fox',
    'Mr Wilson',
    'Alarm',
    'Robot',
    'Narrator',
    'Student',
    'Friend',
    'Friends',
    'Students',
]

# Longest names first so "Mr Green" matches before "Mr".
CHARACTER_PATTERN = '|'.join(
    re.escape(name) for name in sorted(CHARACTER_NAMES, key=len, reverse=True)
)
DIALOG_RE = re.compile(rf'^({CHARACTER_PATTERN})\s*:\s*(.+)$', re.I)
WORD_CHAR_RE = re.compile(r"[^A-Za-z0-9'\-\.\s]")


def norm(text: str) -> str:
    return re.sub(r'\s+', ' ', text.strip())


def is_word_type(text: str) -> bool:
    return not WORD_CHAR_RE.search(text)


def read_lines(path: Path) -> list[str]:
    if not path.exists():
        return []
    lines = []
    for raw in path.read_text(encoding='utf-8').splitlines():
        line = norm(raw)
        if line and not line.startswith('#'):
            lines.append(line)
    return lines


def load_translation_tsv(path: Path) -> dict[str, str]:
    if not path.exists():
        return {}
    translations: dict[str, str] = {}
    for raw in path.read_text(encoding='utf-8').splitlines():
        line = raw.strip()
        if not line or line.startswith('#'):
            continue
        parts = line.split('\t')
        if len(parts) < 2:
            continue
        source = norm(parts[0])
        target = norm(parts[1])
        if source and target:
            translations[source] = target
    return translations


def load_extra_translations(unit_num: int) -> dict[str, str]:
    translations = load_translation_tsv(CMS_DIR / 'translations.tsv')
    translations.update(
        load_translation_tsv(
            CMS_DIR / f'unit-{unit_num:02d}' / 'sections' / 'translations.tsv'
        )
    )
    return translations


def parse_dialog_line(line: str) -> dict | None:
    m = DIALOG_RE.match(line)
    if not m:
        return None
    role = next(
        (name for name in CHARACTER_NAMES if name.lower() == m.group(1).lower()),
        m.group(1),
    )
    return {'role': role, 'content': norm(m.group(2))}


def classify_content(line: str, word_set: set[str], section_name: str) -> str:
    t = norm(line)
    if section_name == 'Words':
        return 'word'
    lower_map = {w.lower(): w for w in word_set}
    if t in word_set or t.lower() in lower_map:
        return 'word'
    words = t.split()
    if len(words) > 25:
        return 'para'
    if sum(1 for ch in t if ch in '.?!') >= 2 and len(words) > 12:
        return 'para'
    # Short exclamations in story sections are often narration.
    if section_name == 'Story Time' and len(words) <= 4 and t.endswith('!'):
        return 'asides'
    return 'sent'


def build_section_items(
    lines: list[str],
    section_name: str,
    word_set: set[str],
    translations: dict[str, str],
) -> list[dict]:
    items: list[dict] = []
    dialog_buf: list[dict] = []

    def flush_dialog() -> None:
        if dialog_buf:
            items.append({'type': 'dialog', 'lines': dialog_buf.copy()})
            dialog_buf.clear()

    for line in lines:
        dialog = parse_dialog_line(line)
        if dialog and section_name != 'Words':
            dialog_buf.append(
                {
                    'role': dialog['role'],
                    'content': dialog['content'],
                    'gender': '0',
                    'translation': translations.get(dialog['content'], ''),
                }
            )
            continue

        flush_dialog()
        if section_name == 'Words':
            items.append(
                {
                    'type': 'word' if is_word_type(line) else 'sent',
                    'content': line,
                    'translation': translations.get(line, ''),
                }
            )
        else:
            kind = classify_content(line, word_set, section_name)
            items.append(
                {
                    'type': kind,
                    'content': line,
                    'translation': translations.get(line, ''),
                }
            )

    flush_dialog()
    return items


def load_section_lines(unit_num: int, section_file: str, unit_words: list[dict]) -> list[str]:
    section_path = CMS_DIR / f'unit-{unit_num:02d}' / 'sections' / section_file
    if section_path.exists():
        return read_lines(section_path)
    if section_file == 'words.txt':
        fallback = CMS_DIR / f'unit-{unit_num:02d}' / 'paste-auto.txt'
        lines = read_lines(fallback)
        if lines:
            return lines
        return [w['content'] for w in unit_words]
    return []


def build_unit_payload(unit: dict) -> dict:
    word_set = {w['content'] for w in unit['words']}
    translations = {w['content']: w['translation'] for w in unit['words']}
    # Also map example sentences for story translation hints.
    for w in unit['words']:
        translations.setdefault(w['sentence'], w['sentenceCn'])
    translations.update(load_extra_translations(unit['unit']))

    sections = []
    for section_name, section_file in SECTION_SPECS:
        lines = load_section_lines(unit['unit'], section_file, unit['words'])
        if not lines:
            continue
        items = build_section_items(lines, section_name, word_set, translations)
        if items:
            sections.append({'name': section_name, 'items': items})

    return {
        'title': f"Unit {unit['unit']} {unit['title']}",
        'sections': sections,
    }


def js_str(value) -> str:
    return json.dumps(value, ensure_ascii=False)


INJECT_JS_HEAD = r'''/**
 * 直接批量导入到 Words / Cartoon Time / Story Time 子章节。
 *
 * 1. 粘贴本文件到 CMS 详情页控制台
 * 2. 确保已运行 01-create-units.js 和 04-create-sections.js
 * 3. 执行 importYilinUnit(1) 或 importYilinSection(1, 'Words')
 */
(function () {
  const TYPE_LABELS = {
    word: '单词',
    sent: '句子',
    para: '段落',
    dialog: '对话',
    asides: '旁白',
  };

  const SECTION_ORDER = ['Lead-in', 'Words', 'Cartoon Time', 'Story Time'];
  const UNITS = '''


INJECT_JS_TAIL = r''';

  function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  function normalizeSectionName(name) {
    const n = String(name || '').trim();
    if (/^words?$/i.test(n)) return 'Words';
    if (/^cartoon/i.test(n)) return 'Cartoon Time';
    if (/^story/i.test(n)) return 'Story Time';
    return n;
  }

  function getUnitData(unitNum) {
    const unitData = UNITS[String(unitNum)] || UNITS[unitNum];
    if (!unitData) throw new Error('脚本里没有 Unit ' + unitNum + ' 的数据');
    return unitData;
  }

  function getSectionData(unitData, sectionName) {
    const norm = normalizeSectionName(sectionName);
    let section = (unitData.sections || []).find(s => s.name === norm);
    if (!section) {
      section = (unitData.sections || []).find(s => {
        const a = s.name.toLowerCase();
        const b = norm.toLowerCase();
        return a.indexOf(b) === 0 || b.indexOf(a.split(' ')[0]) === 0;
      });
    }
    if (!section || !section.items.length) {
      throw new Error('Unit 数据里没有「' + sectionName + '」内容');
    }
    return section;
  }

  function getTree() {
    const tree = window.zTreeObj || $.fn.zTree.getZTreeObj('treeDemo');
    if (!tree) throw new Error('请先打开课本详情页');
    return tree;
  }

  function getNodeName(node) {
    return node && (node.name || node.oldName || '');
  }

  function findBookNode(tree) {
    const book = tree.getNodesByFilter(
      n => n.type === 'book' && /四上/.test(getNodeName(n)),
      true
    );
    if (!book) throw new Error('找不到“四上”书本节点');
    return book;
  }

  function findUnitNode(unitNum) {
    const tree = getTree();
    const book = findBookNode(tree);
    const title = getUnitData(unitNum).title;
    const unit = tree.getNodesByFilter(
      n =>
        n.type === 'unit' &&
        n.getParentNode &&
        n.getParentNode() &&
        n.getParentNode().id === book.id &&
        (getNodeName(n) === title || new RegExp('^Unit\\s*' + unitNum + '\\b', 'i').test(getNodeName(n))),
      true
    );
    if (!unit) throw new Error('左侧找不到 ' + title + '，请先运行 01-create-units.js');
    return unit;
  }

  function findSectionNode(unitNode, sectionName) {
    const norm = normalizeSectionName(sectionName);
    const kids = unitNode.children || [];
    const section = kids.find(s => s.type === 'section' && normalizeSectionName(getNodeName(s)) === norm);
    if (!section) {
      throw new Error(getNodeName(unitNode) + ' 下找不到 ' + norm + '，请先运行 04-create-sections.js');
    }
    return section;
  }

  function detectFromTree() {
    const tree = getTree();
    const sel = tree.getSelectedNodes();
    if (!sel.length) throw new Error('请先在左侧点选 Words / Cartoon Time / Story Time');
    const node = sel[0];
    if (node.type === 'section') {
      const unit = node.getParentNode();
      const m = getNodeName(unit).match(/Unit\s*(\d+)/i);
      if (!m) throw new Error('无法识别单元：' + getNodeName(unit));
      return { unitNum: Number(m[1]), sectionName: normalizeSectionName(getNodeName(node)) };
    }
    if (node.type === 'unit') {
      const m = getNodeName(node).match(/Unit\s*(\d+)/i);
      if (!m) throw new Error('请点选子章节，不要只点 Unit');
      return { unitNum: Number(m[1]), sectionName: null };
    }
    throw new Error('请点选 Words / Cartoon Time / Story Time 子章节');
  }

  function toBatchItem(item) {
    if (item.type === 'dialog') {
      return {
        type: 'dialog',
        list: (item.lines || []).map(line => ({
          content: line.content,
          role: line.role,
          gender: line.gender || '0',
          translation: line.translation || '',
        })),
      };
    }
    return {
      type: item.type,
      content: item.content,
      translation: item.translation || '',
    };
  }

  function summarizeItems(items) {
    return items.reduce((acc, item) => {
      const key = item.type === 'dialog'
        ? 'dialog(' + (item.lines || []).length + '行)'
        : item.type;
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
  }

  function postBatch(body) {
    return new Promise(resolve => {
      Ajax.post('resources/batch', body, res => resolve(res), res => resolve(res));
    });
  }

  async function importYilinSection(unitNumArg, sectionNameArg) {
    let unitNum = unitNumArg;
    let sectionName = sectionNameArg ? normalizeSectionName(sectionNameArg) : null;
    if (!unitNum || !sectionName) {
      const detected = detectFromTree();
      unitNum = unitNum || detected.unitNum;
      sectionName = sectionName || detected.sectionName;
    }
    if (!sectionName) {
      throw new Error('请指定子章节，或左侧点选 Words / Cartoon Time / Story Time');
    }

    const unitData = getUnitData(unitNum);
    const sectionData = getSectionData(unitData, sectionName);
    const unitNode = findUnitNode(unitNum);
    const sectionNode = findSectionNode(unitNode, sectionName);
    const list = sectionData.items.map(toBatchItem);

    console.log('[import]', unitData.title, '→', sectionName, sectionData.items.length, '条');
    console.table(summarizeItems(sectionData.items));

    const res = await postBatch({
      unitId: unitNode.id,
      sectionId: sectionNode.id,
      list: JSON.stringify(list),
      returnType: 1,
    });
    if (!res || res.result !== 1) {
      throw new Error('导入失败：' + (res && (res.message || res.info) || '未知错误'));
    }
    console.log('[import] OK', unitData.title, '→', sectionName);
    return { unitNum, sectionName, count: sectionData.items.length, response: res };
  }

  async function importYilinUnit(unitNum) {
    const unitData = getUnitData(unitNum);
    const results = [];
    for (const sectionName of SECTION_ORDER) {
      const section = (unitData.sections || []).find(s => s.name === sectionName);
      if (!section || !section.items.length) {
        console.warn('[import] 跳过空章节', unitData.title, '→', sectionName);
        continue;
      }
      results.push(await importYilinSection(unitNum, sectionName));
      await sleep(300);
    }
    console.log('[import] Unit 完成', unitData.title, results.map(r => r.sectionName).join(', '));
    return results;
  }

  async function importYilinBook() {
    const results = [];
    const nums = Object.keys(UNITS).map(Number).sort((a, b) => a - b);
    for (const unitNum of nums) {
      results.push(await importYilinUnit(unitNum));
      await sleep(500);
    }
    console.log('[import] 全册完成', results.length, '个 Unit');
    return results;
  }

  async function previewYilinSection(unitNum, sectionName) {
    const unitData = getUnitData(unitNum);
    const sectionData = getSectionData(unitData, sectionName);
    const list = sectionData.items.map(toBatchItem);
    console.log('[preview]', unitData.title, '→', sectionName);
    console.table(list);
    return list;
  }

  window.importYilinSection = importYilinSection;
  window.importYilinUnit = importYilinUnit;
  window.importYilinBook = importYilinBook;
  window.previewYilinSection = previewYilinSection;
  window.fill = importYilinSection;
  window.fillYilin = importYilinSection;

  console.log('用法: importYilinBook() / importYilinUnit(1) / importYilinSection(1, "Words")');
})();
'''


def main():
    data = json.loads(DATA_FILE.read_text(encoding='utf-8'))
    units = {}
    for unit in data['units']:
        units[str(unit['unit'])] = build_unit_payload(unit)

    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(
        INJECT_JS_HEAD + js_str(units) + INJECT_JS_TAIL,
        encoding='utf-8',
    )

    for n, payload in units.items():
        print(f"Unit {n}:")
        for sec in payload['sections']:
            kinds = {}
            for item in sec['items']:
                key = item['type']
                if key == 'dialog':
                    key = f"dialog({len(item.get('lines', []))})"
                kinds[key] = kinds.get(key, 0) + 1
            print(f"  {sec['name']}: {len(sec['items'])} items", kinds)

    print(f'wrote {OUT}')


if __name__ == '__main__':
    main()
