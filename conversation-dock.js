'use strict';
const conversationDock=document.createElement('aside');
conversationDock.className='conversation-dock';
conversationDock.setAttribute('aria-label','산책 대화와 장소 안내');
document.querySelector('.map-panel').append(conversationDock);
// The avatar is not attached to the document until the asynchronous map load.
// Query its detached subtree directly; document lookup returns null here.
conversationDock.append(walker.querySelector('#bubble'),arrivalCard);
// Keep the map full-width while anchoring speech in its upper-right corner.
window.addEventListener('resize',()=>{if(map)map.resize();});
if(map)map.resize();
const speechTail=document.createElement('span');
speechTail.className='speech-direction-tail';speechTail.hidden=true;speechTail.setAttribute('aria-hidden','true');
document.querySelector('.map-panel').append(speechTail);
function updateSpeechTail(){
  speechTail.hidden=!marker||!$('speech').checked||conversationDock.classList.contains('is-folded');
  if(speechTail.hidden)return;
  const box=localBox(conversationDock),panel=document.querySelector('.map-panel').getBoundingClientRect(),avatar=walker.getBoundingClientRect();
  const cx=box.x+box.w/2,cy=box.y+box.h/2,dx=avatar.left+avatar.width/2-panel.left-cx,dy=avatar.top-panel.top-cy;
  const scale=Math.min(box.w/2/Math.max(Math.abs(dx),.01),box.h/2/Math.max(Math.abs(dy),.01));
  speechTail.style.left=`${cx+dx*scale}px`;speechTail.style.top=`${cy+dy*scale-8}px`;
  speechTail.style.transform=`rotate(${Math.atan2(dy,dx)}rad)`;
}
const dockToggle=document.createElement('button');dockToggle.className='dock-toggle';dockToggle.textContent='대화 접기';dockToggle.setAttribute('aria-expanded','true');
conversationDock.prepend(dockToggle);
dockToggle.onclick=()=>{const folded=conversationDock.classList.toggle('is-folded');dockToggle.textContent=folded?'대화 펼치기':'대화 접기';dockToggle.setAttribute('aria-expanded',String(!folded));scheduleLabels();};
const mobileMapTools=document.createElement('div');mobileMapTools.className='mobile-map-tools';mobileMapTools.setAttribute('aria-label','모바일 산책 지도 조작');
document.querySelector('.map-panel').before(mobileMapTools);
const followButton=document.createElement('button');followButton.textContent='따라가기';followButton.setAttribute('aria-pressed','false');
followButton.onclick=()=>{const on=!$('follow').checked;$('follow').checked=on;followButton.setAttribute('aria-pressed',String(on));followButton.textContent=on?'따라가는 중':'따라가기';if(marker&&map)map.easeTo({center:marker.getLngLat()});};
$('follow').addEventListener('change',()=>{followButton.setAttribute('aria-pressed',String($('follow').checked));followButton.textContent=$('follow').checked?'따라가는 중':'따라가기';});
const avatarButton=document.createElement('button');avatarButton.textContent='아바타 위치';avatarButton.onclick=()=>{if(marker&&map)map.easeTo({center:marker.getLngLat(),zoom:16.5});};
const overviewButton=document.createElement('button');overviewButton.textContent='코스 전체';overviewButton.onclick=()=>{if(loaded)fitRoute();};
mobileMapTools.append(followButton,avatarButton,overviewButton);
const setupBaseLandmarks=setupLandmarks;
setupLandmarks=function(){
  const store=data.stores.find(s=>s.id==='0127025948');
  if(store&&!data.landmarks.some(p=>p.id==='vinvin'))data.landmarks.push({id:'vinvin',name:'방방',kind:'식사',stay:45,storeId:store.id,coordinates:store.coordinates,placeCoordinates:store.coordinates,pinned:true,info:{summary:'신흥로 99-9에 있는 방방(VINVIN)입니다. 위치는 제공된 점포 데이터 기준이며 메뉴·영업시간은 방문 전에 확인해 주세요.',highlights:['신흥시장 골목','방방(VINVIN)'],tip:'영업 여부와 운영시간은 최신 매장 안내를 확인해 주세요.'}});
  const market=data.stores.find(s=>s.id==='0119641405');
  if(market&&!data.landmarks.some(p=>p.id==='saemaeul'))data.landmarks.push({id:'saemaeul',name:'새마을마트',kind:'쇼핑',stay:10,storeId:market.id,coordinates:market.coordinates,placeCoordinates:market.coordinates,pinned:true,info:{summary:'서울특별시 용산구 소월로20길 37의 새마을마트입니다. 사용자 지정 기본 거점이며 위치는 점포 데이터와 건물 지번(용산동2가 19-13)을 대조했습니다.',highlights:['소월로20길 37','기본 표시 거점'],tip:'운영시간과 판매 품목은 매장에서 확인해 주세요.'}});
  setupBaseLandmarks();
  document.querySelector('.landmark-index summary').textContent=`거점 ${data.landmarks.length}곳 모두 보기`;
};
