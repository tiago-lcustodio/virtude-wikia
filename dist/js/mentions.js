'use strict';
/* Índice único para menções em prosa, fichas e células textuais. */
(function(scope){
const key=s=>s.normalize('NFC').trim().replace(/[\s\-–—‑]+/gu,' ').toLocaleLowerCase('pt-BR');
const escape=s=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
const pattern=s=>s.split(/[\s\-–—‑]+/u).map(escape).join('[\\s\\u00a0\\-–—‑]+');
function compile(entries,{currentId='',showSpoilers=false}={}){
 const byId=new Map(entries.map(e=>[e.id,e]));const names=new Map();const eraContext=byId.get(currentId)?.eraIds?.includes('I');
 const add=(name,e)=>{if(name.length<3)return;const k=key(name);if(!names.has(k))names.set(k,{name,ids:new Set()});names.get(k).ids.add(e.id);};
 for(const e of entries)for(const name of [e.name,...(e.aliases||[]),...(eraContext?(e.contextAliases||[]):[])])add(name,e);
 // Um prenome compartilhado permanece ambíguo mesmo quando uma edição antiga o usava como alias de apenas uma pessoa.
 const firsts=new Map();for(const e of entries.filter(e=>e.category==='Personagens')){const first=e.name.split(' ')[0];if(first.length>=4){const k=key(first);if(!firsts.has(k))firsts.set(k,[]);firsts.get(k).push(e);}}
 for(const [k,list]of firsts)if(list.length>1&&names.has(k))for(const e of list)add(names.get(k).name,e);
 const values=[...names.values()].sort((a,b)=>b.name.length-a.name.length||a.name.localeCompare(b.name,'pt-BR'));
 const re=new RegExp('(?<![\\p{L}\\p{N}_])('+values.map(v=>pattern(v.name)).join('|')+')(?![\\p{L}\\p{N}_])','giu');
 const current=byId.get(currentId);const context=new Set([currentId,...(current?.related||[])]);
 return {find(text){
  const out=[];re.lastIndex=0;
  for(const m of text.matchAll(re)){
   const record=names.get(key(m[0]));if(!record)continue;let ids=[...record.ids];
   if(ids.length>1){const explicit=ids.filter(id=>byId.get(id).name.includes(' ')&&key(text).includes(key(byId.get(id).name)));const local=explicit.length===1?explicit:ids.filter(id=>context.has(id));if(local.length!==1)continue;ids=local;}
   const e=byId.get(ids[0]);if(!e||e.id===currentId||e.spoilerOnly&&!showSpoilers)continue;
   // Nomes simples de pessoas são próprios: "a mina" não é "Mina" e "será" não é "Sera".
   if((e.contextAliases||[]).some(alias=>key(alias)===key(m[0]))&&m[0][0]!==m[0][0].toLocaleUpperCase('pt-BR'))continue;
   if(e.mentionCaseSensitive&&m[0][0]!==m[0][0].toLocaleUpperCase('pt-BR'))continue;
   if(e.category==='Personagens'&&!/[\s\-–—‑]/u.test(m[0])&&m[0][0]!==m[0][0].toLocaleUpperCase('pt-BR'))continue;
   out.push({start:m.index,end:m.index+m[0].length,text:m[0],id:e.id});
  }return out;
 },ambiguous:[...names].filter(([,v])=>v.ids.size>1).map(([name,v])=>({name,ids:[...v.ids]}))};
}
scope.VirtudeMentions={compile,key};
})(typeof window==='undefined'?globalThis:window);
