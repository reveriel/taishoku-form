/* =========================================================
   退職届・休暇届 作成ツール — script.js
   純粋なフロントエンドのみ。外部通信は行いません。
   ========================================================= */
(function () {
  'use strict';

  /* ---------------------------------------------------------
     ユーティリティ
     --------------------------------------------------------- */

  function $(id) { return document.getElementById(id); }

  function esc(str) {
    return String(str == null ? '' : str).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function nl2br(str) { return esc(str).replace(/\n/g, '<br>'); }

  function val(id) {
    var el = $(id);
    return el ? String(el.value || '').trim() : '';
  }

  function ph(text) { return '<span class="ph">' + esc(text) + '</span>'; }

  /* 入力値があればエスケープして返し、無ければ淡色プレースホルダを返す */
  function valOr(id, placeholder) {
    var v = val(id);
    return v ? esc(v) : ph(placeholder);
  }

  function parseISO(iso) {
    if (!iso) return null;
    var p = String(iso).split('-');
    if (p.length !== 3) return null;
    var d = new Date(Number(p[0]), Number(p[1]) - 1, Number(p[2]));
    return isNaN(d.getTime()) ? null : d;
  }

  function pad2(n) { return (n < 10 ? '0' : '') + n; }

  function todayISO() {
    var d = new Date();
    return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate());
  }

  var WD = ['日', '月', '火', '水', '木', '金', '土'];

  function eraOf(d) {
    var y = d.getFullYear();
    var reiwaStart = new Date(2019, 4, 1); // 2019-05-01
    var heiseiStart = new Date(1989, 0, 8); // 1989-01-08
    if (d >= reiwaStart) return { name: '令和', year: y - 2018 };
    if (d >= heiseiStart) return { name: '平成', year: y - 1988 };
    return null;
  }

  /* 日付を「令和8年10月12日」または「2026年10月12日」で返す */
  function fmtDate(iso) {
    var d = parseISO(iso);
    if (!d) return '';
    var y = d.getFullYear();
    var m = d.getMonth() + 1;
    var day = d.getDate();
    if (val('dateFormat') !== 'seireki') {
      var era = eraOf(d);
      if (era) return era.name + (era.year === 1 ? '元' : era.year) + '年' + m + '月' + day + '日';
    }
    return y + '年' + m + '月' + day + '日';
  }

  function fmtDateWD(iso) {
    var d = parseISO(iso);
    var base = fmtDate(iso);
    if (!d || !base) return '';
    return base + '（' + WD[d.getDay()] + '）';
  }

  function fmtDateOrPh(iso, placeholder) {
    var s = fmtDate(iso);
    return s ? esc(s) : ph(placeholder);
  }

  function fmtTime(t) {
    return t ? esc(t) : ph('10:00');
  }

  function daysBetween(fromISO, toISO) {
    var a = parseISO(fromISO);
    var b = parseISO(toISO);
    if (!a || !b) return 0;
    var n = Math.round((b.getTime() - a.getTime()) / 86400000) + 1;
    return n > 0 ? n : 0;
  }

  /* ---------------------------------------------------------
     書式メタ情報
     --------------------------------------------------------- */

  var DOC_META = {
    taishokutodoke: {
      vertical: true,
      note: {
        zh: '竖排（縦書き）。惯例：标题「退職届」→ 正文 → 提交日 → 收件人 → 本人所属・姓名・盖章，从右往左。',
        ja: '縦書き。「退職届」の表題、本文、提出日、宛名、差出人の順に右から左へ書きます。'
      }
    },
    taishokugan: {
      vertical: true,
      note: {
        zh: '竖排（縦書き）。退職願是「请公司批准」的申请书形式，措辞用「お願い申し上げます」。',
        ja: '縦書き。「退職させてください」と願い出る申請書形式で、末尾は「お願い申し上げます」とします。'
      }
    },
    kyukatodoke: {
      vertical: false,
      note: {
        zh: '横排。附上「記」与「以上」，逐条写明休暇期間・区分・事由。期间会自动计算天数与星期。',
        ja: '横書き。「記」「以上」で本文を挟み、休暇期間・区分・事由を箇条書きにします。期間から日数と曜日を自動計算します。'
      }
    },
    chikoku: {
      vertical: false,
      note: {
        zh: '横排。日時・区分（迟到/早退）・事由。标题会随区分自动切换为「遅刻届」或「早退届」。',
        ja: '横書き。日時・区分（遅刻／早退）・事由を記載します。区分に応じて表題が「遅刻届」「早退届」に切り替わります。'
      }
    },
    jinin: {
      vertical: true,
      note: {
        zh: '竖排（縦書き）。用于辞去董事・监事等役職，需写明辞任的职位与辞任日。',
        ja: '縦書き。取締役・監査役などの役職を辞する届出で、辞任する役職と辞任日を明記します。'
      }
    },
    shimatsusho: {
      vertical: false,
      note: {
        zh: '横排。按「経緯 → 原因 → 再発防止策」逐条陈述，末尾以「以上」收尾并盖章。',
        ja: '横書き。「経緯 → 原因 → 再発防止策」を箇条書きにし、末尾に「以上」と押印を添えます。'
      }
    }
  };

  var currentType = 'taishokutodoke';

  /* ---------------------------------------------------------
     多言語（画面のみ。文書は常に日本語）
     --------------------------------------------------------- */

  var I18N = {
    brandName:  { zh: '退職届・休暇届 作成ツール', ja: '退職届・休暇届 作成ツール' },
    tagline:    { zh: '免费・无需注册・浏览器内完成', ja: '無料・登録不要・ブラウザだけで完結' },
    btnPrint:   { zh: '打印 / 保存 PDF', ja: '印刷 / PDF保存' },
    btnReset:   { zh: '清空重填', ja: 'リセット' },
    btnSample:  { zh: '一键填入示例', ja: '記入例を入れる' },
    btnLang:    { zh: '日本語', ja: '中文' },

    formTitle:  { zh: '选择书式，填写字段，生成日文文书', ja: '書式を選んで入力するだけで、日本語の届出書を作成' },
    formHint:   { zh: '左侧填写，右侧实时预览。点「打印 / 保存 PDF」即可打印或存为 PDF。文书内容始终为日文。',
                  ja: '左側に入力すると右側のプレビューにすぐ反映されます。「印刷 / PDF保存」でA4出力できます。' },

    lblDocType: { zh: '书式类型', ja: '書式タイプ' },
    badgeSwitch: { zh: '切换即更新预览', ja: '切り替えるとプレビューが更新' },

    tabTaishoku:    { zh: '退職届（辞职信）', ja: '退職届' },
    tabTaishokuGan: { zh: '退職願（辞职申请）', ja: '退職願' },
    tabKyuka:       { zh: '休暇届（请假条）', ja: '休暇届' },
    tabChikoku:     { zh: '遅刻・早退届', ja: '遅刻・早退届' },
    tabJinin:       { zh: '辞任届（辞任）', ja: '辞任届' },
    tabShimatsu:    { zh: '始末書（检讨书）', ja: '始末書' },

    legendCommon: { zh: '共通信息', ja: '共通項目' },
    badgeCommon:  { zh: '所有书式共用', ja: 'すべての書式で共通' },

    lblAddresseeCompany: { zh: '提出先（公司名・部门）', ja: '提出先（会社名・部署）' },
    helpAddressee: { zh: '写给谁。公司名・部门名写在这里，职位和姓名写在下一行。',
                     ja: '宛先です。会社名・部署名をここに、役職と氏名を次の行に入力します。' },
    lblAddresseeTitle: { zh: '提出先（职位）', ja: '提出先（役職）' },
    lblAddresseeName:  { zh: '提出先（姓名）', ja: '提出先（氏名）' },
    lblHonorific: { zh: '敬称', ja: '敬称' },
    optSama:  { zh: '様（公司・个人通用）', ja: '様（会社・個人ともに）' },
    optDono:  { zh: '殿（正式・上级）', ja: '殿（正式・目上の方向け）' },
    optOnchu: { zh: '御中（写给公司・部门）', ja: '御中（会社・部署宛て）' },

    lblDepartment: { zh: '所属（部门）', ja: '所属（部署）' },
    lblName:       { zh: '氏名（本人姓名）', ja: '氏名' },
    lblSubmitDate: { zh: '提出日・届出日', ja: '提出日・届出日' },
    lblDateFormat: { zh: '日期表记', ja: '日付の表記' },
    optWareki:  { zh: '和暦（令和○年○月○日）', ja: '和暦（令和○年○月○日）' },
    optSeireki: { zh: '西暦（2026年10月12日）', ja: '西暦（2026年10月12日）' },

    legendFormat: { zh: '排版', ja: '書式' },
    lblFont:      { zh: '字体', ja: '字体' },
    lblWeight:    { zh: '粗体', ja: '太字' },
    optMincho:    { zh: '宋体', ja: '明朝体' },
    optGothic:    { zh: '黑体', ja: 'ゴシック体' },
    optNormal:    { zh: '常规', ja: '通常' },
    optBold:      { zh: '加粗', ja: '太字' },
    helpFormat:   { zh: '字体和粗体会反映到预览与打印结果。保持默认时与以前的外观一致。',
                    ja: '字体と太字はプレビューと印刷結果に反映されます。既定のままでも従来と同じ見た目です。' },

    legendRetire:  { zh: '退職内容', ja: '退職の内容' },
    lblRetireDate: { zh: '退職年月日（离职生效日）', ja: '退職年月日' },
    helpRetireDate: { zh: '写「退職年月日」时，一般用月底或公司规定的离职日。',
                      ja: '退職年月日は、一般的に月末や会社が指定した日付を記載します。' },
    lblReason:  { zh: '理由', ja: '理由' },
    helpReason: { zh: '最常用的是「一身上の都合」，可不必写具体原因。',
                  ja: 'もっとも一般的なのは「一身上の都合」です。具体的な理由は書かなくて構いません。' },

    legendLeave:  { zh: '休暇内容', ja: '休暇の内容' },
    badgeDays:    { zh: '日数自动计算', ja: '日数を自動計算' },
    lblLeaveType: { zh: '休暇の区分', ja: '休暇の区分' },
    optPaid:      { zh: '有給休暇（带薪假）', ja: '有給休暇' },
    optUnpaid:    { zh: '無給休暇（无薪假）', ja: '無給休暇' },
    optCeleb:     { zh: '慶弔休暇（婚丧假）', ja: '慶弔休暇' },
    optSpecial:   { zh: '特別休暇（特别假）', ja: '特別休暇' },
    optMenstrual: { zh: '生理休暇', ja: '生理休暇' },
    optCare:      { zh: '介護休暇（护理假）', ja: '介護休暇' },
    lblLeaveFrom: { zh: '休暇期間（自）', ja: '休暇期間（自）' },
    lblLeaveTo:   { zh: '休暇期間（至）', ja: '休暇期間（至）' },
    lblLeaveReason: { zh: '事由', ja: '事由' },

    legendLate:    { zh: '迟到・早退内容', ja: '遅刻・早退の内容' },
    lblEventType:  { zh: '区分', ja: '区分' },
    optLate:       { zh: '遅刻（迟到）', ja: '遅刻' },
    optEarly:      { zh: '早退（早退）', ja: '早退' },
    lblEventDate:  { zh: '日付', ja: '日付' },
    lblEventTime:  { zh: '時刻', ja: '時刻' },
    lblEventReason: { zh: '事由', ja: '事由' },

    legendResign:  { zh: '辞任内容', ja: '辞任の内容' },
    lblPosition:   { zh: '役職（辞任する职位）', ja: '役職（辞任する役職）' },
    lblResignDate: { zh: '辞任日', ja: '辞任日' },
    lblJininReason: { zh: '理由', ja: '理由' },

    legendIncident: { zh: '始末書内容', ja: '始末書の内容' },
    lblIncidentDate: { zh: '発生年月日', ja: '発生年月日' },
    lblIncident:   { zh: '経緯（事情经过）', ja: '経緯' },
    lblCause:      { zh: '原因', ja: '原因' },
    lblPrevention: { zh: '再発防止策', ja: '再発防止策' },
    lblApology:    { zh: '謝罪の言葉', ja: '謝罪の言葉' },

    printHint: { zh: '填好后点右上角「打印 / 保存 PDF」。打印对话框里选择「另存为 PDF」即可保存文件。',
                 ja: '入力が終わったら右上の「印刷 / PDF保存」を押します。印刷ダイアログで「PDFに保存」を選ぶとPDFファイルとして保存できます。' },
    privacy:   { zh: '输入内容不会发送到服务器，全部只在你的浏览器内处理。关闭页面后内容即被丢弃。',
                 ja: '入力した内容はサーバーに送信されません。すべてお使いのブラウザ内だけで処理されます。' },

    previewBar: { zh: '预览（A4・竖排/横排自动切换）', ja: 'プレビュー（A4・縦書き／横書き自動切替）' },
    disclaimerMini: { zh: '※ 本工具是书式参考模板，具体格式以公司/学校规定为准。提交前请确认所属单位的规定。',
                      ja: '※ 本ツールは書式の参考テンプレートです。正式な書式は会社・学校の規定により異なる場合があります。提出前に所属先の規定をご確認ください。' },

    shareTitle: { zh: '分享这个工具', ja: 'このツールをシェアする' },
    shareX:     { zh: '分享到 X', ja: 'X で共有' },
    shareLine:  { zh: '分享到 LINE', ja: 'LINE で共有' },
    shareCopy:  { zh: '复制链接', ja: 'リンクをコピー' },
    shareSave:  { zh: '保存图片', ja: '画像を保存' },

    footerText: { zh: '退職届・休暇届 作成ツール — 免费制作退職届・退職願・辞任届・休暇届・遅刻早退届・始末書',
                  ja: '退職届・休暇届 作成ツール — 退職届・退職願・辞任届・休暇届・遅刻早退届・始末書を作る無料ツール' },

    phAddresseeCompany: { zh: '例：株式会社サンプル', ja: '例：株式会社サンプル' },
    phAddresseeTitle:   { zh: '例：代表取締役社長', ja: '例：代表取締役社長' },
    phAddresseeName:    { zh: '例：佐藤 一郎', ja: '例：佐藤 一郎' },
    phDepartment:       { zh: '例：営業部', ja: '例：営業部' },
    phName:             { zh: '例：山田 太郎', ja: '例：山田 太郎' },
    phReason:           { zh: '例：一身上の都合', ja: '例：一身上の都合' },
    phLeaveReason:      { zh: '例：私用のため', ja: '例：私用のため' },
    phEventReason:      { zh: '例：電車の遅延のため', ja: '例：電車の遅延のため' },
    phPosition:         { zh: '例：取締役副社長', ja: '例：取締役副社長' },
    phJininReason:      { zh: '例：一身上の都合', ja: '例：一身上の都合' },
    phIncident:         { zh: '例：納品書の送付を失念し、取引先にご迷惑をおかけしました。', ja: '例：納品書の送付を失念し、取引先にご迷惑をおかけしました。' },
    phCause:            { zh: '例：業務の確認を怠ったため。', ja: '例：業務の確認を怠ったため。' },
    phPrevention:       { zh: '例：提出前にチェックリストで確認します。', ja: '例：提出前にチェックリストで確認します。' },
    phApology:          { zh: '例：このたびは、私の不注意によりご迷惑をおかけし、誠に申し訳ございませんでした。', ja: '例：このたびは、私の不注意によりご迷惑をおかけし、誠に申し訳ございませんでした。' }
  };

  var lang = 'zh';

  function t(key) {
    var entry = I18N[key];
    if (!entry) return '';
    return entry[lang] || entry.ja || '';
  }

  function applyI18n(next) {
    lang = next || lang;
    document.documentElement.lang = (lang === 'zh') ? 'zh-CN' : 'ja';

    document.querySelectorAll('[data-i18n]').forEach(function (el) {
      var entry = I18N[el.getAttribute('data-i18n')];
      if (entry && entry[lang]) el.textContent = entry[lang];
    });
    document.querySelectorAll('[data-i18n-ph]').forEach(function (el) {
      var entry = I18N[el.getAttribute('data-i18n-ph')];
      if (entry && entry[lang]) el.setAttribute('placeholder', entry[lang]);
    });

    var langBtn = $('langBtn');
    if (langBtn) langBtn.textContent = t('btnLang');

    updateLeaveBadge();
    updateDocNote();
  }

  /* ---------------------------------------------------------
     記入例・初期値
     --------------------------------------------------------- */

  var DEFAULTS = {
    addresseeCompany: '株式会社サンプル',
    addresseeTitle: '代表取締役社長',
    addresseeName: '佐藤 一郎',
    honorific: '様',
    department: '営業部',
    name: '山田 太郎',
    dateFormat: 'wareki',
    retireDate: '2027-03-31',
    reason: '一身上の都合',
    leaveType: '有給休暇',
    leaveFrom: '2026-10-20',
    leaveTo: '2026-10-22',
    leaveReason: '私用のため',
    eventType: '遅刻',
    eventDate: '2026-10-13',
    eventTime: '10:00',
    eventReason: '電車の遅延のため',
    position: '取締役副社長',
    resignDate: '2027-03-31',
    jininReason: '一身上の都合',
    incidentDate: '2026-10-05',
    incident: '納品書の送付を失念し、取引先へ納期のご連絡が遅れました。',
    cause: '業務の確認を怠り、送付漏れのチェックを行っていなかったためです。',
    prevention: '提出物はチェックリストで確認し、送付前に上長の確認を受けることとします。',
    apology: 'このたびは、私の不注意によりご迷惑をおかけし、誠に申し訳ございませんでした。'
  };

  var SELECT_IDS = ['honorific', 'dateFormat', 'leaveType', 'eventType'];

  function fillForm(data) {
    Object.keys(data).forEach(function (id) {
      var el = $(id);
      if (el) el.value = data[id];
    });
  }

  function clearForm() {
    document.querySelectorAll('#form input[type="text"], #form input[type="date"], #form input[type="time"], #form textarea')
      .forEach(function (el) { el.value = ''; });
    // セレクトは先頭の選択肢に戻す
    SELECT_IDS.forEach(function (id) {
      var el = $(id);
      if (el && el.options.length) el.selectedIndex = 0;
    });
    // 書式（字体・太字）も既定に戻す
    document.querySelectorAll('#form input[name="docFont"]').forEach(function (r) {
      r.checked = (r.value === 'mincho');
    });
    document.querySelectorAll('#form input[name="docWeight"]').forEach(function (r) {
      r.checked = (r.value === 'normal');
    });
  }

  function sampleForm() {
    DEFAULTS.submitDate = todayISO();
    fillForm(DEFAULTS);
    refresh();
  }

  function resetForm() {
    clearForm();
    refresh();
  }

  /* ---------------------------------------------------------
     宛名・差出人ブロック
     --------------------------------------------------------- */

  function addrLines() {
    var company = val('addresseeCompany');
    var title = val('addresseeTitle');
    var who = [title, val('addresseeName')].filter(Boolean).join('　');
    var hon = val('honorific') || '様';
    var lines = [];

    if (company) lines.push(esc(company) + (hon === '御中' ? '　御中' : ''));
    if (who) lines.push(esc(who) + '　' + esc(hon));

    if (!lines.length) return ph('株式会社サンプル　代表取締役社長　佐藤 一郎　様');
    if (lines.length === 1 && company && hon !== '御中') lines[0] += '　' + esc(hon);
    return lines.join('<br>');
  }

  function senderLines() {
    var dep = val('department');
    var nm = val('name');
    return (dep ? esc(dep) : ph('営業部')) +
      '<br>' +
      (nm ? esc(nm) : ph('山田 太郎')) + '　<span class="seal">印</span>';
  }

  /* ---------------------------------------------------------
     レンダリング
     --------------------------------------------------------- */

  function renderVertical(opts) {
    return '<div class="v-doc">' +
      '<p class="v-title">' + esc(opts.title) + '</p>' +
      '<p class="v-body">' + opts.body + '</p>' +
      '<p class="v-date">' + fmtDateOrPh(val('submitDate'), '令和8年10月12日') + '</p>' +
      '<p class="v-addr">' + addrLines() + '</p>' +
      '<p class="v-send">' + senderLines() + '</p>' +
      '</div>';
  }

  function renderHorizontal(opts) {
    var h = '<div class="h-doc">';
    h += '<h1 class="h-title">' + esc(opts.title) + '</h1>';
    h += '<p class="h-date">' + fmtDateOrPh(val('submitDate'), '令和8年10月12日') + '</p>';
    h += '<div class="h-party">' +
      '<p class="h-addr">' + addrLines() + '</p>' +
      '<p class="h-send">' + senderLines() + '</p>' +
      '</div>';
    h += '<p class="h-lead">' + esc(opts.lead) + '</p>';
    h += '<p class="h-mid">記</p>';
    h += '<ul class="h-items">';
    opts.items.forEach(function (it) {
      h += '<li><span class="h-lbl">' + esc(it.label) + '</span>' +
        '<span' + (it.multiline ? ' class="h-multiline"' : '') + '>' + it.value + '</span></li>';
    });
    h += '</ul>';
    if (opts.apology) h += '<p class="h-lead">' + opts.apology + '</p>';
    h += '<p class="h-end">以上</p>';
    h += '</div>';
    return h;
  }

  function leaveRangeHtml() {
    var from = val('leaveFrom');
    var to = val('leaveTo');
    if (!from && !to) {
      return ph('令和8年10月20日（火）〜 令和8年10月22日（木）（3日間）');
    }
    var a = fmtDateWD(from);
    var b = fmtDateWD(to);
    var range;
    if (a && b) range = esc(a) + ' 〜 ' + esc(b);
    else if (a) range = esc(a) + ' 〜 ' + ph('令和8年10月22日（木）');
    else range = ph('令和8年10月20日（火）') + ' 〜 ' + esc(b);
    var n = daysBetween(from, to);
    if (n) range += '（' + n + '日間）';
    return range;
  }

  function renderTaishokuTodoke() {
    var reason = val('reason');
    var retire = fmtDate(val('retireDate'));
    var body = 'このたび、' + esc(reason || '一身上の都合') + 'により、' +
      (retire ? esc(retire) : ph('令和9年3月31日')) +
      'をもちまして退職いたしたく、ここにお届けいたします。';
    return renderVertical({ title: '退職届', body: body });
  }

  function renderTaishokuGan() {
    var reason = val('reason');
    var retire = fmtDate(val('retireDate'));
    var body = 'このたび、' + esc(reason || '一身上の都合') + 'により、' +
      (retire ? esc(retire) : ph('令和9年3月31日')) +
      'をもちまして退職いたしたく、ここにお願い申し上げます。';
    return renderVertical({ title: '退職願', body: body });
  }

  function renderJinin() {
    var reason = val('jininReason');
    var pos = val('position');
    var resign = fmtDate(val('resignDate'));
    var body = 'このたび、' + esc(reason || '一身上の都合') + 'により、' +
      (resign ? esc(resign) : ph('令和9年3月31日')) +
      'をもちまして' + (pos ? esc(pos) : ph('取締役副社長')) +
      'を辞任いたしたく、ここにお届けいたします。';
    return renderVertical({ title: '辞任届', body: body });
  }

  function renderKyukaTodoke() {
    return renderHorizontal({
      title: '休暇届',
      lead: '下記のとおり休暇を取得したく、お届けいたします。',
      items: [
        { label: '休暇期間', value: leaveRangeHtml() },
        { label: '休暇区分', value: valOr('leaveType', '有給休暇') },
        { label: '事由', value: valOr('leaveReason', '私用のため') }
      ]
    });
  }

  function renderChikoku() {
    var kind = val('eventType') || '遅刻';
    var dateWD = fmtDateWD(val('eventDate'));
    var datetime = (dateWD ? esc(dateWD) : ph('令和8年10月13日（火）')) + '　' + fmtTime(val('eventTime'));
    return renderHorizontal({
      title: kind === '早退' ? '早退届' : '遅刻届',
      lead: '下記のとおり' + kind + 'いたしますので、お届けいたします。',
      items: [
        { label: '日時', value: datetime },
        { label: '区分', value: esc(kind) },
        { label: '事由', value: valOr('eventReason', '電車の遅延のため') }
      ]
    });
  }

  function renderShimatsusho() {
    var incident = val('incident');
    var cause = val('cause');
    var prevention = val('prevention');
    var apology = val('apology');
    return renderHorizontal({
      title: '始末書',
      lead: 'このたび、私の不注意により、下記のとおりの不始末をいたしました。謹んでお詫び申し上げます。',
      items: [
        { label: '発生年月日', value: fmtDateOrPh(val('incidentDate'), '令和8年10月5日') },
        { label: '経緯', value: incident ? nl2br(incident) : ph('例：納品書の送付を失念し、取引先にご迷惑をおかけしました。'), multiline: true },
        { label: '原因', value: cause ? nl2br(cause) : ph('例：業務の確認を怠ったため。'), multiline: true },
        { label: '再発防止策', value: prevention ? nl2br(prevention) : ph('例：提出前にチェックリストで確認します。'), multiline: true }
      ],
      apology: apology ? nl2br(apology) : ''
    });
  }

  var RENDERERS = {
    taishokutodoke: renderTaishokuTodoke,
    taishokugan: renderTaishokuGan,
    kyukatodoke: renderKyukaTodoke,
    chikoku: renderChikoku,
    jinin: renderJinin,
    shimatsusho: renderShimatsusho
  };

  /* ---------------------------------------------------------
     画面更新
     --------------------------------------------------------- */

  function updateDocNote() {
    var note = $('docNote');
    var meta = DOC_META[currentType];
    if (note && meta) note.textContent = meta.note[lang] || meta.note.ja;
  }

  function updateLeaveBadge() {
    var badge = $('leaveDaysBadge');
    if (!badge) return;
    var n = daysBetween(val('leaveFrom'), val('leaveTo'));
    badge.textContent = t('badgeDays') + (n ? '：' + n + '日' : '');
  }

  function applyFormat() {
    var paper = $('paper');
    if (!paper) return;
    var fontEl = document.querySelector('input[name="docFont"]:checked');
    var weightEl = document.querySelector('input[name="docWeight"]:checked');
    var font = fontEl ? fontEl.value : 'mincho';
    paper.classList.toggle('font-mincho', font !== 'gothic');
    paper.classList.toggle('font-gothic', font === 'gothic');
    paper.classList.toggle('weight-bold', !!(weightEl && weightEl.value === 'bold'));
  }

  function refresh() {
    var meta = DOC_META[currentType] || DOC_META.taishokutodoke;
    var paper = $('paper');
    var body = $('docBody');
    var render = RENDERERS[currentType] || renderTaishokuTodoke;

    applyFormat();
    if (paper) {
      if (meta.vertical) paper.classList.add('paper--vertical');
      else paper.classList.remove('paper--vertical');
    }
    if (body) body.innerHTML = render();

    updateLeaveBadge();
    updateDocNote();
  }

  function setDocType(type) {
    if (!RENDERERS[type]) return;
    currentType = type;

    document.querySelectorAll('.doc-tab').forEach(function (btn) {
      btn.setAttribute('aria-selected', btn.getAttribute('data-type') === type ? 'true' : 'false');
    });

    document.querySelectorAll('.doc-group').forEach(function (group) {
      var list = (group.getAttribute('data-doc') || '').split(/\s+/);
      group.hidden = list.indexOf(type) === -1;
    });

    refresh();
  }

  /* ---------------------------------------------------------
     初期化
     --------------------------------------------------------- */

  function init() {
    DEFAULTS.submitDate = todayISO();
    fillForm(DEFAULTS);

    var tabs = $('docTabs');
    if (tabs) {
      tabs.addEventListener('click', function (e) {
        var btn = e.target.closest('.doc-tab');
        if (!btn) return;
        setDocType(btn.getAttribute('data-type'));
      });
    }

    var form = $('form');
    if (form) {
      form.addEventListener('input', refresh);
      form.addEventListener('change', refresh);
    }

    var printBtn = $('printBtn');
    if (printBtn) printBtn.addEventListener('click', function () { window.print(); });

    var sampleBtn = $('sampleBtn');
    if (sampleBtn) sampleBtn.addEventListener('click', sampleForm);

    var resetBtn = $('resetBtn');
    if (resetBtn) resetBtn.addEventListener('click', resetForm);

    var langBtn = $('langBtn');
    if (langBtn) {
      langBtn.addEventListener('click', function () {
        applyI18n(lang === 'zh' ? 'ja' : 'zh');
      });
    }

    applyI18n('zh');
    setDocType('taishokutodoke');
  }

  /* ---------------------------------------------------------
     テスト用フック
     --------------------------------------------------------- */

  window.__taishoku = {
    fmtDate: fmtDate,
    fmtDateWD: fmtDateWD,
    daysBetween: daysBetween,
    esc: esc,
    getDocType: function () { return currentType; },
    setDocType: setDocType,
    refresh: refresh,
    resetForm: resetForm,
    sampleForm: sampleForm,
    getLang: function () { return lang; },
    setLang: applyI18n,
    html: function () { return $('docBody') ? $('docBody').innerHTML : ''; }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

/* =========================================================
   シェア（バイラル導線） — 既存機能には触れない独立モジュール
   ========================================================= */
(function () {
  'use strict';

  var SHARE_URL  = "https://www.reveriel.com/taishoku-form/";
  var CARD_TITLE = "退職届・休暇届 作成ツール";
  var CARD_SUB   = "退職届・休暇届のテンプレートを無料作成";
  var CARD_FOOT  = "www.reveriel.com/taishoku-form";
  var FILE_NAME  = "taishoku-form.png";

  var L = {
    text: { zh: '免费制作退職届・退職願・休暇届・始末書的生成器', ja: '無料で作れる退職届・退職願・休暇届・始末書ジェネレーター' },
    sub:  { zh: '退職届・休暇届，填写即生成', ja: '退職届・休暇届を入力するだけで作成' },
    copied:   { zh: '已复制', ja: 'コピーしました' },
    copyFail: { zh: '复制失败', ja: 'コピーできませんでした' },
    saveFail: { zh: '无法生成图片', ja: '画像を生成できませんでした' }
  };

  function tr(key) {
    var l = (window.__taishoku && window.__taishoku.getLang && window.__taishoku.getLang()) || 'ja';
    return L[key][l] || L[key].ja;
  }

  function byId(id) { return document.getElementById(id); }

  function openExternal(url) {
    if (!url) return;
    var a = document.createElement('a');
    a.href = url;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  function buildTweetUrl() {
    return 'https://twitter.com/intent/tweet?text=' + encodeURIComponent(tr('text')) +
      '&url=' + encodeURIComponent(SHARE_URL);
  }
  function buildLineUrl() {
    return 'https://social-plugins.line.me/lineit/share?url=' + encodeURIComponent(SHARE_URL);
  }

  function fallbackCopy(text) {
    try {
      var ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.cssText = 'position:absolute;left:-9999px;top:0';
      document.body.appendChild(ta);
      ta.select();
      var ok = document.execCommand('copy');
      document.body.removeChild(ta);
      return ok;
    } catch (e) { return false; }
  }

  function copyText(text) {
    return new Promise(function (resolve) {
      try {
        if (navigator.clipboard && window.isSecureContext) {
          navigator.clipboard.writeText(text).then(
            function () { resolve(true); },
            function () { resolve(fallbackCopy(text)); }
          );
          return;
        }
      } catch (e) { /* fallthrough */ }
      resolve(fallbackCopy(text));
    });
  }

  /* ---- 共有カード（1200 x 630） ---- */
  var CARD_W = 1200, CARD_H = 630;
  var FONT = '"Hiragino Sans","Hiragino Kaku Gothic ProN","Noto Sans JP","Yu Gothic",sans-serif';

  function roundRect(ctx, x, y, w, h, r) {
    if (typeof ctx.roundRect === 'function') { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); return; }
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function drawCard(ctx) {
    var g = ctx.createLinearGradient(0, 0, CARD_W, CARD_H);
    g.addColorStop(0, '#163c6a');
    g.addColorStop(1, '#1d4e89');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, CARD_W, CARD_H);

    ctx.fillStyle = 'rgba(255,255,255,.07)';
    ctx.beginPath(); ctx.arc(CARD_W - 130, 80, 230, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(CARD_W - 300, CARD_H + 10, 160, 0, Math.PI * 2); ctx.fill();

    var PAD = 80;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';

    ctx.fillStyle = 'rgba(255,255,255,.72)';
    ctx.font = '600 24px ' + FONT;
    ctx.fillText('FREE TOOL — BROWSER ONLY', PAD, 106);

    ctx.fillStyle = '#ffffff';
    ctx.font = '700 68px ' + FONT;
    ctx.fillText(CARD_TITLE, PAD, 260);

    ctx.fillStyle = 'rgba(255,255,255,.92)';
    ctx.font = '500 34px ' + FONT;
    ctx.fillText(tr('sub'), PAD, 336);

    ctx.fillStyle = 'rgba(255,255,255,.85)';
    roundRect(ctx, PAD, CARD_H - 138, 64, 6, 3);
    ctx.fill();

    ctx.fillStyle = '#dbe6ff';
    ctx.font = '700 30px ' + FONT;
    ctx.fillText(CARD_FOOT, PAD, CARD_H - 80);

    ctx.textAlign = 'right';
    ctx.fillStyle = 'rgba(255,255,255,.62)';
    ctx.font = '500 22px ' + FONT;
    ctx.fillText('無料・登録不要', CARD_W - PAD, CARD_H - 80);
    ctx.textAlign = 'left';
  }

  function renderCardBlob() {
    return new Promise(function (resolve) {
      try {
        var canvas = document.createElement('canvas');
        canvas.width = CARD_W;
        canvas.height = CARD_H;
        var ctx = canvas.getContext('2d');
        var finish = function () {
          if (canvas.toBlob) canvas.toBlob(function (b) { resolve(b); }, 'image/png');
          else resolve(null);
        };
        var draw = function () {
          try { drawCard(ctx); } catch (e) { /* ignore */ }
          finish();
        };
        if (document.fonts && document.fonts.ready) {
          var drawn = false;
          var once = function () { if (drawn) { return; } drawn = true; draw(); };
          document.fonts.ready.then(once).catch(once);
          setTimeout(once, 1500);
        } else {
          draw();
        }
      } catch (e) { resolve(null); }
    });
  }

  function flash(el, text) {
    if (!el) return;
    var old = el.textContent;
    el.textContent = text;
    setTimeout(function () { el.textContent = old; }, 1800);
  }

  function init() {
    var xBtn = byId('shareXBtn');
    var lBtn = byId('shareLineBtn');
    var cBtn = byId('shareCopyBtn');
    var sBtn = byId('shareSaveBtn');
    var urlText = byId('shareUrlText');
    if (!xBtn || !lBtn || !cBtn) return;

    if (urlText) urlText.textContent = SHARE_URL;

    xBtn.addEventListener('click', function () { openExternal(buildTweetUrl()); });
    lBtn.addEventListener('click', function () { openExternal(buildLineUrl()); });

    var copyLabel = byId('shareCopyLabel');
    var resetTimer = null;
    cBtn.addEventListener('click', function () {
      var original = copyLabel ? copyLabel.textContent : '';
      copyText(SHARE_URL).then(function (ok) {
        if (!copyLabel) return;
        copyLabel.textContent = ok ? tr('copied') : tr('copyFail');
        if (resetTimer) clearTimeout(resetTimer);
        resetTimer = setTimeout(function () { copyLabel.textContent = original; }, 1800);
      });
    });

    if (sBtn) {
      var saveLabel = byId('shareSaveLabel');
      sBtn.addEventListener('click', function () {
        if (sBtn.disabled) return;
        sBtn.disabled = true;
        renderCardBlob().then(function (blob) {
          sBtn.disabled = false;
          if (!blob) { flash(saveLabel, tr('saveFail')); return; }
          var url = URL.createObjectURL(blob);
          var a = document.createElement('a');
          a.href = url;
          a.download = FILE_NAME;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
        });
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
