# taishoku-form 迭代方案（NEXT-STEPS）

> 产品：退職届・休暇届 作成ツール（纯静态，`https://www.reveriel.com/taishoku-form/`）
> 定位：日本本地化 micro SaaS 矩阵成员，工具站 + 日语 SEO 内容层 + ASP 联盟变现
> 更新：2026-10-12

---

## 0. 本轮已完成（2026-10-12）

| # | 项目 | 文件 | 说明 |
|---|------|------|------|
| 1 | 隐私政策页（日语） | `privacy.html`（新增） | 9 节；说明输入内容仅浏览器内处理、不上传；Cloudflare Web Analytics、Google 表单、Cookie 政策 |
| 2 | 运营者信息页（日语） | `company.html`（新增） | 运营者 `GUO XING` / 所在地 `大阪府大阪市` / 咨询走反馈表单；含 Organization JSON-LD |
| 3 | 页脚合规链接 | `index.html` + 3 篇教程页 | 页脚统一为「プライバシーポリシー ・ 運営者情報 ・ ご意見・フィードバック」 |
| 4 | 【PR】転職エージェント联盟区块（scaffold） | `index.html` | doda / リクナビNEXT / マイナビ転職 占位链接，`rel="nofollow sponsored noopener"`，顶部【PR】标注，仅日语 |
| 5 | 法務ページ样式 | `guide.css`、`style.css` | 新增 `.legal-*` 与 `.aff-cta` 样式；修复 `.legal a` 覆盖按钮文字色的 bug |
| 6 | sitemap | `sitemap.xml` | 新增 privacy / company 两条 |

**验证**：`node --check script.js` 通过；6 个页面 JSON-LD 全部合法；headless Chrome 渲染无页面级报错，PR 区块与页脚链接均正确渲染。

**⚠️ 上线前必做**：PR 区块里的 `https://px.a8.net/svt/ejp?a8mat=XXXXXXXX` 是**占位链接**。A8 未过审前若直接部署会产生死链 —— 二选一：① 拿到真实 A8 链接后替换；② 先整块注释掉/删除，过审后再加回。

---

## 1. 战略① 内容层：补日语 SEO 教程页

现状：已有 3 篇（`kakikata` / `taishokutodoke-vs-taishokugan` / `teishutsu-timing`），覆盖「怎么写 / 两者区别 / 何时交」。均为工具意图（how-to），**缺少长尾问题型与场景型**内容，且互链只在底部相关指南。

### 下一批选题（按优先级）

| 优先级 | 文件 | 目标关键词（示例） | 意图 |
|---|---|---|---|
| P0 | `taishokugan-kakikata.html` | 退職願 書き方, 退職願 例文 | 工具意图，直接对应生成器「退職願」书式 |
| P0 | `kyukatodoke-kakikata.html` | 休暇届 書き方, 有給休暇 届出 | 工具意图，对应「休暇届」书式 |
| P1 | `jibun-de-taisyoku.html` / `taishoku-daikou.html` | 自分で退職届 書く, 退職代行 必要か | 场景型，能自然衔接「転職/退職代行」联盟 |
| P1 | `shimatsusho-kakikata.html` | 始末書 書き方, 始末書 例文 | 工具意图，对应「始末書」书式 |
| P2 | `taishoku-todoke-moto.html` | 退職届 もらい方, 退職届 テンプレ ダウンロード | 收集型长尾（可沉淀为 PDF/图） |

### 每篇新页的模板清单（对齐现有 3 篇 + 产品自检清单）

- `<html lang="ja">`；`<title>` 37 字以内、含主关键词；`<meta description>` 独立且含 CTA 意图
- `<link rel="canonical">` 绝对 URL（`https://www.reveriel.com/taishoku-form/<file>.html`）
- `og:*` + `twitter:card` 全套 + `og:image`（复用 `og-image.png`）
- JSON-LD：`Article` + `FAQPage`（@graph 形式，参考 `kakikata.html`）
- 顶部面包屑、`guide-cta-box` 中部 CTA、`guide-cta-foot` 底部 CTA
- `guide-related` 互链到**其余全部**教程页 + 工具首页
- 页脚：**privacy / company / 反馈** 三链接（与本轮统一后的格式一致）
- 反馈 FAB（`no-print`）+ Cloudflare beacon（token `6fc01bf3ac5e457ba1bd16b91e5b653e`）
- 新页完成后同步追加 `sitemap.xml`，并在 `index.html`「書き方ガイド」列表补一条互链

### 内容质量要求

