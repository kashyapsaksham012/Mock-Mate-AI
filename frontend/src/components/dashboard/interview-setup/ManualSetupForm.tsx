"use client";

import { motion } from "framer-motion";
import { User, Target, Brain, Settings, PenTool, Rocket, Save, Plus, X, ChevronRight } from "lucide-react";
import { useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { type ResumeAutofillData } from "@/types/resume";
import { type InterviewGenerateRequest } from "@/types/interview";

const formConfig = {
  levels: ["Intern", "Junior", "Mid", "Sr"],
  difficulties: ["Easy", "Medium", "Hard"],
  durations: ["15 mins", "30 mins", "45 mins", "60 mins"],
  experienceOptions: ["0-2 years", "2-5 years", "5+ years", "10+ years"],
};

type ManualSetupFormProps = {
  resumeData: ResumeAutofillData;
  hasResumeData: boolean;
  onStartInterview: (payload: InterviewGenerateRequest) => Promise<any>;
  isGeneratingInterview: boolean;
};

export function ManualSetupForm({
  resumeData,
  hasResumeData,
  onStartInterview,
  isGeneratingInterview,
}: ManualSetupFormProps) {
  const router = useRouter();
  const [fullName, setFullName] = useState(() => resumeData.fullName || "");
  const [email, setEmail] = useState(() => resumeData.email || "");
  const [currentRole, setCurrentRole] = useState(() => resumeData.currentRole || "");
  const [experience, setExperience] = useState(() => resumeData.experience || "");
  const [desiredRole, setDesiredRole] = useState(() => resumeData.targetRole || "");
  const [targetCompanyType, setTargetCompanyType] = useState(() => resumeData.companyType || "");
  const [primaryDomain, setPrimaryDomain] = useState(() => resumeData.primaryDomain || "");
  const [techStack, setTechStack] = useState<string[]>(() => resumeData.skills || []);
  const [newSkill, setNewSkill] = useState("");
  const [selectedLevel, setSelectedLevel] = useState("");
  const [difficulty, setDifficulty] = useState(() => resumeData.lastDifficulty || "Medium");
  const [interviewType, setInterviewType] = useState("Technical");
  const [duration, setDuration] = useState("");
  const [focusAreas, setFocusAreas] = useState<string[]>(() => resumeData.focusAreas || []);
  const [newFocusArea, setNewFocusArea] = useState("");
  const [activeFocus, setActiveFocus] = useState<string[]>(() => resumeData.deepDiveTopics || []);
  const [additionalInstructions, setAdditionalInstructions] = useState(() => resumeData.notes || "");

  const toggleFocus = (area: string) => {
    setActiveFocus((prev) =>
      prev.includes(area) ? prev.filter((focusArea) => focusArea !== area) : [...prev, area],
    );
  };

  const addFocusArea = () => {
    if (newFocusArea && !focusAreas.includes(newFocusArea)) {
      setFocusAreas([...focusAreas, newFocusArea]);
      setActiveFocus([...activeFocus, newFocusArea]);
      setNewFocusArea('');
    }
  };

  const removeFocusArea = (area: string) => {
    setFocusAreas(focusAreas.filter((focusArea) => focusArea !== area));
    setActiveFocus(activeFocus.filter((focusArea) => focusArea !== area));
  };

  const addSkill = () => {
    if (newSkill && !techStack.includes(newSkill)) {
      setTechStack([...techStack, newSkill]);
      setNewSkill('');
    }
  };

  const removeSkill = (skill: string) => {
    setTechStack(techStack.filter((existingSkill) => existingSkill !== skill));
  };

  const handleStartInterview = async () => {
    // Dynamic Validation Check
    const requiredFields = {
      "Full Name": fullName,
      "Email": email,
      "Experience": experience,
      "Desired Role": desiredRole,
      "Job Level": selectedLevel,
      "Target Company Type": targetCompanyType,
      "Primary Domain": primaryDomain,
      "Difficulty": difficulty,
      "Interview Type": interviewType,
      "Duration": duration,
    };

    const missingFields = Object.entries(requiredFields)
      .filter(([_, value]) => !value || (Array.isArray(value) && value.length === 0))
      .map(([name]) => name);

    if (missingFields.length > 0) {
      toast.error(`Please complete all fields: ${missingFields.join(", ")}`, {
        style: { borderRadius: '16px', background: '#1a1a1a', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' }
      });
      return;
    }

    if (techStack.length === 0) {
      toast.error("Please add at least one skill to your Tech Stack.", {
        style: { borderRadius: '16px', background: '#1a1a1a', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' }
      });
      return;
    }

    try {
      const response = await onStartInterview({
        fullName,
        email,
        currentRole,
        experience,
        skills: techStack,
        primaryDomain,
        targetRole: desiredRole,
        jobLevel: selectedLevel,
        companyType: targetCompanyType,
        focusAreas: focusAreas,
        deepDiveTopics: activeFocus,
        notes: additionalInstructions,
        difficulty,
        interviewType,
        duration,
      });
      
      // Store the full response (questions + sessionId)
      if (response) {
        const dataToStore = { ...response, duration: response.duration || duration };
        sessionStorage.setItem("current_interview_data", JSON.stringify(dataToStore));
        router.push("/dashboard/interview");
      } else {
        throw new Error("No interview data received");
      }
    } catch (error) {
      console.error("Failed to start interview", error);
    }
  };


  return (
    <div className="space-y-[60px]">
      {hasResumeData ? (
        <div className="premium-card border-accent-primary/20 bg-accent-primary/5 px-5 py-4 text-sm text-text-muted">
          Resume parsed successfully. Review the autofilled fields before starting the session.
        </div>
      ) : null}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-[32px]">
        <div className="premium-card">
          <SectionHeader icon={<User size={18} />} title="Basic Profile" color="text-accent-primary" />
          <div className="space-y-6 mt-8">
            <InputField label="Full Name" placeholder="John Doe" value={fullName} onChange={setFullName} />
            <InputField label="Email Address" placeholder="john@example.com" type="email" value={email} onChange={setEmail} />
            <div className="grid grid-cols-2 gap-4">
              <InputField label="Current Role" placeholder="Software Engineer" value={currentRole} onChange={setCurrentRole} />
              <div className="premium-input-group">
                <label className="premium-label">Experience</label>
                <div className="relative group">
                  <select
                    className="premium-input w-full appearance-none pr-10"
                    value={experience}
                    onChange={(e) => setExperience(e.target.value)}
                  >
                    <option value="">Select Experience</option>
                    {formConfig.experienceOptions.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-text-muted">
                    <ChevronRight size={14} className="rotate-90" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="premium-card">
          <SectionHeader icon={<Target size={18} />} title="Interview Target" color="text-accent-highlight" />
          <div className="space-y-6 mt-8">
            <InputField label="Desired Role" placeholder="Senior Product Engineer" value={desiredRole} onChange={setDesiredRole} />
            <div className="premium-input-group">
              <label className="premium-label">Job Level</label>
              <div className="pill-selector">
                {formConfig.levels.map((level) => (
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
            <InputField label="Target Company Type" placeholder="Stripe, FAANG, Early Startup..." value={targetCompanyType} onChange={setTargetCompanyType} />
          </div>
        </div>

        <div className="premium-card">
          <SectionHeader icon={<Brain size={18} />} title="Skills & Domain" color="text-accent-secondary" />
          <div className="space-y-8 mt-8">
            <InputField label="Primary Domain" placeholder="Full-Stack Web Development" value={primaryDomain} onChange={setPrimaryDomain} />
            <div className="premium-input-group">
              <label className="premium-label">Tech Stack</label>
              <div className="flex flex-wrap gap-2 mb-4 p-3 rounded-2xl bg-white/[0.02] border border-white/5 min-h-[56px]">
                {techStack.length > 0 ? techStack.map((skill) => (
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
                )) : <span className="text-sm text-text-muted px-1 py-2">No skills parsed yet.</span>}
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

        <div className="premium-card">
          <SectionHeader icon={<Settings size={18} />} title="Session Preferences" color="text-accent-highlight" />
          <div className="space-y-8 mt-8">
            <div className="premium-input-group">
              <label className="premium-label">Difficulty Level</label>
              <div className="pill-selector">
                {formConfig.difficulties.map((d) => (
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
                  {formConfig.durations.map((d) => (
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
                  {["Technical", "Behavioral"].map((type) => (
                    <div
                      key={type}
                      onClick={() => setInterviewType(type)}
                      className={`pill-item ${interviewType === type ? 'active' : ''}`}
                    >
                      {type}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="premium-card">
        <SectionHeader icon={<PenTool size={18} />} title="Focus Areas & Notes" color="text-accent-secondary" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mt-8">
          <div className="space-y-6">
            <label className="premium-label">Deep Dive Topics</label>
            <div className="flex flex-wrap gap-3">
              {focusAreas.map((area) => (
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
              value={additionalInstructions}
              onChange={(e) => setAdditionalInstructions(e.target.value)}
              placeholder="Any specific projects or topics you'd like us to focus on?"
            />
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row items-center justify-center gap-6 mt-[120px] mb-20">
        <button
          className="w-full md:w-auto min-w-[320px] btn-premium-primary h-[64px] text-lg flex items-center justify-center gap-4 group px-12 disabled:opacity-60 disabled:cursor-not-allowed"
          onClick={() => void handleStartInterview()}
          disabled={isGeneratingInterview}
        >
          <Rocket className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform duration-300" />
          {isGeneratingInterview ? 'GENERATING INTERVIEW...' : 'START INTERVIEW SESSION'}
          <ChevronRight size={20} className="opacity-40 group-hover:translate-x-1 transition-transform" />
        </button>
        <button className="w-full md:w-auto min-w-[200px] h-[64px] rounded-full border border-white/10 bg-white/5 font-bold text-text-muted hover:text-white hover:bg-white/10 transition-all flex items-center justify-center gap-3 px-10">
          <Save size={18} />
          Save Draft
        </button>
      </div>

      <div className="footer-divider" />

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

function SectionHeader({ icon, title, color }: { icon: ReactNode; title: string; color: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className={`w-10 h-10 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center ${color} shadow-inner`}>
        {icon}
      </div>
      <h3 className="font-heading text-lg tracking-tight uppercase" style={{ fontSize: '1rem', letterSpacing: '0.05em' }}>{title}</h3>
    </div>
  );
}

function InputField({
  label,
  placeholder,
  value,
  onChange,
  type = 'text',
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
}) {
  return (
    <div className="premium-input-group">
      <label className="premium-label">{label}</label>
      <input type={type} placeholder={placeholder} className="premium-input" value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}
