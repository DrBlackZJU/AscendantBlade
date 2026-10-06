"""落实用户确认的095–142（122待审），以及四项明确要求的玩法调整。"""
from pathlib import Path
import json
import re
import subprocess

ROOT = Path(__file__).resolve().parent.parent
DOCS = ROOT / 'docs'
DATE = '2026-10-03'


def save_json(path, value):
    path.write_bytes((json.dumps(value, ensure_ascii=False, indent=2) + '\n').encode('utf-8'))


def runtime_registry():
    script = """
const fs=require('fs'),vm=require('vm'),c=vm.createContext({console});
for(const p of ['systems.js','motion.js','boss.js','enemy_catalog.js','combat.js','ascensions.js'])
  vm.runInContext(fs.readFileSync(p,'utf8'),c,{filename:p});
process.stdout.write(JSON.stringify({source:'ascensions.js final runtime registry',
  base:c.AshAscensions.ASCENSIONS,dual:c.AshAscensions.DUAL_ASCENSIONS}));
"""
    return json.loads(subprocess.check_output(['node', '-e', script], cwd=ROOT).decode('utf-8'))


before = runtime_registry()
snapshot = DOCS / f'擢升注册表_玩家文本第三批定稿前_{DATE}.json'
if not snapshot.exists():
    save_json(snapshot, before)
rows = {}
for line in (DOCS / '擢升玩家文本后续润色_基础_2026-10-02.txt').read_text(encoding='utf-8').splitlines():
    identifier, *levels = line.split('|')
    assert identifier not in rows and len(levels) == 3
    rows[identifier] = levels
assert list(rows) == [card['id'] for card in before['base'][94:]]


def edit(identifier, level, old, new):
    text = rows[identifier][level - 1]
    if new and new in text:
        return
    if old in text:
        assert text.count(old) == 1, (identifier, old)
        rows[identifier][level - 1] = text.replace(old, new)
    else:
        assert new in text, (identifier, old)


edit('corpseBomb', 3, '并随机施加燃烧、流血、中毒或冻伤', '并施加随机持续伤害效果')
edit('guillotine', 3, '斩杀命中后生命低于15%的敌人，首领阈值为5%。', '斩杀生命低于15%的敌人。')
edit('thousandFire', 1, '3秒未命中则失去积累。', '3秒未命中则失去积累的热力。')
rows['windBlade'][0] = '移动、冲刺与闪避积累风势，移动速度越高，积累风势越快。下一次攻击消耗风势，最高提供额外+24%伤害，54架势伤害与+30%攻击范围。'
rows['delayedWound'] = [
    '攻击留下本次伤害13%的暗伤。敌人架势破坏、被完美格挡或被击飞时，暗伤一并爆发。',
    '攻击速度+7%。每次攻击留下本次伤害17%的暗伤。',
    '攻击速度+13%。每次攻击留下本次伤害21%的暗伤；第四击额外积累47点暗伤。',
]
rows['defenseSwordSpirit'] = [
    '召唤守护剑灵，每12秒可自动格挡一次攻击或投射物。',
    '自动格挡冷却缩短至10秒。',
    '自动格挡冷却缩短至9秒，并升级为完美格挡。',
]
rows['bloodTide'] = [
    '从场上流血的敌人汲取生命。攻击有10%概率使敌人轻微流血9秒。',
    '流血治疗增强，攻击施加流血的概率提高至15%，流血每秒造成7伤害。',
    '流血治疗进一步增强，流血总伤害越高，额外治疗越多。攻击施加流血的概率提高至20%，流血每秒造成15伤害。',
]
rows['whirlwind'][1] = '重击追加一次环斩，造成20%的伤害。'
edit('eagleDrop', 3, '斩杀命中后生命不高于20%的敌人。', '斩杀生命不高于20%的敌人。')
rows['sawStorm'] = [
    '每8秒向周围发射18枚锯片，每枚造成18伤害与10架势伤害。',
    '发射间隔缩短至7秒，锯片增加至24枚，伤害提升，可穿透2名敌人并使其流血4秒。',
    '发射间隔缩短至6秒，锯片增加至32枚，锯片与流血伤害进一步提升，击杀使下次发射加快0.5秒。',
]
rows['lullaby'][0] = '每12秒使最多2名敌人睡眠3秒，并削减24架势。受到大于最大生命值30%的伤害时醒来。'
edit('synergy', 1, '攻击速度+8%', '自身攻击速度+8%')
rows['ghostHand'][0] = '鬼手每4.5秒随机骚扰敌人，造成15伤害与15架势伤害和短暂减速效果。鬼手会压制架势破坏的目标，阻止其恢复。'
rows['ghostHand'][2] = '攻击间隔缩短至3秒，造成24伤害与24架势伤害。持续压制架势破坏的敌人3秒后，将其拖入地下。'
rows['consecration'] = [text.replace('消失后冷却', '冷却') for text in rows['consecration']]
edit('soulBlade', 1, '死者最大生命值越高，魂刃伤害越高', '魂刃造成30伤害，外加死者10%最大生命值的伤害')
edit('soulBlade', 2, '魂刃伤害提升', '魂刃基础伤害提升至50')
edit('iceBarrier', 3, '冻结非首领敌人', '冻结周围敌人')
edit('flyingKick', 2, '再受到伤害与架势伤害', '受到摔落伤害')
edit('timeSeal', 1, '对首领持续1.5秒。', '') if '对首领持续1.5秒。' in rows['timeSeal'][0] else None
edit('timeSeal', 3, '结束时有20%概率吞噬非首领敌人。', '结束时，敌人有20%概率永不复回。')
edit('tornado', 1, '场上维持一个龙卷风', '场上生成一个龙卷风')
edit('tornado', 3, '场上维持两个更大的龙卷', '生成一个额外龙卷风')
rows['antiRegen'] = [
    '攻击施加重伤效果，阻止目标治疗和复生。尝试复生的敌人会被引爆，伤害周围敌人，并为你恢复4生命。',
    '被架势破坏的目标也会在试图恢复时被引爆。阻止复活的爆炸增强，恢复生命提高至7。',
    '重伤效果每秒侵蚀9生命，持续6秒。架势破坏的目标引爆更快，爆炸进一步增强，恢复生命提高至10。',
]
rows['forgedBlade'][0] = '攻击伤害+5%。每提升6级，淬炼刀刃以永久成长2%伤害，成长上限为20%。'
edit('perfectMachine', 1, '闪电球持续攻击敌人，充能球激发时释放雷击、冰霜或黑暗冲击', '充能球拥有持续挂载效果，并在激发时释放雷击、冰霜或黑暗冲击')
rows['perfectMachine'][1] = '生成概率提高至30%，充能球挂载效果和激发效果增强。'
rows['perfectMachine'][2] = '生成概率提高至40%，充能球进一步强化。黑暗冲击会直接毁灭生命值不高于15%的敌人。'
rows['spaceSlash'][2] = '空间斩造成75伤害，攻击触发概率提高至40%。重击命中必定触发，且有30%概率生成两道。'
approved_rows = {key: value for key, value in rows.items() if key != 'emergencyDodge'}
assert len(approved_rows) == 47
assert all(len(value) == 3 and all(text.endswith('。') for text in value) for value in rows.values())

