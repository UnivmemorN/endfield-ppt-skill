/**
 * Reusable native layouts adapted from the V4 Endfield presentation.
 * No rendering-library imports or case-specific copy are required.
 *
 * Canvas: 1280 x 720 CSS px. The caller owns the header (0..160), footer
 * (655..720), theme, font selection, shape creation, and PPTX serialization.
 * All business copy comes from s; there are no names, metrics, or example facts.
 *
 * c: {sl, fg, muted, dark, C, text, rect, line, arrow, polyline}
 * Colors are hex strings without '#'. arrow() points toward its last coordinate.
 * polyline(points, color, width, true) adds a head at the final point only.
 *
 * Fields / practical copy capacity:
 * - roles: lead, roles[3]{title,lines[2..4]}, note.
 *   Each role line should fit one line (~13 Chinese characters at 26 px).
 * - harness: context/agent/executor/verifier{title,body}, owner, planLabel,
 *   resultLabel, feedback, feedbackDetail, audit, auditDetail.
 *   Short titles; body and context.body <=2 short lines. Edge labels <=1 line,
 *   except resultLabel and feedbackDetail, which allow 2 short lines.
 * - verdict: permission, approval, outcomes[3]{title,condition,action},
 *   principle, handoff{title,lines[2]}, close.
 *   Outcome order is positive / failed / unresolved; only the middle is orange.
 *   Handoff applies independently to all outcomes; it has no exclusive arrow.
 * - cycle: stages[5]{title,body}, center, feedback, note.
 *   Titles <=8 Chinese characters; bodies <=2 lines of ~11 characters each.
 *   Clockwise stage order: top, right, bottom-right, bottom-left, left.
 *   The additional feedback arrow runs from stage 4 to stage 2.
 * - discussion: stages[3]{title,body}, questions[2], note?, transitionLabel?.
 *   Stage bodies <=2 lines; questions <=2 lines each. transitionLabel defaults
 *   to the generic label '评审'; use '' to omit it.
 *
 * Explicit newlines are supported. Copy is never silently truncated or shrunk.
 * The caller should validate fields and render the deck to check actual fonts.
 */

const value = input => input == null ? '' : String(input);
const lines = input => Array.isArray(input) ? input.map(value).join('\n') : value(input);

function count(items, expected, field) {
  if (!Array.isArray(items) || items.length !== expected) {
    throw new Error(`${field} must contain exactly ${expected} items`);
  }
}

