"""同步双重200–311；全部玩家文本确认完成。"""
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
snapshot = DOCS / f'擢升注册表_玩家文本第九批定稿前_{DATE}.json'
if not snapshot.exists():
    save_json(snapshot, before)
candidate = read_rows('擢升玩家文本候选_双重_2026-10-02.txt')
rows = {card['id']: candidate[card['id']] for card in before['dual'][199:311]}
rows.update({
    "d203": "重击击杀时，按过杀伤害的4%额外恢复生命与生命损伤，最多10。",
    "d205": "对敌人触发先发制人时，给敌人留下3秒临时赏金，及时击杀获得35%赏金奖励。",
    "d207": "尸爆总是施加中毒，每秒造成15伤害，持续6秒，并有30%概率向附近最多两名敌人传播瘟疫。",
    "d211": "奔袭撞击额外引发火焰爆炸，造成50伤害与30架势伤害，并点燃4秒。",
    "d215": "处决生成魂刃。连续处决时，魂刃悬停蓄力，并在结束后一齐射向剩余敌人。",
    "d217": "冲刺清除5点闪避疲劳。成功闪避使冲刺冷却缩短0.3秒。",
    "d219": "进入祝圣领域后将其点燃。点燃的领域每秒额外恢复0.4生命，持续灼伤敌人，并施加更猛烈的燃烧。",
    "d220": "对赏金目标的暗伤积累量+40%。赏金目标的暗伤足以致死时，立即引爆。",
    "d227": "当敌人死于诅咒时，额外获得2层行刑。",
    "d231": "守护剑灵完美格挡时释放连锁雷电，最多命中6名敌人，每名受到50伤害与28架势伤害。",
    "d239": "时空封锁优先选择赏金目标，封锁结束时将其永久放逐。",
    "d242": "冲刺不再打断静止生效的效果。",
    "d243": "保持静止时，每秒不断积蓄风势。",
    "d250": "当风势足够时，攻击额外释放旋风，造成70伤害与90架势伤害。每第3次旋风更加强悍。",
    "d254": "持续伤害快速触发，生效速度翻倍，持续时间减半。",
    "d255": "从召唤物能力中修习技艺，召唤物击杀同样获得技巧击杀奖励。",
    "d256": "骷髅优先追击附近的赏金目标，持续时间+30%。",
    "d263": "环刃命中不超过3名敌人时，伤害+30%，架势伤害+18%，并额外造成目标1.8%最大生命值的伤害。",
    "d264": "冲刺沿路径释放3次60%效能的环刃。",
    "d267": "成功闪避时，额外释放一次80%效能的环刃。这个效果有0.38秒的冷却时间。",
    "d269": "心灵控制的敌人死亡时，留下强化尸爆，范围更大，基础伤害提升至96伤害和58架势伤害，并随机施加更强的持续伤害效果。",
    "d271": "利用破绽时，伤害与架势伤害额外+10%，并额外获得该敌人所提供经验的3%。",
    "d277": "完美格挡链接目标时，所有同组链接敌人额外损失架势，相当于20外加其最大架势值的5%。",
    "d280": "靠近黑洞中心时，延长黑洞持续时间0.85秒，并使其跟随你移动。",
    "d281": "岩石突刺命中留下岩钉。破甲攻击或架势破坏将引爆岩钉，重创目标52外加10%的最大架势值，并对周围敌人造成55%的效果。",
    "d283": "连击的第一击将保留风势，第二击将消耗风势，快速突进，攻击范围扩大，突进期间短暂闪过敌人攻击。",
    "d285": "每次升级时，屏幕内每名敌人有80%概率遭受厄运。",
    "d286": "每7.2秒鬼手随机捏爆一名非首领敌人，并恐惧周围敌人2.6秒。",
    "d288": "获得一个额外的赏金标记，这个赏金标记只会标记非人形敌人。",
    "d289": "触发先发制人留下1秒猎杀印记。印记期间，敌人生命低于30%时立即被斩杀。",
    "d290": "共振满层时，完美格挡对周围敌人造成26外加最大生命值9%的伤害，并破坏生命不高于28%的敌人的架势。",
    "d293": "重击可命中时空封锁中的敌人，将其立即放逐，并触发空间斩。",
    "d295": "处决突进沿途留下空间裂口，结束时一齐引爆，造成75伤害。",
    "d296": "空间斩额外造成36架势伤害。完美格挡也会触发一次空间斩。",
    "d297": "格挡后，下一次冲刺沿路径留下空间裂口，冲刺结束后延迟0.3秒一齐引爆，造成75伤害。",
    "d298": "合并的大龙卷持续减速卷入的敌人，使其移速降为48%；每0.6秒积累一层霜痕，触发冻伤与冻结。",
    "d302": "俯冲攻击生命不高于60%的敌人时，伤害+80%，且斩杀生命低于15%的敌人。",
    "d303": "普通格挡使俯冲轰炸冷却缩短0.75秒，完美格挡缩短1.5秒。"
})
names = {'d219': '圣火'}
assert set(rows) == {f'd{n}' for n in range(200, 312)}
assert all(text.endswith(('。', '……')) for text in rows.values())

