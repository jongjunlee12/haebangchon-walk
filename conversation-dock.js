'use strict';
const conversationDock=document.createElement('aside');
conversationDock.className='conversation-dock';
conversationDock.setAttribute('aria-label','산책 대화와 장소 안내');
document.querySelector('.workspace').append(conversationDock);
conversationDock.append($('bubble'),arrivalCard);
// Keep the map's projected coordinate system unchanged: the dock is a sibling.
window.addEventListener('resize',()=>{if(map)map.resize();});
if(map)map.resize();
const setupBaseLandmarks=setupLandmarks;
setupLandmarks=function(){
  const store=data.stores.find(s=>s.id==='0127025948');
  if(store&&!data.landmarks.some(p=>p.id==='vinvin'))data.landmarks.push({id:'vinvin',name:'방방',kind:'식사',stay:45,storeId:store.id,coordinates:store.coordinates,placeCoordinates:store.coordinates,pinned:true,info:{summary:'신흥로 99-9에 있는 방방(VINVIN)입니다. 위치는 제공된 점포 데이터 기준이며 메뉴·영업시간은 방문 전에 확인해 주세요.',highlights:['신흥시장 골목','방방(VINVIN)'],tip:'영업 여부와 운영시간은 최신 매장 안내를 확인해 주세요.'}});
  setupBaseLandmarks();
  document.querySelector('.landmark-index summary').textContent=`거점 ${data.landmarks.length}곳 모두 보기`;
};
