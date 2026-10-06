"""Build a new current proposal; never overwrite the original editorial proposal."""
from pathlib import Path
from collections import Counter, defaultdict
import json
import re

HERE = Path(__file__).resolve().parent
REGISTRY = HERE / '擢升当前注册表_2026-10-02.json'
registry = json.loads(REGISTRY.read_text(encoding='utf-8'))
original = json.loads((HERE / '擢升命名扫描_当前注册表.json').read_text(encoding='utf-8'))
proposal = json.loads((HERE / '擢升命名候选_2026-10-02.json').read_text(encoding='utf-8'))
current = {c['id']: c for c in registry['base'] + registry['dual']}
old = {c['id']: c for c in original['base'] + original['dual']}
previous = {c['id']: c for c in proposal['cards']}

# A longest-first match also protects unchanged full names such as 千斩魂归
# from replacing a shorter renamed name inside them. 破势 remains a combat state.
name_map = {c['name']: current[c['id']]['name'] for c in original['base'] + original['dual']
            if c['name'] != '破势'}
name_pattern = re.compile('|'.join(re.escape(n) for n in sorted(name_map, key=len, reverse=True)))
def current_references(value):
    return name_pattern.sub(lambda m: name_map[m.group()], value)

locked = {c['id'] for c in registry['dual'] if old[c['id']]['name'] != c['name']}
# These user decisions predate the original full scan, plus d117 explicitly retained.
locked.update(['d117', 'd224', 'd170', 'd108', 'd268', 'd307', 'd155', 'd31', 'd83',
               'd298', 'd300', 'd303', 'd289', 'd276', 'd286', 'd254',
               'd213', 'd237', 'd167', 'd121', 'd96', 'd151', 'd141', 'd269',
               'd18', 'd101', 'd63', 'd191', 'd256', 'd253', 'd106', 'd190', 'd241', 'd195'])
# Resolve the October 1 decisions by their actual current names, not guessed IDs.
historical_names = ['生死逆转', '永恒六面骰', '创世纪', '头号通缉', '幕刃', '一次清算',
                    '肾上腺素', '超频', '吸积盘', '原子吐息', '超级锯片风暴', '猎魔人']
dual_by_name = {c['name']: c['id'] for c in registry['dual']}
locked.update(dual_by_name[name] for name in historical_names)

current_mechanisms = {
    'd44': '震踏对低生命敌人增伤并击飞，伤害后按阈值斩杀',
    'd105': '带破绽敌人攻击落空时追加53生命诅咒伤害',
}

rows = {}
for line in (HERE / '双重擢升候选_现行修订数据.txt').read_text(encoding='utf-8').splitlines():
    if not line or line.startswith('#'):
        continue
    card_id, assessment, mechanism, names, rationale = line.split('|')
    assert card_id not in rows, card_id
    rows[card_id] = dict(assessment=assessment, mechanism=mechanism,
                        candidates=names.split('／'), rationale=rationale)
expected_later = {c['id'] for c in registry['dual'][120:]}
assert set(rows) == expected_later and len(rows) == 191

cards = []
for number, source in enumerate(registry['dual'], 1):
    if source['id'] in rows:
        editorial = rows[source['id']].copy()
    else:
        p = previous[source['id']]
        editorial = {key: p[key] for key in ['assessment', 'mechanism', 'candidates', 'rationale']}
    for key in ['mechanism', 'rationale']:
        editorial[key] = current_references(editorial[key])
    if source['id'] in locked:
        editorial.update(assessment='已定稿', candidates=[source['name']],
                         rationale='沿用用户已确认的现名，本轮锁定。')
    if source['id'] in current_mechanisms:
        editorial['mechanism'] = current_mechanisms[source['id']]
    card = {**source, **editorial, 'kind': 'dual', 'number': number,
            'locked': source['id'] in locked, 'newlyReviewed': number >= 121}
    card['recommended'] = card['candidates'][0]
    assert 1 <= len(card['candidates']) <= 5, card['id']
    assert len(set(card['candidates'])) == len(card['candidates']), card['id']
    assert all(n and n == n.strip() for n in card['candidates']), card['id']
    assert card['parentNames'] == [current[p]['name'] for p in card['parents']], card['id']
    cards.append(card)

candidate_owners = defaultdict(list)
name_owners = defaultdict(list)
for c in current.values():
    name_owners[c['name']].append(c['id'])
conflicts = []
for c in cards:
    for n in c['candidates']:
        candidate_owners[n].append(c['id'])
        foreign = [owner for owner in name_owners.get(n, []) if owner != c['id']]
        if foreign:
            conflicts.append(dict(id=c['id'], candidate=n, currentOwners=foreign))
duplicates = {n: ids for n, ids in candidate_owners.items() if len(ids) > 1}
assert not duplicates and not conflicts, json.dumps(dict(duplicates=duplicates, conflicts=conflicts), ensure_ascii=False)

