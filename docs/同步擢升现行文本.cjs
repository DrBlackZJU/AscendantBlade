// Use the final runtime registry, including all balance and naming overlays.
const fs=require('node:fs'),vm=require('node:vm');
const sandbox={};vm.createContext(sandbox);
for(const filename of ['game.js','motion.js','boss.js','enemy.js','combat.js','ascensions.js'])
  vm.runInContext(fs.readFileSync(filename,'utf8'),sandbox,{filename});
const {ASCENSIONS,DUAL_ASCENSIONS}=sandbox.AshAscensions;
const registry={source:'ascensions.js final runtime registry',base:ASCENSIONS,dual:DUAL_ASCENSIONS};
fs.writeFileSync('docs/擢升当前注册表_2026-10-02.json',JSON.stringify(registry,null,2)+'\n');
let text='# 擢升与双重擢升当前游戏文本\n\n'+
  '本页直接从游戏最终注册表生成。数值以代码实现为准；效果仍可能受暴击、易伤、冷却缩减及其他擢升影响。\n\n'+
  '已同步五批合计 178 项改名及已确认的效果修改。最新定稿见 [第五批记录](擢升第五批命名定稿_2026-10-02.md)，候选及定稿状态见 [双重擢升候选现行修订](双重擢升候选_现行修订_2026-10-02.md)。\n\n'+
  '## 擢升（'+ASCENSIONS.length+' 项）\n';
for(const card of ASCENSIONS){
  text+='\n### '+card.name+'\n\n';
  for(let i=0;i<card.levels.length;i++)text+='- LV'+(i+1)+'：'+card.levels[i]+'\n';
}
text+='\n## 双重擢升（'+DUAL_ASCENSIONS.length+' 项）\n';
for(const card of DUAL_ASCENSIONS){
  text+='\n### '+card.name+'\n\n- 前置：'+card.parentNames.join('、')+'均达到 LV3\n'+
    '- 效果：'+card.description+'\n';
  if(card.detail&&card.detail!==card.description)text+='- 详情：'+card.detail+'\n';
}
fs.writeFileSync('docs/擢升与双重擢升当前游戏文本.md',text);
console.log('PASS current registry and player text synchronized: '+ASCENSIONS.length+' base / '+DUAL_ASCENSIONS.length+' dual');
