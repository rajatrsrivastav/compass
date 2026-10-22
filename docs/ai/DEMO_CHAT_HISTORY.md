# Synthetic Demo Data

Every conversation below is an authored interface example, not a historical interaction and not a live model response. The bundled demo project `compass-demo/canvas-lab` is fictional.

## Finding a first issue

**User:** I know React and TypeScript. Which issue looks suitable?

**Assistant:** Synthetic issue #57 concerns keyboard focus in the block palette and has a good-first-issue label. It matches your skills, but synthetic PR #71 already claims to fix it. Start by reviewing that PR and reproducing the missing focus behavior. If coverage is still needed, discuss that specific gap before opening a duplicate change. Sources: fixture issue #57 and fixture PR #71.

## Understanding importance without claiming endorsement

**User:** Why does the maintainer consider canvas performance important?

**Assistant:** I cannot establish a real maintainer priority from fixtures. The synthetic meeting explicitly mentions #42 and asks for redraw measurements. That supports investigating rendering costs, not a claim of endorsement. Measure the baseline and verify the current public discussion before deciding what to implement. Source: synthetic engineering meeting, 00:01:10.

## Reviewing a PR

**User:** What should I follow up on in PR #71?

**Assistant:** The synthetic review asks for empty-palette coverage. Your next private review step is to inspect the test change, reproduce empty-state keyboard navigation, and record any unresolved questions. Marking “Needs follow-up” changes only your local queue; no official GitHub review is submitted. Source: fixture PR #71 review entry.

## Investigating a meeting

**User:** What were the main engineering concerns?

**Assistant:** The synthetic transcript explicitly references canvas redraw performance in #42 and keyboard-focus reproduction in #57. Preserve those as two separate investigations. The reference is explicit; any broader claim that the projects share a root cause would be uncertain. Sources: synthetic meeting at 00:01:10 and 00:03:20.

## GSoC preparation

**User:** Help me make a four-week plan with five hours a week.

**Assistant:** Week 1: two hours for local setup, two for guidance, one for notes. Week 2: three hours reproducing one issue and two documenting results. Week 3: three hours for a focused tested change or review, two for discussion. Week 4: three hours incorporating feedback and two preparing an honest report. Verify official deadlines yourself. This is a synthetic planning example, not acceptance advice.

## Meaningful contribution plan

**User:** Should I open a PR immediately for #42?

**Assistant:** First reproduce the observed slowdown and record frame-time measurements. Read contribution guidance and check whether a related PR already addresses it. Ask a specific question if the desired behavior is unclear. Then scope a small change with a regression test and budget time for feedback. Source: synthetic issue #42 and meeting excerpt. The plan is illustrative, not a live maintainer instruction.
