---
name: endfield-ppt
description: 使用黑色、冷白、荧光黄的终末地工业风格生成可编辑 PowerPoint。适用于用户指定终末地风格、YUANZL 模板或本技能包的演示文稿；通过本地 Node.js 与 PptxGenJS 生成，不依赖特定模型或 Harness。
---

# 终末地风格可编辑 PPT

将用户内容组织为语义化 JSON plan，再由本地生成器生成 PPTX。模型负责理解、取舍和填写 plan；生成器负责版式、原生对象与文件导出。本包不调用模型或图片服务，也不需要 API key。

## 工作流程

1. 明确用途、受众、时长、页数及用户要求保留的内容。已有稿件优先局部修改，保留来源文件和有效版式；不擅自重写已确认的内容。不固定 12 页、三名成员或任何案例结构。
2. 阅读 [设计规范](references/design.md)，再按 [plan 规范](references/plan-schema.md)选择布局；需要视觉参考时查看 `assets/previews/`。`examples/overview.json` 是六页匿名示例，`examples/all-layouts.json` 覆盖全部 12 种布局用于检查；示例页数不限制实际任务。仅使用当前生成器支持的字段，每页有一个清晰的主要结论。
3. 将详细论证、来源链接和限制放入备注；会改变结论的假设、未实测声明及关键限制仍须在页面可见。事实、分析和提案分开表达。
4. 在包目录内使用 Node.js 20 或更高版本，安装包内清单所列依赖后运行：

   ```sh
   node scripts/generate.mjs --plan examples/overview.json --out output/demo.pptx
   ```

   实际任务替换输入、输出路径，输出到新文件。不要把 JSON 内容拼成可执行脚本。接入其他 Harness 时阅读 [接入说明](references/harness-integration.md)。
5. 使用可用的 PowerPoint 或兼容渲染器导出每页预览，并逐页检查文字、主次、对比度、箭头方向、对象可编辑性和链接。修正受影响页面后复查。若无法渲染，明确说明仅完成生成，未完成视觉验证。
6. 交付 PPTX 与必要的 plan。用户需要 PDF 时另行导出并检查；普通幻灯片 PDF 不包含讲者备注，不能把提交必需内容只藏在备注中。

## 核心约束

- 保留 16:9、黑／冷白底、荧光黄重点、直角框、细线与低对比网格；深浅变化服务于内容分组，不机械交替。
- 主标题、正文、表格、关系图和数值图表优先使用可编辑原生对象。位图用于背景和概念插图，不把整页文字栅格化。
- 先压缩重复表达、调整布局或拆页，再考虑缩小字号。适度密度比极端留白或满页文字更重要。
- 箭头表达真实的方向、条件或反馈；布局的预设连线不符合内容时换布局，不靠改标签掩盖错误关系。
- 本生成器只从 JSON 生成 PPTX，不导入或修改已有 PPTX。局部改旧稿时使用宿主的 PPTX 编辑工具，或修改已有 plan 后生成新版本；必要的重建须与真正的局部修改区分。

## 来源与授权

视觉改编自 **YUANZL** 的 [Endfield-PPT-Template](https://github.com/hs150521/Endfield-PPT-Template)，保留 [CC BY-NC 4.0](https://creativecommons.org/licenses/by-nc/4.0/) 的署名与非商业条件。交付物需保留作者、来源、许可及改编说明，位置可为可见的署名区域或随交付文件提供的说明；备注可补充。详见 [NOTICE](references/NOTICE.md) 与 [上游许可](references/upstream-LICENSE.md)。本包不代表官方游戏产品或官方 DeepSeek 集成。