- 与生成器书式一一对应（用户读完就能去工具生成），杜绝「只为充字数」的薄页
- 事实性表述给依据（如民法 627 条 2 周规则），不写「日本一」等优良誤認/有利誤認 表述
- 每篇一个 FAQ 区块，答案与 `faq` 富结果对齐

---

## 2. 战略② ASP 联盟变现（日本高单价）

**核心矛盾**：退職届/労働系的高单价广告主是 **転職エージェント（doda、リクルート系）/ 退職代行**，多在 **アクセストレード**（転職强），需审核；A8 也能接部分転職案件。

### 落审主因已解决

多个来源一致指出：**无「プライバシーポリシー / 運営者情報 / お問い合わせ」是落审主因**。本轮已补齐 privacy + company + 表单入口，页脚全站可见 → **具备申请条件**。

### 申请路径（按顺序）

1. **A8.net 注册**（注册宽，案件逐个审）
   - 材料：日本国内本人名义银行账户、大阪住所、在留/免許証备查
   - 硬性：站点须为**日语版**（我们的日语页满足；A8 链接只挂日语页）
2. **アクセストレード**（転職强，审查偏严）—— 建议站有少量自然流量后再申请
3. 通过后**逐案申请提携**：doda（パーソルキャリア）、リクナビNEXT、マイナビ転職、退職代行系
4. 把真实链接回填到 `index.html` 的 PR 区块（占位符 `a8mat=XXXXXXXX`）

### PR 区块上线 checklist（ステマ規制）

- [ ] 顶部【PR】表记常驻、对比度与字号正常（**已做**：深底白字徽标）
- [ ] 所有联盟链带 `rel="nofollow sponsored noopener"`（**已做**）
- [ ] A8 直リンク若附带 1×1 追踪像素 `<img>`，务必保留，勿删
- [ ] 不做 JS 拦截跳转、不做「点击返现」等激励流量（会被判无效并封号）
- [ ] CSP 若启用，需放行 `*.a8.net` 等 ASP 域（当前站点无 CSP，无阻碍）
- [ ] HTTPS（已是）

### 变现纵深（后续可加，勿一次堆满）

- 侧栏/教程页底部追加 **退職代行**（同高单价、主题匹配）
- 全站通用：エックスサーバー 等（工具站访客里想做站的），A8 上案件多
- AdSense 并行兜底（不要求日语，别和 ASP 冲突；Xserver 官方已辟谣「挂联盟会落审」）

---

## 3. 战略③ 继续滚工具

### 本产品的增量方向

1. **PDF/图片分享增强**：当前已有「保存图片」分享；可评估导出「縦書き PDF」的质量与文件名规范
2. **書式扩展**：现有 6 种（退職届/退職願/休暇届/遅刻早退届/辞任届/始末書）。可加「復職届」「異動届」「身上書」等相邻书式，复用同一引擎
3. **模板预置**：为每种书式提供「記入例」一键填充（已有 `sampleBtn`，可扩展为多套示例）
4. **数据层抽象（留接口）**：当前纯前端无持久化，符合「web first」路线。若未来上后端，`script.js` 的取值/渲染已分离，接入点清晰
5. **互链矩阵**：确保 `index.html` 相关工具区 + 各教程页页脚覆盖矩阵内全部 15 站

---

## 4. 上线前自检清单（每次发版）

- [ ] 6 页 canonical 均为绝对 URL 且指向自身
- [ ] JSON-LD 合法（`node -e` 校验或 Rich Results 测试）
- [ ] 分享裂变区块存在（X / LINE / 复制链接 / 保存图片）
- [ ] 反馈 FAB 存在，且 `print` 时隐藏
- [ ] Cloudflare beacon token = `6fc01bf3ac5e457ba1bd16b91e5b653e`
- [ ] 页脚含 privacy / company / 反馈 三链接
- [ ] 互链：教程页 ↔ 工具首页 ↔ 相关工具
- [ ] `sitemap.xml` 含全部页面；`robots.txt` 指向 sitemap
- [ ] PR 区块：占位链接已替换为真实 A8 链接（或已移除），【PR】表记在位
- [ ] `node --check script.js` + headless Chrome 渲染无报错

---

## 5. 已知遗留 / 技术债

- `index.html` 的 `<html lang="zh-CN">`：页面是中日双语 UI（日语 SEO 文案 + 中文界面），若要强化日语 SEO，长期可考虑把日语版拆为独立 `lang="ja"` 页面
- 同款 `.legal a` 覆盖按钮文字色的问题，模板来源（`mitsumori-pdf`）疑似同样存在，建议后续统一排查其余站点
