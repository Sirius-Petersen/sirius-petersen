
(() => {
'use strict';
const cfg=window.AUTOMATEN_CONFIG;
const $=(sel,root=document)=>root.querySelector(sel);
const $$=(sel,root=document)=>Array.from(root.querySelectorAll(sel));
const names={food:'Fødevareautomat',snack:'Snackautomat',soda:'Sodavandsautomat',coffee:'Kaffemaskine'};
const draw=$('#drawer'),scrim=$('#scrim');
let selection={id:'snack',kind:'purchase',slave:false};let previousFocus=null;let toastHandle=null;
const resetStatus=()=>{$('#orderStatus').textContent='';};
function toast(text){const t=$('#toast');t.textContent=text;t.classList.add('on');clearTimeout(toastHandle);toastHandle=setTimeout(()=>t.classList.remove('on'),2500)}
function openDrawer(){previousFocus=document.activeElement;draw.inert=false;draw.classList.add('show');scrim.classList.add('show');draw.setAttribute('aria-hidden','false');document.body.classList.add('noscroll');$('#drawerClose').focus()}
function closeDrawer(){draw.classList.remove('show');scrim.classList.remove('show');draw.setAttribute('aria-hidden','true');draw.inert=true;document.body.classList.remove('noscroll');previousFocus?.focus?.()}
function refreshDrawer(){
 const p=cfg.products[selection.id];const buying=selection.kind==='purchase';
 $('#drawerTitle').textContent=buying?'Forespørgsel om køb':'Forespørgsel om leje';
 $('#drawerProduct').textContent=p.name+(selection.slave?' + slave-modul':'');
 $('#drawerDescription').textContent=p.description;
 $('#slaveWrap').hidden=selection.id!=='snack';$('#slaveAddon').checked=selection.slave;
 $('#drawerPrice').textContent='Pris efter aftale';$('#drawerPriceLabel').textContent=buying?'Ønsker du at købe?':'Ønsker du at leje?';
 $('#drawerPriceExtra').textContent='Gratis forespørgsel';
 $$('[data-mode]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.mode===selection.kind)));
 $('#checkoutHint').textContent='Du får et konkret tilbud med pris og vilkår. Intet bliver købt, reserveret eller betalt ved at sende en forespørgsel.';
 $('#orderSubmit').textContent='Åbn e-mail med '+(buying?'købs':'leje')+'forespørgsel ↗';
 resetStatus();
}
function choose(id,kind,details=false){selection={id,kind,slave:false};refreshDrawer();openDrawer();if(details){$('#drawerDescription').textContent+=' Vi gennemgår dimensioner, stand, muligheder for opfyldning og andre detaljer, når modellen er bekræftet.';}}
function buildInquiry(type,values){
 const p=cfg.products[selection.id];
 return `AUTOMATEN.DK – ${type}\n\nAutomat: ${p.name}${selection.slave?' + slave-modul':' (uden slave-modul)'}\nØnske: ${selection.kind==='purchase'?'Jeg vil gerne KØBE':'Jeg vil gerne LEJE'}\nPris: Jeg vil gerne modtage et konkret tilbud med vilkår.\n\nNavn: ${values.get('name')||''}\nE-mail: ${values.get('email')||''}\nTelefon: ${values.get('phone')||''}\nBy / postnummer: ${values.get('area')||''}\nBesked: ${values.get('message')||''}\n\nJeg forstår, at dette er en uforpligtende forespørgsel, og at der endnu ikke er indgået nogen aftale.`;
}
async function copyText(text){try{await navigator.clipboard.writeText(text);return true}catch{try{const el=document.createElement('textarea');el.value=text;el.style.position='fixed';el.style.left='-9999px';document.body.append(el);el.select();const ok=document.execCommand('copy');el.remove();return ok}catch{return false}}}
let lastDraft={subject:'',body:''};
function gmailUrl(subject,body){return 'https://mail.google.com/mail/?view=cm&fs=1&to='+encodeURIComponent(cfg.contactEmail)+'&su='+encodeURIComponent(subject)+'&body='+encodeURIComponent(body)}
function createDraft(type,form){const data=new FormData(form);if(type==='order')return {subject:'Automaten.dk: '+(selection.kind==='purchase'?'Køb':'Leje')+' af '+cfg.products[selection.id].name+(selection.slave?' med slave-modul':''),body:buildInquiry('FORESPØRGSEL',data)};return {subject:'Automaten.dk – '+String(data.get('topic')||'Henvendelse'),body:`AUTOMATEN.DK – KONTAKT\n\nNavn: ${data.get('name')}\nE-mail: ${data.get('email')}\nTelefon: ${data.get('phone')||''}\nEmne: ${data.get('topic')}\n\nBesked:\n${data.get('message')}`}}
function openEmailDraft(subject,body,status){
 lastDraft={subject,body};const url='mailto:'+encodeURIComponent(cfg.contactEmail)+'?subject='+encodeURIComponent(subject)+'&body='+encodeURIComponent(body);
 status.textContent='Din browser forsøger nu at åbne et e-mailprogram. Beskeden er IKKE sendt endnu. Hvis intet åbner, kan du vælge “Åbn i Gmail” eller “Kopiér besked” herunder.';
 window.location.href=url;
}
function prepareAlternative(type,channel){
 const form=$(type==='contact'?'#contactForm':'#orderForm');if(!form.reportValidity())return;
 const data=createDraft(type,form),status=$(type==='contact'?'#contactStatus':'#orderStatus');lastDraft=data;
 if(channel==='gmail'){
  const popup=window.open(gmailUrl(data.subject,data.body),'_blank','noopener,noreferrer');
  status.textContent='Gmail-kladden blev forsøgt åbnet i en ny fane. Tryk selv Send i Gmail. Hvis browseren blokerer fanen, kan du bruge den almindelige e-mailknap eller kopiere beskeden.';
  return;
 }
 copyText('Til: '+cfg.contactEmail+'\nEmne: '+data.subject+'\n\n'+data.body).then(ok=>{status.textContent=ok?'Beskeden er kopieret. Indsæt den i en e-mail til '+cfg.contactEmail+'. Der er ikke sendt noget endnu.':'Kunne ikke kopiere. Brug e-mailknappen i stedet.';toast(ok?'Beskeden er kopieret':'Kopiering mislykkedes')});
}

$$('[data-order]').forEach(button=>button.addEventListener('click',()=>{const [id,type]=button.dataset.order.split(':');const kind=type==='buy'?'purchase':'monthly';choose(id,kind)}));
$$('[data-details]').forEach(button=>button.addEventListener('click',()=>{
 const id=button.dataset.details, detail=$('#details-'+id), opening=detail.hidden;
 // Keep the catalog compact by showing at most one details panel at a time.
 $$('[data-details]').forEach(other=>{
   const target=$('#details-'+other.dataset.details);target.hidden=true;
   other.setAttribute('aria-expanded','false');
   other.textContent=other.dataset.details==='snack'?'Se slave-modulet ↗':'Se flere detaljer ↗';
 });
 detail.hidden=!opening;
 $('#catalog').classList.toggle('details-open',opening);
 button.setAttribute('aria-expanded',String(opening));
 button.textContent=opening?'Skjul detaljer −':(id==='snack'?'Se slave-modulet ↗':'Se flere detaljer ↗');
}));
$$('[data-mode]').forEach(button=>button.addEventListener('click',()=>{
 selection.kind=button.dataset.mode;
 refreshDrawer();
}));
$('#slaveAddon').addEventListener('change',e=>{selection.slave=e.target.checked;refreshDrawer()});
$('#drawerClose').addEventListener('click',closeDrawer);scrim.addEventListener('click',closeDrawer);
$('#drawerBack').addEventListener('click',()=>{closeDrawer();$('#automater').scrollIntoView({behavior:'smooth'})});
$('#shareProduct').addEventListener('click',()=>{
 const url=new URL(location.href); url.hash='';url.search='';
 url.searchParams.set('automat',selection.id);
 url.searchParams.set('valg',selection.kind==='purchase'?'koeb':'leje');
 if(selection.id==='snack' && selection.slave)url.searchParams.set('slave','1');
 copyText(url.toString()).then(ok=>{
  $('#orderStatus').textContent=ok?'Link til '+cfg.products[selection.id].name+' er kopieret. Du kan nu dele det med andre.':'Linket kunne ikke kopieres i denne browser.';
  toast(ok?'Linket er kopieret':'Kunne ikke kopiere linket');
 });
});
if('IntersectionObserver' in window){
 const sectionIds=['automater','prøv','om','saadan','faq','kontakt'];
 const sections=sectionIds.map(id=>document.getElementById(id)).filter(Boolean);
 const links=new Map($$('#navLinks a[href^="#"]').map(el=>[el.getAttribute('href').slice(1),el]));
 let current=null;
 const sectionObserver=new IntersectionObserver(entries=>{
   for(const entry of entries){
     if(!entry.isIntersecting)continue;
     const id=entry.target.id;
     if(current===id)continue;
     current=id;
     links.forEach((link,key)=>{if(key===id)link.setAttribute('aria-current','location');else link.removeAttribute('aria-current')});
   }
 },{rootMargin:'-22% 0px -68% 0px',threshold:0});
 sections.forEach(section=>sectionObserver.observe(section));
}
$('#navOrder').addEventListener('click',()=>{$('#automater').scrollIntoView({behavior:'smooth'})});
$('#mobileOrder').addEventListener('click',()=>{$('#automater').scrollIntoView({behavior:'smooth'})});
const menu=$('#navLinks'),burger=$('#hamburger');burger.addEventListener('click',()=>{const active=menu.classList.toggle('open');burger.setAttribute('aria-expanded',String(active));burger.textContent=active?'×':'☰'});$$('a',menu).forEach(link=>link.addEventListener('click',()=>{menu.classList.remove('open');burger.setAttribute('aria-expanded','false');burger.textContent='☰'}));document.addEventListener('keydown',e=>{if(e.key==='Escape'&&menu.classList.contains('open')){menu.classList.remove('open');burger.setAttribute('aria-expanded','false');burger.textContent='☰';burger.focus()}});document.addEventListener('click',e=>{
 if(!menu.classList.contains('open') || menu.contains(e.target) || burger.contains(e.target))return;
 menu.classList.remove('open');burger.setAttribute('aria-expanded','false');burger.textContent='☰';
});
document.addEventListener('keydown',(e)=>{if(e.key==='Escape'&&draw.classList.contains('show'))closeDrawer();if(e.key==='Tab'&&draw.classList.contains('show')){const nodes=$$('a[href]:not([hidden]),button:not(:disabled):not([hidden]),input,textarea,select',draw).filter(el=>el.offsetParent!==null);if(!nodes.length)return;const first=nodes[0],last=nodes[nodes.length-1];if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus()}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus()}}});
$('#orderForm').addEventListener('submit',e=>{e.preventDefault();if(!e.target.reportValidity())return;const draft=createDraft('order',e.target);openEmailDraft(draft.subject,draft.body,$('#orderStatus'))});
$('#contactForm').addEventListener('submit',e=>{e.preventDefault();if(!e.target.reportValidity())return;const draft=createDraft('contact',e.target);openEmailDraft(draft.subject,draft.body,$('#contactStatus'))});
$('#contactGmail').addEventListener('click',()=>prepareAlternative('contact','gmail'));
$('#contactCopy').addEventListener('click',()=>prepareAlternative('contact','copy'));
$('#orderGmail').addEventListener('click',()=>prepareAlternative('order','gmail'));
$('#orderCopy').addEventListener('click',()=>prepareAlternative('order','copy'));
// All contact actions are available immediately without a server or third-party form account.
const emailLink=document.createElement('a');emailLink.className='direct-mail-link';
emailLink.href='mailto:'+cfg.contactEmail;emailLink.textContent=cfg.contactEmail+' ↗';
$('#contactEmailLine').replaceChildren(emailLink);
$('#contactModeHint').textContent='Vi åbner en e-mailkladde. Beskeden bliver først sendt, når du trykker Send.';
$('#contactSubmit').textContent='Åbn e-mail med besked ↗';
$('#demoBanner').hidden=false;
$('#year').textContent=new Date().getFullYear();
const topButton=$('#backTop');let scrollRaf=0;
window.addEventListener('scroll',()=>{if(!scrollRaf)scrollRaf=requestAnimationFrame(()=>{topButton.classList.toggle('visible',window.scrollY>850);scrollRaf=0})},{passive:true});
topButton.addEventListener('click',()=>window.scrollTo({top:0,behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'}));
const m=$('#demoMachine'),screen=$('#demoScreen'),status=$('#demoStatus'),drop=$('#demoDrop');let dispensing=false;
function dispense(i){if(dispensing)return;dispensing=true;$$('[data-dispense]').forEach(b=>{const active=Number(b.dataset.dispense)===i;b.classList.toggle('is-active',active);b.setAttribute('aria-pressed',String(active))});const slot=$$('.shelf-item')[i-1];screen.textContent='VARE '+i;status.textContent='Vare '+i+' udleveres…';drop.style.background=getComputedStyle(slot).backgroundColor;drop.classList.remove('drop');void drop.offsetWidth;drop.classList.add('drop');slot.style.transform='translateY(-4px) scale(.8)';setTimeout(()=>{screen.textContent='TAK!';status.textContent='Vare '+i+' er leveret i demonstrationen. Prøv igen!';slot.style.transform='';dispensing=false},window.matchMedia('(prefers-reduced-motion: reduce)').matches?120:1050)}
$$('[data-dispense]').forEach(button=>button.addEventListener('click',()=>dispense(Number(button.dataset.dispense))));
if(window.matchMedia('(prefers-reduced-motion: no-preference)').matches){
  if('IntersectionObserver' in window){const obs=new IntersectionObserver((entries)=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('in');obs.unobserve(entry.target)}}),{rootMargin:'0px 0px -70px 0px',threshold:.05});$$('.reveal').forEach(el=>obs.observe(el))}else $$('.reveal').forEach(e=>e.classList.add('in'));
  const hero=$('#heroVisual');let raf=0,point=null;const heroUnit=$('#heroUnit');
if(window.matchMedia('(hover:hover) and (pointer:fine)').matches){
 hero.addEventListener('pointermove',e=>{const r=hero.getBoundingClientRect();point=[(e.clientX-r.left)/r.width-.5,(e.clientY-r.top)/r.height-.5];if(!raf)raf=requestAnimationFrame(()=>{const [x,y]=point;heroUnit.style.transform=`rotateY(${(-10+x*13).toFixed(1)}deg) rotateX(${(4-y*8).toFixed(1)}deg) translateY(5px)`;raf=0})},{passive:true});
 hero.addEventListener('pointerleave',()=>{if(raf)cancelAnimationFrame(raf);raf=0;heroUnit.style.transform=''});
}
  const flakes=$('#snowflakes');if(window.matchMedia('(min-width: 760px) and (hover: hover)').matches && !navigator.connection?.saveData)for(let i=0;i<12;i++){const x=(i*37.7)%100,delay=-((i*1.37)%17),duration=12+((i*3.7)%12),size=2+(i%4)*1.25;const flake=document.createElement('i');flake.style.cssText=`--x:${x}%;--s:${size}px;--dur:${duration}s;--delay:${delay}s;opacity:.5`;flakes.append(flake)}
} else $$('.reveal').forEach(e=>e.classList.add('in'));
const q=new URLSearchParams(location.search),id=q.get('automat'),kind=q.get('valg');
if(Object.prototype.hasOwnProperty.call(cfg.products,id)&&(kind==='koeb'||kind==='leje')){
 choose(id,kind==='koeb'?'purchase':'monthly');
 if(id==='snack'&&q.get('slave')==='1'){selection.slave=true;refreshDrawer()}
}
})();
