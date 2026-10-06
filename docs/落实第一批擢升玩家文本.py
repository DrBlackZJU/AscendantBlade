"""落实用户确认的 001–034 文本，以及隐身 12/10/8 秒冷却。"""
from pathlib import Path
import json
import subprocess

ROOT = Path(__file__).resolve().parent.parent
DOCS = ROOT / 'docs'
snapshot_path = DOCS / '擢升注册表_玩家文本第一批定稿前_2026-10-02.json'


def runtime_registry():
    code = """
const fs=require('fs'),vm=require('vm'),c=vm.createContext({console});
for(const p of ['systems.js','motion.js','boss.js','enemy_catalog.js','combat.js','ascensions.js'])
  vm.runInContext(fs.readFileSync(p,'utf8'),c,{filename:p});
process.stdout.write(JSON.stringify({source:'ascensions.js final runtime registry',
  base:c.AshAscensions.ASCENSIONS,dual:c.AshAscensions.DUAL_ASCENSIONS},null,2));
"""
    return json.loads(subprocess.check_output(['node', '-e', code], cwd=ROOT).decode('utf-8'))


if (DOCS / '擢升玩家文本第二批定稿_2026-10-02.json').exists():
    raise SystemExit('第二批已定稿；第一批历史脚本禁止重放，以免覆盖后续文本与文档。')

before = runtime_registry()
if not snapshot_path.exists():
    snapshot_path.write_text(json.dumps(before, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
lines = (DOCS / '擢升玩家文本候选_基础_2026-10-02.txt').read_text(encoding='utf-8').splitlines()[:34]
approved = {cells[0]: cells[1:] for cells in (line.split('|') for line in lines)}
assert list(approved) == [c['id'] for c in before['base'][:34]]
assert len(approved) == 34 and all(len(v) == 3 for v in approved.values())
approval = {'date': '2026-10-02', 'status': 'applied', 'baseNumbers': [1, 34],
            'count': 34, 'levelsById': approved, 'shadowCooldownSeconds': [12, 10, 8]}
(DOCS / '擢升玩家文本第一批定稿_2026-10-02.json').write_text(
    json.dumps(approval, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')

game_path = ROOT / 'ascensions.js'
code = game_path.read_text(encoding='utf-8')
for old, new in [('[999,8,6,5][sr]', '[999,12,10,8][sr]'),
                 ("[999,10,8,5][r]||10", "[999,12,10,8][r]||12")]:
    if old in code:
        assert code.count(old) == 1, old
        code = code.replace(old, new)
    else:
        assert new in code, new
marker = '  // Approved player text, batch one (001–034).\n'
export = '  return {ASCENSIONS,DUAL_ASCENSIONS,AscensionEffects};'
if marker in code:
    start = code.index(marker)
    end = code.index(export, start)
    code = code[:start] + code[end:]
block = marker + '  const OCTOBER_PLAYER_TEXT_BATCH_ONE=' + json.dumps(
    approved, ensure_ascii=False, indent=2) + ';\n'
block += '''  for(const card of ASCENSIONS){
    const levels=OCTOBER_PLAYER_TEXT_BATCH_ONE[card.id];
    if(levels){card.levels=[...levels];card.description=card.levels[0];}
  }
'''
assert code.count(export) == 1
game_path.write_text(code.replace(export, block + export), encoding='utf-8')

after = runtime_registry()
for i, card in enumerate(after['base']):
    old = before['base'][i]
    expected = dict(old)
    if card['id'] in approved:
        expected['levels'] = approved[card['id']]
        expected['description'] = approved[card['id']][0]
    assert card == expected, card['id']
assert after['dual'] == before['dual']
(DOCS / '擢升当前注册表_2026-10-02.json').write_text(
    json.dumps(after, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
parts = ['''# 擢升与双重擢升当前游戏文本

本页直接从游戏最终注册表生成。数值与效果以当前实现为准。

已同步五批名称定稿及玩家文本第一批 001–034。隐身基础冷却已调整为 12／10／8 秒，幸运之矛沿用已加强的 25% 基础概率。未确认的玩家文本候选仍留在候选稿中。

## 擢升（142 项）
''']
for card in after['base']:
    parts.append(f"\n### {card['name']}\n\n")
    parts.extend(f'- LV{i}：{t}\n' for i, t in enumerate(card['levels'], 1))
parts.append('\n## 双重擢升（311 项）\n')
for card in after['dual']:
    parts.append(f"\n### {card['name']}\n\n")
    parts.append(f"- 前置：{'、'.join(card['parentNames'])}均达到 LV3\n")
    parts.append(f"- 效果：{card['description']}\n")
    if card.get('detail') and card['detail'] != card['description']:
        parts.append(f"- 补充详情：{card['detail']}\n")
(DOCS / '擢升与双重擢升当前游戏文本.md').write_bytes(''.join(parts).encode('utf-8'))
print('PASS: 34 approved base texts applied; all other cards unchanged; registry/docs synchronized.')
