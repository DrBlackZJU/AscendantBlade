"""落实122紧急闪避与双重001–026，并同步三项明确要求的玩法修订。"""
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
    code = """
const fs=require('fs'),vm=require('vm'),c=vm.createContext({console});
for(const p of ['systems.js','motion.js','boss.js','enemy_catalog.js','combat.js','ascensions.js'])
  vm.runInContext(fs.readFileSync(p,'utf8'),c,{filename:p});
process.stdout.write(JSON.stringify({source:'ascensions.js final runtime registry',
  base:c.AshAscensions.ASCENSIONS,dual:c.AshAscensions.DUAL_ASCENSIONS}));
"""
    return json.loads(subprocess.check_output(['node', '-e', code], cwd=ROOT).decode('utf-8'))


def read_rows(filename):
    rows = {}
    for line in (DOCS / filename).read_text(encoding='utf-8').splitlines():
        identifier, *values = line.split('|')
        assert identifier not in rows
        rows[identifier] = values
    return rows


before = runtime_registry()
snapshot_path = DOCS / f'擢升注册表_玩家文本第四批定稿前_{DATE}.json'
if not snapshot_path.exists():
    save_json(snapshot_path, before)
base_candidates = read_rows('擢升玩家文本候选_基础_2026-10-02.txt')
dual_candidates = read_rows('擢升玩家文本候选_双重_2026-10-02.txt')
base_rows = {'emergencyDodge': base_candidates['emergencyDodge']}
dual_rows = {card['id']: dual_candidates[card['id']][0] for card in before['dual'][:26]}
assert list(dual_rows) == [f'd{n:02d}' for n in range(1, 27)]
dual_rows['d01'] = '摩擦生火爆炸后，对主目标追加3次焚刃斩击。斩杀生命不高于15%的敌人。'
dual_rows['d03'] = '威吓与诅咒之眼融合为索伦魔眼，每秒侵蚀一名敌人100生命与100架势。斩杀生命值或架势值不高于25%的敌人。'
dual_rows['d05'] = '新星爆发的伤害与架势伤害翻倍。新星爆发或终极形态持续期间，击杀或破坏敌人架势都会延长形态，剩余时间最多11秒。'
dual_rows['d06'] = '两把剑灵每8秒展开两仪剑阵，扫击周围敌人，造成80伤害与60架势伤害。'
dual_rows['d10'] = '攻击造成过杀时，必定引发尸爆，并将过杀伤害的50%加入爆炸。'
dual_rows['d11'] = '高空下劈的斩杀阈值提高至50%。成功斩杀后弹起更高，并返还空中下劈。'
dual_rows['d16'] = '蓄力重击施加毒焰，每秒造成24伤害，持续5秒。带毒焰的敌人死亡时爆炸，点燃周围敌人。'
dual_rows['d17'] = '完美格挡立即给攻击者留下可引爆的雷印，并额外召来雷击追加42伤害与22架势伤害，并弹射最多4名其他敌人。'
dual_rows['d21'] = '从冥府伸出的藤蔓每秒侵蚀18生命与24架势，汲取2.3生命，并减速周围敌人，将濒弱敌人拖入地下。'
dual_rows['d23'] = '静止超过1秒并进入据守后，受到的伤害额外降低15%，且第4击可小幅击退精英。'
dual_rows['d24'] = '召唤骷髅时有25%概率召出魂刃骷髅，攻击更强、更快。消失时射出2—4道魂刃，每道造成60伤害与10架势伤害。'
dual_rows['d26'] = '无情也对生命不低于70%的敌人生效，获得50%加成。'
assert len(base_rows['emergencyDodge']) == 3
assert all(text.endswith('。') for text in dual_rows.values())

game_path = ROOT / 'ascensions.js'
code = game_path.read_text(encoding='utf-8')
changes = [
    ("this.pair('ruthless','giantKiller')&&ratio>=.70?.65:0", "this.pair('ruthless','giantKiller')&&ratio>=.70?.50:0"),
    ("if(!e.dead&&!e.furnaceCapture&&e.hp/e.maxHp<=(isBoss(e)?.15:.25))this.slay(e,'endEye');else if(!e.dead&&!e.furnaceCapture&&e.posture/e.maxPosture<=.25)this.postureBreak(e,'endEye');",
     "const threshold=isBoss(e)?.15:.25;if(!e.dead&&!e.furnaceCapture&&(e.hp/e.maxHp<=threshold||e.posture/e.maxPosture<=threshold))this.slay(e,'endEye');"),
    ("const giant=this.rank('giant');if(giant===3&&tags.includes('comboFinisher')&&!e.dead&&!e.furnaceCapture)this.game.launchEnemy(e,this.game.p.x,this.game.p.y,{force:480,lift:210,duration:.55});",
     """const giant=this.rank('giant');if(giant===3&&tags.includes('comboFinisher')&&!e.dead&&!e.furnaceCapture){
        const titan=this.pair('battleFormation','giant')&&TYPES[e.type]?.elite&&!isBoss(e);
        this.game.launchEnemy(e,this.game.p.x,this.game.p.y,{force:titan?650:480,lift:210,duration:.55});
      }"""),
]
for old, new in changes:
    if old in code:
        assert code.count(old) == 1, old
        code = code.replace(old, new)
    else:
        assert code.count(new) == 1, new
marker = '  // Approved player text, batch four (base 122 and duals 001–026).\n'
end_marker = '  // End approved player text batch four.\n'
if marker in code:
    start = code.index(marker)
    end = code.index(end_marker, start) + len(end_marker)
    code = code[:start] + code[end:]
