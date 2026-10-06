"""Build the editorial proposal from hand-written rows and the final runtime registry."""
import json
from collections import Counter, defaultdict
from pathlib import Path

HERE = Path(__file__).resolve().parent
registry = json.loads((HERE / '擢升命名扫描_当前注册表.json').read_text(encoding='utf-8'))

def read_rows(filename):
    result = {}
    for line in (HERE / filename).read_text(encoding='utf-8').splitlines():
        if not line.strip() or line.startswith('#'):
            continue
        fields = line.split('|')
        assert len(fields) == 5, (filename, line)
        card_id, assessment, mechanism, names, reason = fields
        assert card_id not in result, card_id
        candidates = names.split('／')
        assert 1 <= len(candidates) <= 5, card_id
        assert len(candidates) == len(set(candidates)), card_id
        assert assessment in {'保留', '可选', '优先'}, card_id
        result[card_id] = dict(assessment=assessment, mechanism=mechanism,
                               candidates=candidates, rationale=reason)
    return result

base_rows = read_rows('擢升命名候选_基础数据.txt')
dual_rows = read_rows('擢升命名候选_双重数据.txt')

# Final editorial corrections. Exact IDs make this independent of previous name edits.
corrections = '''
thorns|保留|减伤、近战反伤与流血|荆棘护甲|成熟反伤意象；可联想《空洞骑士》Thorns of Agony 的受伤反击，本作主要反伤攻击者并附加流血。
rage|可选|受击延长无敌，增加战意与爆发机会|怒意／幼虫之歌|原名已很贴；第二项借《空洞骑士》Grubsong 的受伤获得灵魂资源，本作换成战意并额外增强受击保护。
battleFormation|可选|静止后增伤、暴击、格挡和防御|据守／战阵／定势|据守更符合单人站稳后强化；战阵有气势但容易使人预期多人布阵，也避免用架势与已有战斗资源混名。
hiddenEdge|保留|格挡积累强化，下一击追踪与斩杀|藏锋|积蓄后发的剑术意味准确，也符合格挡储层再出手。
heavyRecoil|优先|对强敌完美格挡反震，冲击周围架势|强敌反制／重敌反震／撼甲／重势反震|强敌反制突出精英与首领条件；重敌反震略有招式味，原名也可保留但辨识度一般。
iceBarrier|可选|护盾大幅减伤，破碎后冻伤与冻结|冰甲／寒冰护盾|《Dead Cells》Ice Armor 同为一次护甲保护后冻结附近敌人；本作主要减伤并附冻伤，冰甲更短且有准确的独立游戏联想。
d42|优先|汲魂伤害提高并治疗，饮血命中治疗增多|魂血双收／汲魂饮血／噬魂者／吸个够／两份滋补|首项区分两类治疗；噬魂者借《Vampire Survivors》Soul Eater 的范围攻击与吸取生命主题，本作需蓄力且附重击收益。
d55|优先|普攻百分比附伤也继承暴击倍率|要害加倍／附伤暴击／狠下第一刀／致命开场|首刀定命像必定斩杀，实际是附伤可暴击；首项偏战斗语气，第二项最清楚，后两项突出先手父卡。
d116|可选|子弹时间临时生成额外球，结束全部激发|超频／混沌／临时扩容|超频贴临时突破上限；混沌借《Slay the Spire》Chaos 的随机生成充能球，比该作Overclock更贴本效果；本作还有定时集中激发。
d125|优先|提高死刑宣告的持续伤害|加重判罚／重刑／毒性判决／宣判加码|终末疫苗把伤害强化叫疫苗容易误导为防护；首项表明宣告伤害更重，避免用追加刑期暗示延长持续时间。
d159|優先|狂牛撞飞目标立即变球，首层必继续撞飞|全倒／蛮牛保龄球／人肉球道／连撞开局|狂牛滚阵仍是父卡拼接；全倒借保龄球Strike的喊法，仅表达连撞画面，不保证全场敌人都被击飞。
d176|优先|催化剂斩杀宣告目标后爆炸并治疗|临终反应／催化爆亡／判决爆破／死因|终末催化偏抽象；临终反应既指死亡触发的爆炸也延续催化体系，死因是更短的黑色幽默次选。
d200|优先|狂暴雷灵额外暴击倍率与一次弹射|雷灵过载／雷灵暴击／强弧闪电／狂雷|极化没有实际物理机制支撑；雷灵过载像伙伴短时变强，其他项突出暴击、连锁与狂暴。
d214|优先|藤蔓目标的催化剂预测斩杀线翻倍|缠住催命／缚住算总账／藤上无生／伤势倍算|缠命催化偏抽象；新名聚焦被缠目标的斩杀预测增强，不把所有持续伤害误写成毒性增加。
d230|优先|第四击迎击成功释放强化剑气|接刀飞气／交锋剑气／迎击剑波／一挡一斩|迎锋剑罡的罡既未作为独立实体，也重复锋；新名突出迎击触发剑气。
d258|优先|敌人出生时先留下暗伤，后续按机制引爆|生来带伤／旧账上门／命里有伤／先记一伤|宿命暗伤抽象；首项最直白，旧账上门与伤害记账主题一致但多一些戏谑。
d263|优先|环刃命中少量目标时更强并附百分比伤害|少而致命／小圈狠手／专敌环刃／环刃专注|孤锋回环抽象，孤也不等于最多三人；首项明确少目标更强，不用单挑暗示只对一人有效。
d271|优先|利用破绽时额外增伤、削势并获得经验|破绽心得／拆招学艺／见隙得益／吃一堑，敌长一智|析隙得悟绕口；首项短而准确，最后一项故意反转成语，较长但可以作为幽默方案。
d286|保留|周期随机处决一个普通目标，恐惧周围|粉碎之手|手部实体与粗暴处决匹配，具体有力；不在没有证据时补认某作官方技能名。
d290|优先|满共振格挡造成范围重创与低血破势|震慑四方／共振震慑／一挡震场／杀意回震|满鸣杀域不是自然词；震慑四方对应范围伤害与架势压制，其他项分别突出资源、防御行为和杀意。
d292|优先|蓄力越长空间斩越多，满蓄四条|一斩多隙／蓄力裂斩／四道裂口／裂空四式|蓄锋裂空与大量锋、裂、空同构；首项说明长蓄多道切割，数量名只在满蓄时完整成立。
d294|优先|巨型剑气每命中一人独立判定空间斩|剑气留隙／一气多裂／贯穿裂斩／裂隙沿锋|剑气裂空和空间斩几乎重复；新名突出每个穿透命中都能追加空间切割机会，仍是独立概率判定。
d295|优先|处决路径留豁口，突进结束后引爆|处刑裂线／斩后留隙／突袭裂痕／路径爆斩|阿尔法裂隙把前缀硬接到裂隙；首项与剑气留隙的动作区分更明显，表现连续处决留下的轨迹。
d297|优先|格挡武装下次冲刺，路径裂隙延迟爆炸|借刀开路／黑暗艺术／冲过再斩／裂隙后手|首项把借力用于开路；黑暗艺术借《以撒的结合》Dark Arts的穿过目标后统一结算伤害，本作需先格挡且表现为空间豁口。
d53|优先|滑铲突刺直接触发狂牛撞击震爆|蛮牛滑铲／冲撞突刺／铲翻一片／犁地|犁阵突袭混合三个动作；首项把撞击与滑铲组合成招式，不用全场一类词夸大实际范围。
d75|优先|元素暴击刷新全部持续伤害时长|旧伤复发／再续一轮／元素续期／伤势刷新|元素校准听不出延长状态；旧伤复发有身体感，也避免用续燃使人误以为只刷新燃烧。
d81|优先|反射投射物额外生成三道小剑气|附赠三剑／反射剑气／一还三／飞刃奉还|反刃飞虹增加无依据的虹；首项准确说明原反射之外再附送三道剑气。
d123|可选|飞剑优先追受控目标，攻速与生命伤害提高|乘隙飞剑／飞剑紧逼／剑灵补刀|原名的父卡组合依然可读，可以保留；不采用动不了等绝对措辞，因为受控目标也包括仍可移动的减速敌人。
d133|优先|处决必定额外生成多把魂刃|魂刃遗赠／行刑遗刃／斩后余魂／刃从尸出|处刑出魂语序生硬；魂刃遗赠把处决后的亡魂武器当作死者留下的危险礼物。
d135|优先|爆发命中越多人，回血与减伤越多|越吼越勇／众敌壮胆／以众养勇／战吼护身|万军只是夸数量；越吼越勇自然表达对多人吼击之后恢复与自保更强。
d144|可选|爆发与重击余震不再降低伤害|余震不减／不衰余震／再来一遍|新增的是重复攻击保留威力；不采用原样奉还作为首选，避免被误读为反弹敌方攻击。
d156|优先|概率将整次真实伤害转为灰血|可愈之伤／暂记一笔／延缓伤势／吐故纳新|吐故纳伤是改成语但难解释；可愈之伤说明永久损失被改为能够恢复的灰血，不承诺不受伤。
d159|优先|狂牛撞飞目标立即变球，首层必继续撞飞|人肉球道／蛮牛保龄球／全倒／连撞开局|狂牛滚阵仍是父卡拼接；人肉球道有具体场面。全倒借保龄球Strike喊法，只表达连撞趣味，不保证全场击飞。
d173|优先|封印期间鬼手每秒追加攻击|缚住再打／锁内鬼手／鬼手加刑／动不了也躲不了|锁魂鬼掌更像新招式；首项短而清楚，最后一项更口语但较长，需要在卡面检视换行。
d182|优先|自然回血同时自然恢复等量灰血|伤愈不停／双重恢复／生机回流／灰血长息|生息归灰像生命变灰血，实际相反；首项也强调刚受伤仍可依这一路径恢复。
d209|优先|非流血持续伤害也提供弱化血潮治疗|以伤为药／诸伤回流／众毒养血／痛楚回补|百毒忽略了火、冻伤和精神伤害；以伤为药概括把敌人的各种持续伤害转化为自己的治疗。
d230|优先|第四击迎击成功释放强化剑气|迎击剑气／交锋剑气／接刀飞气／一挡一斩|迎锋剑罡的罡未作为独立实体；迎击剑气最清楚，其他项更偏组合关系或招式画面。
d247|优先|余势首击强化追踪与踏步，大幅增伤|乘势上前／余力紧逼／重击之后／后手追击|余势探隙的探隙不明确；新名说明上一招之后迅速跟进，并避免把后手误读为格挡条件。
d251|可选|进入冥想叠满游刃，静止时不衰减|从容入定／冥想游刃／以静养刃|原名是两个父卡拼接但可读；从容入定既是自然修习动作，也呼应游刃满层带来的从容。
d265|可选|下劈命中时在命中点追加环刃|下劈刀轮／骨钉回斩／钉落刃开|首项写清向下命中后出现环形刀轮；原名保留骨钉专名与回斩感觉，也可以沿用。
d273|优先|进入隐身时幽影转为强追魂攻击|暗影交班／影替出击／一人退，一影进／藏身留手|影遁追魂套常用词；交班突出自己隐身、替身出击，避开把留手误当首选而暗示手下留情。
armorRend|优先|第四击、突刺和重击破甲，提高架势易伤|裂甲／破甲重击／凿甲／破坚|重锋裂胄生僻又与大量锋、裂重叠；裂甲简洁，并覆盖第四击、突刺和重击，不只局限重击。
delayedWound|优先|攻击积暗伤，目标破势、被完美格挡或击飞时引爆|暗伤／迟来的痛／延迟伤害／后劲／迟发之伤|伤在后发的语序不自然；暗伤沿用实际状态，迟来的痛更有余味。触发是特定事件，不是单纯等时间。
'''.strip().replace('|優先|', '|优先|')
for line in corrections.splitlines():
    card_id, assessment, mechanism, names, reason = line.split('|')
    rows = dual_rows if card_id.startswith('d') and card_id[1:].isdigit() else base_rows
    assert card_id in rows
    rows[card_id] = dict(assessment=assessment, mechanism=mechanism,
                        candidates=names.split('／'), rationale=reason)

