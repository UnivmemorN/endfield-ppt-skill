# JSON plan 规范

读取 `examples/overview.json` 可直接修改内容；`examples/all-layouts.json` 覆盖全部布局。不要将模型输出当作 JavaScript 执行。

根对象：

```json
{"title":"演示文稿主题","fonts":{"cn":"Microsoft YaHei","en":"Arial","mono":"Courier New"},"slides":[]}
```

`title`、`fonts` 可省略。至少一页，最多 100 页。字体按本机实际安装情况选择，包内不分发字体。生成器固定 1280×720 的 16:9 设计坐标，输出宽屏 PPTX。文本和表格可编辑。输入不是旧版 Codex renderer 的 schema，两者不能直接混用。

## 每页通用字段

必填 `layout`、`title`。可选：

- `eyebrow`：左上角章节，短而清楚。
- `theme`：`light` 或 `dark`。省略时 cover、timeline、harness、process 默认深色，其他浅色。
- `footer`：页脚来源或限定条件。页码自动生成。
- `notes`：讲者备注，可含详细解释及来源，不承载必须在页面出现的结论限制。
- `seconds`：建议讲解秒数。0 不会自动增加附录或改变结构。
- `sources`：`[{"title":"来源标题","url":"https://..."}]`，追加到备注中；正文可见来源用 sources 布局或有意义的页脚。

仅允许声明的字段，嵌套类型、数量和字符串长度均校验。标题上限 32 字符（封面 50），不是建议写满。文本支持 `\n`；不解析 Markdown、HTML 或执行命令。URL 仅允许 HTTP/HTTPS，不自动访问。超长字段报错时，调整结构而不是删除必要事实。

## 12 种布局

| layout | 内容字段 |
|---|---|
| `cover` | `subtitle` 必填。可选 `kicker`、`details`（0–3 行）、`date`、`metrics`（1–2 个 `{value,label}`）或 `image`（`{path,caption?}`）。image 与 metrics 同时给出时图片优先，避免把封面塞满。无真实指标时不要编造 metrics。 |
| `timeline` | `events` 正好 4 个 `{time,title,detail}`，可选 `note`。 |
| `status` | `rows` 3–5 个 `{label,state,detail}`，`takeaway`。 |
| `roles` | `lead`，`roles` 正好 3 个 `{title,lines}`，每组 lines 为 2–4 行。可选 `note`。 |
| `harness` | `context`、`agent`、`executor`、`verifier` 各为 `{title,body}`；`owner`、`planLabel`、`resultLabel`、`feedback`、`feedbackDetail`、`audit`、`auditDetail`。 |
| `verdict` | `permission`、`approval`，`outcomes` 正好 3 个 `{title,condition,action}`，`principle`，`handoff:{title,lines}`（正好 2 行），`close`。 |
| `cycle` | `stages` 正好 5 个 `{title,body}`，`center`、`feedback`、`note`。 |
| `table` | `headers` 2–4 列，`rows` 2–5 行且每行与表头同列数。可选 `lead`、`note`、`widths`（与列数相同的正数权重）。 |
| `process` | `lead`，`steps` 正好 4 个 `{label,title,body}`，`callout`。 |
| `compare` | `left`、`right` 各为 `{title,lines}`，lines 2–4 行。可选 `lead`、`note`。左右对称，不预设优劣。 |
| `discussion` | `stages` 正好 3 个 `{title,body}`，`questions` 正好 2 个字符串。可选 `note`、`transitionLabel`。 |
| `sources` | `entries` 1–5 个 `{title,url}`，生成可点击原生超链接。可选 `note`。 |

## 预设连线的准确含义

- `harness`：上下文流入 agent，agent 将计划提交 executor，executor 把原始结果传给 verifier，verifier 将反馈返回 agent。owner 指向 executor，表示执行约束。底部 audit 为贯穿流程的记录要求。若真实流程不同，不要只替换名词硬套。
- `cycle`：顺时针 `1→2→3→4→5→1`，另有 `4→2` 的反馈线。位置是上、右、右下、左下、左。需要其他返回目标时应使用宿主原生编辑能力或扩展布局代码，当前没有任意边配置字段。
- `verdict`：三项验收结论平行排列，下方说明人工接管。没有暗示仅第三种结果才能转人，也没有“审批使失败变通过”的连线。
- `discussion`：三阶段依次推进，每条过渡以 `transitionLabel` 标注，默认“评审”。
- `timeline` 表示时间顺序，`process` 表示顺序分栏；装饰分隔线不表示额外授权或因果。

## 图片、运行与检查

`cover.image.path` 为 PNG/JPEG 本地路径，相对路径从 plan 所在目录解析。按比例完整放入图片区域，不自动下载、不生成图像。包内不含官方角色图。宿主应按用户授权核对外部素材位置和使用权。

```sh
node scripts/generate.mjs --plan examples/overview.json --check
node scripts/generate.mjs --plan examples/overview.json --out output/demo.pptx
```

默认拒绝覆盖已有输出。明确需要覆盖时可加 `--force`；更推荐新版本文件名。脚本生成 PPTX 和 `<输出PPTX路径>.report.json`，例如 `demo.pptx.report.json`。报告检查计划、对象边界并给出估算的文字容纳警告，不等于实际视觉验收；表格行高和字体仍需渲染后检查。报告 `visualInspection` 默认为 `not_performed`，由宿主记录真实的目检结果，不能无依据改成通过。

本生成器不支持读取任意 PPTX、任意统计图、动画或任意 HTML/CSS 转换。需要时使用宿主具备的编辑工具，不发明未支持的字段。
