// 有界窗口缓存与相邻窗口预取。新请求中止旧请求，旧响应不能覆盖新时间位置。
const signalCache=new Map(),signalVersions=new WeakMap();
let signalVersion=0,signalRequest=0,signalController=null,signalPrefetch=null,signalPanTimer;
let signalActiveContext=null,signalPending=false;
const signalFamily=c=>signalKey({...c,start:0,duration:0});
// 至少显示两个原始采样点；与 Python 读取器使用同一边界。
// 不再固定在 0.5 秒，否则高采样率信号无法继续查看局部细节。
function signalZoomLimits(){
  const total=Number(state.current?.inspection?.duration_seconds)||0;
  const rate=Number(state.current?.inspection?.sampling_rate_hz)||0;
  return {min:Math.min(total||.5,rate>0?Math.max(.001,2/rate):.5),max:Math.min(120,total||120)};
}
function signalFeedback(message){
  let node=document.getElementById('signal-load-status');
  if(!node){node=document.createElement('div');node.id='signal-load-status';node.className='muted';node.setAttribute('role','status');$('.signal-navigation').after(node);}
  node.textContent=message;
}
function signalContext(){
  const dataset=state.current;if(!dataset?.datasetId)return null;
  if(!signalVersions.has(dataset.inspection))signalVersions.set(dataset.inspection,++signalVersion);
  const source=state.processed?'processed':'raw';
  return {id:dataset.datasetId,url:state.url,source,channel:state.singleChannel?state.selectedChannel:'',
    version:signalVersions.get(dataset.inspection),analysis:state.analysis?.analysis_id||'',
    duration:state.signalWindow.duration,start:state.signalWindow.start,total:dataset.inspection.duration_seconds||0};
}
const signalKey=c=>JSON.stringify([c.url,c.id,c.version,c.analysis,c.source,c.channel,c.duration,c.start]);
function cacheSignal(key,data){signalCache.delete(key);signalCache.set(key,data);while(signalCache.size>24)signalCache.delete(signalCache.keys().next().value);}
async function fetchSignal(c,signal){
  const query=new URLSearchParams({source:c.source,channel:c.channel||'',start:String(c.start),duration:String(c.duration)});
  const response=await fetch(`${c.url}/datasets/${encodeURIComponent(c.id)}/signal?${query}`,{signal});
  const data=await response.json();if(!response.ok)throw Error(data.message||`HTTP ${response.status}`);return data;
}
async function loadSignalWindow(){
  const c=signalContext();if(!c)return;
  // 平移合并为“当前请求 + 最新目标”，不反复取消慢速 Python 读取导致一直无结果。
  if(signalActiveContext&&signalFamily(signalActiveContext)===signalFamily(c)){
    signalPending=true;
    signalFeedback(i18n.getLocale()==='en'?`Queued: ${c.start.toFixed(3)} s · ${c.duration.toFixed(3)} s window`:`已接收操作：${c.start.toFixed(3)} 秒处，窗口 ${c.duration.toFixed(3)} 秒，正在更新…`);
    return;
  }
  const ticket=++signalRequest,key=signalKey(c);
  signalController?.abort();signalPrefetch?.abort();
  const controller=new AbortController();signalController=controller;
  signalActiveContext=c;signalPending=false;
  let timedOut=false;
  const timeout=setTimeout(()=>{timedOut=true;controller.abort();},45000);
  state.signalWindow.loading=true;$('#signal-canvas').setAttribute('aria-busy','true');
  signalFeedback(i18n.getLocale()==='en'?`Loading ${c.start.toFixed(1)} s…`:`正在读取 ${c.start.toFixed(1)} 秒处的波形…`);
  try{
    const data=signalCache.get(key)||await fetchSignal(c,controller.signal);cacheSignal(key,data);
    // 切换数据集、通道、处理结果或时间范围之后，已经返回的旧数据也不可应用。
    const current=signalContext();if(ticket!==signalRequest||!current||signalFamily(current)!==signalFamily(c))return;
    // 中间窗口也可先显示，但不能把用户已经移动到的最新目标重置成旧位置。
    if(current.duration===c.duration)state.signalWindow.preview=data;
    if(signalKey(current)===key)state.signalWindow.start=Number(data.start_seconds)||0;
    else signalPending=true;
    drawSignal();
    signalFeedback(i18n.getLocale()==='en'?`Displayed: ${Number(data.start_seconds||0).toFixed(1)} s${signalPending?' · Loading latest position…':''}`:`已显示：${Number(data.start_seconds||0).toFixed(1)} 秒${signalPending?' · 正在更新到最新位置…':''}`);
    const next={...c,start:Math.min(Math.max(0,c.total-c.duration),c.start+c.duration)};
    if(!signalPending&&next.start!==c.start&&!signalCache.has(signalKey(next))){
      const prefetch=new AbortController();signalPrefetch=prefetch;
      const deadline=setTimeout(()=>prefetch.abort(),45000);
      fetchSignal(next,prefetch.signal).then(result=>cacheSignal(signalKey(next),result)).catch(()=>{}).finally(()=>clearTimeout(deadline));
    }
  }catch(error){if(ticket===signalRequest&&(!controller.signal.aborted||timedOut)){const message=t('signal.windowFailed',{message:timedOut?'45 s timeout':error.message});toast(message);signalFeedback(message);}}
  finally{clearTimeout(timeout);if(ticket===signalRequest){signalActiveContext=null;state.signalWindow.loading=false;$('#signal-canvas').setAttribute('aria-busy','false');if(signalPending){signalPending=false;loadSignalWindow();}}}
}
function panSignalTo(start){
  const total=state.current?.inspection?.duration_seconds||0;if(!state.current?.datasetId||!total)return;
  state.signalWindow.start=Math.max(0,Math.min(Math.max(0,total-state.signalWindow.duration),start));
  $('#signal-position').value=String(state.signalWindow.start);
  $('#signal-window-label').textContent=`${state.signalWindow.start.toFixed(1)}–${(state.signalWindow.start+state.signalWindow.duration).toFixed(1)} s`;
  // 拖动期间保留已显示波形，避免回退到初始窗口或合成演示；停止滚动后加载最终位置。
  // 限频而非等待滚轮完全停止；持续滚动时也会周期性读取。
  if(!signalPanTimer)signalPanTimer=setTimeout(()=>{signalPanTimer=null;loadSignalWindow();},90);
}
function zoomSignalWindow(factor){
  const c=signalContext();if(!c||c.total<=0)return;
  // 以当前窗口中心为锚点；放宽窗口时先限制起点，避免在文件末尾仍只读到旧的短尾段。
  const limits=signalZoomLimits();
  const duration=Math.min(limits.max,Math.max(limits.min,c.duration*factor));
  if(duration===c.duration)return;
  const center=c.start+c.duration/2;
  state.signalWindow.duration=duration;
  state.signalWindow.start=Math.max(0,Math.min(c.total-duration,center-duration/2));
  clearTimeout(signalPanTimer);signalPanTimer=null;
  // 不清空旧波形；否则加载中会退回初始预览，让缩放看起来失效。
  updateSignalNavigation(activeSignalPreview());
  loadSignalWindow();
}
function installSignalNavigation(){
  const hint=()=>{$('#signal-canvas').title=i18n.getLocale()==='en'?'Shift + mouse wheel: pan left/right':'Shift＋鼠标滚轮：左右平移';};
  hint();document.addEventListener('neuroflow:localechange',hint);
  $('#signal-position').addEventListener('input',event=>panSignalTo(Number(event.target.value)));
  $('.signal-card').addEventListener('wheel',event=>{
    if(!event.shiftKey||!state.current?.datasetId)return;
    event.preventDefault();
    // 兼容触控板横向 deltaX，以及浏览器对 Shift+滚轮的横向转换。
    let delta=Math.abs(event.deltaX)>Math.abs(event.deltaY)?event.deltaX:event.deltaY;
    if(event.deltaMode===1)delta*=16;else if(event.deltaMode===2)delta*=400;
    panSignalTo(state.signalWindow.start+delta/400*state.signalWindow.duration);
  },{passive:false});
}