assert set(base_rows) == {c['id'] for c in registry['base']}
assert set(dual_rows) == {c['id'] for c in registry['dual']}
assert len(registry['base']) == 142 and len(registry['dual']) == 311
cards = []
for kind, rows in [('base', base_rows), ('dual', dual_rows)]:
    for number, source in enumerate(registry[kind], 1):
        card = {**source, **rows[source['id']], 'kind': kind, 'number': number}
        card['recommended'] = card['candidates'][0]
        assert 1 <= len(card['candidates']) <= 5, card['id']
        assert len(set(card['candidates'])) == len(card['candidates']), card['id']
        assert all(n and n == n.strip() for n in card['candidates']), card['id']
        cards.append(card)

recommendations = defaultdict(list)
for card in cards:
    recommendations[card['recommended']].append(card['id'])
duplicates = {n: ids for n, ids in recommendations.items() if len(ids) > 1}
assert not duplicates, f'Duplicate recommended names: {duplicates}'
all_candidates = defaultdict(list)
for card in cards:
    for name in card['candidates']:
        all_candidates[name].append(card['id'])
candidate_duplicates = {n: ids for n, ids in all_candidates.items() if len(ids) > 1}
assert not candidate_duplicates, f'Duplicate candidate names: {candidate_duplicates}'

