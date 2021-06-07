/* 
打开活动页面自动注入console，需要手动执行脚本

[rewrite_local]
# 京东活动助手
https://.*\.m\.jd\.com/babelDiy/Zeus/.*\/index\.html url script-response-body jd_hd.js
https://.*\.m\.jd\.com/.*\.html url script-response-body jd_hd.js
https://jingfen\.jd\.com/.*\.html url script-response-body jd_hd.js
https://coupon\.m\.jd\.com/center/getCouponCenter\.action url script-response-body jd_hd.js
https://active.jd.com/forever/btgoose url script-response-body jd_hd.js

[mitm]
hostname = *.jd.com, *.*.jd.com
*/
const $ = new Env('京东助手');
const clickClassNames = $.getData('id77_vConsole_clickClassNames') || '';
const clickInterval = $.getData('id77_vConsole_clickInterval') || 70; // ms
const clickTime = $.getData('id77_vConsole_clickTime') || 30 * 1000; // ms
const needDisabled = $.getData('id77_vConsole_disabled') === 'yes' || false; // ms
const unClassName = $.getData('id77_vConsole_unClassName') || ''; // ms
const isTest = $.getData('id77_vConsole_test') === 'yes' || false; // ms

let html = $response.body;

if (!html.includes('<head>')) {
  $.done();
}