game_path = ROOT / 'ascensions.js'
code = game_path.read_text(encoding='utf-8')
changes = [
    ('comboFinisher\')&&dw===3?30:0', 'comboFinisher\')&&dw===3?47:0'),
    ('this.cooldown([0,7.5,5.8,4.2][ds])', 'this.cooldown([0,12,10,9][ds])'),
    ("const saw=this.rank('sawStorm');if(saw)this.v11.saw.cd=Math.max(0,this.v11.saw.cd-[0,.35,.55,.85][saw]);",
     "const saw=this.rank('sawStorm');if(saw===3)this.v11.saw.cd=Math.max(0,this.v11.saw.cd-.5);"),
    ("this.startCooldown(this.v11.saw,'cd',[0,6.5,5.5,4.8][saw])", "this.startCooldown(this.v11.saw,'cd',[0,8,7,6][saw])"),
    ("if(r===3&&!e.dead&&!e.furnaceCapture&&!isBoss(e)&&e.hp/e.maxHp<=.12)this.postureBreak(e,'perfectMachineDark');",
     "if(r===3&&!e.dead&&!e.furnaceCapture&&e.hp/e.maxHp<=(isBoss(e)?.05:.15))this.slay(e,'perfectMachineDark');"),
]
for old, new in changes:
    if old in code:
        assert code.count(old) == 1, old
        code = code.replace(old, new)
    else:
        assert code.count(new) == 1, new
marker = '  // Approved player text, batch three (095–142 except pending 122).\n'
end_marker = '  // End approved player text batch three.\n'
if marker in code:
    start = code.index(marker)
    end = code.index(end_marker, start) + len(end_marker)
    code = code[:start] + code[end:]
export = '  return {ASCENSIONS,DUAL_ASCENSIONS,AscensionEffects};'
assert code.count(export) == 1
block = marker + '  const OCTOBER_PLAYER_TEXT_BATCH_THREE=' + json.dumps(approved_rows, ensure_ascii=False, indent=2) + ';\n'
block += '''  for(const card of ASCENSIONS){
    const levels=OCTOBER_PLAYER_TEXT_BATCH_THREE[card.id];
    if(levels){card.levels=[...levels];card.description=card.levels[0];}
  }
'''
game_path.write_bytes(code.replace(export, block + end_marker + export).encode('utf-8'))
after = runtime_registry()
for kind in ('base', 'dual'):
    for old, card in zip(before[kind], after[kind]):
        expected = dict(old)
        if kind == 'base' and card['id'] in approved_rows:
            expected.update(levels=approved_rows[card['id']], description=approved_rows[card['id']][0])
        assert card == expected, card['id']