current_names = defaultdict(list)
for card in cards:
    current_names[card['name']].append(card['id'])
conflicts = []
for card in cards:
    for name in card['candidates']:
        foreign = [i for i in current_names.get(name, []) if i != card['id']]
        if foreign:
            conflicts.append(dict(id=card['id'], candidate=name, currentOwner=foreign))

stats = {
    'base': len(registry['base']), 'dual': len(registry['dual']), 'total': len(cards),
    'candidates': sum(len(c['candidates']) for c in cards),
    'assessment': dict(Counter(c['assessment'] for c in cards)),
    'recommendedChanges': sum(c['recommended'] != c['name'] for c in cards),
    'perKind': {kind: dict(Counter(c['assessment'] for c in cards if c['kind'] == kind))
                for kind in ['base', 'dual']},
    'candidateCountDistribution': dict(Counter(len(c['candidates']) for c in cards)),
    'candidateCurrentNameConflicts': conflicts,
}

by_id = {c['id']: c for c in cards}
priority_ids = ['peakTiming', 'guardVitality', 'precision', 'delayedWound',
                'refinement', 'swiftBlade', 'attackSwordSpirit', 'armorRend',
                'd12', 'd43', 'd115', 'd125', 'd98', 'd259', 'd271', 'd307',
                'd107', 'd214', 'd266', 'd311']

