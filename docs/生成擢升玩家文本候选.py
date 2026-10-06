"""整理本轮逐项撰写的候选文案，仅生成 docs 下的提案文件。"""
from pathlib import Path
import hashlib
import json
import re

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent
DATE = '2026-10-02'
registry_path = HERE / f'擢升当前注册表_{DATE}.json'
registry = json.loads(registry_path.read_text(encoding='utf-8'))
approval_path = HERE / f'擢升玩家文本已定稿_{DATE}.json'
if not approval_path.exists():
    approval_path = HERE / f'擢升玩家文本第一批定稿_{DATE}.json'
approval = json.loads(approval_path.read_text(encoding='utf-8')) if approval_path.exists() else {}
approved = approval.get('levelsById', {})
approved_dual = approval.get('dualDescriptionsById', {})
pending_base = [c for c in registry['base'] if c['id'] not in approved]
pending_dual = [c for c in registry['dual'] if c['id'] not in approved_dual]
approved_numbers = [i for i, c in enumerate(registry['base'], 1) if c['id'] in approved]
ranges = []
for n in approved_numbers:
    if ranges and n == ranges[-1][1] + 1:
        ranges[-1][1] = n
    else:
        ranges.append([n, n])
approved_label = '、'.join(f'{a:03d}–{b:03d}' if a != b else f'{a:03d}' for a, b in ranges)
pending_label = '、'.join(f'{i:03d} · {c["name"]}' for i, c in enumerate(registry['base'], 1) if c['id'] not in approved)
base_review_status = f'普通擢升尚待确认：**{pending_label}**。' if pending_base else '普通擢升已全部确认。'
pending_summary = f'{len(pending_base)} 项普通擢升与 {len(pending_dual)} 项双重擢升' if pending_base else f'{len(pending_dual)} 项双重擢升'
all_applied = not pending_base and not pending_dual
adoption_summary = '142 项普通擢升与 311 项双重擢升已全部按用户确认写入游戏，无待审项。' if all_applied else f'{approved_label} 与 {len(approved_dual)} 项双重擢升已按用户确认写入游戏；其余 {pending_summary} 仍待审阅。'
review_summary = '普通擢升与双重擢升均已全部确认。' if all_applied else f'{base_review_status}其余双重擢升继续保留候选。'


def read_rows(label, field_count):
    result = {}
    path = HERE / f'擢升玩家文本候选_{label}_{DATE}.txt'
    for number, line in enumerate(path.read_text(encoding='utf-8').splitlines(), 1):
        if not line.strip():
            continue
        cells = line.split('|')
        assert len(cells) == field_count, (path.name, number)
        identifier, *texts = cells
        assert identifier not in result, (path.name, identifier)
        assert all(t and t == t.strip() and t.endswith(('。', '……')) for t in texts), identifier
        result[identifier] = texts
    return result


base_rows = read_rows('基础', 4)
dual_rows = read_rows('双重', 2)
assert len(registry['base']) == len(base_rows) == 142
assert len(registry['dual']) == len(dual_rows) == 311
assert set(base_rows) == {c['id'] for c in registry['base']}
assert set(dual_rows) == {c['id'] for c in registry['dual']}
all_source = {c['id']: c for kind in ('base', 'dual') for c in registry[kind]}
assert len(all_source) == 453
for source in registry['dual']:
    assert source['parentNames'] == [all_source[p]['name'] for p in source['parents']]

proposal = {
    'date': DATE,
    'status': 'applied' if all_applied else ('partially_applied' if approved or approved_dual else 'player_text_proposal_not_applied'),
    'appliedBaseIds': list(approved),
    'appliedCount': len(approved) + len(approved_dual),
    'appliedBaseCount': len(approved),
    'appliedDualIds': list(approved_dual),
    'appliedDualCount': len(approved_dual),
    'source': registry['source'],
    'sourceSnapshot': registry_path.name,
    'sourceSnapshotSha256': hashlib.sha256(registry_path.read_bytes()).hexdigest(),
    'gameSourceSha256': hashlib.sha256((ROOT / 'ascensions.js').read_bytes()).hexdigest(),
    'counts': {'base': 142, 'dual': 311, 'cards': 453, 'levelTexts': 426},
    'base': [],
    'dual': [],
    'editorialNotes': [
        '高等级沿用低等级仍有效的效果；文案着重列出变化与新增效果。',
        '总生命指生命与受损生命之和；闪避指概率闪避，主动操作使用冲刺。',
        '烈焰重剑 LV3 的现行范围为 +30%，用户示例为 +15%；本提案按现行 +30% 写，不调整游戏数值。',
        '毒刃保留 LV2 每 8 秒、LV3 每 6 秒的准备频率，避免漏掉升级收益。',
        '死门的现行说明将渴血收益称为转化灰血；实现为额外获得受损生命，本提案已纠正表达。',
        '裂隙吞噬的现行说明未写 首领 限制；实现排除 首领，本提案明确非首领。',
    ],
}

