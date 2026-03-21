import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { MessageSquare, Smartphone, BarChart3, RefreshCw, Check, ChevronRight, Zap, Shield, Clock, ArrowRight, Phone, Mail, MapPin } from 'lucide-react';
import './landing.css';

/* ── Scroll reveal hook ────────────────────────────────────────── */
function useReveal() {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) el.classList.add('visible'); },
      { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return ref;
}

/* ── Animated counter ──────────────────────────────────────────── */
function Counter({ end, suffix = '' }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        let start = 0;
        const step = Math.ceil(end / 40);
        const timer = setInterval(() => {
          start += step;
          if (start >= end) { setCount(end); clearInterval(timer); }
          else setCount(start);
        }, 30);
      }
    }, { threshold: 0.5 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [end]);
  return <span ref={ref}>{count}{suffix}</span>;
}

/* ── WhatsApp SVG icon ─────────────────────────────────────────── */
const WhatsAppIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
);

/* ══════════════════════════════════════════════════════════════════
   LANDING PAGE
   ══════════════════════════════════════════════════════════════════ */
export default function LandingPage() {
  const [billingCycle, setBillingCycle] = useState('quarterly');

  // Global scroll observer for all animated elements
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); }),
      { threshold: 0.1, rootMargin: '0px 0px -30px 0px' }
    );
    document.querySelectorAll('.landing-fade-up, .landing-fade-left, .landing-fade-right, .landing-scale-in').forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const pricing = {
    starter: { monthly: 199, quarterly: 549, halfYearly: 999, yearly: 1899, setup: 499 },
    business: { monthly: 429, quarterly: 1199, halfYearly: 2299, yearly: 4199, setup: 999 },
    advanced: { monthly: 749, quarterly: 2099, halfYearly: 3999, yearly: 7499, setup: 1499 },
  };

  const getPrice = (plan) => pricing[plan][billingCycle];
  const getMonthly = (plan) => {
    const p = pricing[plan];
    if (billingCycle === 'monthly') return p.monthly;
    if (billingCycle === 'quarterly') return Math.round(p.quarterly / 3);
    if (billingCycle === 'halfYearly') return Math.round(p.halfYearly / 6);
    return Math.round(p.yearly / 12);
  };

  const cycleLabel = { monthly: '/mo', quarterly: '/quarter', halfYearly: '/6 months', yearly: '/year' };

  // Reveal refs
  const r1 = useReveal(), r2 = useReveal(), r3 = useReveal(), r4 = useReveal();
  const r5 = useReveal(), r6 = useReveal(), r7 = useReveal(), r8 = useReveal();
  const r9 = useReveal(), r10 = useReveal(), r11 = useReveal();

  return (
    <div className="landing-page">

      {/* ═══ NAVBAR ═══ */}
      <nav className="landing-nav">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/images/logo.png" alt="RepairTrack" className="w-9 h-9 rounded-lg" onError={(e) => { e.target.style.display = 'none'; }} />
            <span className="text-xl font-bold tracking-tight">Repair<span className="landing-gradient-text">Track</span></span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium" style={{ color: '#A0B3C6' }}>
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
            <a href="#how-it-works" className="hover:text-white transition-colors">How It Works</a>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login" className="text-sm font-semibold px-4 py-2 rounded-lg hover:text-white transition-colors" style={{ color: '#A0B3C6' }}>
              Login
            </Link>
            <a href="#pricing" className="landing-btn-primary !py-2.5 !px-5 !text-sm">
              Start Free Trial
            </a>
          </div>
        </div>
      </nav>

      {/* ═══ HERO SECTION ═══ */}
      <section className="relative min-h-screen flex items-center pt-20 landing-grid-bg overflow-hidden">
        <div className="landing-hero-orb-1"></div>
        <div className="landing-hero-orb-2"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24 relative z-10">
          <div className="grid md:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left */}
            <div>
              <div ref={r1} className="landing-fade-left">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold mb-6" style={{ background: 'rgba(38,198,102,0.1)', color: '#26C666', border: '1px solid rgba(38,198,102,0.2)' }}>
                  <Zap className="w-4 h-4" />
                  Built for Repair Shops
                </div>
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-[1.1] mb-6 tracking-tight">
                  Notify customers<br />
                  <span className="landing-gradient-text">instantly.</span>
                </h1>
                <p className="text-lg md:text-xl mb-8 leading-relaxed max-w-lg" style={{ color: '#A0B3C6' }}>
                  Automatic WhatsApp updates for repair shops.<br className="hidden sm:block" />
                  No more <em>"Is my phone ready?"</em> calls.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <a href="#pricing" className="landing-btn-primary text-center">
                    <Zap className="w-5 h-5" /> Start Free Trial
                  </a>
                  <a href="#how-it-works" className="landing-btn-secondary text-center">
                    See How It Works <ChevronRight className="w-4 h-4" />
                  </a>
                </div>

                {/* Stats */}
                <div className="flex gap-8 mt-12 pt-8" style={{ borderTop: '1px solid #1E3A5F' }}>
                  <div>
                    <div className="text-2xl sm:text-3xl font-bold landing-gradient-text"><Counter end={500} suffix="+" /></div>
                    <div className="text-xs font-medium mt-1" style={{ color: '#6B7C93' }}>Messages/Day</div>
                  </div>
                  <div>
                    <div className="text-2xl sm:text-3xl font-bold landing-gradient-text"><Counter end={99} suffix="%" /></div>
                    <div className="text-xs font-medium mt-1" style={{ color: '#6B7C93' }}>Uptime</div>
                  </div>
                  <div>
                    <div className="text-2xl sm:text-3xl font-bold landing-gradient-text"><Counter end={30} suffix="s" /></div>
                    <div className="text-xs font-medium mt-1" style={{ color: '#6B7C93' }}>Setup Time</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right — Mockup */}
            <div ref={r2} className="landing-fade-right landing-delay-2">
              <div className="landing-float relative">
                <div className="absolute inset-0 blur-3xl opacity-20" style={{ background: 'radial-gradient(circle, #26C666 0%, transparent 70%)' }}></div>
                <img
                  src="/images/whatsapp-mockup.png"
                  alt="WhatsApp notification mockup"
                  className="relative z-10 w-full max-w-md mx-auto rounded-2xl"
                  style={{ border: '1px solid #1E3A5F', boxShadow: '0 20px 80px rgba(0,0,0,0.5)' }}
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'flex';
                  }}
                />
                {/* Placeholder if image missing */}
                <div className="relative z-10 w-full max-w-md mx-auto rounded-2xl h-96 items-center justify-center text-center p-8" style={{ display: 'none', background: '#0A1F33', border: '1px solid #1E3A5F' }}>
                  <div>
                    <WhatsAppIcon />
                    <p className="mt-4 font-semibold" style={{ color: '#6B7C93' }}>WhatsApp Mockup Image</p>
                    <p className="text-xs mt-2" style={{ color: '#6B7C93' }}>Add: /images/whatsapp-mockup.png</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ PROBLEM SECTION ═══ */}
      <section className="py-20 md:py-28 relative" style={{ background: '#061A2E' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div ref={r3} className="landing-fade-up text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold mb-6">
              Tired of constant<br /><span className="landing-gradient-text">customer calls?</span>
            </h2>
            <p className="text-lg" style={{ color: '#A0B3C6' }}>
              Every repair shop faces the same problems. RepairTrack solves them all.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
            {[
              { icon: Phone, title: 'Endless phone calls', desc: '"Is my phone ready?" "What\'s the status?" — 20+ calls every single day eating into your work time.', color: '#ef4444' },
              { icon: Clock, title: 'No tracking system', desc: 'Paper notes, mental tracking, miscommunication with staff — leads to delays and unhappy customers.', color: '#FFB020' },
              { icon: MessageSquare, title: 'Manual communication', desc: 'Typing messages one by one, forgetting to update customers, losing repeat business.', color: '#3b82f6' },
            ].map((item, i) => (
              <div key={i} ref={[r4, r5, r6][i]} className={`landing-fade-up landing-delay-${i + 1} landing-card`}>
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-5" style={{ background: `${item.color}15`, color: item.color }}>
                  <item.icon className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold mb-3">{item.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: '#A0B3C6' }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ SOLUTION / HOW IT WORKS ═══ */}
      <section id="how-it-works" className="py-20 md:py-28 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div ref={r7} className="landing-fade-up text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold mb-6 uppercase tracking-wider" style={{ background: 'rgba(38,198,102,0.1)', color: '#26C666', border: '1px solid rgba(38,198,102,0.2)' }}>
              How It Works
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold mb-6">
              We handle customer<br /><span className="landing-gradient-text">communication for you</span>
            </h2>
          </div>

          {/* Workflow: 3 Steps */}
          <div className="grid md:grid-cols-3 gap-6 lg:gap-0 relative">
            {/* Connecting line (desktop only) */}
            <div className="hidden lg:block absolute top-1/2 left-[17%] right-[17%] h-0.5" style={{ background: 'linear-gradient(90deg, #1E3A5F, #26C666, #1E3A5F)' }}></div>

            {[
              { step: '01', title: 'Create Job', desc: 'Log the customer device, issue, and estimated cost. Takes 30 seconds.', icon: Smartphone },
              { step: '02', title: 'Update Status', desc: 'Change status as repair progresses — Received → Diagnosing → Ready.', icon: RefreshCw },
              { step: '03', title: 'Customer Notified', desc: 'Customer gets a professional WhatsApp message instantly. Zero effort.', icon: MessageSquare },
            ].map((item, i) => (
              <div key={i} className="landing-fade-up landing-card text-center relative z-10" style={{ transitionDelay: `${i * 150}ms` }}>
                <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-5 text-xl font-extrabold landing-pulse-glow" style={{ background: '#26C666', color: '#041423' }}>
                  {item.step}
                </div>
                <item.icon className="w-8 h-8 mx-auto mb-4" style={{ color: '#26C666' }} />
                <h3 className="text-lg font-bold mb-3">{item.title}</h3>
                <p className="text-sm" style={{ color: '#A0B3C6' }}>{item.desc}</p>
              </div>
            ))}
          </div>

          {/* Dashboard Preview */}
          <div ref={r8} className="landing-scale-in mt-16 landing-card p-2 sm:p-4 overflow-hidden" style={{ border: '1px solid #26C66640' }}>
            <img
              src="/images/dashboard-preview.png"
              alt="RepairTrack Dashboard"
              className="w-full rounded-xl"
              style={{ border: '1px solid #1E3A5F' }}
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'flex';
              }}
            />
            <div className="w-full rounded-xl h-64 sm:h-80 items-center justify-center text-center" style={{ display: 'none', background: '#071B2F', border: '1px solid #1E3A5F' }}>
              <div>
                <BarChart3 className="w-12 h-12 mx-auto mb-3" style={{ color: '#6B7C93' }} />
                <p className="font-semibold" style={{ color: '#6B7C93' }}>Dashboard Preview</p>
                <p className="text-xs mt-2" style={{ color: '#6B7C93' }}>Add: /images/dashboard-preview.png</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ FEATURES SECTION ═══ */}
      <section id="features" className="py-20 md:py-28" style={{ background: '#061A2E' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div ref={r9} className="landing-fade-up text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-extrabold mb-4">
              Everything you need to<br /><span className="landing-gradient-text">run your repair shop</span>
            </h2>
            <p style={{ color: '#A0B3C6' }}>Simple tools that save hours every day.</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Smartphone, title: 'Job Tracking', desc: 'Track every repair from intake to delivery with unique job IDs and full history.' },
              { icon: MessageSquare, title: 'Auto WhatsApp Updates', desc: 'Customers get instant WhatsApp messages when you update job status. Zero typing.' },
              { icon: BarChart3, title: 'Simple Dashboard', desc: 'See active jobs, completed today, and revenue at a glance. No complexity.' },
              { icon: RefreshCw, title: 'Status Management', desc: '9 status stages from Received to Delivered. Each change auto-notifies the customer.' },
              { icon: Shield, title: 'Secure & Private', desc: 'Your data is encrypted and isolated. Each shop gets its own secure workspace.' },
              { icon: Zap, title: 'Instant Setup', desc: 'Connect WhatsApp in 30 seconds with a pairing code. No QR scan needed on mobile.' },
              { icon: Clock, title: 'Save 2+ Hours/Day', desc: 'No more manual messages or phone calls. Automation handles customer communication.' },
              { icon: Check, title: 'Customer Satisfaction', desc: 'Proactive updates mean happier customers, better reviews, and more referrals.' },
            ].map((item, i) => (
              <div key={i} className="landing-card landing-fade-up group" style={{ transitionDelay: `${(i % 4) * 100}ms` }}>
                <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-4 transition-colors" style={{ background: 'rgba(38,198,102,0.1)', color: '#26C666' }}>
                  <item.icon className="w-5 h-5" />
                </div>
                <h3 className="font-bold mb-2">{item.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: '#A0B3C6' }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ PRICING SECTION ═══ */}
      <section id="pricing" className="py-20 md:py-28 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div ref={r10} className="landing-fade-up text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-extrabold mb-4">
              Simple, transparent <span className="landing-gradient-text">pricing</span>
            </h2>
            <p className="mb-8" style={{ color: '#A0B3C6' }}>Less than one repair profit. Start today.</p>

            {/* Billing Toggle */}
            <div className="landing-toggle">
              {[
                { key: 'monthly', label: 'Monthly' },
                { key: 'quarterly', label: 'Quarterly' },
                { key: 'halfYearly', label: '6 Months' },
                { key: 'yearly', label: 'Yearly' },
              ].map(o => (
                <button key={o.key} className={billingCycle === o.key ? 'active' : ''} onClick={() => setBillingCycle(o.key)}>
                  {o.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-6 lg:gap-8 max-w-5xl mx-auto">
            {/* Starter */}
            <div className="landing-card landing-fade-up">
              <div className="text-xs font-bold uppercase tracking-wider mb-4" style={{ color: '#6B7C93' }}>Starter</div>
              <div className="flex items-baseline gap-1 mb-1">
                <span className="text-4xl font-extrabold">₹{getPrice('starter')}</span>
                <span className="text-sm font-medium" style={{ color: '#6B7C93' }}>{cycleLabel[billingCycle]}</span>
              </div>
              <div className="text-xs mb-6" style={{ color: '#26C666' }}>₹{getMonthly('starter')}/mo effective • Setup: ₹{pricing.starter.setup}</div>
              <div className="landing-divider mb-6"></div>
              <ul className="space-y-3 mb-8">
                {['1 WhatsApp Number', 'Job Tracking System', 'Auto Status Updates', 'Basic Dashboard', '~300-500 msgs/day'].map((f, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm" style={{ color: '#A0B3C6' }}>
                    <Check className="w-4 h-4 shrink-0" style={{ color: '#26C666' }} /> {f}
                  </li>
                ))}
              </ul>
              <a href="#" className="landing-btn-secondary w-full justify-center text-sm">Get Started</a>
            </div>

            {/* Business — Popular */}
            <div className="landing-card landing-popular landing-fade-up landing-delay-2">
              <div className="text-xs font-bold uppercase tracking-wider mb-4" style={{ color: '#26C666' }}>Business</div>
              <div className="flex items-baseline gap-1 mb-1">
                <span className="text-4xl font-extrabold">₹{getPrice('business')}</span>
                <span className="text-sm font-medium" style={{ color: '#6B7C93' }}>{cycleLabel[billingCycle]}</span>
              </div>
              <div className="text-xs mb-6" style={{ color: '#26C666' }}>₹{getMonthly('business')}/mo effective • Setup: ₹{pricing.business.setup}</div>
              <div className="landing-divider mb-6"></div>
              <ul className="space-y-3 mb-8">
                {['Everything in Starter', 'Faster Processing', 'Priority Support', 'More job handling', '~800-1000 msgs/day'].map((f, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm" style={{ color: '#A0B3C6' }}>
                    <Check className="w-4 h-4 shrink-0" style={{ color: '#26C666' }} /> {f}
                  </li>
                ))}
              </ul>
              <a href="#" className="landing-btn-primary w-full justify-center text-sm">Start Free Trial</a>
            </div>

            {/* Advanced */}
            <div className="landing-card landing-fade-up landing-delay-3">
              <div className="text-xs font-bold uppercase tracking-wider mb-4" style={{ color: '#6B7C93' }}>Advanced</div>
              <div className="flex items-baseline gap-1 mb-1">
                <span className="text-4xl font-extrabold">₹{getPrice('advanced')}</span>
                <span className="text-sm font-medium" style={{ color: '#6B7C93' }}>{cycleLabel[billingCycle]}</span>
              </div>
              <div className="text-xs mb-6" style={{ color: '#26C666' }}>₹{getMonthly('advanced')}/mo effective • Setup: ₹{pricing.advanced.setup}</div>
              <div className="landing-divider mb-6"></div>
              <ul className="space-y-3 mb-8">
                {['Everything in Business', 'High Performance', 'Priority Queue', 'Large job volume', '~1500+ msgs/day'].map((f, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm" style={{ color: '#A0B3C6' }}>
                    <Check className="w-4 h-4 shrink-0" style={{ color: '#26C666' }} /> {f}
                  </li>
                ))}
              </ul>
              <a href="#" className="landing-btn-secondary w-full justify-center text-sm">Contact Sales</a>
            </div>
          </div>

          {/* Add-on */}
          <div className="landing-card mt-8 max-w-5xl mx-auto text-center landing-fade-up" style={{ background: 'linear-gradient(135deg, #0A1F33 0%, #0D2844 100%)' }}>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8">
              <div className="flex items-center gap-3">
                <Smartphone className="w-6 h-6" style={{ color: '#26C666' }} />
                <span className="font-bold">Mobile App Access</span>
              </div>
              <div className="text-sm" style={{ color: '#A0B3C6' }}>
                Starting at <span className="font-bold text-white">₹299/mo</span> • ₹799/quarter • ₹2999/year
              </div>
            </div>
          </div>

          {/* Billing Rule */}
          <p className="text-center text-xs mt-6" style={{ color: '#6B7C93' }}>
            💡 New customers: Setup Cost + Minimum 3 Months (Quarterly Plan). Example (Starter): ₹499 + ₹549 = <strong className="text-white">₹1,048</strong> first payment.
          </p>
        </div>
      </section>

      {/* ═══ CTA SECTION ═══ */}
      <section className="py-20 md:py-28 relative overflow-hidden" style={{ background: '#061A2E' }}>
        <div className="absolute inset-0 landing-grid-bg opacity-30"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full blur-3xl" style={{ background: 'radial-gradient(circle, rgba(38,198,102,0.08), transparent 70%)' }}></div>
        <div ref={r11} className="landing-fade-up max-w-3xl mx-auto text-center px-4 relative z-10">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold mb-6">
            Ready to <span className="landing-gradient-text">automate</span> your<br />customer updates?
          </h2>
          <p className="text-lg mb-10" style={{ color: '#A0B3C6' }}>
            Start for just ₹199/month — less than one repair profit.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="#pricing" className="landing-btn-primary text-lg !py-4 !px-10">
              <Zap className="w-5 h-5" /> Start Free Trial
            </a>
            <a href="https://wa.me/918807948403" target="_blank" rel="noopener noreferrer" className="landing-btn-secondary text-lg !py-4 !px-10">
              <WhatsAppIcon /> Contact Us
            </a>
          </div>
        </div>
      </section>

      {/* ═══ FOOTER ═══ */}
      <footer className="py-12 border-t" style={{ borderColor: '#1E3A5F', background: '#031019' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-10">
            {/* Brand */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <img src="/images/logo.png" alt="RepairTrack" className="w-8 h-8 rounded-lg" onError={(e) => { e.target.style.display = 'none'; }} />
                <span className="font-bold text-lg">Repair<span className="landing-gradient-text">Track</span></span>
              </div>
              <p className="text-sm leading-relaxed" style={{ color: '#6B7C93' }}>
                India's smartest repair shop management platform. Automate customer updates and grow your business.
              </p>
            </div>

            {/* Product */}
            <div>
              <h4 className="font-bold text-sm mb-4" style={{ color: '#A0B3C6' }}>Product</h4>
              <ul className="space-y-2.5 text-sm" style={{ color: '#6B7C93' }}>
                <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#pricing" className="hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#how-it-works" className="hover:text-white transition-colors">How It Works</a></li>
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h4 className="font-bold text-sm mb-4" style={{ color: '#A0B3C6' }}>Contact</h4>
              <ul className="space-y-2.5 text-sm" style={{ color: '#6B7C93' }}>
                <li className="flex items-center gap-2"><Phone className="w-4 h-4" style={{ color: '#26C666' }} /> +91 88079 48403</li>
                <li className="flex items-center gap-2"><Mail className="w-4 h-4" style={{ color: '#26C666' }} /> support@menoval.com</li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h4 className="font-bold text-sm mb-4" style={{ color: '#A0B3C6' }}>Legal</h4>
              <ul className="space-y-2.5 text-sm" style={{ color: '#6B7C93' }}>
                <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Refund Policy</a></li>
              </ul>
            </div>
          </div>

          <div className="landing-divider mb-8"></div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-sm" style={{ color: '#6B7C93' }}>Powered by</span>
              <img src="/images/menoval-logo.png" alt="Menoval Technology Solutions" className="h-6" onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'inline'; }} />
              <span className="text-sm font-semibold hidden" style={{ color: '#A0B3C6' }}>Menoval Technology Solutions</span>
            </div>
            <p className="text-xs" style={{ color: '#6B7C93' }}>
              © {new Date().getFullYear()} RepairTrack. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
