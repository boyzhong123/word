#!/usr/bin/env python3
"""Build yilin-3b-2024-cms import package from section txt files and translations.tsv."""

from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CMS_DIR = ROOT / 'data/textbooks/yilin-3b-2024-cms'
OUT_JSON = CMS_DIR / 'book-content-16765054.json'
OUT_JS = CMS_DIR / 'console/99-reset-and-import-book.js'
OUT_MD = CMS_DIR / 'BOOK-CONTENT.md'
SOURCE_PDF = '/Users/zhong/Downloads/16765054.pdf'

SECTION_SPECS = [
    ('Lead-in', 'lead-in.txt'),
    ('Words', 'words.txt'),
    ('Cartoon Time', 'cartoon.txt'),
    ('Story Time', 'story.txt'),
]

UNIT_TITLES = {
    1: 'School things',
    2: 'Clean our classroom',
    3: 'School rules',
    4: 'Have fun after class',
    5: 'Fruit',
    6: 'On the farm',
    7: 'Animals',
    8: 'Colours',
}

CHARACTER_NAMES = [
    'Wang Bing',
    'Liu Tao',
    'Liu Jiajia',
    'Liu Hao',
    'Zhang Hua',
    'Mr Green',
    'Miss Li',
    'Mike',
    'Mike Brown',
    'Su Hai',
    'Su Yang',
    'Yang Ling',
    'Bobby',
    'Sam',
    'Tina',
    'Mum',
    'Dad',
    'Mrs Fox',
    'Grandpa',
    'Grandma',
    'Ruby',
    'Haohao',
    'Max',
    'Beibei',
    'Tad',
    'Seller',
    'Teacher',
    'Girl',
    'Boy',
    'Narrator',
    'Student',
    'Students',
    'Friends',
    'Friend',
    'Parents',
    'Family',
    'Children',
    'Bobby and Sam',
]

CHARACTER_PATTERN = '|'.join(
    re.escape(name) for name in sorted(CHARACTER_NAMES, key=len, reverse=True)
)
DIALOG_RE = re.compile(rf'^({CHARACTER_PATTERN})\s*:\s*(.+)$', re.I)
WORD_CHAR_RE = re.compile(r"[^A-Za-z0-9'\-\.\s]")


def norm(text: str) -> str:
    return re.sub(r'\s+', ' ', text.strip())


def read_lines(path: Path) -> list[str]:
    if not path.exists():
        return []
    lines = []
    for raw in path.read_text(encoding='utf-8').splitlines():
        line = norm(raw)
        if line and not line.startswith('#'):
            lines.append(line)
    return lines


def load_translations() -> tuple[dict[str, str], dict[str, dict[str, str]]]:
    path = CMS_DIR / 'translations.tsv'
    translations: dict[str, str] = {}
    unit_translations: dict[str, dict[str, str]] = {}
    if not path.exists():
        return translations, unit_translations
    for raw in path.read_text(encoding='utf-8').splitlines():
        line = raw.strip()
        if not line or line.startswith('#'):
            continue
        parts = line.split('\t')
        if len(parts) < 2:
            continue
        source = norm(parts[0])
        target = norm(parts[1])
        if not source or not target:
            continue
        unit_match = re.match(r'^(\d+):(.+)$', source)
        if unit_match:
            unit_translations.setdefault(unit_match.group(1), {})[
                norm(unit_match.group(2))
            ] = target
            continue
        translations[source] = target
    return translations, unit_translations


def lookup_translation(
    content: str,
    unit_num: int,
    translations: dict[str, str],
    unit_translations: dict[str, dict[str, str]],
) -> str:
    unit_map = unit_translations.get(str(unit_num), {})
    return unit_map.get(content) or translations.get(content, '')


def parse_dialog_line(line: str) -> dict | None:
    m = DIALOG_RE.match(line)
    if not m:
        return None
    role = next(
        (name for name in CHARACTER_NAMES if name.lower() == m.group(1).lower()),
        m.group(1),
    )
    return {'role': role, 'content': norm(m.group(2))}


def is_word_type(text: str) -> bool:
    return not WORD_CHAR_RE.search(text)