game_path = ROOT / 'ascensions.js'
code = game_path.read_text(encoding='utf-8')
marker = '  // Approved player text, batch nine (duals 200–311).\n'
end_marker = '  // End approved player text batch nine.\n'
if marker in code:
    start = code.index(marker)
    end = code.index(end_marker, start) + len(end_marker)
    code = code[:start] + code[end:]
export = '  return {ASCENSIONS,DUAL_ASCENSIONS,AscensionEffects};'
assert code.count(export) == 1
block = marker + '  const OCTOBER_DUAL_PLAYER_TEXT_BATCH_NINE=' + json.dumps(rows, ensure_ascii=False, indent=2) + ';\n'
block += '  const OCTOBER_DUAL_NAMES_BATCH_NINE=' + json.dumps(names, ensure_ascii=False) + ';\n'
block += '''  for(const card of DUAL_ASCENSIONS){
    const text=OCTOBER_DUAL_PLAYER_TEXT_BATCH_NINE[card.id];
    if(text)card.description=card.detail=text;
    if(OCTOBER_DUAL_NAMES_BATCH_NINE[card.id])card.name=OCTOBER_DUAL_NAMES_BATCH_NINE[card.id];
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
assert dual_count == 311
save_json(approval_path, approval)
save_json(DOCS / '擢升当前注册表_2026-10-02.json', after)
for filename in ('擢升玩家文本候选_双重_2026-10-02.txt', '擢升玩家文本后续润色_双重_2026-10-02.txt'):
    lines = [f'{identifier}|{approval["dualDescriptionsById"].get(identifier, text)}' for identifier, text in read_rows(filename).items()]
    (DOCS / filename).write_bytes(('\n'.join(lines) + '\n').encode('utf-8'))
batch = {'date': '2026-10-03', 'status': 'applied', 'dualNumbers': [200, 311], 'dualCount': 112, 'newDualCount': 110, 'namesById': {'d219': '圣火'}, 'mechanics': {'temporaryBountyRewardFraction': 0.35, 'fireBullExplosion': [50, 30], 'dashFatigueRecovery': 5, 'evasionDashCooldownReduction': 0.3, 'curseDeathExecutionerStacks': 2, 'windCycloneStrengthenedEvery': 3, 'ringFewTargetsMaxHPDamage': 0.018, 'ringFewTargetsBossMaxHPDamage': 0.008, 'dashRingPower': 0.6, 'evasionRingPower': 0.8, 'evasionRingCooldown': 0.38, 'strongCorpseExplosion': [96, 58], 'strongCorpseDotDPS': 15, 'flawEnemyBaseXPRewardFraction': 0.03, 'flawBossXPRewardFraction': 0, 'soulParryPosture': [20, 0.05], 'soulParryBossFraction': 0.02, 'rockNailSplashFraction': 0.55, 'levelDoomChance': 0.8, 'frostStormMovementFactor': 0.48, 'frostStormStackInterval': 0.6}}
batch["dualDescriptionsById"] = rows
save_json(DOCS / f'擢升玩家文本第九批定稿_{DATE}.json', batch)
parts = [f'# 双重擢升玩家文本第九批定稿 · {DATE}\n\n200–311共112项已写入游戏，其中226、246此前已采用，本批新增110项定稿。219更名为圣火。全部142项普通擢升与311项双重擢升玩家文本已定稿。\n']
for number, card in enumerate(after['dual'], 1):
    if 200 <= number <= 311:
        parts.append(f"\n### {number:03d} · {card['name']}\n\n前置：{'＋'.join(card['parentNames'])}\n\n{card['description']}\n")
(DOCS / f'擢升玩家文本第九批定稿_{DATE}.md').write_bytes(''.join(parts).encode('utf-8'))
parts = [f'# 擢升与双重擢升当前游戏文本\n\n142项普通擢升与{dual_count}项双重玩家文本已定稿；全部玩家文本均已确认。\n\n## 擢升（142项）\n']
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

本稿保留095–142共48项已采用普通擢升，并完整列出311项双重擢升。**全部{dual_count}项双重已采用。**

LV2、LV3沿用低等级仍有效的效果，主要写本级提升。全部条目标注已采用状态。

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
print(f'PASS: duals 200–311 adopted; 142 base / {dual_count} dual approved, {pending_count} dual pending.')
