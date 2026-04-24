// screens-extra.jsx — All remaining screens, compact but polished.

// ════════════════════════════════════════════════════════════════════
// HR: Interview templates list
// ════════════════════════════════════════════════════════════════════
function ScreenHRInterviews() {
  const [view, setView] = React.useState('grid');
  const templates = [
    { t: 'Senior Frontend — React/TS', q: 8, d: '~25 min', resp: 14, pend: 3, status: 'active', upd: '2d ago', role: 'Frontend', skills: ['React','TypeScript','Performance'], avg: 78 },
    { t: 'Full-stack Engineer', q: 10, d: '~32 min', resp: 28, pend: 1, status: 'active', upd: '5d ago', role: 'Full-stack', skills: ['Node','Postgres','System design'], avg: 72 },
    { t: 'Product Designer', q: 6, d: '~20 min', resp: 9, pend: 0, status: 'active', upd: '1w ago', role: 'Design', skills: ['Figma','Prototyping','Research'], avg: 81 },
    { t: 'Engineering Manager', q: 12, d: '~40 min', resp: 4, pend: 0, status: 'draft', upd: '3h ago', role: 'Leadership', skills: ['People','Strategy'], avg: null },
    { t: 'Data Scientist', q: 9, d: '~30 min', resp: 22, pend: 2, status: 'active', upd: '2w ago', role: 'Data', skills: ['Python','Stats','ML'], avg: 69 },
    { t: 'Senior Backend (Archived)', q: 8, d: '~28 min', resp: 47, pend: 0, status: 'archived', upd: '2mo ago', role: 'Backend', skills: ['Go','Kafka'], avg: 74 },
  ];
  return (
    <AppShell role="hr" active="interviews" header={
      <Header
        title="Interview templates"
        subtitle="Design question sets once, reuse across roles."
        actions={<><Button variant="default" icon="book" size="sm">Browse library</Button><Button variant="primary" icon="plus">New template</Button></>}
        tabs={[{value:'all',label:'All',count:6},{value:'active',label:'Active',count:4},{value:'draft',label:'Drafts',count:1},{value:'arch',label:'Archived',count:1}]}
        tabValue="all"
      />
    }>
      <div style={{ padding: 24 }}>
        {/* Toolbar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
          <div style={{ width: 280 }}><Input icon="search" placeholder="Search templates…" size="sm" /></div>
          <Button variant="default" icon="filter" size="sm">Role</Button>
          <Button variant="default" icon="tag" size="sm">Skills</Button>
          <Button variant="default" icon="sort" size="sm">Recently updated</Button>
          <div style={{ flex: 1 }} />
          <Tabs size="sm" value={view} onChange={setView} items={[{value:'grid',icon:'grid',label:''},{value:'list',icon:'list',label:''}]} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
          {templates.map((t, i) => (
            <Card key={i} padding={0} style={{ overflow: 'hidden', opacity: t.status === 'archived' ? .7 : 1 }}>
              <div style={{ padding: '16px 18px 14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                  <Badge tone={t.status === 'active' ? 'success' : t.status === 'draft' ? 'warning' : 'neutral'} dot size="sm" style={{ textTransform: 'capitalize' }}>{t.status}</Badge>
                  <Badge tone="outline" size="sm">{t.role}</Badge>
                  <Icon name="moreV" size={14} style={{ marginLeft: 'auto', color: 'var(--n-400)' }} />
                </div>
                <h3 style={{ fontSize: 15, fontWeight: 600, color: 'var(--n-900)', marginBottom: 4, letterSpacing: '-.01em' }}>{t.t}</h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--n-500)', marginBottom: 12 }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><Icon name="list" size={12} />{t.q} questions</span>
                  <span>·</span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><Icon name="clock" size={12} />{t.d}</span>
                </div>
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 12 }}>
                  {t.skills.map(s => <Badge key={s} tone="neutral" size="sm">{s}</Badge>)}
                </div>
              </div>
              <div style={{ padding: '10px 18px', borderTop: '1px solid var(--n-150)', background: 'var(--n-25)', display: 'flex', alignItems: 'center', gap: 12 }}>
                <div>
                  <div style={{ fontSize: 10.5, color: 'var(--n-500)', fontWeight: 600, letterSpacing: '.04em', textTransform: 'uppercase' }}>Responses</div>
                  <div className="tnum" style={{ fontSize: 14, fontWeight: 600, color: 'var(--n-900)' }}>{t.resp}{t.pend > 0 && <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--warning-600)', marginLeft: 4 }}>· {t.pend} pending</span>}</div>
                </div>
                <div style={{ width: 1, height: 28, background: 'var(--n-200)' }} />
                <div>
                  <div style={{ fontSize: 10.5, color: 'var(--n-500)', fontWeight: 600, letterSpacing: '.04em', textTransform: 'uppercase' }}>Avg score</div>
                  {t.avg != null ? <Score value={t.avg} variant="pill" size="sm" /> : <span style={{ fontSize: 12, color: 'var(--n-400)' }}>—</span>}
                </div>
                <Button variant="ghost" size="sm" iconRight="arrowRight" style={{ marginLeft: 'auto' }}>Open</Button>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </AppShell>
  );
}

// ════════════════════════════════════════════════════════════════════
// HR: Template builder
// ════════════════════════════════════════════════════════════════════
function ScreenHRBuilder() {
  const qs = [
    { t: 'behavioral', text: 'Walk me through a recent project where you balanced technical debt against shipping speed.', timer: 4 },
    { t: 'technical',  text: 'Explain how you\'d architect a real-time collaborative editor. What conflicts arise and how do you resolve them?', timer: 7 },
    { t: 'technical',  text: 'Diagnose the performance issue in this React component.', timer: 5, attach: true },
    { t: 'behavioral', text: 'Describe a time you disagreed with a design decision. How did you handle it?', timer: 4 },
    { t: 'open',       text: 'What\'s one frontend trend you\'re skeptical of, and why?', timer: 3 },
    { t: 'mcq',        text: 'Which of these rendering strategies is best for a dashboard with 10k rows?', timer: 1 },
  ];
  const typeColor = { behavioral: 'primary', technical: 'info', open: 'warning', mcq: 'neutral' };
  return (
    <AppShell role="hr" active="interviews" header={
      <Header
        crumbs={['Interviews','Senior Frontend — React/TS']}
        title="Senior Frontend — React/TS"
        subtitle={<><Badge tone="success" dot size="sm" style={{ marginRight: 8 }}>Active</Badge>8 questions · ~25 min · Last edited 2d ago</>}
        actions={<><Button variant="default" icon="eye" size="sm">Preview</Button><Button variant="default" size="sm">Save draft</Button><Button variant="primary" icon="check">Publish changes</Button></>}
      />
    }>
      <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr 300px', gap: 20, padding: 24, alignItems: 'start' }}>
        {/* Question types palette */}
        <Card padding={0}>
          <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--n-150)' }}>
            <b style={{ fontSize: 13 }}>Add question</b>
            <div style={{ fontSize: 11.5, color: 'var(--n-500)', marginTop: 2 }}>Drag into the sequence</div>
          </div>
          <div style={{ padding: 10, display: 'flex', flexDirection: 'column', gap: 4 }}>
            {[
              { n: 'speech', k: 'Behavioral', d: 'Story-based, open-ended', c: 'primary' },
              { n: 'code', k: 'Technical', d: 'Diagnose or design', c: 'info' },
              { n: 'file', k: 'Open-ended', d: 'Free response', c: 'warning' },
              { n: 'list', k: 'Multiple choice', d: 'Auto-graded', c: 'neutral' },
              { n: 'video', k: 'Video response', d: 'Candidate records', c: 'primary' },
            ].map(x => (
              <div key={x.k} style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px',
                borderRadius: 8, border: '1px dashed var(--n-200)', background: '#fff', cursor: 'grab',
              }}>
                <div style={{
                  width: 30, height: 30, borderRadius: 8,
                  background: `var(--${x.c === 'neutral' ? 'n' : x.c === 'info' ? 'info' : x.c === 'warning' ? 'warning' : 'p'}-50)`,
                  color: `var(--${x.c === 'neutral' ? 'n-600' : x.c === 'info' ? 'info-600' : x.c === 'warning' ? 'warning-700' : 'p-600'})`,
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Icon name={x.n} size={15} />
                </div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 500, color: 'var(--n-900)' }}>{x.k}</div>
                  <div style={{ fontSize: 11, color: 'var(--n-500)' }}>{x.d}</div>
                </div>
                <Icon name="plus" size={14} style={{ color: 'var(--n-400)' }} />
              </div>
            ))}
          </div>
          <div style={{ padding: '12px 16px', borderTop: '1px solid var(--n-150)', background: 'var(--n-25)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--p-700)', fontWeight: 500, marginBottom: 4 }}>
              <Icon name="sparkles" size={13} />AI suggestions
            </div>
            <div style={{ fontSize: 11.5, color: 'var(--n-600)', marginBottom: 8 }}>Based on your role "Senior Frontend", consider adding:</div>
            {['Accessibility scenario', 'State management tradeoffs'].map(s => (
              <div key={s} style={{ fontSize: 12, padding: '6px 8px', borderRadius: 6, background: '#fff', border: '1px solid var(--p-100)', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Icon name="plus" size={11} style={{ color: 'var(--p-600)' }} />{s}
              </div>
            ))}
          </div>
        </Card>

        {/* Sequence */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {qs.map((q, i) => (
            <Card key={i} padding={0}>
              <div style={{ display: 'flex', alignItems: 'stretch' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '14px 10px 10px 12px', gap: 4 }}>
                  <Icon name="drag" size={14} style={{ color: 'var(--n-300)' }} />
                  <div className="tnum" style={{
                    width: 24, height: 24, borderRadius: '50%', background: 'var(--n-100)', color: 'var(--n-700)',
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 600,
                  }}>{i+1}</div>
                </div>
                <div style={{ flex: 1, padding: '14px 16px 14px 4px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                    <Badge tone={typeColor[q.t]} size="sm" style={{ textTransform: 'capitalize' }}>{q.t}</Badge>
                    <span style={{ fontSize: 11.5, color: 'var(--n-500)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      <Icon name="clock" size={11} />{q.timer} min
                    </span>
                    {q.attach && <span style={{ fontSize: 11.5, color: 'var(--n-500)', display: 'inline-flex', alignItems: 'center', gap: 4 }}><Icon name="file" size={11} />Attached</span>}
                    <div style={{ marginLeft: 'auto', display: 'flex', gap: 2 }}>
                      <Button variant="ghost" size="xs" icon="copy"></Button>
                      <Button variant="ghost" size="xs" icon="edit"></Button>
                      <Button variant="ghost" size="xs" icon="trash"></Button>
                    </div>
                  </div>
                  <div style={{ fontSize: 13.5, color: 'var(--n-800)', lineHeight: 1.5 }}>{q.text}</div>
                </div>
              </div>
            </Card>
          ))}
          <button style={{
            padding: 14, border: '1px dashed var(--n-300)', borderRadius: 12, background: 'transparent',
            color: 'var(--n-600)', fontSize: 13, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6, cursor: 'default',
          }}>
            <Icon name="plus" size={14} />Add question
          </button>
        </div>

        {/* Settings */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, position: 'sticky', top: 24 }}>
          <Card>
            <b style={{ fontSize: 13, display: 'block', marginBottom: 12 }}>Settings</b>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                { l: 'Allow pause', d: 'Candidates can pause between questions', on: true },
                { l: 'Per-question timer', d: 'Hard limit per question', on: true },
                { l: 'Retakes', d: 'One retake per question allowed', on: false },
                { l: 'Webcam required', d: 'Record video for all responses', on: true },
                { l: 'Show progress', d: 'Display "3 of 10" progress bar', on: true },
              ].map(s => (
                <div key={s.l} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12.5, fontWeight: 500, color: 'var(--n-800)' }}>{s.l}</div>
                    <div style={{ fontSize: 11.5, color: 'var(--n-500)' }}>{s.d}</div>
                  </div>
                  <div style={{
                    width: 30, height: 18, borderRadius: 999, padding: 2,
                    background: s.on ? 'var(--p-600)' : 'var(--n-200)',
                    display: 'flex', alignItems: 'center', justifyContent: s.on ? 'flex-end' : 'flex-start',
                  }}>
                    <span style={{ width: 14, height: 14, borderRadius: '50%', background: '#fff' }} />
                  </div>
                </div>
              ))}
            </div>
          </Card>
          <Card>
            <b style={{ fontSize: 13, display: 'block', marginBottom: 10 }}>AI scoring rubric</b>
            <div style={{ fontSize: 12, color: 'var(--n-600)', marginBottom: 10, lineHeight: 1.5 }}>
              Weight how much each dimension matters for this role.
            </div>
            {[{l:'Technical',v:40},{l:'Communication',v:20},{l:'Problem solving',v:30},{l:'Role fit',v:10}].map(d => (
              <div key={d.l} style={{ marginBottom: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                  <span style={{ color: 'var(--n-700)' }}>{d.l}</span>
                  <span className="tnum" style={{ color: 'var(--n-500)' }}>{d.v}%</span>
                </div>
                <ProgressBar value={d.v*2.5} tone="primary" size="sm" />
              </div>
            ))}
          </Card>
        </div>
      </div>
    </AppShell>
  );
}

// ════════════════════════════════════════════════════════════════════
// HR: Candidates list + invite modal
// ════════════════════════════════════════════════════════════════════
function ScreenHRCandidates({ showModal = true }) {
  const cands = [
    { n: 'Priya Raman', e: 'priya.raman@mail.co', skills: ['React','TypeScript','CSS'], last: '2h ago', status: 'Completed', score: 85, stage: 'review' },
    { n: 'Diego Alvarez', e: 'diego@dev.io', skills: ['Go','Postgres','Kubernetes'], last: '1d ago', status: 'In progress', score: null, stage: 'inprog' },
    { n: 'Sasha Koval', e: 's.koval@hey.com', skills: ['Figma','Research'], last: '3d ago', status: 'Completed', score: 78, stage: 'review' },
    { n: 'Marcus Liu', e: 'marcus@mliu.dev', skills: ['Python','ML'], last: '5d ago', status: 'Pending', score: null, stage: 'pending' },
    { n: 'Aisha Nasser', e: 'aisha.n@outlook.com', skills: ['Product','Strategy','SQL'], last: '1w ago', status: 'Expired', score: null, stage: 'expired' },
    { n: 'Jamie Chen', e: 'jamie.c@proton.me', skills: ['Next.js','Testing'], last: '2w ago', status: 'Completed', score: 64, stage: 'decided' },
  ];
  const badge = { review: ['warning','Awaiting review'], inprog: ['info','In progress'], pending: ['neutral','Invited'], expired: ['error','Expired'], decided: ['success','Hired'] };
  return (
    <AppShell role="hr" active="candidates" header={
      <Header
        title="Candidates"
        subtitle="47 candidates · 3 awaiting your review"
        actions={<><Button variant="default" icon="download" size="sm">Export</Button><Button variant="primary" icon="plus">Invite</Button></>}
      />
    }>
      <div style={{ padding: 24, position: 'relative' }}>
        {/* Filters */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <div style={{ width: 320 }}><Input icon="search" placeholder="Name, email, skills…" size="sm" /></div>
          <Button variant="default" icon="filter" size="sm">Status</Button>
          <Button variant="default" icon="tag" size="sm">Skills</Button>
          <Button variant="default" icon="clipboard" size="sm">Template</Button>
          <div style={{ flex: 1 }} />
          <span style={{ fontSize: 12, color: 'var(--n-500)' }}>2 selected</span>
          <Button variant="default" icon="mail" size="sm">Invite selected</Button>
          <Button variant="default" icon="layers" size="sm">Compare</Button>
        </div>
        {/* Table */}
        <Card padding={0} style={{ overflow: 'hidden' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: '36px 2fr 2.5fr 1.5fr 1fr 1fr 40px',
            padding: '10px 16px', borderBottom: '1px solid var(--n-150)',
            background: 'var(--n-25)', fontSize: 11, fontWeight: 600, color: 'var(--n-500)',
            letterSpacing: '.04em', textTransform: 'uppercase',
          }}>
            <div></div><div>Candidate</div><div>Skills</div><div>Status</div><div>Score</div><div>Last activity</div><div></div>
          </div>
          {cands.map((c, i) => {
            const sel = i < 2;
            return (
              <div key={i} style={{
                display: 'grid',
                gridTemplateColumns: '36px 2fr 2.5fr 1.5fr 1fr 1fr 40px',
                alignItems: 'center', padding: '12px 16px',
                borderTop: i > 0 ? '1px solid var(--n-100)' : 'none',
                background: sel ? 'var(--p-50)' : 'transparent',
              }}>
                <Checkbox checked={sel} />
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                  <Avatar name={c.n} size={32} />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--n-900)' }}>{c.n}</div>
                    <div style={{ fontSize: 11.5, color: 'var(--n-500)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.e}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                  {c.skills.map(s => <Badge key={s} tone="neutral" size="sm">{s}</Badge>)}
                </div>
                <Badge tone={badge[c.stage][0]} dot size="sm">{badge[c.stage][1]}</Badge>
                <div>{c.score != null ? <Score value={c.score} variant="pill" size="sm" /> : <span style={{ fontSize: 12, color: 'var(--n-400)' }}>—</span>}</div>
                <div style={{ fontSize: 12, color: 'var(--n-500)' }}>{c.last}</div>
                <Icon name="moreV" size={14} style={{ color: 'var(--n-400)' }} />
              </div>
            );
          })}
        </Card>

        {/* Invite modal overlay */}
        {showModal && (
          <>
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(15,23,42,.4)', backdropFilter: 'blur(2px)' }} />
            <div style={{
              position: 'absolute', top: 60, left: '50%', transform: 'translateX(-50%)',
              width: 520, background: '#fff', borderRadius: 'var(--r-xl)',
              boxShadow: 'var(--sh-xl)', overflow: 'hidden',
            }}>
              <div style={{ padding: '18px 22px', borderBottom: '1px solid var(--n-150)', display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 10,
                  background: 'var(--p-50)', color: 'var(--p-700)',
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Icon name="mail" size={18} />
                </div>
                <div>
                  <h3 style={{ fontSize: 15, fontWeight: 600, color: 'var(--n-900)' }}>Invite 2 candidates</h3>
                  <p style={{ fontSize: 12.5, color: 'var(--n-500)' }}>Priya Raman and Diego Alvarez will receive an email.</p>
                </div>
                <Icon name="x" size={16} style={{ marginLeft: 'auto', color: 'var(--n-500)' }} />
              </div>
              <div style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--n-700)', display: 'block', marginBottom: 6 }}>Interview template</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 10, border: '1px solid var(--n-200)', borderRadius: 8, background: '#fff' }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--p-50)', color: 'var(--p-700)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Icon name="clipboard" size={16} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--n-900)' }}>Senior Frontend — React/TS</div>
                      <div style={{ fontSize: 11.5, color: 'var(--n-500)' }}>8 questions · ~25 min</div>
                    </div>
                    <Icon name="chevDown" size={14} style={{ color: 'var(--n-400)' }} />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--n-700)', display: 'block', marginBottom: 6 }}>Deadline</label>
                    <Input icon="calendar" placeholder="April 30, 2026" size="sm" />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--n-700)', display: 'block', marginBottom: 6 }}>Send reminder</label>
                    <Input icon="clock" defaultValue="1 day before" size="sm" />
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--n-700)', display: 'block', marginBottom: 6 }}>Personal message <span style={{ color: 'var(--n-400)', fontWeight: 400 }}>(optional)</span></label>
                  <Textarea rows={3} placeholder="A short note that appears in their invitation email…" defaultValue="Hey — thanks for applying! This is a short async interview (25 min). You can pause between questions. Take it at your own pace." />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: 10, background: 'var(--p-50)', borderRadius: 8, border: '1px solid var(--p-100)' }}>
                  <Icon name="info" size={14} style={{ color: 'var(--p-600)' }} />
                  <span style={{ fontSize: 12.5, color: 'var(--p-700)' }}>This will use 2 of your 62 remaining interviews this month.</span>
                </div>
              </div>
              <div style={{ padding: '14px 22px', borderTop: '1px solid var(--n-150)', display: 'flex', justifyContent: 'flex-end', gap: 8, background: 'var(--n-25)' }}>
                <Button variant="default" size="sm">Cancel</Button>
                <Button variant="primary" size="sm" icon="mail">Send invitations</Button>
              </div>
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}

// ════════════════════════════════════════════════════════════════════
// HR: Comparison view
// ════════════════════════════════════════════════════════════════════
function ScreenHRCompare() {
  const cols = [
    { n: 'Priya Raman', scores: [89,82,87,83], overall: 85, rec: 'hire', time: '21:25', strengths: 'CRDT depth, pragmatic debugging', weak: 'Testing practices shallow', flags: [] },
    { n: 'Diego Alvarez', scores: [84,79,82,80], overall: 81, rec: 'hire', time: '24:40', strengths: 'Systems thinking, clarity', weak: 'Frontend breadth limited', flags: ['Frontend gap'] },
    { n: 'Sasha Koval', scores: [68,86,74,81], overall: 78, rec: 'consider', time: '19:12', strengths: 'Communication, empathy', weak: 'Technical depth moderate', flags: [] },
    { n: 'Marcus Liu', scores: [74,62,71,69], overall: 69, rec: 'consider', time: '23:05', strengths: 'Data fluency', weak: 'React specifics weak', flags: ['Time pressure'] },
    { n: 'Jamie Chen', scores: [58,72,61,60], overall: 64, rec: 'reject', time: '15:48', strengths: 'Eager', weak: 'Scope of experience', flags: [] },
  ];
  const dims = ['Technical','Communication','Problem solving','Role fit'];
  const recColor = { hire: 'success', consider: 'warning', reject: 'error' };
  return (
    <AppShell role="hr" active="compare" header={
      <Header
        crumbs={['Comparison','Senior Frontend — React/TS']}
        title="Comparing 5 candidates"
        subtitle="Same template · Sorted by overall score"
        actions={<><Button variant="default" icon="sort" size="sm">Sort</Button><Button variant="default" icon="download" size="sm">Export CSV</Button><Button variant="default" icon="file" size="sm">Export PDF</Button></>}
      />
    }>
      <div style={{ padding: 24, overflow: 'auto' }}>
        <Card padding={0} style={{ overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: `220px repeat(${cols.length}, minmax(180px, 1fr))`, alignItems: 'stretch' }}>
            {/* Header row */}
            <div style={{ padding: 16, borderBottom: '1px solid var(--n-150)', background: 'var(--n-25)', display: 'flex', alignItems: 'flex-end' }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--n-500)', letterSpacing: '.04em', textTransform: 'uppercase' }}>Candidates</span>
            </div>
            {cols.map((c, i) => (
              <div key={i} style={{ padding: 16, borderBottom: '1px solid var(--n-150)', borderLeft: '1px solid var(--n-150)', background: i === 0 ? 'var(--p-50)' : 'var(--n-25)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                  <Avatar name={c.n} size={32} />
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--n-900)' }}>{c.n}</div>
                    <div style={{ fontSize: 11.5, color: 'var(--n-500)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      <Icon name="clock" size={11} />{c.time}
                    </div>
                  </div>
                  {i === 0 && <Icon name="crown" size={14} style={{ color: 'var(--warning-500)' }} />}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Score value={c.overall} size={44} />
                  <Badge tone={recColor[c.rec]} size="sm" style={{ textTransform: 'capitalize' }}>{c.rec}</Badge>
                </div>
              </div>
            ))}

            {/* Dimension rows */}
            {dims.map((d, di) => (
              <React.Fragment key={d}>
                <div style={{ padding: 14, borderBottom: '1px solid var(--n-100)', fontSize: 12.5, fontWeight: 500, color: 'var(--n-700)', display: 'flex', alignItems: 'center' }}>
                  {d}
                </div>
                {cols.map((c, i) => {
                  const v = c.scores[di];
                  const winner = Math.max(...cols.map(cc => cc.scores[di])) === v;
                  return (
                    <div key={i} style={{ padding: 14, borderLeft: '1px solid var(--n-150)', borderBottom: '1px solid var(--n-100)', display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Score value={v} variant="bar" />
                      {winner && <Icon name="star" size={12} style={{ color: 'var(--warning-500)', flexShrink: 0 }} />}
                    </div>
                  );
                })}
              </React.Fragment>
            ))}

            {/* Strengths */}
            <div style={{ padding: 14, fontSize: 12.5, fontWeight: 500, color: 'var(--n-700)', borderBottom: '1px solid var(--n-100)' }}>Top strength</div>
            {cols.map((c, i) => (
              <div key={i} style={{ padding: 14, borderLeft: '1px solid var(--n-150)', borderBottom: '1px solid var(--n-100)', fontSize: 12.5, color: 'var(--n-700)', lineHeight: 1.5 }}>
                <Icon name="thumbsUp" size={11} style={{ color: 'var(--success-600)', marginRight: 5 }} />{c.strengths}
              </div>
            ))}
            <div style={{ padding: 14, fontSize: 12.5, fontWeight: 500, color: 'var(--n-700)', borderBottom: '1px solid var(--n-100)' }}>Top concern</div>
            {cols.map((c, i) => (
              <div key={i} style={{ padding: 14, borderLeft: '1px solid var(--n-150)', borderBottom: '1px solid var(--n-100)', fontSize: 12.5, color: 'var(--n-700)', lineHeight: 1.5 }}>
                <Icon name="warning" size={11} style={{ color: 'var(--warning-600)', marginRight: 5 }} />{c.weak}
              </div>
            ))}
            <div style={{ padding: 14, fontSize: 12.5, fontWeight: 500, color: 'var(--n-700)' }}>Actions</div>
            {cols.map((c, i) => (
              <div key={i} style={{ padding: 14, borderLeft: '1px solid var(--n-150)', display: 'flex', gap: 6 }}>
                <Button variant="default" size="xs" icon="eye">Review</Button>
                <Button variant="ghost" size="xs" icon="thumbsUp"></Button>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </AppShell>
  );
}

// ════════════════════════════════════════════════════════════════════
// Candidate: Dashboard
// ════════════════════════════════════════════════════════════════════
function ScreenCandidateDashboard() {
  return (
    <AppShell role="candidate" active="dashboard" header={
      <Header
        title="Welcome back, Priya"
        subtitle="You have 1 interview ready to take and 1 result available."
        actions={<Button variant="default" icon="user" size="sm">Profile</Button>}
      />
    }>
      <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 880 }}>
        {/* Hero invitation */}
        <Card padding={0} style={{ overflow: 'hidden', border: '1px solid var(--p-200)' }}>
          <div style={{ padding: '20px 24px', background: 'linear-gradient(135deg, var(--p-50), #fff)', display: 'flex', alignItems: 'center', gap: 20 }}>
            <div style={{
              width: 56, height: 56, borderRadius: 14,
              background: 'linear-gradient(135deg, var(--p-500), var(--a-500))',
              color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 16px rgba(99,102,241,.3)',
            }}>
              <Icon name="sparkles" size={24} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <Badge tone="primary" dot size="sm">Ready to start</Badge>
                <span style={{ fontSize: 12, color: 'var(--n-500)' }}>from <b style={{ color: 'var(--n-700)', fontWeight: 500 }}>Acme Labs</b></span>
              </div>
              <h3 style={{ fontSize: 17, fontWeight: 600, color: 'var(--n-900)', marginBottom: 4, letterSpacing: '-.01em' }}>Senior Frontend Engineer — Interview</h3>
              <div style={{ display: 'flex', gap: 14, fontSize: 12.5, color: 'var(--n-600)' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><Icon name="list" size={13} />8 questions</span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><Icon name="clock" size={13} />~25 min</span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><Icon name="calendar" size={13} />Due Apr 30</span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><Icon name="pause" size={13} />Pause anytime</span>
              </div>
            </div>
            <Button variant="primary" size="lg" iconRight="arrowRight">Start interview</Button>
          </div>
          <div style={{ padding: '12px 24px', background: '#fff', borderTop: '1px solid var(--p-100)', display: 'flex', alignItems: 'center', gap: 10, fontSize: 12, color: 'var(--n-500)' }}>
            <Icon name="shield" size={13} style={{ color: 'var(--n-500)' }} />
            Your responses are only visible to the Acme Labs hiring team. <a style={{ color: 'var(--p-600)', fontWeight: 500, textDecoration: 'none' }}>Privacy details</a>
          </div>
        </Card>

        {/* Other interviews */}
        <div>
          <h3 style={{ fontSize: 13, fontWeight: 600, color: 'var(--n-500)', letterSpacing: '.06em', textTransform: 'uppercase', marginBottom: 10 }}>Past interviews</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              { t: 'Frontend Engineer', company: 'Canvas HQ', status: 'decision', decision: 'Hired', score: 82, when: 'Mar 18' },
              { t: 'Full-stack Engineer', company: 'Northwind', status: 'decision', decision: 'Not this time', score: 68, when: 'Feb 24' },
              { t: 'UI Engineer', company: 'Beam', status: 'analyzing', when: 'Apr 20' },
              { t: 'React Developer', company: 'Peregrine', status: 'expired', when: 'Mar 02' },
            ].map((x, i) => {
              const status = x.status === 'decision'
                ? (x.decision === 'Hired' ? ['success','Hired'] : ['error','Not this time'])
                : x.status === 'analyzing' ? ['info','Analyzing responses']
                : ['neutral','Expired'];
              return (
                <Card key={i} padding={16} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: 10, background: 'var(--n-100)', color: 'var(--n-600)',
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600,
                  }}>{x.company[0]}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 500, color: 'var(--n-900)' }}>{x.t}</div>
                    <div style={{ fontSize: 12, color: 'var(--n-500)' }}>{x.company} · {x.when}</div>
                  </div>
                  {x.score && <Score value={x.score} variant="pill" size="sm" />}
                  <Badge tone={status[0]} dot size="sm">{status[1]}</Badge>
                  {x.status === 'decision' && <Button variant="ghost" size="sm" iconRight="arrowRight">View results</Button>}
                  {x.status === 'analyzing' && <span style={{ fontSize: 12, color: 'var(--n-500)' }}>Up to 5 min</span>}
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    </AppShell>
  );
}

// ════════════════════════════════════════════════════════════════════
// Candidate: Interview-taking with webcam + proctoring
// ════════════════════════════════════════════════════════════════════
function ScreenInterviewTaking() {
  const totalQ = 8, currentQ = 3;
  return (
    <div className="app" style={{
      width: 1280, height: 800,
      background: 'var(--n-50)', borderRadius: 10, overflow: 'hidden',
      boxShadow: '0 0 0 1px var(--n-200), var(--sh-md)',
      display: 'flex', flexDirection: 'column',
    }}>
      {/* Minimal top bar — no sidebar */}
      <header style={{ padding: '14px 24px', borderBottom: '1px solid var(--n-200)', background: '#fff', display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{
          width: 28, height: 28, borderRadius: 8,
          background: 'linear-gradient(135deg, var(--p-500), var(--a-500))',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#fff', fontWeight: 700, fontSize: 13,
        }}>Iv</div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--n-900)' }}>Senior Frontend Engineer</div>
          <div style={{ fontSize: 11.5, color: 'var(--n-500)' }}>Acme Labs · Async interview</div>
        </div>
        <div style={{ flex: 1, maxWidth: 360, margin: '0 24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5, color: 'var(--n-500)', marginBottom: 4 }}>
            <span>Question {currentQ} of {totalQ}</span>
            <span className="tnum">~16 min remaining</span>
          </div>
          <div style={{ display: 'flex', gap: 3 }}>
            {Array.from({ length: totalQ }).map((_, i) => (
              <div key={i} style={{
                flex: 1, height: 4, borderRadius: 2,
                background: i < currentQ - 1 ? 'var(--success-500)' : i === currentQ - 1 ? 'var(--p-600)' : 'var(--n-200)',
              }} />
            ))}
          </div>
        </div>
        <Button variant="default" icon="pause" size="sm">Pause</Button>
        <Button variant="default" size="sm">Finish early</Button>
      </header>

      {/* Main */}
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 340px', gap: 24, padding: 32, overflow: 'auto' }}>
        {/* Question */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 680 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <Badge tone="info" size="md">Technical</Badge>
              <span style={{ fontSize: 12.5, color: 'var(--n-500)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <Icon name="clock" size={12} />7 min suggested
              </span>
            </div>
            <h2 style={{ fontSize: 24, fontWeight: 600, color: 'var(--n-900)', letterSpacing: '-.02em', lineHeight: 1.35, marginBottom: 10 }}>
              Explain how you'd architect a real-time collaborative editor.
            </h2>
            <p style={{ fontSize: 15, color: 'var(--n-600)', lineHeight: 1.55 }}>
              What conflicts arise between multiple concurrent editors, and how do you resolve them? Mention specific algorithms or libraries if you're familiar.
            </p>
          </div>

          {/* Record area */}
          <Card padding={0} style={{ overflow: 'hidden' }}>
            <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--n-150)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Badge tone="error" size="sm"><span style={{ width: 6, height: 6, background: 'var(--error-500)', borderRadius: '50%', marginRight: 4, animation: 'pulse 1.5s infinite' }} />Recording</Badge>
              <span className="tnum" style={{ fontSize: 12, color: 'var(--n-600)' }}>02:14</span>
              <div style={{ flex: 1 }} />
              <Icon name="mic" size={14} style={{ color: 'var(--success-600)' }} />
              <Icon name="video" size={14} style={{ color: 'var(--success-600)' }} />
              <span style={{ fontSize: 11.5, color: 'var(--n-500)' }}>Saving locally</span>
            </div>
            <div style={{ aspectRatio: '16/8.5', background: 'linear-gradient(135deg, #1e1b4b, #312e81)', position: 'relative' }}>
              <svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: .45 }}>
                <ellipse cx="50" cy="38" rx="11" ry="13" fill="rgba(255,255,255,.18)" />
                <path d="M30 100 Q30 72 50 70 Q70 72 70 100" fill="rgba(255,255,255,.12)" />
              </svg>
              {/* Audio waveform */}
              <div style={{ position: 'absolute', left: 20, right: 20, bottom: 16, display: 'flex', alignItems: 'flex-end', gap: 2, height: 32 }}>
                {Array.from({ length: 60 }).map((_, i) => (
                  <span key={i} style={{ flex: 1, height: `${20 + Math.abs(Math.sin(i * 0.8)) * 80}%`, background: 'rgba(255,255,255,.5)', borderRadius: 1 }} />
                ))}
              </div>
            </div>
            <div style={{ padding: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
              <Button variant="ghost" size="sm" icon="pause">Pause</Button>
              <Button variant="default" size="sm" icon="refresh">Re-record</Button>
            </div>
          </Card>

          {/* Text fallback */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
              <span style={{ fontSize: 12.5, fontWeight: 500, color: 'var(--n-700)' }}>Additional notes</span>
              <span style={{ fontSize: 11.5, color: 'var(--n-500)' }}>· Optional. Useful for code snippets or diagrams.</span>
            </div>
            <Textarea rows={3} placeholder="Add supporting text, links, or code. Markdown supported." />
          </div>

          {/* Footer */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingTop: 6 }}>
            <Button variant="default" size="md" icon="arrowLeft">Previous</Button>
            <div style={{ flex: 1 }} />
            <span style={{ fontSize: 12, color: 'var(--n-500)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <Icon name="check" size={12} style={{ color: 'var(--success-600)' }} />
              Response saved
            </span>
            <Button variant="primary" size="md" iconRight="arrowRight">Submit & continue</Button>
          </div>
        </div>

        {/* Side column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Self-view */}
          <Card padding={0} style={{ overflow: 'hidden' }}>
            <div style={{ padding: '10px 12px', borderBottom: '1px solid var(--n-150)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Icon name="eye" size={13} style={{ color: 'var(--n-500)' }} />
              <b style={{ fontSize: 12.5 }}>Your view</b>
              <Icon name="info" size={12} style={{ color: 'var(--n-400)', marginLeft: 'auto' }} />
            </div>
            <div style={{ aspectRatio: '4/3', background: 'linear-gradient(135deg, #312e81, #4338ca)', position: 'relative' }}>
              <svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: .5 }}>
                <ellipse cx="50" cy="40" rx="12" ry="14" fill="rgba(255,255,255,.2)" />
                <path d="M28 100 Q28 74 50 72 Q72 74 72 100" fill="rgba(255,255,255,.13)" />
              </svg>
              {/* Framing guides */}
              <svg viewBox="0 0 100 75" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
                <rect x="32" y="20" width="36" height="45" rx="2" fill="none" stroke="rgba(255,255,255,.3)" strokeWidth=".3" strokeDasharray="2 2" />
              </svg>
              <div style={{ position: 'absolute', bottom: 6, left: 8, fontSize: 10, color: 'rgba(255,255,255,.85)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <span style={{ width: 5, height: 5, background: 'var(--success-500)', borderRadius: '50%' }} />
                Good lighting
              </div>
            </div>
            <div style={{ padding: '8px 12px', display: 'flex', gap: 6 }}>
              <Button variant="ghost" size="xs" icon="mic">Mic</Button>
              <Button variant="ghost" size="xs" icon="video">Cam</Button>
              <Button variant="ghost" size="xs" icon="settings" style={{ marginLeft: 'auto' }}></Button>
            </div>
          </Card>

          {/* Progress */}
          <Card padding={16}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
              <b style={{ fontSize: 12.5 }}>Questions</b>
              <span style={{ fontSize: 11.5, color: 'var(--n-500)', marginLeft: 'auto' }}>{currentQ-1}/{totalQ} done</span>
            </div>
            <ul style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {['Recent project tradeoffs','Real-time editor arch','React perf diagnosis','Design disagreement','FE trend skepticism','Rendering 10k rows','Team conflict story','Anything to ask us?'].map((t, i) => (
                <li key={i} style={{
                  padding: '7px 8px', borderRadius: 6, fontSize: 12.5,
                  display: 'flex', alignItems: 'center', gap: 8,
                  background: i === currentQ - 1 ? 'var(--p-50)' : 'transparent',
                  color: i < currentQ - 1 ? 'var(--n-500)' : i === currentQ - 1 ? 'var(--n-900)' : 'var(--n-500)',
                  fontWeight: i === currentQ - 1 ? 500 : 400,
                }}>
                  <span style={{
                    width: 16, height: 16, borderRadius: '50%', flexShrink: 0,
                    background: i < currentQ - 1 ? 'var(--success-500)' : i === currentQ - 1 ? 'var(--p-600)' : 'var(--n-100)',
                    color: i <= currentQ - 1 ? '#fff' : 'var(--n-500)',
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 600,
                  }}>
                    {i < currentQ - 1 ? <Icon name="check" size={9} stroke={3} /> : i + 1}
                  </span>
                  <span style={{ textDecoration: i < currentQ - 1 ? 'line-through' : 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t}</span>
                </li>
              ))}
            </ul>
          </Card>

          {/* Tips */}
          <Card padding={14} style={{ background: 'var(--p-50)', border: '1px solid var(--p-100)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
              <Icon name="sparkles" size={13} style={{ color: 'var(--p-600)' }} />
              <b style={{ fontSize: 12.5, color: 'var(--p-700)' }}>Take your time</b>
            </div>
            <p style={{ fontSize: 12, color: 'var(--n-600)', lineHeight: 1.5 }}>
              You can pause between questions, and re-record once per answer. Your progress is saved automatically.
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
// Candidate: Results (read-only)
// ════════════════════════════════════════════════════════════════════
function ScreenCandidateResults() {
  return (
    <AppShell role="candidate" active="results" header={
      <Header
        crumbs={['My interviews','Acme Labs · Senior Frontend']}
        title="Your interview results"
        subtitle="Shared with you on Apr 24 · Decision: Hired 🎉"
        actions={<Button variant="default" icon="download" size="sm">Download PDF</Button>}
      />
    }>
      <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 820 }}>
        <Card padding={0} style={{ overflow: 'hidden' }}>
          <div style={{ padding: 24, background: 'linear-gradient(135deg, rgba(16,185,129,.08), rgba(99,102,241,.04))', display: 'flex', alignItems: 'center', gap: 20 }}>
            <Score value={85} size={84} showLabel label="Overall" />
            <div style={{ flex: 1 }}>
              <Badge tone="success" icon="check" size="lg" style={{ marginBottom: 8 }}>Strong performance</Badge>
              <p style={{ fontSize: 14.5, color: 'var(--n-700)', lineHeight: 1.55 }}>
                You demonstrated deep technical knowledge — especially on real-time systems and React internals. Your communication was clear and structured throughout.
              </p>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)' }}>
            {[['Technical',89],['Communication',82],['Problem solving',87],['Role fit',83]].map(([k, v], i) => (
              <div key={k} style={{ padding: 16, borderLeft: i ? '1px solid var(--n-150)' : 'none', borderTop: '1px solid var(--n-150)' }}>
                <div style={{ fontSize: 11, color: 'var(--n-500)', letterSpacing: '.04em', textTransform: 'uppercase', fontWeight: 600, marginBottom: 4 }}>{k}</div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 6 }}>
                  <span className="tnum" style={{ fontSize: 22, fontWeight: 600, color: 'var(--n-900)' }}>{v}</span>
                  <span style={{ fontSize: 12, color: 'var(--n-400)' }}>/100</span>
                </div>
                <ProgressBar value={v} tone="success" size="sm" />
              </div>
            ))}
          </div>
        </Card>

        {/* Strengths / growth */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <Card>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
              <Icon name="thumbsUp" size={15} style={{ color: 'var(--success-600)' }} />
              <b style={{ fontSize: 13.5 }}>What you did well</b>
            </div>
            {['System design fluency','Pragmatic debugging','Self-aware communication'].map((s, i) => (
              <div key={s} style={{ padding: '8px 0', borderTop: i ? '1px solid var(--n-100)' : 'none', fontSize: 13, color: 'var(--n-700)', display: 'flex', gap: 8 }}>
                <Icon name="check" size={14} style={{ color: 'var(--success-600)', marginTop: 2 }} />
                {s}
              </div>
            ))}
          </Card>
          <Card>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
              <Icon name="sparkle" size={15} style={{ color: 'var(--p-600)' }} />
              <b style={{ fontSize: 13.5 }}>Areas to grow</b>
            </div>
            {['Talk more about testing approach','Go deeper on your opinions'].map((s, i) => (
              <div key={s} style={{ padding: '8px 0', borderTop: i ? '1px solid var(--n-100)' : 'none', fontSize: 13, color: 'var(--n-700)', display: 'flex', gap: 8 }}>
                <Icon name="arrowRight" size={14} style={{ color: 'var(--p-600)', marginTop: 2 }} />
                {s}
              </div>
            ))}
          </Card>
        </div>

        <Card padding={16} style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'var(--n-25)' }}>
          <Icon name="shield" size={15} style={{ color: 'var(--n-500)' }} />
          <span style={{ fontSize: 12.5, color: 'var(--n-600)', flex: 1 }}>
            This feedback was generated by AI and reviewed by the Acme Labs team. Share it with future employers if you'd like.
          </span>
          <Button variant="default" size="sm" icon="link">Shareable link</Button>
        </Card>
      </div>
    </AppShell>
  );
}

// ════════════════════════════════════════════════════════════════════
// Profile: Billing
// ════════════════════════════════════════════════════════════════════
function ScreenBilling() {
  return (
    <AppShell role="hr" active="billing" header={
      <Header
        crumbs={['Profile','Billing']}
        title="Billing & usage"
        subtitle="Manage your plan, team seats, and invoices."
        tabs={[{value:'profile',label:'Profile',icon:'user'},{value:'sec',label:'Security',icon:'lock'},{value:'notif',label:'Notifications',icon:'bell'},{value:'bill',label:'Billing',icon:'crown'}]}
        tabValue="bill"
      />
    }>
      <div style={{ padding: 24, display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: 16, maxWidth: 1100 }}>
        {/* Current plan */}
        <Card padding={0} style={{ overflow: 'hidden', gridColumn: '1 / -1' }}>
          <div style={{ padding: 24, display: 'flex', alignItems: 'center', gap: 24, background: 'linear-gradient(135deg, rgba(99,102,241,.05), rgba(139,92,246,.03))' }}>
            <div style={{
              width: 64, height: 64, borderRadius: 16,
              background: 'linear-gradient(135deg, var(--p-500), var(--a-500))',
              color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 8px 24px rgba(99,102,241,.3)',
            }}>
              <Icon name="crown" size={28} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <h3 style={{ fontSize: 22, fontWeight: 600, color: 'var(--n-900)', letterSpacing: '-.02em' }}>Plus</h3>
                <Badge tone="success" dot size="sm">Active</Badge>
              </div>
              <div style={{ fontSize: 13.5, color: 'var(--n-500)' }}>
                <b className="tnum" style={{ color: 'var(--n-900)', fontWeight: 600 }}>$29</b>/month · Renews <b style={{ color: 'var(--n-700)', fontWeight: 500 }}>May 18, 2026</b> · Billed to •••• 4242
              </div>
            </div>
            <Button variant="default" size="sm" icon="settings">Manage in Stripe</Button>
            <Button variant="primary" size="sm" icon="zap">Upgrade to Pro</Button>
          </div>
          {/* Usage */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', borderTop: '1px solid var(--n-150)' }}>
            {[
              { k: 'Interviews this month', u: 38, l: 100, icon: 'clipboard' },
              { k: 'Active templates', u: 6, l: 10, icon: 'book' },
              { k: 'Team members', u: 3, l: 5, icon: 'users' },
            ].map((m, i) => {
              const pct = m.u / m.l * 100;
              const tone = pct > 80 ? 'warning' : 'primary';
              return (
                <div key={m.k} style={{ padding: '18px 22px', borderLeft: i ? '1px solid var(--n-150)' : 'none' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                    <Icon name={m.icon} size={14} style={{ color: 'var(--n-500)' }} />
                    <span style={{ fontSize: 12, color: 'var(--n-500)', fontWeight: 500 }}>{m.k}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 8 }}>
                    <span className="tnum" style={{ fontSize: 26, fontWeight: 600, color: 'var(--n-900)', letterSpacing: '-.02em' }}>{m.u}</span>
                    <span className="tnum" style={{ fontSize: 13, color: 'var(--n-500)' }}>/ {m.l}</span>
                  </div>
                  <ProgressBar value={pct} tone={tone} size="md" />
                  {pct > 80 && (
                    <div style={{ marginTop: 6, fontSize: 11.5, color: 'var(--warning-700)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      <Icon name="warning" size={11} />Approaching limit
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </Card>

        {/* Invoices */}
        <Card padding={0}>
          <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--n-150)', display: 'flex', alignItems: 'center' }}>
            <b style={{ fontSize: 13.5 }}>Invoices</b>
            <Button variant="ghost" size="sm" icon="download" style={{ marginLeft: 'auto' }}>All</Button>
          </div>
          {[
            { d: 'Apr 18, 2026', a: '$29.00', s: 'paid', id: 'INV-2026-0418' },
            { d: 'Mar 18, 2026', a: '$29.00', s: 'paid', id: 'INV-2026-0318' },
            { d: 'Feb 18, 2026', a: '$29.00', s: 'paid', id: 'INV-2026-0218' },
            { d: 'Jan 18, 2026', a: '$0.00',  s: 'free', id: 'INV-2026-0118' },
          ].map((inv, i) => (
            <div key={i} style={{
              padding: '12px 18px', borderTop: i ? '1px solid var(--n-100)' : 'none',
              display: 'flex', alignItems: 'center', gap: 12,
            }}>
              <Icon name="file" size={14} style={{ color: 'var(--n-400)' }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--n-900)' }}>{inv.id}</div>
                <div style={{ fontSize: 11.5, color: 'var(--n-500)' }}>{inv.d}</div>
              </div>
              <Badge tone={inv.s === 'paid' ? 'success' : 'neutral'} size="sm" style={{ textTransform: 'capitalize' }}>{inv.s}</Badge>
              <span className="tnum" style={{ fontSize: 13, fontWeight: 500, color: 'var(--n-900)', width: 60, textAlign: 'right' }}>{inv.a}</span>
              <Icon name="download" size={14} style={{ color: 'var(--n-500)' }} />
            </div>
          ))}
        </Card>

        {/* Danger + plan compare */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Card>
            <b style={{ fontSize: 13.5, display: 'block', marginBottom: 4 }}>Try Pro free for 14 days</b>
            <p style={{ fontSize: 12.5, color: 'var(--n-600)', lineHeight: 1.5, marginBottom: 12 }}>
              Unlimited interviews, unlimited team, priority analysis. No card required.
            </p>
            <div style={{ display: 'flex', gap: 8 }}>
              <Button variant="primary" size="sm" icon="zap">Start free trial</Button>
              <Button variant="ghost" size="sm">Compare plans</Button>
            </div>
          </Card>
          <Card>
            <b style={{ fontSize: 13.5, display: 'block', marginBottom: 8 }}>Cancel subscription</b>
            <p style={{ fontSize: 12.5, color: 'var(--n-600)', lineHeight: 1.5, marginBottom: 10 }}>
              Your plan stays active until <b>May 18, 2026</b>. After that, you'll be moved to the Free tier.
            </p>
            <Button variant="default" size="sm" icon="x">Cancel at period end</Button>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}

// ════════════════════════════════════════════════════════════════════
// Marketing: Landing
// ════════════════════════════════════════════════════════════════════
function ScreenLanding() {
  return (
    <div style={{
      width: 1280, height: 800, borderRadius: 10, overflow: 'hidden',
      boxShadow: '0 0 0 1px var(--n-200), var(--sh-md)', background: '#fff',
      display: 'flex', flexDirection: 'column', fontFamily: 'var(--font-sans)',
    }} className="app">
      {/* Nav */}
      <header style={{ padding: '18px 40px', display: 'flex', alignItems: 'center', gap: 24, borderBottom: '1px solid var(--n-100)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 28, height: 28, borderRadius: 8,
            background: 'linear-gradient(135deg, var(--p-500), var(--a-500))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontWeight: 700, fontSize: 13,
          }}>Iv</div>
          <b style={{ fontSize: 15, letterSpacing: '-.01em' }}>Ivory</b>
        </div>
        <nav style={{ display: 'flex', gap: 20, fontSize: 13, color: 'var(--n-600)' }}>
          <a style={{ textDecoration: 'none', color: 'inherit' }}>Product</a>
          <a style={{ textDecoration: 'none', color: 'inherit' }}>Pricing</a>
          <a style={{ textDecoration: 'none', color: 'inherit' }}>Customers</a>
          <a style={{ textDecoration: 'none', color: 'inherit' }}>About</a>
        </nav>
        <div style={{ flex: 1 }} />
        <Button variant="ghost" size="sm">Sign in</Button>
        <Button variant="primary" size="sm">Start free</Button>
      </header>

      {/* Hero */}
      <div style={{
        padding: '72px 40px 40px',
        background: 'radial-gradient(1200px 400px at 50% 0%, rgba(99,102,241,.08), transparent), #fff',
        textAlign: 'center',
      }}>
        <Badge tone="primary" icon="sparkles" size="md" style={{ marginBottom: 20 }}>AI-scored · built for hiring teams</Badge>
        <h1 style={{ fontSize: 52, fontWeight: 600, letterSpacing: '-.03em', color: 'var(--n-900)', lineHeight: 1.05, margin: '0 auto 20px', maxWidth: 820 }}>
          Phone screens without the <span style={{
            backgroundImage: 'linear-gradient(90deg, var(--p-600), var(--a-500))',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>phone</span>, or the screens.
        </h1>
        <p style={{ fontSize: 17.5, color: 'var(--n-500)', lineHeight: 1.55, maxWidth: 620, margin: '0 auto 32px' }}>
          Candidates take a short async interview. Our AI scores responses against your rubric.
          You make the call — in minutes, not days.
        </p>
        <div style={{ display: 'inline-flex', gap: 10 }}>
          <Button variant="primary" size="lg" iconRight="arrowRight">Start for free</Button>
          <Button variant="default" size="lg" icon="play">Watch 90-sec demo</Button>
        </div>
        <div style={{ marginTop: 18, fontSize: 12, color: 'var(--n-500)' }}>
          No credit card · 10 free interviews · SOC 2 Type II
        </div>
      </div>

      {/* Product snapshot */}
      <div style={{ padding: '0 40px 40px', flex: 1 }}>
        <div style={{
          borderRadius: 14, boxShadow: 'var(--sh-xl)', overflow: 'hidden',
          border: '1px solid var(--n-200)', maxWidth: 1100, margin: '0 auto',
          background: '#fff',
        }}>
          <div style={{ padding: '8px 12px', background: 'var(--n-100)', display: 'flex', alignItems: 'center', gap: 6, borderBottom: '1px solid var(--n-200)' }}>
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#ef4444' }} />
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#f59e0b' }} />
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#10b981' }} />
            <span style={{ fontSize: 11, color: 'var(--n-500)', marginLeft: 10 }}>app.ivory.io/hr/review/priya-raman</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', background: 'var(--n-50)' }}>
            <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Score value={85} size={56} />
                <div style={{ flex: 1 }}>
                  <Badge tone="success" icon="check">Recommend to hire</Badge>
                  <div style={{ fontSize: 12, color: 'var(--n-500)', marginTop: 4 }}>Strong on real-time systems and React internals.</div>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                {[89,82,87,83].map((v, i) => (
                  <div key={i} style={{ padding: 10, background: '#fff', borderRadius: 8, border: '1px solid var(--n-150)' }}>
                    <div style={{ fontSize: 10, color: 'var(--n-500)', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '.04em' }}>
                      {['Tech','Comm','Problem','Fit'][i]}
                    </div>
                    <div className="tnum" style={{ fontSize: 18, fontWeight: 600 }}>{v}</div>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ background: 'linear-gradient(135deg, #1e1b4b, #312e81)', position: 'relative' }}>
              <svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: .5 }}>
                <ellipse cx="50" cy="42" rx="14" ry="17" fill="rgba(255,255,255,.18)" />
              </svg>
              <div style={{ position: 'absolute', top: 10, left: 10, fontSize: 10, color: '#fff' }}>
                <Badge tone="error" size="sm" style={{ background: 'rgba(239,68,68,.85)', color: '#fff' }}>REC</Badge>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Logos */}
      <div style={{ padding: '0 40px 40px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 40, opacity: .5 }}>
        {['Canvas','Northwind','Peregrine','Beam','Atlas'].map(l => (
          <span key={l} style={{ fontSize: 16, fontWeight: 600, color: 'var(--n-600)', letterSpacing: '-.02em' }}>{l}</span>
        ))}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
// Marketing: Pricing
// ════════════════════════════════════════════════════════════════════
function ScreenPricing() {
  const plans = [
    { n: 'Free', p: 0, desc: 'For testing the waters.', features: ['10 interviews/month','2 templates','1 seat','Basic AI scoring'], cta: 'Start free', variant: 'default' },
    { n: 'Plus', p: 29, desc: 'For small hiring teams.', features: ['100 interviews/month','Unlimited templates','5 seats','Candidate compare','Priority support'], cta: 'Start 14-day trial', variant: 'primary', popular: true },
    { n: 'Pro',  p: 99, desc: 'For scaling teams.', features: ['Unlimited interviews','Unlimited seats','SSO + SCIM','Custom rubrics','Dedicated CSM','Audit log'], cta: 'Talk to sales', variant: 'default' },
  ];
  return (
    <div className="app" style={{
      width: 1280, height: 800, borderRadius: 10, overflow: 'hidden',
      boxShadow: '0 0 0 1px var(--n-200), var(--sh-md)', background: '#fff',
    }}>
      <header style={{ padding: '18px 40px', display: 'flex', alignItems: 'center', gap: 24, borderBottom: '1px solid var(--n-100)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: 'linear-gradient(135deg, var(--p-500), var(--a-500))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 13 }}>Iv</div>
          <b style={{ fontSize: 15 }}>Ivory</b>
        </div>
        <nav style={{ display: 'flex', gap: 20, fontSize: 13, color: 'var(--n-600)' }}>
          <a style={{ textDecoration: 'none', color: 'inherit' }}>Product</a>
          <a style={{ textDecoration: 'none', color: 'var(--n-900)', fontWeight: 500 }}>Pricing</a>
          <a style={{ textDecoration: 'none', color: 'inherit' }}>Customers</a>
        </nav>
        <div style={{ flex: 1 }} />
        <Button variant="ghost" size="sm">Sign in</Button>
      </header>
      <div style={{ padding: '56px 40px', textAlign: 'center' }}>
        <h1 style={{ fontSize: 44, fontWeight: 600, letterSpacing: '-.03em', marginBottom: 10 }}>Simple, predictable pricing</h1>
        <p style={{ fontSize: 16, color: 'var(--n-500)', marginBottom: 28 }}>No per-candidate fees. No surprises.</p>
        <div style={{ display: 'inline-flex', background: 'var(--n-100)', padding: 3, borderRadius: 10 }}>
          <button style={{ padding: '6px 14px', border: 'none', background: '#fff', borderRadius: 7, fontSize: 12.5, fontWeight: 500, boxShadow: 'var(--sh-xs)' }}>Monthly</button>
          <button style={{ padding: '6px 14px', border: 'none', background: 'transparent', borderRadius: 7, fontSize: 12.5, color: 'var(--n-600)' }}>Yearly <span style={{ color: 'var(--success-600)', fontWeight: 500 }}>(−20%)</span></button>
        </div>
      </div>
      <div style={{ padding: '0 40px 40px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, maxWidth: 1100, margin: '0 auto' }}>
        {plans.map(p => (
          <div key={p.n} style={{
            borderRadius: 16, padding: 28,
            border: p.popular ? '1px solid var(--p-600)' : '1px solid var(--n-200)',
            background: p.popular ? 'linear-gradient(180deg, rgba(99,102,241,.04), #fff)' : '#fff',
            boxShadow: p.popular ? '0 8px 32px rgba(99,102,241,.14)' : 'var(--sh-xs)',
            position: 'relative',
          }}>
            {p.popular && (
              <div style={{ position: 'absolute', top: -10, left: 28 }}>
                <Badge tone="primary" icon="sparkle" size="md" style={{ background: 'var(--p-600)', color: '#fff', height: 22 }}>Most popular</Badge>
              </div>
            )}
            <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 4 }}>{p.n}</h3>
            <p style={{ fontSize: 12.5, color: 'var(--n-500)', marginBottom: 18 }}>{p.desc}</p>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 20 }}>
              <span className="tnum" style={{ fontSize: 40, fontWeight: 600, letterSpacing: '-.03em' }}>${p.p}</span>
              <span style={{ fontSize: 13, color: 'var(--n-500)' }}>/month</span>
            </div>
            <Button variant={p.variant} size="md" style={{ width: '100%', justifyContent: 'center', marginBottom: 22 }}>{p.cta}</Button>
            <ul style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {p.features.map(f => (
                <li key={f} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--n-700)' }}>
                  <Icon name="check" size={14} stroke={2.5} style={{ color: p.popular ? 'var(--p-600)' : 'var(--success-600)', flexShrink: 0 }} />
                  {f}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}

Object.assign(window, {
  ScreenHRInterviews, ScreenHRBuilder, ScreenHRCandidates, ScreenHRCompare,
  ScreenCandidateDashboard, ScreenInterviewTaking, ScreenCandidateResults,
  ScreenBilling, ScreenLanding, ScreenPricing,
});
