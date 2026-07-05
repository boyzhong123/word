#!/usr/bin/env python3
"""Export Yilin 4A manual CMS entry files (textbook word-list order)."""

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA_FILE = ROOT / 'data/textbooks/yilin-primary-4a-2024.json'
OUT_DIR = ROOT / 'data/textbooks/yilin-4a-2024-cms'

# CMS「单词」仅允许字母、数字、空格、' - .
WORD_CHAR_RE = re.compile(r"[^A-Za-z0-9'\-\.\s]")


def is_word_type(text: str) -> bool:
    return not WORD_CHAR_RE.search(text)


def build_unit_blocks(words):
    """Return (words_block, sentences_block) preserving textbook order."""
    words_block = []
    sentences_block = []
    rows = []

    for i, w in enumerate(words, 1):
        core = '' if w.get('core') else ' *'
        if is_word_type(w['content']):
            kind = '单词'
            words_block.append(w['content'])
        else:
            kind = '句子(短语)'
            sentences_block.append(w['content'])

        sentences_block.append(w['sentence'])

        rows.append({
            'no': i,
            'kind': kind,
            'content': w['content'],
            'translation': w['translation'],
            'sentence': w['sentence'],
            'sentence_cn': w['sentenceCn'],
            'core': core,
        })

    return words_block, sentences_block, rows


def main():
    data = json.loads(DATA_FILE.read_text(encoding='utf-8'))
    OUT_DIR.mkdir(parents=True, exist_ok=True)

    all_manual = [
        '# 牛津译林四上(24版) — 手动录入（课本 Word list 顺序）',
        '',
        '入口：https://resm.chivoxapp.com/detail.html?courseId=637',
        '',
        '## 怎么录',
        '',
        '1. 左侧点进 **Unit X**（不要建子单元）',
        '2. 右侧 **文本录入** → 粘贴 `paste-words.txt` → 全选 → **+单词** → 保存',
        '3. 再开 **文本录入** → 粘贴 `paste-sentences.txt` → 全选 → **+句子** → 保存',
        '4. ⚠️ 不要点「自动识别」；不要粘贴 `#` 行',
        '',
        '带 `*` = 课本拓展词（Word list 星号词）',
        '',
        '---',
        '',
    ]

    for unit in data['units']:
        n = unit['unit']
        title = unit['title']
        unit_dir = OUT_DIR / f'unit-{n:02d}'
        unit_dir.mkdir(exist_ok=True)

        words_block, sentences_block, rows = build_unit_blocks(unit['words'])

        (unit_dir / 'paste-auto.txt').write_text(
            '\n'.join(w['content'] for w in unit['words']) + '\n', encoding='utf-8'
        )

        (unit_dir / 'paste-words.txt').write_text(
            '\n'.join(words_block) + '\n', encoding='utf-8'
        )
        (unit_dir / 'paste-sentences.txt').write_text(
            '\n'.join(sentences_block) + '\n', encoding='utf-8'
        )

        # 组件录入 / 对照表
        tsv = ['序号\t类型\t英文\t中文释义\t例句英文\t例句中文\t拓展']
        sheet = []
        for r in rows:
            tsv.append(
                f"{r['no']}\t{r['kind']}\t{r['content']}\t{r['translation']}"
                f"\t{r['sentence']}\t{r['sentence_cn']}\t{'*' if r['core'] else ''}"
            )
            sheet.append(
                f"{r['no']:2}. [{r['kind']}] {r['content']}{r['core']}\n"
                f"    释义：{r['translation']}\n"
                f"    例句：{r['sentence']}\n"
                f"    例句中：{r['sentence_cn']}"
            )

        (unit_dir / 'sheet.tsv').write_text('\n'.join(tsv) + '\n', encoding='utf-8')
        (unit_dir / 'sheet.txt').write_text('\n\n'.join(sheet) + '\n', encoding='utf-8')

        unit_header = f'## Unit {n} {title}（{len(rows)} 词，课本顺序）\n'
        all_manual.append(unit_header)
        all_manual.append(f'- 单词 {len(words_block)} 条 → `unit-{n:02d}/paste-words.txt`')
        all_manual.append(
            f'- 句子 {len(sentences_block)} 条 → `unit-{n:02d}/paste-sentences.txt`'
            '（含 ?! 短语 + 例句，顺序与课本一致）'
        )
        all_manual.append(f'- 中英对照 → `unit-{n:02d}/sheet.txt`')
        all_manual.append('')
        all_manual.append('| 序 | 类型 | 英文 | 中文 |')
        all_manual.append('|----|------|------|------|')
        for r in rows:
            en = r['content'].replace('|', '\\|')
            cn = r['translation'].replace('|', '\\|')
            all_manual.append(f"| {r['no']} | {r['kind']} | {en}{r['core']} | {cn} |")
        all_manual.append('')
        all_manual.append('**+单词 粘贴：**')
        all_manual.append('```')
        all_manual.extend(words_block)
        all_manual.append('```')
        all_manual.append('')
        all_manual.append('**+句子 粘贴：**')
        all_manual.append('```')
        all_manual.extend(sentences_block)
        all_manual.append('```')
        all_manual.append('')
        all_manual.append('---')
        all_manual.append('')

    (OUT_DIR / 'MANUAL-ALL.md').write_text('\n'.join(all_manual), encoding='utf-8')

    readme = f'''# 牛津译林四上(24版) — 手动录入

课本 Word list 顺序（PDF p78–82），每单元：

| 文件 | 用途 |
|------|------|
| `paste-auto.txt` | **自动识别**用：课本词表顺序，一行一条 |
| `paste-sentences.txt` | 文本录入 → 全选 → **+句子** → 保存 |
| `sheet.txt` | 录入时看中英文释义 |
| `sheet.tsv` | Excel 打开对照 |

**全册合集**：`MANUAL-ALL.md`（8 个单元内容都在里面）

## 录入步骤

1. 点左侧 **Unit X**（仅单元层，无子单元）
2. **文本录入** → 粘贴 `paste-words.txt` → **+单词** → 保存
3. **文本录入** → 粘贴 `paste-sentences.txt` → **+句子** → 保存

句子文件顺序：每个课本词条先录短语（含 `?` `!` 的），再录对应例句。

共 **{data["meta"]["wordCount"]}** 词条 / 8 单元。
'''
    (OUT_DIR / 'README.md').write_text(readme, encoding='utf-8')

    print(f'units: {len(data["units"])}, words: {data["meta"]["wordCount"]}')
    print(f'out: {OUT_DIR}')
    print(f'  MANUAL-ALL.md')


if __name__ == '__main__':
    main()
