#!/usr/bin/env python3
"""Build Chivox CMS batch-import zip from yilin-primary-4a-2024.json."""

import json
import zipfile
from pathlib import Path

import xlwt

ROOT = Path(__file__).resolve().parents[1]
DATA_FILE = ROOT / 'data/textbooks/yilin-primary-4a-2024.json'
OUT_DIR = ROOT / 'data/textbooks/chivox-import-yilin-4a-2024'
XLS = OUT_DIR / 'data.xls'
ZIP = ROOT / 'data/textbooks/chivox-import-yilin-4a-2024.zip'
BOOK_NAME = '牛津译林四上(24版)'

HEADERS = [
    '单元序号和名称*', '子单元*', '类型*', '角色*', '性别', '内容*',
    '音标', '词性', '释义', '音频文件名', '图片文件名', '释义音频文件名',
]


def main():
    data = json.loads(DATA_FILE.read_text(encoding='utf-8'))
    OUT_DIR.mkdir(parents=True, exist_ok=True)

    wb = xlwt.Workbook()
    sh = wb.add_sheet('sheet1')
    sh.write(0, 0, '书本名称*')
    sh.write(0, 1, BOOK_NAME)
    for col, header in enumerate(HEADERS):
        sh.write(1, col, header)

    row = 2
    for unit in data['units']:
        sh.write(row, 0, f"Unit {unit['unit']} {unit['title']}")
        row += 1
        sh.write(row, 1, '词汇')
        row += 1
        sh.write(row, 2, '单词')
        row += 1
        for word in unit['words']:
            sh.write(row, 5, word['content'])
            sh.write(row, 8, word['translation'])
            row += 1
            sh.write(row, 5, word['sentence'])
            sh.write(row, 8, word['sentenceCn'])
            row += 1
        row += 1

    wb.save(str(XLS))
    with zipfile.ZipFile(ZIP, 'w', zipfile.ZIP_DEFLATED) as zf:
        zf.write(XLS, 'data.xls')

    print(f'book: {BOOK_NAME}')
    print(f'units: {len(data["units"])}, words: {data["meta"]["wordCount"]}, rows: {row}')
    print(f'xls: {XLS}')
    print(f'zip: {ZIP} ({ZIP.stat().st_size} bytes)')


if __name__ == '__main__':
    main()
