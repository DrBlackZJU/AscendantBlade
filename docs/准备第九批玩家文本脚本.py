"""以第八批的文档同步流程生成独立第九批脚本，不执行历史批次。"""
from pathlib import Path
import json

HERE = Path(__file__).resolve().parent
s = (HERE / '落实第八批擢升玩家文本.py').read_text(encoding='utf-8')
s = s.replace('同步双重110–199及081修订；200以后仍保留候选。', '同步双重200–311；全部玩家文本确认完成。')
s = s.replace('第八批', '第九批').replace('batch eight', 'batch nine').replace('BATCH_EIGHT', 'BATCH_NINE')
s = s.replace("before['dual'][109:199]", "before['dual'][199:311]")
overrides = {
    'd203': '重击击杀时，按过杀伤害的4%额外恢复生命与生命损伤，最多10。',
    'd205': '对敌人触发先发制人时，给敌人留下3秒临时赏金，及时击杀获得35%赏金奖励。',
    'd207': '尸爆总是施加中毒，每秒造成15伤害，持续6秒，并有30%概率向附近最多两名敌人传播瘟疫。',
    'd211': '奔袭撞击额外引发火焰爆炸，造成50伤害与30架势伤害，并点燃4秒。',
    'd215': '处决生成魂刃。连续处决时，魂刃悬停蓄力，并在结束后一齐射向剩余敌人。',
    'd217': '冲刺清除5点闪避疲劳。成功闪避使冲刺冷却缩短0.3秒。',
    'd219': '进入祝圣领域后将其点燃。点燃的领域每秒额外恢复0.4生命，持续灼伤敌人，并施加更猛烈的燃烧。',
    'd220': '对赏金目标的暗伤积累量+40%。赏金目标的暗伤足以致死时，立即引爆。',
    'd227': '当敌人死于诅咒时，额外获得2层行刑。',
    'd239': '时空封锁优先选择赏金目标，封锁结束时将其永久放逐。',
    'd242': '冲刺不再打断静止生效的效果。',
    'd243': '保持静止时，每秒不断积蓄风势。',
    'd250': '当风势足够时，攻击额外释放旋风，造成70伤害与90架势伤害。每第3次旋风更加强悍。',
    'd254': '持续伤害快速触发，生效速度翻倍，持续时间减半。',
    'd255': '从召唤物能力中修习技艺，召唤物击杀同样获得技巧击杀奖励。',
    'd256': '骷髅优先追击附近的赏金目标，持续时间+30%。',
    'd263': '环刃命中不超过3名敌人时，伤害+30%，架势伤害+18%，并额外造成目标1.8%最大生命值的伤害。',
    'd264': '冲刺沿路径释放3次60%效能的环刃。',
    'd267': '成功闪避时，额外释放一次80%效能的环刃。这个效果有0.38秒的冷却时间。',
    'd269': '心灵控制的敌人死亡时，留下强化尸爆，范围更大，基础伤害提升至96伤害和58架势伤害，并随机施加更强的持续伤害效果。',
    'd271': '利用破绽时，伤害与架势伤害额外+10%，并额外获得该敌人所提供经验的3%。',
    'd277': '完美格挡链接目标时，所有同组链接敌人额外损失架势，相当于20外加其最大架势值的5%。',
    'd280': '靠近黑洞中心时，延长黑洞持续时间0.85秒，并使其跟随你移动。',
    'd281': '岩石突刺命中留下岩钉。破甲攻击或架势破坏将引爆岩钉，重创目标52外加10%的最大架势值，并对周围敌人造成55%的效果。',
    'd283': '连击的第一击将保留风势，第二击将消耗风势，快速突进，攻击范围扩大，突进期间短暂闪过敌人攻击。',
    'd285': '每次升级时，屏幕内每名敌人有80%概率遭受厄运。',
    'd286': '每7.2秒鬼手随机捏爆一名非首领敌人，并恐惧周围敌人2.6秒。',
    'd288': '获得一个额外的赏金标记，这个赏金标记只会标记非人形敌人。',
    'd289': '触发先发制人留下1秒猎杀印记。印记期间，敌人生命低于30%时立即被斩杀。',
    'd290': '共振满层时，完美格挡对周围敌人造成26外加最大生命值9%的伤害，并破坏生命不高于28%的敌人的架势。',
    'd293': '重击可命中时空封锁中的敌人，将其立即放逐，并触发空间斩。',
    'd295': '处决突进沿途留下空间裂口，结束时一齐引爆，造成75伤害。',
    'd296': '空间斩额外造成36架势伤害。完美格挡也会触发一次空间斩。',
    'd297': '格挡后，下一次冲刺沿路径留下空间裂口，冲刺结束后延迟0.3秒一齐引爆，造成75伤害。',
    'd298': '合并的大龙卷持续减速卷入的敌人，使其移速降为48%；每0.6秒积累一层霜痕，触发冻伤与冻结。',
    'd302': '俯冲攻击生命不高于60%的敌人时，伤害+80%，且斩杀生命低于15%的敌人。',
    'd303': '普通格挡使俯冲轰炸冷却缩短0.75秒，完美格挡缩短1.5秒。',
}
start = s.index('rows.update({')
end = s.index('assert all(text.endswith', start)
s = s[:start] + 'rows.update(' + json.dumps(overrides, ensure_ascii=False, indent=4) + ')\n' + "names = {'d219': '圣火'}\nassert set(rows) == {f'd{n}' for n in range(200, 312)}\n" + s[end:]
s = s.replace('(duals 110–199 and 081 revision)', '(duals 200–311)')
s = s.replace('assert dual_count == 201', 'assert dual_count == 311')
start = s.index('batch = {')
end = s.index('save_json(DOCS /', start)
batch = {
    'date': '2026-10-03', 'status': 'applied', 'dualNumbers': [200, 311], 'dualCount': 112, 'newDualCount': 110,
    'namesById': {'d219': '圣火'},
    'mechanics': {'temporaryBountyRewardFraction': .35, 'fireBullExplosion': [50, 30],
                 'dashFatigueRecovery': 5, 'evasionDashCooldownReduction': .3,
                 'curseDeathExecutionerStacks': 2, 'windCycloneStrengthenedEvery': 3,
                 'ringFewTargetsMaxHPDamage': .018, 'ringFewTargetsBossMaxHPDamage': .008,
                 'dashRingPower': .60, 'evasionRingPower': .80, 'evasionRingCooldown': .38,
                 'strongCorpseExplosion': [96, 58], 'strongCorpseDotDPS': 15,
                 'flawEnemyBaseXPRewardFraction': .03, 'flawBossXPRewardFraction': 0,
                 'soulParryPosture': [20, .05], 'soulParryBossFraction': .02,
                 'rockNailSplashFraction': .55, 'levelDoomChance': .80,
                 'frostStormMovementFactor': .48, 'frostStormStackInterval': .6},
}
batch_block = 'batch = ' + repr(batch) + '\nbatch["dualDescriptionsById"] = rows\n'
s = s[:start] + batch_block + s[end:]
old = "parts = [f'# 双重擢升玩家文本第九批定稿 · {DATE}\\n\\n110–199共90项已写入游戏，其中147此前已采用，本批新增89项定稿。081描述同步修订。累计{dual_count}项双重已采用，剩余{pending_count}项待审，从200继续。\\n\\n改名：原剥皮改为猎杀野兽，131改为剥皮，150改为龙裔血脉。152每次提高5%、最多提高25%，首领仍按三分之一计算，玩家文本不列出。\\n']"
new = "parts = [f'# 双重擢升玩家文本第九批定稿 · {DATE}\\n\\n200–311共112项已写入游戏，其中226、246此前已采用，本批新增110项定稿。219更名为圣火。全部142项普通擢升与311项双重擢升玩家文本已定稿。\\n']"
assert old in s
s = s.replace(old, new).replace('if number == 81 or 110 <= number <= 199:', 'if 200 <= number <= 311:')
s = s.replace('其余{pending_count}项双重仍待确认。', '全部玩家文本均已确认。')
s = s.replace('**双重{dual_count}项已采用，其余{pending_count}项仍为候选。**', '**全部{dual_count}项双重已采用。**')
s = s.replace('已采用条目标注状态，其他条目仍待审阅。', '全部条目标注已采用状态。')
s = s.replace('duals 110–199 adopted', 'duals 200–311 adopted')
(HERE / '落实第九批擢升玩家文本.py').write_bytes(s.encode('utf-8'))
print('PASS batch-nine document script prepared')