def classify_content(line: str, word_set: set[str], section_name: str) -> str:
    t = norm(line)
    if section_name == 'Words':
        return 'word' if is_word_type(t) else 'sent'
    lower_map = {w.lower(): w for w in word_set}
    if t in word_set or t.lower() in lower_map:
        return 'word'
    words = t.split()
    if len(words) > 25:
        return 'para'
    if sum(1 for ch in t if ch in '.?!') >= 2 and len(words) > 12:
        return 'para'
    if section_name == 'Story Time' and len(words) <= 4 and t.endswith('!'):
        return 'asides'
    return 'sent'


def build_section_items(
    lines: list[str],
    section_name: str,
    word_set: set[str],
    translations: dict[str, str],
    unit_translations: dict[str, dict[str, str]],
    unit_num: int,
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
                    'translation': lookup_translation(
                        dialog['content'], unit_num, translations, unit_translations
                    ),
                }
            )
            continue

        flush_dialog()
        if section_name == 'Words':
            items.append(
                {
                    'type': 'word' if is_word_type(line) else 'sent',
                    'content': line,
                    'translation': lookup_translation(
                        line, unit_num, translations, unit_translations
                    ),
                }
            )
        else:
            kind = classify_content(line, word_set, section_name)
            items.append(
                {
                    'type': kind,
                    'content': line,
                    'translation': lookup_translation(
                        line, unit_num, translations, unit_translations
                    ),
                }
            )

    flush_dialog()
    return items


def build_units(
    translations: dict[str, str], unit_translations: dict[str, dict[str, str]]
) -> dict:
    units: dict = {}
    missing: list[str] = []

    for unit_num in range(1, 9):
        word_lines = read_lines(
            CMS_DIR / f'unit-{unit_num:02d}' / 'sections' / 'words.txt'
        )
        word_set = set(word_lines)
        sections = []
        for section_name, section_file in SECTION_SPECS:
            lines = read_lines(
                CMS_DIR / f'unit-{unit_num:02d}' / 'sections' / section_file
            )
            if not lines:
                continue
            items = build_section_items(
                lines, section_name, word_set, translations, unit_translations, unit_num
            )
            for item in items:
                if item['type'] == 'dialog':
                    for line in item['lines']:
                        if not line['translation']:
                            missing.append(
                                f'U{unit_num} {section_name} dialog: {line["content"]}'
                            )
                elif not item.get('translation'):
                    missing.append(
                        f'U{unit_num} {section_name} {item["type"]}: {item["content"]}'
                    )
            sections.append({'name': section_name, 'items': items})
        units[str(unit_num)] = {
            'title': f'Unit {unit_num} {UNIT_TITLES[unit_num]}',
            'sections': sections,
        }

    if missing:
        print('WARNING: missing translations:')
        for line in missing[:30]:
            print(' ', line)
        if len(missing) > 30:
            print(f'  ... and {len(missing) - 30} more')

    return units


def write_book_content(units: dict) -> None:
    payload = {
        'book': '译林版小学英语三年级下册（2024版）',
        'sourcePdf': SOURCE_PDF,
        'notes': [
            'PDF text extraction plus page-image verification for dialog roles.',
            'English punctuation normalized for Chivox CMS batch import.',
        ],
        'units': units,
    }
    OUT_JSON.write_text(
        json.dumps(payload, ensure_ascii=False, indent=2) + '\n',
        encoding='utf-8',
    )


def write_book_md(units: dict) -> None:
    lines = [
        '# 译林版三年级下册 CMS 导入内容',
        f'来源 PDF: `{SOURCE_PDF}`',
    ]
    for unit_num in range(1, 9):
        unit = units[str(unit_num)]
        lines.append(f'## {unit["title"]}')
        for section in unit['sections']:
            lines.append(f'### {section["name"]}')
            for item in section['items']:
                if item['type'] == 'dialog':
                    title = next(
                        (
                            raw.strip('# ').strip()
                            for raw in read_lines(
                                CMS_DIR
                                / f'unit-{unit_num:02d}'
                                / 'sections'
                                / {
                                    'Cartoon Time': 'cartoon.txt',
                                    'Story Time': 'story.txt',
                                }.get(section['name'], '')
                            )
                            if raw.startswith('#')
                        ),
                        None,
                    )
                    if title:
                        lines.append(f'**{title}**')
                    for line in item['lines']:
                        tr = line.get('translation', '')
                        suffix = f'\t{tr}' if tr else ''
                        lines.append(f'- {line["role"]}: {line["content"]}{suffix}')
                else:
                    tr = item.get('translation', '')
                    suffix = f'\t{tr}' if tr else ''
                    lines.append(f'- {item["content"]}{suffix}')
    OUT_MD.write_text('\n'.join(lines) + '\n', encoding='utf-8')


