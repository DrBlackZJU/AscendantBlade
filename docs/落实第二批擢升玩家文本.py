"""落实 035–094、五项汲魂双重修订，并统一首领称谓。"""
from pathlib import Path
import json
import subprocess

ROOT = Path(__file__).resolve().parent.parent
DOCS = ROOT / 'docs'


def runtime_registry():
    code = """
const fs=require('fs'),vm=require('vm'),c=vm.createContext({console});
for(const p of ['systems.js','motion.js','boss.js','enemy_catalog.js','combat.js','ascensions.js'])
  vm.runInContext(fs.readFileSync(p,'utf8'),c,{filename:p});
process.stdout.write(JSON.stringify({source:'ascensions.js final runtime registry',
  base:c.AshAscensions.ASCENSIONS,dual:c.AshAscensions.DUAL_ASCENSIONS},null,2));
"""
    return json.loads(subprocess.check_output(['node', '-e', code], cwd=ROOT).decode('utf-8'))


def boss_copy(text):
    return text.replace('BOSS', '首领').replace('非 首领', '非首领')


before = runtime_registry()
snapshot_path = DOCS / '擢升注册表_玩家文本第二批定稿前_2026-10-02.json'
if not snapshot_path.exists():
    snapshot_path.write_text(json.dumps(before, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
rows = {}
for line in (DOCS / '擢升玩家文本第二批输入_2026-10-02.txt').read_text(encoding='utf-8').splitlines():
    identifier, *levels = line.split('|')
    assert identifier not in rows and len(levels) == 3
    rows[identifier] = levels
assert list(rows) == [c['id'] for c in before['base'][34:94]]
assert len(rows) == 60
dual_rows = {
    'd42': '汲魂伤害 +50%，实际汲取量的 15% 恢复你的生命。',
    'd76': '满蓄后的汲魂范围大幅扩大。满蓄后每秒额外储存 40 重击伤害，即使没有汲取到敌人也能生效。',
    'd147': '蓄力中受击时，立即汲取周围每名敌人 20 生命与 10 架势，将生命汲取量储存为本次重击的额外伤害，最多 +150。',
    'd246': '蓄力达到四分之一、二分之一、四分之三与满蓄时，各额外汲取周围敌人 15 生命，将实际汲取量储存为重击加成。',
    'd226': '进入巅峰时机时，立即汲取周围每名敌人 45 生命。每名实际受伤的敌人使你额外获得 6 受损生命；只要汲魂仍造成伤害，巅峰时机就保持开启。',
}

for label, updates in [('基础', rows), ('双重', dual_rows)]:
    path = DOCS / f'擢升玩家文本候选_{label}_2026-10-02.txt'
    lines = []
    for line in path.read_text(encoding='utf-8').splitlines():
        identifier, *texts = line.split('|')
        if identifier in updates:
            value = updates[identifier]
            texts = value if isinstance(value, list) else [value]
        lines.append('|'.join([identifier, *map(boss_copy, texts)]))
    path.write_text('\n'.join(lines) + '\n', encoding='utf-8')

approval = {'date': '2026-10-02', 'status': 'applied', 'baseNumbers': [35, 94],
            'count': 60, 'levelsById': rows, 'dualDescriptionsById': dual_rows,
            'mechanics': {'paleNailConsecutiveGrowth': .30, 'soulFullPulse': [1, 4, 8],
                         'deepSoulStoragePerSecond': 40, 'quarterSoulPulse': 15,
                         'hitSoulLife': 20, 'hitSoulPosture': 10, 'devourSoulBonus': .50,
                         'peakSoulEntry': 45, 'eliteArmorRend': .50}}
(DOCS / '擢升玩家文本第二批定稿_2026-10-02.json').write_text(
    json.dumps(approval, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')

game_path = ROOT / 'ascensions.js'
code = game_path.read_text(encoding='utf-8')
marker = '  // Approved player text, batch two (035–094), and soul revisions.\n'
end_marker = '  // End approved player text batch two.\n'
export = '  return {ASCENSIONS,DUAL_ASCENSIONS,AscensionEffects};'
if marker in code:
    start = code.index(marker)
    end = code.index(end_marker, start) + len(end_marker)
    code = code[:start] + code[end:]
block = marker + '  const OCTOBER_PLAYER_TEXT_BATCH_TWO=' + json.dumps(rows, ensure_ascii=False, indent=2) + ';\n'
block += '  const OCTOBER_SOUL_DUAL_PLAYER_TEXT=' + json.dumps(dual_rows, ensure_ascii=False, indent=2) + ';\n'
block += '''  for(const card of ASCENSIONS){
    const levels=OCTOBER_PLAYER_TEXT_BATCH_TWO[card.id];
    if(levels){card.levels=[...levels];card.description=card.levels[0];}
  }
  for(const card of DUAL_ASCENSIONS){
    const text=OCTOBER_SOUL_DUAL_PLAYER_TEXT[card.id];
    if(text)card.description=card.detail=text;
  }
  const playerBossCopy=text=>text.replaceAll('BOSS','首领').replaceAll('非 首领','非首领');
  for(const card of [...ASCENSIONS,...DUAL_ASCENSIONS]){
    if(card.levels)card.levels=card.levels.map(playerBossCopy);
    for(const key of ['name','subtitle','description','detail'])
      if(typeof card[key]==='string')card[key]=playerBossCopy(card[key]);
  }
'''
assert code.count(export) == 1
game_path.write_text(code.replace(export, block + end_marker + export), encoding='utf-8')
after = runtime_registry()
for kind in ('base', 'dual'):
    for i, card in enumerate(after[kind]):
        expected = dict(before[kind][i])
        if kind == 'base' and card['id'] in rows:
            expected.update(levels=rows[card['id']], description=rows[card['id']][0])
        if kind == 'dual' and card['id'] in dual_rows:
            expected.update(description=dual_rows[card['id']], detail=dual_rows[card['id']])
        if 'levels' in expected:
            expected['levels'] = list(map(boss_copy, expected['levels']))
        for key in ('name', 'subtitle', 'description', 'detail'):
            if isinstance(expected.get(key), str):
                expected[key] = boss_copy(expected[key])
        assert card == expected, card['id']

all_approved = {c['id']: c['levels'] for c in after['base'][:94]}
(DOCS / '擢升玩家文本已定稿_2026-10-02.json').write_text(json.dumps({
    'date': '2026-10-02', 'status': 'partially_applied', 'levelsById': all_approved,
    'dualDescriptionsById': dual_rows, 'baseCount': 94, 'dualCount': 5,
}, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
(DOCS / '擢升当前注册表_2026-10-02.json').write_text(
    json.dumps(after, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
parts = ['''# 擢升与双重擢升当前游戏文本

本页直接从游戏最终注册表生成。已同步 001–094 玩家文本、五项汲魂双重修订，玩家称谓统一为“首领”。后续未确认候选仍留在候选稿中。

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
print('PASS: 60 base texts, 5 soul dual texts; all other copy changes limited to the boss term.')