try {
  let cookies = [];
  $.getData('CookieJD') && cookies.push($.getData('CookieJD'));
  $.getData('CookieJD2') && cookies.push($.getData('CookieJD2'));

  const extraCookies = JSON.parse($.getData('CookiesJD') || '[]').map(
    (item) => item.cookie
  );
  cookies = Array.from(new Set([...cookies, ...extraCookies]));

  let url = $request.url.replace(/&un_area=[\d_]+/g, '');
  let sku;
  let arr = [];

  if (url.includes('graphext/draw')) {
    arr = url.match(/sku=(\d+)/);
  }
  if (url.includes('/product/')) {
    arr = url.match(/\/.*\/(\d+)\.html/);
  }

  sku = arr.length != 0 ? arr[1] : '';

  let cookieListDom = `<ul class="cks">`;

  const isJD = url.includes('jd.com') || url.includes('jingxi.com');
  if (isJD) {
    for (let index = 0; index < cookies.length; index++) {
      const cookie = cookies[index];
      const pin = cookie.match(/pt_pin=(.+?);/)[1];
      cookieListDom += `<li id="_${pin}" onclick="changeCookie('${cookie}')">${pin}</li>`;
    }
  }
  cookieListDom += `</ul>`;

  let qgInfoDom = `
  <div id="QG">
    <div id="domList">当前选中DOM: <i>点击查询</i></div>
    <div>点击间隔: ${clickInterval}ms</div>
    <div>点击时长: ${clickTime / 1000}s</div>
  </div>
  `;

  let tools =
    `
    <div id="_btns">
      <div id="cks" class="_btn"></div>
      <div id="alook" class="_btn" onclick="window.location.href='alook://${url.replace(
        /https?:\/\//g,
        ''
      )}'">
        <img src="https://alookbrowser.com/assets/uploads/profile/1-profileavatar.png" />
      </div>
      <div id="Foxok" class="_btn" onclick="window.location.href='Foxok://url?${url}'">
        <img src="https://is1-ssl.mzstatic.com/image/thumb/Purple124/v4/78/2f/51/782f518e-1db9-e819-f6fe-72d6ac851f13/source/60x60bb.jpg" />
      </div>` +
    (!sku ? `` : `<button id="smzdm" class="_btn"></button>`) +
    `</div>`;

  html =
    html.replace(/(<\/html>)/, '') +
    `
  <style>
    html, body {
      -webkit-user-select: auto !important;
      user-select: auto !important;
    }
    #alook {
      bottom: 17.8571em;
    }
    #Foxok {
      bottom: 15.5em;
    }
    #smzdm {
      bottom: 20.2143em;
      background: url(https://avatarimg.smzdm.com/default/8282685611/5d146cda8a63a-small.jpg) #FFF no-repeat 0.3571em/2.1429em;
    }
    #cks {
      top: 12.8571em;
      background: url(https://iconfont.alicdn.com/t/1520995303822.jpg@200h_200w.jpg) #FFF no-repeat 0.3571em/2.1429em;
    }
    ._btn {
      position: fixed;
      right: 0;
      z-index: 99999;
      box-sizing: content-box;
      width: 2.1429em;
      height: 2.1429em;
      padding: 0 1.4286em 0 0.3571em;
      border: 1px solid rgba(255,255,255,0.8);
      background: #FFF;
      border-radius: 50px 0 0 50px;
    }
    ._btn img {
      box-sizing: content-box;
      width: 2.1429em;
      height: 2.1429em;
      padding: 0 1.4286em 0 0.3571em;
      border: 1px solid rgba(255,255,255,0.8);
      background: #FFF;
      border-radius: 50px 0 0 50px;
    }
    .cks, #QG {
      padding: 1.1429em;
    }
    .cks li, #QG > div {
      margin-bottom: 0.7143em;
      border: 0.0714em solid #ccc;
      padding: 0.3571em;
    }
    #_btns { 
      font-size: 14px;
    }
    ._btn.hide {
      display: none !important;
    }
    #domList i {
      color: #4092BA;
    }
  </style>
  ${tools}
  <script src="https://cdnjs.cloudflare.com/ajax/libs/js-cookie/2.2.1/js.cookie.min.js"></script>
  <script>

    const currentPin = Cookies.get('pt_pin');
    const { host } = window.location;

    function clearData() {
      sessionStorage.clear();
      localStorage.clear();
      let key;
      const cookieKeys = Object.keys(Cookies.get());
      for (let n = 0; n < cookieKeys.length; n++) {
        key = cookieKeys[n];
      }
      
      const hostBlocks = host.split('.');
      let block = hostBlocks[0];
      for (let b = 1; b < hostBlocks.length; b++) {
        block = hostBlocks[b] + "." + block;
        Cookies.remove(key, { path: '/', domain: "." + block });
      }

      // Cookies.remove(key, { path: '/', domain: '.jd.com' });
    }
    
    function setCookie(cookie) {

      const other = { 
        path: '/',
        expires: 7,
        // secure: true
      };

      const domains = [
        ".jd.com",
        ".jingxi.com"
      ];

      for (let l = 0; l < domains.length; l++) {

        other.domain = domains[l];
        
        Cookies.set('pt_key', cookie.match(/pt_key=(.+?);/)[1], other);
        Cookies.set('pt_pin', cookie.match(/pt_pin=(.+?);/)[1], other);

      }

    }

    function changeCookie(cookie){
      clearData();
      setCookie(cookie);
      window.location.reload();
    }

    const btn = document.querySelector('#smzdm');
    if (btn) {
      btn.addEventListener('click',() => {
        const input = document.createElement('input');
        input.setAttribute('readonly', 'readonly');
        input.setAttribute('value', 'https://item.jd.com/${sku}.html');
        document.body.appendChild(input);
        input.setSelectionRange(0, input.value.length);
        if (document.execCommand('copy')) {
          document.execCommand('copy');
          console.log('复制成功');
        }
        document.body.removeChild(input);
        window.location.href='smzdm://';
      })
    }

    const script = document.createElement('script');
    script.src = "https://unpkg.com/vconsole/dist/vconsole.min.js";
    // script.doneState = { loaded: true, complete: true};
    script.onload = function() {
        init();
        console.log("初始化成功");
    };
    
    
    document.getElementsByTagName('head')[0].appendChild(script);
    
    
    function init () {
      
      window.vConsole = new VConsole();
      vConsole.setSwitchPosition(10, 50);
      const JDCKPlugin = new VConsole.VConsolePlugin("jd_cookie", "京东CK");
      const QGPlugin = new VConsole.VConsolePlugin("qg", "抢购工具");

      JDCKPlugin.on("renderTab", function (callback) {
        const html = \`
                      ${cookieListDom}
                    \`;
                    
        callback(html);
      });
      QGPlugin.on("renderTab", function (callback) {
        const html = \`
                      ${qgInfoDom}
                    \`;
                    
        callback(html);
      });
      
      JDCKPlugin.on("addTool", function (callback) {
       
        const toolList = [];
        toolList.push({
          name: "领券页面",
          global: false,
          onClick: function (event) {
            vConsole.showTab("default");
             
             // 脚本2
             eval(function(){function c(){var d=document.getElementById(\"loadJs\"),e=document.createElement(\"script\");d&&document.getElementsByTagName(\"head\")[0].removeChild(d),e.id=\"loadJs\",e.type=\"text/javascript\",e.src=\"https://krapnik.cn/tools/JDCouponAssistant/bundle.js\",document.getElementsByTagName(\"head\")[0].appendChild(e)}c()}())

          },
        },{
          name: "显隐图标",
          global: false,
          onClick: function (event) {
            vConsole.hide();
            const $btns = vConsole.$.all('._btn');

            if (vConsole.$.hasClass($btns[0], 'hide')) {
              // do something
              vConsole.$.removeClass($btns, 'hide');
            } else {
              vConsole.$.addClass($btns, 'hide'); 
            }

          },
        });

        const cksDom = document.querySelector('#cks');
        cksDom.addEventListener('click', () => {
          vConsole.show();
          vConsole.showTab("jd_cookie");
        })
        
        callback(toolList);
      });

      QGPlugin.on("addTool", function (callback) {
       
        const toolList = [];
        const $dom = document.querySelector('#domList');
        let intervalId;

        $dom.addEventListener('click', () => {
          vConsole.show();
          vConsole.showTab("default");
          const $clickDoms = document.querySelectorAll("${clickClassNames}");
          console.info($clickDoms)
        })

        toolList.push({
          name: "开始执行",
          global: false,
          onClick: function (event) {
            vConsole.hide();
            // vConsole.showTab("network");
            const $clickDoms = document.querySelectorAll("${clickClassNames}");
            
            for (let n = 0; n < $clickDoms.length; n++) {
              const $element = $clickDoms[n];

              if (${isTest}) {
                
                $element.click();

              } else {
              
                intervalId = setInterval(() => $element.click(),${Number(
                  clickInterval
                )});

                setTimeout(() => clearInterval(intervalId), ${Number(
                  clickTime
                )});
              }
            }
            
          },
        },{
          name: "结束执行",
          global: false,
          onClick: function (event) {
            vConsole.showTab("network");
            clearInterval(intervalId)
          },
        });

        callback(toolList);
      });
      
      JDCKPlugin.on('ready', function() {
      
        // vConsole.show();
        if (currentPin) {
          setTimeout(() => {
            document.querySelector("#_" + currentPin).style.background = '#238636';
          });
        }	 
        
        const fontSize = document.querySelector('#__vconsole').style.fontSize;

        if(fontSize) {
          document.querySelector('#_btns').style.fontSize = fontSize;
        }
        
      });
      
      if (${isJD}) {
        vConsole.addPlugin(JDCKPlugin);
      }

      if("${clickClassNames}".includes('.') || "${clickClassNames}".includes('#')) {
        vConsole.addPlugin(QGPlugin);
      }

     setTimeout(() => {
        console.log(window.location.href);

        const $btns = document.querySelectorAll("button");
        if (${needDisabled} || "${unClassName}" !== "" ) {
          for (let n = 0; n < $btns.length; n++) {
            const $btn = $btns[n];
            if (${needDisabled}) {
              $btn.removeAttribute('disabled');
            }
            if ("${unClassName}" !== "") {
              $btn.classList.remove("${unClassName}");
            }
          }
        }  
        
        const $clickDoms = document.querySelectorAll("${clickClassNames}");
        if ("${unClassName}" !== "") {
          for (let n = 0; n < $clickDoms.length; n++) {
            const $element = $clickDoms[n];
            $element.classList.remove("${unClassName}");
          }
        }
     });
      
    }
  </script>
</html>
`;
} catch (error) {
  console.log(error);
}

