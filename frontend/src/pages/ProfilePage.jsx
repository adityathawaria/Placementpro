// src/pages/ProfilePage.jsx
import { useState, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import Navbar from "../components/Navbar";
import { parseResume } from "../services/api";
import { Upload, BookOpen, Save, CheckCircle, Loader2, X, FileText, User, GraduationCap } from "lucide-react";
import toast from "react-hot-toast";

const DEGREES = ["B.Tech", "M.Tech", "BCA", "MCA", "B.Sc CS", "MBA Tech", "Other"];

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
    if (!file.name.endsWith(".pdf")) { toast.error("Please upload a PDF file"); return; }
    setResumeFile(file);
    setParsing(true);
    try {
      const data = await parseResume(file);
      setParsedData(data);
      toast.success(`Resume parsed! Found ${data.all_skills?.length || 0} skills.`);
    } catch {
      toast.error("Resume parsing failed. You can still save your profile.");
    } finally { setParsing(false); }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateProfile({
        ...form,
        resumeText: parsedData?.text || profile?.resumeText || "",
        resumeSkills: parsedData?.skills || profile?.resumeSkills || {},
        allSkills: parsedData?.all_skills || profile?.allSkills || [],
        resumeFileName: resumeFile?.name || profile?.resumeFileName || "",
      });
      toast.success("Profile saved!");
    } catch { toast.error("Failed to save profile."); }
    finally { setSaving(false); }
  };

  const skills = parsedData?.skills || profile?.resumeSkills || {};
  const inputStyle = {
    width: "100%", padding: "9px 13px",
    background: "#fff", border: "1.5px solid var(--border)",
    borderRadius: "var(--radius)", fontFamily: "inherit",
    fontSize: 13, color: "var(--text-primary)", outline: "none",
    transition: "border-color 0.15s",
  };

  return (
    <div style={{ background: "var(--bg-page)", minHeight: "100vh" }}>
      <Navbar />
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "80px 16px 48px" }}>

        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "var(--text-primary)" }}>My Profile</h1>
          <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 4 }}>
            Update your details and upload your resume for personalised interview questions.
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

          {/* Avatar + Info */}
          <div className="card p-6">
            <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 24 }}>
              <img
                src={user?.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(form.name || "U")}&background=2563eb&color=fff&size=64`}
                alt="avatar"
                style={{ width: 52, height: 52, borderRadius: 12, border: "2px solid var(--border)" }}
              />
              <div>
                <div style={{ fontWeight: 600, color: "var(--text-primary)" }}>{user?.displayName}</div>
                <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>{user?.email}</div>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              {[
                { key: "name", label: "Full Name", placeholder: "Your full name", icon: User },
                { key: "college", label: "College / University", placeholder: "IIT Delhi, BITS Pilani...", icon: GraduationCap },
                { key: "graduationYear", label: "Graduation Year", placeholder: "2025", icon: null },
              ].map(({ key, label, placeholder }) => (
                <div key={key}>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text-muted)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                    {label}
                  </label>
                  <input
                    id={`profile-${key}`}
                    type="text"
                    value={form[key]}
                    onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                    placeholder={placeholder}
                    style={inputStyle}
                    onFocus={(e) => e.target.style.borderColor = "var(--accent)"}
                    onBlur={(e) => e.target.style.borderColor = "var(--border)"}
                  />
                </div>
              ))}
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text-muted)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                  Degree
                </label>
                <select
                  id="profile-degree"
                  value={form.degree}
                  onChange={(e) => setForm({ ...form, degree: e.target.value })}
                  style={{ ...inputStyle, cursor: "pointer" }}
                  onFocus={(e) => e.target.style.borderColor = "var(--accent)"}
                  onBlur={(e) => e.target.style.borderColor = "var(--border)"}
                >
                  <option value="">Select degree...</option>
                  {DEGREES.map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Resume Upload */}
          <div className="card p-6">
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
              <FileText className="w-4 h-4" style={{ color: "var(--accent)" }} />
              <span style={{ fontWeight: 600, color: "var(--text-primary)", fontSize: 14 }}>Resume Upload</span>
              <span className="tag tag-gray" style={{ marginLeft: "auto" }}>PDF only</span>
            </div>

            {!resumeFile ? (
              <button
                onClick={() => fileRef.current?.click()}
                style={{
                  width: "100%", border: "2px dashed var(--border)", borderRadius: "var(--radius-lg)",
                  padding: "32px 16px", textAlign: "center", background: "var(--bg-card-alt)",
                  cursor: "pointer", transition: "border-color 0.2s, background 0.2s",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--accent)"; e.currentTarget.style.background = "var(--accent-light)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.background = "var(--bg-card-alt)"; }}
              >
                <Upload className="w-8 h-8 mx-auto mb-2" style={{ color: "var(--text-muted)" }} />
                <p style={{ fontSize: 13, color: "var(--text-secondary)", fontWeight: 500 }}>Click to upload your resume</p>
                <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>PDF · Max 10 MB</p>
              </button>
            ) : (
              <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", background: "var(--success-light)", border: "1px solid #86efac", borderRadius: "var(--radius)" }}>
                {parsing ? (
                  <Loader2 className="w-5 h-5 animate-spin" style={{ color: "var(--success)", flexShrink: 0 }} />
                ) : (
                  <CheckCircle className="w-5 h-5" style={{ color: "var(--success)", flexShrink: 0 }} />
                )}
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>{resumeFile.name}</div>
                  <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{parsing ? "Parsing resume..." : "Parsed successfully"}</div>
                </div>
                <button onClick={() => { setResumeFile(null); setParsedData(null); }}
                  style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: 4 }}>
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
            <input ref={fileRef} type="file" accept=".pdf" onChange={handleFileChange} className="hidden" />
          </div>

          {/* Extracted Skills */}
          {Object.keys(skills).length > 0 && (
            <div className="card p-6">
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                <BookOpen className="w-4 h-4" style={{ color: "var(--accent)" }} />
                <span style={{ fontWeight: 600, color: "var(--text-primary)", fontSize: 14 }}>Extracted Skills</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {Object.entries(skills).map(([cat, skillList]) => (
                  <div key={cat}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>
                      {cat.replace(/_/g, " ")}
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                      {skillList.map((s) => (
                        <span key={s} className="tag tag-blue">{s}</span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Save button */}
          <button
            id="save-profile-btn"
            onClick={handleSave}
            disabled={saving}
            className="btn-primary"
            style={{ width: "100%", justifyContent: "center", padding: "12px", fontSize: 14 }}
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? "Saving..." : "Save Profile"}
          </button>
        </div>
      </div>
    </div>
  );
}