by_id = {c['id']: c for c in cards}
later = cards[120:]
stats = dict(dual=len(cards), newlyReviewed=len(later), locked=len(locked),
             candidates=sum(len(c['candidates']) for c in cards),
             laterCandidates=sum(len(c['candidates']) for c in later),
             assessment=dict(Counter(c['assessment'] for c in cards)),
             laterAssessment=dict(Counter(c['assessment'] for c in later)),
             recommendedChanges=sum(c['name'] != c['recommended'] for c in cards),
             laterRecommendedChanges=sum(c['name'] != c['recommended'] for c in later),
             candidateCountDistribution=dict(Counter(len(c['candidates']) for c in cards)),
             duplicateCandidates=duplicates, currentNameConflicts=conflicts)

def table(group):
    result = '| ID · 现行名称 | 现行前置（均 LV3） | 状态 | 机制摘要 | 候选（首项推荐） | 判断与借梗 |\n| --- | --- | --- | --- | --- | --- |\n'
    for c in group:
        names = '；'.join(f'**{n}**' if i == 0 else n for i, n in enumerate(c['candidates']))
        cells = [f"`{c['id']}` · {c['name']}", '＋'.join(c['parentNames']), c['assessment'],
                 c['mechanism'], names, c['rationale']]
        result += '| ' + ' | '.join(s.replace('|', '\\|') for s in cells) + ' |\n'
    return result

report = f'''# 双重擢升候选：现行修订 · 2026-10-02

依据五批定稿后的实际游戏注册表修订。本轮新增落实 100 项名称；此前逐项重审的 **d121–d311，共 {stats['newlyReviewed']} 项**已同步当前名称与定稿状态。前 120 项放在附录，未定稿部分承接原候选并校正名称引用。全表覆盖 **311 个双重擢升、{stats['candidates']} 个候选**，每项 1–5 个，第一项是推荐。

**已定稿的 {stats['locked']} 项锁定为现名**，包括本轮保留的“雷灵附体”，以及全量扫描之前已经选定的名称。其余候选是提案，没有自动改写游戏。

后续 191 项中：{stats['laterAssessment'].get('已定稿', 0)} 项已定稿、{stats['laterAssessment'].get('保留', 0)} 项建议保留、{stats['laterAssessment'].get('可选', 0)} 项可选润色、{stats['laterAssessment'].get('优先', 0)} 项优先改名，共 {stats['laterCandidates']} 个候选。其中 {stats['laterRecommendedChanges']} 项首选建议更名。

“保留”通常只给一个现名；“可选”保留原名或提供更顺的替代；“优先”针对生硬、重复和机制误导，一般给 2–3 个明确方向。数量按条目需要取舍，不为凑足五个增加弱候选。表中机制摘要只用于理解命名，完整数值与补充规则见 [现行效果对照](双重擢升候选_效果对照_现行修订_2026-10-02.md)。

## 这次的命名方向

按现在已选的“火上浇油、进退自如、引而不发、战斗记忆”等名称，优先用自然短语、具体物件和动作。强效果可以有气势，但不再普遍叠加“千斩、终末、永恒、裂锋”。新双重名称要突出新增收益，让玩家分清它与父卡和同系列其他组合。

暗伤系列用记账、欠债、清算串联；风势系列用静止生风、顺风、借风的动作区分；环刃与旋风系列用刀轮的位置和路径区分。已定稿项是系列的锚点，后续方案围绕它们调整。

## 接下来可以优先看的十二项

以下仅列尚未定稿的项目，已确认的新名不再进入这组推荐。

| ID · 现名 | 推荐 | 取名依据 |
| --- | --- | --- |
'''
for card_id in ['d122', 'd140', 'd150', 'd153', 'd181', 'd187', 'd210', 'd257', 'd258', 'd274', 'd281', 'd311']:
    c = by_id[card_id]
    if not c['locked']:
        report += f"| `{c['id']}` · {c['name']} | **{c['recommended']}** | {c['rationale']} |\n"

report += '''
## 后续双重擢升：d121–d311

前置显示当前游戏名；含“黑死病、转移阵地、天坠轰击”等跨到后续区间的定稿项，一并锁定列出，方便按完整顺序选名。
'''
for start in range(120, 311, 32):
    end = min(start + 32, 311)
    report += f'\n### d{start + 1}–d{end}\n\n' + table(cards[start:end])