export const optimizedLayouts = {
  roles(s, c) {
    count(s.roles, 3, 'roles');
    const {text, line, fg, muted} = c;
    text(value(s.lead), 75, 187, 1130, 56, 26, false, fg);
    s.roles.forEach((role, index) => {
      const x = 75 + index * 390;
      line(x, 277, x + 350, 277, fg, 3);
      text(value(role.title), x, 302, 350, 49, 32, true, fg);
      text(lines(role.lines), x, 376, 350, 174, 26, false, fg);
    });
    text(value(s.note), 75, 591, 1130, 52, 24, true, muted);
  },

  harness(s, c) {
    const {text, rect, arrow, polyline, fg, muted, dark, C} = c;
    const signal = dark ? C.accent : C.ink;
    const nodeFill = dark ? C.ink : C.bg;

    // Context enters from outside the controlled execution area.
    rect(335, 254, 870, 304, 'none', C.line, 1.2);
    rect(101, 281, 180, 110, nodeFill, C.line, 1);
    rect(88, 294, 180, 110, nodeFill, C.line, 1);
    rect(75, 307, 180, 110, nodeFill, C.line, 1);
    text(value(s.context?.title), 90, 326, 151, 68, 25, false, fg);
    text(value(s.context?.body), 75, 444, 230, 64, 22, false, muted);

    // A separate owner/control path reaches the executor, not the planner.
    rect(610, 180, 595, 56, C.accent, 'none', 0);
    text(value(s.owner), 632, 192, 551, 40, 26, true, C.ink);
    arrow(1060, 236, 1060, 307, signal, 2);

    rect(405, 307, 255, 110, nodeFill, signal, 1.6);
    text(value(s.agent?.title), 423, 320, 219, 37, 29, true, fg);
    text(value(s.agent?.body), 423, 365, 219, 46, 22, false, muted);

    rect(930, 307, 260, 110, nodeFill, C.line, 1.4);
    text(value(s.executor?.title), 948, 320, 224, 37, 28, true, fg);
    text(value(s.executor?.body), 948, 365, 224, 46, 22, false, muted);

    rect(680, 445, 290, 108, nodeFill, C.line, 1.4);
    text(value(s.verifier?.title), 699, 458, 252, 36, 27, true, fg);
    text(value(s.verifier?.body), 699, 501, 252, 45, 21, false, muted);

    arrow(255, 362, 405, 362, signal, 2.5);
    arrow(660, 362, 930, 362, signal, 2.5);
    text(value(s.planLabel), 677, 317, 237, 34, 22, false, muted);

    // Result and feedback routes stay outside every text rectangle.
    polyline([[1060, 417], [1060, 499], [970, 499]], signal, 2.5, true);
    text(value(s.resultLabel), 1080, 443, 120, 58, 20, false, muted);
    polyline([[680, 499], [580, 499], [580, 417]], signal, 2.5, true);
    text(value(s.feedback), 360, 450, 210, 33, 23, true, signal);
    text(value(s.feedbackDetail), 360, 489, 210, 54, 21, false, muted);

    text(value(s.audit), 75, 580, 1130, 35, 24, true, fg);
    text(value(s.auditDetail), 75, 620, 1130, 25, 20, false, muted);
  },

  verdict(s, c) {
    count(s.outcomes, 3, 'outcomes');
    const {text, line, fg, muted, C} = c;
    text(value(s.permission), 75, 185, 1130, 42, 27, false, fg);
    text(value(s.approval), 75, 235, 1130, 36, 23, false, muted);

    s.outcomes.forEach((outcome, index) => {
      const x = 75 + index * 390;
      const color = index === 1 ? C.danger : fg;
      line(x, 291, x + 350, 291, color, 3);
      text(value(outcome.title), x, 314, 350, 46, 30, true, color);
      text(value(outcome.condition), x, 373, 350, 58, 25, false, fg);
      text(value(outcome.action), x, 439, 350, 40, 25, true, fg);
    });

    text(value(s.principle), 75, 492, 1130, 35, 23, true, fg);
    text(value(s.handoff?.title), 75, 548, 174, 40, 27, true, fg);
    text(lines(s.handoff?.lines), 265, 542, 940, 65, 23, false, muted);
    text(value(s.close), 75, 615, 1130, 30, 22, true, fg);
  },

  cycle(s, c) {
    count(s.stages, 5, 'stages');
    const {text, rect, arrow, polyline, fg, muted, C} = c;
    const boxes = [
      {x: 500, y: 180, w: 280, h: 110},
      {x: 930, y: 312, w: 275, h: 110},
      {x: 785, y: 492, w: 300, h: 110},
      {x: 205, y: 492, w: 310, h: 110},
      {x: 75, y: 312, w: 290, h: 110},
    ];

    // Draw connectors first so node fills cleanly cover their terminal joins.
    polyline([[780, 235], [835, 235], [890, 270], [945, 312]], fg, 3, true);
    polyline([[1067, 422], [1067, 449], [1020, 492]], fg, 3, true);
    arrow(785, 547, 515, 547, fg, 3);
    polyline([[225, 492], [160, 455], [160, 422]], fg, 3, true);
    polyline([[365, 340], [408, 278], [455, 235], [500, 235]], fg, 3, true);

    // Stage 4 returns to stage 2. Route below the center and left of stage 2;
    // it crosses neither the center label nor any other connector/text box.
    polyline([[515, 508], [560, 462], [875, 462], [875, 379], [930, 379]], C.danger, 3, true);

    s.stages.forEach((stage, index) => {
      const b = boxes[index];
      rect(b.x, b.y, b.w, b.h, C.ink, C.line, 0.8);
      text(value(stage.title), b.x + 22, b.y + 12, b.w - 44, 36, 28, true, C.paper);
      text(value(stage.body), b.x + 22, b.y + 54, b.w - 44, 50, 21, false, C.paper);
    });
    text(value(s.center), 450, 326, 390, 99, 30, true, fg);
    text(value(s.feedback), 540, 432, 300, 28, 21, true, C.danger);
    text(value(s.note), 75, 613, 1130, 31, 22, false, muted);
  },

  discussion(s, c) {
    count(s.stages, 3, 'stages');
    count(s.questions, 2, 'questions');
    const {text, rect, arrow, fg, muted, C} = c;
    const transition = s.transitionLabel == null ? '评审' : value(s.transitionLabel);
    s.stages.forEach((stage, index) => {
      const x = 75 + index * 390;
      rect(x, 220, 350, 165, 'none', C.line, 1.3);
      text(value(stage.title), x + 21, 240, 308, 45, 30, true, fg);
      text(value(stage.body), x + 21, 302, 308, 68, 24, false, muted);
      if (index < 2) {
        arrow(x + 350, 302, x + 390, 302, fg, 1.7);
        if (transition) text(transition, x + 350, 399, 84, 29, 19, false, muted);
      }
    });
    text(value(s.questions[0]), 75, 451, 1130, 73, 30, true, fg);
    text(value(s.questions[1]), 75, 538, 1130, 70, 27, false, fg);
    if (s.note) text(value(s.note), 75, 619, 1130, 26, 19, false, muted);
  },
};