$.done({ body: html });

// https://github.com/chavyleung/scripts/blob/master/Env.js
// prettier-ignore
function Env(name, opts) {
  class Http {
    constructor(env) {
      this.env = env;
    }

    send(opts, method = 'GET') {
      opts = typeof opts === 'string' ? { url: opts } : opts;
      let sender = this.get;
      if (method === 'POST') {
        sender = this.post;
      }
      return new Promise((resolve, reject) => {
        sender.call(this, opts, (err, resp, body) => {
          if (err) reject(err);
          else resolve(resp);
        });
      });
    }

    get(opts) {
      return this.send.call(this.env, opts);
    }

    post(opts) {
      return this.send.call(this.env, opts, 'POST');
    }
  }

  return new (class {
    constructor(name, opts) {
      this.name = name;
      this.http = new Http(this);
      this.data = null;
      this.dataFile = 'box.dat';
      this.logs = [];
      this.isMute = false;
      this.isNeedRewrite = false;
      this.logSeparator = '\n';
      this.startTime = new Date().getTime();
      Object.assign(this, opts);
      this.log('', `🔔${this.name}, 开始!`);
    }

    isNode() {
      return 'undefined' !== typeof module && !!module.exports;
    }

    isQuanX() {
      return 'undefined' !== typeof $task;
    }

    isSurge() {
      return 'undefined' !== typeof $httpClient && 'undefined' === typeof $loon;
    }

    isLoon() {
      return 'undefined' !== typeof $loon;
    }

    isShadowrocket() {
      return 'undefined' !== typeof $rocket;
    }

    toObj(str, defaultValue = null) {
      try {
        return JSON.parse(str);
      } catch {
        return defaultValue;
      }
    }

    toStr(obj, defaultValue = null) {
      try {
        return JSON.stringify(obj);
      } catch {
        return defaultValue;
      }
    }

    getJson(key, defaultValue) {
      let json = defaultValue;
      const val = this.getData(key);
      if (val) {
        try {
          json = JSON.parse(this.getData(key));
        } catch {}
      }
      return json;
    }

    setJson(val, key) {
      try {
        return this.setData(JSON.stringify(val), key);
      } catch {
        return false;
      }
    }

    getScript(url) {
      return new Promise((resolve) => {
        this.get({ url }, (err, resp, body) => resolve(body));
      });
    }

    runScript(script, runOpts) {
      return new Promise((resolve) => {
        let httpApi = this.getData('@chavy_boxjs_userCfgs.httpApi');
        httpApi = httpApi ? httpApi.replace(/\n/g, '').trim() : httpApi;
        let httpApi_timeout = this.getData(
          '@chavy_boxjs_userCfgs.httpApi_timeout'
        );
        httpApi_timeout = httpApi_timeout ? httpApi_timeout * 1 : 20;
        httpApi_timeout =
          runOpts && runOpts.timeout ? runOpts.timeout : httpApi_timeout;
        const [key, addr] = httpApi.split('@');
        const opts = {
          url: `http://${addr}/v1/scripting/evaluate`,
          body: {
            script_text: script,
            mock_type: 'cron',
            timeout: httpApi_timeout,
          },
          headers: { 'X-Key': key, Accept: '*/*' },
        };
        this.post(opts, (err, resp, body) => resolve(body));
      }).catch((e) => this.logErr(e));
    }

    loadData() {
      if (this.isNode()) {
        this.fs = this.fs ? this.fs : require('fs');
        this.path = this.path ? this.path : require('path');
        const curDirDataFilePath = this.path.resolve(this.dataFile);
        const rootDirDataFilePath = this.path.resolve(
          process.cwd(),
          this.dataFile
        );
        const isCurDirDataFile = this.fs.existsSync(curDirDataFilePath);
        const isRootDirDataFile =
          !isCurDirDataFile && this.fs.existsSync(rootDirDataFilePath);
        if (isCurDirDataFile || isRootDirDataFile) {
          const datPath = isCurDirDataFile
            ? curDirDataFilePath
            : rootDirDataFilePath;
          try {
            return JSON.parse(this.fs.readFileSync(datPath));
          } catch (e) {
            return {};
          }
        } else return {};
      } else return {};
    }

    writeData() {
      if (this.isNode()) {
        this.fs = this.fs ? this.fs : require('fs');
        this.path = this.path ? this.path : require('path');
        const curDirDataFilePath = this.path.resolve(this.dataFile);
        const rootDirDataFilePath = this.path.resolve(
          process.cwd(),
          this.dataFile
        );
        const isCurDirDataFile = this.fs.existsSync(curDirDataFilePath);
        const isRootDirDataFile =
          !isCurDirDataFile && this.fs.existsSync(rootDirDataFilePath);
        const jsonData = JSON.stringify(this.data);
        if (isCurDirDataFile) {
          this.fs.writeFileSync(curDirDataFilePath, jsonData);
        } else if (isRootDirDataFile) {
          this.fs.writeFileSync(rootDirDataFilePath, jsonData);
        } else {
          this.fs.writeFileSync(curDirDataFilePath, jsonData);
        }
      }
    }

    lodash_get(source, path, defaultValue = undefined) {
      const paths = path.replace(/\[(\d+)\]/g, '.$1').split('.');
      let result = source;
      for (const p of paths) {
        result = Object(result)[p];
        if (result === undefined) {
          return defaultValue;
        }
      }
      return result;
    }

    lodash_set(obj, path, value) {
      if (Object(obj) !== obj) return obj;
      if (!Array.isArray(path)) path = path.toString().match(/[^.[\]]+/g) || [];
      path
        .slice(0, -1)
        .reduce(
          (a, c, i) =>
            Object(a[c]) === a[c]
              ? a[c]
              : (a[c] = Math.abs(path[i + 1]) >> 0 === +path[i + 1] ? [] : {}),
          obj
        )[path[path.length - 1]] = value;
      return obj;
    }

    getData(key) {
      let val = this.getVal(key);
      // 如果以 @
      if (/^@/.test(key)) {
        const [, objKey, paths] = /^@(.*?)\.(.*?)$/.exec(key);
        const objVal = objKey ? this.getVal(objKey) : '';
        if (objVal) {
          try {
            const objedVal = JSON.parse(objVal);
            val = objedVal ? this.lodash_get(objedVal, paths, '') : val;
          } catch (e) {
            val = '';
          }
        }
      }
      return val;
    }

    setData(val, key) {
      let isSuc = false;
      if (/^@/.test(key)) {
        const [, objKey, paths] = /^@(.*?)\.(.*?)$/.exec(key);
        const objdat = this.getVal(objKey);
        const objVal = objKey
          ? objdat === 'null'
            ? null
            : objdat || '{}'
          : '{}';
        try {
          const objedVal = JSON.parse(objVal);
          this.lodash_set(objedVal, paths, val);
          isSuc = this.setVal(JSON.stringify(objedVal), objKey);
        } catch (e) {
          const objedVal = {};
          this.lodash_set(objedVal, paths, val);
          isSuc = this.setVal(JSON.stringify(objedVal), objKey);
        }
      } else {
        isSuc = this.setVal(val, key);
      }
      return isSuc;
    }

    getVal(key) {
      if (this.isSurge() || this.isLoon()) {
        return $persistentStore.read(key);
      } else if (this.isQuanX()) {
        return $prefs.valueForKey(key);
      } else if (this.isNode()) {
        this.data = this.loadData();
        return this.data[key];
      } else {
        return (this.data && this.data[key]) || null;
      }
    }

    setVal(val, key) {
      if (this.isSurge() || this.isLoon()) {
        return $persistentStore.write(val, key);
      } else if (this.isQuanX()) {
        return $prefs.setValueForKey(val, key);
      } else if (this.isNode()) {
        this.data = this.loadData();
        this.data[key] = val;
        this.writeData();
        return true;
      } else {
        return (this.data && this.data[key]) || null;
      }
    }

    initGotEnv(opts) {
      this.got = this.got ? this.got : require('got');
      this.ckTough = this.ckTough ? this.ckTough : require('tough-cookie');
      this.ckJar = this.ckJar ? this.ckJar : new this.ckTough.CookieJar();
      if (opts) {
        opts.headers = opts.headers ? opts.headers : {};
        if (undefined === opts.headers.Cookie && undefined === opts.cookieJar) {
          opts.cookieJar = this.ckJar;
        }
      }
    }

    get(opts, callback = () => {}) {
      if (opts.headers) {
        delete opts.headers['Content-Type'];
        delete opts.headers['Content-Length'];
      }
      if (this.isSurge() || this.isLoon()) {
        if (this.isSurge() && this.isNeedRewrite) {
          opts.headers = opts.headers || {};
          Object.assign(opts.headers, { 'X-Surge-Skip-Scripting': false });
        }
        $httpClient.get(opts, (err, resp, body) => {
          if (!err && resp) {
            resp.body = body;
            resp.statusCode = resp.status;
          }
          callback(err, resp, body);
        });
      } else if (this.isQuanX()) {
        if (this.isNeedRewrite) {
          opts.opts = opts.opts || {};
          Object.assign(opts.opts, { hints: false });
        }
        $task.fetch(opts).then(
          (resp) => {
            const { statusCode: status, statusCode, headers, body } = resp;
            callback(null, { status, statusCode, headers, body }, body);
          },
          (err) => callback(err)
        );
      } else if (this.isNode()) {
        this.initGotEnv(opts);
        this.got(opts)
          .on('redirect', (resp, nextOpts) => {
            try {
              if (resp.headers['set-cookie']) {
                const ck = resp.headers['set-cookie']
                  .map(this.ckTough.Cookie.parse)
                  .toString();
                if (ck) {
                  this.ckJar.setCookieSync(ck, null);
                }
                nextOpts.cookieJar = this.ckJar;
              }
            } catch (e) {
              this.logErr(e);
            }
            // this.ckJar.setCookieSync(resp.headers['set-cookie'].map(Cookie.parse).toString())
          })
          .then(
            (resp) => {
              const { statusCode: status, statusCode, headers, body } = resp;
              callback(null, { status, statusCode, headers, body }, body);
            },
            (err) => {
              const { message: error, response: resp } = err;
              callback(error, resp, resp && resp.body);
            }
          );
      }
    }

    post(opts, callback = () => {}) {
      const method = opts.method ? opts.method.toLocaleLowerCase() : 'post';
      // 如果指定了请求体, 但没指定`Content-Type`, 则自动生成
      if (opts.body && opts.headers && !opts.headers['Content-Type']) {
        opts.headers['Content-Type'] = 'application/x-www-form-urlencoded';
      }
      if (opts.headers) delete opts.headers['Content-Length'];
      if (this.isSurge() || this.isLoon()) {
        if (this.isSurge() && this.isNeedRewrite) {
          opts.headers = opts.headers || {};
          Object.assign(opts.headers, { 'X-Surge-Skip-Scripting': false });
        }
        $httpClient[method](opts, (err, resp, body) => {
          if (!err && resp) {
            resp.body = body;
            resp.statusCode = resp.status;
          }
          callback(err, resp, body);
        });
      } else if (this.isQuanX()) {
        opts.method = method;
        if (this.isNeedRewrite) {
          opts.opts = opts.opts || {};
          Object.assign(opts.opts, { hints: false });
        }
        $task.fetch(opts).then(
          (resp) => {
            const { statusCode: status, statusCode, headers, body } = resp;
            callback(null, { status, statusCode, headers, body }, body);
          },
          (err) => callback(err)
        );
      } else if (this.isNode()) {
        this.initGotEnv(opts);
        const { url, ..._opts } = opts;
        this.got[method](url, _opts).then(
          (resp) => {
            const { statusCode: status, statusCode, headers, body } = resp;
            callback(null, { status, statusCode, headers, body }, body);
          },
          (err) => {
            const { message: error, response: resp } = err;
            callback(error, resp, resp && resp.body);
          }
        );
      }
    }
    /**
     *
     * 示例:$.time('yyyy-MM-dd qq HH:mm:ss.S')
     *    :$.time('yyyyMMddHHmmssS')
     *    y:年 M:月 d:日 q:季 H:时 m:分 s:秒 S:毫秒
     *    其中y可选0-4位占位符、S可选0-1位占位符，其余可选0-2位占位符
     * @param {string} fmt 格式化参数
     * @param {number} 可选: 根据指定时间戳返回格式化日期
     *
     */
    time(fmt, ts = null) {
      const date = ts ? new Date(ts) : new Date();
      let o = {
        'M+': date.getMonth() + 1,
        'd+': date.getDate(),
        'H+': date.getHours(),
        'm+': date.getMinutes(),
        's+': date.getSeconds(),
        'q+': Math.floor((date.getMonth() + 3) / 3),
        S: date.getMilliseconds(),
      };
      if (/(y+)/.test(fmt))
        fmt = fmt.replace(
          RegExp.$1,
          (date.getFullYear() + '').substr(4 - RegExp.$1.length)
        );
      for (let k in o)
        if (new RegExp('(' + k + ')').test(fmt))
          fmt = fmt.replace(
            RegExp.$1,
            RegExp.$1.length == 1
              ? o[k]
              : ('00' + o[k]).substr(('' + o[k]).length)
          );
      return fmt;
    }

    /**
     * 系统通知
     *
     * > 通知参数: 同时支持 QuanX 和 Loon 两种格式, EnvJs根据运行环境自动转换, Surge 环境不支持多媒体通知
     *
     * 示例:
     * $.msg(title, subt, desc, 'twitter://')
     * $.msg(title, subt, desc, { 'open-url': 'twitter://', 'media-url': 'https://github.githubassets.com/images/modules/open_graph/github-mark.png' })
     * $.msg(title, subt, desc, { 'open-url': 'https://bing.com', 'media-url': 'https://github.githubassets.com/images/modules/open_graph/github-mark.png' })
     *
     * @param {*} title 标题
     * @param {*} subt 副标题
     * @param {*} desc 通知详情
     * @param {*} opts 通知参数
     *
     */
    msg(title = name, subt = '', desc = '', opts) {
      const toEnvOpts = (rawOpts) => {
        if (!rawOpts) return rawOpts;
        if (typeof rawOpts === 'string') {
          if (this.isLoon()) return rawOpts;
          else if (this.isQuanX()) return { 'open-url': rawOpts };
          else if (this.isSurge()) return { url: rawOpts };
          else return undefined;
        } else if (typeof rawOpts === 'object') {
          if (this.isLoon()) {
            let openUrl = rawOpts.openUrl || rawOpts.url || rawOpts['open-url'];
            let mediaUrl = rawOpts.mediaUrl || rawOpts['media-url'];
            return { openUrl, mediaUrl };
          } else if (this.isQuanX()) {
            let openUrl = rawOpts['open-url'] || rawOpts.url || rawOpts.openUrl;
            let mediaUrl = rawOpts['media-url'] || rawOpts.mediaUrl;
            let updatePasteboard =
              rawOpts['update-pasteboard'] || rawOpts.updatePasteboard;
            return {
              'open-url': openUrl,
              'media-url': mediaUrl,
              'update-pasteboard': updatePasteboard,
            };
          } else if (this.isSurge()) {
            let openUrl = rawOpts.url || rawOpts.openUrl || rawOpts['open-url'];
            return { url: openUrl };
          }
        } else {
          return undefined;
        }
      };
      if (!this.isMute) {
        if (this.isSurge() || this.isLoon()) {
          $notification.post(title, subt, desc, toEnvOpts(opts));
        } else if (this.isQuanX()) {
          $notify(title, subt, desc, toEnvOpts(opts));
        }
      }
      if (!this.isMuteLog) {
        let logs = ['', '==============📣系统通知📣=============='];
        logs.push(title);
        subt ? logs.push(subt) : '';
        desc ? logs.push(desc) : '';
        console.log(logs.join('\n'));
        this.logs = this.logs.concat(logs);
      }
    }

    log(...logs) {
      if (logs.length > 0) {
        this.logs = [...this.logs, ...logs];
      }
      console.log(logs.join(this.logSeparator));
    }

    logErr(err, msg) {
      const isPrintSack = !this.isSurge() && !this.isQuanX() && !this.isLoon();
      if (!isPrintSack) {
        this.log('', `❗️${this.name}, 错误!`, err);
      } else {
        this.log('', `❗️${this.name}, 错误!`, err.stack);
      }
    }

    wait(time) {
      return new Promise((resolve) => setTimeout(resolve, time));
    }

    done(val = {}) {
      const endTime = new Date().getTime();
      const costTime = (endTime - this.startTime) / 1000;
      this.log('', `🔔${this.name}, 结束! 🕛 ${costTime} 秒`);
      this.log();
      if (this.isSurge() || this.isQuanX() || this.isLoon()) {
        $done(val);
      }
    }
  })(name, opts);
}
