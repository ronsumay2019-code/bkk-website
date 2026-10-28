document.documentElement.classList.add('js');
const toggle=document.querySelector('.nav-toggle'),nav=document.querySelector('#navigation');
if(toggle&&nav){
  toggle.hidden=false;
  const setOpen=open=>{nav.classList.toggle('is-open',open);toggle.setAttribute('aria-expanded',String(open));toggle.setAttribute('aria-label',open?'Close menu':'Open menu');};
  toggle.addEventListener('click',()=>setOpen(toggle.getAttribute('aria-expanded')!=='true'));
  document.addEventListener('click',e=>{if(!nav.contains(e.target)&&!toggle.contains(e.target))setOpen(false)});
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&nav.classList.contains('is-open')){setOpen(false);toggle.focus()}});
  nav.addEventListener('click',e=>{if(e.target.closest('a'))setOpen(false)});
  matchMedia('(min-width:1001px)').addEventListener('change',()=>setOpen(false));
}
const year=document.querySelector('#current-year');if(year)year.textContent=new Date().getFullYear();

// Progressive enhancement: content remains visible when motion is disabled.
const motionPreference=matchMedia('(prefers-reduced-motion: reduce)');
const finePointer=matchMedia('(hover: hover) and (pointer: fine)');
const revealTargets=[...document.querySelectorAll('.section-heading,.benefits article,.story-layout>*,.steps article,.cta,.about-layout>*,.live-feature>*,.contact-layout>*,.payment-note')];
let revealObserver;
function configureReveals(){
  revealObserver?.disconnect();
  revealTargets.forEach(el=>el.classList.remove('reveal-ready'));
  if(motionPreference.matches||!('IntersectionObserver' in window))return;
  try{
    revealObserver=new IntersectionObserver(entries=>entries.forEach(entry=>{
      if(entry.isIntersecting){entry.target.classList.add('is-revealed');revealObserver.unobserve(entry.target)}
    }),{threshold:0.08,rootMargin:'0px 0px -20px 0px'});
    revealTargets.forEach(el=>{
      // Do not hide content already on screen, or content revealed earlier.
      if(el.getBoundingClientRect().top<innerHeight||el.classList.contains('is-revealed'))return;
      el.classList.add('reveal-ready');revealObserver.observe(el);
    });
  }catch{revealTargets.forEach(el=>el.classList.remove('reveal-ready'))}
}
configureReveals();motionPreference.addEventListener('change',configureReveals);

document.querySelectorAll('[data-depth]').forEach(card=>{
  let frame=0,bounds;
  const reset=()=>{cancelAnimationFrame(frame);frame=0;card.style.removeProperty('--tilt-x');card.style.removeProperty('--tilt-y');card.classList.remove('is-tilting');bounds=null};
  card.addEventListener('pointerenter',()=>{if(motionPreference.matches||!finePointer.matches)return;bounds=card.getBoundingClientRect();card.classList.add('is-tilting')});
  card.addEventListener('pointermove',event=>{
    if(!bounds||motionPreference.matches||!finePointer.matches)return;
    const x=Math.max(-1,Math.min(1,(event.clientX-bounds.left)/bounds.width*2-1));
    const y=Math.max(-1,Math.min(1,(event.clientY-bounds.top)/bounds.height*2-1));
    cancelAnimationFrame(frame);frame=requestAnimationFrame(()=>{card.style.setProperty('--tilt-x',(-y*3.5).toFixed(2)+'deg');card.style.setProperty('--tilt-y',(x*4.5).toFixed(2)+'deg');frame=0});
  });
  card.addEventListener('pointerleave',reset);card.addEventListener('pointercancel',reset);motionPreference.addEventListener('change',reset);finePointer.addEventListener('change',reset);
});
const progress=document.querySelector('.reading-progress');
if(progress){let pending=false;const update=()=>{const max=document.documentElement.scrollHeight-innerHeight;const ratio=max>0?Math.min(1,Math.max(0,scrollY/max)):0;progress.style.transform='scaleX('+ratio+')';pending=false};const schedule=()=>{if(!pending){pending=true;requestAnimationFrame(update)}};addEventListener('scroll',schedule,{passive:true});addEventListener('resize',schedule,{passive:true});addEventListener('load',schedule,{once:true});update();}

