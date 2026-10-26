# 便携包验证记录

## 已完成

- 使用普通 Node.js 与从公共 npm 安装的 PptxGenJS 4.0.1 生成，不依赖 Codex 私有库或模型凭据。
- `npm test` 通过：12 布局生成、原生表格与文本、备注及链接；禁止意外覆盖；错误 plan 拒绝；命令符号仅作为文本处理。
- 使用 Windows PowerPoint 实际打开 12 页布局目录并导出 PNG。逐页检查无裁切、遮挡或错误箭头。重点检查了 Harness 反馈、五阶段闭环及失败返回、人工接管层级。
- 包含六页匿名入口示例和十二页布局目录 JSON，预览位于 `assets/previews/`。
- 检查发行内容与示例 PPTX 中的本机路径、真实学生身份和专有依赖引用，未发现残留。生成器为图片显式设置替代文本，避免把本地路径写入图片说明。
- SKILL 格式检查通过。
- 解压到独立、包含空格的目录后，运行 `npm ci --ignore-scripts`、`npm test` 和六页示例生成成功。
- 独立使用者仅依据包内说明创建三页工程评审 plan，一次生成成功并通过 PowerPoint 逐页检查。

## 验证范围

此次实测环境为 Windows、Node.js 24、PowerPoint。未实测 Linux/macOS 的字体及办公软件渲染，也未连接某个具体的 DeepSeek Harness 或调用 DeepSeek API。工具接入方式由宿主决定，包内提供通用接口示例。

生成脚本不自带 PowerPoint/LibreOffice，不自动检查全部视觉问题。`.report.json` 的文字容纳提示是估算；真正交付前仍需渲染和目检。`npm test` 验证结构与行为，不把 ZIP/XML 检查当作完整视觉检查。

模板保留可编辑语义布局，不承诺与原 HTML、历史 Codex PPT 或不同系统渲染逐像素一致。原始 PPTX 的局部编辑需要宿主另有编辑工具。
