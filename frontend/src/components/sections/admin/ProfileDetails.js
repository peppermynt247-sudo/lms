import { useState, useEffect } from 'react';

export default function ProfileDetails({ learner }) {
  // Map backend fields to form fields
  useEffect(() => {
    if (!learner) return;
    setForm({
      learnerName: learner.name || '',
      username: learner.username || '',
      studentMobile: learner.phone || learner.phoneNumber || '',
      dob: learner.dob || '',
      studentEmail: learner.email || '',
      gender: learner.gender || '',
      altContact: learner.altContact || learner.whatsappNumber || '',
      studentSource: learner.studentSource || '',
      religion: learner.religion || '',
      standard: learner.standard || '',
      timezone: learner.timezone || '',
      parentContact: learner.parentContact || '',
      parentEmail: learner.parentEmail || '',
      occupation: learner.occupation || '',
      area: learner.area || '',
      schoolCollege: learner.institutionName || learner.schoolCollege || '',
      resAddress: learner.resAddress || learner.address || '',
      fatherName: learner.fatherName || '',
      pan: learner.pan || '',
      ugBranch: learner.ugBranch || '',
      ugPercent: learner.ugPercent || '',
      ugCollege: learner.ugCollege || '',
      ugCollegeFull: learner.ugCollegeFull || '',
      ugBranchStream: learner.ugBranchStream || '',
      twelfthYear: learner.twelfthYear || '',
      permanentAddress: learner.permanentAddress || '',
      city: learner.city || '',
      state: learner.state || '',
      pincode: learner.pincode || '',
    });
  }, [learner]);

  const [form, setForm] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  // Modern compact input style
  const inputStyle = {
    width: '100%',
    padding: '6px 10px',
    border: '1px solid #e5e7eb',
    borderRadius: '5px',
    fontSize: '13px',
    background: '#fff',
    marginTop: '2px',
    marginBottom: '2px',
    outline: 'none',
    transition: 'border 0.2s',
    minHeight: 0,
    boxSizing: 'border-box',
  };
  const labelStyle = {
    fontWeight: 500,
    color: '#374151',
    marginBottom: 1,
    fontSize: '12px',
    display: 'block',
  };
  const sectionStyle = {
    background: '#fff',
    borderRadius: 8,
    padding: 18,
    boxShadow: '0 1px 4px 0 #e5e7eb',
    marginTop: 12,
    border: '1px solid #f3f4f6',
    maxWidth: 900,
  };

  // 3x3 grid fields (first 9 fields)
  const gridFields = [
    { label: "Learners Name *", name: "learnerName" },
    { label: "Username", name: "username" },
    { label: "Student Mobile Number", name: "studentMobile" },
    { label: "Date of Birth", name: "dob", type: "date" },
    { label: "Student Email", name: "studentEmail" },
    { label: "Gender", name: "gender", type: "select" },
    { label: "Alternate Contact", name: "altContact" },
    { label: "Student Source", name: "studentSource" },
    { label: "Religion", name: "religion" },
  ];

  // Remaining fields
  const restFields = [
    { label: "Standard", name: "standard" },
    { label: "TimeZone", name: "timezone" },
    { label: "Parent Contact No.", name: "parentContact" },
    { label: "Parent Email", name: "parentEmail" },
    { label: "Occupation", name: "occupation" },
    { label: "Area", name: "area" },
    { label: "School/College Name", name: "schoolCollege" },
    { label: "Residential Address", name: "resAddress" },
    { label: "Father Name", name: "fatherName" },
    { label: "PAN Card Number", name: "pan" },
    { label: "UG Branch", name: "ugBranch" },
    { label: "UG Percentage", name: "ugPercent" },
    { label: "UG College Name", name: "ugCollege" },
    { label: "UG College Full Name", name: "ugCollegeFull" },
    { label: "UG Branch / Stream", name: "ugBranchStream" },
    { label: "Twelfth Year of Passing", name: "twelfthYear" },
  ];

  return (
    <div style={{ maxWidth: 950, margin: '0 auto', padding: '18px 0' }}>
      <h2 style={{ marginBottom: 14, fontWeight: 700, fontSize: 20, color: '#1e293b', letterSpacing: 0.2 }}>Profile Details</h2>
      <form style={sectionStyle}>
        {/* Compact 3x3 grid for first 9 fields */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 16,
          marginBottom: 16,
        }}>
          {gridFields.map((field) => (
            <div key={field.name} style={{ minWidth: 0 }}>
              <label style={labelStyle}>{field.label}</label>
              {field.type === 'date' ? (
                <input style={inputStyle} type="date" name={field.name} value={form[field.name] || ''} onChange={handleChange} />
              ) : field.type === 'select' ? (
                <select style={inputStyle} name={field.name} value={form[field.name] || ''} onChange={handleChange}>
              <option value="">Select</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
              ) : (
                <input style={inputStyle} name={field.name} value={form[field.name] || ''} onChange={handleChange} />
              )}
            </div>
          ))}
        </div>
        {/* Remaining fields in a compact 3-column grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 16,
        }}>
          {restFields.map((field) => (
            <div key={field.name} style={{ minWidth: 0 }}>
              <label style={labelStyle}>{field.label}</label>
              <input style={inputStyle} name={field.name} value={form[field.name] || ''} onChange={handleChange} />
            </div>
          ))}
        </div>
        {/* Permanent Address and City/State/Pincode */}
        <div style={{ marginTop: 12 }}>
          <label style={labelStyle}>Permanent Address</label>
          <textarea style={{ ...inputStyle, minHeight: 32, fontSize: '13px' }} name="permanentAddress" value={form.permanentAddress || ''} onChange={handleChange} />
        </div>
        <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>City</label>
            <input style={inputStyle} name="city" value={form.city || ''} onChange={handleChange} />
          </div>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>State</label>
            <input style={inputStyle} name="state" value={form.state || ''} onChange={handleChange} />
          </div>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>Pincode</label>
            <input style={inputStyle} name="pincode" value={form.pincode || ''} onChange={handleChange} />
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, marginTop: 18, justifyContent: 'flex-end' }}>
          <button type="submit" style={{ background: '#2563eb', color: '#fff', padding: '7px 20px', border: 'none', borderRadius: 5, fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>Update</button>
          <button type="button" style={{ background: '#f3f4f6', color: '#222', padding: '7px 20px', border: 'none', borderRadius: 5, fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>Cancel</button>
        </div>
      </form>
    </div>
  );
}