'use strict';
// 아바타가 거점에 도착하면 설정한 반경 안의 F&B·문화시설을 카드와 원형 핀으로 보여주는 기능
const NEARBY_LABELS={fnb:'F&B',culture:'문화시설'};
const nearbyActive={fnb:true,culture:true};
let nearbyCenter=null,nearbyOrigin='',nearbyExclude={},nearbyRadius=50,nearbyPins=[],nearbySelected=null;
const nearbyPanel=document.createElement('section');
nearbyPanel.className='nearby-panel';nearbyPanel.hidden=true;nearbyPanel.setAttribute('aria-label','도착 지점 주변 F&B·문화시설');
nearbyPanel.innerHTML=`<div class="nearby-head"><div><small id="nearby-origin"></small><h3>주변 둘러보기</h3></div><button type="button" class="nearby-fold" aria-expanded="true">접기</button></div><div class="nearby-body"><div class="nearby-radius"><label for="nearby-range">반경</label><input id="nearby-range" type="range" min="30" max="300" step="10" value="${nearbyRadius}"><output id="nearby-radius-value" for="nearby-range"></output></div><div class="nearby-types" role="group" aria-label="시설 유형"><button type="button" data-type="fnb" aria-pressed="true"></button><button type="button" data-type="culture" aria-pressed="true"></button></div><p class="nearby-summary" id="nearby-summary" role="status"></p><div class="nearby-cards" id="nearby-cards"></div></div>`;
document.querySelector('.map-panel').append(nearbyPanel);

