"""同步双重110–199及081修订；200以后仍保留候选。"""
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
snapshot = DOCS / f'擢升注册表_玩家文本第八批定稿前_{DATE}.json'
if not snapshot.exists():
    save_json(snapshot, before)
candidate = read_rows('擢升玩家文本候选_双重_2026-10-02.txt')
rows = {card['id']: candidate[card['id']] for card in before['dual'][109:199]}
rows.update({
    'd81': '反弹投射物时，额外发射3道小剑气，每道造成20伤害与15架势伤害。',
    'd114': '第二与第三道震爆回响获得所有战意爆发的伤害加成，且命中点燃敌人5秒，每秒造成15伤害。',
    'd116': '进入子弹时间时，额外生成4–6个短暂的充能球，可突破数量上限。子弹时间结束时，所有充能球一齐激发。',
    'd125': '重伤侵蚀的生命值翻倍。',
    'd126': '飞身踢击飞的敌人总是在落地时爆炸，伤及周围敌人。',
    'd128': '使用链锯剑，破甲效果提升至50%，锯片伤害+28%且同样施加破甲。第四击、突刺与满蓄重击额外削减敌人架势，并有15%概率破坏其架势。',
    'd131': '用重击、第四击、突刺或下劈击杀非人形敌人时，恢复5生命，额外获得30%经验。',
    'd132': '剑锋末端独立计算命中专注，更容易获得专注加成。',
    'd134': '先发制人标记期间，目标受到的伤害+10%，暴击倍率+0.1，击杀经验+25%。',
    'd138': '黑洞牵引龙卷风向中心移动。风眼架势伤害+25%，并使小型敌人频繁僵直。',
    'd140': '游刃满层时，攻击不会消耗风势，并额外补充风势。',
    'd144': '震爆回响和二重斩的追加震爆不再衰减。',
    'd148': '冥想期间，蓄力速度额外+100%。',
    'd149': '战意爆发使巨龙吐息冷却缩短6秒，如果这使得吐息立即就绪，则释放强化的蓝色龙息。强化龙息造成1.6倍伤害。',
    'd150': '战意爆发后，周身留下龙息区域，命中造成110伤害与50架势伤害，点燃5秒，并持续灼伤其中敌人。',
    'd152': '连续下劈的斩杀阈值逐次提高，每次提高5%，最高提高25%。',
    'd153': '每次淬炼刀刃时，额外获得20最大生命值。',
    'd154': '处决延长行刑持续时间，并逐次获得更多战意。每层行刑层数额外提高2.5%伤害。',
    'd156': '受到伤害时，有18%概率仅仅受到生命损伤。',
    'd159': '奔袭可以撞飞精英敌人，击飞的敌人成为人体保龄球，且必定触发连锁碰撞。',
    'd160': '高速奔袭时更快积累奔袭。撞击额外造成伤害与30架势伤害，并返还部分风势；风势越多，额外伤害越高。',
    'd167': '满生命站在祝圣领域中时，每1.5秒以圣光轰击领域内敌人，造成81伤害与63架势伤害。',
    'd168': '炼炉完成炼化后发射炉渣弹，对目标造成88伤害与66架势伤害，并爆炸点燃周围敌人。',
    'd170': '催眠时有20%概率将敌人洗脑，造成心灵控制。',
    'd171': '四连击全部命中同一敌人后，攻击剑灵同步突刺，造成75伤害与55架势伤害。',
    'd177': '敌人结束封印时，若受到重伤效果，则额外引发爆炸，造成64伤害与16架势伤害。',
    'd179': '阿尔法处决链结束时释放血爆，伤及周围敌人，并额外恢复生命。连续处决越多，血爆与治疗越强。',
    'd180': '完美格挡后，雷电精灵攻击速度+60%，雷电额外弹射1名敌人，持续3秒。',
    'd184': '阿尔法突袭每次处决额外叠加行刑，最多8层。突袭结束后对附近一位敌人追加一击，行刑层数越高，伤害越高。',
    'd189': '赏金目标每秒受到29诅咒伤害。',
    'd191': '从地狱归来时，消灭周围所有敌人。每消灭一名敌人额外恢复4%最大生命值，最多恢复40%。',
    'd192': '无惧疼痛的自动格挡战意消耗降低40%，并为下一次反击储存25架势伤害。',
    'd198': '剑气长度和宽度提高40%，随着剑气行进距离伤害逐渐提升，最高提升100%。',
    'd199': '骷髅攻击速度提高20%，每存在一种独特骷髅兵种额外提高20%。',
})
names = {'d22': '猎杀野兽', 'd131': '剥皮', 'd150': '龙裔血脉'}
assert set(rows) == {f'd{n}' for n in range(110, 200)} | {'d81'}
assert all(text.endswith(('。', '……')) for text in rows.values())

