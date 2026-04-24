// screen-hr-review.jsx — The decision screen. HR reviews AI analysis + candidate responses
// side by side, approves or rejects.

function ScreenHRReview() {
  const [tab, setTab] = React.useState('analysis');
  const [activeQ, setActiveQ] = React.useState(2);
  const [showEvidence, setShowEvidence] = React.useState(null);

  const candidate = { name: 'Priya Raman', email: 'priya.raman@mail.co', role: 'Senior Frontend Engineer' };
  const template = 'Senior Frontend — React/TypeScript';

  const questions = [
    { n: 1, type: 'behavioral', text: 'Walk me through a recent project where you had to balance technical debt against shipping speed.', score: 82, time: '4:12', strength: 'Clear framework' },
    { n: 2, type: 'technical', text: 'Explain how you\'d architect a real-time collaborative editor. What conflicts arise and how do you resolve them?', score: 88, time: '6:45', strength: 'Deep CRDT knowledge' },
    { n: 3, type: 'technical', text: 'Here\'s a React component with a performance issue. Diagnose it.', score: 91, time: '3:50', strength: 'Found 3 of 3' },
    { n: 4, type: 'behavioral', text: 'Describe a time you disagreed with a design decision. How did you handle it?', score: 74, time: '3:22', strength: 'Honest reflection' },
    { n: 5, type: 'open', text: 'What\'s one frontend trend you\'re skeptical of, and why?', score: 79, time: '2:58', strength: 'Strong POV' },
    { n: 6, type: 'mcq', text: 'Which of these rendering strategies is best for a dashboard with 10k rows?', score: 100, time: '0:18', strength: 'Correct' },
  ];

  const strengths = [
    { t: 'System design fluency', d: 'Articulated tradeoffs between OT and CRDTs; named specific libraries (Yjs, Automerge).', q: 2 },
    { t: 'Pragmatic debugging',   d: 'Spotted the useEffect dependency issue within 40 seconds; mentioned React DevTools Profiler.', q: 3 },
    { t: 'Self-aware communication', d: 'Acknowledged ambiguity in her own preferences before stating them.', q: 4 },
  ];
  const weaknesses = [
    { t: 'Shallow on testing',   d: 'Mentioned tests briefly but didn\'t describe her approach to coverage or flakiness.', q: 1 },
    { t: 'Trend skepticism shallow', d: 'Picked RSC but reasoning stopped at "it\'s complex" — no concrete failure mode.', q: 5 },
  ];

  return (
    <AppShell
      role="hr"
      active="review"
      header={
        <Header
          crumbs={['Interviews', template, 'Priya Raman']}
          title={<div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Avatar name="Priya Raman" size={36} />
            <span>Priya Raman</span>
            <Score value={85} variant="pill" size="md" />
          </div>}
          subtitle={<span>Applied for <b style={{ color: 'var(--n-700)', fontWeight: 500 }}>{candidate.role}</b> · Interview completed 2h ago · Analyzed by Groq Llama 3.3</span>}
          actions={<>
            <Button variant="default" icon="download" size="sm">Export PDF</Button>
            <Button variant="default" icon="layers" size="sm">Compare</Button>
            <Button variant="default" icon="moreV" size="sm" style={{ padding: '0 10px' }}></Button>
            <div style={{ width: 1, height: 20, background: 'var(--n-200)', margin: '0 4px' }} />
            <Button variant="outlineDanger" icon="thumbsDown">Reject</Button>
            <Button variant="primary" icon="thumbsUp">Approve hire</Button>
          </>}
        />
      }
    >
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 20, padding: 24, alignItems: 'start' }}>
        {/* LEFT — AI analysis + per-question drilldown */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Recommendation card */}
          <Card padding={0} style={{ overflow: 'hidden' }}>
            <div style={{
              padding: '20px 24px',
              background: 'linear-gradient(135deg, rgba(99,102,241,.06), rgba(139,92,246,.04))',
              borderBottom: '1px solid var(--n-150)',
              display: 'flex', alignItems: 'center', gap: 20,
            }}>
              <Score value={85} size={84} showLabel label="Overall" />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <Badge tone="success" icon="check" size="lg">Recommend to hire</Badge>
                  <span style={{ fontSize: 12, color: 'var(--n-500)' }}>Confidence: <b style={{ color: 'var(--n-700)' }}>High</b></span>
                </div>
                <p style={{ fontSize: 14, color: 'var(--n-700)', lineHeight: 1.55, maxWidth: 640 }}>
                  <b style={{ color: 'var(--n-900)' }}>Strong technical signal</b> on real-time systems and React internals,
                  with a pragmatic communication style. Areas to probe in a follow-up: testing
                  practices and depth of opinion on emerging patterns.
                </p>
              </div>
              <Button variant="ghost" size="sm" icon="sparkles">Ask AI</Button>
            </div>

            {/* Dimension scores */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 0, padding: 0 }}>
              {[
                { k: 'Technical', v: 89, note: 'React, real-time' },
                { k: 'Communication', v: 82, note: 'Clear, structured' },
                { k: 'Problem solving', v: 87, note: 'Multi-step reasoning' },
                { k: 'Role fit', v: 83, note: 'vs. Senior FE rubric' },
              ].map((d, i) => (
                <div key={d.k} style={{
                  padding: '14px 20px', borderLeft: i ? '1px solid var(--n-150)' : 'none',
                }}>
                  <div style={{ fontSize: 11, color: 'var(--n-500)', letterSpacing: '.04em', textTransform: 'uppercase', fontWeight: 600, marginBottom: 6 }}>{d.k}</div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 6 }}>
                    <span className="tnum" style={{ fontSize: 22, fontWeight: 600, letterSpacing: '-.02em', color: 'var(--n-900)' }}>{d.v}</span>
                    <span style={{ fontSize: 12, color: 'var(--n-400)' }}>/100</span>
                  </div>
                  <ProgressBar value={d.v} tone={d.v >= 75 ? 'success' : d.v >= 50 ? 'warning' : 'error'} size="sm" />
                  <div style={{ fontSize: 11.5, color: 'var(--n-500)', marginTop: 6 }}>{d.note}</div>
                </div>
              ))}
            </div>
          </Card>

          {/* Strengths + weaknesses */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Card padding={0}>
              <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--n-150)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Icon name="thumbsUp" size={15} style={{ color: 'var(--success-600)' }} />
                <b style={{ fontSize: 13.5 }}>Strengths</b>
                <span style={{ fontSize: 12, color: 'var(--n-500)', marginLeft: 'auto' }}>{strengths.length} found</span>
              </div>
              <ul style={{ padding: 8 }}>
                {strengths.map((s, i) => (
                  <li key={i} style={{ padding: '10px 10px', borderRadius: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                      <span style={{
                        width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
                        background: 'var(--success-50)', color: 'var(--success-700)',
                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginTop: 1,
                      }}>
                        <Icon name="check" size={12} stroke={2.5} />
                      </span>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--n-900)', marginBottom: 2 }}>{s.t}</div>
                        <div style={{ fontSize: 12.5, color: 'var(--n-600)', lineHeight: 1.5 }}>{s.d}</div>
                        <button style={{
                          marginTop: 6, background: 'transparent', border: 'none', padding: 0,
                          color: 'var(--p-600)', fontSize: 12, fontWeight: 500, display: 'inline-flex', alignItems: 'center', gap: 4, cursor: 'default',
                        }}>
                          <Icon name="play" size={10} />
                          Evidence · Q{s.q}
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </Card>

            <Card padding={0}>
              <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--n-150)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Icon name="warning" size={15} style={{ color: 'var(--warning-600)' }} />
                <b style={{ fontSize: 13.5 }}>Areas to probe</b>
                <span style={{ fontSize: 12, color: 'var(--n-500)', marginLeft: 'auto' }}>{weaknesses.length} flagged</span>
              </div>
              <ul style={{ padding: 8 }}>
                {weaknesses.map((s, i) => (
                  <li key={i} style={{ padding: '10px 10px', borderRadius: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                      <span style={{
                        width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
                        background: 'var(--warning-50)', color: 'var(--warning-700)',
                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginTop: 1, fontWeight: 700, fontSize: 12,
                      }}>!</span>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--n-900)', marginBottom: 2 }}>{s.t}</div>
                        <div style={{ fontSize: 12.5, color: 'var(--n-600)', lineHeight: 1.5 }}>{s.d}</div>
                        <button style={{
                          marginTop: 6, background: 'transparent', border: 'none', padding: 0,
                          color: 'var(--p-600)', fontSize: 12, fontWeight: 500, display: 'inline-flex', alignItems: 'center', gap: 4, cursor: 'default',
                        }}>
                          <Icon name="play" size={10} />
                          Evidence · Q{s.q}
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </Card>
          </div>

          {/* Proctoring signals */}
          <Card padding={0}>
            <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--n-150)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Icon name="shield" size={15} style={{ color: 'var(--n-600)' }} />
              <b style={{ fontSize: 13.5 }}>Integrity signals</b>
              <Badge tone="neutral" size="sm">HR-only</Badge>
              <span style={{ fontSize: 12, color: 'var(--n-500)', marginLeft: 'auto' }}>No concerns</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)' }}>
              {[
                { k: 'Tab switches', v: '0', tone: 'success', icon: 'screen' },
                { k: 'Multiple faces', v: 'Never', tone: 'success', icon: 'users' },
                { k: 'Audio dropouts', v: '2 brief', tone: 'neutral', icon: 'mic' },
                { k: 'Avg face coverage', v: '98%', tone: 'success', icon: 'camera' },
              ].map((s, i) => (
                <div key={s.k} style={{ padding: '12px 18px', borderLeft: i ? '1px solid var(--n-150)' : 'none', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: 8,
                    background: s.tone === 'success' ? 'var(--success-50)' : 'var(--n-100)',
                    color: s.tone === 'success' ? 'var(--success-700)' : 'var(--n-600)',
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Icon name={s.icon} size={15} />
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--n-500)', fontWeight: 500 }}>{s.k}</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--n-900)' }}>{s.v}</div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* HR note field */}
          <Card>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <Icon name="edit" size={14} style={{ color: 'var(--n-500)' }} />
              <b style={{ fontSize: 13 }}>Your decision note</b>
              <span style={{ fontSize: 12, color: 'var(--n-500)' }}>· Becomes part of the audit trail</span>
            </div>
            <Textarea placeholder="Add context for your decision (visible to your team, not the candidate)…" rows={3} defaultValue="Strong on technical depth — want to double-click on testing in the follow-up. Send to Jamie for rubric sign-off." />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 }}>
              <div style={{ display: 'flex', gap: 6 }}>
                <Badge tone="outline" size="sm" icon="user">Send to Jamie</Badge>
                <Badge tone="outline" size="sm" icon="tag">Follow-up round</Badge>
              </div>
              <span style={{ fontSize: 11.5, color: 'var(--n-400)' }}>Autosaved</span>
            </div>
          </Card>
        </div>

        {/* RIGHT — Questions list + per-q playback */}
        <div style={{ position: 'sticky', top: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Card padding={0} style={{ overflow: 'hidden' }}>
            {/* Video/response preview */}
            <div style={{
              aspectRatio: '16/10', background: 'linear-gradient(135deg, #1e1b4b, #312e81)',
              position: 'relative', color: '#fff',
            }}>
              <div style={{
                position: 'absolute', inset: 0,
                backgroundImage: 'radial-gradient(circle at 30% 40%, rgba(167,139,250,.25), transparent 50%), radial-gradient(circle at 70% 70%, rgba(99,102,241,.2), transparent 50%)',
              }} />
              {/* Simulated face silhouette */}
              <svg viewBox="0 0 100 100" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: .4 }}>
                <ellipse cx="50" cy="42" rx="14" ry="17" fill="rgba(255,255,255,.15)" />
                <path d="M26 100 Q26 72 50 70 Q74 72 74 100" fill="rgba(255,255,255,.1)" />
              </svg>
              {/* Top bar */}
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, padding: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Badge tone="error" size="sm" style={{ background: 'rgba(239,68,68,.9)', color: '#fff' }}><span style={{ width: 5, height: 5, background: '#fff', borderRadius: '50%', marginRight: 4 }} />REC</Badge>
                <span style={{ fontSize: 11, opacity: .85, fontFamily: 'var(--font-mono)' }} className="tnum">Q{activeQ} · 02:14 / 06:45</span>
                <span style={{ marginLeft: 'auto', fontSize: 11, opacity: .8 }}>1080p</span>
              </div>
              {/* Play */}
              <button style={{
                position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
                width: 56, height: 56, borderRadius: '50%', border: 'none',
                background: 'rgba(255,255,255,.95)', color: 'var(--n-900)',
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 4px 16px rgba(0,0,0,.3)', cursor: 'default',
              }}>
                <Icon name="play" size={22} stroke={2} />
              </button>
              {/* Scrubber */}
              <div style={{ position: 'absolute', left: 12, right: 12, bottom: 12 }}>
                <div style={{ height: 3, background: 'rgba(255,255,255,.25)', borderRadius: 2, overflow: 'hidden', position: 'relative' }}>
                  <div style={{ width: '32%', height: '100%', background: '#fff' }} />
                  {/* AI highlight moments */}
                  {[15, 48, 72].map(p => (
                    <span key={p} style={{ position: 'absolute', top: -2, left: `${p}%`, width: 2, height: 7, background: 'var(--a-400)' }} />
                  ))}
                </div>
                <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 6, fontSize: 10.5, opacity: .8 }}>
                  <span style={{ width: 6, height: 6, background: 'var(--a-400)', display: 'inline-block', borderRadius: '50%' }} />
                  AI highlights · 3 moments
                </div>
              </div>
            </div>
            {/* Transcript preview */}
            <div style={{ padding: 14, fontSize: 12.5, color: 'var(--n-700)', lineHeight: 1.6, maxHeight: 100, overflow: 'hidden', position: 'relative' }}>
              <div style={{ fontSize: 10.5, color: 'var(--n-500)', fontWeight: 600, letterSpacing: '.06em', textTransform: 'uppercase', marginBottom: 4 }}>Transcript · Q{activeQ}</div>
              "Right, so for a collaborative editor I'd lean toward CRDTs over OT — <mark style={{ background: 'rgba(167,139,250,.25)', color: 'inherit', padding: '0 2px', borderRadius: 2 }}>Yjs specifically, because the ecosystem is mature</mark> and you get awareness presence out of the box. The harder problem is usually…"
              <div style={{ position: 'absolute', inset: 'auto 0 0 0', height: 30, background: 'linear-gradient(transparent, #fff)' }} />
            </div>
          </Card>

          {/* Question list */}
          <Card padding={0}>
            <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--n-150)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <b style={{ fontSize: 13 }}>Responses</b>
              <span style={{ fontSize: 12, color: 'var(--n-500)' }}>6 of 6 · 21:25</span>
              <Icon name="filter" size={13} style={{ marginLeft: 'auto', color: 'var(--n-500)' }} />
            </div>
            <ul>
              {questions.map(q => {
                const active = q.n === activeQ;
                const tone = q.score >= 75 ? 'success' : q.score >= 50 ? 'warning' : 'error';
                const color = tone === 'success' ? 'var(--success-500)' : tone === 'warning' ? 'var(--warning-500)' : 'var(--error-500)';
                return (
                  <li key={q.n} onClick={() => setActiveQ(q.n)} style={{
                    padding: '10px 14px', borderTop: q.n > 1 ? '1px solid var(--n-100)' : 'none',
                    background: active ? 'var(--p-50)' : 'transparent',
                    cursor: 'default', position: 'relative',
                  }}>
                    {active && <span style={{ position: 'absolute', left: 0, top: 8, bottom: 8, width: 2, background: 'var(--p-600)', borderRadius: 2 }} />}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span className="tnum" style={{ fontSize: 11, color: 'var(--n-500)', fontWeight: 600, minWidth: 22 }}>Q{q.n}</span>
                      <Badge tone="outline" size="sm" style={{ textTransform: 'capitalize' }}>{q.type}</Badge>
                      <span style={{ marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                        <span className="tnum" style={{ fontSize: 11.5, color: 'var(--n-500)' }}>{q.time}</span>
                        <span className="tnum" style={{ fontSize: 12, fontWeight: 600, color: tone === 'success' ? 'var(--success-700)' : tone === 'warning' ? 'var(--warning-700)' : 'var(--error-700)' }}>{q.score}</span>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: color }} />
                      </span>
                    </div>
                    <div style={{ fontSize: 12.5, color: active ? 'var(--n-800)' : 'var(--n-600)', lineHeight: 1.45, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {q.text}
                    </div>
                  </li>
                );
              })}
            </ul>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}

window.ScreenHRReview = ScreenHRReview;