intro = f'''# 擢升与双重擢升：全量命名候选 · 2026-10-02

已逐项审阅游戏最终注册的 **142 个擢升、311 个双重擢升，共 453 项**，提供 **{stats['candidates']} 个候选**。每项 1–5 个，首项是我的推荐。候选包括值得保留的现名，不是每项都强行改名。

数据依据为 `ascensions.js` 经全部覆盖与修正后的最终注册表，读取时连同 `systems.js`、`motion.js`、`boss.js`、`enemy_catalog.js`、`combat.js` 在隔离上下文加载。未改游戏名称、数值、关系或存档；这是供定稿的编辑提案。名称本身之外的副标题与长效果说明仅作为判断依据，本轮没有替它们改稿。

阅读标记：

- **保留**：现名已经准确、自然或有很好的辨识度，通常只给现名 1 个。
- **可选**：可以沿用，但存在更顺、更清楚或更贴梗的方案，通常给 2–3 个。
- **优先**：存在生硬、尺度过大、撞语汇或效果误导，通常给 4–5 个；并非必须一次全改。
- 候选从左到右大致按推荐程度排序。第一项偏最终可用名；其他候选会在直白、武学、器物、黑色幽默或借梗之间提供取舍，不承诺统一采用同一种口味。

评估结果：**{stats['assessment'].get('保留', 0)} 项建议保留、{stats['assessment'].get('可选', 0)} 项可选润色、{stats['assessment'].get('优先', 0)} 项优先改名**。首选方案共提出 {stats['recommendedChanges']} 个改名建议，其余首选为现名。

## 先看这 20 项

这组最能看出本轮改名方向，也包含效果与名称有明显落差的条目。全量候选仍在后面的 453 项表中。

| 当前名 | 首选 | 关键原因 |
| --- | --- | --- |
'''
for card_id in priority_ids:
    c = by_id[card_id]
    intro += f"| {c['name']} | **{c['recommended']}** | {c['rationale']} |\n"