// Only owner-supplied source links are used; Facebook serves the actual media.
const socialFrames=[...document.querySelectorAll('[data-social-media]')];
let mediaObserver;
function loadSocialFrame(container){
  if(container.dataset.loaded==='true')return;
  const raw=container.dataset.sourceUrl;
  let source;try{source=new URL(raw)}catch{return}
  if(source.hostname!=='www.facebook.com')return;
  const type=container.dataset.socialMedia;
  if(type==='video'&&!/^\/reel\/\d+\/$/.test(source.pathname))return;
  if(type==='photo'&&(source.pathname!=='/photo/'||!/^\d+$/.test(source.searchParams.get('fbid')||'')))return;
  const width=Math.max(180,Math.min(500,Math.round(container.clientWidth)));
  const player=new URL(type==='video'?'https://www.facebook.com/plugins/video.php':'https://www.facebook.com/plugins/post.php');
  player.searchParams.set('href',source.href);player.searchParams.set('width',String(width));player.searchParams.set('show_text','false');
  if(type==='video')player.searchParams.set('autoplay','false');
  const iframe=document.createElement('iframe');iframe.title=container.dataset.mediaTitle+' — Facebook '+(type==='video'?'video':'photo post');iframe.src=player.href;iframe.allow='encrypted-media; picture-in-picture; fullscreen';iframe.allowFullscreen=true;iframe.loading='lazy';
  // The permanent source link below each player remains usable if Facebook blocks an embed.
  iframe.addEventListener('load',()=>{const label=container.querySelector('.media-loading');if(label)label.hidden=true},{once:true});
  container.dataset.loaded='true';container.append(iframe);
}
const filters=document.querySelector('.showcase-filters');
if(filters){
  filters.hidden=false;
  const collection=document.querySelector('.showcase-collection');
  const applyFilter=type=>{
    collection.querySelectorAll('.showcase-card').forEach(card=>{
      card.hidden=type!=='all'&&card.dataset.mediaType!==type;
      card.querySelectorAll('[data-social-media]').forEach(container=>{
        if(card.hidden){
          // Removing a hidden player also stops any audio from the previous filter.
          container.querySelector('iframe')?.remove();delete container.dataset.loaded;
          const label=container.querySelector('.media-loading');if(label)label.hidden=false;
        }else if(mediaObserver){mediaObserver.observe(container)}
      });
    });
    filters.querySelectorAll('button').forEach(button=>{const selected=button.dataset.mediaFilter===type;button.classList.toggle('is-selected',selected);button.setAttribute('aria-pressed',String(selected))});
    const shown=collection.querySelectorAll('.showcase-card:not([hidden])').length;
    collection.querySelector('.showcase-status').textContent=type==='all'?'Showing all '+shown+' highlights.':'Showing '+shown+(type==='video'?' live highlights.':' photo-post links.');
    if(!('IntersectionObserver' in window))collection.querySelectorAll('.showcase-card:not([hidden]) [data-social-media]').forEach(loadSocialFrame);
    // A resize tells the reading-progress indicator that the page height changed.
    const max=document.documentElement.scrollHeight-innerHeight;if(progress)progress.style.transform='scaleX('+(max>0?Math.min(1,scrollY/max):0)+')';
  };
  applyFilter('video');
  filters.addEventListener('click',event=>{const button=event.target.closest('[data-media-filter]');if(button)applyFilter(button.dataset.mediaFilter)});
}
if('IntersectionObserver' in window){
  mediaObserver=new IntersectionObserver(entries=>{entries.forEach(entry=>{if(entry.isIntersecting&&!entry.target.closest('[hidden]')){loadSocialFrame(entry.target);mediaObserver.unobserve(entry.target)}})},{rootMargin:'150px 0px',threshold:0.01});
  socialFrames.forEach(frame=>mediaObserver.observe(frame));
}else{socialFrames.filter(frame=>!frame.closest('[hidden]')).forEach(loadSocialFrame)}
