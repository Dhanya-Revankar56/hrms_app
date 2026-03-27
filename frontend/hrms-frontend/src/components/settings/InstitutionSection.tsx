// src/components/settings/InstitutionSection.tsx

import React, { useState, useEffect } from "react";
import { useQuery, useMutation } from "@apollo/client/react";
import { GET_SETTINGS, UPSERT_SETTINGS } from "../../graphql/settingsQueries";

const CSS = `
  .inst-container { display: flex; flex-direction: column; gap: 24px; padding-bottom: 24px; font-family: 'DM Sans', sans-serif; }
  .inst-header { display: flex; justify-content: space-between; align-items: center; }
  .inst-title { font-size: 20px; font-weight: 700; color: #1e293b; letter-spacing: -0.01em; }
  .inst-edit-btn { background: #fff; border: 1px solid #e2e8f0; color: #334155; height: 36px; padding: 0 16px; border-radius: 8px; font-size: 13.5px; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 6px; transition: 0.2s; }
  .inst-edit-btn:hover { background: #f8fafc; border-color: #cbd5e1; }
  .inst-save-btn { background: #3b82f6; border: none; color: #fff; height: 36px; padding: 0 16px; border-radius: 8px; font-size: 13.5px; font-weight: 600; cursor: pointer; transition: 0.2s; }
  .inst-save-btn:hover { background: #2563eb; }

  .inst-grid { display: grid; grid-template-columns: 1fr 1.5fr; gap: 24px; }
  
  .inst-card { background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; box-shadow: 0 1px 3px rgba(0,0,0,0.02); display: flex; flex-direction: column; position: relative; }
  .inst-card-title { font-size: 14.5px; font-weight: 700; color: #334155; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center; }
  
  /* Logo Card */
  .inst-logo-wrapper { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; gap: 16px; }
  .inst-logo-circle { width: 100px; height: 100px; border-radius: 50%; background: #e2e8f0; display: flex; align-items: center; justify-content: center; color: #94a3b8; font-size: 32px; overflow: hidden; position: relative; }
  .inst-logo-circle img { width: 100%; height: 100%; object-fit: cover; }
  .inst-logo-upload { position: absolute; bottom: 0; left: 0; right: 0; background: rgba(0,0,0,0.5); color: #fff; font-size: 11px; text-align: center; padding: 4px 0; cursor: pointer; opacity: 0; transition: 0.2s; }
  .inst-logo-circle:hover .inst-logo-upload { opacity: 1; }
  .inst-logo-text { font-size: 16px; font-weight: 700; color: #1e293b; text-align: center; }
  .inst-status { background: #f0fdf4; color: #16a34a; font-size: 11px; font-weight: 700; padding: 4px 12px; border-radius: 99px; text-transform: uppercase; letter-spacing: 0.05em; }

  /* Info Grid */
  .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px 24px; }
  .info-item { display: flex; flex-direction: column; gap: 4px; }
  .info-label { font-size: 12px; color: #64748b; font-weight: 500; }
  .info-value { font-size: 14px; color: #1e293b; font-weight: 600; min-height: 20px; }
  
  .inst-input { width: 100%; height: 34px; padding: 0 10px; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 13.5px; font-family: inherit; color: #1e293b; background: #fff; transition: 0.2s; }
  .inst-input:focus { outline: none; border-color: #3b82f6; box-shadow: 0 0 0 2px rgba(59,130,246,0.1); }
  
  html[data-theme='dark'] .inst-input { background: #0f172a; border-color: #475569; color: #f8fafc; }

  .inst-day-chip { display: flex; align-items: center; gap: 8px; padding: 6px 12px; border-radius: 8px; border: 1px solid #e2e8f0; font-size: 13px; font-weight: 500; color: #475569; cursor: pointer; transition: 0.2s; }
  .inst-day-chip.active { background: #eff6ff; border-color: #3b82f6; color: #2563eb; }
  html[data-theme='dark'] .inst-day-chip { border-color: #334155; color: #94a3b8; }
  html[data-theme='dark'] .inst-day-chip.active { background: #1e293b; border-color: #3b82f6; color: #60a5fa; }
`;

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export default function InstitutionSection() {
  const { data, loading, refetch } = useQuery<any>(GET_SETTINGS);
  const [upsertSettings, { loading: saving }] = useMutation(UPSERT_SETTINGS);
  
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<any>({});

  const settings = data?.settings || {};

  useEffect(() => {
    if (!isEditing && settings) {
      setFormData({
        institution_name: settings.institution_name || "",
        institution_short_name: settings.institution_short_name || "",
        institution_code: settings.institution_code || "",
        institution_logo: settings.institution_logo || "",
        owner_name: settings.owner_name || "",
        pan_number: settings.pan_number || "",
        registration_number: settings.registration_number || "",
        website_url: settings.website_url || "",
        fax_number: settings.fax_number || "",
        contact_email: settings.contact_email || "",
        contact_phone: settings.contact_phone || "",
        contact_mobile: settings.contact_mobile || "",
        added_by: settings.added_by || "",
        address_line1: settings.address?.line1 || "",
        address_line2: settings.address?.line2 || "",
        address_city: settings.address?.city || "",
        address_state: settings.address?.state || "",
        address_country: settings.address?.country || "",
        address_pin_code: settings.address?.pin_code || "",
        working_days: settings.working_days || ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      });
    }
  }, [settings, isEditing]);

  if (loading) return <div style={{ padding: "24px", color: "#64748b" }}>Loading institution details...</div>;

  const handleSave = async () => {
    try {
      await upsertSettings({
        variables: {
          input: {
            institution_name: formData.institution_name,
            institution_short_name: formData.institution_short_name,
            institution_code: formData.institution_code,
            institution_logo: formData.institution_logo,
            owner_name: formData.owner_name,
            pan_number: formData.pan_number,
            registration_number: formData.registration_number,
            website_url: formData.website_url,
            fax_number: formData.fax_number,
            contact_email: formData.contact_email,
            contact_phone: formData.contact_phone,
            contact_mobile: formData.contact_mobile,
            address: {
              line1: formData.address_line1,
              line2: formData.address_line2,
              city: formData.address_city,
              state: formData.address_state,
              country: formData.address_country,
              pin_code: formData.address_pin_code,
            },
            working_days: formData.working_days
          }
        }
      });
      setIsEditing(false);
      refetch();
    } catch (e) {
      console.error("Failed to save institution settings", e);
      alert("Failed to save valid settings. Ensure your payload limit is sufficient.");
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert("Image must be smaller than 5MB");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, institution_logo: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDayToggle = (day: string) => {
    if (!isEditing) return;
    const current = [...(formData.working_days || [])];
    if (current.includes(day)) {
      setFormData({ ...formData, working_days: current.filter(d => d !== day) });
    } else {
      setFormData({ ...formData, working_days: [...current, day] });
    }
  };

  const renderField = (label: string, name: string, value: string) => {
    const isReadOnly = ["added_by", "created_at", "id"].includes(name);
    return (
      <div className="info-item">
        <span className="info-label">{label}</span>
        {isEditing && !isReadOnly ? (
          <input name={name} value={formData[name] || ""} onChange={handleChange} className="inst-input" />
        ) : (
          <span className="info-value">{value || "—"}</span>
        )}
      </div>
    );
  };

  return (
    <div className="inst-container">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      
      <div className="inst-header">
        <h2 className="inst-title">Institution</h2>
        {isEditing ? (
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="inst-edit-btn" onClick={() => setIsEditing(false)}>Cancel</button>
            <button className="inst-save-btn" onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        ) : (
          <button className="inst-edit-btn" onClick={() => setIsEditing(true)}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
            Edit Info
          </button>
        )}
      </div>

      <div className="inst-grid">
        {/* Left Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div className="inst-card" style={{ flex: 1 }}>
            <div className="inst-logo-wrapper">
              <div className="inst-logo-circle">
                {formData.institution_logo || settings.institution_logo ? (
                  <img src={formData.institution_logo || settings.institution_logo} alt="Logo" />
                ) : (
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                )}
                {isEditing && (
                  <label className="inst-logo-upload">
                    Upload Logo
                    <input type="file" accept="image/*" hidden onChange={handleImageUpload} />
                  </label>
                )}
              </div>
              <div className="inst-logo-text">
                {isEditing ? <input name="institution_name" value={formData.institution_name} onChange={handleChange} className="inst-input" style={{ textAlign: "center" }} placeholder="Institution Name" /> : (settings.institution_name || "New Institution")}
              </div>
              <div className="inst-status">Active</div>
            </div>
          </div>

          <div className="inst-card">
            <div className="inst-card-title">Registrations</div>
            <div className="info-grid" style={{ gridTemplateColumns: '1fr' }}>
              {renderField("PAN", "pan_number", formData.pan_number)}
              {renderField("Registration No", "registration_number", formData.registration_number)}
              {renderField("College Code", "institution_code", formData.institution_code)}
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div className="inst-card">
            <div className="inst-card-title">Organization Info</div>
            <div className="info-grid">
              {renderField("Organization Name", "institution_name", formData.institution_name)}
              {renderField("Institution ID", "id", settings?.institution_id)} {/* Cannot edit system ID */}
              {renderField("Owner Name", "owner_name", formData.owner_name)}
              {renderField("Added By", "added_by", settings?.added_by || "System Admin")}
              {renderField("Short Name", "institution_short_name", formData.institution_short_name)}
              {renderField("Added Time", "created_at", settings?.created_at ? new Date(parseInt(settings.created_at)).toLocaleString() : "—")}
            </div>
          </div>

          <div className="inst-card">
            <div className="inst-card-title">Contact Information</div>
            <div className="info-grid">
              {renderField("Organization email", "contact_email", formData.contact_email)}
              {renderField("Organization mobile", "contact_mobile", formData.contact_mobile)}
              {renderField("Organization phone", "contact_phone", formData.contact_phone)}
              <div className="info-item" style={{ gridColumn: '1 / -1' }}>
                <span className="info-label">Address</span>
                {!isEditing ? (
                  <span className="info-value">
                    {[settings.address?.line1, settings.address?.line2, settings.address?.city, settings.address?.state, settings.address?.country, settings.address?.pin_code].filter(Boolean).join(", ") || "—"}
                  </span>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '4px' }}>
                    <input name="address_line1" value={formData.address_line1} onChange={handleChange} className="inst-input" placeholder="Line 1" />
                    <input name="address_line2" value={formData.address_line2} onChange={handleChange} className="inst-input" placeholder="Line 2" />
                    <input name="address_city" value={formData.address_city} onChange={handleChange} className="inst-input" placeholder="City" />
                    <input name="address_state" value={formData.address_state} onChange={handleChange} className="inst-input" placeholder="State" />
                    <input name="address_country" value={formData.address_country} onChange={handleChange} className="inst-input" placeholder="Country" />
                    <input name="address_pin_code" value={formData.address_pin_code} onChange={handleChange} className="inst-input" placeholder="Pin Code" />
                  </div>
                )}
              </div>
              {renderField("Website", "website_url", formData.website_url)}
              {renderField("Fax Number", "fax_number", formData.fax_number)}
            </div>
          </div>

          <div className="inst-card">
            <div className="inst-card-title">Work Week Configuration</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {DAYS.map(day => {
                const isActive = (formData.working_days || []).includes(day);
                return (
                  <div 
                    key={day} 
                    className={`inst-day-chip ${isActive ? 'active' : ''}`}
                    onClick={() => handleDayToggle(day)}
                  >
                    {isEditing && (
                      <input 
                        type="checkbox" 
                        checked={isActive} 
                        onChange={() => {}} 
                        style={{ display: 'none' }}
                      />
                    )}
                    {day}
                  </div>
                );
              })}
            </div>
            <p style={{ fontSize: '12px', color: '#64748b', marginTop: '12px' }}>
               Selected days will be treated as working days for leave calculations and holiday planners.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