export = '  return {ASCENSIONS,DUAL_ASCENSIONS,AscensionEffects};'
assert code.count(export) == 1
block = marker + '  const OCTOBER_PLAYER_TEXT_BATCH_FOUR=' + json.dumps(base_rows, ensure_ascii=False, indent=2) + ';\n'
block += '  const OCTOBER_DUAL_PLAYER_TEXT_BATCH_FOUR=' + json.dumps(dual_rows, ensure_ascii=False, indent=2) + ';\n'
block += '''  for(const card of ASCENSIONS){
    const levels=OCTOBER_PLAYER_TEXT_BATCH_FOUR[card.id];
    if(levels){card.levels=[...levels];card.description=card.levels[0];}
  }
  for(const card of DUAL_ASCENSIONS){
    const text=OCTOBER_DUAL_PLAYER_TEXT_BATCH_FOUR[card.id];
    if(text)card.description=card.detail=text;
  }
'''
game_path.write_bytes(code.replace(export, block + end_marker + export).encode('utf-8'))
after = runtime_registry()
for kind in ('base', 'dual'):
    for old, card in zip(before[kind], after[kind]):
        expected = dict(old)
        if kind == 'base' and card['id'] in base_rows:
            expected.update(levels=base_rows[card['id']], description=base_rows[card['id']][0])
        if kind == 'dual' and card['id'] in dual_rows:
            expected.update(description=dual_rows[card['id']], detail=dual_rows[card['id']])
        assert card == expected, card['id']
approval_path = DOCS / '擢升玩家文本已定稿_2026-10-02.json'
approval = json.loads(approval_path.read_text(encoding='utf-8'))
approval['levelsById'].update(base_rows)
approval['dualDescriptionsById'].update(dual_rows)
approval.update(lastUpdated=DATE, baseCount=142, dualCount=31, pendingBaseIds=[])
for card in after['base']:
    assert card['levels'] == approval['levelsById'][card['id']], card['id']
for card in after['dual']:
    if card['id'] in approval['dualDescriptionsById']:
        assert card['description'] == approval['dualDescriptionsById'][card['id']] == card['detail'], card['id']
save_json(approval_path, approval)
save_json(DOCS / '擢升当前注册表_2026-10-02.json', after)
for filename in ('擢升玩家文本候选_双重_2026-10-02.txt', '擢升玩家文本后续润色_双重_2026-10-02.txt'):
    lines = []
    for identifier, values in read_rows(filename).items():
        text = approval['dualDescriptionsById'].get(identifier, values[0])
        lines.append(f'{identifier}|{text}')
    (DOCS / filename).write_bytes(('\n'.join(lines) + '\n').encode('utf-8'))
batch = {
    'date': DATE, 'status': 'applied', 'baseNumbers': [122], 'dualNumbers': [1, 26],
    'baseCount': 1, 'dualCount': 26, 'levelsById': base_rows, 'dualDescriptionsById': dual_rows,
    'mechanics': {'endEyeHealthOrPostureSlay': True, 'endEyeThreshold': .25, 'endEyeBossThreshold': .15,
                 'titanEliteFinisherLaunchForce': 650, 'ruthlessHighHealthBenefitScale': .50},
}
save_json(DOCS / f'擢升玩家文本第四批定稿_{DATE}.json', batch)
parts = [f'# 擢升玩家文本第四批定稿 · {DATE}\n\n122「紧急闪避」及双重001–026已写入游戏。普通擢升142项全部定稿，双重已有31项定稿，其余280项仍待审。\n\n## 普通擢升\n\n### 122 · 紧急闪避\n\n']
parts.extend(f'- LV{level}：{text}\n' for level, text in enumerate(base_rows['emergencyDodge'], 1))
parts.append('\n## 双重擢升\n')
for number, card in enumerate(after['dual'][:26], 1):
    parts.append(f"\n### {number:03d} · {card['name']}\n\n前置：{'＋'.join(card['parentNames'])}\n\n{card['description']}\n")
(DOCS / f'擢升玩家文本第四批定稿_{DATE}.md').write_bytes(''.join(parts).encode('utf-8'))
parts = ['# 擢升与双重擢升当前游戏文本\n\n142项普通擢升与31项双重玩家文本已定稿；其余280项双重仍待确认。\n\n## 擢升（142项）\n']
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
pending_path = DOCS / '后续擢升与双重擢升_玩家文本候选_2026-10-03.md'
pending = pending_path.read_text(encoding='utf-8')
pending = re.sub(r'本稿保留后续审阅范围：[^\n]*',
    '本稿保留后续审阅范围：095–142共48项普通擢升、306项双重擢升。**普通擢升全部已采用；双重001–026已采用，其余280项双重仍为候选。**', pending, count=1)
pending = pending.replace('### 122 · 紧急闪避（待审）', '### 122 · 紧急闪避（已采用）')
for number, card in enumerate(after['dual'][:26], 1):
    heading = f"### {number:03d} · {card['name']}"
    pattern = re.escape(heading) + r'[^\n]*\n\n前置：[^\n]*\n\n[^\n]*'
    body = heading + f"（已采用）\n\n前置：{'＋'.join(card['parentNames'])}\n\n{card['description']}"
    pending, count = re.subn(pattern, lambda _: body, pending)
    assert count == 1, card['id']
pending_path.write_bytes(pending.encode('utf-8'))
print('PASS: base 122 and 26 dual texts applied; 142 base / 31 dual approved, 280 dual pending.')
print('PASS: all prior copy, IDs, names and parents preserved; three requested mechanics updated.')
