"use client";

import React, { useEffect, useState, useRef } from "react";
import { 
  Sparkles, 
  ArrowRight, 
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
  Check
} from "lucide-react";

export default function LandingPage() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">("monthly");
  const [activeDemo, setActiveDemo] = useState<"technical" | "behavioral" | "hr">("technical");
  const typingAnswerRef = useRef<HTMLDivElement>(null);
  const demoAnswerRef = useRef<HTMLDivElement>(null);
  const cursorRef = useRef<HTMLDivElement>(null);
  const mockupSidebarRef = useRef<HTMLDivElement>(null);

  const demoData = {
    technical: {
      label: "Technical Interview",
      question: "How do you handle race conditions in a distributed system?",
      answer: "I would implement distributed locking using a tool like Redis (Redlock) or use optimistic locking with versioning in the database. Additionally, ensuring idempotency in event processing...",
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
  };

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

  const startHeroTyping = () => {
    const text = "To architect a scalable microservices system, I would first focus on decoupling services using an event-driven architecture with a message broker like Kafka. I'd then implement a service mesh for secure inter-service communication...";
    let i = 0;
    if (typingAnswerRef.current && typingAnswerRef.current.innerHTML === "") {
      const type = () => {
        if (i < text.length) {
          if (typingAnswerRef.current) {
            typingAnswerRef.current.innerHTML += text.charAt(i);
          }
          i++;
          setTimeout(type, 30);
        } else {
          if (mockupSidebarRef.current) {
            mockupSidebarRef.current.classList.add("sidebar-visible");
          }
        }
      };
      type();
    }
  };

  const handleTabSwitch = (type: "technical" | "behavioral" | "hr") => {
    setActiveDemo(type);
    if (demoAnswerRef.current) {
      demoAnswerRef.current.innerHTML = "";
      const text = demoData[type].answer;
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

      <header className={`navbar ${isScrolled ? "scrolled" : ""}`}>
        <div className="container nav-container">
          <a href="#" className="logo font-heading">
            <Sparkles size={24} />
            MockMate
          </a>
          
          <nav className="nav-links">
            <a href="#features" className="nav-link">Features</a>
            <a href="#how-it-works" className="nav-link">How It Works</a>
            <a href="#pricing" className="nav-link">Pricing</a>
            <a href="#testimonials" className="nav-link">Testimonials</a>
          </nav>

          <div className="nav-actions">
            <a href="#" className="btn btn-ghost">Sign In</a>
            <a href="#" className="btn btn-primary">Start Free</a>
          </div>
        </div>
      </header>

      <main>
        <section className="container hero">
          <div className="eyebrow fade-up">
            <Sparkles size={14} />
            Powered by Gemini AI
          </div>

          <h1 className="fade-up">
            Ace Every Interview.<br />
            <span className="text-gradient">With AI That</span><br />
            Knows You.
          </h1>

          <p className="fade-up">
            Personalized mock interviews for any role, any level. Real feedback. Real improvement. Land the job you deserve.
          </p>

          <div className="hero-ctas fade-up">
            <a href="#" className="btn btn-primary">
              Start Your Free Interview <ArrowRight size={18} />
            </a>
            <a href="#" className="btn btn-secondary">
              Watch Demo <PlayCircle size={18} />
            </a>
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
              Trusted by 12,000+ candidates
              <span className="rating">
                <Star size={12} fill="currentColor" />
                <Star size={12} fill="currentColor" />
                <Star size={12} fill="currentColor" />
                <Star size={12} fill="currentColor" />
                <Star size={12} fill="currentColor" />
              </span>
              (4.9/5)
            </div>
          </div>

          <div className="hero-visual fade-up">
            <div className="mockup-glow"></div>
            <div className="mockup-card glass">
              <div className="mockup-content">
                <span className="mockup-label">Ongoing Interview</span>
                <h3 className="mockup-question">"Explain how you'd architect a scalable microservices system"</h3>
                <div className="mockup-answer" ref={typingAnswerRef}></div>
              </div>
              <div className="mockup-sidebar glass feedback-panel" ref={mockupSidebarRef}>
                <span className="mockup-label">AI Feedback</span>
                <div className="score-badge">8.5/10</div>
                <div className="feedback-item positive">
                  <CheckCircle2 size={16} />
                  <p>Excellent depth on container orchestration and service mesh patterns.</p>
                </div>
                <div className="feedback-item negative">
                  <AlertCircle size={16} />
                  <p>Consider mentioning circuit breakers for better fault tolerance.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="how-it-works" className="container section process-section">
          <span className="process-label fade-up">The Process</span>
          <div className="process-grid">
            <div className="process-card glass fade-up">
              <div className="step-number">01</div>
              <Settings size={48} />
              <h3>Set Your Stage</h3>
              <p>Choose your target role, industry, and experience level to customize your session.</p>
            </div>
            <div className="process-card glass fade-up">
              <div className="step-number">02</div>
              <Mic size={48} />
              <h3>Face the AI</h3>
              <p>Engage in a live conversation with our Gemini-powered AI that adapts to your answers.</p>
            </div>
            <div className="process-card glass fade-up">
              <div className="step-number">03</div>
              <TrendingUp size={48} />
              <h3>Level Up</h3>
              <p>Receive instant, detailed feedback with scoring and ideal answer suggestions.</p>
            </div>
          </div>
        </section>

        <section id="features" className="container section features-section">
          <h2 className="fade-up">Engineered for Excellence</h2>
          <div className="bento-grid">
            <div className="bento-card bento-large glass fade-up">
              <BrainCircuit size={32} />
              <div>
                <h3>AI Question Engine</h3>
                <p>Gemini AI generates role-specific questions that adapt to your experience level in real-time.</p>
              </div>
            </div>
            <div className="bento-card glass fade-up">
              <Zap size={32} />
              <h3>Adaptive Difficulty</h3>
              <p>Challenges that grow with you.</p>
            </div>
            <div className="bento-card glass fade-up">
              <Volume2 size={32} />
              <h3>Voice Mode</h3>
              <p>Natural speech interaction.</p>
            </div>
            <div className="bento-card bento-large glass fade-up">
              <BarChart3 size={32} />
              <div>
                <h3>Detailed Feedback</h3>
                <p>Comprehensive breakdown of your performance across clarity, accuracy, and depth.</p>
                <div className="meter-container">
                  <div className="meter-circle">
                    <div className="meter-progress"></div>
                    <span className="meter-value">8.7/10</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="bento-card glass fade-up">
              <Database size={32} />
              <h3>500+ Questions</h3>
              <p>Curated from top companies.</p>
            </div>
            <div className="bento-card glass fade-up">
              <LayoutDashboard size={32} />
              <h3>Analytics</h3>
              <p>Track your growth daily.</p>
            </div>
          </div>
        </section>

        <section className="section demo-section">
          <div className="container">
            <span className="process-label fade-up">See It In Action</span>
            <div className="demo-tabs fade-up">
              <button 
                className={`tab-btn ${activeDemo === "technical" ? "active" : ""}`} 
                onClick={() => handleTabSwitch("technical")}
              >
                Technical
              </button>
              <button 
                className={`tab-btn ${activeDemo === "behavioral" ? "active" : ""}`} 
                onClick={() => handleTabSwitch("behavioral")}
              >
                Behavioral
              </button>
              <button 
                className={`tab-btn ${activeDemo === "hr" ? "active" : ""}`} 
                onClick={() => handleTabSwitch("hr")}
              >
                HR
              </button>
            </div>
            <div className="demo-container fade-up">
              <div className="demo-visual-card glass">
                <div className="mockup-content">
                  <span className="mockup-label">{demoData[activeDemo].label}</span>
                  <h3 className="mockup-question">"{demoData[activeDemo].question}"</h3>
                  <div className="mockup-answer" ref={demoAnswerRef}></div>
                </div>
              </div>
              <div className="demo-info">
                <div className="feedback-panel sidebar-visible glass" style={{ opacity: 1, transform: "none" }}>
                  <span className="mockup-label">AI Analysis</span>
                  <div className="score-badge">{demoData[activeDemo].score}</div>
                  <p className="text-muted">Our AI identifies key architectural gaps in milliseconds, providing actionable advice for your next interview.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="section stats-section">
          <div className="container stats-grid">
            <div className="stat-item fade-up">
              <h2 className="counter">12K+</h2>
              <p>Interviews Completed</p>
            </div>
            <div className="stat-item fade-up">
              <h2 className="counter">94%</h2>
              <p>Confidence Boost</p>
            </div>
            <div className="stat-item fade-up">
              <h2 className="counter">8.7</h2>
              <p>Avg Feedback Score</p>
            </div>
            <div className="stat-item fade-up">
              <h2 className="counter">3x</h2>
              <p>Faster Prep</p>
            </div>
          </div>
        </section>

        <section id="testimonials" className="container section">
          <h2 className="fade-up" style={{ textAlign: "center", marginBottom: "4rem" }}>Real candidates. Real results.</h2>
          <div className="testimonials-grid">
            {[
              { name: "Josh Doe", role: "Software Engineer → Google", initial: "JD", color: "#6366F1", text: "MockMate's feedback was more detailed than my actual internship feedback at Google. It caught my habit of over-explaining simple concepts." },
              { name: "Sarah Miller", role: "Product Manager → Stripe", initial: "SM", color: "#22D3EE", text: "I failed 6 interviews before MockMate. Got an offer at Stripe within 3 weeks of using the platform daily." },
              { name: "Alex Kim", role: "Frontend Dev → Vercel", initial: "AK", color: "#8B5CF6", text: "The adaptive questions actually challenged me. Generic prep tools never did that. It felt like a real conversation with a senior lead." }
            ].map((t, idx) => (
              <div key={idx} className="testimonial-card glass fade-up">
                <div className="avatar-box" style={{ background: t.color }}>{t.initial}</div>
                <p className="testimonial-content">"{t.text}"</p>
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
          <h2 className="fade-up">Simple, transparent pricing</h2>
          <div className="toggle-container fade-up">
            <span>Monthly</span>
            <div 
              className={`toggle-switch ${billingCycle === "annual" ? "active" : ""}`} 
              onClick={() => setBillingCycle(billingCycle === "monthly" ? "annual" : "monthly")}
            >
              <div className="toggle-slider"></div>
            </div>
            <span>Annual <span style={{ color: "var(--success-green)", fontSize: "0.75rem" }}>(Save 30%)</span></span>
          </div>
          <div className="pricing-grid">
            <div className="pricing-card glass fade-up">
              <h3>Free</h3>
              <div className="price">$0<span>/mo</span></div>
              <ul className="pricing-features">
                <li><Check size={18} /> 3 interviews / month</li>
                <li><Check size={18} /> Basic feedback</li>
                <li><Check size={18} /> Community access</li>
              </ul>
              <a href="#" className="btn btn-secondary" style={{ width: "100%", justifyContent: "center" }}>Get Started</a>
            </div>
            <div className="pricing-card glass popular fade-up">
              <span className="popular-badge">MOST POPULAR</span>
              <h3>Pro</h3>
              <div className="price">
                {billingCycle === "monthly" ? "$19" : "$159"}
                <span>/{billingCycle === "monthly" ? "mo" : "yr"}</span>
              </div>
              <ul className="pricing-features">
                <li><Check size={18} /> Unlimited interviews</li>
                <li><Check size={18} /> Voice mode</li>
                <li><Check size={18} /> Resume-based questions</li>
                <li><Check size={18} /> Full analytics</li>
              </ul>
              <a href="#" className="btn btn-primary" style={{ width: "100%", justifyContent: "center" }}>Get Pro</a>
            </div>
            <div className="pricing-card glass fade-up">
              <h3>Team</h3>
              <div className="price">
                {billingCycle === "monthly" ? "$49" : "$399"}
                <span>/{billingCycle === "monthly" ? "mo" : "yr"}</span>
              </div>
              <ul className="pricing-features">
                <li><Check size={18} /> Everything in Pro</li>
                <li><Check size={18} /> Team dashboard</li>
                <li><Check size={18} /> Bulk reports</li>
                <li><Check size={18} /> Custom roles</li>
              </ul>
              <a href="#" className="btn btn-secondary" style={{ width: "100%", justifyContent: "center" }}>Contact Sales</a>
            </div>
          </div>
        </section>

        <section className="final-cta">
          <div className="container">
            <h2 className="fade-up">Your dream job is one interview away.</h2>
            <p className="fade-up text-muted" style={{ marginBottom: "3rem", fontSize: "1.25rem" }}>Start for free. No credit card required.</p>
            <a href="#" className="btn btn-primary fade-up" style={{ margin: "0 auto" }}>
              Begin Your Mock Interview <ArrowRight size={18} />
            </a>
          </div>
        </section>
      </main>

      <footer>
        <div className="container">
          <div className="footer-grid">
            <div className="footer-logo-side">
              <a href="#" className="logo font-heading">
                <Sparkles size={24} />
                MockMate
              </a>
              <p>Built for the next generation of top performers.</p>
            </div>
            <div className="footer-col">
              <h5>Product</h5>
              <ul>
                <li><a href="#">Features</a></li>
                <li><a href="#">How it works</a></li>
                <li><a href="#">Pricing</a></li>
              </ul>
            </div>
            <div className="footer-col">
              <h5>Company</h5>
              <ul>
                <li><a href="#">About</a></li>
                <li><a href="#">Careers</a></li>
                <li><a href="#">Blog</a></li>
              </ul>
            </div>
            <div className="footer-col">
              <h5>Resources</h5>
              <ul>
                <li><a href="#">Docs</a></li>
                <li><a href="#">Help Center</a></li>
                <li><a href="#">Community</a></li>
              </ul>
            </div>
            <div className="footer-col">
              <h5>Legal</h5>
              <ul>
                <li><a href="#">Privacy</a></li>
                <li><a href="#">Terms</a></li>
              </ul>
            </div>
          </div>
          <div className="footer-bottom">
            <p>© 2025 MockMate AI. All rights reserved.</p>
            <div style={{ display: "flex", gap: "2rem" }}>
              <a href="#">Twitter</a>
              <a href="#">LinkedIn</a>
              <a href="#">GitHub</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
