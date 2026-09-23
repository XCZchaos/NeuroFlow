/* 文档全部随应用离线分发；与 RAG 索引无关。保留稳定的 topic ID，供组件提问定位。 */
(function createHelpView(global){
  const i18n=global.NeuroI18n;
  const el=(tag,className,text)=>{const node=document.createElement(tag);if(className)node.className=className;if(text)node.textContent=text;return node;};
  function ensure(){
    if(document.querySelector('[data-view="help"]'))return;
    const button=el('button','nav-item');button.dataset.view='help';button.append(el('span','','?'),el('span','help-nav-label i18n-text'));
    document.querySelector('.nav-item[data-view="sessions"]').after(button);
    const view=el('section','card alternative-view help-view');view.id='help-view';view.hidden=true;document.querySelector('main').append(view);
  }
  function render(){
    ensure();
    const english=i18n.getLocale()==='en',content=global.NeuroHelpContent[english?'en':'zh'],view=document.querySelector('#help-view');
    const previousQuery=view.querySelector('#help-search')?.value||'';
    document.querySelector('.help-nav-label').textContent=english?'User guide':'使用说明';view.replaceChildren();
    const version=document.querySelector('meta[name="application-version"]')?.content||'';
    const heading=el('header','help-heading'),intro=el('div'),title=el('h2','',english?'User guide':'软件使用说明');
    title.append(el('span','help-version','v'+version.replace(/\.0$/,'')));
    intro.append(el('div','eyebrow','NEUROFLOW GUIDE'),title,el('p','',english?'Setup, workflows, examples, and troubleshooting — available offline.':'从首次配置、分模态操作到结果复核，附提问示例与故障排查。离线可查阅。'));
    const search=el('input');search.id='help-search';search.type='search';search.placeholder=english?'Search topics and errors':'搜索功能或错误';search.setAttribute('aria-label',search.placeholder);search.value=previousQuery;
    heading.append(intro,search);view.append(heading);
    const layout=el('div','help-layout'),toc=el('nav','help-toc'),articles=el('div','help-articles');toc.setAttribute('aria-label',english?'Guide contents':'说明目录');
    const entries=[];
    for(const [id,title,summary,blocks] of content){
      const link=el('a','',title);link.href=`#help-${id}`;toc.append(link);
      const article=el('article');article.id=`help-${id}`;article.append(el('h3','',title),el('p','help-summary',summary));
      for(const block of blocks){
        if(typeof block==='string'){article.append(el('p','',block));continue;}
        // 扩展说明可用小标题和真实列表，避免长段文字挤在一起；始终使用 textContent。
        if(block.title)article.append(el('h4','',block.title));
        const list=el(block.ordered?'ol':'ul');for(const item of block.items||[])list.append(el('li','',item));article.append(list);
      }
      article.dataset.search=article.textContent.toLowerCase();articles.append(article);entries.push({article,link});
    }
    const empty=el('p','help-empty',english?'No matching topics. Try a file type, page name, or error code.':'没有匹配的说明，请尝试文件类型、页面名称或错误代码。');empty.setAttribute('role','status');empty.hidden=true;articles.append(empty);
    layout.append(toc,articles);view.append(layout);
    const filter=()=>{const query=search.value.trim().toLowerCase();let visible=0;for(const {article,link} of entries){const hidden=Boolean(query&&!article.dataset.search.includes(query));article.hidden=link.hidden=hidden;if(!hidden)visible++;}empty.hidden=visible!==0;};
    search.addEventListener('input',filter);filter();
    toc.addEventListener('click',event=>{const anchor=event.target.closest('a');if(!anchor)return;event.preventDefault();view.querySelector(anchor.getAttribute('href'))?.scrollIntoView({behavior:'smooth',block:'start'});});
  }
  ensure();render();document.addEventListener('neuroflow:localechange',render);global.NeuroHelp=Object.freeze({render});
})(window);