intro += '''
## 命名方向

普通擢升优先让玩家认出动作、状态、实体或成长方向，例如震刀、毒刃、藏锋、暗伤。双重擢升可以比父卡更有个性，但最好把新效果变成一个新的物件、动作、结果或笑点，例如骨本回收、怀表、火上浇油、随身书房，而不是继续把两张父卡各截两个字拼起来。

本作已经有剑术、元素、亡灵、机械与玩梗混搭的语气，不必把所有名字都压成纯武侠。真正应控制的是意义重复与强度预告：有限回血不宜叫永恒；扩大一点范围不必叫冻世；额外一次选择无需称生死逆转。放松这种尺度后，强力特效和特殊道具的名字才有发挥空间。

暗伤系列适合统一为“记账—欠债—清算”的黑色幽默体系；格挡系列统一使用接刀、迎击、反震与奉还；风势系列保持御风、顺风、风助火势等自然词；空间斩系列重点区分蓄力多斩、剑气多目标、处决轨迹、格挡触发和冲刺延时。统一的是关联，不必让每张都采用相同字数。

“锋利之影、巨人杀手、保龄球、敲钟、骨本回收、天雷地火、怀表、吸积盘、便携烹饪锅、星之彩”等已有名字值得保留，分别凭借明确动作、具体物件、机制双关或有依据的意象获得辨识度。

## 全部普通擢升

机制列是为了判断名称写的简述，不作为替换游戏数值文本的正式效果说明。完整的当前各级效果与副标题见同目录的《擢升命名候选_效果对照_2026-10-02.md》，按 ID 可一一查找。
'''

def table(group, dual=False):
    if dual:
        text = '| ID · 当前名 | 当前前置 | 评估 | 机制摘要 | 候选（首项推荐） | 判断与借梗 |\n| --- | --- | --- | --- | --- | --- |\n'
    else:
        text = '| ID · 当前名 | 评估 | 机制摘要 | 候选（首项推荐） | 判断与借梗 |\n| --- | --- | --- | --- | --- |\n'
    for c in group:
        names = '；'.join((f"**{n}**" if i == 0 else n) for i, n in enumerate(c['candidates']))
        cells = [f"`{c['id']}` · {c['name']}"]
        if dual:
            cells.append('＋'.join(c['parentNames']))
        cells += [c['assessment'], c['mechanism'], names, c['rationale']]
        text += '| ' + ' | '.join(cells) + ' |\n'
    return text

report = intro
base_cards = [c for c in cards if c['kind'] == 'base']
dual_cards = [c for c in cards if c['kind'] == 'dual']
for start in range(0, len(base_cards), 36):
    end = min(start + 36, len(base_cards))
    report += f'\n### 普通 {start + 1}–{end}\n\n' + table(base_cards[start:end])
report += '\n## 全部双重擢升\n\n前置统一显示当前游戏名，便于按现有构筑查找。父卡改名后应在正式落地时同步引用，本轮先保留实际前置供对照。\n'
for start in range(0, len(dual_cards), 40):
    end = min(start + 40, len(dual_cards))
    report += f'\n### 双重 {start + 1}–{end}\n\n' + table(dual_cards[start:end], True)

