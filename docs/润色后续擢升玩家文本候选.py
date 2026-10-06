"""只整理未定稿玩家文本；保留已确认文本，并验证游戏源码没有变化。"""
from pathlib import Path
import hashlib
import json
import re
import subprocess
import sys

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent
DATE = '2026-10-02'
REVISION_DATE = '2026-10-03'
baseline = json.loads((HERE / f'擢升玩家文本后续润色前_{DATE}.json').read_text(encoding='utf-8'))
registry = json.loads((HERE / f'擢升当前注册表_{DATE}.json').read_text(encoding='utf-8'))
approval = json.loads((HERE / f'擢升玩家文本已定稿_{DATE}.json').read_text(encoding='utf-8'))


def game_source_hashes():
    return {name: hashlib.sha256((ROOT / name).read_bytes()).hexdigest()
            for name in baseline['gameFileSha256']}


def check_review_sources():
    assert game_source_hashes() == reviewed_sources, 'Source changed during document generation; rerun against the latest version.'


def rows_from_text(text, columns):
    result = {}
    for line in text.splitlines():
        cells = line.split('|')
        assert len(cells) == columns, line
        identifier, *texts = cells
        assert identifier not in result, identifier
        assert all(t and t == t.strip() and t.endswith('。') for t in texts), identifier
        result[identifier] = texts
    return result


reviewed_sources = game_source_hashes()
source_changes = [name for name, value in reviewed_sources.items()
                  if value != baseline['gameFileSha256'][name]]
runtime_script = """
const fs=require('fs'),vm=require('vm'),c=vm.createContext({console});
for(const p of ['systems.js','motion.js','boss.js','enemy_catalog.js','combat.js','ascensions.js'])
  vm.runInContext(fs.readFileSync(p,'utf8'),c,{filename:p});
process.stdout.write(JSON.stringify({source:'ascensions.js final runtime registry',
  base:c.AshAscensions.ASCENSIONS,dual:c.AshAscensions.DUAL_ASCENSIONS}));
"""
latest_registry = json.loads(subprocess.check_output(['node', '-e', runtime_script], cwd=ROOT).decode('utf-8'))
assert latest_registry == registry, 'Runtime card metadata changed; recheck candidate mapping before generation.'
new_base = rows_from_text((HERE / f'擢升玩家文本后续润色_基础_{DATE}.txt').read_text(encoding='utf-8'), 4)
new_dual = rows_from_text((HERE / f'擢升玩家文本后续润色_双重_{DATE}.txt').read_text(encoding='utf-8'), 2)
assert len(new_base) == 48 and len(new_dual) == 306
assert set(new_base) == {c['id'] for c in registry['base'][94:]}
assert set(new_dual) == {c['id'] for c in registry['dual']} - set(approval['dualDescriptionsById'])
assert not set(new_base) & set(approval['levelsById'])
assert not set(new_dual) & set(approval['dualDescriptionsById'])

texts = [t for values in (*new_base.values(), *new_dual.values()) for t in values]
for forbidden in ('BOSS', '灰血', 'DOT', '递归', '周期器', '结算器', '实体', '代码', 'max(', 'min(', '\ufffd'):
    assert not any(forbidden in t for t in texts), forbidden

old_base = rows_from_text(baseline['baseCandidate'], 4)
old_dual = rows_from_text(baseline['dualCandidate'], 2)
for identifier, levels in approval['levelsById'].items():
    assert old_base[identifier] == levels, identifier
for identifier, description in approval['dualDescriptionsById'].items():
    assert old_dual[identifier] == [description], identifier

all_base = {**old_base, **new_base}
all_dual = {**old_dual, **new_dual}
for kind, source, values in [('基础', registry['base'], all_base), ('双重', registry['dual'], all_dual)]:
    data = '\n'.join('|'.join([c['id'], *values[c['id']]]) for c in source) + '\n'
    (HERE / f'擢升玩家文本候选_{kind}_{DATE}.txt').write_bytes(data.encode('utf-8'))

subprocess.run([sys.executable, str(HERE / '生成擢升玩家文本候选.py')], cwd=ROOT, check=True)

report_path = HERE / f'擢升与双重擢升_玩家文本候选_{DATE}.md'
report = report_path.read_text(encoding='utf-8')
report = report.replace(
    '后续审阅可从 **095 · 二重斩** 继续。',
    f'**后续 48 项普通擢升与 306 项双重擢升已于 {REVISION_DATE} 完成候选润色，本轮没有写入游戏。**')
report = report.replace('未写 首领 限制', '未写首领限制').replace('排除 首领', '排除首领').replace('非首领 敌人', '非首领敌人')
record_name = f'擢升玩家文本后续润色_代码核对记录_{REVISION_DATE}.md'
report += f'\n本轮候选与现行实现的差异见 [代码核对记录]({record_name})；核对记录不属于玩家卡面文本。\n'
report_path.write_bytes(report.encode('utf-8'))

