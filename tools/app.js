'use strict';
const $=id=>document.getElementById(id);
const translations={
 zh:{title:'手写排版',download:'下载字体',svg:'导出 SVG',png:'导出 PNG',content:'文字',natural:'自然排列',plain:'普通排版',scatter:'错落',variation:'大小变化',spacing:'字距',columns:'每行字数',shuffle:'换个排列',characters:'字库文字',preview:'排版预览',loading:'正在载入字库',loaded:'已导出',exporting:'正在导出',failed:'导出失败，请重试',missing:'字库还缺：',limit:'每幅最多 160 个字',empty:'请先输入字库内的文字',fontError:'字库加载失败，请刷新页面',insert:'插入',about:'项目说明',guide:'制作教程',version:'2500 字，三套笔形',language:'语言',samples:['回收一下','今天的天气','生活可爱','和朋友吃饭','春天去河边','小伙伴','窗前的茉莉','蝴蝶']},
 en:{title:'Handwriting layout',download:'Download font',svg:'Export SVG',png:'Export PNG',content:'Text',natural:'Natural',plain:'Regular',scatter:'Scatter',variation:'Size variation',spacing:'Spacing',columns:'Characters per line',shuffle:'Try another layout',characters:'Available characters',preview:'Preview',loading:'Loading font',loaded:'Exported',exporting:'Exporting',failed:'Export failed. Please try again.',missing:'Missing characters: ',limit:'Use up to 160 characters',empty:'Enter supported characters first',fontError:'Could not load the font. Please reload.',insert:'Insert ',about:'About the font',guide:'Making your own font',version:'2,500 Hanzi, three forms each',language:'Language',samples:['Reuse','Sunshine','Everyday','Dinner','Spring','Friends','Jasmine','Butterflies']},
 ja:{title:'手書きレイアウト',download:'フォントをダウンロード',svg:'SVG を保存',png:'PNG を保存',content:'テキスト',natural:'自然な配置',plain:'通常の配置',scatter:'位置の変化',variation:'サイズの変化',spacing:'字間',columns:'一行の文字数',shuffle:'配置を変える',characters:'収録文字',preview:'プレビュー',loading:'フォントを読み込み中',loaded:'保存しました',exporting:'保存中',failed:'保存できませんでした。もう一度お試しください。',missing:'未収録の文字：',limit:'160 文字以内で入力してください',empty:'収録文字を入力してください',fontError:'読み込めませんでした。再読み込みしてください。',insert:'挿入 ',about:'フォントについて',guide:'フォントの制作方法',version:'漢字 2500 字、各字 3 種の字形',language:'言語',samples:['回収','晴れの日','日常','食事','春','友達','ジャスミン','蝶']}
};
let lang=new URLSearchParams(location.search).get('lang')||'zh';if(!translations[lang])lang='zh';
const t=key=>translations[lang][key];
let seed=17,plain=false,current=null,fontReady=false;
const samples=['回收一下\n总有惊喜','今天的\n天气很好，\n太阳把影子\n晾晒在\n屋脊上','你好\n生活可爱\n月光很好\n春来花开','今天早回家\n和朋友吃饭\n明天去看花','春天去河边\n听鸟唱歌\n慢慢走回家','你好呀\n我的小伙伴\n哈哈笑着\n一起回家','窗前的茉莉\n悄悄开了花\n我把清晨\n轻轻捧回家','蝴蝶蝴蝶\n绕着花儿飞\n小猫躺着\n我也慢慢来'];
function localize(){
 document.documentElement.lang=lang==='zh'?'zh-CN':lang;document.title='kuraikura '+t('title');$('language').value=lang;$('language').setAttribute('aria-label',t('language'));
 document.querySelectorAll('[data-i18n]').forEach(el=>el.textContent=t(el.dataset.i18n));
 document.querySelectorAll('[data-sample]').forEach(el=>el.textContent=t('samples')[Number(el.dataset.sample)]);
 $('about').href='https://github.com/daafffodil/kuraikura/blob/main/'+({zh:'README.md',en:'README.en.md',ja:'README.ja.md'}[lang]);
 $('guide').href='https://github.com/daafffodil/handwriting-to-font/blob/main/'+({zh:'README.md',en:'README.en.md',ja:'README.ja.md'}[lang]);
 $('workspace').setAttribute('aria-label',t('preview'));$('characters').querySelectorAll('button').forEach(b=>b.setAttribute('aria-label',t('insert')+b.textContent));
 if(fontReady)update();else $('error').textContent=t('loading');
}
function options(){return {seed,plain,scatter:Number($('scatter').value)/100,sizeVariation:Number($('variation').value)/100,gap:Number($('spacing').value),columns:Number($('columns').value)};}
function errorMessage(e){return e.message.startsWith('字库还缺：')?t('missing')+e.message.slice(5):e.message.includes('160')?t('limit'):e.message;}
function update(){
 for(const id of ['scatter','variation','spacing','columns'])$(id+'Value').value=$(id).value;
 $('natural').setAttribute('aria-pressed',String(!plain));$('plain').setAttribute('aria-pressed',String(plain));
 for(const id of ['scatter','variation','reshuffle'])$(id).disabled=plain||!fontReady;
 if(!fontReady)return;
 try{current=Handwriting.compose($('content').value,DATA.glyphs,options());$('error').textContent='';$('paper').innerHTML=Handwriting.svg(current,DATA.glyphs,true);$('saveSvg').disabled=$('savePng').disabled=current.placements.length===0;}
 catch(e){current=null;$('error').textContent=errorMessage(e);$('paper').innerHTML='';$('saveSvg').disabled=$('savePng').disabled=true;}
}
let toastTimer;
function toast(text){$('toast').textContent=text;$('toast').classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').classList.remove('show'),2200);}
function download(blob,name){const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),10000);}
function exportSvg(){if(!current)throw Error(t('empty'));return Handwriting.svg(current,DATA.glyphs,false,DATA.license+'\n'+Object.values(DATA.licenseTexts).join('\n'));}
$('language').onchange=()=>{lang=$('language').value;const url=new URL(location.href);url.searchParams.set('lang',lang);try{history.replaceState(null,'',url);}catch{}localize();};
$('content').addEventListener('input',update);
for(const id of ['scatter','variation','spacing','columns'])$(id).addEventListener('input',update);
$('natural').onclick=()=>{plain=false;update();};$('plain').onclick=()=>{plain=true;update();};$('reshuffle').onclick=()=>{seed++;update();};
document.querySelectorAll('[data-sample]').forEach(b=>b.onclick=()=>{$('content').value=samples[Number(b.dataset.sample)];update();});
$('saveSvg').onclick=()=>{download(new Blob([exportSvg()],{type:'image/svg+xml;charset=utf-8'}),'kuraikura.svg');toast(t('loaded'));};
$('savePng').onclick=async()=>{
 if(!current)return;const button=$('savePng');button.disabled=true;button.textContent=t('exporting');
 try{const url=URL.createObjectURL(new Blob([exportSvg()],{type:'image/svg+xml'}));const img=new Image();
  try{img.src=url;await img.decode();const canvas=document.createElement('canvas');canvas.width=2400;canvas.height=3200;canvas.getContext('2d').drawImage(img,0,0,2400,3200);const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));if(!blob)throw Error();download(blob,'kuraikura.png');toast(t('loaded'));}finally{URL.revokeObjectURL(url);}
 }catch{toast(t('failed'));}finally{button.textContent=t('png');button.disabled=!current;}
};
$('fontDownload').onclick=()=>{if(DATA.font){const bytes=Uint8Array.from(atob(DATA.font),c=>c.charCodeAt(0));download(new Blob([bytes],{type:'font/ttf'}),'kuraikura-Regular.ttf');}else location.href='https://github.com/daafffodil/kuraikura/releases/latest/download/kuraikura-fonts.zip';};
localize();
(async()=>{
 try{
  if(!DATA.glyphs){const response=await fetch('assets/bank.json.gz');if(!response.ok)throw Error();DATA.glyphs=await new Response(response.body.pipeThrough(new DecompressionStream('gzip'))).json();}
  const css=document.createElement('style');css.textContent=`@font-face{font-family:LocalHand;src:${DATA.font?'url(data:font/ttf;base64,'+DATA.font+') format("truetype")':'url(assets/kuraikura-Regular.woff2) format("woff2")'};font-display:block;}`;document.head.append(css);
  const fonts=await document.fonts.load('100px LocalHand','回收一下');if(!fonts.length)throw Error();
  const fragment=document.createDocumentFragment();for(const ch of DATA.hanzi){const b=document.createElement('button');b.textContent=ch;b.setAttribute('aria-label',t('insert')+ch);b.onclick=()=>{const input=$('content');input.setRangeText(ch,input.selectionStart,input.selectionEnd,'end');input.focus();update();};fragment.append(b);}$('characters').append(fragment);
  fontReady=true;$('fontDownload').disabled=false;update();
 }catch(e){$('error').textContent=t('fontError');console.error(e);}
})();
window.handwritingApp={get layout(){return current;},exportSvg,get ready(){return fontReady;},get language(){return lang;}};
