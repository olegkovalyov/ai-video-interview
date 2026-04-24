// app.jsx — Lays all screens out on a DesignCanvas.

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "primaryHue": 243,
  "density": "regular",
  "scoreViz": "ring",
  "sidebarMode": "expanded"
}/*EDITMODE-END*/;

function Root() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);

  // Apply tweaks: hue rotate for primary + compactness
  React.useEffect(() => {
    const root = document.documentElement;
    // simple hue shift on primary via HSL overrides
    const h = t.primaryHue;
    root.style.setProperty('--p-50',  `hsl(${h} 100% 97%)`);
    root.style.setProperty('--p-100', `hsl(${h} 95% 93%)`);
    root.style.setProperty('--p-200', `hsl(${h} 93% 86%)`);
    root.style.setProperty('--p-500', `hsl(${h} 85% 60%)`);
    root.style.setProperty('--p-600', `hsl(${h} 75% 55%)`);
    root.style.setProperty('--p-700', `hsl(${h} 65% 48%)`);
  }, [t.primaryHue]);

  return (
    <>
      <DesignCanvas>
        <DCSection id="marketing" title="Marketing" subtitle="Public-facing pages — hero, pricing.">
          <DCArtboard id="landing" label="Landing page" width={1280} height={800}>
            <ScreenLanding />
          </DCArtboard>
          <DCArtboard id="pricing" label="Pricing" width={1280} height={800}>
            <ScreenPricing />
          </DCArtboard>
        </DCSection>

        <DCSection id="hr" title="HR workspace" subtitle="Where hiring teams spend their day — templates, candidates, decisions.">
          <DCArtboard id="review" label="★ Review / decision screen" width={1280} height={820}>
            <ScreenHRReview />
          </DCArtboard>
          <DCArtboard id="compare" label="Compare candidates (Phase 2)" width={1280} height={800}>
            <ScreenHRCompare />
          </DCArtboard>
          <DCArtboard id="interviews" label="Interview templates" width={1280} height={800}>
            <ScreenHRInterviews />
          </DCArtboard>
          <DCArtboard id="builder" label="Template builder" width={1280} height={820}>
            <ScreenHRBuilder />
          </DCArtboard>
          <DCArtboard id="candidates" label="Candidates + invite modal" width={1280} height={800}>
            <ScreenHRCandidates />
          </DCArtboard>
        </DCSection>

        <DCSection id="candidate" title="Candidate experience" subtitle="Lower anxiety, clear signal — from invite to results.">
          <DCArtboard id="cand-dash" label="Candidate dashboard" width={1280} height={800}>
            <ScreenCandidateDashboard />
          </DCArtboard>
          <DCArtboard id="interview" label="Interview in progress (w/ webcam)" width={1280} height={800}>
            <ScreenInterviewTaking />
          </DCArtboard>
          <DCArtboard id="results" label="Results (read-only, after decision)" width={1280} height={800}>
            <ScreenCandidateResults />
          </DCArtboard>
        </DCSection>

        <DCSection id="account" title="Profile & billing" subtitle="Plan, usage, invoices.">
          <DCArtboard id="billing" label="Billing & usage" width={1280} height={800}>
            <ScreenBilling />
          </DCArtboard>
        </DCSection>
      </DesignCanvas>

      <TweaksPanel>
        <TweakSection label="Brand" />
        <TweakSlider label="Primary hue" value={t.primaryHue} min={200} max={320} step={1} unit="°"
                     onChange={v => setTweak('primaryHue', v)} />
        <TweakSection label="Density" />
        <TweakRadio label="UI density" value={t.density} options={['compact','regular','comfy']}
                    onChange={v => setTweak('density', v)} />
        <TweakSection label="Score" />
        <TweakRadio label="Score visualization" value={t.scoreViz} options={['ring','bar','pill']}
                    onChange={v => setTweak('scoreViz', v)} />
        <TweakSection label="Sidebar" />
        <TweakRadio label="Sidebar" value={t.sidebarMode} options={['expanded','compact']}
                    onChange={v => setTweak('sidebarMode', v)} />
      </TweaksPanel>
    </>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<Root />);
