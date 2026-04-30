"use client";

import { useEffect, useState, useRef } from "react";
import {
  Sparkles, 
  PlayCircle, 
  Star, 
  CheckCircle2, 
  AlertCircle, 
  Settings, 
  Mic, 
  TrendingUp, 
  BrainCircuit, 
  Zap, 
  Volume2, 
  BarChart3, 
  Database, 
  LayoutDashboard,
  Check,
  Globe,
  X as XIcon,
  Briefcase,
  Code2
} from "lucide-react";
import { HeroCTA } from "@/components/hero-cta";
import { LandingNavbarActions } from "@/components/landing-navbar-actions";
import { PlanBadge } from "@/components/plan-badge";
import { appRoutes } from "@/lib/app-routes";
import { useRouter } from "next/navigation";
import { useSubscriptionStatus } from "@/hooks/use-subscription-status";
import { GlobalNavbar } from "@/components/layout/GlobalNavbar";

export default function LandingPage() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">("monthly");
  const [activeDemo, setActiveDemo] = useState<"technical" | "behavioral" | "hr">("technical");
  const typingAnswerRef = useRef<HTMLDivElement>(null);
  const demoAnswerRef = useRef<HTMLDivElement>(null);
  const cursorRef = useRef<HTMLDivElement>(null);
  const mockupSidebarRef = useRef<HTMLDivElement>(null);

  const mockupPool = [
    {
      label: "Technical Interview",
      question: "Walk us through a high-probability setup where you leveraged SMC and ICT methodologies—specifically liquidity grabs and FVGs—to confirm directional bias and secure an OTE.",
      feedback: {
        score: "8.5/10",
        items: [
          { type: "positive", text: "Excellent depth on liquidity sweep identification and multi-timeframe alignment." },
          { type: "negative", text: "Consider mentioning risk-to-reward parameters for a more complete answer." },
        ]
      },
      answer: "I establish a draw on liquidity using H4/D1 timeframes. Following a liquidity sweep, I look for a Market Structure Shift (MSS) with displacement on the M15. The entry is then optimized within the 62%-79% retracement leg, targeting the next logical liquidity pool."
    },
    {
      label: "System Design",
      question: "How would you design a real-time analytics system that handles 100k events per second with sub-second latency?",
      feedback: {
        score: "9.1/10",
        items: [
          { type: "positive", text: "Strong understanding of stream processing and partitioning strategies." },
          { type: "negative", text: "Could expand more on data retention and archival policies." },
        ]
      },
      answer: "I would use a distributed message queue like Kafka for ingestion, followed by a stream processing engine like Flink for real-time aggregation. For storage, a Time-Series Database like ClickHouse or Druid would handle the high-write volume and provide fast OLAP queries."
    },
    {
      label: "Behavioral",
      question: "Tell me about a time you had to deliver a critical project under an extremely tight deadline with limited resources.",
      feedback: {
        score: "8.9/10",
        items: [
          { type: "positive", text: "Great use of the STAR method and focus on prioritization." },
          { type: "negative", text: "Try to quantify the impact of the final delivery more clearly." },
        ]
      },
      answer: "During a major product launch, our lead backend dev fell ill. I stepped in to bridge the gap, identified the 'must-have' features, and implemented a phased rollout strategy. We met the deadline by focusing on core functionality and deferring non-critical UI polish."
    }
  ];

  const [mockupIndex, setMockupIndex] = useState(0);

  useEffect(() => {
    setMockupIndex(Math.floor(Math.random() * mockupPool.length));
  }, []);

  const activeMockup = mockupPool[mockupIndex];

  const landingData = {
    brand: {
      name: "MockMate",
      tagline: "Ace Every Interview. With AI That Knows You.",
      description: "Personalized mock interviews for any role, any level. Real feedback. Real improvement. Land the job you deserve.",
      status: "All systems operational",
    },
    navigation: {
      links: [
        { label: "Features", href: "#features" },
        { label: "How It Works", href: "#how-it-works" },
        { label: "Pricing", href: "#pricing" },
        { label: "Testimonials", href: "#testimonials" },
      ],
    },
    hero: {
      eyebrow: "Powered by Gemini AI",
      title: {
        part1: "Ace Every Interview.",
        gradient: "With AI That",
        part2: "Knows You.",
      },
      description: "Personalized mock interviews for any role, any level. Real feedback. Real improvement. Land the job you deserve.",
      ctas: [
        { label: "Watch Demo", href: "#how-it-works", primary: false, icon: <PlayCircle size={18} /> },
      ],
      socialProof: {
        trustedBy: "Trusted by 12,000+ candidates",
        rating: "4.9/5",
      }
    },
    mockup: {
      label: "Ongoing Interview",
      question: activeMockup.question,
      feedback: {
        label: "AI Feedback",
        score: activeMockup.feedback.score,
        items: activeMockup.feedback.items
      },
      demos: {
        technical: {
          label: "Trading Strategy",
          question: "How do you confirm directional bias and identify high-probability OTEs using SMC methodologies?",
          answer: "I establish a draw on liquidity using H4/D1 timeframes. Following a liquidity sweep, I look for a Market Structure Shift (MSS) with displacement on the M15. The entry is then optimized within the 62%-79% retracement leg, targeting the next logical liquidity pool.",
          score: "9.2/10"
        },
        behavioral: {
          label: "Behavioral Interview",
          question: "Tell me about a time you had a conflict with a teammate.",
          answer: "I once disagreed with a senior dev about a database schema change. I scheduled a quick sync, brought data to support my approach, but ultimately listened to their concerns about maintenance cost...",
          score: "8.8/10"
        },
        hr: {
          label: "HR Interview",
          question: "Where do you see yourself in five years?",
          answer: "I want to have mastered the technical stack here and be mentoring junior engineers, while potentially moving into a technical leadership role where I can influence architectural decisions...",
          score: "9.5/10"
        }
      }
    },
    howItWorks: {
      label: "The Process",
      steps: [
        { 
          number: "01", 
          icon: <Settings size={48} />, 
          title: "Set Your Stage", 
          description: "Choose your target role, industry, and experience level to customize your session." 
        },
        { 
          number: "02", 
          icon: <Mic size={48} />, 
          title: "Face the AI", 
          description: "Engage in a live conversation with our Gemini-powered AI that adapts to your answers." 
        },
        { 
          number: "03", 
          icon: <TrendingUp size={48} />, 
          title: "Level Up", 
          description: "Receive instant, detailed feedback with scoring and ideal answer suggestions." 
        },
      ]
    },
    features: {
      title: "Engineered for Excellence",
      items: [
        { 
          title: "AI Question Engine", 
          description: "Gemini AI generates role-specific questions that adapt to your experience level in real-time.",
          icon: <BrainCircuit size={32} />,
          large: true
        },
        { 
          title: "Adaptive Difficulty", 
          description: "Challenges that grow with you.",
          icon: <Zap size={32} />
        },
        { 
          title: "Voice Mode", 
          description: "Natural speech interaction.",
          icon: <Volume2 size={32} />
        },
        { 
          title: "Detailed Feedback", 
          description: "Comprehensive breakdown of your performance across clarity, accuracy, and depth.",
          icon: <BarChart3 size={32} />,
          large: true,
          showMeter: true,
          meterValue: "8.7/10"
        },
        { 
          title: "500+ Questions", 
          description: "Curated from top companies.",
          icon: <Database size={32} />
        },
        { 
          title: "Analytics", 
          description: "Track your growth daily.",
          icon: <LayoutDashboard size={32} />
        },
      ]
    },
    stats: [
      { label: "Interviews Completed", value: "12K+" },
      { label: "Confidence Boost", value: "94%" },
      { label: "Avg Feedback Score", value: "8.7" },
      { label: "Faster Prep", value: "3x" },
    ],
    testimonials: {
      title: "Real candidates. Real results.",
      items: [
        { name: "Josh Doe", role: "Software Engineer → Google", initial: "JD", color: "#6366F1", text: "MockMate's feedback was more detailed than my actual internship feedback at Google. It caught my habit of over-explaining simple concepts." },
        { name: "Sarah Miller", role: "Product Manager → Stripe", initial: "SM", color: "#22D3EE", text: "I failed 6 interviews before MockMate. Got an offer at Stripe within 3 weeks of using the platform daily." },
        { name: "Alex Kim", role: "Frontend Dev → Vercel", initial: "AK", color: "#8B5CF6", text: "The adaptive questions actually challenged me. Generic prep tools never did that. It felt like a real conversation with a senior lead." }
      ]
    },
    pricing: {
      title: "Simple, transparent pricing",
      annualDiscount: "Save 30%",
      plans: [
        {
          name: "Free",
          price: { monthly: "$0", annual: "$0" },
          features: ["3 interviews / month", "Basic feedback", "Community access"],
          cta: "Get Started",
          popular: false
        },
        {
          name: "Pro",
          price: { monthly: "$19", annual: "$159" },
          features: ["Unlimited interviews", "Voice mode", "Resume-based questions", "Full analytics"],
          cta: "Get Pro",
          popular: true
        },
        {
          name: "Team",
          price: { monthly: "$49", annual: "$399" },
          features: ["Everything in Pro", "Team dashboard", "Bulk reports", "Custom roles"],
          cta: "Contact Sales",
          popular: false
        }
      ]
    },
    footer: {
      brandDesc: "Empowering next-generation candidates to ace their dream jobs with Gemini-powered intelligence.",
      sections: [
        {
          title: "Product",
          links: [
            { label: "Features", href: "#features" },
            { label: "How it works", href: "#how-it-works" },
            { label: "Pricing", href: "#pricing" },
            { label: "AI Interviewer", href: "#" },
            { label: "Voice Mode", href: "#" },
          ]
        },
        {
          title: "Resources",
          links: [
            { label: "Documentation", href: "#" },
            { label: "Help Center", href: "#" },
            { label: "Interview Guide", href: "#" },
            { label: "Success Stories", href: "#" },
            { label: "Blog", href: "#" },
          ]
        },
        {
          title: "Company",
          links: [
            { label: "About Us", href: "#" },
            { label: "Careers", href: "#" },
            { label: "Press Kit", href: "#" },
            { label: "Contact", href: "#" },
            { label: "Partner Program", href: "#" },
          ]
        },
        {
          title: "Legal",
          links: [
            { label: "Privacy Policy", href: "#" },
            { label: "Terms of Service", href: "#" },
            { label: "Cookie Policy", href: "#" },
            { label: "Data Security", href: "#" },
          ]
        }
      ],
      socials: [
        { name: "Twitter", href: "#", icon: <XIcon size={18} /> },
        { name: "LinkedIn", href: "#", icon: <Briefcase size={18} /> },
        { name: "GitHub", href: "#", icon: <Code2 size={18} /> },
      ]
    }
  };

  const demoTabs: Array<keyof typeof landingData.mockup.demos> = ["technical", "behavioral", "hr"];

  function startHeroTyping() {
    const text = activeMockup.answer;
    let i = 0;
    if (typingAnswerRef.current && typingAnswerRef.current.innerHTML === "") {
      const type = () => {
        if (i < text.length) {
          if (typingAnswerRef.current) {
            typingAnswerRef.current.innerHTML += text.charAt(i);
          }
          i++;
          setTimeout(type, 30);
        } else if (mockupSidebarRef.current) {
          mockupSidebarRef.current.classList.add("sidebar-visible");
        }
      };
      type();
    }
  }

  useEffect(() => {
    // Navbar scroll effect
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);

    // Custom cursor movement
    const handleMouseMove = (e: MouseEvent) => {
      if (cursorRef.current) {
        cursorRef.current.style.left = `${e.clientX - 10}px`;
        cursorRef.current.style.top = `${e.clientY - 10}px`;
        cursorRef.current.style.opacity = "1";
      }
    };
    document.addEventListener("mousemove", handleMouseMove);

    // Intersection Observer for fade-up animations
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            if (entry.target.classList.contains("hero-visual")) {
              startHeroTyping();
            }
            if (entry.target.classList.contains("stats-grid")) {
              // Stats counting logic would go here if needed as actual state
            }
          }
        });
      },
      { threshold: 0.1 }
    );

    document.querySelectorAll(".fade-up").forEach((el) => observer.observe(el));

    return () => {
      window.removeEventListener("scroll", handleScroll);
      document.removeEventListener("mousemove", handleMouseMove);
      observer.disconnect();
    };
  }, []);

  const handleTabSwitch = (type: "technical" | "behavioral" | "hr") => {
    setActiveDemo(type);
    if (demoAnswerRef.current) {
      demoAnswerRef.current.innerHTML = "";
      const text = landingData.mockup.demos[type].answer;
      let i = 0;
      const typeText = () => {
        if (i < text.length) {
          if (demoAnswerRef.current) {
            demoAnswerRef.current.innerHTML += text.charAt(i);
          }
          i++;
          setTimeout(typeText, 20);
        }
      };
      typeText();
    }
  };

  return (
    <div className="landing-wrapper">
      <div className="bg-mesh"></div>
      <div className="bg-grid"></div>
      <div className="bg-noise"></div>
      <div className="cursor-follower" ref={cursorRef}></div>

      <GlobalNavbar isScrolled={isScrolled} />

      <main>
        <section className="container hero">
          <div className="eyebrow fade-up">
            <Sparkles size={14} />
            {landingData.hero.eyebrow}
          </div>

          <h1 className="fade-up">
            {landingData.hero.title.part1}<br />
            <span className="text-gradient">{landingData.hero.title.gradient}</span><br />
            {landingData.hero.title.part2}
          </h1>

          <p className="fade-up">
            {landingData.hero.description}
          </p>

          <div className="hero-ctas fade-up">
            <HeroCTA />
            {landingData.hero.ctas.map((cta) => (
              <a key={cta.label} href={cta.href} className={`btn ${cta.primary ? "btn-primary" : "btn-secondary"}`}>
                {cta.label} {cta.icon}
              </a>
            ))}
          </div>

          <div className="social-proof fade-up">
            <div className="avatar-group">
              <div className="avatar" style={{ background: "#6366F1" }}>JS</div>
              <div className="avatar" style={{ background: "#8B5CF6" }}>MK</div>
              <div className="avatar" style={{ background: "#22D3EE" }}>AL</div>
              <div className="avatar" style={{ background: "#EC4899" }}>TR</div>
              <div className="avatar" style={{ background: "#F59E0B" }}>+</div>
            </div>
            <div className="proof-text">
              {landingData.hero.socialProof.trustedBy}
              <span className="rating">
                <Star size={12} fill="currentColor" />
                <Star size={12} fill="currentColor" />
                <Star size={12} fill="currentColor" />
                <Star size={12} fill="currentColor" />
                <Star size={12} fill="currentColor" />
              </span>
              ({landingData.hero.socialProof.rating})
            </div>
          </div>

          <div className="hero-visual fade-up">
            <div className="mockup-glow"></div>
            <div className="mockup-card glass">
              <div className="mockup-content">
                <span className="mockup-label">{landingData.mockup.label}</span>
                <h3 className="mockup-question">&ldquo;{landingData.mockup.question}&rdquo;</h3>
                <div className="mockup-answer" ref={typingAnswerRef}></div>
              </div>
              <div className="mockup-sidebar glass feedback-panel" ref={mockupSidebarRef}>
                <span className="mockup-label">{landingData.mockup.feedback.label}</span>
                <div className="score-badge">{landingData.mockup.feedback.score}</div>
                {landingData.mockup.feedback.items.map((item, idx) => (
                  <div key={idx} className={`feedback-item ${item.type}`}>
                    {item.type === 'positive' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                    <p>{item.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="how-it-works" className="container section process-section">
          <span className="process-label fade-up">{landingData.howItWorks.label}</span>
          <div className="process-grid">
            {landingData.howItWorks.steps.map((step, idx) => (
              <div key={idx} className="process-card glass fade-up">
                <div className="step-number">{step.number}</div>
                {step.icon}
                <h3>{step.title}</h3>
                <p>{step.description}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="features" className="container section features-section">
          <h2 className="fade-up">{landingData.features.title}</h2>
          <div className="bento-grid">
            {landingData.features.items.map((feature, idx) => (
              <div key={idx} className={`bento-card glass fade-up ${feature.large ? 'bento-large' : ''}`}>
                {feature.icon}
                <div>
                  <h3>{feature.title}</h3>
                  <p>{feature.description}</p>
                  {feature.showMeter && (
                    <div className="meter-container">
                      <div className="meter-circle">
                        <div className="meter-progress"></div>
                        <span className="meter-value">{feature.meterValue}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="section demo-section">
          <div className="container">
            <span className="process-label fade-up">See It In Action</span>
            <div className="demo-tabs fade-up">
              {demoTabs.map((key) => (
                <button 
                  key={key}
                  className={`tab-btn ${activeDemo === key ? "active" : ""}`} 
                  onClick={() => handleTabSwitch(key)}
                >
                  {landingData.mockup.demos[key].label.split(" ")[0]}
                </button>
              ))}
            </div>
            <div className="demo-container fade-up">
              <div className="demo-visual-card glass">
                <div className="mockup-content">
                  <span className="mockup-label">{landingData.mockup.demos[activeDemo].label}</span>
                  <h3 className="mockup-question">&ldquo;{landingData.mockup.demos[activeDemo].question}&rdquo;</h3>
                  <div className="mockup-answer" ref={demoAnswerRef}></div>
                </div>
              </div>
              <div className="demo-info">
                <div className="feedback-panel sidebar-visible glass" style={{ opacity: 1, transform: "none" }}>
                  <span className="mockup-label">AI Analysis</span>
                  <div className="score-badge">{landingData.mockup.demos[activeDemo].score}</div>
                  <p className="text-muted">Our AI identifies key architectural gaps in milliseconds, providing actionable advice for your next interview.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="section stats-section">
          <div className="container stats-grid">
            {landingData.stats.map((stat, idx) => (
              <div key={idx} className="stat-item fade-up">
                <h2 className="counter">{stat.value}</h2>
                <p>{stat.label}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="testimonials" className="container section">
          <h2 className="fade-up" style={{ textAlign: "center", marginBottom: "4rem" }}>{landingData.testimonials.title}</h2>
          <div className="testimonials-grid">
            {landingData.testimonials.items.map((t, idx) => (
              <div key={idx} className="testimonial-card glass fade-up">
                <div className="avatar-box" style={{ background: t.color }}>{t.initial}</div>
                <p className="testimonial-content">&ldquo;{t.text}&rdquo;</p>
                <div className="testimonial-author">
                  <div className="author-info">
                    <h4>{t.name}</h4>
                    <p>{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section id="pricing" className="container section pricing-section">
          <h2 className="fade-up">{landingData.pricing.title}</h2>
          <div className="toggle-container fade-up">
            <span>Monthly</span>
            <div 
              className={`toggle-switch ${billingCycle === "annual" ? "active" : ""}`} 
              onClick={() => setBillingCycle(billingCycle === "monthly" ? "annual" : "monthly")}
            >
              <div className="toggle-slider"></div>
            </div>
            <span>Annual <span style={{ color: "var(--success-green)", fontSize: "0.75rem" }}>({landingData.pricing.annualDiscount})</span></span>
          </div>
          <div className="pricing-grid">
            {landingData.pricing.plans.map((plan, idx) => (
              <div key={idx} className={`pricing-card glass fade-up ${plan.popular ? 'popular' : ''}`}>
                {plan.popular && <span className="popular-badge">MOST POPULAR</span>}
                <h3>{plan.name}</h3>
                <div className="price">
                  {billingCycle === "monthly" ? plan.price.monthly : plan.price.annual}
                  <span>/{billingCycle === "monthly" ? "mo" : "yr"}</span>
                </div>
                <ul className="pricing-features">
                  {plan.features.map((feature, fIdx) => (
                    <li key={fIdx}><Check size={18} /> {feature}</li>
                  ))}
                </ul>
                <a href={appRoutes.dashboard} className={`btn ${plan.popular ? 'btn-primary' : 'btn-secondary'}`} style={{ width: "100%", justifyContent: "center" }}>
                  {plan.cta}
                </a>
              </div>
            ))}
          </div>
        </section>

        <section className="final-cta">
          <div className="container">
            <h2 className="fade-up">{landingData.brand.tagline}</h2>
            <p className="fade-up text-muted" style={{ marginBottom: "3rem", fontSize: "1.25rem" }}>{landingData.brand.description}</p>
            <HeroCTA className="fade-up" />
          </div>
        </section>
      </main>

      <footer>
        <div className="container">
          <div className="footer-grid">
            <div className="footer-brand-section">
              <a href="#" className="logo font-heading">
                <Sparkles size={24} />
                {landingData.brand.name}
              </a>
              <p className="brand-desc">{landingData.footer.brandDesc}</p>
              <div className="status-indicator">
                <div className="status-dot"></div>
                <span>{landingData.brand.status}</span>
              </div>
            </div>
            
            {landingData.footer.sections.map((section, idx) => (
              <div key={idx} className="footer-col">
                <h5>{section.title}</h5>
                <ul>
                  {section.links.map((link, lIdx) => (
                    <li key={lIdx}>
                      <a href={link.href}>{link.label}</a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="footer-bottom">
            <div className="footer-bottom-left">
              <p>© {new Date().getFullYear()} {landingData.brand.name} AI. All rights reserved.</p>
              <div className="footer-legal-inline">
                <a href="#">Privacy</a>
                <span className="dot-sep"></span>
                <a href="#">Terms</a>
                <span className="dot-sep"></span>
                <a href="#">Cookies</a>
              </div>
            </div>
            
            <div className="footer-bottom-right">
              <div className="social-links">
                {landingData.footer.socials.map((social, sIdx) => (
                  <a key={sIdx} href={social.href} className="social-icon" aria-label={social.name}>
                    {social.icon}
                  </a>
                ))}
              </div>
              <div className="language-selector">
                <Globe size={16} />
                <span>English (US)</span>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
