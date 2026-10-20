// 中学英語チェッカー(言い換えドリル/ふり返り 共通)
(function(){
function esc(s){return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}
// ===== 中学英語の語彙リスト(+ 実況でよく使う基本語) =====
const JH_WORDS = `a an the i me my mine myself you your yours yourself he him his himself she her hers herself it its itself we us our ours ourselves they them their theirs themselves
this that these those what who whom whose which when where why how there here
and but or so because if than as then also too very really just only even still already yet again not no yes ok okay please thank thanks sorry hello hi bye goodbye oh wow well hey ah uh um yeah yep nope huh hmm phew
am is are was were be been being do does did done doing have has had having will would can could shall should may might must
in on at to from for of with without about into onto over under up down out off around through across along between behind before after during until till since near by like against inside outside above below beside past away back
go goes going went gone come came get got gotten make made take took taken give gave given put see saw seen look watch hear heard listen say said tell told talk speak spoke spoken ask answer call know knew known think thought feel felt want need like love hate try use find found lose lost win won keep kept let help start begin began begun stop finish end open close turn run ran walk drive drove driven ride rode ridden fly flew flown swim swam jump sit sat stand stood stay leave left arrive move carry bring brought buy bought sell sold pay paid cost spend spent save eat ate eaten drink drank cook sleep slept wake woke live die kill hit catch caught throw threw thrown push pull break broke broken fix build built change choose chose chosen decide wait hope wish mean meant understand understood learn study teach taught read write wrote written draw drew drawn sing sang sung play work show shown send sent meet met join follow lead led plan practice remember forget forgot forgotten believe worry care miss happen fall fell fallen grow grew grown wear wore worn hold held hurt hide hid hidden enjoy laugh cry smile shout
agree borrow lend clean climb collect cut dance enter explain fill invite kick knock notice order pass pick plant pray prepare protect rain relax rest return share shut snow solve sound spell store surprise touch travel visit wash waste hurry guess lie act add allow become became cover continue create cross drop exercise face fail feed fight fought hang imagine improve introduce lay laid marry mind mix own paint point raise reach receive reply report rise roll rush search seem set shake shine sign smell taste trust train type warn wonder beat calm count dream excite kid matter place speed test
time day night morning afternoon evening today tomorrow yesterday week month year minute hour second moment life world people person man woman men women boy girl child children kid friend family father mother dad mom brother sister parent baby name thing way place home house room school class teacher student work job money car bus train bike road street city town country map game video music movie song book story picture photo phone computer internet team plan idea question answer problem reason mistake chance luck fun trouble hand head eye face body heart mind voice word language english japanese japan america vietnam world water food lunch dinner breakfast rice bread coffee tea milk shop store bank hospital park station door window wall floor table chair bed box bag key ticket point part side top bottom front middle left right lot bit kind type sort number fire light sky sun rain snow wind weather tree flower dog cat animal bird fish sea river mountain island beach health power news message letter email hat guy guys player one ones thing something anything everything nothing someone anyone everyone nobody somebody anybody everybody noise sound end road gun cop cops police mission comment character camera shoot shot check bet plane clothes mess steal charge exit stream video videos minute hit memory memories truth noise
good bad great nice fine big small little long short high low tall old new young early late fast slow easy hard difficult busy free happy sad angry tired sleepy hungry sick hot cold warm cool right wrong true sure ready same different important interesting boring exciting excited bored scared afraid funny strange beautiful cute pretty kind friendly quiet loud dark bright full empty clean dirty cheap expensive rich poor safe dangerous careful strong weak heavy lucky perfect real best better worse worst last next first third every each all some any many much more most few less least other another enough only own whole alone together able shy stupid crazy cool red blue green black white yellow clear wrong okay alive dead favorite famous popular special terrible awesome amazing fair far honest scary weird opposite glad
now then soon later never always often sometimes usually ever almost maybe perhaps probably actually suddenly finally slowly quickly carefully easily somewhere anywhere everywhere nowhere none o'clock anymore ago once twice yet while
one two three four five six seven eight nine ten eleven twelve hundred thousand
everything`.split(/\s+/).filter(Boolean);
const JH = new Set(JH_WORDS);
const IRREG = {children:'child',men:'man',women:'woman',people:'person',better:'good',best:'good',worse:'bad',worst:'bad'};

function baseForms(w){
  const c = [w];
  if (IRREG[w]) c.push(IRREG[w]);
  const add = s => { if (s && s.length >= 2) c.push(s); };
  if (w.endsWith('ies')) add(w.slice(0,-3)+'y');
  if (w.endsWith('es')) add(w.slice(0,-2));
  if (w.endsWith('s')) add(w.slice(0,-1));
  if (w.endsWith('ied')) add(w.slice(0,-3)+'y');
  if (w.endsWith('ed')) { add(w.slice(0,-2)); add(w.slice(0,-1)); const s=w.slice(0,-2); if (/(.)\1$/.test(s)) add(s.slice(0,-1)); }
  if (w.endsWith('ing')) { const s=w.slice(0,-3); add(s); add(s+'e'); if (/(.)\1$/.test(s)) add(s.slice(0,-1)); }
  if (w.endsWith('er')) { const s=w.slice(0,-2); add(s); add(s+'e'); if (/(.)\1$/.test(s)) add(s.slice(0,-1)); if (s.endsWith('i')) add(s.slice(0,-1)+'y'); }
  if (w.endsWith('est')) { const s=w.slice(0,-3); add(s); add(s+'e'); if (/(.)\1$/.test(s)) add(s.slice(0,-1)); if (s.endsWith('i')) add(s.slice(0,-1)+'y'); }
  if (w.endsWith('ying')) add(w.slice(0,-4)+'ie');
  if (w.endsWith('ly')) { add(w.slice(0,-2)); if (w.endsWith('ily')) add(w.slice(0,-3)+'y'); }
  return c;
}
function normWord(raw){
  let w = raw.toLowerCase().replace(/[’‘]/g,"'").replace(/^[^a-z0-9']+|[^a-z0-9']+$/g,'');
  if (!w) return '';
  if (w === "won't") return 'will';
  if (w === "can't") return 'can';
  if (w === "let's") return 'let';
  w = w.replace(/n't$/,'').replace(/'(s|re|ve|ll|d|m)$/,'');
  return w;
}
function isEasy(raw){
  const w = normWord(raw);
  if (!w) return true;
  if (/^[0-9]+$/.test(w)) return true;
  return baseForms(w).some(f => JH.has(f));
}
// 英文 → HTML(中学外っぽい単語を黄色に)
function checkHtml(text){
  const parts = text.split(/(\s+)/);
  let hard = [];
  const html = parts.map(p=>{
    if (/^\s+$/.test(p) || !p) return p;
    if (isEasy(p)) return '<span class="w-ok">'+esc(p)+'</span>';
    hard.push(normWord(p));
    return '<span class="w-hard">'+esc(p)+'</span>';
  }).join('');
  return {html, hard};
}
function relHighlight(en){
  return esc(en).replace(/\b(who|that|which|where|what)\b/gi, '<span class="rel">$1</span>');
}


window.JH={isEasy:isEasy,normWord:normWord,checkHtml:checkHtml,words:JH};
})();
