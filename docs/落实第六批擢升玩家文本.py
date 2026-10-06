"""同步已确认的双重048–070，保留尚未确认的候选。"""
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
    return dict(line.split('|', 1) for line in (DOCS / filename).read_text(encoding='utf-8').splitlines())


before = runtime_registry()
snapshot = DOCS / f'擢升注册表_玩家文本第六批定稿前_{DATE}.json'
if not snapshot.exists():
    save_json(snapshot, before)
candidate = read_rows('擢升玩家文本候选_双重_2026-10-02.txt')
rows = {card['id']: candidate[card['id']] for card in before['dual'][47:70]}
rows.update({
    'd48': '骷髅寿命+25%。普通骷髅死亡或消失时，恢复3生命与8生命损伤；精英骷髅战士提高至5生命与12生命损伤。',
    'd50': '每次升级永久提高0.01暴击倍率，最多累积+0.5。',
    'd51': '来自幸运和厄运的惩戒将更加混沌……',
    'd52': '幻象侵袭普通敌人时，有15%概率使其转为心灵控制9秒。',
    'd53': '突刺命中正在攻击的敌人，或高速突刺命中时，额外造成40生命伤害与80架势伤害。',
    'd55': '攻击附带的最大生命值百分比伤害也能享受暴击加成。',
    'd57': '隐身中处决保留隐身，并将剩余隐身时间刷新至4秒。',
    'd58': '处决灵魂链接目标时，将其他灵魂链接的目标一并处决。',
    'd60': '冲刺闪过攻击时，每闪过一次攻击恢复5点闪避疲劳。',
    'd67': '行刑的恐惧效果有20%概率变为永久恐惧。',
    'd68': '敌人架势破坏时，引爆其周围所有敌人积累的暗伤，引爆效果+10%。',
    'd70': '守护剑灵的完美格挡也能叠加共振，并享受共振加成。',
})
names = {'d60': '擦身而过', 'd67': '摧残'}
assert list(rows) == [f'd{n:02d}' for n in range(48, 71)]
assert all(text.endswith(('。', '……')) for text in rows.values())
game_path = ROOT / 'ascensions.js'
code = game_path.read_text(encoding='utf-8')
marker = '  // Approved player text, batch six (duals 048–070).\n'
end_marker = '  // End approved player text batch six.\n'
if marker in code:
    start = code.index(marker)
    end = code.index(end_marker, start) + len(end_marker)
    code = code[:start] + code[end:]
export = '  return {ASCENSIONS,DUAL_ASCENSIONS,AscensionEffects};'
assert code.count(export) == 1
block = marker + '  const OCTOBER_DUAL_PLAYER_TEXT_BATCH_SIX=' + json.dumps(rows, ensure_ascii=False, indent=2) + ';\n'
block += '''  for(const card of DUAL_ASCENSIONS){
    const text=OCTOBER_DUAL_PLAYER_TEXT_BATCH_SIX[card.id];
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
approval_path = DOCS / '擢升玩家文本已定稿_2026-10-02.json'
approval = json.loads(approval_path.read_text(encoding='utf-8'))
approval['dualDescriptionsById'].update(rows)
approval.setdefault('namesById', {}).update(names)
dual_count = len(approval['dualDescriptionsById'])
pending_count = len(after['dual']) - dual_count
approval.update(lastUpdated=DATE, baseCount=142, dualCount=dual_count)
assert dual_count == 74
for card in after['base']:
    assert card['levels'] == approval['levelsById'][card['id']], card['id']
for card in after['dual']:
    if card['id'] in approval['dualDescriptionsById']:
        assert card['description'] == approval['dualDescriptionsById'][card['id']] == card['detail'], card['id']
    if card['id'] in approval['namesById']:
        assert card['name'] == approval['namesById'][card['id']], card['id']
save_json(approval_path, approval)
save_json(DOCS / '擢升当前注册表_2026-10-02.json', after)
for filename in ('擢升玩家文本候选_双重_2026-10-02.txt', '擢升玩家文本后续润色_双重_2026-10-02.txt'):
    lines = [f'{identifier}|{approval["dualDescriptionsById"].get(identifier, text)}' for identifier, text in read_rows(filename).items()]
    (DOCS / filename).write_bytes(('\n'.join(lines) + '\n').encode('utf-8'))
batch = {
    'date': DATE, 'status': 'applied', 'dualNumbers': [48, 70], 'dualCount': 23,
    'dualDescriptionsById': rows, 'namesById': names,
    'mechanics': {'criticalGrowthPerLevel': .01, 'criticalGrowthCap': .5,
                 'bullThrustAdditionalDamage': 40, 'bullThrustAdditionalPosture': 80,
                 'linkedExecutionsRequirePostureBreak': False, 'linkedExecutionBossesExcluded': True,
                 'dashMissFatigueRecovery': 5, 'executionerPermanentFearChance': .20,
                 'woundDetonationTrigger': 'postureBreak', 'woundDetonationFraction': 1,
                 'woundDetonationMultiplier': 1.10, 'spiritExtraResonanceStacks': 0,
                 'stealthBossExecutionBonusPreserved': .35, 'executionAnimationHitDispatchedOnce': True,
                 'permanentFearRetainsExecutionerDamageBonus': True},
}
save_json(DOCS / f'擢升玩家文本第六批定稿_{DATE}.json', batch)
parts = [f'# 双重擢升玩家文本第六批定稿 · {DATE}\n\n048–070共23项已写入游戏。060重命名为「擦身而过」，067重命名为「摧残」。「一次清算」按最后确认的架势破坏触发、全量暗伤引爆与+10%引爆效果落实。累计{dual_count}项双重已采用，剩余{pending_count}项待审。\n']
for number, card in enumerate(after['dual'], 1):
    if 48 <= number <= 70:
        parts.append(f"\n### {number:03d} · {card['name']}\n\n前置：{'＋'.join(card['parentNames'])}\n\n{card['description']}\n")
(DOCS / f'擢升玩家文本第六批定稿_{DATE}.md').write_bytes(''.join(parts).encode('utf-8'))
parts = [f'# 擢升与双重擢升当前游戏文本\n\n142项普通擢升与{dual_count}项双重玩家文本已定稿；其余{pending_count}项双重仍待确认。\n\n## 擢升（142项）\n']
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

本稿保留095–142共48项已采用普通擢升，并完整列出311项双重擢升。**双重{dual_count}项已采用，其余{pending_count}项仍为候选。**

LV2、LV3沿用低等级仍有效的效果，主要写本级提升。已采用条目标注状态，其他条目仍待审阅。

## 普通擢升（48项，全部已采用）
''']
for number, card in enumerate(after['base'], 1):
    if number >= 95:
        parts.append(f"\n### {number:03d} · {card['name']}（已采用）\n\n")
        parts.extend(f'- LV{level}：{text}\n' for level, text in enumerate(card['levels'], 1))
parts.append('\n---\n\n## 双重擢升（311项）\n')
for number, card in enumerate(proposal['dual'], 1):
    state = '（已采用）' if card['status'] == 'applied' else ''
    parts.append(f"\n### {number:03d} · {card['name']}{state}\n\n前置：{'＋'.join(card['parentNames'])}\n\n{card['description']}\n")
parts.append('\n---\n\n编辑核对信息另见 [代码核对记录](擢升玩家文本后续润色_代码核对记录_2026-10-03.md)。\n')
(DOCS / f'后续擢升与双重擢升_玩家文本候选_{DATE}.md').write_bytes(''.join(parts).encode('utf-8'))
print(f'PASS: duals 048–070 adopted; 142 base / {dual_count} dual approved, {pending_count} dual pending.')