for c in registry['base']:
    proposal['base'].append({
        'id': c['id'], 'name': c['name'],
        'status': 'applied' if c['id'] in approved else 'candidate',
        'levels': base_rows[c['id']], 'sourceLevels': c['levels'],
    })
for c in registry['dual']:
    proposal['dual'].append({
        'id': c['id'], 'name': c['name'],
        'status': 'applied' if c['id'] in approved_dual else 'candidate',
        'parents': c['parents'], 'parentNames': c['parentNames'],
        'description': dual_rows[c['id']][0],
        'sourceDescription': c['description'], 'sourceDetail': c['detail'],
    })

player_texts = [t for c in proposal['base'] for t in c['levels']]
player_texts += [c['description'] for c in proposal['dual']]
for forbidden in ('BOSS', '灰血', 'DOT', '递归', '结算器', '周期器', '实体', '向上取整', '向下取整', 'J ', ' Q ', 'max(', 'min(', '插值', '指数跟随', '代码'):
    assert not any(forbidden in t for t in player_texts), forbidden
assert not any('\ufffd' in t for t in player_texts)

intro = f'''# 擢升与双重擢升：玩家文本候选 · {DATE}

按现行游戏名称与最终注册效果逐项整理，覆盖 **142 项擢升、311 项双重擢升，共 453 项**。普通擢升共 426 条等级文本。**{adoption_summary}**

已同步此前确认的玩法与玩家文本修订。{review_summary}

## 阅读约定

- LV2、LV3 沿用低等级仍有效的效果，主要写本级的提升与新增效果。
- 简单的伤害、百分比、触发间隔与关键阈值保留数值；复杂的范围、脉冲、伤害公式以效果与成长方向表达。
- “恢复生命损伤”指将受损生命恢复为生命；“额外获得受损生命”指新增可恢复的受损生命。“总生命”指生命与受损生命之和。
- 文中的“闪避”指概率闪避；主动操作明确写“冲刺”。“生命伤害”包括相应的一切生命伤害来源，有限定的效果明确写“直接攻击”“普通攻击”等。
- 双重擢升前置均为两项满级擢升。前置名在候选正文外列出，便于查找。

## 本轮需要留意的几处差异

以下是编辑核对说明，不属于卡面玩家文本：

1. **烈焰重剑 LV3**：已采用范围 +30% 的候选，数值保持现行效果。
2. **毒刃**：现行 LV2、LV3 还分别将准备间隔缩短至 8 秒与 6 秒。候选保留这项升级收益，并补明 LV1 由下一次攻击施毒。
3. **死门**：现行说明中的“攻击可转化灰血”实际是渴血提供新增受损生命。候选写成“攻击可额外获得受损生命”。
4. **裂隙吞噬**：现行说明未写 首领 限制，实际吞噬排除 首领。候选明确写“非首领 敌人”。

---

## 普通擢升
'''
parts = [intro]
for i, c in enumerate(proposal['base'], 1):
    parts.append(f"\n### {i:03d} · {c['name']}\n\n")
    parts.extend(f'- LV{level}：{value}\n' for level, value in enumerate(c['levels'], 1))
parts.append('\n---\n\n## 双重擢升\n')
for i, c in enumerate(proposal['dual'], 1):
    parts.append(f"\n### {i:03d} · {c['name']}\n\n")
    parts.append(f"前置：{'＋'.join(c['parentNames'])}\n\n{c['description']}\n")
parts.append(f'''
---

## 核对结果

- 全量覆盖 142 项普通擢升、311 项双重擢升，名称、顺序与前置均取自当前注册表。
- {adoption_summary}
- 已落实隐身冷却、连续下劈递增、汲魂系列增强与重锋裂胄数值调整；玩家文本统一使用“首领”。名称与前置未改。
- 恢复生命损伤与新增受损生命已分别表达，玩家正文中没有“灰血”或 DOT 等实现术语。
- 复杂效果仍保留触发动作、主要收益、关键限制与等级成长；取舍掉的细部数值可在结构化对照文件中查阅。
''')
report = ''.join(parts)
report_path = HERE / f'擢升与双重擢升_玩家文本候选_{DATE}.md'
json_path = HERE / f'擢升与双重擢升_玩家文本候选_{DATE}.json'
report_path.write_text(report, encoding='utf-8')
json_path.write_text(json.dumps(proposal, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')

saved = report_path.read_text(encoding='utf-8')
assert len(re.findall(r'^### \d{3} · ', saved, re.M)) == 453
assert len(re.findall(r'^- LV[123]：', saved, re.M)) == 426
assert len(re.findall(r'^前置：', saved, re.M)) == 311
assert '\ufffd' not in saved
assert json.loads(json_path.read_text(encoding='utf-8')) == proposal
for c in proposal['base']:
    if c['id'] in approved:
        assert c['levels'] == approved[c['id']] == c['sourceLevels'], c['id']
for c in proposal['dual']:
    if c['id'] in approved_dual:
        assert c['description'] == approved_dual[c['id']] == c['sourceDescription'], c['id']
print('PASS: 453 cards, 426 rank texts, 311 dual texts; names, IDs and parents aligned.')
print('Candidate:', report_path)
print('Source comparison:', json_path)
