/* 科研仪器主题：配色集中供 CSS、Canvas 与 SVG 使用。
 * 本模块只负责展示；不生成数据、修改处理参数，也不为装饰增加绘图计时器。 */
(function(global){
  'use strict';
  const root=document.documentElement;
  root.dataset.theme=localStorage.getItem('neuroflow-theme')==='light'?'light':'dark';
  let cached;
  function refresh(){cached=null;}
  function palette(){
    if(!cached){
      const style=getComputedStyle(root),read=name=>style.getPropertyValue(name).trim();
      cached={background:read('--plot-bg'),grid:read('--plot-grid'),text:read('--nf-subtle'),ink:read('--nf-ink'),accent:read('--nf-primary'),muted:read('--plot-muted'),warning:read('--warning'),traces:[read('--trace-1'),read('--trace-2'),read('--trace-3'),read('--trace-4')]};
    }
    return cached;
  }
  const paths={
    eeg:'M2 12h4l2-5 3 11 3-14 3 12 2-4h3',
    meg:'M5 8a8 8 0 0 1 14 0M8 11a5 5 0 0 1 8 0M11 14a2 2 0 0 1 2 0M12 16v5',
    fnirs:'M8 5a7 7 0 1 0 8 0M8 5v4M16 5v4M5 12h3M16 12h3M12 9v9',
    datasets:'M3 6l9-4 9 4-9 4zM3 12l9 4 9-4M3 18l9 4 9-4',
    history:'M4 5v5h5M4 10a8 8 0 1 1 0 5M12 7v5l3 2',
    sessions:'M4 3h16v13H9l-5 5zM8 7h8M8 11h5',
    ppg:'M2 15h4c3 0 2-12 6-12 3 0 2 14 5 14 2 0 2-4 5-4',
    sleep:'M17 3A9 9 0 1 0 21 17 9 9 0 0 1 17 3',
    help:'M4 3h12l4 4v14H4zM15 3v5h5M8 12h8M8 16h5'
  };
  function icon(path){
    const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');
    svg.setAttribute('viewBox','0 0 24 24');svg.setAttribute('fill','none');svg.setAttribute('stroke','currentColor');svg.setAttribute('stroke-width','1.5');svg.setAttribute('stroke-linecap','round');svg.setAttribute('stroke-linejoin','round');svg.setAttribute('aria-hidden','true');
    const line=document.createElementNS(svg.namespaceURI,'path');line.setAttribute('d',path);svg.append(line);return svg;
  }
  document.addEventListener('DOMContentLoaded',()=>{
    document.querySelectorAll('.sidebar [data-view]').forEach(button=>{
      if(paths[button.dataset.view])button.firstElementChild?.replaceChildren(icon(paths[button.dataset.view]));
      // 图标折叠时仍能通过 title/aria-label 知道功能，语言变化时同步更新。
      button.title=button.textContent.trim();button.setAttribute('aria-label',button.title);
    });
    document.querySelector('.brand-mark')?.replaceChildren(icon(paths.eeg));
    document.querySelector('.agent-icon')?.replaceChildren(icon('M8 3h8v4h5v10h-5v4H8v-4H3V7h5zM9 10h6M9 14h6'));
    // 信号是工作台的主要观察对象，放在参数流程前；移动节点保留所有已有事件。
    const signal=document.querySelector('.signal-card'),pipeline=document.querySelector('.pipeline-card');
    pipeline.before(signal);signal.querySelector('.step-number').textContent='02';pipeline.querySelector('.step-number').textContent='03';
    const badge=document.createElement('span');badge.className='instrument-version';badge.textContent='v'+(document.querySelector('meta[name="application-version"]')?.content||'0.2.0').replace(/\.0$/,'');document.querySelector('.brand').append(badge);
    document.addEventListener('neuroflow:localechange',()=>{
      document.querySelectorAll('.sidebar [data-view]').forEach(button=>{button.title=button.textContent.trim();button.setAttribute('aria-label',button.title);});
    });
    refresh();
  });
  global.NeuroTheme=Object.freeze({palette,refresh});
})(window);
