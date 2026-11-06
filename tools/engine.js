(function (root) {
  'use strict';
  const escape = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
  const union = boxes => [Math.min(...boxes.map(b=>b[0])),Math.min(...boxes.map(b=>b[1])),Math.max(...boxes.map(b=>b[2])),Math.max(...boxes.map(b=>b[3]))];
  function random(seed) { let a = Number(seed) >>> 0; return () => {a += 0x6D2B79F5; let t=a; t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61); return ((t^(t>>>14))>>>0)/4294967296;}; }
  function bounds(box, size, angle) {
    const a=angle*Math.PI/180, c=Math.cos(a)*size, s=Math.sin(a)*size;
    const ps=[[box[0],box[1]],[box[2],box[1]],[box[2],box[3]],[box[0],box[3]]].map(([x,y])=>[x*c-y*s,x*s+y*c]);
    return [Math.min(...ps.map(p=>p[0])),Math.min(...ps.map(p=>p[1])),Math.max(...ps.map(p=>p[0])),Math.max(...ps.map(p=>p[1]))];
  }
  function split(text, columns) {
    const lines=[];
    for (const paragraph of text.replace(/\r/g,'').split('\n')) {
      let line='', count=0;
      for (const ch of paragraph) {
        const punct=/[，。！？、：；,.!?:;]/u.test(ch);
        if(count>=columns && !punct && !/\s/u.test(ch)) {lines.push(line);line='';count=0;}
        line+=ch;
        if(!/\s/u.test(ch)&&!punct) count++;
      }
      if(line.trim()) lines.push(line);
    }
    return lines;
  }
  function compose(text, bank, options={}) {
    const o=Object.assign({seed:17,scatter:.9,sizeVariation:.8,gap:65,columns:5,width:1200,height:1600,plain:false},options);
    if(!text.trim()) return {text, width:o.width,height:o.height,placements:[],lines:[]};
    if([...text].length>160) throw new Error('每幅最多 160 个字');
    const missing=[...new Set([...text].filter(c=>!(/\s/u.test(c))&&!bank[c]))];
    if(missing.length) throw new Error('字库还缺：'+missing.join(' '));
    const rng=random(o.seed), lines=split(text,Math.max(1,o.columns));
    const raw=[], variantPools=new Map();
    function nextVariant(ch) {
      // Draw without replacement per character, across the whole composition.
      // A new cycle also avoids repeating the last form of the previous one.
      let pool=variantPools.get(ch);
      if(!pool){
        const distinct=bank[ch].variants.map((v,i)=>i).filter((i,_,all)=>all.find(j=>bank[ch].variants[j].d===bank[ch].variants[i].d)===i);
        pool={all:distinct,remaining:[],last:null};variantPools.set(ch,pool);
      }
      if(!pool.remaining.length)pool.remaining=pool.all.slice();
      const choices=pool.remaining.length>1?pool.remaining.filter(i=>i!==pool.last):pool.remaining;
      const variant=choices[Math.floor(rng()*choices.length)];
      pool.remaining.splice(pool.remaining.indexOf(variant),1);pool.last=variant;
      return variant;
    }
    let rowTop=0, index=0;
    for (let row=0;row<lines.length;row++) {
      let cursor=o.plain?0:[0,140,45,105][row%4]*o.scatter;
      const items=[];
      for(const ch of lines[row]) {
        if(/\s/u.test(ch)){cursor+=180;continue;}
        const variant=o.plain?0:nextVariant(ch);
        const size=o.plain?1:1+(rng()-.5)*.55*o.sizeVariation;
        const angle=o.plain?0:(rng()-.5)*14*o.scatter;
        const box=bounds(bank[ch].variants[variant].bounds,size,angle);
        const dy=o.plain?0:(Math.sin(index*2.13+row)*170+(rng()-.5)*150)*o.scatter;
        let y=dy, x=cursor-box[0];
        if(/[，。！？、：；,.!?:;]/u.test(ch) && items.length) {
          const prior=items[items.length-1];
          y=prior.box[3]+20-box[3];
          x=prior.box[2]+Math.max(28,o.gap*.7)-box[0];
        }
        const shifted=[box[0]+x,box[1]+y,box[2]+x,box[3]+y];
        const p={ch,index:index++,row,variant,size,angle,x,y,box:shifted};
        items.push(p);
        cursor=shifted[2]+o.gap*(o.plain?1:.65+rng()*.55);
      }
      if(!items.length) continue;
      const rowBounds=union(items.map(p=>p.box)), shift=rowTop-rowBounds[1];
      for(const p of items){p.y+=shift;p.box[1]+=shift;p.box[3]+=shift;raw.push(p);}
      rowTop+=rowBounds[3]-rowBounds[1]+150;
    }
    const whole=union(raw.map(p=>p.box));
    const fit=Math.min(o.width*.88/(whole[2]-whole[0]),o.height*.80/(whole[3]-whole[1]));
    const ox=(o.width-(whole[2]-whole[0])*fit)/2, oy=(o.height-(whole[3]-whole[1])*fit)/2;
    for(const p of raw){p.x=(p.x-whole[0])*fit+ox;p.y=(p.y-whole[1])*fit+oy;p.size*=fit;
      p.box=[(p.box[0]-whole[0])*fit+ox,(p.box[1]-whole[1])*fit+oy,(p.box[2]-whole[0])*fit+ox,(p.box[3]-whole[1])*fit+oy];}
    return {text,width:o.width,height:o.height,placements:raw,lines,options:o};
  }
  function svg(layout, bank, preview=false, license='') {
    let content=`<svg xmlns="http://www.w3.org/2000/svg" width="${layout.width}" height="${layout.height}" viewBox="0 0 ${layout.width} ${layout.height}">`;
    content+=`<metadata>${escape(JSON.stringify({text:layout.text,options:layout.options,license}))}</metadata>`;
    for(const p of layout.placements) {
      const transform=`translate(${p.x.toFixed(5)} ${p.y.toFixed(5)}) rotate(${p.angle.toFixed(5)}) scale(${p.size.toFixed(7)})`;
      content+=`<g id="char-${p.index+1}" data-character="${escape(p.ch)}" data-variant="${p.variant}" transform="${transform}" fill="#111111">`;
      if(preview) content+=`<text x="0" y="0" font-size="1000" font-family="LocalHand" style="font-feature-settings:'ss01' ${p.variant===1?1:0},'ss02' ${p.variant===2?1:0};font-kerning:none">${escape(p.ch)}</text>`;
      else content+=`<path d="${bank[p.ch].variants[p.variant].d}"/>`;
      content+='</g>';
    }
    return content+'</svg>';
  }
  const api={compose,svg,split,bounds};
  if(typeof module!=='undefined'&&module.exports) module.exports=api;
  else root.Handwriting=api;
})(typeof globalThis!=='undefined'?globalThis:this);
