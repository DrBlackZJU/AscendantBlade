"""同步已确认的双重071–109，保留尚未确认的候选。"""
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
snapshot = DOCS / f'擢升注册表_玩家文本第七批定稿前_{DATE}.json'
if not snapshot.exists():
    save_json(snapshot, before)
candidate = read_rows('擢升玩家文本候选_双重_2026-10-02.txt')
rows = {card['id']: candidate[card['id']] for card in before['dual'][70:109]}
rows.update({
    'd71': '隐身中的第一击自动追击突袭敌人，并尝试绕至目标背后。',
    'd81': '反弹投射物时，额外发射3道小剑气，每道造成20.25伤害与14.85架势伤害，其中一道伤害与架势伤害翻倍。',
    'd82': '每击杀一名首领，刀刃永久成长2.5%，攻击速度+3%。',
    'd83': '治疗精灵会在冷却就绪后立刻治疗。治疗额外突破25%最大生命值。',
    'd88': '赏金目标被标记时立刻遭受厄运。若在厄运降临前击杀赏金目标，额外获得80经验，恢复10生命。',
    'd90': '时空封锁每次同时封锁2名敌人，你可攻击封锁中的目标。',
    'd91': '目标即使逃离被异时空永远吞噬的命运，也会遭受厄运。',
    'd92': '在书页风暴范围内击杀敌人时，扩大风暴范围，并额外获得20%经验。',
    'd93': '龙卷风减速增强，每个靠近的龙卷风每秒额外提供当前升级所需经验值3%的经验。',
    'd94': '时空封锁吞噬一名敌人时，其他正被封锁敌人也会被吞噬。',
    'd96': '高空发动俯冲轰炸时，俯冲距离与持续时间延长70%，全程保持无敌。',
    'd101': '藤蔓可同时缠住的敌人增加至4名，每条藤蔓每秒为你汲取3生命。',
    'd105': '被诅咒的敌人攻击落空时，立即受到53诅咒伤害。',
    'd108': '擢升页面最左侧选项触发快速成长的概率额外提高5%。',
    'd109': '第四击迎击成功时，直接施加封印。',
})
names = {}
ghost_levels = next(card['levels'][:] for card in before['base'] if card['id'] == 'ghost')
ghost_levels[0] = '闪避率 +8%，无视敌人碰撞体积。'
assert list(rows) == [f'd{n:02d}' for n in range(71, 110)]
assert all(text.endswith(('。', '……')) for text in rows.values())
game_path = ROOT / 'ascensions.js'
code = game_path.read_text(encoding='utf-8')
marker = '  // Approved player text, batch seven (duals 071–109).\n'
end_marker = '  // End approved player text batch seven.\n'
if marker in code:
    start = code.index(marker)
    end = code.index(end_marker, start) + len(end_marker)
    code = code[:start] + code[end:]
export = '  return {ASCENSIONS,DUAL_ASCENSIONS,AscensionEffects};'
assert code.count(export) == 1
block = marker + '  const OCTOBER_DUAL_PLAYER_TEXT_BATCH_SEVEN=' + json.dumps(rows, ensure_ascii=False, indent=2) + ';\n'
block += '  const APPROVED_GHOST_LEVELS_BATCH_SEVEN=' + json.dumps(ghost_levels, ensure_ascii=False) + ';\n'
block += '''  const ghostCard=ASCENSIONS.find(card=>card.id==='ghost');
  ghostCard.levels=APPROVED_GHOST_LEVELS_BATCH_SEVEN;ghostCard.description=ghostCard.levels[0];
  for(const card of DUAL_ASCENSIONS){
    const text=OCTOBER_DUAL_PLAYER_TEXT_BATCH_SEVEN[card.id];
    if(text)card.description=card.detail=text;
  }
'''
game_path.write_bytes(code.replace(export, block + end_marker + export).encode('utf-8'))
after = runtime_registry()
for kind in ('base', 'dual'):
    for old, card in zip(before[kind], after[kind]):
        expected = dict(old)
        if kind == 'base' and card['id'] == 'ghost':
            expected.update(levels=ghost_levels, description=ghost_levels[0])
        if kind == 'dual' and card['id'] in rows:
            expected.update(description=rows[card['id']], detail=rows[card['id']])
        assert card == expected, card['id']
