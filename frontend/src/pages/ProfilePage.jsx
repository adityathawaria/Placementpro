// src/pages/ProfilePage.jsx
import { useState, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import Navbar from "../components/Navbar";
import { parseResume } from "../services/api";
// Storage upload removed — resume text stored directly in Firestore (free plan compatible)
import { Upload, User, BookOpen, Save, CheckCircle, Loader2, X, FileText } from "lucide-react";
import toast from "react-hot-toast";

const COLLEGE_DOMAINS = ["B.Tech", "M.Tech", "BCA", "MCA", "B.Sc CS", "MBA Tech", "Other"];

export default function ProfilePage() {
  const { user, profile, updateProfile } = useAuth();
  const fileRef = useRef(null);

  const [form, setForm] = useState({
    name: profile?.name || "",
    college: profile?.college || "",
    degree: profile?.degree || "",
    graduationYear: profile?.graduationYear || "",
  });

  const [resumeFile, setResumeFile] = useState(null);
  const [parsedData, setParsedData] = useState(null);
  const [parsing, setParsing] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.endsWith(".pdf")) {
      toast.error("Please upload a PDF file");
      return;
    }
    setResumeFile(file);
    setParsing(true);
    try {
      const data = await parseResume(file);
      setParsedData(data);
      toast.success(`Resume parsed! Found ${data.all_skills?.length || 0} skills.`);
    } catch (err) {
      toast.error("Resume parsing failed. You can still save your profile.");
    } finally {
      setParsing(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Resume text is stored in Firestore directly — no Storage/paid plan needed
      await updateProfile({
        ...form,
        resumeText: parsedData?.text || profile?.resumeText || "",
        resumeSkills: parsedData?.skills || profile?.resumeSkills || {},
        allSkills: parsedData?.all_skills || profile?.allSkills || [],
        resumeFileName: resumeFile?.name || profile?.resumeFileName || "",
      });
      toast.success("Profile saved!");
    } catch (err) {
      toast.error("Failed to save profile.");
    } finally {
      setSaving(false);
    }
  };

  const skills = parsedData?.skills || profile?.resumeSkills || {};

  return (
    <div className="min-h-screen gradient-bg">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 pt-24 pb-12">
        <div className="mb-8 fade-in-up">
          <h1 className="text-3xl font-bold text-white mb-1">Your Profile</h1>
          <p className="text-slate-400">Update your information and upload your resume for personalised questions.</p>
        </div>

        <div className="space-y-6">
          {/* Avatar & basic info */}
          <div className="glass p-6 rounded-2xl fade-in-up" style={{ animationDelay: '0.1s' }}>
            <div className="flex items-center gap-4 mb-6">
              <img
                src={user?.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(form.name)}&background=3b82f6&color=fff&size=80`}
                alt="avatar"
                className="w-16 h-16 rounded-2xl ring-2 ring-blue-500/40"
              />
              <div>
                <div className="text-lg font-semibold text-white">{user?.displayName}</div>
                <div className="text-slate-400 text-sm">{user?.email}</div>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              {[
                { key: "name", label: "Full Name", placeholder: "Your full name" },
                { key: "college", label: "College / University", placeholder: "IIT Delhi, BITS Pilani..." },
                { key: "graduationYear", label: "Graduation Year", placeholder: "2025" },
              ].map(({ key, label, placeholder }) => (
                <div key={key}>
                  <label className="block text-sm font-medium text-slate-400 mb-1.5">{label}</label>
                  <input
                    id={`profile-${key}`}
                    type="text"
                    value={form[key]}
                    onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                    placeholder={placeholder}
                    className="w-full px-4 py-3 bg-white/5 border border-blue-900/40 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/60 transition-colors"
                  />
                </div>
              ))}
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1.5">Degree</label>
                <select
                  id="profile-degree"
                  value={form.degree}
                  onChange={(e) => setForm({ ...form, degree: e.target.value })}
                  className="w-full px-4 py-3 bg-[#071428] border border-blue-900/40 rounded-xl text-white focus:outline-none focus:border-blue-500/60 transition-colors"
                >
                  <option value="">Select degree...</option>
                  {COLLEGE_DOMAINS.map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Resume Upload */}
          <div className="glass p-6 rounded-2xl fade-in-up" style={{ animationDelay: '0.2s' }}>
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-400" />
              Resume (PDF)
            </h2>

            {!resumeFile ? (
              <button
                onClick={() => fileRef.current?.click()}
                className="w-full border-2 border-dashed border-blue-500/30 hover:border-blue-500/60 rounded-xl p-10 text-center transition-all group"
              >
                <Upload className="w-10 h-10 text-blue-400/60 group-hover:text-blue-400 mx-auto mb-3 transition-colors" />
                <p className="text-slate-400 group-hover:text-slate-300 transition-colors">Click to upload your resume</p>
                <p className="text-slate-500 text-sm mt-1">PDF only · Max 10 MB</p>
              </button>
            ) : (
              <div className="flex items-center justify-between p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl">
                <div className="flex items-center gap-3">
                  {parsing ? (
                    <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
                  ) : (
                    <CheckCircle className="w-5 h-5 text-emerald-400" />
                  )}
                  <div>
                    <div className="text-white text-sm font-medium">{resumeFile.name}</div>
                    <div className="text-slate-400 text-xs">{parsing ? "Parsing..." : "Parsed successfully"}</div>
                  </div>
                </div>
                <button onClick={() => { setResumeFile(null); setParsedData(null); }} className="text-slate-500 hover:text-red-400 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
            <input ref={fileRef} type="file" accept=".pdf" onChange={handleFileChange} className="hidden" />
          </div>

          {/* Extracted Skills */}
          {Object.keys(skills).length > 0 && (
            <div className="glass p-6 rounded-2xl fade-in-up">
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-blue-400" />
                Extracted Skills
              </h2>
              <div className="space-y-3">
                {Object.entries(skills).map(([cat, skillList]) => (
                  <div key={cat}>
                    <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                      {cat.replace(/_/g, " ")}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {skillList.map((s) => (
                        <span key={s} className="px-3 py-1 text-xs bg-blue-500/15 text-blue-400 border border-blue-500/30 rounded-full">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <button
            id="save-profile-btn"
            onClick={handleSave}
            disabled={saving}
            className="w-full flex items-center justify-center gap-2 py-4 bg-blue-500 hover:bg-blue-400 disabled:opacity-60 text-white font-bold rounded-xl transition-all"
          >
            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
            {saving ? "Saving..." : "Save Profile"}
          </button>
        </div>
      </div>
    </div>
  );
}