// The radius is an SVG overlay rather than a map layer: ground layers disappear behind the 3D buildings.
const nearbyRing=document.createElementNS('http://www.w3.org/2000/svg','svg');nearbyRing.id='nearby-ring';nearbyRing.setAttribute('aria-hidden','true');nearbyRing.setAttribute('hidden','');
const nearbyRingShape=document.createElementNS(nearbyRing.namespaceURI,'polygon');nearbyRing.append(nearbyRingShape);
document.querySelector('.map-panel').append(nearbyRing);
let nearbyRingPoints=[];
function holdArrivalAuto(){arrivalCard.querySelector('.arrival-hold:not([hidden])')?.click();}
function nearbyCard(item,number){
  const card=document.createElement('article');card.className='nearby-card';card.dataset.type=item.type;card.dataset.key=item.key;
  const main=document.createElement('button');main.type='button';main.className='nearby-card-main';
  const badge=document.createElement('span');badge.className='nearby-number';badge.textContent=number;
  const text=document.createElement('span'),name=document.createElement('strong'),category=document.createElement('small'),meta=document.createElement('small');
  name.textContent=item.name;category.textContent=`${NEARBY_LABELS[item.type]} · ${item.category}`;
  meta.textContent=`직선 ${fmt(item.distance)}m${item.sales==null?'':` · 매출 ${fmt(item.sales)}만원`}`;
  text.append(name,category,meta);main.append(badge,text);main.onclick=()=>selectNearby(item.key,false);card.append(main);
  if(item.storeId){
    const more=document.createElement('button');more.type='button';more.className='nearby-card-more';more.textContent='분석 ↗';more.setAttribute('aria-label',`${item.name} 매장 분석 보기`);
    more.onclick=()=>selectStore(item.storeId,true);card.append(more);
  }
  return card;
}
// Stores sharing one building coordinate are fanned out so every numbered dot stays clickable.
function nearbyOffsets(items){
  const groups=new Map();
  items.forEach(item=>{const key=item.coordinates.join();groups.set(key,[...(groups.get(key)||[]),item.key]);});
  const offsets=new Map();
  for(const keys of groups.values())keys.forEach((key,i)=>{const angle=i/keys.length*Math.PI*2-Math.PI/2,spread=keys.length>1?8+keys.length*2:0;offsets.set(key,[Math.cos(angle)*spread,Math.sin(angle)*spread]);});
  return offsets;
}
function nearbyPin(item,number,offset){
  const el=document.createElement('button');el.type='button';el.className='nearby-pin';el.dataset.type=item.type;el.dataset.key=item.key;el.setAttribute('aria-label',`${number}번 ${item.name} · ${NEARBY_LABELS[item.type]}`);
  const dot=document.createElement('span');dot.className='nearby-pin-dot';dot.textContent=number;
  const label=document.createElement('span');label.className='nearby-pin-label';label.textContent=item.name;
  el.append(dot,label);el.onclick=event=>{event.stopPropagation();holdArrivalAuto();selectNearby(item.key,true);};
  return {item,el,label,offset,marker:new maplibregl.Marker({element:el,anchor:'center',offset}).setLngLat(item.coordinates)};
}
function renderNearby(){
  const month=$('month').value,all=WalkNearby.find(data,nearbyCenter,nearbyRadius,month,nearbyExclude);
  const shown=all.filter(item=>nearbyActive[item.type]),offsets=nearbyOffsets(shown);
  $('nearby-radius-value').textContent=`${nearbyRadius}m`;$('nearby-origin').textContent=`${nearbyOrigin} 기준`;
  nearbyPanel.querySelectorAll('.nearby-types button').forEach(button=>{button.textContent=`${NEARBY_LABELS[button.dataset.type]} ${all.filter(item=>item.type===button.dataset.type).length}`;});
  $('nearby-summary').textContent=!nearbyActive.fnb&&!nearbyActive.culture?'유형을 하나 이상 선택해 주세요.':!shown.length?`반경 ${nearbyRadius}m 안에 ${monthLabel(month)} 관측 시설이 없어요. 반경을 넓혀 보세요.`:`${monthLabel(month)} 관측 ${shown.length}곳 · 가까운 순`;
  if(!shown.some(item=>item.key===nearbySelected))nearbySelected=null;
  $('nearby-cards').replaceChildren(...shown.map((item,i)=>nearbyCard(item,i+1)));
  nearbyPins.forEach(pin=>pin.marker.remove());nearbyPins=shown.map((item,i)=>nearbyPin(item,i+1,offsets.get(item.key)));
  // Added farthest first so the nearest dots sit on top; label sizes are measured once, after all are attached.
  [...nearbyPins].reverse().forEach(pin=>pin.marker.addTo(map));
  nearbyPins.forEach(pin=>{pin.w=pin.label.offsetWidth;pin.h=pin.label.offsetHeight;});
  nearbyRingPoints=WalkNearby.circle(nearbyCenter,nearbyRadius).geometry.coordinates[0];
  markNearbySelection();scheduleLabels();
}
function markNearbySelection(){
  $('nearby-cards').querySelectorAll('.nearby-card').forEach(card=>card.classList.toggle('is-selected',card.dataset.key===nearbySelected));
  nearbyPins.forEach(pin=>pin.el.classList.toggle('is-selected',pin.item.key===nearbySelected));
}
function selectNearby(key,fromPin){
  nearbySelected=key;markNearbySelection();
  if(fromPin)$('nearby-cards').querySelector('.is-selected')?.scrollIntoView({block:'nearest',inline:'nearest'});
  else map.easeTo({center:nearbyPins.find(pin=>pin.item.key===key).item.coordinates,duration:300});
  scheduleLabels();
}
function fitNearby(){
  const panel=document.querySelector('.map-panel'),compact=nearbyPanel.classList.contains('is-compact');
  const padding=compact?{top:90,bottom:panel.clientHeight-localBox(nearbyPanel).y+16,left:24,right:24}:{top:110,bottom:panel.clientHeight-localBox(document.querySelector('.map-legend')).y+16,left:320,right:310};
  const dx=nearbyRadius/88200,dy=nearbyRadius/111200;
  // Too little free space for the whole circle: keep the stop centred instead.
  if(panel.clientWidth-padding.left-padding.right<140||panel.clientHeight-padding.top-padding.bottom<140){map.easeTo({center:nearbyCenter,zoom:17.5,offset:[(padding.left-padding.right)/2,(padding.top-padding.bottom)/2],duration:500});return;}
  map.fitBounds([[nearbyCenter[0]-dx,nearbyCenter[1]-dy],[nearbyCenter[0]+dx,nearbyCenter[1]+dy]],{padding,maxZoom:18.5,bearing:map.getBearing(),duration:500});
}
// Called on every label layout pass: sizes the panel, hides crowded pin labels, and reports its box as an obstacle.
function layoutNearby(){
  if(nearbyPanel.hidden)return null;
  nearbyRingShape.setAttribute('points',nearbyRingPoints.map(point=>{const p=map.project(point);return `${p.x.toFixed(1)},${p.y.toFixed(1)}`;}).join(' '));
  const panel=document.querySelector('.map-panel'),compact=panel.clientWidth<820,phone=matchMedia('(max-width:760px)').matches;
  nearbyPanel.classList.toggle('is-compact',compact);panel.classList.toggle('has-nearby-sheet',compact);
  nearbyPanel.style.bottom=compact&&!phone?`${panel.clientHeight-localBox(playerPanel).y+8}px`:'';
  nearbyPanel.style.maxHeight=compact?'':`${Math.max(200,localBox(document.querySelector('.map-legend')).y-nearbyPanel.offsetTop-12)}px`;
  // Read every position first, then write, so the pass costs one layout however many pins there are.
  const dots=nearbyPins.map(pin=>{const p=map.project(pin.item.coordinates);return {x:p.x+pin.offset[0]-10,y:p.y+pin.offset[1]-10,w:20,h:20,pin};});
  const taken=[...dots],sides=new Map();
  for(const dot of [...dots].sort((a,b)=>(b.pin.item.key===nearbySelected)-(a.pin.item.key===nearbySelected))){
    const {pin}=dot,x=dot.x+10-pin.w/2,y=dot.y+10-pin.h/2;
    const options={right:{x:dot.x+24,y},left:{x:dot.x-4-pin.w,y},top:{x,y:dot.y-4-pin.h},bottom:{x,y:dot.y+24}};
    const free=Object.keys(options).find(side=>!taken.some(other=>other.pin!==pin&&WalkLayout.overlaps({...options[side],w:pin.w,h:pin.h},other)));
    const side=free||(pin.item.key===nearbySelected?'right':null);
    sides.set(pin,side);if(side)taken.push({...options[side],w:pin.w,h:pin.h,pin});
  }
  for(const [pin,side] of sides){pin.label.classList.toggle('is-crowded',!side);pin.label.dataset.side=side||'right';}
  return localBox(nearbyPanel);
}
function openNearby(stop){
  if(!loaded)return;
  nearbyCenter=stop.coordinates;nearbyOrigin=stop.name;nearbyExclude={storeId:stop.storeId,landmarkId:stop.id};nearbySelected=null;
  nearbyPanel.hidden=false;nearbyRing.removeAttribute('hidden');layoutNearby();renderNearby();fitNearby();
}
function closeNearby(){
  if(nearbyPanel.hidden)return;
  nearbyPanel.hidden=true;nearbyRing.setAttribute('hidden','');document.querySelector('.map-panel').classList.remove('has-nearby-sheet');
  nearbyPins.forEach(pin=>pin.marker.remove());nearbyPins=[];
  scheduleLabels();
}
$('nearby-range').oninput=()=>{nearbyRadius=Number($('nearby-range').value);renderNearby();};
$('nearby-range').onchange=fitNearby;
nearbyPanel.querySelectorAll('.nearby-types button').forEach(button=>{button.onclick=()=>{
  const type=button.dataset.type;nearbyActive[type]=!nearbyActive[type];button.setAttribute('aria-pressed',String(nearbyActive[type]));renderNearby();
};});
nearbyPanel.querySelector('.nearby-fold').onclick=event=>{
  const folded=nearbyPanel.classList.toggle('is-folded');event.currentTarget.textContent=folded?'펼치기':'접기';event.currentTarget.setAttribute('aria-expanded',String(!folded));scheduleLabels();
};
// Browsing the neighbourhood should not be cut short by the 10-second auto departure.
['pointerdown','keydown','input'].forEach(type=>nearbyPanel.addEventListener(type,holdArrivalAuto));
$('month').addEventListener('change',()=>{if(!nearbyPanel.hidden)renderNearby();});
const showArrivalBase=showArrival;
showArrival=function(stop,index,arrived=true){showArrivalBase(stop,index,arrived);if(arrived)openNearby(stop);else closeNearby();};
const hideArrivalBase=hideArrival;
hideArrival=function(){hideArrivalBase();closeNearby();};