report += '''
## 独立游戏引用的取舍

下列是命名关联判断，不统一声称中文为官方译名；数值始终按本作当前效果。既有梗保留它们的辨识度，只有收益或动作结构相近的新候选才优先借名。

| 条目 | 关联 | 取舍 |
| --- | --- | --- |
| d122 碎片整理 → 充能编组 | 《杀戮尖塔》Defragment | 原作增加集中，本作把球纳入召唤计数，建议换成符合新增机制的编组。 |
| d151 荒芜俯冲 | 《空洞骑士》Desolate Dive | 已定稿。共同点是下击与落地冲击，本作有连续次数条件。 |
| d222 嗝屁猫项圈 | 《以撒的结合》Guppy's Collar | 保留，独立概率复活的结构直接相近，概率和生命回复不同。 |
| d223 冰川 | 《杀戮尖塔》Glacier | 保留冰球与防御的联想，本作补护盾空窗，而非直接生成冰球牌。 |
| d278 电动力学 | 《杀戮尖塔》Electrodynamics | 保留雷球群体收益联想，本作需目标先带雷印。 |
| d285 永恒六面骰 | 《以撒的结合》Eternal D6 | 已定稿，锁定保留。原作重掷道具，本作升级施加厄运，属于随机与骰子形象的借用，不能视作相同机制。 |
| d297 黑暗艺术 | 《以撒的结合》Dark Arts | 已定稿。穿过目标后延迟结算的动作结构相近；本作另需先格挡武装冲刺，不照搬无敌与伤害规则。 |

## 前 120 项：现行目录与未定稿候选

这一部分用于核对已走过的条目。已定稿只显示现名；尚未选定的项目沿用原候选，并更新父卡与文案引用。
'''
for start in range(0, 120, 30):
    report += f'\n### d{start + 1}–d{start + 30}\n\n' + table(cards[start:start + 30])

report += f'''
## 覆盖与一致性

- 主表 d121–d311 共 191 项，附录 d01–d120 共 120 项，311 个稳定 ID 逐项完整覆盖。
- 每项 1–5 个候选，{stats['candidates']} 个候选在不同双重之间没有字面重名，也未占用其他普通或双重擢升的现行名；同一条目保留自身现名允许。
- 已定稿项只有当前名称一个候选。现行名称、前置、完整效果均来自当前游戏注册表，结构化数据与效果对照同源。
- 最新机制按当前代码：嘲笑追加 53 生命伤害；黑死病 ×2；连锋剑气每层连锋额外 +6% 生命伤害；疾风剑法按攻击开始时风势 ≥2 触发且无需实际耗风；弱者印记普通敌人阈值为 30%。
- 原始全量候选、扫描快照与原 JSON 保留，便于回查。此次未更改其他未定稿项目的游戏名称。

相关文件：[第五批100项定稿](擢升第五批命名定稿_2026-10-02.md) · [第四批定稿与嘲笑加强](擢升第四批命名定稿与嘲笑加强_2026-10-02.md) · [全部453项现行游戏文本](擢升与双重擢升当前游戏文本.md) · [修订JSON](双重擢升候选_现行修订_2026-10-02.json)
'''

report_path = HERE / '双重擢升候选_现行修订_2026-10-02.md'
report_path.write_text(report, encoding='utf-8')
details = '''# 双重擢升候选：现行完整效果对照 · 2026-10-02

与 [候选主表](双重擢升候选_现行修订_2026-10-02.md) 同源，逐项保留当前代码最终注册的效果及补充规则。已定稿锁定，其余候选尚未写入游戏；每项第一候选为推荐。
'''
for c in later + cards[:120]:
    details += f"\n## {c['id']} · {c['name']}\n\n"
    details += f"前置：{'＋'.join(c['parentNames'])}，均 LV3。\n\n"
    details += f"现行效果：{c['description']}\n"
    if c.get('detail') and c['detail'] != c['description']:
        details += f"\n补充详情：{c['detail']}\n"
    details += f"\n状态：{c['assessment']}。候选：" + '；'.join(c['candidates']) + '。\n\n' + c['rationale'] + '\n'
details_path = HERE / '双重擢升候选_效果对照_现行修订_2026-10-02.md'
details_path.write_text(details, encoding='utf-8')
data = dict(date='2026-10-02', status='current_editorial_proposal_not_applied',
            source=str(REGISTRY.name), firstCandidateIsRecommended=True,
            newlyReviewedRange=['d121', 'd311'], statistics=stats,
            lockedIds=[c['id'] for c in cards if c['locked']], cards=cards)
json_path = HERE / '双重擢升候选_现行修订_2026-10-02.json'
json_path.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding='utf-8')

# Validate the saved artifacts and their current source fields.
saved_report = report_path.read_text(encoding='utf-8')
saved_details = details_path.read_text(encoding='utf-8')
saved = json.loads(json_path.read_text(encoding='utf-8'))
order = [c['id'] for c in later + cards[:120]]
assert re.findall(r'^\| `(d\d+)` ·', saved_report.split('## 后续双重擢升：d121–d311', 1)[1], re.M) == order
assert re.findall(r'^## (d\d+) ·', saved_details, re.M) == order
assert len(cards) == len(set(order)) == 311
assert saved == json.loads(json.dumps(data, ensure_ascii=False))
for c in saved['cards']:
    for field, value in current[c['id']].items():
        assert c[field] == value, (c['id'], field)
    if c['locked']:
        assert c['candidates'] == [c['name']]
assert '\ufffd' not in saved_report + saved_details
print(json.dumps(stats, ensure_ascii=False, indent=2))
print('PASS: 191 later duals reviewed; 311 duals covered; 1–5 candidates; locked decisions; unique names; current effects preserved.')