appendix_path = HERE / '擢升命名候选_编辑附记.md'
if appendix_path.exists():
    report += '\n' + appendix_path.read_text(encoding='utf-8')

report += f'''\n## 覆盖与一致性检查

- 最终注册表普通 {stats['base']} 项、双重 {stats['dual']} 项，本表逐 ID 完整覆盖，共 {stats['total']} 项；没有多余或重复 ID。
- 每项均有 1–5 个候选，同一条目内没有重复候选；全部 {stats['candidates']} 个候选均来自逐项撰写。
- 453 个首选名称之间没有重名；全部 {stats['candidates']} 个候选跨条目也没有完全相同的重名，并且没有占用其他条目当前的名称。近似语感仍按系列讨论保留取舍，不将其等同于字面重名。
- 每个双重的前置、现名与最终注册表保持一致；完整等级文本、描述与详情保存在效果对照与结构化 JSON 中。
- 游戏代码保持原状。本轮验证的是目录、名称候选与引用一致性，没有运行与改名提案无关的战斗回归。
'''

report_path = HERE / '擢升与双重擢升_全量命名候选_2026-10-02.md'
report_path.write_text(report, encoding='utf-8')

details = '''# 擢升命名候选：完整效果对照 · 2026-10-02

与全量命名候选报告同源，保留当前全部效果文本。候选的第一项为推荐，原游戏尚未修改。可按 ID 搜索定位。
'''
for c in cards:
    details += f"\n## {c['id']} · {c['name']}\n\n"
    if c['kind'] == 'base':
        details += f"当前副标题：{c['subtitle']}。\n\n"
        for level, effect in enumerate(c['levels'], 1):
            details += f'- LV{level}：{effect}\n'
    else:
        details += f"当前前置：{'＋'.join(c['parentNames'])}（均 LV3）。\n\n{c['description']}\n"
        if c.get('detail') != c['description']:
            details += '\n补充详情：' + c['detail'] + '\n'
    details += f"\n评估：{c['assessment']}。候选：" + '；'.join(c['candidates']) + '。\n\n' + c['rationale'] + '\n'
(HERE / '擢升命名候选_效果对照_2026-10-02.md').write_text(details, encoding='utf-8')
(HERE / '擢升命名候选_2026-10-02.json').write_text(json.dumps({
    'date': '2026-10-02', 'status': 'editorial_proposal_not_applied',
    'source': registry['source'], 'firstCandidateIsRecommended': True,
    'statistics': stats, 'cards': cards,
}, ensure_ascii=False, indent=2), encoding='utf-8')

# Validate the delivered artifacts, not just the input rows.
saved_report = report_path.read_text(encoding='utf-8')
saved_details = (HERE / '擢升命名候选_效果对照_2026-10-02.md').read_text(encoding='utf-8')
saved_data = json.loads((HERE / '擢升命名候选_2026-10-02.json').read_text(encoding='utf-8'))
ids = [c['id'] for c in cards]
table_ids = [line.split('`')[1] for line in saved_report.splitlines()
             if line.startswith('| `') and '` · ' in line]
detail_ids = [line.split(' · ')[0][3:] for line in saved_details.splitlines()
              if line.startswith('## ') and ' · ' in line]
assert table_ids == ids == detail_ids
assert len(table_ids) == len(detail_ids) == 453
assert f"{stats['candidates']} 个候选" in saved_report
assert saved_data['cards'] == cards
source_by_id = {c['id']: c for c in registry['base'] + registry['dual']}
for c in saved_data['cards']:
    for key, value in source_by_id[c['id']].items():
        assert c[key] == value, (c['id'], key)
assert sum(line.startswith(('- LV1：', '- LV2：', '- LV3：'))
           for line in saved_details.splitlines()) == 426
assert '\ufffd' not in saved_report + saved_details

print(json.dumps(stats, ensure_ascii=False, indent=2))
print(f'Report: {report_path}')
print('PASS: 453 IDs; all candidates unique; 426 rank descriptions preserved; report/JSON/details consistent; UTF-8 clean.')
