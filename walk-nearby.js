/* 정차 지점 반경 안의 F&B·문화시설을 거리순으로 찾는 순수 함수 (Node 테스트 겸용) */
(function(root){
  // 원자료 업종 분류 기준. F&B는 대분류 '음식', 문화시설은 아래 소분류와 비점포 거점(문화·복합공간).
  const CULTURE_CATEGORIES=['서적 판매','표구/화랑','음반/영상매체 판매','전시관','영화관'];
  const CULTURE_KINDS=['문화','복합공간'];
  const meters=(a,b)=>Math.hypot((a[0]-b[0])*88200,(a[1]-b[1])*111200);
  const storeType=store=>store.businessType==='음식'?'fnb':CULTURE_CATEGORIES.includes(store.category)?'culture':null;
  function find(data,center,radius,month,exclude={}){
    const items=[];
    for(const store of data.stores){
      const type=storeType(store);
      if(!type||!store.months[month]||store.id===exclude.storeId)continue;
      const distance=meters(center,store.coordinates);
      if(distance<=radius)items.push({key:`store-${store.id}`,type,name:store.name,category:store.category,coordinates:store.coordinates,distance,storeId:store.id,sales:store.months[month][0]});
    }
    for(const place of data.landmarks){
      if(place.storeId||!CULTURE_KINDS.includes(place.kind)||place.id===exclude.landmarkId)continue;
      const distance=meters(center,place.placeCoordinates);
      if(distance<=radius)items.push({key:`place-${place.id}`,type:'culture',name:place.name,category:`${place.kind} 거점`,coordinates:place.placeCoordinates,distance,landmarkId:place.id,sales:null});
    }
    return items.sort((a,b)=>a.distance-b.distance);
  }
  function circle(center,radius,steps=64){
    const ring=[];
    for(let i=0;i<=steps;i++){const angle=i/steps*Math.PI*2;ring.push([center[0]+Math.cos(angle)*radius/88200,center[1]+Math.sin(angle)*radius/111200]);}
    return {type:'Feature',properties:{},geometry:{type:'Polygon',coordinates:[ring]}};
  }
  root.WalkNearby={find,circle,meters,storeType};
  if(typeof module!=='undefined')module.exports=root.WalkNearby;
})(globalThis);
