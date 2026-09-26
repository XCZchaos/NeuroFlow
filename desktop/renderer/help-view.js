/* 离线使用说明：内容与渲染分离，稳定的 help-<id> 仍供 Agent 定位章节。
 * 文档只通过 textContent 渲染；命令和示例是文字，不会作为 HTML 或脚本执行。 */
(function createHelpView(global) {
  'use strict';
  const i18n = global.NeuroI18n;
  const el = (tag, className, text) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  };

  function ensure() {
    if (document.querySelector('[data-view="help"]')) return;
    const button = el('button', 'nav-item');
    button.dataset.view = 'help';
    button.append(el('span', '', '?'), el('span', 'help-nav-label i18n-text'));
    document.querySelector('.nav-item[data-view="sessions"]').after(button);
    const view = el('section', 'card alternative-view help-view');
    view.id = 'help-view'; view.hidden = true;
    document.querySelector('main').append(view);
  }

  // 每类内容有固定语义，新增章节无需再修改渲染器或追加一组特殊排版规则。
  function renderBlock(block) {
    if (block.type === 'paragraph') return el('p', '', block.text);
    const section = el('div', `help-block help-${block.type}`);
    if (block.title) section.append(el('h4', '', block.title));
    if (block.type === 'steps' || block.type === 'list') {
      const list = el(block.type === 'steps' ? 'ol' : 'ul');
      for (const item of block.items) list.append(el('li', '', item));
      section.append(list);
    } else if (block.type === 'table') {
      // 表格在自己的区域横向滚动，不把整页或右侧对话面板撑宽。
      section.tabIndex = 0;
      section.setAttribute('role', 'region');
      section.setAttribute('aria-label', block.headers.join(' / '));
      const table = el('table'), head = el('thead'), row = el('tr'), body = el('tbody');
      for (const header of block.headers) {
        const cell = el('th', '', header); cell.scope = 'col'; row.append(cell);
      }
      head.append(row);
      for (const values of block.rows) {
        const tr = el('tr');
        for (const value of values) tr.append(el('td', '', value));
        body.append(tr);
      }
      table.append(head, body); section.append(table);
    } else if (block.type === 'code') {
      const pre = el('pre'); pre.append(el('code', '', block.text)); section.append(pre);
    } else {
      section.append(el(block.type === 'example' ? 'blockquote' : 'p', '', block.text));
    }
    return section;
  }

  function render() {
    ensure();
    const english = i18n.getLocale() === 'en', lang = english ? 'en' : 'zh';
    const content = global.NeuroHelpContent[lang], view = document.querySelector('#help-view');
    const previousQuery = view.querySelector('#help-search')?.value || '';
    const previousTopic = view.dataset.activeTopic;
    document.querySelector('.help-nav-label').textContent = english ? 'User guide' : '使用说明';
    view.replaceChildren();
    const version = document.querySelector('meta[name="application-version"]')?.content || '';
    const heading = el('header', 'help-heading'), intro = el('div');
    const title = el('h2', '', english ? 'User guide' : '软件使用说明');
    title.append(el('span', 'help-version', 'v' + version.replace(/\.0$/, '')));
    intro.append(el('div', 'eyebrow', 'NEUROFLOW GUIDE'), title,
      el('p', '', english ? 'From your first recording to verified results. Available offline.' : '从第一次导入，到确认分析结果。随软件提供，可离线查阅。'));
    const search = el('input'); search.id = 'help-search'; search.type = 'search';
    search.placeholder = english ? 'Search: CSV, sleep, 429…' : '搜索：CSV、睡眠、429…';
    search.setAttribute('aria-label', english ? 'Search the user guide' : '搜索使用说明');
    search.value = previousQuery;
    heading.append(intro, search); view.append(heading);

    const shortcuts = el('nav', 'help-shortcuts');
    shortcuts.setAttribute('aria-label', english ? 'Common tasks' : '常用入口');
    shortcuts.append(el('span', '', english ? 'Jump to' : '快速查阅'));
    for (const id of ['llm', 'import', 'quickstart', 'sleep', 'errors']) {
      const item = content.find(topic => topic.id === id), link = el('a', '', item.title);
      link.href = `#help-${id}`; shortcuts.append(link);
    }
    view.append(shortcuts);

    const layout = el('div', 'help-layout'), toc = el('nav', 'help-toc'), articles = el('div', 'help-articles');
    toc.setAttribute('aria-label', english ? 'Guide contents' : '说明目录');
    const status = el('p', 'help-search-status'); status.id = 'help-search-status';
    status.setAttribute('role', 'status'); status.setAttribute('aria-live', 'polite');
    search.setAttribute('aria-describedby', status.id); toc.append(status);
    const entries = [], groups = [];
    for (const [index, group] of global.NeuroHelpContent.groups.entries()) {
      const section = el('div', 'help-toc-group'); section.dataset.group = group.id;
      section.append(el('h3', '', `${String(index + 1).padStart(2, '0')} / ${group.label[lang]}`));
      const members = [];
      for (const item of content.filter(topic => topic.group === group.id)) {
        const link = el('a', '', item.title); link.href = `#help-${item.id}`; section.append(link);
        const article = el('article'); article.id = `help-${item.id}`; article.tabIndex = -1;
        article.setAttribute('aria-labelledby', `${article.id}-title`);
        const h3 = el('h3', '', item.title); h3.id = `${article.id}-title`;
        article.append(el('p', 'help-section-label', group.label[lang]), h3, el('p', 'help-summary', item.summary));
        for (const block of item.blocks) article.append(renderBlock(block));
        article.dataset.search = article.textContent.toLocaleLowerCase();
        articles.append(article);
        const entry = {article, link}; entries.push(entry); members.push(entry);
      }
      groups.push({section, members}); toc.append(section);
    }
    const empty = el('p', 'help-empty', english ? 'No matching topics. Try a file type, page name or error code.' : '没有匹配的说明，请尝试文件类型、页面名称或错误代码。');
    empty.hidden = true; articles.append(empty); layout.append(toc, articles); view.append(layout);

    function selectTopic(id) {
      view.dataset.activeTopic = id || '';
      for (const {article, link} of entries) {
        if (article.id === id) link.setAttribute('aria-current', 'location');
        else link.removeAttribute('aria-current');
      }
    }
    function filter() {
      // 空格分隔的词共同匹配一个章节，包含表格、命令及提示中的文字。
      const words = search.value.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
      let visible = 0;
      for (const {article, link} of entries) {
        article.hidden = link.hidden = !words.every(word => article.dataset.search.includes(word));
        if (!article.hidden) visible++;
      }
      for (const {section, members} of groups) section.hidden = members.every(entry => entry.article.hidden);
      status.textContent = english ? `${visible} of ${entries.length} topics` : `${visible} / ${entries.length} 个章节`;
      empty.hidden = visible !== 0;
      const current = entries.find(entry => entry.article.id === view.dataset.activeTopic);
      if (current?.article.hidden) selectTopic('');
    }
    selectTopic(previousTopic); search.addEventListener('input', filter); filter();
    function navigate(event) {
      const anchor = event.target.closest('a');
      if (!anchor) return;
      const id = anchor.getAttribute('href').slice(1), target = document.getElementById(id);
      if (!target) return;
      event.preventDefault();
      // 快捷入口始终可用：若目标被搜索隐藏，先恢复目录，再定位到该章节。
      if (target.hidden) { search.value = ''; filter(); }
      selectTopic(id); target.focus({preventScroll:true});
      target.scrollIntoView({behavior:global.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block:'start'});
    }
    toc.addEventListener('click', navigate); shortcuts.addEventListener('click', navigate);
  }
  ensure(); render(); document.addEventListener('neuroflow:localechange', render);
  global.NeuroHelp = Object.freeze({render});
})(window);
