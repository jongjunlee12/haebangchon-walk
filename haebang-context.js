'use strict';
// Official regional statistics stay separate from individual merchant analytics.
(async function(){
  const section=insightEl('section',null,'official-context panel');
  section.append(insightEl('div','03 / LOCAL CONTEXT','eyebrow'),insightEl('h2','산책에 보탬이 되는 공식 데이터'));
  document.querySelector('main').append(section);
  try{
    const response=await fetch('official-context.json');if(!response.ok)throw Error('context');
    const context=await response.json(),t=context.tourism;
    section.append(insightEl('p',`${t.area} · ${t.period} · ${t.population}`),insightEl('p','행정동 전체 통계입니다. 해방촌 방문객만의 통계나 개별 음식점 고객 특성이 아니며, 위 매출 기준월 선택과 연동되지 않습니다.','analytics-note'));
    const charts=insightEl('div',null,'official-grid');
    for(const [title,rows] of [['방문자 연령 구성비',t.ages],['방문자 성별 구성비',t.sexes]]){
      const chart=insightEl('div');chart.append(insightEl('h3',title));
      for(const row of rows){
        const line=insightEl('div',null,'distribution-row');
        line.append(insightEl('span',row.label),insightEl('span',`${row.percent.toFixed(2)}%`));
        const track=insightEl('div',null,'distribution-track'),fill=insightEl('i');fill.style.width=`${row.percent}%`;track.append(fill);line.append(track);chart.append(line);
      }
      charts.append(chart);
    }
    section.append(charts,insightLink('한국관광데이터랩 · 공식 다운로드 출처 ↗',t.source));
    const facilities=insightEl('div',null,'toilet-list');
    section.append(insightEl('h3','가까운 화장실 4곳'),insightEl('p',`서울 열린데이터광장 갱신 ${context.toiletUpdated} · 개방시간은 등록 정보이며 현재 개방·승강기 운행을 보장하지 않습니다.`),facilities);
    context.toilets.forEach(place=>{
      const item=insightEl('article'),button=insightEl('button',`${place.name} · 지도에서 보기`);button.type='button';
      item.append(button,insightEl('p',`${place.address} / ${place.hours}`),insightEl('small',`장애인 화장실 등록: ${place.accessible} · 접근 경로 미검증`));
      button.onclick=()=>{
        if(!loaded)return;
        document.querySelector('.map-panel').scrollIntoView({behavior:'smooth',block:'start'});
        map.flyTo({center:place.coordinates,zoom:17});
        const content=insightEl('div');content.append(insightEl('strong',place.name),insightEl('p',place.hours),insightEl('small','등록 정보 · 현장 개방 확인 필요'));
        new maplibregl.Popup({maxWidth:'240px'}).setLngLat(place.coordinates).setDOMContent(content).addTo(map);
      };
      facilities.append(item);
    });
    section.append(insightLink('서울 열린데이터광장 · 시설정보 출처 ↗',context.toiletSource));
  }catch(error){section.append(insightEl('p','공식 보조 데이터를 불러오지 못했습니다. 새로고침 후 다시 확인해 주세요.'));}
})();