def write_import_js(units: dict) -> None:
    units_json = json.dumps(units, ensure_ascii=False)
    js = f'''/**
 * 一键重建并导入《译林版三年级下册(2024版)》整本书。
 * 用法：打开 CMS 三下详情页，F12 控制台粘贴本文件全部内容，回车。
 * 会删除“三下”书本下现有 Unit，然后重建 Unit / Lead-in / Words / Cartoon Time / Story Time / 内容。
 */
(async function resetAndImportYilin3bBook() {{
  const SECTION_ORDER = ['Lead-in', 'Words', 'Cartoon Time', 'Story Time'];
  const BOOK_NAME_PATTERN = /三下|三年级下/;
  const UNITS = {units_json};

  function sleep(ms) {{ return new Promise(resolve => setTimeout(resolve, ms)); }}
  function getTree() {{
    const tree = window.zTreeObj || (window.$ && $.fn.zTree && $.fn.zTree.getZTreeObj('treeDemo'));
    if (!tree) throw new Error('请先打开 CMS 课本详情页，并等待左侧目录加载完成');
    return tree;
  }}
  function getNodeName(node) {{ return node && (node.name || node.oldName || ''); }}
  function getCourseId() {{ return Number(window.bookId || new URLSearchParams(location.search).get('courseId')); }}
  function findBookNode(tree) {{
    const book = tree.getNodesByFilter(n => n.type === 'book' && BOOK_NAME_PATTERN.test(getNodeName(n)), true);
    if (!book) throw new Error('找不到“三下/三年级下”书本节点，请先确认左侧目录展开/页面正确');
    return book;
  }}
  function normalizeSectionName(name) {{
    const n = String(name || '').trim();
    if (/^lead/i.test(n)) return 'Lead-in';
    if (/^words?$/i.test(n)) return 'Words';
    if (/^cartoon/i.test(n)) return 'Cartoon Time';
    if (/^story/i.test(n)) return 'Story Time';
    return n;
  }}
  function toBatchItem(item) {{
    if (item.type === 'dialog') {{
      return {{
        type: 'dialog',
        list: (item.lines || []).map(line => ({{
          content: line.content,
          role: line.role,
          gender: line.gender || '0',
          translation: line.translation || '',
        }})),
      }};
    }}
    return {{ type: item.type, content: item.content, translation: item.translation || '' }};
  }}
  function ajaxUnitUpdate(body) {{ return new Promise(resolve => Ajax.unitupdateCourse(body, resolve)); }}
  function ajaxSectionUpdate(body) {{ return new Promise(resolve => Ajax.sectionupdateCourse(body, resolve)); }}
  function ajaxBatch(body) {{ return new Promise(resolve => Ajax.post('resources/batch', body, resolve, resolve)); }}
  function ajaxDeleteUnit(bookId, unitId) {{
    return new Promise(resolve => {{
      Ajax.beforeDelunit({{ unitId }}, data => {{
        if (!data || data.result !== 1) return resolve({{ result: 0, data }});
        Ajax.deleteunit({{ bookId, unitId }}, res => resolve(res || {{ result: 0 }}));
      }});
    }});
  }}
  async function deleteExistingUnits(tree, book) {{
    const units = [...(book.children || [])].filter(n => n.type === 'unit');
    console.log('[1/4] 删除旧 Unit:', units.length, '个');
    for (const unit of units) {{
      const res = await ajaxDeleteUnit(book.id, unit.id);
      if (res.result !== 1) throw new Error('删除失败: ' + getNodeName(unit));
      tree.removeNode(unit);
      console.log('  deleted', getNodeName(unit));
      await sleep(180);
    }}
  }}
  async function createUnits(tree, book, courseId) {{
    console.log('[2/4] 创建 8 个 Unit');
    const created = {{}};
    for (const unitNum of Object.keys(UNITS).map(Number).sort((a, b) => a - b)) {{
      const name = UNITS[String(unitNum)].title;
      const res = await ajaxUnitUpdate({{ courseId, bookId: book.id, bookType: book.book_type, name }});
      if (!res || res.result !== 1) throw new Error('创建 Unit 失败: ' + name);
      const node = res.info.unit;
      node.type = 'unit'; node.isParent = true; node.children = [];
      tree.addNodes(book, node);
      created[String(unitNum)] = node;
      console.log('  created', name, node.id);
      await sleep(180);
    }}
    tree.expandNode(book, true, false, true);
    return created;
  }}
  async function createSections(tree, book, courseId, units) {{
    console.log('[3/4] 创建栏目:', SECTION_ORDER.join(' / '));
    const sectionNodes = {{}};
    for (const unitNum of Object.keys(units).map(Number).sort((a, b) => a - b)) {{
      const unitNode = units[String(unitNum)];
      sectionNodes[String(unitNum)] = {{}};
      for (const name of SECTION_ORDER) {{
        const res = await ajaxSectionUpdate({{ courseId, bookId: book.id, bookType: book.book_type, unitId: unitNode.id, name }});
        if (!res || res.result !== 1) throw new Error('创建栏目失败: ' + getNodeName(unitNode) + ' -> ' + name);
        const section = res.info.section;
        section.type = 'section'; section.isVisiable = 1;
        tree.addNodes(unitNode, section);
        sectionNodes[String(unitNum)][name] = section;
        console.log('  created', getNodeName(unitNode), '->', name);
        await sleep(150);
      }}
    }}
    tree.expandAll(true);
    return sectionNodes;
  }}
  async function importAll(units, sectionNodes) {{
    console.log('[4/4] 导入整本书内容');
    let total = 0;
    for (const unitNum of Object.keys(UNITS).map(Number).sort((a, b) => a - b)) {{
      const unitData = UNITS[String(unitNum)];
      const unitNode = units[String(unitNum)];
      for (const sectionName of SECTION_ORDER) {{
        const sectionData = (unitData.sections || []).find(s => normalizeSectionName(s.name) === sectionName);
        if (!sectionData || !sectionData.items.length) continue;
        const sectionNode = sectionNodes[String(unitNum)][sectionName];
        const list = sectionData.items.map(toBatchItem);
        const res = await ajaxBatch({{ unitId: unitNode.id, sectionId: sectionNode.id, list: JSON.stringify(list), returnType: 1 }});
        if (!res || res.result !== 1) {{
          throw new Error('导入失败: ' + unitData.title + ' -> ' + sectionName + ': ' + (res && (res.message || res.info) || '未知错误'));
        }}
        total += sectionData.items.length;
        console.log('  imported', unitData.title, '->', sectionName, sectionData.items.length, '条');
        await sleep(320);
      }}
    }}
    console.log('✅ 三下全册导入完成，共提交', total, '组内容。请刷新/点左侧章节检查。');
  }}

  const tree = getTree();
  const book = findBookNode(tree);
  const courseId = getCourseId();
  if (!courseId) throw new Error('无法识别 courseId');
  console.log('开始重建导入:', getNodeName(book), 'courseId=', courseId);
  await deleteExistingUnits(tree, book);
  const createdUnits = await createUnits(tree, book, courseId);
  const sectionNodes = await createSections(tree, book, courseId, createdUnits);
  await importAll(createdUnits, sectionNodes);
}})().catch(err => {{
  console.error('❌ 一键导入失败:', err);
  alert('一键导入失败：' + (err && err.message || err));
}});
'''
    OUT_JS.parent.mkdir(parents=True, exist_ok=True)
    OUT_JS.write_text(js, encoding='utf-8')


def main() -> None:
    translations, unit_translations = load_translations()
    units = build_units(translations, unit_translations)
    write_book_content(units)
    write_book_md(units)
    write_import_js(units)
    print(f'Wrote {OUT_JSON}')
    print(f'Wrote {OUT_MD}')
    print(f'Wrote {OUT_JS}')


if __name__ == '__main__':
    main()