approval_path = DOCS / '擢升玩家文本已定稿_2026-10-02.json'
approval = json.loads(approval_path.read_text(encoding='utf-8'))
approval['dualDescriptionsById'].update(rows)
approval['levelsById']['ghost'] = ghost_levels
approval.setdefault('namesById', {}).update(names)
dual_count = len(approval['dualDescriptionsById'])
pending_count = len(after['dual']) - dual_count
approval.update(lastUpdated=DATE, baseCount=142, dualCount=dual_count)
assert dual_count == 112
for card in after['base']:
    assert card['levels'] == approval['levelsById'][card['id']], card['id']
for card in after['dual']:
    if card['id'] in approval['dualDescriptionsById']:
        assert card['description'] == approval['dualDescriptionsById'][card['id']] == card['detail'], card['id']
    if card['id'] in approval['namesById']:
        assert card['name'] == approval['namesById'][card['id']], card['id']
save_json(approval_path, approval)
save_json(DOCS / '擢升当前注册表_2026-10-02.json', after)
base_input = DOCS / '擢升玩家文本候选_基础_2026-10-02.txt'
base_lines = base_input.read_text(encoding='utf-8').splitlines()
base_lines = ['ghost|' + '|'.join(ghost_levels) if line.startswith('ghost|') else line for line in base_lines]
base_input.write_bytes(('\n'.join(base_lines) + '\n').encode('utf-8'))
base_followup = DOCS / '擢升玩家文本后续润色_基础_2026-10-02.txt'
if base_followup.exists():
    base_lines = base_followup.read_text(encoding='utf-8').splitlines()
    base_lines = ['ghost|' + '|'.join(ghost_levels) if line.startswith('ghost|') else line for line in base_lines]
    base_followup.write_bytes(('\n'.join(base_lines) + '\n').encode('utf-8'))
for filename in ('擢升玩家文本候选_双重_2026-10-02.txt', '擢升玩家文本后续润色_双重_2026-10-02.txt'):
    lines = [f'{identifier}|{approval["dualDescriptionsById"].get(identifier, text)}' for identifier, text in read_rows(filename).items()]
    (DOCS / filename).write_bytes(('\n'.join(lines) + '\n').encode('utf-8'))
batch = {
    'date': DATE, 'status': 'applied', 'dualNumbers': [71, 109], 'dualCount': 39, 'newDualCount': 38,
    'dualDescriptionsById': rows, 'namesById': names, 'levelsById': {'ghost': ghost_levels},
    'mechanics': {'doomBountyXP': 80, 'doomBountyHeal': 10, 'pageKillXPBonus': .20,
                 'tornadoXPPerSecondFractionOfNextLevel': .03, 'tornadoXPNeedsPageStormField': False,
                 'normalKnowledgeTornadoSpeedFactor': .60, 'largeKnowledgeTornadoSpeedFactor': .50,
                 'highDiveDurationMultiplier': 1.70, 'natureVineHealPerSecond': 3,
                 'mockeryRequiresCursedTarget': True, 'fourthClashSealChance': 1},
}
save_json(DOCS / f'擢升玩家文本第七批定稿_{DATE}.json', batch)
parts = [f'# 双重擢升玩家文本第七批定稿 · {DATE}\n\n071–109共39项已写入游戏，其中076此前已采用，本批新增38项定稿。幽灵LV1措辞同步为“无视敌人碰撞体积”。累计{dual_count}项双重已采用，剩余{pending_count}项待审。\n']
parts.append('\n### 普通擢升 · 幽灵\n\n' + '\n'.join(f'- LV{level}：{text}' for level, text in enumerate(ghost_levels, 1)) + '\n')
for number, card in enumerate(after['dual'], 1):
    if 71 <= number <= 109:
        parts.append(f"\n### {number:03d} · {card['name']}\n\n前置：{'＋'.join(card['parentNames'])}\n\n{card['description']}\n")
(DOCS / f'擢升玩家文本第七批定稿_{DATE}.md').write_bytes(''.join(parts).encode('utf-8'))
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
print(f'PASS: duals 071–109 adopted; 142 base / {dual_count} dual approved, {pending_count} dual pending.')
