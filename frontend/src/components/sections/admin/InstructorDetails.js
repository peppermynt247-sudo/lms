'use client';

import { useState, useEffect, useRef } from 'react';
import { ChevronLeft, Calendar, Mail, Phone, MapPin, User, CalendarDays, ChevronRight, ChevronLeft as ArrowLeft } from 'lucide-react';
import { useRouter, useParams } from 'next/navigation';
import Cookies from 'js-cookie';
import axios from 'axios';
import { toast } from 'react-toastify';

function getCurrentTimePosition(startHour = 8, endHour = 20) {
  const now = new Date();
  const hour = now.getHours() + now.getMinutes() / 60;
  if (hour < startHour) return 0;
  if (hour > endHour) return 100;
  return ((hour - startHour) / (endHour - startHour)) * 100;
}

function getWeekDates(date) {
  const d = new Date(date);
  const day = d.getDay();
  const sunday = new Date(d);
  sunday.setDate(d.getDate() - day);
  return Array.from({ length: 7 }, (_, i) => {
    const dt = new Date(sunday);
    dt.setDate(sunday.getDate() + i);
    return dt;
  });
}

export default function InstructorDetails() {
  const [tab, setTab] = useState('Classes Taught');
  const [calendarModal, setCalendarModal] = useState(false);
  const [calendarView, setCalendarView] = useState('week');
  const [currentDate, setCurrentDate] = useState(new Date());
  const router = useRouter();
  const { id } = useParams();
  const calendarRef = useRef(null);

  const [instructorSummary, setInstructorSummary] = useState(null); // for header
  const [instructorProfile, setInstructorProfile] = useState(null); // for profile section
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [showList, setShowList] = useState(false);
  const [allUsers, setAllUsers] = useState([]);
  const [loadingList, setLoadingList] = useState(false);
  const [errorList, setErrorList] = useState(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError(null);
    const token = Cookies.get("accessToken");
    Promise.all([
      axios.get(`${process.env.NEXT_PUBLIC_BACKEND_REST_API_BASE_URL}/api/admin/getadminsandinstructors`, { headers: token ? { 'Authorization': `Bearer ${token}` } : {} }),
      axios.get(`${process.env.NEXT_PUBLIC_BACKEND_REST_API_BASE_URL}/api/admin/profile/${id}`, { headers: token ? { 'Authorization': `Bearer ${token}` } : {} })
    ])
      .then(([summaryRes, profileRes]) => {
        const summaryList = summaryRes.data;
        const summary = Array.isArray(summaryList) ? summaryList.find(u => String(u.id) === String(id)) : null;
        setInstructorSummary(summary);
        setInstructorProfile(profileRes.data);
        setLoading(false);
      })
      .catch(err => {
        setError('Could not load instructor details.');
        setLoading(false);
      });
  }, [id]);

  const [profile, setProfile] = useState({
    name: '',
    username: '',
    dob: '',
    gender: '',
    contact: '',
    altContact: '',
    email: '',
    landline: '',
    address: '',
    city: '',
    state: '',
    about: '',
    phone: '',
    whatsappNumber: '',
  });

  // Sync profile state with instructorProfile when loaded
  useEffect(() => {
    if (instructorProfile && instructorProfile.data) {
      setProfile({
        userId: instructorProfile.data.userId || '',
        email: instructorProfile.data.email || '',
        name: instructorProfile.data.name || '',
        phone: instructorProfile.data.phoneNumber || '',
        parentName: instructorProfile.data.parentName || '',
        parentContact: instructorProfile.data.parentContact || '',
        parentEmail: instructorProfile.data.parentEmail || '',
        gender: instructorProfile.data.gender || '',
        dob: instructorProfile.data.dob || '',
        whatsappNumber: instructorProfile.data.whatsappNumber || '',
        address: instructorProfile.data.address || '',
        qualification: instructorProfile.data.qualification || '',
        aadhar: instructorProfile.data.aadhar || '',
        pan: instructorProfile.data.pan || '',
        city: instructorProfile.data.city || '',
        state: instructorProfile.data.state || '',
        country: instructorProfile.data.country || '',
        pincode: instructorProfile.data.pincode || '',
        educations: instructorProfile.data.educations || [],
        profileImageUrl: instructorProfile.data.profileImageUrl || '',
      });
    }
  }, [instructorProfile]);

  const [loadingProfileUpdate, setLoadingProfileUpdate] = useState(false);

  const handleProfileFormChange = (e) => {
    const { name, value } = e.target;
    setProfile((prev) => ({ ...prev, [name]: value }));
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setLoadingProfileUpdate(true);
    try {
      const token = Cookies.get('accessToken');
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_REST_API_BASE_URL}/api/admin/updateprofile/${id}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
          },
          body: JSON.stringify(profile)
        }
      );
      if (!res.ok) throw new Error('Failed to update profile');
      toast.success('Profile updated successfully!');
      // Optionally re-fetch profile here if needed
    } catch (err) {
      toast.error('Failed to update profile');
    }
    setLoadingProfileUpdate(false);
  };

  // Batches integration
  const [batches, setBatches] = useState({ activeBatches: [], completedBatches: [] });
  const [loadingBatches, setLoadingBatches] = useState(false);
  const [errorBatches, setErrorBatches] = useState(null);
  const [selectedBatchType, setSelectedBatchType] = useState('active');

  useEffect(() => {
    if (!id) return;
    setLoadingBatches(true);
    setErrorBatches(null);
    const token = Cookies.get('accessToken');
    axios.get(`${process.env.NEXT_PUBLIC_BACKEND_REST_API_BASE_URL}/api/admin/batches/instructor/${id}`, {
      headers: token ? { 'Authorization': `Bearer ${token}` } : {}
    })
      .then(res => {
        setBatches(res.data?.data || { activeBatches: [], completedBatches: [] });
        setLoadingBatches(false);
      })
      .catch(err => {
        setErrorBatches('Could not load batches.');
        setLoadingBatches(false);
      });
  }, [id]);

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfile((prev) => ({ ...prev, [name]: value }));
  };

  const [timeBarPos, setTimeBarPos] = useState(getCurrentTimePosition());
  useEffect(() => {
    if (tab !== 'Calendar' || calendarView !== 'day') return;
    const interval = setInterval(() => {
      setTimeBarPos(getCurrentTimePosition());
    }, 60000);
    setTimeBarPos(getCurrentTimePosition());
    return () => clearInterval(interval);
  }, [tab, calendarView]);

  const startHour = 8;
  const endHour = 20;
  const hours = Array.from({ length: endHour - startHour + 1 }, (_, i) => startHour + i);

  const weekDates = getWeekDates(currentDate);
  const weekRange = `${weekDates[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${weekDates[6].toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;

  const fetchAllUsers = () => {
    setLoadingList(true);
    setErrorList(null);
    const token = Cookies.get("accessToken");
    fetch(`${process.env.NEXT_PUBLIC_BACKEND_REST_API_BASE_URL}/api/admin/getadminsandinstructors`, {
      headers: token ? { 'Authorization': `Bearer ${token}` } : {}
    })
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch admins/instructors list');
        return res.json();
      })
      .then(data => {
        setAllUsers(Array.isArray(data) ? data : []);
        setLoadingList(false);
      })
      .catch(err => {
        setErrorList('Could not load admins/instructors list.');
        setLoadingList(false);
      });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 text-[15px]">
      <div className="w-full sticky top-0 z-20 bg-white py-3 px-4 flex items-center gap-3 shadow-sm border-b border-gray-200">
        <button onClick={() => router.back()} className="text-gray-700 hover:text-blue-600 p-1">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="flex flex-col gap-2 w-full">
          <div className="flex flex-col md:flex-row md:items-center gap-2">
            <h1 className="text-xl font-bold text-black tracking-tight leading-tight">{loading ? 'Loading...' : (instructorSummary?.name || 'N/A')}</h1>
            <span className="bg-green-100 text-green-800 px-2 py-0.5 rounded-full text-xs font-semibold ml-1 shadow">{instructorSummary?.role || 'INSTRUCTOR'}</span>
          </div>
          <div className="flex flex-col md:flex-row md:items-center gap-6 text-gray-700 text-sm">
            <span className="flex items-center gap-1"><Mail className="w-4 h-4" /> {instructorSummary?.email || 'N/A'}</span>
            <span className="flex items-center gap-1"><Phone className="w-4 h-4" /> {instructorSummary?.phone || 'N/A'}</span>
          </div>
        </div>
      </div>
      {/* <div className="w-full flex justify-end px-4 mt-2 mb-[-8px]">
        <ActionsDropdown instructorId={id} />
      </div> */}
      <div className="w-full flex flex-col md:flex-row gap-4 px-4 py-3 bg-white border-b border-gray-200 mt-0 text-sm">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-blue-500" />
          <div>
            <div className="text-xs text-gray-500">Added on</div>
            <div className="font-medium text-gray-800">{instructorSummary?.createdAt ? instructorSummary.createdAt.slice(0, 10) : 'N/A'}</div>
          </div>
        </div>
        {/* <div className="flex items-center gap-2"> */}
          {/* <MapPin className="w-4 h-4 text-purple-500" /> */}
          {/* <div>
            <div className="text-xs text-gray-500">Branches</div>
            <div className="font-medium text-gray-800">{instructorSummary?.branches || 'N/A'}</div>
          </div> */}
        {/* </div> */}
      </div>
      {/* <div className="w-full flex justify-end px-4 pt-4"> */}
        {/* <button
          onClick={() => { setShowList(v => { if (!v) fetchAllUsers(); return !v; }); }}
          className="px-4 py-2 bg-blue-600 text-white rounded font-semibold mb-4"
        >
          {showList ? 'Hide' : 'Show'} All Admins & Instructors
        </button> */}
      {/* </div> */}
      {showList && (
        <div className="mb-6 px-4">
          {loadingList ? <div>Loading...</div> : errorList ? <div className="text-red-500">{errorList}</div> : (
            <table className="min-w-full bg-white border border-gray-200 rounded-md text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-2 border-b text-left">Name</th>
                  <th className="px-4 py-2 border-b text-left">Email</th>
                  <th className="px-4 py-2 border-b text-left">Role</th>
                </tr>
              </thead>
              <tbody>
                {allUsers.map((user, idx) => (
                  <tr key={user.id || idx} className={idx % 2 === 0 ? "bg-white" : "bg-blue-50"}>
                    <td className="px-4 py-2 border-b">{user.name ?? ''}</td>
                    <td className="px-4 py-2 border-b">{user.email ?? ''}</td>
                    <td className="px-4 py-2 border-b font-bold">
                      {user.role === 'ADMIN' && <span className="text-purple-700">ADMIN</span>}
                      {user.role === 'INSTRUCTOR' && <span className="text-green-700">INSTRUCTOR</span>}
                      {user.role !== 'ADMIN' && user.role !== 'INSTRUCTOR' && <span>{user.role}</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
      {error && <div className="text-center text-red-500 py-4">{error}</div>}
      <div className="w-full px-4 pt-3">
        <div className="flex gap-3 border-b mb-2 text-sm">
          <button
            className={`pb-1 px-1 font-semibold transition-all duration-200 ${tab==='Classes Taught' ? 'border-b-2 border-blue-600 text-blue-700' : 'text-gray-400 hover:text-blue-500'}`}
            onClick={()=>setTab('Classes Taught')}
          >
            Classes Taught
          </button>
          <button
            className={`pb-1 px-1 font-semibold transition-all duration-200 ${tab==='Profile' ? 'border-b-2 border-blue-600 text-blue-700' : 'text-gray-400 hover:text-blue-500'}`}
            onClick={()=>setTab('Profile')}
          >
            Profile
          </button>
        </div>
        {tab === 'Classes Taught' && (
          <div className="bg-white rounded-lg p-3 border mb-6">
            <div className="mb-6">
  <label htmlFor="batchType" className="block text-sm font-semibold text-gray-700 mb-2">
    Select Batch Type
  </label>
  <select
  id="batchType"
  value={selectedBatchType}
  onChange={(e) => setSelectedBatchType(e.target.value)}
  className="w-full md:w-64 bg-white border border-gray-300 text-sm rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 px-4 py-2 transition"
>
  <option value="active">Active Batches</option>
  <option value="completed">Completed Batches</option>
</select>
</div>
            {loadingBatches ? (
              <div className="py-4 text-center text-gray-400">Loading batches...</div>
            ) : errorBatches ? (
              <div className="py-4 text-center text-red-500">{errorBatches}</div>
            ) : selectedBatchType === 'active' ? (
              <div className="overflow-x-auto mb-6">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="text-gray-700">
                      <th className="px-2 py-1">Sr. No.</th>
                      <th className="px-2 py-1">Batch Name</th>
                      <th className="px-2 py-1">Course Name</th>
                      <th className="px-2 py-1">Start Date</th>
                      <th className="px-2 py-1">End Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {batches.activeBatches && batches.activeBatches.length > 0 ? (
                      batches.activeBatches.map((batch, idx) => (
                        <tr key={batch.batchId || idx}>
                          <td className="px-2 py-1">{idx + 1}</td>
                          <td className="px-2 py-1">{batch.batchName}</td>
                          <td className="px-2 py-1">{batch.courseName}</td>
                          <td className="px-2 py-1">{batch.startDate}</td>
                          <td className="px-2 py-1">{batch.endDate}</td>
                        </tr>
                      ))
                    ) : (
                      <tr><td colSpan={5} className="py-4 text-center text-gray-400">No active batches</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="text-gray-700">
                      <th className="px-2 py-1">Sr. No.</th>
                      <th className="px-2 py-1">Batch Name</th>
                      <th className="px-2 py-1">Course Name</th>
                      <th className="px-2 py-1">Start Date</th>
                      <th className="px-2 py-1">End Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {batches.completedBatches && batches.completedBatches.length > 0 ? (
                      batches.completedBatches.map((batch, idx) => (
                        <tr key={batch.batchId || idx}>
                          <td className="px-2 py-1">{idx + 1}</td>
                          <td className="px-2 py-1">{batch.batchName}</td>
                          <td className="px-2 py-1">{batch.courseName}</td>
                          <td className="px-2 py-1">{batch.startDate}</td>
                          <td className="px-2 py-1">{batch.endDate}</td>
                        </tr>
                      ))
                    ) : (
                      <tr><td colSpan={5} className="py-4 text-center text-gray-400">No completed batches</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
        {tab === 'Profile' && (
          <form className="w-full py-4 px-0 md:px-4 bg-gradient-to-br from-white via-blue-50 to-purple-50 text-gray-700 mb-6" autoComplete="off" onSubmit={handleProfileSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3">
              <div>
                <label className="block text-xs font-semibold mb-1 text-blue-900">Name</label>
                <input name="name" value={profile.name} onChange={handleProfileFormChange} className="w-full border border-blue-100 focus:border-blue-400 rounded px-2 py-1 bg-white focus:bg-blue-50 transition text-sm h-8" type="text" autoComplete="off" />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1 text-blue-900">Date of Birth</label>
                <input name="dob" value={profile.dob} onChange={handleProfileFormChange} className="w-full border border-blue-100 focus:border-blue-400 rounded px-2 py-1 bg-white focus:bg-blue-50 transition text-sm h-8" type="date" />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1 text-blue-900">Gender</label>
                <select name="gender" value={profile.gender} onChange={handleProfileFormChange} className="w-full border border-blue-100 focus:border-blue-400 rounded px-2 py-1 bg-white focus:bg-blue-50 transition text-sm h-8">
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1 text-blue-900">Email</label>
                <input name="email" value={profile.email} onChange={handleProfileFormChange} className="w-full border border-blue-100 focus:border-blue-400 rounded px-2 py-1 bg-white focus:bg-blue-50 transition text-sm h-8" type="email" />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1 text-blue-900">Phone</label>
                <input name="phone" value={profile.phone} onChange={handleProfileFormChange} className="w-full border border-blue-100 focus:border-blue-400 rounded px-2 py-1 bg-white focus:bg-blue-50 transition text-sm h-8" type="text" />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1 text-blue-900">WhatsApp Number</label>
                <input name="whatsappNumber" value={profile.whatsappNumber} onChange={handleProfileFormChange} className="w-full border border-blue-100 focus:border-blue-400 rounded px-2 py-1 bg-white focus:bg-blue-50 transition text-sm h-8" type="text" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold mb-1 text-blue-900">Address</label>
                <input name="address" value={profile.address} onChange={handleProfileFormChange} className="w-full border border-blue-100 focus:border-blue-400 rounded px-2 py-1 bg-white focus:bg-blue-50 transition text-sm h-8" type="text" />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1 text-blue-900">City</label>
                <input name="city" value={profile.city} onChange={handleProfileFormChange} className="w-full border border-blue-100 focus:border-blue-400 rounded px-2 py-1 bg-white focus:bg-blue-50 transition text-sm h-8" type="text" />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1 text-blue-900">State</label>
                <input name="state" value={profile.state} onChange={handleProfileFormChange} className="w-full border border-blue-100 focus:border-blue-400 rounded px-2 py-1 bg-white focus:bg-blue-50 transition text-sm h-8" type="text" />
              </div>
            </div>
            <div className="flex flex-col md:flex-row justify-end gap-2 mt-6 sticky md:static bottom-0 left-0 bg-transparent z-10">
              <button type="button" className="px-5 py-1 rounded font-semibold border border-gray-300 bg-gray-100 text-gray-700 hover:bg-gray-200 transition text-sm" disabled={loadingProfileUpdate}>Cancel</button>
              <button type="submit" className="px-5 py-1 rounded font-semibold bg-gradient-to-r from-green-600 to-green-600 text-white shadow hover:from-green-700 hover:to-green-700 transition text-sm" disabled={loadingProfileUpdate}>{loadingProfileUpdate ? 'Updating...' : 'Update Profile'}</button>
            </div>
          </form>
        )}
      </div>
      {calendarModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl mx-auto p-0 relative animate-fadeIn">
            <div className="flex items-center justify-between px-4 pt-4 pb-2 border-b">
              <div className="text-base font-bold">Calendar: {instructorSummary?.name || 'N/A'}</div>
              <button onClick={() => setCalendarModal(false)} className="text-gray-400 hover:text-red-500 text-xl font-bold px-2">×</button>
            </div>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 px-4 pt-2 pb-1">
              {/* <div className="flex items-center gap-2 text-base font-semibold">
                <button onClick={() => setCurrentDate(new Date(currentDate.setDate(currentDate.getDate() - 7)))} className="p-1 rounded hover:bg-gray-100"><ArrowLeft className="w-4 h-4" /></button>
                <span>{weekRange}</span>
                <button onClick={() => setCurrentDate(new Date(currentDate.setDate(currentDate.getDate() + 7)))} className="p-1 rounded hover:bg-gray-100"><ChevronRight className="w-4 h-4" /></button>
              </div> */}
              {/* <div className="flex gap-1">
                <button className="px-3 py-1 rounded border border-gray-300 bg-gray-50 hover:bg-gray-100 font-semibold text-xs">Today</button>
                <button className="px-3 py-1 rounded border border-gray-300 bg-gray-50 hover:bg-gray-100 font-semibold text-xs">List</button>
                <button className={`px-3 py-1 rounded border font-semibold text-xs ${calendarView==='day' ? 'bg-white text-black border-blue-600' : 'bg-white text-blue-700 border-blue-200 hover:bg-blue-50'}`} onClick={()=>setCalendarView('day')}>Day</button>
                <button className={`px-3 py-1 rounded border font-semibold text-xs ${calendarView==='week' ? 'bg-purple-600 text-white border-purple-600' : 'bg-white text-purple-700 border-purple-200 hover:bg-purple-50'}`} onClick={()=>setCalendarView('week')}>Week</button>
                <button className={`px-3 py-1 rounded border font-semibold text-xs ${calendarView==='month' ? 'bg-green-600 text-white border-green-600' : 'bg-white text-green-700 border-green-200 hover:bg-green-50'}`} onClick={()=>setCalendarView('month')}>Month</button>
              </div> */}
            </div>
            {calendarView === 'week' && (
              <div className="overflow-x-auto px-4 pb-4">
                <div className="grid grid-cols-8 border-t border-l border-gray-200 min-w-[700px] text-xs">
                  <div className="bg-gray-50 border-b border-r border-gray-200 h-8 flex items-center justify-center font-semibold text-gray-500"> </div>
                  {/* {weekDates.map((date, idx) => (
                    <div key={idx} className="bg-gray-50 border-b border-r border-gray-200 h-8 flex flex-col items-center justify-center font-semibold text-gray-700">
                      <span>{date.toLocaleDateString('en-US', { weekday: 'short' })}</span>
                      <span>{date.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' })}</span>
                    </div>
                  ))}
                  {hours.map((h, i) => (
                    <>
                      <div key={i} className="border-b border-r border-gray-200 h-8 flex items-center justify-end pr-2 text-gray-400 font-mono">
                        {h === 0 ? '12AM' : h < 12 ? `${h}AM` : h === 12 ? '12PM' : `${h-12}PM`}
                      </div>
                      {weekDates.map((date, idx) => (
                        <div key={idx} className="border-b border-r border-gray-200 h-8 bg-white"></div>
                      ))}
                    </>
                  ))} */}
                </div>
              </div>
            )}
            {calendarView === 'day' && (
              <div className="overflow-x-auto px-4 pb-4">
                <div className="w-64 border-t border-l border-gray-200 text-xs">
                  <div className="bg-gray-50 border-b border-r border-gray-200 h-8 flex flex-col items-center justify-center font-semibold text-gray-700">
                    <span>{currentDate.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}</span>
                  </div>
                  {/* {hours.map((h, i) => (
                    <div key={i} className="border-b border-r border-gray-200 h-8 flex items-center justify-between px-2 bg-white">
                      <span className="text-gray-400 font-mono w-12">
                        {h === 0 ? '12AM' : h < 12 ? `${h}AM` : h === 12 ? '12PM' : `${h-12}PM`}
                      </span>
                      <span className="text-gray-300 italic">(No events)</span>
                    </div>
                  ))} */}
                </div>
              </div>
            )}
            {/* {calendarView === 'month' && (
              <div className="overflow-x-auto px-4 pb-4">
                <MonthGrid currentDate={currentDate} />
              </div>
            )}
            {calendarView === 'list' && (
              <div className="flex items-center justify-center h-40 text-gray-400 text-base font-semibold">List view coming soon...</div>
            )} */}
          </div>
        </div>
      )}
    </div>
  );
}

function ActionsDropdown({ instructorId }) {
  const [open, setOpen] = useState(false);
  const [archiveError, setArchiveError] = useState(null);
  const router = useRouter();

  const archiveInstructor = async () => {
    setArchiveError(null);
    const token = Cookies.get("accessToken");
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_REST_API_BASE_URL}/api/admin/archive/${instructorId}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to archive instructor');
      }
      alert('Instructor archived successfully');
      setOpen(false);
      router.push('/instructors'); // Redirect to instructors list or another page
    } catch (err) {
      setArchiveError(err.message || 'Could not archive instructor');
      setOpen(false);
    }
  };

  return (
    <div className="relative inline-block text-left">
      <button
        onClick={() => setOpen((v) => !v)}
        className="px-3 py-1 rounded border border-gray-300 bg-white text-gray-700 text-sm font-medium shadow-sm hover:bg-gray-100 flex items-center gap-1"
        type="button"
      >
        Actions
        <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
      </button>
      {open && (
        <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-20">
          <div className="py-1 text-xs">
            <button className="w-full text-left px-3 py-1 hover:bg-gray-100 text-gray-700 whitespace-nowrap" onClick={() => { setOpen(false); alert('Clear Session clicked'); }}>Clear Session</button>
            <button className="w-full text-left px-3 py-1 hover:bg-gray-100 text-gray-700 whitespace-nowrap" onClick={() => { setOpen(false); alert('Send Reset Password Link clicked'); }}>Send Reset Password Link</button>
            <button className="w-full text-left px-3 py-1 hover:bg-gray-100 text-gray-700 whitespace-nowrap" onClick={archiveInstructor}>Archive Instructor</button>
          </div>
        </div>
      )}
      {archiveError && <div className="text-red-500 text-xs mt-2">{archiveError}</div>}
    </div>
  );
}

function MonthGrid({ currentDate }) {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startDay = firstDay.getDay();
  const weeks = [];
  let day = 1 - startDay;
  for (let w = 0; w < 6; w++) {
    const week = [];
    for (let d = 0; d < 7; d++) {
      if (day > 0 && day <= daysInMonth) {
        week.push(day);
      } else {
        week.push(null);
      }
      day++;
    }
    weeks.push(week);
    if (day > daysInMonth) break;
  }
  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return (
    <div className="inline-block border border-gray-200 rounded bg-white">
      <div className="grid grid-cols-7">
        {weekdays.map((wd) => (
          <div key={wd} className="bg-gray-50 border-b border-r border-gray-200 h-8 flex items-center justify-center font-semibold text-gray-700 text-xs">{wd}</div>
        ))}
        {weeks.flat().map((d, i) => (
          <div key={i} className={`border-b border-r border-gray-200 h-12 w-16 flex items-center justify-center ${d ? 'bg-white' : 'bg-gray-50'}`}>{d ? d : ''}</div>
        ))}
      </div>
    </div>
  );
}