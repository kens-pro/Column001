(function(){
"use strict";
const articleId="growing_philosophy";
const pageContext="piano_educator_growing_essay";
window.dataLayer=window.dataLayer||[];
function emit(event,params){window.dataLayer.push(Object.assign({event:event,article_id:articleId,page_context:pageContext},params||{}));}
const year=document.getElementById("copyright-year");if(year)year.textContent=String(new Date().getFullYear());
emit("lp_article_ready",{content_group:"education_essay"});
const milestones=[25,50,75,90,100],fired=new Set();
let pending=false;
function onScroll(){
 pending=false;const d=document.documentElement,extent=Math.max(0,d.scrollHeight-innerHeight);
 const pct=extent?Math.min(100,Math.round(Math.max(0,scrollY)/extent*100)):100;
 const bar=document.getElementById("reading-progress");if(bar)bar.style.width=pct+"%";
 milestones.forEach(x=>{if(pct>=x&&!fired.has(x)){fired.add(x);emit("lp_scroll_depth",{scroll_percent:x});}});
}
window.addEventListener("scroll",()=>{if(!pending){pending=true;requestAnimationFrame(onScroll);}},{passive:true});
window.addEventListener("resize",onScroll,{passive:true});onScroll();
const seen=new Set();
if("IntersectionObserver"in window){
 const obs=new IntersectionObserver(entries=>{
   entries.forEach(entry=>{if(!entry.isIntersecting)return;const id=entry.target.dataset.articleSection;
   if(id&&!seen.has(id)){seen.add(id);emit("lp_section_view",{section_id:id});}obs.unobserve(entry.target);});
 },{rootMargin:"0px 0px -24% 0px",threshold:.12});
 document.querySelectorAll("[data-article-section]").forEach(el=>obs.observe(el));
}
document.addEventListener("click",e=>{
const anchor=e.target.closest("a[href]");if(!anchor)return;
const href=anchor.getAttribute("href")||"";
if(href.startsWith("#"))emit("lp_internal_navigation",{target_section:href.slice(1),nav_location:anchor.closest(".toc-grid")?"table_of_contents":anchor.closest(".header-nav")?"header":"body"});
else if(anchor.closest("#sources"))emit("lp_reference_click",{reference_host:new URL(anchor.href).hostname});
else if(anchor.closest(".related-story"))emit("lp_related_article_click",{related_article:"teaching_philosophy"});
});
let duration=0;const sent=new Set();const timer=setInterval(()=>{
if(document.visibilityState!=="visible")return;duration+=5;
[30,60,120,300].forEach(x=>{if(duration>=x&&!sent.has(x)){sent.add(x);emit("lp_engaged_time",{engaged_seconds:x});}});
if(duration>=300)clearInterval(timer);
},5000);
const share=document.getElementById("share-button"),status=document.getElementById("share-status");
if(share)share.addEventListener("click",async()=>{
const url=document.querySelector('link[rel="canonical"]')?.href||location.href;
if(navigator.share){try{await navigator.share({title:document.title,url,text:"「育つ」とは何か。ピアノの先生と考える、成長の本質。"});emit("lp_share",{method:"native"});if(status)status.textContent="共有ありがとうございます。";}catch(err){if(err?.name!=="AbortError"&&status)status.textContent="共有できませんでした。";}}
else if(navigator.clipboard?.writeText){try{await navigator.clipboard.writeText(url);emit("lp_share",{method:"copy_url"});if(status)status.textContent="記事のURLをコピーしました。";}catch(err){if(status)status.textContent=url;}}
else if(status)status.textContent=url;
});
})();