game_path = ROOT / 'ascensions.js'
code = game_path.read_text(encoding='utf-8')
marker = '  // Approved player text, batch eight (duals 110–199 and 081 revision).\n'
end_marker = '  // End approved player text batch eight.\n'
if marker in code:
    start = code.index(marker)
    end = code.index(end_marker, start) + len(end_marker)
    code = code[:start] + code[end:]
export = '  return {ASCENSIONS,DUAL_ASCENSIONS,AscensionEffects};'
assert code.count(export) == 1
block = marker + '  const OCTOBER_DUAL_PLAYER_TEXT_BATCH_EIGHT=' + json.dumps(rows, ensure_ascii=False, indent=2) + ';\n'
block += '  const OCTOBER_DUAL_NAMES_BATCH_EIGHT=' + json.dumps(names, ensure_ascii=False) + ';\n'
block += '''  for(const card of DUAL_ASCENSIONS){
    const text=OCTOBER_DUAL_PLAYER_TEXT_BATCH_EIGHT[card.id];
    if(text)card.description=card.detail=text;
    if(OCTOBER_DUAL_NAMES_BATCH_EIGHT[card.id])card.name=OCTOBER_DUAL_NAMES_BATCH_EIGHT[card.id];
  }
'''
game_path.write_bytes(code.replace(export, block + end_marker + export).encode('utf-8'))

after = runtime_registry()
for kind in ('base', 'dual'):
    for old, card in zip(before[kind], after[kind]):
        expected = dict(old)
        if kind == 'dual' and card['id'] in rows:
            expected.update(description=rows[card['id']], detail=rows[card['id']])
        if card['id'] in names:
            expected['name'] = names[card['id']]
        assert card == expected, card['id']
approval_path = DOCS / '擢升玩家文本已定稿_2026-10-02.json'
approval = json.loads(approval_path.read_text(encoding='utf-8'))
approval['dualDescriptionsById'].update(rows)
approval.setdefault('namesById', {}).update(names)
dual_count = len(approval['dualDescriptionsById'])
pending_count = len(after['dual']) - dual_count
approval.update(lastUpdated=DATE, baseCount=142, dualCount=dual_count)
assert dual_count == 201
save_json(approval_path, approval)
save_json(DOCS / '擢升当前注册表_2026-10-02.json', after)
for filename in ('擢升玩家文本候选_双重_2026-10-02.txt', '擢升玩家文本后续润色_双重_2026-10-02.txt'):
    lines = [f'{identifier}|{approval["dualDescriptionsById"].get(identifier, text)}' for identifier, text in read_rows(filename).items()]
    (DOCS / filename).write_bytes(('\n'.join(lines) + '\n').encode('utf-8'))
batch = {
    'date': DATE, 'status': 'applied', 'dualNumbers': [110, 199], 'dualCount': 90, 'newDualCount': 89,
    'dualDescriptionsById': rows, 'namesById': names, 'extraRevisedDualNumbers': [81],
    'mechanics': {'overclockExtraOrbs': [4, 6], 'overclockActivatesAllOrbs': True,
                 'beastTechniqueXPBonus': .30, 'bullyCritMultiplierBonus': .1,
                 'meditationChargeSpeedBonus': 1, 'forgeMaxHPPerStep': 20, 'forgeMaxHPCap': None,
                 'plungeExecuteBase': .15, 'plungeExecuteStep': .05, 'plungeExecuteBonusCap': .25,
                 'plungeExecuteBossFactor': 1/3, 'holyStrike': [81, 63], 'slagMainTarget': [88, 66],
                 'comboSwordSpirit': [75, 55], 'sealSerumExplosion': [64, 16], 'alphaExecutionStacks': 8,
                 'curseBountyDPS': 29, 'bloodGuardStoredPosture': 25, 'dragonBurstCooldownReduction': 6,
                 'swordQiSizeBonus': .40, 'swordQiTravelDamageBonusCap': 1,
                 'skeletonAttackSpeedBonus': .20, 'skeletonAttackSpeedBonusPerUniqueType': .20},
}
save_json(DOCS / f'擢升玩家文本第八批定稿_{DATE}.json', batch)
parts = [f'# 双重擢升玩家文本第八批定稿 · {DATE}\n\n110–199共90项已写入游戏，其中147此前已采用，本批新增89项定稿。081描述同步修订。累计{dual_count}项双重已采用，剩余{pending_count}项待审，从200继续。\n\n改名：原剥皮改为猎杀野兽，131改为剥皮，150改为龙裔血脉。152每次提高5%、最多提高25%，首领仍按三分之一计算，玩家文本不列出。\n']
for number, card in enumerate(after['dual'], 1):
    if number == 81 or 110 <= number <= 199:
        parts.append(f"\n### {number:03d} · {card['name']}\n\n前置：{'＋'.join(card['parentNames'])}\n\n{card['description']}\n")
(DOCS / f'擢升玩家文本第八批定稿_{DATE}.md').write_bytes(''.join(parts).encode('utf-8'))
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
print(f'PASS: duals 110–199 adopted; 142 base / {dual_count} dual approved, {pending_count} dual pending.')
