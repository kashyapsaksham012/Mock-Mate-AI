"use client";

import { motion } from "framer-motion";
import { User, Target, Brain, Settings, PenTool, Rocket, Save, Plus, X, ChevronRight } from "lucide-react";
import { useState } from "react";

const formConfig = {
  levels: ["Intern", "Junior", "Mid", "Sr"],
  difficulties: ["Easy", "Medium", "Hard"],
  durations: ["15 mins", "30 mins", "45 mins", "60 mins"],
  focusAreas: ["System Design", "Algorithms", "Leadership", "React", "Node.js", "Python"],
  experienceOptions: ["Select Experience", "0-2 years", "2-5 years", "5+ years", "10+ years"],
};

export function ManualSetupForm() {
  const [techStack, setTechStack] = useState(["React", "Tailwind"]);
  const [newSkill, setNewSkill] = useState("");
  const [selectedLevel, setSelectedLevel] = useState("Junior");
  const [difficulty, setDifficulty] = useState("Medium");
  const [interviewType, setInterviewType] = useState("Technical");
  const [duration, setDuration] = useState("30 mins");
  const [focusAreas, setFocusAreas] = useState(formConfig.focusAreas);
  const [newFocusArea, setNewFocusArea] = useState("");
  const [activeFocus, setActiveFocus] = useState<string[]>(["Algorithms"]);

  const toggleFocus = (area: string) => {
    setActiveFocus(prev => 
      prev.includes(area) ? prev.filter(a => a !== area) : [...prev, area]
    );
  };

  const addFocusArea = () => {
    if (newFocusArea && !focusAreas.includes(newFocusArea)) {
      setFocusAreas([...focusAreas, newFocusArea]);
      setActiveFocus([...activeFocus, newFocusArea]);
      setNewFocusArea("");
    }
  };

  const removeFocusArea = (area: string) => {
    // Only allow removing if it's not part of the original suggestions or always allow? 
    // Let's allow removing any to keep it flexible.
    setFocusAreas(focusAreas.filter(a => a !== area));
    setActiveFocus(activeFocus.filter(a => a !== area));
  };

  const addSkill = () => {
    if (newSkill && !techStack.includes(newSkill)) {
      setTechStack([...techStack, newSkill]);
      setNewSkill("");
    }
  };

  const removeSkill = (skill: string) => {
    setTechStack(techStack.filter(s => s !== skill));
  };

  return (
    <div className="space-y-[60px]">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-[32px]">
        {/* Basic Info */}
        <div className="premium-card">
          <SectionHeader icon={<User size={18} />} title="Basic Profile" color="text-accent-primary" />
          <div className="space-y-6 mt-8">
            <InputField label="Full Name" placeholder="John Doe" />
            <InputField label="Email Address" placeholder="john@example.com" type="email" />
            <div className="grid grid-cols-2 gap-4">
              <InputField label="Current Role" placeholder="Software Engineer" />
              <div className="premium-input-group">
                <label className="premium-label">Experience</label>
                <div className="relative group">
                  <select className="premium-input w-full appearance-none pr-10">
                    {formConfig.experienceOptions.map(opt => <option key={opt}>{opt}</option>)}
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-text-muted">
                    <ChevronRight size={14} className="rotate-90" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Interview Target */}
        <div className="premium-card">
          <SectionHeader icon={<Target size={18} />} title="Interview Target" color="text-accent-highlight" />
          <div className="space-y-6 mt-8">
            <InputField label="Desired Role" placeholder="Senior Product Engineer" />
            <div className="premium-input-group">
              <label className="premium-label">Job Level</label>
              <div className="pill-selector">
                {formConfig.levels.map(level => (
                  <div 
                    key={level} 
                    onClick={() => setSelectedLevel(level)}
                    className={`pill-item ${selectedLevel === level ? 'active' : ''}`}
                  >
                    {level}
                  </div>
                ))}
              </div>
            </div>
            <InputField label="Target Company Type" placeholder="Stripe, FAANG, Early Startup..." />
          </div>
        </div>

        {/* Skills & Domain */}
        <div className="premium-card">
          <SectionHeader icon={<Brain size={18} />} title="Skills & Domain" color="text-accent-secondary" />
          <div className="space-y-8 mt-8">
            <InputField label="Primary Domain" placeholder="Full-Stack Web Development" />
            <div className="premium-input-group">
              <label className="premium-label">Tech Stack</label>
              <div className="flex flex-wrap gap-2 mb-4 p-3 rounded-2xl bg-white/[0.02] border border-white/5 min-h-[56px]">
                {techStack.map(skill => (
                  <motion.span 
                    layout
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    key={skill} 
                    className="premium-tag"
                  >
                    {skill}
                    <button onClick={() => removeSkill(skill)} className="hover:text-white transition-colors">
                      <X size={12} />
                    </button>
                  </motion.span>
                ))}
              </div>
              <div className="flex gap-2">
                <input 
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addSkill()}
                  type="text" 
                  placeholder="Add a technology..." 
                  className="premium-input flex-1" 
                />
                <button onClick={addSkill} className="w-[56px] h-[56px] flex items-center justify-center rounded-xl bg-accent-primary/10 border border-accent-primary/20 text-accent-primary hover:bg-accent-primary hover:text-white transition-all">
                  <Plus size={20} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Preferences */}
        <div className="premium-card">
          <SectionHeader icon={<Settings size={18} />} title="Session Preferences" color="text-accent-highlight" />
          <div className="space-y-8 mt-8">
            <div className="premium-input-group">
              <label className="premium-label">Difficulty Level</label>
              <div className="pill-selector">
                {formConfig.difficulties.map(d => (
                  <div 
                    key={d} 
                    onClick={() => setDifficulty(d)}
                    className={`pill-item ${difficulty === d ? 'active' : ''}`}
                  >
                    {d}
                  </div>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="premium-input-group">
                <label className="premium-label">Duration</label>
                <div className="pill-selector">
                  {formConfig.durations.map(d => (
                    <div 
                      key={d} 
                      onClick={() => setDuration(d)}
                      className={`pill-item ${duration === d ? 'active' : ''}`}
                      style={{ fontSize: '11px', padding: '10px 8px' }}
                    >
                      {d}
                    </div>
                  ))}
                </div>
              </div>
              <div className="premium-input-group">
                <label className="premium-label">Interview Type</label>
                <div className="pill-selector">
                  {["Technical", "Behavioral"].map(t => (
                    <div 
                      key={t} 
                      onClick={() => setInterviewType(t)}
                      className={`pill-item ${interviewType === t ? 'active' : ''}`}
                    >
                      {t}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Focus Areas & Footer */}
      <div className="premium-card">
        <SectionHeader icon={<PenTool size={18} />} title="Focus Areas & Notes" color="text-accent-secondary" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mt-8">
          <div className="space-y-6">
            <label className="premium-label">Deep Dive Topics</label>
            <div className="flex flex-wrap gap-3">
              {focusAreas.map(area => (
                <div key={area} className="relative group/focus">
                  <label className="check-pill">
                    <input 
                      type="checkbox" 
                      className="hidden" 
                      checked={activeFocus.includes(area)}
                      onChange={() => toggleFocus(area)}
                    />
                    <div className="px-4 py-2 rounded-xl border border-white/10 bg-white/5 text-sm font-medium text-text-muted transition-all hover:border-accent-primary/30 flex items-center gap-2">
                      {area}
                      <button 
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); removeFocusArea(area); }}
                        className="hover:text-red-400 opacity-0 group-hover/focus:opacity-100 transition-opacity"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  </label>
                </div>
              ))}
            </div>
            
            <div className="flex gap-2 pt-2">
              <input 
                value={newFocusArea}
                onChange={(e) => setNewFocusArea(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addFocusArea()}
                type="text" 
                placeholder="Add focus area (e.g. System Design)" 
                className="premium-input flex-1 h-[48px]" 
              />
              <button 
                onClick={addFocusArea} 
                className="w-[48px] h-[48px] flex items-center justify-center rounded-xl bg-accent-secondary/10 border border-accent-secondary/20 text-accent-secondary hover:bg-accent-secondary hover:text-white transition-all"
              >
                <Plus size={18} />
              </button>
            </div>
          </div>
          <div className="premium-input-group">
            <label className="premium-label">Additional Instructions</label>
            <textarea 
              rows={5} 
              className="premium-input h-auto py-4 resize-none" 
              placeholder="Any specific projects or topics you'd like us to focus on?"
            />
          </div>
        </div>
      </div>

      {/* Action Buttons Section */}
      <div className="flex flex-col md:flex-row items-center justify-center gap-6 mt-[120px] mb-20">
        <button className="w-full md:w-auto min-w-[320px] btn-premium-primary h-[64px] text-lg flex items-center justify-center gap-4 group px-12">
          <Rocket className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform duration-300" />
          START INTERVIEW SESSION
          <ChevronRight size={20} className="opacity-40 group-hover:translate-x-1 transition-transform" />
        </button>
        <button className="w-full md:w-auto min-w-[200px] h-[64px] rounded-full border border-white/10 bg-white/5 font-bold text-text-muted hover:text-white hover:bg-white/10 transition-all flex items-center justify-center gap-3 px-10">
          <Save size={18} />
          Save Draft
        </button>
      </div>

      <div className="footer-divider" />

      {/* Refined Global Footer */}
      <footer className="premium-footer">
        <div className="premium-footer-content">
          <div className="premium-footer-links">
            <a href="#" className="hover:text-white transition-colors">MockMate AI</a>
            <a href="#" className="hover:text-white transition-colors">Privacy</a>
            <a href="#" className="hover:text-white transition-colors">Terms</a>
            <a href="#" className="hover:text-white transition-colors">Help</a>
            <a href="#" className="hover:text-white transition-colors">Feedback</a>
          </div>
          <p className="premium-footer-copy">
            © 2026 MockMate AI. All rights reserved. Powered by industry-leading AI models. 
            Your session data is encrypted and used only for real-time interview generation.
          </p>
        </div>
      </footer>
    </div>
  );
}

function SectionHeader({ icon, title, color }: { icon: React.ReactNode, title: string, color: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className={`w-10 h-10 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center ${color} shadow-inner`}>
        {icon}
      </div>
      <h3 className="font-heading text-lg tracking-tight uppercase" style={{ fontSize: '1rem', letterSpacing: '0.05em' }}>{title}</h3>
    </div>
  );
}

function InputField({ label, placeholder, type = "text" }: { label: string, placeholder: string, type?: string }) {
  return (
    <div className="premium-input-group">
      <label className="premium-label">{label}</label>
      <input type={type} placeholder={placeholder} className="premium-input" />
    </div>
  );
}