approval_path = DOCS / '擢升玩家文本已定稿_2026-10-02.json'
approval = json.loads(approval_path.read_text(encoding='utf-8'))
current_by_id = {card['id']: card for card in after['base']}
for identifier, levels in approval['levelsById'].items():
    assert current_by_id[identifier]['levels'] == levels, identifier
for filename in ('擢升玩家文本后续润色_基础_2026-10-02.txt', '擢升玩家文本候选_基础_2026-10-02.txt'):
    path = DOCS / filename
    lines = []
    for line in path.read_text(encoding='utf-8').splitlines():
        identifier, *levels = line.split('|')
        texts = rows.get(identifier, approval['levelsById'].get(identifier, levels))
        lines.append('|'.join([identifier, *texts]))
    path.write_bytes(('\n'.join(lines) + '\n').encode('utf-8'))
approval['levelsById'].update(approved_rows)
approval.update(lastUpdated=DATE, baseCount=141, status='partially_applied', pendingBaseIds=['emergencyDodge'])
save_json(approval_path, approval)
save_json(DOCS / '擢升当前注册表_2026-10-02.json', after)
batch = {
    'date': DATE, 'status': 'applied', 'baseNumbers': [95, 142], 'excludedBaseNumbers': [122],
    'count': 47, 'levelsById': approved_rows,
    'mechanics': {'delayedWoundFinisherBonus': 47, 'defenseSwordSpiritCooldown': [12, 10, 9],
                 'sawStormCooldown': [8, 7, 6], 'sawStormKillReduction': [0, 0, .5],
                 'darkOrbSlayThreshold': .15, 'darkOrbBossSlayThreshold': .05},
}
save_json(DOCS / f'擢升玩家文本第三批定稿_{DATE}.json', batch)
parts = [f'# 擢升玩家文本第三批定稿 · {DATE}\n\n095–142中47项已按用户确认写入游戏。122「紧急闪避」尚未确认，保留原游戏文本。\n\n']
for number, card in enumerate(after['base'], 1):
    if card['id'] in approved_rows:
        parts.append(f"### {number:03d} · {card['name']}\n\n")
        parts.extend(f'- LV{level}：{text}\n' for level, text in enumerate(card['levels'], 1))
        parts.append('\n')
(DOCS / f'擢升玩家文本第三批定稿_{DATE}.md').write_bytes(''.join(parts).encode('utf-8'))
parts = ['# 擢升与双重擢升当前游戏文本\n\n已同步001–121、123–142玩家文本与五项汲魂双重。122及其余306项双重仍待确认。\n\n## 擢升（142项）\n']
for number, card in enumerate(after['base'], 1):
    parts.append(f"\n### {card['name']}\n\n")
    parts.extend(f'- LV{level}：{text}\n' for level, text in enumerate(card['levels'], 1))
parts.append('\n## 双重擢升（311项）\n')
for number, card in enumerate(after['dual'], 1):
    parts.append(f"\n### {card['name']}\n\n")
    parts.append(f"- 前置：{'、'.join(card['parentNames'])}均达到 LV3\n- 效果：{card['description']}\n")
    if card.get('detail') and card['detail'] != card['description']:
        parts.append(f"- 补充详情：{card['detail']}\n")
(DOCS / '擢升与双重擢升当前游戏文本.md').write_bytes(''.join(parts).encode('utf-8'))
subprocess.run(['python', str(DOCS / '生成擢升玩家文本候选.py')], cwd=ROOT, check=True)
proposal_path = DOCS / '擢升与双重擢升_玩家文本候选_2026-10-02.json'
proposal = json.loads(proposal_path.read_text(encoding='utf-8'))
proposal['lastUpdated'] = DATE
proposal['latestApproval'] = batch
save_json(proposal_path, proposal)
pending_path = DOCS / '后续擢升与双重擢升_玩家文本候选_2026-10-03.md'
pending = pending_path.read_text(encoding='utf-8')
pending = re.sub(r'本稿仅列尚未定稿的 .*?\n',
    '本稿保留后续审阅范围：095–142共48项普通擢升、306项双重擢升。**其中47项普通擢升已按最新确认写入游戏；122「紧急闪避」与306项双重擢升仍为候选。**\n', pending, count=1)
for number, card in enumerate(after['base'], 1):
    if card['id'] not in rows:
        continue
    heading = f"### {number:03d} · {card['name']}"
    body = '\n'.join(f'- LV{level}：{text}' for level, text in enumerate(rows[card['id']], 1))
    state = '已采用' if card['id'] in approved_rows else '待审'
    pattern = re.escape(heading) + r'[^\n]*\n\n- LV1：[^\n]*\n- LV2：[^\n]*\n- LV3：[^\n]*'
    pending, count = re.subn(pattern, lambda _: heading + f'（{state}）\n\n' + body, pending)
    assert count == 1, card['id']
pending_path.write_bytes(pending.encode('utf-8'))
print('PASS: 47 base cards / 141 level texts applied; 122 and all 306 pending duals unchanged in game.')
print('PASS: four requested mechanics updated; prior approved copy, names and parent relations preserved.')
