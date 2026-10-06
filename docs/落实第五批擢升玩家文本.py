"""同步双重027–047玩家文本，并恢复已采用条目的连续审阅编号。"""
from pathlib import Path
import json
import subprocess

ROOT = Path(__file__).resolve().parent.parent
DOCS = ROOT / 'docs'
DATE = '2026-10-03'


def save_json(path, value):
    path.write_bytes((json.dumps(value, ensure_ascii=False, indent=2) + '\n').encode('utf-8'))


def runtime_registry():
    code = """
const fs=require('fs'),vm=require('vm'),c=vm.createContext({console});
for(const p of ['systems.js','motion.js','boss.js','enemy_catalog.js','combat.js','ascensions.js'])
  vm.runInContext(fs.readFileSync(p,'utf8'),c,{filename:p});
process.stdout.write(JSON.stringify({source:'ascensions.js final runtime registry',
  base:c.AshAscensions.ASCENSIONS,dual:c.AshAscensions.DUAL_ASCENSIONS}));
"""
    return json.loads(subprocess.check_output(['node', '-e', code], cwd=ROOT).decode('utf-8'))


def read_rows(filename):
    result = {}
    for line in (DOCS / filename).read_text(encoding='utf-8').splitlines():
        identifier, *values = line.split('|')
        assert identifier not in result
        result[identifier] = values
    return result


before = runtime_registry()
snapshot_path = DOCS / f'擢升注册表_玩家文本第五批定稿前_{DATE}.json'
if not snapshot_path.exists():
    original = json.loads(json.dumps(before))
    next(c for c in original['dual'] if c['id'] == 'd33')['name'] = '收放自如'
    next(c for c in original['dual'] if c['id'] == 'd43')['name'] = '生死逆转'
    save_json(snapshot_path, original)
candidate = read_rows('擢升玩家文本候选_双重_2026-10-02.txt')
rows = {c['id']: candidate[c['id']][0] for c in before['dual'][26:47]}
assert list(rows) == [f'd{n:02d}' for n in range(27, 48)]
rows['d27'] = '无情的低生命阈值提高至50%。对低生命敌人的暴击倍率额外+0.3。'
rows['d29'] = '每次处决首领，额外恢复20%最大生命值。'
rows['d30'] = '处决额外恢复至少10生命，行刑层数越高，治疗越多。同时引发血爆，对周围敌人造成40伤害与25架势伤害。'
rows['d31'] = '治疗精灵每14秒投放一次补给，低生命时更容易投放食物。'
rows['d33'] = '总是保持至少15战意，躁动的极低战意加成阈值提升至30战意。'
rows['d35'] = '满蓄至蓄势伤害上限的所需时间缩短至1秒。'
rows['d38'] = '旋风斩的追加环斩化为2—4道火弧，范围扩大、伤害提高。命中点燃敌人，火焰向周围扩散。'
rows['d39'] = '满蓄旋风斩最多连续环斩8次。'
rows['d43'] = '获得本双重擢升时，额外获得一次擢升机会，且这次擢升优先获得双重擢升。'
rows['d44'] = '震踏对生命低于60%的敌人伤害+80%，并击飞这些敌人。踏碎生命值低于15%的敌人。'
rows['d45'] = '进行岩石突刺后，立刻返还冲刺60%的冷却时间。'
rows['d46'] = '暴击率+12%，剑气变窄，但可以暴击。'
rows['d47'] = '完美格挡额外获得最多6受损生命，并追加反震，造成50伤害与50架势伤害。'
assert len(rows) == 21 and all(text.endswith('。') for text in rows.values())
game_path = ROOT / 'ascensions.js'
code = game_path.read_text(encoding='utf-8')
marker = '  // Approved player text, batch five (duals 027–047).\n'
end_marker = '  // End approved player text batch five.\n'
if marker in code:
    start = code.index(marker)
    end = code.index(end_marker, start) + len(end_marker)
    code = code[:start] + code[end:]
export = '  return {ASCENSIONS,DUAL_ASCENSIONS,AscensionEffects};'
assert code.count(export) == 1
block = marker + '  const OCTOBER_DUAL_PLAYER_TEXT_BATCH_FIVE=' + json.dumps(rows, ensure_ascii=False, indent=2) + ';\n'
block += '''  for(const card of DUAL_ASCENSIONS){
    const text=OCTOBER_DUAL_PLAYER_TEXT_BATCH_FIVE[card.id];
    if(text)card.description=card.detail=text;
  }
'''
game_path.write_bytes(code.replace(export, block + end_marker + export).encode('utf-8'))
after = runtime_registry()
for kind in ('base', 'dual'):
    for old, card in zip(before[kind], after[kind]):
        expected = dict(old)
        if kind == 'dual' and card['id'] in rows:
            expected.update(description=rows[card['id']], detail=rows[card['id']])
        assert card == expected, card['id']
assert next(c for c in after['dual'] if c['id'] == 'd33')['name'] == '不竭战意'
assert next(c for c in after['dual'] if c['id'] == 'd43')['name'] == '长子名分'
approval_path = DOCS / '擢升玩家文本已定稿_2026-10-02.json'
approval = json.loads(approval_path.read_text(encoding='utf-8'))
approval['dualDescriptionsById'].update(rows)
approval.setdefault('namesById', {})['d33'] = '不竭战意'
approval['namesById']['d43'] = '长子名分'
approval.update(lastUpdated=DATE, baseCount=142, dualCount=51)
for c in after['base']:
    assert c['levels'] == approval['levelsById'][c['id']], c['id']
