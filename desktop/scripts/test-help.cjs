// Real renderer regression: no provider requests and no documentation commands run.
const {app, BrowserWindow} = require('electron');
const path = require('node:path'), fs = require('node:fs');
const cache = path.join(__dirname, '../../.cache');
app.setPath('userData', path.join(cache, 'help-electron'));
app.disableHardwareAcceleration();
// Exercise keyboard/navigation behavior without an in-flight smooth scroll
// racing the immediate locale changes and layout snapshots in this test.
app.commandLine.appendSwitch('force-prefers-reduced-motion');
const timeout = setTimeout(() => { console.error('Help regression timed out'); app.exit(1); }, 45000);
app.whenReady().then(async () => {
  const win = new BrowserWindow({show:false, width:1600, height:1000,
    webPreferences:{contextIsolation:true, nodeIntegration:false, offscreen:true, backgroundThrottling:false}});
  try {
    // The guide is offline. Fail external requests rather than touching live services.
    win.webContents.session.webRequest.onBeforeRequest({urls:['http://*/*', 'https://*/*']}, (_details, callback) => callback({cancel:true}));
    await win.loadFile(path.join(__dirname, '../renderer/index.html'));
    const result = await win.webContents.executeJavaScript(`(async () => {
      const assert = (ok, message) => { if (!ok) throw Error(message); };
      const q = selector => document.querySelector(selector);
      const all = selector => [...document.querySelectorAll(selector)];
      state.backend = 'demo'; NeuroI18n.setLocale('zh-CN'); q('[data-view="help"]').click();
      const data = NeuroHelpContent;
      assert(data.zh.length === 20 && data.en.length === 20, 'Missing guide chapters');
      assert(data.groups.length === 5, 'Missing navigation phases');
      assert(new Set(data.zh.map(t => t.id)).size === 20, 'Duplicate topic IDs');
      for (let i = 0; i < data.zh.length; i++) {
        const zh = data.zh[i], en = data.en[i];
        assert(zh.id === en.id && zh.group === en.group && zh.blocks.length === en.blocks.length, 'Bilingual topic mismatch');
        assert(data.groups.some(g => g.id === zh.group), 'Orphaned topic group');
        for (const key of ['title', 'summary']) assert(zh[key] && en[key], 'Empty topic text');
        for (let j = 0; j < zh.blocks.length; j++) {
          const a = zh.blocks[j], b = en.blocks[j];
          assert(a.type === b.type, 'Bilingual block mismatch');
          for (const key of ['title', 'text', 'items', 'headers', 'rows']) {
            assert(Boolean(a[key]) === Boolean(b[key]), 'Missing block translation');
            if (Array.isArray(a[key])) assert(a[key].length === b[key].length, 'Bilingual list/table mismatch');
          }
          if (a.rows) for (const block of [a, b]) assert(block.rows.every(row => row.length === block.headers.length), 'Uneven table');
        }
      }
      assert(all('#help-view article').length === 20, 'Articles failed to render');
      assert(all('.help-toc-group').length === 5 && all('.help-shortcuts a').length === 5, 'Navigation missing');
      assert(q('.help-steps ol') && q('.help-table table') && q('.help-result') && q('.help-code pre code'), 'Typed content missing');
      const search = value => { q('#help-search').value = value; q('#help-search').dispatchEvent(new Event('input')); };
      search('429');
      assert(!q('#help-errors').hidden && q('#help-overview').hidden, 'Table text not searchable');
      assert(all('.help-toc-group:not([hidden])').length < 5, 'Empty groups stay visible');
      search('Air Background'); assert(!q('#help-services').hidden, 'Multiword/code search failed');
      search('no-such-topic-9876');
      assert(!q('.help-empty').hidden && all('#help-view article:not([hidden])').length === 0, 'Empty search state failed');
      q('.help-shortcuts a[href="#help-llm"]').click();
      assert(q('#help-search').value === '' && !q('#help-llm').hidden, 'Shortcut did not reveal hidden target');
      assert(q('.help-toc a[aria-current]').hash === '#help-llm', 'Selected topic not indicated');
      assert(document.activeElement.id === 'help-llm', 'Jump did not move keyboard focus');
      assert(getComputedStyle(q('#help-view')).overflowY === 'clip', 'Guide creates a hidden nested scroll container');
      search('429'); NeuroI18n.setLocale('en');
      assert(q('#help-search').value === '429' && !q('#help-errors').hidden, 'Locale change lost search');
      assert(q('#help-errors h3').textContent === 'Troubleshoot by symptom', 'English title missing');
      assert(!/[\\u3400-\\u9fff]/u.test(q('#help-view').textContent), 'Chinese content leaked into English guide');
      search(''); q('#help-agent h3').click();
      const snapshot = NeuroComponents.snapshot('help', '');
      assert(snapshot.focused_component_id === 'help', 'Help component focus missing');
      assert(snapshot.components[0].selected_control.topic === 'help-agent', 'Stable topic ID lost');
      assert(snapshot.components[0].state.excerpt.includes('Agent'), 'Agent topic excerpt missing');
      // Literal examples must remain text even if a future editor pastes HTML.
      const block = data.en[0].blocks[0], original = block.text;
      try {
        block.text = '<img src=x onerror="window.helpExecuted=true">'; NeuroHelp.render();
        assert(q('#help-overview').textContent.includes('<img src=x'), 'Example text was transformed');
        assert(!q('#help-overview img') && !window.helpExecuted, 'Documentation executed HTML');
      } finally { block.text = original; NeuroI18n.setLocale('zh-CN'); }
      return 'Passed: bilingual structure, typed content, grouped navigation, search, shortcut/focus, locale retention, Agent topic context and literal rendering';
    })()`);
    console.log(result);
    for (const width of [1600, 1200, 1000]) {
      win.setSize(width, 1000);
      for (const theme of ['dark', 'light']) {
        await win.webContents.executeJavaScript(`document.documentElement.dataset.theme='${theme}';`);
        await new Promise(resolve => setTimeout(resolve, 180));
        const layout = await win.webContents.executeJavaScript(`(() => {
          const view = document.querySelector('#help-view');
          const bad = [...view.querySelectorAll('.help-heading,.help-shortcuts,.help-layout,.help-articles,article')]
            .filter(el => el.scrollWidth > el.clientWidth + 2).map(el => el.id || el.className);
          if (bad.length) throw Error('Guide overflow: ' + bad.join(', '));
          const columns = getComputedStyle(document.querySelector('.help-layout')).gridTemplateColumns;
          if (view.clientWidth <= 760 && columns.split(' ').length !== 1) throw Error('Narrow guide retained two columns');
          return {width:view.clientWidth, columns};
        })()`);
        console.log(`Layout ${width}px ${theme}: ${JSON.stringify(layout)}`);
        if (width === 1600 && theme === 'dark') {
          await win.webContents.executeJavaScript(`window.scrollTo({top:0,behavior:'instant'}); document.querySelector('.help-toc').scrollTop=0;`);
          await new Promise(resolve => setTimeout(resolve, 200));
          const headerState = await win.webContents.executeJavaScript(`({viewScroll:document.querySelector('#help-view').scrollTop, headerTop:document.querySelector('.help-heading').getBoundingClientRect().top, windowScroll:window.scrollY, rootScroll:document.scrollingElement.scrollTop, parents:[...document.querySelectorAll('.shell,main,.app-content')].map(n=>({name:n.className,scroll:n.scrollTop,top:n.getBoundingClientRect().top,overflow:getComputedStyle(n).overflowY}))})`);
          if (headerState.viewScroll !== 0 || headerState.headerTop < 0) throw Error('Chapter navigation hid the search header: ' + JSON.stringify(headerState));
          fs.mkdirSync(cache, {recursive:true});
          fs.writeFileSync(path.join(cache, 'help-refactor-preview.png'), (await win.webContents.capturePage()).toPNG());
        }
      }
    }
    clearTimeout(timeout); app.exit(0);
  } catch (error) { console.error(error); clearTimeout(timeout); app.exit(1); }
});
