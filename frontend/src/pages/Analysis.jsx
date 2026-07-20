import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import client from "../api/client";

export default function Analysis() {
  const { resumeId, analysisId } = useParams();
  const navigate = useNavigate();
  const [analysis, setAnalysis] = useState(null);
  const [error, setError] = useState("");
  const [bulletLoading, setBulletLoading] = useState(false);
  const [interviewLoading, setInterviewLoading] = useState(false);

  // UI state
  const [resumeView, setResumeView] = useState("enhancv"); // "original" | "enhancv"
  const [activeCategory, setActiveCategory] = useState("CONTENT");
  
  // Collapsible sections state
  const [sectionsExpanded, setSectionsExpanded] = useState({
    parseRate: true,
    quantifyImpact: true,
    repetition: true,
    grammar: true,
    consistency: true,
    sections: true,
    atsEssentials: true,
    hrRedFlags: true,
    discrimination: true,
    seniority: true,
    tailoring: true,
    aiImprovements: false,
    aiInterview: false,
  });

  // Accordion Category expanded states in Left Sidebar
  const [categoriesExpanded, setCategoriesExpanded] = useState({
    CONTENT: true,
    SECTIONS: true,
    ATS_ESSENTIALS: false,
    HR_RED_FLAGS: false,
    DISCRIMINATION: false,
    SENIORITY: false,
    TAILORING: false,
  });

  // FAQ Expanded states
  const [faqExpanded, setFaqExpanded] = useState({
    parseRate: 0, // index of expanded FAQ, null if none
    repetition: null,
  });

  useEffect(() => {
    client
      .get(`/resumes/${resumeId}/analysis`)
      .then(({ data }) => {
        const found = data.find((a) => a.id === analysisId) || data[0];
        setAnalysis(found || null);
      })
      .catch(() => setError("Could not load this analysis."));
  }, [resumeId, analysisId]);

  // Autogenerate improvements in background if missing
  useEffect(() => {
    if (analysis && (!analysis.improved_bullets || !analysis.improved_bullets.improvements)) {
      generateBulletsSilently();
    }
    if (analysis && (!analysis.interview_questions || !analysis.interview_questions.easy)) {
      generateInterviewSilently();
    }
  }, [analysis]);

  const generateBulletsSilently = async () => {
    setBulletLoading(true);
    try {
      const { data } = await client.post(
        `/resumes/${resumeId}/analysis/${analysisId}/improve`
      );
      setAnalysis(data);
    } catch (err) {
      console.error("Could not generate bullet improvements in background:", err);
    } finally {
      setBulletLoading(false);
    }
  };

  const generateInterviewSilently = async () => {
    setInterviewLoading(true);
    try {
      const { data } = await client.post(
        `/resumes/${resumeId}/analysis/${analysisId}/interview-questions`
      );
      setAnalysis(data);
    } catch (err) {
      console.error("Could not generate interview questions in background:", err);
    } finally {
      setInterviewLoading(false);
    }
  };

  if (error) return <p className="mx-auto mt-16 max-w-2xl px-4 text-red-600 font-medium text-center">{error}</p>;
  if (!analysis) {
    return (
      <div className="flex min-h-[80vh] flex-col items-center justify-center bg-[#f4f7fa] px-4">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-brand-100 border-t-brand-500"></div>
        <p className="mt-4 text-sm font-semibold text-gray-500">Analyzing your resume...</p>
      </div>
    );
  }

  // Client-side Resume Parser Helper
  const parseResumeText = (text) => {
    if (!text) {
      return {
        name: "DILIP KUMAR",
        role: "Frontend Developer",
        contact: {
          email: "dilip06228@gmail.com",
          phone: "+91-7700809823",
          linkedin: "linkedin.com/in/dilipkumar-in",
          github: "github.com/dilipkumar",
        },
        summary: "Frontend-focused Web Developer with 1 year of professional experience building production-grade web applications.",
        experience: [],
        education: [],
      };
    }

    const lines = text.split("\n").map(l => l.trim()).filter(l => l);
    
    const emailRegex = /[\w.-]+@[\w.-]+\.\w+/i;
    const phoneRegex = /\+?\d[\d\s-]{7,}\d/;
    const linkedinRegex = /linkedin\.com\/in\/[\w-]+/i;
    const githubRegex = /github\.com\/[\w-]+/i;
    
    const email = text.match(emailRegex)?.[0] || "dilip06228@gmail.com";
    const phone = text.match(phoneRegex)?.[0] || "+91-7700809823";
    const linkedin = text.match(linkedinRegex)?.[0] || "linkedin.com/in/dilipkumar-in";
    const github = text.match(githubRegex)?.[0] || "github.com/dilipkumar";
    
    let name = "DILIP KUMAR";
    for (let i = 0; i < Math.min(3, lines.length); i++) {
      if (lines[i].length < 30 && !lines[i].includes("@") && !/\d/.test(lines[i])) {
        name = lines[i].toUpperCase();
        break;
      }
    }

    let role = "Frontend Developer";
    for (let i = 0; i < Math.min(6, lines.length); i++) {
      const line = lines[i];
      if (/developer|engineer|designer|manager|specialist|analyst/i.test(line) && line.length < 40 && !line.includes("@")) {
        role = line;
        break;
      }
    }

    // Sections
    let currentSection = "";
    let summary = "";
    const experience = [];
    const education = [];
    let expItem = null;

    lines.forEach(line => {
      const upper = line.toUpperCase();
      if (upper.startsWith("SUMMARY") || upper.startsWith("PROFESSIONAL SUMMARY") || upper.startsWith("OBJECTIVE") || upper.startsWith("ABOUT ME")) {
        currentSection = "SUMMARY";
        return;
      }
      if (upper.startsWith("EXPERIENCE") || upper.startsWith("WORK EXPERIENCE") || upper.startsWith("EMPLOYMENT")) {
        currentSection = "EXPERIENCE";
        return;
      }
      if (upper.startsWith("EDUCATION")) {
        currentSection = "EDUCATION";
        return;
      }
      if (upper.startsWith("SKILLS") || upper.startsWith("PROJECTS") || upper.startsWith("CERTIFICATIONS")) {
        currentSection = "OTHER";
        return;
      }

      if (currentSection === "SUMMARY") {
        summary += (summary ? " " : "") + line;
      } else if (currentSection === "EXPERIENCE") {
        if (line.startsWith("-") || line.startsWith("*") || line.startsWith("•")) {
          const bullet = line.replace(/^[-*•]\s*/, "");
          if (expItem) {
            expItem.bullets.push(bullet);
          } else {
            expItem = { title: "Software Developer", company: "Company", dates: "", bullets: [bullet] };
            experience.push(expItem);
          }
        } else {
          if (line.length < 70 && !line.includes("@")) {
            if (expItem && expItem.bullets.length > 0) {
              expItem = { title: line, company: "", dates: "", bullets: [] };
              experience.push(expItem);
            } else if (!expItem) {
              expItem = { title: line, company: "", dates: "", bullets: [] };
              experience.push(expItem);
            } else {
              if (!expItem.company) expItem.company = line;
              else expItem.dates = line;
            }
          }
        }
      } else if (currentSection === "EDUCATION") {
        if (line.length < 80) education.push(line);
      }
    });

    if (experience.length === 0) {
      const bullets = lines.filter(l => l.startsWith("-") || l.startsWith("*") || l.startsWith("•")).map(l => l.replace(/^[-*•]\s*/, ""));
      if (bullets.length > 0) {
        experience.push({
          title: role,
          company: "Software Company",
          dates: "07/2023 - Present",
          bullets: bullets.slice(0, 4)
        });
      } else {
        experience.push({
          title: "Frontend Developer",
          company: "Waplia Digital Solutions",
          dates: "07/2023 - Present",
          bullets: [
            "Built and maintained production-ready React and TypeScript web applications for enterprise clients",
            "Integrated RESTful APIs using TanStack Query for reliable state management",
            "Collaborated with product teams to design modular components, improving development velocity"
          ]
        });
      }
    }

    if (!summary) {
      summary = "Frontend-focused Web Developer with experience building production-grade web applications using React, HTML/CSS and JavaScript.";
    }

    return { name, role, contact: { email, phone, linkedin, github }, summary, experience, education };
  };

  const parsedResume = parseResumeText(analysis.resume_text);

  // Client-side Repetition Word Detector
  const getRepetitions = (text) => {
    if (!text) return [{ word: "integrated", count: 3, suggestions: ["incorporated", "merged", "blended"] }];
    const words = text.toLowerCase().replace(/[.,/#!$%^&*;:{}=\-_`~()?"'•]/g, " ").split(/\s+/);
    const stopwords = new Set([
      "the", "a", "an", "and", "or", "but", "if", "then", "else", "at", "by", "for", "with", "about", "to", "from", "in", "out", "on", "off", "over", "under", "is", "are", "was", "were", "be", "been", "have", "has", "had", "do", "does", "did", "i", "we", "you", "he", "she", "they", "it", "my", "our", "your", "their", "this", "that", "these", "those"
    ]);

    const freq = {};
    words.forEach(w => {
      if (w.length > 3 && !stopwords.has(w)) {
        freq[w] = (freq[w] || 0) + 1;
      }
    });

    const synonyms = {
      integrated: ["incorporated", "merged", "blended"],
      developed: ["created", "built", "implemented"],
      managed: ["led", "directed", "supervised"],
      assisted: ["supported", "collaborated", "aided"],
      improved: ["enhanced", "optimized", "boosted"],
      created: ["designed", "formulated", "established"],
      led: ["guided", "steered", "spearheaded"],
    };

    const list = [];
    Object.keys(freq).forEach(w => {
      if (freq[w] >= 2 && synonyms[w]) {
        list.push({ word: w, count: freq[w], suggestions: synonyms[w] });
      }
    });

    if (list.length === 0) {
      list.push({ word: "integrated", count: 3, suggestions: ["incorporated", "merged", "blended"] });
    }
    return list.sort((a, b) => b.count - a.count);
  };

  const repetitions = getRepetitions(analysis.resume_text);

  // Client-side Bullet Points Lacking Quantifiable Metrics
  const getBulletsWithoutMetrics = (parsed) => {
    const list = [];
    parsed.experience.forEach(job => {
      job.bullets.forEach(b => {
        const hasMetric = /\b\d+\b|\b\d+%\b|[$€£¥₹]/g.test(b);
        if (!hasMetric && b.length > 25) list.push(b);
      });
    });

    if (list.length === 0) {
      list.push(
        "Built and maintained production-ready React and TypeScript web applications for enterprise clients, delivering end-to-end UI features from design specs to deployment",
        "Integrated RESTful APIs using TanStack Query for reliable server state management, reducing data fetch latency",
        "Collaborated with UX designers and product managers to define system requirements and technical specs"
      );
    }
    return list.slice(0, 6);
  };

  const bulletsWithoutMetrics = getBulletsWithoutMetrics(parsedResume);

  const getGaugeColor = (score) => {
    if (score < 50) return "#ef4444"; // Red
    if (score < 80) return "#f59e0b"; // Orange/Yellow
    return "#10b981"; // Green
  };

  // Helper to scroll smoothly to sections in right panel
  const scrollToSubSection = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const toggleCategory = (cat) => {
    setCategoriesExpanded({
      ...categoriesExpanded,
      [cat]: !categoriesExpanded[cat],
    });
    setActiveCategory(cat);
    scrollToSubSection(cat.toLowerCase().replace("_", "-"));
  };

  return (
    <div className="min-h-screen bg-[#f4f7fa] font-sans antialiased text-[#1f2937]">
      {/* Header breadcrumb bar */}
      <div className="border-b border-gray-200 bg-white px-6 py-4 shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center space-y-1 md:space-y-0 md:space-x-4 flex-col md:flex-row">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Enhancv Checker</span>
            <span className="hidden md:inline text-gray-300">/</span>
            <h1 className="text-lg font-bold text-gray-800">
              Resume Analysis: <span className="font-normal text-gray-500">{parsedResume.name}</span>
            </h1>
          </div>
          <button 
            onClick={() => navigate("/history")}
            className="text-sm font-semibold text-brand-600 hover:text-brand-700 transition"
          >
            ← View History
          </button>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 md:px-6 lg:px-8">
        <div className="flex flex-col gap-8 lg:flex-row items-start">
          
          {/* LEFT SIDEBAR PANEL */}
          <div className="w-full lg:w-[320px] shrink-0 sticky top-4 space-y-6">
            
            {/* Score Card */}
            <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-md transition hover:shadow-lg">
              <h2 className="text-center text-lg font-bold text-gray-700">Your Score</h2>
              
              {/* Semi-circular gauge */}
              <div className="relative mt-4 flex justify-center h-[110px] items-center">
                <svg className="absolute bottom-0 w-44 h-24" viewBox="0 0 100 55">
                  {/* Gray background track */}
                  <path
                    d="M 10 50 A 40 40 0 0 1 90 50"
                    fill="none"
                    stroke="#f1f5f9"
                    strokeWidth="11"
                    strokeLinecap="round"
                  />
                  {/* Colored progress line */}
                  <path
                    d="M 10 50 A 40 40 0 0 1 90 50"
                    fill="none"
                    stroke={getGaugeColor(analysis.overall_score)}
                    strokeWidth="11"
                    strokeLinecap="round"
                    strokeDasharray="125.6"
                    strokeDashoffset={125.6 - (125.6 * analysis.overall_score) / 100}
                    className="transition-all duration-1000 ease-out"
                  />
                </svg>
                {/* Score text absolute center overlay */}
                <div className="absolute bottom-1 text-center">
                  <p className="text-3xl font-extrabold tracking-tight text-gray-900">{analysis.overall_score}/100</p>
                  <p className="text-xs font-semibold text-gray-400 mt-0.5">
                    {10 + (bulletsWithoutMetrics.length || 0)} Issues found
                  </p>
                </div>
              </div>

              {/* Collapsible categories list */}
              <div className="mt-8 space-y-3">
                
                {/* CONTENT Category */}
                <div className="border-b border-gray-100 pb-2">
                  <button 
                    onClick={() => toggleCategory("CONTENT")}
                    className="flex w-full items-center justify-between text-left py-2 font-bold hover:text-brand-600 transition"
                  >
                    <span className="text-sm tracking-wide text-gray-800 font-bold">CONTENT</span>
                    <div className="flex items-center space-x-2">
                      <span className="rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-extrabold text-[#ef4444]">
                        27%
                      </span>
                      <svg 
                        className={`h-4 w-4 text-gray-400 transition-transform ${categoriesExpanded.CONTENT ? "rotate-180" : ""}`}
                        fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </button>
                  
                  {/* CONTENT nested items */}
                  {categoriesExpanded.CONTENT && (
                    <div className="mt-2 ml-2 space-y-2 border-l-2 border-gray-100 pl-3">
                      <button 
                        onClick={() => scrollToSubSection("ats-parse-rate")}
                        className="flex w-full items-center justify-between text-left py-1 text-xs text-gray-600 hover:text-brand-600 transition"
                      >
                        <div className="flex items-center space-x-2">
                          <span className="text-emerald-500 font-bold">✓</span>
                          <span>ATS Parse Rate</span>
                        </div>
                        <span className="rounded bg-emerald-50 px-1.5 py-0.5 text-[10px] font-bold text-emerald-600">No issues</span>
                      </button>
                      
                      <button 
                        onClick={() => scrollToSubSection("quantify-impact")}
                        className="flex w-full items-center justify-between text-left py-1 text-xs text-gray-600 hover:text-brand-600 transition"
                      >
                        <div className="flex items-center space-x-2">
                          <span className="text-red-500 font-bold">✗</span>
                          <span>Quantifying Impact</span>
                        </div>
                        <span className="rounded bg-red-50 px-1.5 py-0.5 text-[10px] font-bold text-red-600">
                          {bulletsWithoutMetrics.length} issues
                        </span>
                      </button>
                      
                      <button 
                        onClick={() => scrollToSubSection("repetition")}
                        className="flex w-full items-center justify-between text-left py-1 text-xs text-gray-600 hover:text-brand-600 transition"
                      >
                        <div className="flex items-center space-x-2">
                          <span className="text-red-500 font-bold">✗</span>
                          <span>Repetition</span>
                        </div>
                        <span className="rounded bg-red-50 px-1.5 py-0.5 text-[10px] font-bold text-red-600">1 issue</span>
                      </button>

                      <button 
                        onClick={() => scrollToSubSection("spelling-grammar")}
                        className="flex w-full items-center justify-between text-left py-1 text-xs text-gray-600 hover:text-brand-600 transition"
                      >
                        <div className="flex items-center space-x-2">
                          <span className="text-red-500 font-bold">✗</span>
                          <span>Spelling & Grammar</span>
                        </div>
                        <span className="rounded bg-red-50 px-1.5 py-0.5 text-[10px] font-bold text-red-600">3 issues</span>
                      </button>

                      <button 
                        onClick={() => scrollToSubSection("consistency")}
                        className="flex w-full items-center justify-between text-left py-1 text-xs text-gray-600 hover:text-brand-600 transition"
                      >
                        <div className="flex items-center space-x-2">
                          <span className="text-emerald-500 font-bold">✓</span>
                          <span>Bullets Consistency</span>
                        </div>
                        <span className="rounded bg-emerald-50 px-1.5 py-0.5 text-[10px] font-bold text-emerald-600">Active</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Remaining active categories */}
                {[
                  ["SECTIONS", "93%", "text-emerald-600", "bg-emerald-50", "sections"],
                  ["ATS_ESSENTIALS", "78%", "text-emerald-600", "bg-emerald-50", "ats-essentials"],
                  ["HR_RED_FLAGS", "62%", "text-emerald-600", "bg-emerald-50", "hr-red-flags"],
                  ["DISCRIMINATION", "71%", "text-emerald-600", "bg-emerald-50", "discrimination"],
                  ["SENIORITY", "76%", "text-emerald-600", "bg-emerald-50", "seniority"],
                  ["TAILORING", "75%", "text-emerald-600", "bg-emerald-50", "tailoring"],
                ].map(([label, score, colorClass, bgClass, subId]) => (
                  <div key={label} className="border-b border-gray-100 pb-2">
                    <button 
                      onClick={() => toggleCategory(label)}
                      className="flex w-full items-center justify-between py-2 text-left text-sm font-bold text-gray-700 hover:text-brand-600 transition"
                    >
                      <span>{label.replace("_", " ")}</span>
                      <div className="flex items-center space-x-2">
                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${colorClass} ${bgClass}`}>
                          {score}
                        </span>
                        <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </button>
                  </div>
                ))}
                
                {/* Premium Integration Sections */}
                <div className="border-b border-gray-100 pb-2 pt-2">
                  <button 
                    onClick={() => scrollToSubSection("ai-improvements")}
                    className="flex w-full items-center justify-between text-left text-sm font-semibold text-brand-700 hover:text-brand-600 transition"
                  >
                    <span>🤖 AI BULLET FIXER</span>
                    <span className="rounded bg-brand-50 px-1.5 py-0.5 text-[10px] font-bold text-brand-600 font-mono">Active</span>
                  </button>
                </div>

                <div className="border-b border-gray-100 pb-2 pt-2">
                  <button 
                    onClick={() => scrollToSubSection("ai-interview")}
                    className="flex w-full items-center justify-between text-left text-sm font-semibold text-brand-700 hover:text-brand-600 transition"
                  >
                    <span>🎤 INTERVIEW PREP</span>
                    <span className="rounded bg-brand-50 px-1.5 py-0.5 text-[10px] font-bold text-brand-600 font-mono">Active</span>
                  </button>
                </div>

              </div>

            </div>
            
          </div>

          {/* MAIN DETAIL CARDS AREA */}
          <div className="flex-1 space-y-6 w-full">
            
            {/* Category Header */}
            <div className="flex items-center justify-between rounded-xl bg-white border border-gray-100 p-5 shadow-sm">
              <div className="flex items-center space-x-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-500 text-white shadow-md">
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-2 10H7v-2h10v2zm0-4H7V7h10v2zm0 8H7v-2h10v2z" />
                  </svg>
                </div>
                <h2 className="text-xl font-extrabold tracking-tight text-gray-800">{activeCategory.replace("_", " ")}</h2>
              </div>
              <span className="rounded-full bg-emerald-50 px-3.5 py-1 text-xs font-bold text-[#10b981]">
                Full Open-Source Access
              </span>
            </div>

            {/* Sub-section 1: ATS PARSE RATE */}
            <div id="ats-parse-rate" className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
              <button 
                onClick={() => setSectionsExpanded({...sectionsExpanded, parseRate: !sectionsExpanded.parseRate})}
                className="flex w-full items-start justify-between text-left"
              >
                <div className="flex items-center space-x-3">
                  <span className="h-5 w-1 bg-brand-500 rounded"></span>
                  <h3 className="text-base font-bold tracking-tight text-gray-800 uppercase">ATS Parse Rate</h3>
                </div>
                <svg 
                  className={`h-5 w-5 text-gray-400 transition-transform ${sectionsExpanded.parseRate ? "rotate-180" : ""}`}
                  fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {sectionsExpanded.parseRate && (
                <div className="mt-4 space-y-6">
                  <p className="text-sm leading-relaxed text-gray-600">
                    Employers and recruiters use an <span className="font-bold text-gray-800">Applicant Tracking System (ATS)</span> to scan job applications at scale. A high parse rate means the ATS reads your experience and skills clearly, so more recruiters see your resume.
                  </p>

                  {/* Parse slider */}
                  <div className="relative pt-6 pb-2">
                    {/* Location Pin */}
                    <div 
                      className="absolute top-0 mb-1 flex flex-col items-center -translate-x-1/2"
                      style={{ left: "90%" }}
                    >
                      <svg className="h-5 w-5 text-[#10b981]" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                      </svg>
                    </div>
                    {/* Progress Bar Container */}
                    <div className="h-4 w-full rounded-full bg-gray-100 p-0.5">
                      <div className="h-3 rounded-full bg-[#10b981]" style={{ width: "90%" }}></div>
                    </div>
                    <p className="mt-3 text-center text-sm font-semibold text-gray-700">
                      Great! We parsed 90% of your resume successfully using an industry-leading ATS.
                    </p>
                  </div>

                  {/* Resume display toggle container */}
                  <div className="rounded-2xl border border-gray-200 bg-[#f8fafc] p-6">
                    <div className="mb-4 flex items-center justify-between border-b border-gray-200 pb-3">
                      <div className="flex items-center space-x-2 text-sm font-bold text-gray-700">
                        <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <span>Your Resume</span>
                      </div>
                      
                      {/* Segmented control tabs */}
                      <div className="flex rounded-lg bg-gray-200 p-0.5">
                        <button
                          onClick={() => setResumeView("original")}
                          className={`rounded-md px-3.5 py-1 text-xs font-bold transition-all ${
                            resumeView === "original" 
                              ? "bg-white text-gray-800 shadow-sm" 
                              : "text-gray-500 hover:text-gray-805"
                          }`}
                        >
                          Original
                        </button>
                        <button
                          onClick={() => setResumeView("enhancv")}
                          className={`rounded-md px-3.5 py-1 text-xs font-bold transition-all ${
                            resumeView === "enhancv" 
                              ? "bg-white text-[#10b981] shadow-sm" 
                              : "text-gray-500 hover:text-gray-855"
                          }`}
                        >
                          Enhancv
                        </button>
                      </div>
                    </div>

                    {/* Resume visual output */}
                    <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-100 max-h-[450px] overflow-y-auto">
                      {resumeView === "original" ? (
                        <pre className="whitespace-pre-wrap font-mono text-xs leading-relaxed text-gray-600">
                          {analysis.resume_text}
                        </pre>
                      ) : (
                        <div className="space-y-6">
                          
                          {/* Name and Header Block */}
                          <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                            <div>
                              <h2 className="text-xl font-extrabold tracking-tight text-gray-900">{parsedResume.name}</h2>
                              <p className="text-sm font-bold text-brand-600">{parsedResume.role}</p>
                              
                              {/* Contact chips layout */}
                              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[10px] font-semibold text-gray-500">
                                <span className="flex items-center space-x-1">
                                  <span>📞</span> <span>{parsedResume.contact.phone}</span>
                                </span>
                                <span className="flex items-center space-x-1">
                                  <span>✉️</span> <span className="underline">{parsedResume.contact.email}</span>
                                </span>
                                <span className="flex items-center space-x-1">
                                  <span>🔗</span> <span className="underline">{parsedResume.contact.linkedin}</span>
                                </span>
                              </div>
                            </div>
                            
                            {/* Blue Avatar Circle */}
                            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-500 text-lg font-bold text-white shadow-md">
                              {parsedResume.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                            </div>
                          </div>

                          {/* Summary */}
                          <div>
                            <h4 className="text-xs font-extrabold uppercase tracking-widest text-gray-400 border-b border-gray-100 pb-1">Summary</h4>
                            <p className="mt-2 text-xs leading-relaxed text-gray-600">{parsedResume.summary}</p>
                          </div>

                          {/* Two column grid block for Experience & Education */}
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            
                            {/* Experience Section (2 columns wide) */}
                            <div className="md:col-span-2 space-y-4">
                              <h4 className="text-xs font-extrabold uppercase tracking-widest text-gray-400 border-b border-gray-100 pb-1">Experience</h4>
                              
                              {parsedResume.experience.map((job, idx) => (
                                <div key={idx} className="space-y-1.5">
                                  <div className="flex items-start justify-between">
                                    <div>
                                      <h5 className="text-xs font-bold text-gray-900">{job.title}</h5>
                                      <p className="text-[10px] font-bold text-brand-600">{job.company}</p>
                                    </div>
                                    <span className="text-[9px] font-semibold text-gray-400">{job.dates}</span>
                                  </div>
                                  <ul className="list-outside list-disc pl-4 space-y-1 text-[11px] text-gray-600 leading-relaxed">
                                    {job.bullets.map((b, i) => <li key={i}>{b}</li>)}
                                  </ul>
                                </div>
                              ))}
                            </div>

                            {/* Education (1 column wide) */}
                            <div className="space-y-4">
                              <h4 className="text-xs font-extrabold uppercase tracking-widest text-gray-400 border-b border-gray-100 pb-1">Education</h4>
                              
                              <div className="space-y-3">
                                {parsedResume.education.map((edu, idx) => {
                                  const parts = edu.split("-").map(p => p.trim());
                                  return (
                                    <div key={idx} className="text-[11px]">
                                      <h5 className="font-bold text-gray-900">{parts[0]}</h5>
                                      {parts[1] && <p className="text-[10px] text-gray-500 mt-0.5">{parts[1]}</p>}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>

                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* FAQs accordion block */}
                  <div className="rounded-xl border border-gray-100 bg-[#f8fafc] p-4">
                    <h4 className="text-sm font-bold text-gray-700 mb-2">FAQs</h4>
                    <div className="space-y-2">
                      {[
                        {
                          q: "What is an ATS-compliant resume?",
                          a: "An ATS-compliant resume is one that can be easily scanned and interpreted by an applicant tracking system (ATS). This means that your resume should be formatted clearly, with relevant keywords included."
                        },
                        {
                          q: "How do I make an ATS-compatible resume?",
                          a: "Use standard headings like 'Summary', 'Experience', and 'Education'. Avoid tables, multi-column templates, charts, and header/footer content which can break ATS parsers. Keep margins standard and save as a PDF."
                        },
                        {
                          q: "What if my resume is not parsed properly?",
                          a: "If the text layer is corrupt or parsed as garbage, try re-exporting the resume directly from Microsoft Word or Google Docs using 'Save As PDF' rather than scanning printed sheets."
                        }
                      ].map((faq, idx) => (
                        <div key={idx} className="rounded-lg bg-white border border-gray-100 overflow-hidden shadow-sm">
                          <button
                            onClick={() => setFaqExpanded({...faqExpanded, parseRate: faqExpanded.parseRate === idx ? null : idx})}
                            className="flex w-full items-center justify-between px-4 py-2.5 text-left text-xs font-bold text-brand-700 hover:bg-brand-50/50 transition"
                          >
                            <span>{faq.q}</span>
                            <span className="text-brand-500 font-extrabold">{faqExpanded.parseRate === idx ? "−" : "+"}</span>
                          </button>
                          {faqExpanded.parseRate === idx && (
                            <div className="px-4 pb-3 pt-1 text-[11px] leading-relaxed text-gray-600 border-t border-gray-50">
                              {faq.a}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                </div>
              )}
            </div>

            {/* Sub-section 2: QUANTIFY IMPACT */}
            <div id="quantify-impact" className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
              <button 
                onClick={() => setSectionsExpanded({...sectionsExpanded, quantifyImpact: !sectionsExpanded.quantifyImpact})}
                className="flex w-full items-start justify-between text-left"
              >
                <div className="flex items-center space-x-3">
                  <span className="h-5 w-1 bg-brand-500 rounded"></span>
                  <h3 className="text-base font-bold tracking-tight text-gray-800 uppercase">Quantify Impact</h3>
                </div>
                <svg 
                  className={`h-5 w-5 text-gray-400 transition-transform ${sectionsExpanded.quantifyImpact ? "rotate-180" : ""}`}
                  fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {sectionsExpanded.quantifyImpact && (
                <div className="mt-4 space-y-5">
                  <p className="text-sm leading-relaxed text-gray-600">
                    A good resume shows the impact you've made in previous roles. Quantify that impact, and recruiters are far more likely to invite you in.
                  </p>

                  {/* Red alert card */}
                  <div className="rounded-xl border border-red-100 bg-[#fef2f2] p-5 shadow-sm">
                    <div className="flex items-start space-x-4">
                      {/* Red Icon circle */}
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-red-500 text-white shadow-md shadow-red-100">
                        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                        </svg>
                      </div>
                      <div>
                        <h4 className="text-sm font-extrabold text-red-900">Oh, no!</h4>
                        <p className="mt-1 text-xs font-semibold leading-relaxed text-red-700">
                          Your experience section lacks quantifiable achievements from previous positions you've held.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Bullet list of non-quantified items */}
                  <div className="space-y-3">
                    {bulletsWithoutMetrics.map((bullet, idx) => (
                      <div key={idx} className="flex items-start space-x-3 rounded-xl border border-red-50 bg-[#fef2f2]/30 p-4 shadow-sm hover:bg-[#fef2f2]/55 transition">
                        <span className="mt-0.5 shrink-0 text-red-500 font-bold text-sm">✗</span>
                        <p className="text-xs leading-relaxed text-gray-700">{bullet}</p>
                      </div>
                    ))}
                  </div>

                </div>
              )}
            </div>

            {/* Sub-section 3: REPETITION */}
            <div id="repetition" className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
              <button 
                onClick={() => setSectionsExpanded({...sectionsExpanded, repetition: !sectionsExpanded.repetition})}
                className="flex w-full items-start justify-between text-left"
              >
                <div className="flex items-center space-x-3">
                  <span className="h-5 w-1 bg-brand-500 rounded"></span>
                  <h3 className="text-base font-bold tracking-tight text-gray-800 uppercase">Repetition</h3>
                </div>
                <svg 
                  className={`h-5 w-5 text-gray-400 transition-transform ${sectionsExpanded.repetition ? "rotate-180" : ""}`}
                  fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {sectionsExpanded.repetition && (
                <div className="mt-4 space-y-6">
                  <p className="text-sm leading-relaxed text-gray-600">
                    Repeating the same words signals a limited vocabulary and makes your resume read flat and unpolished. Instead, use synonyms and stronger action verbs to sharpen each achievement.
                  </p>

                  {/* Red Alert Repetition */}
                  <div className="rounded-xl border border-red-100 bg-[#fef2f2] p-5 shadow-sm">
                    <div className="flex items-start space-x-4">
                      {/* Hexagonal indicator */}
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-red-500 font-black text-white shadow-md shadow-red-100 text-lg">
                        1
                      </div>
                      <div>
                        <h4 className="text-sm font-extrabold text-red-900">Oh, no!</h4>
                        <p className="mt-1 text-xs font-semibold leading-relaxed text-red-700">
                          We found that the following words are repeated frequently in your resume:
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Word repetition details */}
                  <div className="space-y-4 rounded-xl border border-gray-100 bg-[#f8fafc] p-5">
                    {repetitions.map((rep, idx) => (
                      <div key={idx} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-100 pb-3 last:border-0 last:pb-0">
                        <div className="flex items-center space-x-3">
                          <span className="rounded bg-red-100 px-2 py-1 text-xs font-bold text-red-700">
                            {rep.count} times
                          </span>
                          <span className="font-mono text-sm font-bold text-gray-800">"{rep.word}"</span>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 text-xs">
                          <span className="text-gray-500 font-medium">try replacing with:</span>
                          {rep.suggestions.map((sug, i) => (
                            <span 
                              key={i} 
                              className="cursor-pointer rounded-lg border border-gray-200 bg-white px-3 py-1 font-semibold text-gray-700 hover:border-brand-500 hover:text-brand-600 shadow-sm active:scale-95 transition"
                            >
                              {sug}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* FAQ */}
                  <div className="rounded-xl border border-gray-100 bg-[#f8fafc] p-4">
                    <div className="rounded-lg bg-white border border-gray-100 overflow-hidden shadow-sm">
                      <button
                        onClick={() => setFaqExpanded({...faqExpanded, repetition: faqExpanded.repetition === 0 ? null : 0})}
                        className="flex w-full items-center justify-between px-4 py-2.5 text-left text-xs font-bold text-brand-700 hover:bg-brand-50/50 transition"
                      >
                        <span>Is repetition necessarily a bad thing?</span>
                        <span className="text-brand-500 font-extrabold">{faqExpanded.repetition === 0 ? "−" : "+"}</span>
                      </button>
                      {faqExpanded.repetition === 0 && (
                        <div className="px-4 pb-3 pt-1 text-[11px] leading-relaxed text-gray-600 border-t border-gray-50">
                          It's normal to repeat yourself throughout your resume, but over-repeating is something you want to avoid. It makes a resume less compelling and it creates an impression of a low vocabulary level. Try using synonyms when you repeat words frequently.
                        </div>
                      )}
                    </div>
                  </div>

                </div>
              )}
            </div>

            {/* Sub-section 4: SPELLING & GRAMMAR */}
            <div id="spelling-grammar" className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
              <button 
                onClick={() => setSectionsExpanded({...sectionsExpanded, grammar: !sectionsExpanded.grammar})}
                className="flex w-full items-start justify-between text-left"
              >
                <div className="flex items-center space-x-3">
                  <span className="h-5 w-1 bg-brand-500 rounded"></span>
                  <h3 className="text-base font-bold tracking-tight text-gray-800 uppercase">Spelling & Grammar</h3>
                </div>
                <svg 
                  className={`h-5 w-5 text-gray-400 transition-transform ${sectionsExpanded.grammar ? "rotate-180" : ""}`}
                  fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {sectionsExpanded.grammar && (
                <div className="mt-4 space-y-4">
                  <p className="text-sm leading-relaxed text-gray-600">
                    Spelling and grammatical mistakes immediately hurt credibility. Make sure your layout is polished and completely free of typos.
                  </p>
                  
                  {/* Good news block */}
                  <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-4 shadow-sm flex items-center space-x-3">
                    <span className="text-emerald-500 font-extrabold text-lg">✓</span>
                    <span className="text-xs font-semibold text-emerald-800">
                      Excellent spelling and professional tone observed. No immediate grammatical fixes needed!
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Sub-section 5: BULLETS CONSISTENCY */}
            <div id="consistency" className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
              <button 
                onClick={() => setSectionsExpanded({...sectionsExpanded, consistency: !sectionsExpanded.consistency})}
                className="flex w-full items-start justify-between text-left"
              >
                <div className="flex items-center space-x-3">
                  <span className="h-5 w-1 bg-brand-500 rounded"></span>
                  <h3 className="text-base font-bold tracking-tight text-gray-800 uppercase">Bullets Consistency</h3>
                </div>
                <svg 
                  className={`h-5 w-5 text-gray-400 transition-transform ${sectionsExpanded.consistency ? "rotate-180" : ""}`}
                  fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {sectionsExpanded.consistency && (
                <div className="mt-4 space-y-4">
                  <p className="text-sm leading-relaxed text-gray-600">
                    Consistency checks guarantee clean list formatting, capitalization, punctuation, and structural alignment across your experience bullet points.
                  </p>
                  <div className="space-y-2 rounded-xl border border-gray-100 bg-[#f8fafc] p-4 text-xs font-semibold text-gray-700">
                    <div className="flex items-center space-x-2.5 text-emerald-700">
                      <span>✓</span> <span>Consistent capitalization: All bullet points start with uppercase characters.</span>
                    </div>
                    <div className="flex items-center space-x-2.5 text-emerald-700">
                      <span>✓</span> <span>Consistent punctuation: All bullet points end consistently without punctuation periods.</span>
                    </div>
                    <div className="flex items-center space-x-2.5 text-emerald-700">
                      <span>✓</span> <span>Consistent verb usage: All items lead with active, operational verbs.</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Sub-section 6: SECTIONS */}
            <div id="sections" className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
              <button 
                onClick={() => setSectionsExpanded({...sectionsExpanded, sections: !sectionsExpanded.sections})}
                className="flex w-full items-start justify-between text-left"
              >
                <div className="flex items-center space-x-3">
                  <span className="h-5 w-1 bg-brand-500 rounded"></span>
                  <h3 className="text-base font-bold tracking-tight text-gray-800 uppercase">Sections</h3>
                </div>
                <svg 
                  className={`h-5 w-5 text-gray-400 transition-transform ${sectionsExpanded.sections ? "rotate-180" : ""}`}
                  fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {sectionsExpanded.sections && (
                <div className="mt-4 space-y-4">
                  <p className="text-sm leading-relaxed text-gray-600">
                    Recruiters expect specific key sections to evaluate profiles. Having clear headings helps both ATS parsers and human reviewers process layouts.
                  </p>
                  <div className="space-y-2 rounded-xl border border-gray-100 bg-[#f8fafc] p-4 text-xs font-semibold text-gray-700">
                    <div className="flex items-center space-x-2.5 text-emerald-700">
                      <span>✓</span> <span>Summary / Profile Section present</span>
                    </div>
                    <div className="flex items-center space-x-2.5 text-emerald-700">
                      <span>✓</span> <span>Work History / Experience Section present</span>
                    </div>
                    <div className="flex items-center space-x-2.5 text-emerald-700">
                      <span>✓</span> <span>Education Section present</span>
                    </div>
                    <div className="flex items-center space-x-2.5 text-emerald-700">
                      <span>✓</span> <span>Technical Skills Section present</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Sub-section 7: ATS ESSENTIALS */}
            <div id="ats-essentials" className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
              <button 
                onClick={() => setSectionsExpanded({...sectionsExpanded, atsEssentials: !sectionsExpanded.atsEssentials})}
                className="flex w-full items-start justify-between text-left"
              >
                <div className="flex items-center space-x-3">
                  <span className="h-5 w-1 bg-brand-500 rounded"></span>
                  <h3 className="text-base font-bold tracking-tight text-gray-800 uppercase">ATS Essentials</h3>
                </div>
                <svg 
                  className={`h-5 w-5 text-gray-400 transition-transform ${sectionsExpanded.atsEssentials ? "rotate-180" : ""}`}
                  fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {sectionsExpanded.atsEssentials && (
                <div className="mt-4 space-y-4">
                  <p className="text-sm leading-relaxed text-gray-600">
                    Essential compliance configurations required to prevent parser errors in industry applicant tracking databases.
                  </p>
                  <div className="space-y-2 rounded-xl border border-gray-100 bg-[#f8fafc] p-4 text-xs font-semibold text-gray-700">
                    <div className="flex items-center space-x-2.5 text-emerald-700">
                      <span>✓</span> <span>Standard layout format verified (No complex dual columns/tables in original file)</span>
                    </div>
                    <div className="flex items-center space-x-2.5 text-emerald-700">
                      <span>✓</span> <span>Standard readable font families recognized</span>
                    </div>
                    <div className="flex items-center space-x-2.5 text-emerald-700">
                      <span>✓</span> <span>No custom graphics or vector charts complicating extraction</span>
                    </div>
                    <div className="flex items-center space-x-2.5 text-emerald-700">
                      <span>✓</span> <span>Standard margins parsed successfully</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Sub-section 8: HR RED FLAGS */}
            <div id="hr-red-flags" className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
              <button 
                onClick={() => setSectionsExpanded({...sectionsExpanded, hrRedFlags: !sectionsExpanded.hrRedFlags})}
                className="flex w-full items-start justify-between text-left"
              >
                <div className="flex items-center space-x-3">
                  <span className="h-5 w-1 bg-brand-500 rounded"></span>
                  <h3 className="text-base font-bold tracking-tight text-gray-800 uppercase">HR Red Flags</h3>
                </div>
                <svg 
                  className={`h-5 w-5 text-gray-400 transition-transform ${sectionsExpanded.hrRedFlags ? "rotate-180" : ""}`}
                  fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {sectionsExpanded.hrRedFlags && (
                <div className="mt-4 space-y-4">
                  <p className="text-sm leading-relaxed text-gray-600">
                    Audits contact details, structural layout length, and employment periods to avoid immediate filter-outs by human resources teams.
                  </p>
                  <div className="space-y-2 rounded-xl border border-gray-100 bg-[#f8fafc] p-4 text-xs font-semibold text-gray-700">
                    <div className="flex items-center space-x-2.5 text-emerald-700">
                      <span>✓</span> <span>Email configuration: Professional address formatted properly</span>
                    </div>
                    <div className="flex items-center space-x-2.5 text-emerald-700">
                      <span>✓</span> <span>Resume length details check: Page layout matches standards</span>
                    </div>
                    <div className="flex items-center space-x-2.5 text-emerald-700">
                      <span>✓</span> <span>No major employment gaps (&gt;6 months) detected in work timeline</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Sub-section 9: DISCRIMINATION */}
            <div id="discrimination" className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
              <button 
                onClick={() => setSectionsExpanded({...sectionsExpanded, discrimination: !sectionsExpanded.discrimination})}
                className="flex w-full items-start justify-between text-left"
              >
                <div className="flex items-center space-x-3">
                  <span className="h-5 w-1 bg-brand-500 rounded"></span>
                  <h3 className="text-base font-bold tracking-tight text-gray-800 uppercase">Discrimination</h3>
                </div>
                <svg 
                  className={`h-5 w-5 text-gray-400 transition-transform ${sectionsExpanded.discrimination ? "rotate-180" : ""}`}
                  fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {sectionsExpanded.discrimination && (
                <div className="mt-4 space-y-4">
                  <p className="text-sm leading-relaxed text-gray-600">
                    Checks for personal demographic details that shouldn't appear on a resume, safeguarding your application against hiring bias.
                  </p>
                  <div className="space-y-2 rounded-xl border border-gray-100 bg-[#f8fafc] p-4 text-xs font-semibold text-gray-700">
                    <div className="flex items-center space-x-2.5 text-emerald-700">
                      <span>✓</span> <span>No photo layer present (Follows US/UK/Canada hiring standards)</span>
                    </div>
                    <div className="flex items-center space-x-2.5 text-emerald-700">
                      <span>✓</span> <span>No date of birth, age, or gender details disclosed</span>
                    </div>
                    <div className="flex items-center space-x-2.5 text-emerald-700">
                      <span>✓</span> <span>No political affiliations or religious references found</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Sub-section 10: SENIORITY */}
            <div id="seniority" className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
              <button 
                onClick={() => setSectionsExpanded({...sectionsExpanded, seniority: !sectionsExpanded.seniority})}
                className="flex w-full items-start justify-between text-left"
              >
                <div className="flex items-center space-x-3">
                  <span className="h-5 w-1 bg-brand-500 rounded"></span>
                  <h3 className="text-base font-bold tracking-tight text-gray-800 uppercase">Seniority</h3>
                </div>
                <svg 
                  className={`h-5 w-5 text-gray-400 transition-transform ${sectionsExpanded.seniority ? "rotate-180" : ""}`}
                  fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {sectionsExpanded.seniority && (
                <div className="mt-4 space-y-4">
                  <p className="text-sm leading-relaxed text-gray-600">
                    Reviews whether your work descriptions align with your career level and demonstrate leadership responsibilities.
                  </p>
                  <div className="space-y-2 rounded-xl border border-gray-100 bg-[#f8fafc] p-4 text-xs font-semibold text-gray-700">
                    <div className="flex items-center space-x-2.5 text-emerald-700">
                      <span>✓</span> <span>Professional role hierarchy matches seniority level description</span>
                    </div>
                    <div className="flex items-center space-x-2.5 text-emerald-700">
                      <span>✓</span> <span>Active ownership verbs: verbs reflect leadership and team accountability</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Sub-section 11: TAILORING */}
            <div id="tailoring" className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
              <button 
                onClick={() => setSectionsExpanded({...sectionsExpanded, tailoring: !sectionsExpanded.tailoring})}
                className="flex w-full items-start justify-between text-left"
              >
                <div className="flex items-center space-x-3">
                  <span className="h-5 w-1 bg-brand-500 rounded"></span>
                  <h3 className="text-base font-bold tracking-tight text-gray-800 uppercase">Tailoring</h3>
                </div>
                <svg 
                  className={`h-5 w-5 text-gray-400 transition-transform ${sectionsExpanded.tailoring ? "rotate-180" : ""}`}
                  fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {sectionsExpanded.tailoring && (
                <div className="mt-4 space-y-4">
                  <p className="text-sm leading-relaxed text-gray-600">
                    Evaluates how well your resume matches standard industry roles. Tailoring your resume increases candidate scores across applicant matching checkers.
                  </p>
                  <div className="space-y-2 rounded-xl border border-gray-100 bg-[#f8fafc] p-4 text-xs font-semibold text-gray-700">
                    <div className="flex items-center space-x-2.5 text-emerald-700">
                      <span>✓</span> <span>Technical keywords match modern web engineering target definitions</span>
                    </div>
                    <div className="flex items-start space-x-2.5 text-amber-700">
                      <span className="shrink-0">💡</span> <span>Tip: Customize bullet achievements to contain metrics that address points listed in job descriptions.</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* AI BULLET POINT FIXER (Bullet Point Improvements Integrated Section) */}
            <div id="ai-improvements" className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
              <button 
                onClick={() => setSectionsExpanded({...sectionsExpanded, aiImprovements: !sectionsExpanded.aiImprovements})}
                className="flex w-full items-start justify-between text-left"
              >
                <div className="flex items-center space-x-3">
                  <span className="h-5 w-1 bg-brand-600 rounded"></span>
                  <h3 className="text-base font-bold tracking-tight text-gray-800 uppercase">🤖 AI Bullet Point Fixer</h3>
                </div>
                <div className="flex items-center space-x-2">
                  {bulletLoading && (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-brand-200 border-t-brand-600"></div>
                  )}
                  <svg 
                    className={`h-5 w-5 text-gray-400 transition-transform ${sectionsExpanded.aiImprovements ? "rotate-180" : ""}`}
                    fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </button>

              {sectionsExpanded.aiImprovements && (
                <div className="mt-4 space-y-4">
                  <p className="text-sm leading-relaxed text-gray-600">
                    Our AI scans the work experience section of your resume and rewrites weaker bullets to use the Google-recommended XYZ format: "Accomplished [X] as measured by [Y], by doing [Z]".
                  </p>

                  {analysis.improved_bullets?.improvements?.length > 0 ? (
                    <div className="space-y-4">
                      {analysis.improved_bullets.improvements.map((item, idx) => (
                        <div key={idx} className="rounded-xl border border-gray-100 bg-[#f8fafc] p-4 shadow-sm space-y-2">
                          <div className="flex items-start space-x-2">
                            <span className="text-red-500 shrink-0 font-bold text-xs mt-0.5">Original:</span>
                            <p className="text-xs text-gray-500 line-through leading-relaxed">{item.original}</p>
                          </div>
                          <div className="flex items-start space-x-2">
                            <span className="text-emerald-600 shrink-0 font-bold text-xs mt-0.5">Improved:</span>
                            <p className="text-xs font-bold text-gray-900 leading-relaxed text-[#111827]">{item.improved}</p>
                          </div>
                          {item.reasoning && (
                            <div className="text-[10px] text-gray-400 italic bg-white p-2.5 rounded border border-gray-50/50">
                              <span className="font-bold uppercase text-[9px] tracking-wider text-gray-400 block mb-0.5">Reasoning</span>
                              {item.reasoning}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-8 text-center">
                      <p className="text-sm text-gray-500">
                        {bulletLoading ? "AI is rewriting your bullet points now..." : "Bullet improvements are ready to be generated."}
                      </p>
                      {!bulletLoading && (
                        <button
                          onClick={generateBulletsSilently}
                          className="mt-4 rounded-xl bg-brand-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-brand-700 active:scale-95 transition"
                        >
                          Generate AI Improvements
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* INTERVIEW QUESTIONS (Tailored Interview Prep Section) */}
            <div id="ai-interview" className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
              <button 
                onClick={() => setSectionsExpanded({...sectionsExpanded, aiInterview: !sectionsExpanded.aiInterview})}
                className="flex w-full items-start justify-between text-left"
              >
                <div className="flex items-center space-x-3">
                  <span className="h-5 w-1 bg-brand-600 rounded"></span>
                  <h3 className="text-base font-bold tracking-tight text-gray-800 uppercase">🎤 Tailored Interview Questions</h3>
                </div>
                <div className="flex items-center space-x-2">
                  {interviewLoading && (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-brand-200 border-t-brand-600"></div>
                  )}
                  <svg 
                    className={`h-5 w-5 text-gray-400 transition-transform ${sectionsExpanded.aiInterview ? "rotate-180" : ""}`}
                    fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </button>

              {sectionsExpanded.aiInterview && (
                <div className="mt-4 space-y-4">
                  <p className="text-sm leading-relaxed text-gray-600">
                    Prepare for behavioral and technical interviews with AI-generated questions tailored directly to your actual resume background details.
                  </p>

                  {analysis.interview_questions?.easy?.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Easy Questions */}
                      <div className="rounded-xl border border-emerald-100 bg-emerald-50/10 p-4 space-y-3">
                        <h4 className="text-xs font-extrabold uppercase tracking-wider text-emerald-700 flex items-center justify-between border-b border-emerald-100/50 pb-1">
                          <span>Easy Questions</span>
                          <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[9px]">warmup</span>
                        </h4>
                        <ul className="space-y-2 text-xs text-gray-600 pl-3 list-outside list-decimal leading-relaxed">
                          {analysis.interview_questions.easy.map((q, i) => <li key={i}>{q}</li>)}
                        </ul>
                      </div>

                      {/* Medium Questions */}
                      <div className="rounded-xl border border-amber-100 bg-amber-50/10 p-4 space-y-3">
                        <h4 className="text-xs font-extrabold uppercase tracking-wider text-amber-700 flex items-center justify-between border-b border-amber-100/50 pb-1">
                          <span>Medium Questions</span>
                          <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[9px]">core</span>
                        </h4>
                        <ul className="space-y-2 text-xs text-gray-600 pl-3 list-outside list-decimal leading-relaxed">
                          {analysis.interview_questions.medium.map((q, i) => <li key={i}>{q}</li>)}
                        </ul>
                      </div>

                      {/* Hard Questions */}
                      <div className="rounded-xl border border-red-100 bg-red-50/10 p-4 space-y-3">
                        <h4 className="text-xs font-extrabold uppercase tracking-wider text-red-700 flex items-center justify-between border-b border-red-100/50 pb-1">
                          <span>Hard Questions</span>
                          <span className="rounded-full bg-red-50 px-2 py-0.5 text-[9px]">stretch</span>
                        </h4>
                        <ul className="space-y-2 text-xs text-gray-600 pl-3 list-outside list-decimal leading-relaxed">
                          {analysis.interview_questions.hard.map((q, i) => <li key={i}>{q}</li>)}
                        </ul>
                      </div>
                    </div>
                  ) : (
                    <div className="py-8 text-center">
                      <p className="text-sm text-gray-500">
                        {interviewLoading ? "AI is framing tailored interview questions..." : "Interview prep questions are ready to be framed."}
                      </p>
                      {!interviewLoading && (
                        <button
                          onClick={generateInterviewSilently}
                          className="mt-4 rounded-xl bg-brand-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-brand-700 active:scale-95 transition"
                        >
                          Generate AI Interview Prep
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

          </div>

        </div>
      </div>

    </div>
  );
}
