/* 常驻通道面板：坐标只来自检查器，不根据通道名字猜位置。
 * 与波形共用 selectedChannel，搜索只过滤列表，不改变信号数据。 */
let layoutSearch='', layoutFilter='all';
let layoutRenderState=[];
const layoutText=(zh,en)=>i18n.getLocale()==='en'?en:zh;
function renderChannelLayout(){
  // 平移波形不会改变电极和通道列表；避免每帧销毁、创建整个 SVG 与按钮列表。
  const next=[state.current?.inspection,state.current?.inspection?.structure_report,state.current?.inspection?.structure_report?.channel_positions,state.selectedChannel,state.singleChannel,layoutSearch,layoutFilter,i18n.getLocale()];
  if(document.getElementById('channel-layout-panel')&&next.every((value,index)=>value===layoutRenderState[index]))return;
  layoutRenderState=next;
  let panel=document.getElementById('channel-layout-panel');
  if(!panel){panel=element('section','card channel-layout-panel');panel.id='channel-layout-panel';document.querySelector('.signal-card').after(panel);}
  panel.replaceChildren();
  panel.append(element('h2','',layoutText('通道与电极','Channels and electrodes')));
  const meta=state.current?.inspection;
  if(!meta){panel.append(element('p','muted',layoutText('导入数据后查看真实通道及可用电极坐标。','Import a dataset to inspect channels and available electrode coordinates.')));return;}
  const report=meta.structure_report||{}, positions=(report.channel_positions||[]).filter(p=>[p.x,p.y,p.z].every(Number.isFinite));
  const refs=new Set(report.reference_channels||[]),excluded=new Set(report.excluded_channels||[]);
  const channels=(meta.channel_names||[]).map((name,index)=>({name,type:report.channel_types?.[index]||'unknown',drop:false}));
  for(const name of excluded)if(!channels.some(c=>c.name===name))channels.push({name,type:'—',drop:true});
  const known=new Map(positions.map(p=>[p.name,p]));
  panel.append(element('p','muted',meta.montage?layoutText(`标准 Montage：${meta.montage}；并非实测电极位置。`,`Standard montage: ${meta.montage}; not digitized electrode positions.`):layoutText('有坐标时显示文件位置；无坐标时按采集顺序展示，不代表头皮位置。','Available coordinates show file positions; otherwise channels are shown in acquisition order, not scalp locations.')));
  const controls=element('div','layout-controls'),search=element('input'),filter=element('select');
  search.type='search';search.value=layoutSearch;search.placeholder=layoutText('搜索通道名称','Search channels');search.setAttribute('aria-label',search.placeholder);
  search.oninput=()=>{layoutSearch=search.value;renderChannelLayout();const replacement=panel.querySelector('input');replacement.focus();};
  [['all',layoutText('全部通道','All channels')],['reference',layoutText('参考通道','Reference')],['excluded',layoutText('已排除','Excluded')],['unknown',layoutText('无坐标','No coordinates')]].forEach(([value,label])=>{const o=element('option','',label);o.value=value;filter.append(o);});
  filter.value=layoutFilter;filter.setAttribute('aria-label',layoutText('筛选通道','Filter channels'));filter.onchange=()=>{layoutFilter=filter.value;renderChannelLayout();};controls.append(search,filter);panel.append(controls);
  const content=element('div','layout-content'),ns='http://www.w3.org/2000/svg',svg=document.createElementNS(ns,'svg');svg.setAttribute('viewBox','0 0 320 300');svg.setAttribute('aria-label',layoutText('电极位置俯视图','Electrode positions, top view'));
  const shape=(tag,attrs)=>{const node=document.createElementNS(ns,tag);Object.entries(attrs).forEach(([k,v])=>node.setAttribute(k,v));return node;};
  svg.append(shape('circle',{cx:160,cy:150,r:116,fill:'none',stroke:'currentColor'}),shape('path',{d:'M148 34 L160 17 L172 34',fill:'none',stroke:'currentColor'}));
  // 坐标为头部 x/y 投影；保持等比例，不将它冒充电位 topomap。
  const scale=105/Math.max(.1,...positions.map(p=>Math.hypot(p.x,p.y)));
  for(const c of channels){const p=known.get(c.name);if(!p||c.drop)continue;
    const group=shape('g',{'data-channel':c.name,tabindex:'0',role:'button','aria-label':c.name,'aria-pressed':String(state.selectedChannel===c.name)});
    const selected=state.singleChannel&&state.selectedChannel===c.name;
    group.append(shape('circle',{cx:160+p.x*scale,cy:150-p.y*scale,r:selected?8:5,fill:selected?'#e6a03d':refs.has(c.name)?'#8064b2':'#16846d'}));
    const label=shape('text',{x:168+p.x*scale,y:154-p.y*scale,'font-size':10,fill:'currentColor'});label.textContent=c.name+(refs.has(c.name)?' ★':'');group.append(label);
    group.onclick=()=>selectLayoutChannel(c);group.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();selectLayoutChannel(c);}};svg.append(group);
  }
  const diagram=element('div');
  // 未知位置单独画顺序网格，不放入头部轮廓。部分缺失时也能找到所有通道。
  if(svg.querySelector('g[data-channel]'))diagram.append(svg);
  const unlocated=channels.filter(c=>!known.has(c.name)||c.drop);
  if(unlocated.length){
    diagram.append(element('h3','',layoutText('通道顺序图（非空间坐标）','Channel order (not spatial coordinates)')));
    const grid=element('div','channel-order-grid');
    for(const c of unlocated){const button=element('button',`channel-order-tile${state.singleChannel&&state.selectedChannel===c.name?' selected':''}`);
      button.type='button';button.disabled=c.drop;button.dataset.channel=c.name;
      button.setAttribute('aria-pressed',String(state.singleChannel&&state.selectedChannel===c.name));
      button.append(element('small','',String(channels.indexOf(c)+1).padStart(2,'0')),element('strong','',c.name),element('small','',c.drop?layoutText('已排除','Excluded'):`${c.type}${refs.has(c.name)?' ★':''}`));
      button.onclick=()=>selectLayoutChannel(c);grid.append(button);
    }diagram.append(grid);
  }
  diagram.append(element('p','muted',layoutText('点击通道查看波形 · ★ 采集参考 · 时间对齐不需要 Montage','Click a channel to view its waveform · ★ Acquisition reference · Time alignment does not require a montage')));content.append(diagram);
  const list=element('div','layout-list');
  const visible=channels.filter(c=>c.name.toLowerCase().includes(layoutSearch.toLowerCase())&&(layoutFilter==='all'||layoutFilter==='reference'&&refs.has(c.name)||layoutFilter==='excluded'&&c.drop||layoutFilter==='unknown'&&!known.has(c.name)));
  for(const c of visible){const button=element('button',`layout-channel${state.singleChannel&&state.selectedChannel===c.name?' selected':''}${c.drop?' excluded':''}`);
    button.type='button';button.disabled=c.drop;button.setAttribute('aria-pressed',String(state.singleChannel&&state.selectedChannel===c.name));
    button.append(element('strong','',c.name),element('span','',`${c.type} ${refs.has(c.name)?'★':''} · ${c.drop?layoutText('已排除','Excluded'):known.has(c.name)?layoutText('有坐标','Located'):layoutText('无坐标','No position')}`));button.onclick=()=>selectLayoutChannel(c);list.append(button);}
  if(!visible.length)list.append(element('p','muted',layoutText('无匹配通道','No matching channels')));content.append(list);panel.append(content);
  const selected=channels.find(c=>c.name===state.selectedChannel),p=known.get(state.selectedChannel),range=report.amplitude_ranges?.find(r=>r.name===state.selectedChannel);
  if(selected){panel.append(element('p','layout-detail',`${selected.name} · ${selected.type}${p?` · XYZ: ${p.x.toFixed(4)}, ${p.y.toFixed(4)}, ${p.z.toFixed(4)} m`:''}${range?` · ${range.min.toExponential(3)} … ${range.max.toExponential(3)} ${range.unit} (${layoutText('导入时前10秒以内','first ≤10 s at import')})`:''}`));}
}
async function selectLayoutChannel(channel){
  if(channel.drop||state.running||state.sending||state.signalWindow.loading)return;
  // 当前波形接口按模态筛选通道；辅助通道不发出注定失败的请求。
  const available=activeSignalPreview()?.available_channel_names||[];
  if(!available.includes(channel.name)){toast(layoutText('当前信号预览不包含此通道类型。','This channel type is not available in the current signal preview.'));return;}
  state.selectedChannel=channel.name;state.singleChannel=true;state.signalWindow.preview=null;
  renderChannelLayout();await loadSignalWindow();
}