comparison_path = HERE / f'擢升与双重擢升_玩家文本候选_{DATE}.json'
proposal = json.loads(comparison_path.read_text(encoding='utf-8'))
proposal['candidateRevision'] = {
    'date': REVISION_DATE,
    'status': 'candidate_revision_not_applied',
    'baseNumbers': [95, 142],
    'baseIds': list(new_base),
    'dualIds': list(new_dual),
    'counts': {'baseCards': 48, 'baseLevelTexts': 144, 'dualCards': 306, 'playerTexts': 450},
    'gameCodeModifiedByThisTask': False,
    'sourceFilesChangedDuringWork': source_changes,
    'reviewRecord': record_name,
}
proposal['editorialNotes'].append('后续候选按现行运行逻辑核对；数字简单时写明，复杂范围与公式只描述主要收益，实现差异另列核对记录。')
for c in proposal['base']:
    if c['id'] in new_base:
        assert c['status'] == 'candidate' and c['levels'] == new_base[c['id']]
    else:
        assert c['levels'] == approval['levelsById'][c['id']] == c['sourceLevels']
for c in proposal['dual']:
    if c['id'] in new_dual:
        assert c['status'] == 'candidate' and c['description'] == new_dual[c['id']][0]
    else:
        assert c['description'] == approval['dualDescriptionsById'][c['id']] == c['sourceDescription']
comparison_path.write_bytes((json.dumps(proposal, ensure_ascii=False, indent=2) + '\n').encode('utf-8'))

pending_parts = [f'''# 后续擢升与双重擢升：玩家文本候选 · {REVISION_DATE}

本稿仅列尚未定稿的 **095–142 共48项普通擢升、306项双重擢升**，已按此前确认的文风逐项润色。**全部为候选，未写入游戏。**

LV2、LV3沿用低等级仍有效的效果，主要写本级提升。伤害与触发概率采用基础数值；其他擢升、难度和目标状态可能改变实际结果。恢复生命损伤与额外获得受损生命分别表述，主动操作用“冲刺”，概率效果用“闪避”。双重擢升沿用全量稿编号，跳过已定稿的五项汲魂双重。

## 普通擢升（48项）
''']
for number, c in enumerate(registry['base'], 1):
    if c['id'] not in new_base:
        continue
    pending_parts.append(f"\n### {number:03d} · {c['name']}\n\n")
    pending_parts.extend(f'- LV{level}：{value}\n' for level, value in enumerate(new_base[c['id']], 1))
pending_parts.append('\n---\n\n## 双重擢升（306项）\n')
for number, c in enumerate(registry['dual'], 1):
    if c['id'] not in new_dual:
        continue
    pending_parts.append(f"\n### {number:03d} · {c['name']}\n\n")
    pending_parts.append(f"前置：{'＋'.join(c['parentNames'])}\n\n{new_dual[c['id']][0]}\n")
pending_parts.append(f'\n---\n\n编辑核对信息另见 [代码核对记录]({record_name})。\n')
pending = ''.join(pending_parts)
pending_path = HERE / f'后续擢升与双重擢升_玩家文本候选_{REVISION_DATE}.md'
pending_path.write_bytes(pending.encode('utf-8'))

assert len(re.findall(r'^### \d{3} · ', pending, re.M)) == 354
assert len(re.findall(r'^- LV[123]：', pending, re.M)) == 144
assert len(re.findall(r'^前置：', pending, re.M)) == 306
assert len(re.findall(r'^### \d{3} · ', report, re.M)) == 453
assert len(re.findall(r'^- LV[123]：', report, re.M)) == 426
assert len(re.findall(r'^前置：', report, re.M)) == 311
assert proposal['appliedBaseCount'] == 94 and proposal['appliedDualCount'] == 5
check_review_sources()
audit = {
    'date': REVISION_DATE,
    'status': 'candidate_revision_not_applied',
    'counts': proposal['candidateRevision']['counts'],
    'approvedCopyPreserved': {'baseCards': 94, 'dualCards': 5},
    'gameSourceFilesWrittenByThisTask': [],
    'sourceFilesChangedDuringWork': source_changes,
    'gameFileSha256AtTaskStart': baseline['gameFileSha256'],
    'reviewedGameFileSha256': reviewed_sources,
    'runtimeRegistryMatchesSnapshot': True,
    'checkedGameFileCount': len(baseline['gameFileSha256']),
    'documents': [pending_path.name, report_path.name, comparison_path.name, record_name],
    'runtimeProbes': ['d67 permanent-fear branch', 'd122 orb damage / player speed / summon count', 'd152 actual first / fifth plunge thresholds', 'd153 health growth and cap'],
}
(HERE / f'擢升玩家文本后续润色_核对结果_{REVISION_DATE}.json').write_bytes((json.dumps(audit, ensure_ascii=False, indent=2) + '\n').encode('utf-8'))
print('PASS: 48 pending base cards / 306 pending dual cards / 450 player texts; 99 approved cards preserved.')
print(f"PASS: {len(reviewed_sources)} source files consistent during generation; latest runtime registry matches snapshot.")
print('Game source files written by this task: 0. Source updates observed during work:', source_changes)
print('Pending review:', pending_path)
