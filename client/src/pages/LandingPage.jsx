import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { MessageSquare, Smartphone, BarChart3, RefreshCw, Check, ChevronRight, Zap, Shield, Clock, Phone, Mail, ArrowRight, Sparkles, Send, Star, Wrench, CheckCircle2, Bell, Lightbulb, Rocket, Heart, Settings, CircleDot } from 'lucide-react';
import './landing.css';

/* ── WhatsApp redirect URL ───────────────────────────────────── */
const WA_TRIAL_URL = 'https://wa.me/918807948403?text=' + encodeURIComponent(
  'Hi! I\'m interested in RepairTrack. I\'d like to start a free trial for my repair shop.'
);

/* ── Scroll reveal hook ──────────────────────────────────────── */
function useReveal(delay = 0) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (delay) el.style.transitionDelay = `${delay}ms`;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) el.classList.add('visible'); },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [delay]);
  return ref;
}

/* ── Animated counter ────────────────────────────────────────── */
function Counter({ end, suffix = '' }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const started = useRef(false);
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !started.current) {
        started.current = true;
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

/* ── WhatsApp SVG ────────────────────────────────────────────── */
const WAIcon = ({ className = 'w-5 h-5' }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
);

/* ═══════════════════════════════════════════════════════════════
   LANDING PAGE
   ═══════════════════════════════════════════════════════════════ */
export default function LandingPage() {
  const [billingCycle, setBillingCycle] = useState('quarterly');
  const [navScrolled, setNavScrolled] = useState(false);

  // Global scroll observer + navbar scroll effect
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); }),
      { threshold: 0.1, rootMargin: '0px 0px -30px 0px' }
    );
    document.querySelectorAll('.landing-fade-up, .landing-fade-left, .landing-fade-right, .landing-scale-in').forEach(el => observer.observe(el));

    const handleScroll = () => setNavScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => { observer.disconnect(); window.removeEventListener('scroll', handleScroll); };
  }, []);

  const pricing = {
    starter: { monthly: 199, quarterly: 549, halfYearly: 999, yearly: 1899, setup: 499 },
    business: { monthly: 429, quarterly: 1199, halfYearly: 2299, yearly: 4199, setup: 999 },
    advanced: { monthly: 749, quarterly: 2099, halfYearly: 3999, yearly: 7499, setup: 1499 },
  };
  const getPrice = (plan) => pricing[plan][billingCycle];
  const getMonthly = (plan) => {
    const p = pricing[plan];
    const divs = { monthly: 1, quarterly: 3, halfYearly: 6, yearly: 12 };
    return Math.round(p[billingCycle] / divs[billingCycle]);
  };
  const cycleLabel = { monthly: '/mo', quarterly: '/quarter', halfYearly: '/6 months', yearly: '/year' };

  return (
    <div className="landing-page">

      {/* ═══ NAVBAR ═══ */}
      <nav className={`landing-nav ${navScrolled ? 'landing-nav-scrolled' : ''}`}>
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
            <Link to="/login" className="text-sm font-semibold px-4 py-2.5 rounded-xl hover:text-white transition-colors" style={{ color: '#A0B3C6' }}>
              Login
            </Link>
            <a href={WA_TRIAL_URL} target="_blank" rel="noopener noreferrer" className="landing-btn-primary !py-2.5 !px-5 !text-sm">
              Start Free Trial
            </a>
          </div>
        </div>
      </nav>

      {/* ═══ HERO ═══ */}
      <section className="relative min-h-screen flex items-center pt-20 overflow-hidden">
        {/* Layered animated background */}
        <div className="landing-hero-orb-1"></div>
        <div className="landing-hero-orb-2"></div>
        <div className="landing-hero-orb-3"></div>
        <div className="landing-hero-grid"></div>
        <div className="landing-hero-beam"></div>
        <div className="landing-hero-beam landing-hero-beam-2"></div>
        <div className="landing-hero-particles">
          {Array.from({ length: 20 }).map((_, i) => <div key={i} className="landing-particle" />)}
        </div>
        <div className="landing-hero-stripe"></div>
        {/* Hex pattern overlay */}
        <div className="landing-hero-hex"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24 relative z-10">
          <div className="grid md:grid-cols-2 gap-12 lg:gap-20 items-center">
            {/* Left — Copy */}
            <div ref={useReveal()} className="landing-fade-left">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold mb-6 landing-badge-glow" style={{ background: 'rgba(38,198,102,0.1)', color: '#26C666', border: '1px solid rgba(38,198,102,0.25)' }}>
                <Sparkles className="w-4 h-4" />
                Built for Repair Shops in India
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-[3.5rem] font-extrabold leading-[1.1] mb-6 tracking-tight">
                Notify customers<br />
                <span className="landing-gradient-text landing-text-shimmer">instantly.</span>
              </h1>
              <p className="text-lg md:text-xl mb-8 leading-relaxed max-w-lg" style={{ color: '#A0B3C6' }}>
                Automatic WhatsApp updates for repair shops.<br className="hidden sm:block" />
                No more <em>"Is my phone ready?"</em> calls.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <a href={WA_TRIAL_URL} target="_blank" rel="noopener noreferrer" className="landing-btn-primary text-center">
                  <Zap className="w-5 h-5" /> Start Free Trial
                </a>
                <a href="#how-it-works" className="landing-btn-secondary text-center">
                  See How It Works <ChevronRight className="w-4 h-4" />
                </a>
              </div>

              {/* Stats */}
              <div className="flex gap-8 mt-12 pt-8" style={{ borderTop: '1px solid #1E3A5F' }}>
                {[
                  { end: 500, suffix: '+', label: 'Messages/Day', icon: Send },
                  { end: 99, suffix: '%', label: 'Uptime', icon: Shield },
                  { end: 30, suffix: 's', label: 'Setup Time', icon: Zap },
                ].map((s, i) => (
                  <div key={i}>
                    <div className="text-2xl sm:text-3xl font-bold landing-gradient-text"><Counter end={s.end} suffix={s.suffix} /></div>
                    <div className="flex items-center gap-1 mt-1">
                      <s.icon className="w-3 h-3" style={{ color: '#6B7C93' }} />
                      <span className="text-xs font-medium" style={{ color: '#6B7C93' }}>{s.label}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right — Image Showcase */}
            <div ref={useReveal(200)} className="landing-fade-right">
              <div className="landing-hero-showcase">
                {/* Multi–layer glow behind image */}
                <div className="landing-showcase-glow-1"></div>
                <div className="landing-showcase-glow-2"></div>

                {/* Concentric rings */}
                <div className="landing-hero-ring landing-hero-ring-1"></div>
                <div className="landing-hero-ring landing-hero-ring-2"></div>
                <div className="landing-hero-ring landing-hero-ring-3"></div>

                {/* Orbiting icons */}
                <div className="landing-orbit">
                  <div className="landing-orbit-icon landing-orbit-icon-1">
                    <MessageSquare className="w-4 h-4" style={{ color: '#26C666' }} />
                  </div>
                  <div className="landing-orbit-icon landing-orbit-icon-2">
                    <Shield className="w-4 h-4" style={{ color: '#3b82f6' }} />
                  </div>
                  <div className="landing-orbit-icon landing-orbit-icon-3">
                    <Zap className="w-4 h-4" style={{ color: '#FFB020' }} />
                  </div>
                  <div className="landing-orbit-icon landing-orbit-icon-4">
                    <CheckCircle2 className="w-4 h-4" style={{ color: '#26C666' }} />
                  </div>
                </div>

                {/* The image */}
                <div className="landing-float relative z-10">
                  <img
                    src="/images/whatsapp-mockup.png"
                    alt="WhatsApp notification mockup"
                    className="relative z-10 w-full mx-auto"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.parentElement.parentElement.querySelector('.landing-fallback').style.display = 'block';
                    }}
                  />
                </div>

                {/* Floating glassmorphism mini-badges */}
                <div className="landing-mini-badge landing-mini-badge-1">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'rgba(38,198,102,0.2)' }}>
                      <Bell className="w-3.5 h-3.5" style={{ color: '#26C666' }} />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white">Auto Notifications</div>
                      <div className="text-[10px]" style={{ color: '#6B7C93' }}>Instant delivery</div>
                    </div>
                  </div>
                </div>

                <div className="landing-mini-badge landing-mini-badge-2">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'rgba(59,130,246,0.2)' }}>
                      <CheckCircle2 className="w-3.5 h-3.5" style={{ color: '#3b82f6' }} />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white">Ready for Pickup</div>
                      <div className="text-[10px]" style={{ color: '#6B7C93' }}>Status sent</div>
                    </div>
                  </div>
                </div>

                <div className="landing-mini-badge landing-mini-badge-3">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'rgba(255,176,32,0.2)' }}>
                      <Zap className="w-3.5 h-3.5" style={{ color: '#FFB020' }} />
                    </div>
                    <span className="text-xs font-bold text-white">30s Setup</span>
                  </div>
                </div>

                {/* Fallback — Hidden, shown if image fails */}
                <div className="landing-fallback" style={{ display: 'none' }}>
                  <div className="landing-card p-0 overflow-hidden landing-pulse-glow relative z-10">
                    <div className="px-4 py-3 flex items-center gap-3" style={{ background: '#075E54' }}>
                      <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                        <WAIcon className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <div className="text-white text-sm font-semibold">RepairTrack</div>
                        <div className="text-green-200 text-xs">online</div>
                      </div>
                    </div>
                    <div className="p-4 space-y-3" style={{ background: '#0B141A' }}>
                      <div className="landing-msg-in">
                        <p className="text-sm flex items-center gap-1.5"><Wrench className="w-3.5 h-3.5" style={{ color: '#26C666' }} /> <strong>Job Received!</strong></p>
                        <p className="text-xs mt-1" style={{ color: '#A0B3C6' }}>Your iPhone 15 has been registered for repair.</p>
                        <p className="text-xs mt-1" style={{ color: '#A0B3C6' }}>Job ID: <strong className="text-white">JOB-2026-0042</strong></p>
                      </div>
                      <div className="landing-msg-in landing-msg-delay-1">
                        <p className="text-sm flex items-center gap-1.5"><Zap className="w-3.5 h-3.5" style={{ color: '#FFB020' }} /> <strong>Status Update</strong></p>
                        <p className="text-xs mt-1" style={{ color: '#A0B3C6' }}>Your device is now: <strong className="text-green-400">Ready for Pickup</strong></p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ TRUSTED BY — Scrolling ticker ═══ */}
      <div className="py-6 relative overflow-hidden" style={{ background: '#061A2E', borderTop: '1px solid #1E3A5F20', borderBottom: '1px solid #1E3A5F20' }}>
        <div className="landing-ticker">
          {Array.from({ length: 2 }).map((_, loop) => (
            <div key={loop} className="landing-ticker-track">
              {['500+ Messages Sent Daily', '99.9% Uptime', 'Instant WhatsApp Delivery', 'Trusted by Repair Shops', 'Zero Manual Work', '30 Second Setup', 'Auto Customer Notifications'].map((text, i) => (
                <span key={i} className="flex items-center gap-3 px-6 whitespace-nowrap text-sm font-medium" style={{ color: '#6B7C93' }}>
                  <Star className="w-3 h-3" style={{ color: '#26C666' }} /> {text}
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* ═══ PROBLEM SECTION ═══ */}
      <section className="py-20 md:py-28 relative" style={{ background: '#061A2E' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div ref={useReveal()} className="landing-fade-up text-center max-w-3xl mx-auto mb-16">
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
              <div key={i} ref={useReveal(i * 150)} className="landing-fade-up landing-card landing-card-hover group">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5 transition-transform group-hover:scale-110 group-hover:rotate-3" style={{ background: `${item.color}12`, color: item.color }}>
                  <item.icon className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-bold mb-3">{item.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: '#A0B3C6' }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ HOW IT WORKS — Glassmorphism Timeline ═══ */}
      <section id="how-it-works" className="py-20 md:py-32 relative overflow-hidden">
        {/* Background decorations */}
        <div className="landing-hero-grid opacity-20"></div>
        <div className="absolute top-1/4 right-0 w-[500px] h-[500px] rounded-full blur-3xl" style={{ background: 'radial-gradient(circle, rgba(38,198,102,0.06), transparent 70%)' }}></div>
        <div className="absolute bottom-1/4 left-0 w-[400px] h-[400px] rounded-full blur-3xl" style={{ background: 'radial-gradient(circle, rgba(30,58,95,0.2), transparent 70%)' }}></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div ref={useReveal()} className="landing-fade-up text-center max-w-3xl mx-auto mb-20">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold mb-6 uppercase tracking-wider landing-glass-badge">
              <CircleDot className="w-3.5 h-3.5" /> Simple 3-Step Process
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold mb-6">
              We handle customer<br /><span className="landing-gradient-text">communication for you</span>
            </h2>
            <p className="text-lg" style={{ color: '#A0B3C6' }}>From job creation to customer notification — fully automated.</p>
          </div>

          {/* Timeline Steps */}
          <div className="max-w-4xl mx-auto relative">
            {/* Vertical connecting line */}
            <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-px -translate-x-1/2" style={{ background: 'linear-gradient(180deg, transparent, #1E3A5F, #26C666, #1E3A5F, transparent)' }}>
              <div className="landing-timeline-dot"></div>
            </div>

            {[
              { step: '01', title: 'Create Job', desc: 'Log the customer\'s device, issue, and estimated cost. Our intuitive interface makes it effortless — takes just 30 seconds.', icon: Smartphone, color: '#3b82f6', align: 'right' },
              { step: '02', title: 'Update Status', desc: 'As repair progresses, change the status with one click. 9 stages from Received to Delivered. Each change triggers the next step.', icon: RefreshCw, color: '#FFB020', align: 'left' },
              { step: '03', title: 'Customer Notified', desc: 'Your customer instantly receives a professional WhatsApp message with the status update. Zero typing, zero effort.', icon: Send, color: '#26C666', align: 'right' },
            ].map((item, i) => (
              <div key={i} ref={useReveal(i * 200)} className={`landing-fade-up flex items-center gap-8 mb-12 md:mb-16 ${item.align === 'left' ? 'md:flex-row-reverse' : ''}`}>
                {/* Glass Card */}
                <div className="flex-1">
                  <div className="landing-glass-card group">
                    <div className="flex items-start gap-4">
                      <div className="relative shrink-0">
                        <div className="w-14 h-14 rounded-2xl flex items-center justify-center transition-all group-hover:scale-110" style={{ background: `${item.color}15`, color: item.color }}>
                          <item.icon className="w-7 h-7" />
                        </div>
                        <div className="landing-step-pulse" style={{ borderColor: `${item.color}40` }}></div>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-xs font-bold px-2.5 py-1 rounded-lg tracking-wider" style={{ background: `${item.color}15`, color: item.color }}>STEP {item.step}</span>
                        </div>
                        <h3 className="text-xl font-bold mb-2">{item.title}</h3>
                        <p className="text-sm leading-relaxed" style={{ color: '#A0B3C6' }}>{item.desc}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Center step circle (desktop) */}
                <div className="hidden md:flex shrink-0 w-12 h-12 rounded-full items-center justify-center text-sm font-extrabold relative z-10" style={{ background: item.color, color: '#041423', boxShadow: `0 0 30px ${item.color}40` }}>
                  {item.step}
                </div>

                {/* Spacer for alignment */}
                <div className="hidden md:block flex-1"></div>
              </div>
            ))}
          </div>

          {/* WhatsApp Message Demo — Glassmorphism */}
          <div ref={useReveal()} className="landing-scale-in mt-8 max-w-lg mx-auto">
            <div className="landing-glass-card !p-0 overflow-hidden" style={{ border: '1px solid rgba(38,198,102,0.2)' }}>
              <div className="px-4 py-3 flex items-center gap-3" style={{ background: 'rgba(7,94,84,0.6)', backdropFilter: 'blur(10px)' }}>
                <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.15)' }}>
                  <WAIcon className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1">
                  <div className="text-white text-sm font-semibold">Your Shop Name</div>
                  <div className="text-xs" style={{ color: '#86EFAC' }}>typing...</div>
                </div>
                <div className="flex items-center gap-1">
                  <div className="landing-typing-dot"></div>
                  <div className="landing-typing-dot" style={{ animationDelay: '0.2s' }}></div>
                  <div className="landing-typing-dot" style={{ animationDelay: '0.4s' }}></div>
                </div>
              </div>
              <div className="p-4 space-y-3" style={{ background: 'rgba(11,20,26,0.8)' }}>
                <div className="landing-msg-in">
                  <p className="text-sm font-medium flex items-center gap-1.5"><Wrench className="w-3.5 h-3.5" style={{ color: '#26C666' }} /> <strong>Repair Status Update</strong></p>
                  <p className="text-xs mt-2 leading-relaxed" style={{ color: '#A0B3C6' }}>
                    Hi Ravi! Your <strong className="text-white">Samsung Galaxy S24</strong> is now <strong className="text-green-400">Ready for Pickup!</strong>
                  </p>
                  <p className="text-xs mt-1" style={{ color: '#A0B3C6' }}>
                    Final amount: <strong className="text-white">₹2,500</strong>
                  </p>
                  <p className="text-xs mt-1 flex items-center gap-1" style={{ color: '#A0B3C6' }}>
                    Thank you for choosing our service! <Heart className="w-3 h-3" style={{ color: '#ef4444' }} />
                  </p>
                  <p className="text-[10px] mt-2 text-right flex items-center justify-end gap-1" style={{ color: '#6B7C93' }}>2:30 PM <CheckCircle2 className="w-3 h-3" style={{ color: '#26C666' }} /></p>
                </div>
              </div>
            </div>
            <p className="text-center text-xs mt-4 font-medium flex items-center justify-center gap-1.5" style={{ color: '#6B7C93' }}>
              <ArrowRight className="w-3 h-3 rotate-[-90deg]" /> This message is sent automatically when you update the job status
            </p>
          </div>
        </div>
      </section>

      {/* ═══ FEATURES ═══ */}
      <section id="features" className="py-20 md:py-28" style={{ background: '#061A2E' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div ref={useReveal()} className="landing-fade-up text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-extrabold mb-4">
              Everything you need to<br /><span className="landing-gradient-text">run your repair shop</span>
            </h2>
            <p style={{ color: '#A0B3C6' }}>Simple tools that save hours every day.</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Smartphone, title: 'Job Tracking', desc: 'Track every repair from intake to delivery with unique job IDs and full history.' },
              { icon: MessageSquare, title: 'Auto WhatsApp Updates', desc: 'Customers get instant WhatsApp messages when you update job status.' },
              { icon: BarChart3, title: 'Simple Dashboard', desc: 'See active jobs, completed today, and revenue at a glance.' },
              { icon: RefreshCw, title: 'Status Management', desc: '9 status stages from Received to Delivered. Each change auto-notifies.' },
              { icon: Shield, title: 'Secure & Private', desc: 'Your data is encrypted and isolated. Each shop gets its own workspace.' },
              { icon: Zap, title: 'Instant Setup', desc: 'Connect WhatsApp in 30 seconds with a pairing code. No QR needed.' },
              { icon: Clock, title: 'Save 2+ Hours/Day', desc: 'No more manual messages or phone calls. Full automation.' },
              { icon: Star, title: 'Customer Satisfaction', desc: 'Proactive updates mean happier customers and more referrals.' },
            ].map((item, i) => (
              <div key={i} ref={useReveal((i % 4) * 100)} className="landing-fade-up landing-card group landing-card-hover">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4 transition-all group-hover:scale-110 group-hover:rotate-6" style={{ background: 'rgba(38,198,102,0.1)', color: '#26C666' }}>
                  <item.icon className="w-6 h-6" />
                </div>
                <h3 className="font-bold mb-2">{item.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: '#A0B3C6' }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ PRICING ═══ */}
      <section id="pricing" className="py-20 md:py-28 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div ref={useReveal()} className="landing-fade-up text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-extrabold mb-4">
              Simple, transparent <span className="landing-gradient-text">pricing</span>
            </h2>
            <p className="mb-8" style={{ color: '#A0B3C6' }}>Less than one repair profit. Start today.</p>

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
            {[
              { key: 'starter', name: 'Starter', desc: 'Perfect for small shops', popular: false, features: ['1 WhatsApp Number', 'Job Tracking System', 'Auto Status Updates', 'Basic Dashboard', '~300-500 msgs/day'] },
              { key: 'business', name: 'Business', desc: 'For growing shops', popular: true, features: ['Everything in Starter', 'Faster Processing', 'Priority Support', 'More job handling', '~800-1000 msgs/day'] },
              { key: 'advanced', name: 'Advanced', desc: 'High volume shops', popular: false, features: ['Everything in Business', 'High Performance', 'Priority Queue', 'Large job volume', '~1500+ msgs/day'] },
            ].map((plan, i) => (
              <div key={i} ref={useReveal(i * 150)} className={`landing-fade-up landing-card ${plan.popular ? 'landing-popular' : ''} landing-card-hover`}>
                <div className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: plan.popular ? '#26C666' : '#6B7C93' }}>{plan.name}</div>
                <p className="text-xs mb-4" style={{ color: '#6B7C93' }}>{plan.desc}</p>
                <div className="flex items-baseline gap-1 mb-1">
                  <span className="text-4xl font-extrabold">₹{getPrice(plan.key)}</span>
                  <span className="text-sm font-medium" style={{ color: '#6B7C93' }}>{cycleLabel[billingCycle]}</span>
                </div>
                <div className="text-xs mb-6" style={{ color: '#26C666' }}>₹{getMonthly(plan.key)}/mo effective • Setup: ₹{pricing[plan.key].setup}</div>
                <div className="landing-divider mb-6"></div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((f, j) => (
                    <li key={j} className="flex items-center gap-3 text-sm" style={{ color: '#A0B3C6' }}>
                      <Check className="w-4 h-4 shrink-0" style={{ color: '#26C666' }} /> {f}
                    </li>
                  ))}
                </ul>
                <a href={WA_TRIAL_URL} target="_blank" rel="noopener noreferrer" className={`${plan.popular ? 'landing-btn-primary' : 'landing-btn-secondary'} w-full justify-center text-sm`}>
                  {plan.popular ? 'Start Free Trial' : 'Get Started'}
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ CTA ═══ */}
      <section className="py-20 md:py-28 relative overflow-hidden" style={{ background: '#061A2E' }}>
        <div className="landing-hero-grid opacity-20"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full blur-3xl" style={{ background: 'radial-gradient(circle, rgba(38,198,102,0.08), transparent 70%)' }}></div>
        <div ref={useReveal()} className="landing-fade-up max-w-3xl mx-auto text-center px-4 relative z-10">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6" style={{ background: 'rgba(38,198,102,0.15)' }}><Rocket className="w-8 h-8" style={{ color: '#26C666' }} /></div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold mb-6">
            Ready to <span className="landing-gradient-text">automate</span> your<br />customer updates?
          </h2>
          <p className="text-lg mb-10" style={{ color: '#A0B3C6' }}>
            Start for just ₹199/month — less than one repair profit.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href={WA_TRIAL_URL} target="_blank" rel="noopener noreferrer" className="landing-btn-primary text-lg !py-4 !px-10">
              <Zap className="w-5 h-5" /> Start Free Trial
            </a>
            <a href={WA_TRIAL_URL} target="_blank" rel="noopener noreferrer" className="landing-btn-secondary text-lg !py-4 !px-10">
              <WAIcon /> Chat With Us
            </a>
          </div>
        </div>
      </section>

      {/* ═══ FOOTER ═══ */}
      <footer className="py-12 border-t" style={{ borderColor: '#1E3A5F', background: '#031019' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-10">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <img src="/images/logo.png" alt="RepairTrack" className="w-8 h-8 rounded-lg" onError={(e) => { e.target.style.display = 'none'; }} />
                <span className="font-bold text-lg">Repair<span className="landing-gradient-text">Track</span></span>
              </div>
              <p className="text-sm leading-relaxed" style={{ color: '#6B7C93' }}>
                India's smartest repair shop management platform. Automate customer updates and grow your business.
              </p>
            </div>
            <div>
              <h4 className="font-bold text-sm mb-4" style={{ color: '#A0B3C6' }}>Product</h4>
              <ul className="space-y-2.5 text-sm" style={{ color: '#6B7C93' }}>
                <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#pricing" className="hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#how-it-works" className="hover:text-white transition-colors">How It Works</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-sm mb-4" style={{ color: '#A0B3C6' }}>Contact</h4>
              <ul className="space-y-2.5 text-sm" style={{ color: '#6B7C93' }}>
                <li className="flex items-center gap-2"><Phone className="w-4 h-4" style={{ color: '#26C666' }} /> +91 88079 48403</li>
                <li className="flex items-center gap-2"><Mail className="w-4 h-4" style={{ color: '#26C666' }} /> support@menoval.com</li>
              </ul>
            </div>
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
              <img src="/images/menoval-logo.png" alt="Menoval Technology Solutions" className="h-20 w-50" onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'inline'; }} />
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