for c in after['dual']:
    if c['id'] in approval['dualDescriptionsById']:
        assert c['description'] == approval['dualDescriptionsById'][c['id']] == c['detail'], c['id']
save_json(approval_path, approval)
save_json(DOCS / '擢升当前注册表_2026-10-02.json', after)
for filename in ('擢升玩家文本候选_双重_2026-10-02.txt', '擢升玩家文本后续润色_双重_2026-10-02.txt'):
    lines = []
    for identifier, values in read_rows(filename).items():
        text = approval['dualDescriptionsById'].get(identifier, values[0])
        lines.append(f'{identifier}|{text}')
    (DOCS / filename).write_bytes(('\n'.join(lines) + '\n').encode('utf-8'))
batch = {
    'date': DATE, 'status': 'applied', 'dualNumbers': [27, 47], 'dualCount': 21, 'newDualCount': 20,
    'dualDescriptionsById': rows, 'namesById': {'d33': '不竭战意', 'd43': '长子名分'},
    'mechanics': {'lowHealthCriticalMultiplierBonus': .3, 'bossExecutionBonusHeal': .20,
                 'momentumFloor': 15, 'maniacExtremeMomentumThreshold': 30,
                 'oldD33MomentumGainRemoved': True, 'firstbornGuaranteedCredit': 1,
                 'firstbornPrioritizesDuals': True, 'innerDevourParryDamage': 50,
                 'innerDevourParryPosture': 50, 'rockThrustImmediateCooldownRefund': .60},
    'alreadyApprovedRestoredToReview': ['d42', 'd76', 'd147', 'd226', 'd246'],
}
save_json(DOCS / f'擢升玩家文本第五批定稿_{DATE}.json', batch)
parts = [f'# 双重擢升玩家文本第五批定稿 · {DATE}\n\n027–047已写入游戏，其中042此前已采用，本批新增定稿20项。033重命名为「不竭战意」，043重命名为「长子名分」，两项效果已重做。累计51项双重已定稿，剩余260项待审。\n']
for number, card in enumerate(after['dual'], 1):
    if 27 <= number <= 47:
        parts.append(f"\n### {number:03d} · {card['name']}\n\n前置：{'＋'.join(card['parentNames'])}\n\n{card['description']}\n")
(DOCS / f'擢升玩家文本第五批定稿_{DATE}.md').write_bytes(''.join(parts).encode('utf-8'))
parts = ['# 擢升与双重擢升当前游戏文本\n\n142项普通擢升与51项双重玩家文本已定稿；其余260项双重仍待确认。\n\n## 擢升（142项）\n']
for card in after['base']:
    parts.append(f"\n### {card['name']}\n\n")
    parts.extend(f'- LV{level}：{text}\n' for level, text in enumerate(card['levels'], 1))
parts.append('\n## 双重擢升（311项）\n')
for card in after['dual']:
    parts.append(f"\n### {card['name']}\n\n- 前置：{'、'.join(card['parentNames'])}均达到 LV3\n- 效果：{card['description']}\n")
    if card.get('detail') and card['detail'] != card['description']:
        parts.append(f"- 补充详情：{card['detail']}\n")
(DOCS / '擢升与双重擢升当前游戏文本.md').write_bytes(''.join(parts).encode('utf-8'))
subprocess.run(['python', str(DOCS / '生成擢升玩家文本候选.py')], cwd=ROOT, check=True)
proposal_path = DOCS / '擢升与双重擢升_玩家文本候选_2026-10-02.json'
proposal = json.loads(proposal_path.read_text(encoding='utf-8'))
proposal.update(lastUpdated=DATE, latestApproval=batch)
save_json(proposal_path, proposal)
parts = [f'''# 后续擢升与双重擢升：玩家文本候选 · {DATE}

本稿保留095–142共48项已采用普通擢升，并完整列出311项双重擢升，编号不再跳过已定稿条目。**双重51项已采用，其余260项仍为候选。**

LV2、LV3沿用低等级仍有效的效果，主要写本级提升。已采用条目标注状态，其他条目仍待审阅。

## 普通擢升（48项，全部已采用）
''']
for number, card in enumerate(after['base'], 1):
    if number < 95:
        continue
    parts.append(f"\n### {number:03d} · {card['name']}（已采用）\n\n")
    parts.extend(f'- LV{level}：{text}\n' for level, text in enumerate(card['levels'], 1))
parts.append('\n---\n\n## 双重擢升（311项）\n')
for number, card in enumerate(proposal['dual'], 1):
    state = '（已采用）' if card['status'] == 'applied' else ''
    parts.append(f"\n### {number:03d} · {card['name']}{state}\n\n前置：{'＋'.join(card['parentNames'])}\n\n{card['description']}\n")
parts.append('\n---\n\n编辑核对信息另见 [代码核对记录](擢升玩家文本后续润色_代码核对记录_2026-10-03.md)。\n')
(DOCS / f'后续擢升与双重擢升_玩家文本候选_{DATE}.md').write_bytes(''.join(parts).encode('utf-8'))
print('PASS: duals 027–047 adopted (20 newly approved); 033/043 renamed; 142 base / 51 dual approved, 260 dual pending.')
print('PASS: all 311 dual entries restored to review in order, including already-approved 042.')
