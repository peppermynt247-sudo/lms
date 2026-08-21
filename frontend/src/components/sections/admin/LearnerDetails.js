'use client';

import { useState, useEffect, useRef } from 'react';
import { ChevronLeft, MoreVertical, Plus, X, KeyRound, RefreshCw, Eye } from 'lucide-react';
import { useRouter, useParams } from 'next/navigation';
import axios from 'axios';
import Cookies from 'js-cookie';
import { toast } from 'react-toastify';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import React from 'react';

import EditAdmission from '../../learners/EditAdmission';
import Profile from './learnerdetails/profile/Profile';
import EnrollmentsTab from './learners/tabs/EnrollmentsTab';
import AdmissionsFeesTab from './learners/tabs/AdmissionsFeesTab';
import PaymentsTab from './learners/tabs/PaymentsTab';
import CertificatesTab from './learners/tabs/CertificatesTab';
import ReferralsTab from './learners/tabs/ReferralsTab';

const tabs = [
  'Enrollments',
  'Admission / Fees',
  'Payments',
  'Certificates',
  'Profile',
  'Referrals'
];





// Utility to get value by possible field names
const getField = (obj, ...fields) => fields.find(f => obj[f] !== undefined) ? obj[fields.find(f => obj[f] !== undefined)] : '-';

// Utility to format attendance: show only date if value is a datetime string
const formatAttendance = (val) => {
  if (!val) return '-';
  // If value is a string and looks like a datetime, extract only the date part
  if (typeof val === 'string' && val.match(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/)) {
    return val.split('T')[0];
  }
  // If value is a string and looks like 'YYYY-MM-DD HH:MM:SS', extract date
  if (typeof val === 'string' && val.match(/\d{4}-\d{2}-\d{2} \d{2}:\d{2}/)) {
    return val.split(' ')[0];
  }
  // If value is a string and looks like 'DD/MM/YYYY HH:MM', extract date
  if (typeof val === 'string' && val.match(/\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}/)) {
    return val.split(' ')[0];
  }
  return val;
};

const STATE_OPTIONS = [
  '', 'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal', 'Delhi', 'Other'
];
const COUNTRY_OPTIONS = ['', 'India', 'USA', 'UK', 'Canada', 'Australia', 'Other'];
const GENDER_OPTIONS = ['', 'Male', 'Female', 'Other'];
const EDUCATION_LEVEL_OPTIONS = [
  'Class 10th',
  'Class 12th',
  'Diploma',
  'Degree',
  "UG (Bachelor's)",
  "PG (Master's)"
];

// Helper to convert DD-MM-YYYY to YYYY-MM-DD
function toISODate(dateStr) {
  if (!dateStr) return '';
  if (dateStr.includes('-')) {
    const parts = dateStr.split('-');
    // If already in YYYY-MM-DD, return as is
    if (parts[0].length === 4) return dateStr;
    // If in DD-MM-YYYY, convert
    if (parts[2].length === 4) return `${parts[2]}-${parts[1]}-${parts[0]}`;
  }
  return dateStr;
}

export default function LearnerDetails() {
  // Helper function to get used education levels
  const getUsedEducationLevels = (educations, currentIndex) => {
    return (educations || [])
      .map((edu, idx) => ({ level: edu.level, index: idx }))
      .filter(item => item.level && item.index !== currentIndex)
      .map(item => item.level);
  };

  // Helper function to check if an installment can be paid (sequential payment logic)
  const canPayInstallment = (installments, currentInstallment) => {
    if (!installments || !Array.isArray(installments)) return false;

    // Find the index of the current installment
    const currentIndex = installments.findIndex(inst => inst.installmentId === currentInstallment.installmentId);
    if (currentIndex === -1) return false;

    // Check if all previous installments are paid
    for (let i = 0; i < currentIndex; i++) {
      if (installments[i].status?.toLowerCase() !== 'paid') {
        return false;
      }
    }

    return true;
  };
  const [activeTab, setActiveTab] = useState('Enrollments');
  const [learner, setLearner] = useState(null);
  const router = useRouter();
  const { id } = useParams();
  const [error, setError] = useState(null);
  
  // State for actions dropdown
  const [actionsDropdownOpen, setActionsDropdownOpen] = useState(false);
  const actionsDropdownRef = useRef();
  
  // State for modals
  const [showUpdateStatusModal, setShowUpdateStatusModal] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('');
  const [updateStatusLoading, setUpdateStatusLoading] = useState(false);
  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false);
  const [resetPasswordValue, setResetPasswordValue] = useState('');
  const [resetPasswordLoading, setResetPasswordLoading] = useState(false);
  const [confirmResetPasswordValue, setConfirmResetPasswordValue] = useState('');
  const [resetPasswordError, setResetPasswordError] = useState('');
  const [showRevenueCard, setShowRevenueCard] = useState(false);
  
  // State for profile
  const [editProfile, setEditProfile] = useState({
    email: '', name: '', phone: '', parentName: '', parentContact: '', parentEmail: '',
    gender: '', dob: null, whatsappNumber: '', address: '', qualification: '', aadhar: '',
    pan: '', city: 'Bangalore', state: 'Karnataka', country: '', pincode: '', educations: [],
  });
  const [educations, setEducations] = useState([]);
  
  // State for data fetching
  const [enrollments, setEnrollments] = useState([]);
  const [enrollmentsLoading, setEnrollmentsLoading] = useState(true);
  const [admissions, setAdmissions] = useState([]);
  const [admissionsLoading, setAdmissionsLoading] = useState(true);
  const [payments, setPayments] = useState([]);
  const [paymentsLoading, setPaymentsLoading] = useState(true);
  const [certificates, setCertificates] = useState([]);
  const [certificatesLoading, setCertificatesLoading] = useState(true);
  const [referrals, setReferrals] = useState([]);
  const [referralsLoading, setReferralsLoading] = useState(false);
  const [referralsError, setReferralsError] = useState(null);
  const [ownReferral, setOwnReferral] = useState({ code: 'N/A', wallet: 'N/A' });
  const [courses, setCourses] = useState([]);
  
  // State for certificate management
  const [certificateTemplates, setCertificateTemplates] = useState([]);
  const [certificateTemplatesLoading, setCertificateTemplatesLoading] = useState(false);
  const [editCertificateData, setEditCertificateData] = useState(null);
  const [editCertificateDrawerOpen, setEditCertificateDrawerOpen] = useState(false);
  const [editIssuedDate, setEditIssuedDate] = useState('');
  const [editStartDate, setEditStartDate] = useState('');
  const [editEndDate, setEditEndDate] = useState('');
  const [openCertificateDropdown, setOpenCertificateDropdown] = useState(null);
  
  // State for admission management
  const [selectedAdmission, setSelectedAdmission] = useState(null);
  const [admissionToCancel, setAdmissionToCancel] = useState(null);
  const [showCancelAdmissionModal, setShowCancelAdmissionModal] = useState(false);
  const [showEditAdmissionModal, setShowEditAdmissionModal] = useState(false);
  const [openAdmissionDropdown, setOpenAdmissionDropdown] = useState(null);
  const [expandedAdmissionRows, setExpandedAdmissionRows] = useState(new Set());
  
  // State for payment management
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentInstallment, setPaymentInstallment] = useState(null);
  const [paymentDate, setPaymentDate] = useState(new Date());
  const [paymentMode, setPaymentMode] = useState('');
  const [paymentReference, setPaymentReference] = useState('');
  const [paymentLoading, setPaymentLoading] = useState(false);

  const openPaymentModal = (installment) => {
    setPaymentInstallment(installment);
    setPaymentDate(new Date());
    setPaymentMode('');
    setPaymentReference('');
    setShowPaymentModal(true);
  };
  const closePaymentModal = () => {
    setShowPaymentModal(false);
    setPaymentInstallment(null);
    setPaymentDate(new Date());
    setPaymentMode('');
    setPaymentReference('');
    setPaymentLoading(false);
  };

  useEffect(() => {
    function handleClickOutside(event) {
      if (actionsDropdownRef.current && !actionsDropdownRef.current.contains(event.target)) {
        setActionsDropdownOpen(false);
      }
    }
    if (actionsDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [actionsDropdownOpen]);

  useEffect(() => {
    const token = Cookies.get("accessToken");
    if (!token) {
      setError("No token found");
      return;
    }
    Promise.all([
      axios.get(`${process.env.NEXT_PUBLIC_BACKEND_REST_API_BASE_URL}/api/admin/profile/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      }),
      axios.get(`${process.env.NEXT_PUBLIC_BACKEND_REST_API_BASE_URL}/api/admin/getstudent/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
    ])
      .then(([profileRes, studentRes]) => {
        setLearner(studentRes.data);

        // Handle profile data from admin endpoint
        if (profileRes.data.success && profileRes.data.data) {
          const profileData = profileRes.data.data;

          // Apply the exact structure from the GET response
          setEditProfile({
            email: profileData.email || '',
            name: profileData.name || '',
            userId: profileData.userId || id || '',
            phone: profileData.phoneNumber || '',
            parentName: profileData.parentName || '',
            parentContact: profileData.parentContact || '',
            parentEmail: profileData.parentEmail || '',
            gender: profileData.gender || '',
            dob: profileData.dob ? new Date(profileData.dob) : null,
            whatsappNumber: profileData.whatsappNumber || '',
            address: profileData.address || '',
            qualification: profileData.qualification || '',
            aadhar: profileData.aadhar || '',
            pan: profileData.pan || '',
            city: profileData.city || '',
            state: profileData.state || '',
            country: profileData.country || '',
            pincode: profileData.pincode || '',
            resume: profileData.resume || null,
            educations: profileData.educations || [],
            experiences: profileData.experiences || [],
            skills: profileData.skills || [],
            languages: profileData.languages || [],
          });
          setEducations(profileData.educations || []);
        } else {
        }

        setError(null);
      })
      .catch(err => {
        setError("Failed to fetch learner details. The user may not exist or data is incomplete.");
        setLearner(null);
      });
  }, [id]);

  // Function to refresh profile data after updates
  const refreshProfileData = async () => {
    if (!id) return;
    const token = Cookies.get('accessToken');
    if (!token) return;

    try {
      const profileRes = await axios.get(`${process.env.NEXT_PUBLIC_BACKEND_REST_API_BASE_URL}/api/admin/profile/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (profileRes.data.success && profileRes.data.data) {
        const profileData = profileRes.data.data;

        // Apply the exact structure from the GET response
        setEditProfile({
          email: profileData.email || '',
          name: profileData.name || '',
          userId: profileData.userId || id || '',
          phone: profileData.phoneNumber || '',
          parentName: profileData.parentName || '',
          parentContact: profileData.parentContact || '',
          parentEmail: profileData.parentEmail || '',
          gender: profileData.gender || '',
          dob: profileData.dob ? new Date(profileData.dob) : null,
          whatsappNumber: profileData.whatsappNumber || '',
          address: profileData.address || '',
          qualification: profileData.qualification || '',
          aadhar: profileData.aadhar || '',
          pan: profileData.pan || '',
          city: profileData.city || '',
          state: profileData.state || '',
          country: profileData.country || '',
          pincode: profileData.pincode || '',
          resume: profileData.resume || null,
          educations: profileData.educations || [],
          experiences: profileData.experiences || [],
          skills: profileData.skills || [],
          languages: profileData.languages || [],
        });
        setEducations(profileData.educations || []);
      } else {
      }
    } catch (error) {
    }
  };



  useEffect(() => {
    if (editCertificateDrawerOpen && editCertificateData) {
      setEditIssuedDate(toISODate(editCertificateData.issuedAt));
      setEditStartDate(toISODate(editCertificateData.startDate));
      setEditEndDate(toISODate(editCertificateData.endDate));
    }
  }, [editCertificateDrawerOpen, editCertificateData]);

  // Enrollments with fallback to course learners if empty
  useEffect(() => {
    if (!id) return;
    setEnrollmentsLoading(true);
    const token = Cookies.get('accessToken');
    axios.get(`${process.env.NEXT_PUBLIC_BACKEND_REST_API_BASE_URL}/api/enrollments/enrolledcourses?userid=${id}`,
      token ? { headers: { Authorization: `Bearer ${token}` } } : undefined)
      .then(async res => {
        let enrollments = Array.isArray(res.data) ? res.data : (res.data.data || res.data.Data || []);
        if (!enrollments || enrollments.length === 0) {
          // Fallback: check all courses for this user
          let fallbackEnrollments = [];
          // Fetch all courses
          let allCourses = [];
          try {
            const coursesRes = await axios.get(`${process.env.NEXT_PUBLIC_BACKEND_REST_API_BASE_URL}/api/courses`,
              token ? { headers: { Authorization: `Bearer ${token}` } } : undefined);
            if (Array.isArray(coursesRes.data.data?.content)) allCourses = coursesRes.data.data.content;
            else if (Array.isArray(coursesRes.data.data)) allCourses = coursesRes.data.data;
            else if (Array.isArray(res.data)) allCourses = res.data;
          } catch { }
          // For each course, check if user is a learner
          for (const course of allCourses) {
            try {
              const learnersRes = await axios.get(`${process.env.NEXT_PUBLIC_BACKEND_REST_API_BASE_URL}/api/courses/learners?courseId=${course.courseId || course.id || course.course_id}`,
                token ? { headers: { Authorization: `Bearer ${token}` } } : undefined);
              const learners = Array.isArray(learnersRes.data.data) ? learnersRes.data.data : [];
              const found = learners.find(l => String(l.email).toLowerCase() === String(learner?.email).toLowerCase());
              if (found) {
                fallbackEnrollments.push({
                  courseName: course.title || course.name,
                  batchName: found.batchName || found.batch_name || '-',
                  attendance: found.enrolled || found.attendance || '-',
                  progress: found.progressPercentage || found.progress_percentage || 0,
                  enrolled: found.enrolled,
                  email: found.email,
                  name: found.name
                });
              }
            } catch { }
          }
          enrollments = fallbackEnrollments;
        }
        setEnrollments(enrollments);
        setEnrollmentsLoading(false);
      })
      .catch(() => setEnrollmentsLoading(false));
  }, [id]);

  // Function to fetch admissions data
  const fetchAdmissions = async () => {
    if (!id) return;
    setAdmissionsLoading(true);
    const token = Cookies.get('accessToken');

    try {
      const res = await axios.get(`${process.env.NEXT_PUBLIC_BACKEND_REST_API_BASE_URL}/api/admission/getadmission?userid=${id}`,
        token ? { headers: { Authorization: `Bearer ${token}` } } : undefined);

      const admissionsData = Array.isArray(res.data) ? res.data : (res.data.Data || res.data.data || []);
      setAdmissions(admissionsData);
    } catch (error) {
      setAdmissions([]);
    } finally {
      setAdmissionsLoading(false);
    }
  };

  // Admissions
  useEffect(() => {
    fetchAdmissions();
  }, [id]);

  // Payments
  useEffect(() => {
    if (!id) return;
    setPaymentsLoading(true);
    const token = Cookies.get('accessToken');

    const fetchPayments = async () => {
      try {
        const res = await axios.get(`${process.env.NEXT_PUBLIC_BACKEND_REST_API_BASE_URL}/api/payment/getpayments?userid=${id}`,
          token ? { headers: { Authorization: `Bearer ${token}` } } : undefined);

        if (res.data && res.data.success) {
          const paymentsData = res.data.Data || [];

          // Fetch course details for each payment to get course names
          const paymentsWithCourseInfo = await Promise.all(
            paymentsData.map(async (payment, index) => {
              if (payment.courseId) {
                try {
                  const courseRes = await axios.get(`${process.env.NEXT_PUBLIC_BACKEND_REST_API_BASE_URL}/api/courses/${payment.courseId}`,
                    token ? { headers: { Authorization: `Bearer ${token}` } } : undefined);
                  return {
                    ...payment,
                    courseName: courseRes.data?.title || courseRes.data?.name || 'Unknown Course',
                    serialNumber: index + 1
                  };
                } catch (error) {
                  return {
                    ...payment,
                    courseName: 'Unknown Course',
                    serialNumber: index + 1
                  };
                }
              } else {
                return {
                  ...payment,
                  courseName: 'No Course',
                  serialNumber: index + 1
                };
              }
            })
          );

          setPayments(paymentsWithCourseInfo);
        } else {
          setPayments([]);
        }
      } catch (error) {
        setPayments([]);
      } finally {
        setPaymentsLoading(false);
      }
    };

    fetchPayments();
  }, [id]);

  // Certificates
  useEffect(() => {
    if (!id) return;
    setCertificatesLoading(true);
    const token = Cookies.get('accessToken');
    axios.get(`${process.env.NEXT_PUBLIC_BACKEND_REST_API_BASE_URL}/api/certificates/user?userid=${id}`,
      token ? { headers: { Authorization: `Bearer ${token}` } } : undefined)
      .then(res => {
        setCertificates(Array.isArray(res.data) ? res.data : (res.data.data || res.data.Data || []));
        setCertificatesLoading(false);
      })
      .catch(() => setCertificatesLoading(false));
  }, [id]);

  // Fetch all courses (auth required, similar to SingleEnrollment.js)
  useEffect(() => {
    const token = Cookies.get('accessToken');
    if (!token) return;
    // Try legacy endpoint first
    axios.get(`${process.env.NEXT_PUBLIC_BACKEND_REST_API_BASE_URL}/api/courses/legacy`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => {
        let arr = [];
        if (res.data.data && Array.isArray(res.data.data.content)) {
          arr = res.data.data.content;
        } else if (res.data.data && Array.isArray(res.data.data)) {
          arr = res.data.data;
        } else if (Array.isArray(res.data)) {
          arr = res.data;
        }
        setCourses(arr);
      })
      .catch(() => {
        // Fallback to paginated endpoint
        axios.get(`${process.env.NEXT_PUBLIC_BACKEND_REST_API_BASE_URL}/api/courses`, {
          headers: { Authorization: `Bearer ${token}` }
        })
          .then(res => {
            let arr = [];
            if (res.data.data && Array.isArray(res.data.data.content)) {
              arr = res.data.data.content;
            } else if (res.data.data && Array.isArray(res.data.data)) {
              arr = res.data.data;
            } else if (Array.isArray(res.data)) {
              arr = res.data;
            }
            setCourses(arr);
          })
          .catch(() => setCourses([]));
      });
  }, []);

  // Fetch referrals when Referrals tab is opened
  useEffect(() => {
    if (activeTab !== 'Referrals' || !id) return;
    setReferralsLoading(true);
    setReferralsError(null);
    const token = Cookies.get('accessToken');
    axios.get(`${process.env.NEXT_PUBLIC_BACKEND_REST_API_BASE_URL}/api/user/referral?userid=${id}`,
      token ? { headers: { Authorization: `Bearer ${token}` } } : undefined)
      .then(res => {
        if (res.data && res.data.success && res.data.Data && res.data.Data.referreds) {
          setReferrals(res.data.Data.referreds);
        } else {
          setReferrals([]);
        }
        setReferralsLoading(false);
      })
      .catch(err => {
        // If 404, treat as no referrals (user-friendly message)
        if (err.response && err.response.status === 404) {
          setReferrals([]);
          setReferralsError(null);
        } else {
          setReferrals([]);
          setReferralsError('Failed to fetch referrals');
        }
        setReferralsLoading(false);
      });
  }, [activeTab, id]);

  // Fetch user's own referral code and wallet
  useEffect(() => {
    if (!id) return;
    const token = Cookies.get('accessToken');
    axios.get(`${process.env.NEXT_PUBLIC_BACKEND_REST_API_BASE_URL}/api/user/referral?userid=${id}`,
      token ? { headers: { Authorization: `Bearer ${token}` } } : undefined)
      .then(res => {
        if (res.data && res.data.success && res.data.Data) {
          setOwnReferral({
            code: res.data.Data.code || 'N/A',
            wallet: res.data.Data.wallet !== undefined ? res.data.Data.wallet : 'N/A',
          });
        } else {
          setOwnReferral({ code: 'N/A', wallet: 'N/A' });
        }
      })
      .catch(() => {
        setOwnReferral({ code: 'N/A', wallet: 'N/A' });
      });
  }, [id]);

  // Function to fetch certificate templates and find matching template
  const fetchCertificateTemplates = async () => {
    try {
      setCertificateTemplatesLoading(true);
      const token = Cookies.get('accessToken');


      const response = await axios.get(`${process.env.NEXT_PUBLIC_BACKEND_REST_API_BASE_URL}/api/certificates/getcertificates`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        const templates = response.data.data || [];
        setCertificateTemplates(templates);
        return templates;
      } else {
        toast.error('Failed to fetch certificate templates: ' + (response.data.message || 'Unknown error'));
        return [];
      }
    } catch (error) {
      toast.error('Failed to fetch certificate templates: ' + (error.response?.data?.message || error.message || 'Network error'));
      return [];
    } finally {
      setCertificateTemplatesLoading(false);
    }
  };

  // Fetch certificate templates for template ID lookup
  useEffect(() => {
    fetchCertificateTemplates();
  }, []);

  // Fetch certificates for the current user
  useEffect(() => {
    if (id) {
      fetchCertificates();
    }
  }, [id]);

  // Function to fetch certificates for the current user
  const fetchCertificates = async () => {
    try {
      setCertificatesLoading(true);
      const token = Cookies.get('accessToken');

      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_BACKEND_REST_API_BASE_URL}/api/certificates/user?userid=${id}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data.success) {
        setCertificates(response.data.data || []);
      } else {

        setCertificates([]);
      }
    } catch (error) {
      setCertificates([]);
    } finally {
      setCertificatesLoading(false);
    }
  };

  if (!learner) return <div>Loading...</div>;

  const renderTabContent = () => {
    switch (activeTab) {
      case 'Enrollments':
        return (
          <EnrollmentsTab 
            enrollments={enrollments} 
            enrollmentsLoading={enrollmentsLoading} 
            getField={getField} 
            formatAttendance={formatAttendance} 
          />
        );
      case 'Admission / Fees':
        return (
          <AdmissionsFeesTab
            admissions={admissions}
            admissionsLoading={admissionsLoading}
            expandedAdmissionRows={expandedAdmissionRows}
            setExpandedAdmissionRows={setExpandedAdmissionRows}
            getField={getField}
            id={id}
            openAdmissionDropdown={openAdmissionDropdown}
            setOpenAdmissionDropdown={setOpenAdmissionDropdown}
            setSelectedAdmission={setSelectedAdmission}
            setShowEditAdmissionModal={setShowEditAdmissionModal}
            setAdmissionToCancel={setAdmissionToCancel}
            setShowCancelAdmissionModal={setShowCancelAdmissionModal}
            canPayInstallment={canPayInstallment}
            openPaymentModal={openPaymentModal}
            showEditAdmissionModal={showEditAdmissionModal}
            selectedAdmission={selectedAdmission}
            EditAdmission={EditAdmission}
            fetchAdmissions={fetchAdmissions}
            showCancelAdmissionModal={showCancelAdmissionModal}
            admissionToCancel={admissionToCancel}
            toast={toast}
            axios={axios}
            Cookies={Cookies}
          />
        );
      case 'Payments':
        return (
          <PaymentsTab 
            payments={payments} 
            paymentsLoading={paymentsLoading} 
            id={id} 
          />
        );
      case 'Certificates':
        return (
          <CertificatesTab
            certificates={certificates}
            certificatesLoading={certificatesLoading}
            getField={getField}
            openCertificateDropdown={openCertificateDropdown}
            setOpenCertificateDropdown={setOpenCertificateDropdown}
            onEdit={handleEditCertificate}
            onDelete={handleDeleteCertificate}
            editCertificateDrawerOpen={editCertificateDrawerOpen}
            setEditCertificateDrawerOpen={setEditCertificateDrawerOpen}
            certificateTemplatesLoading={certificateTemplatesLoading}
            editCertificateData={editCertificateData}
            editIssuedDate={editIssuedDate}
            setEditIssuedDate={setEditIssuedDate}
            editStartDate={editStartDate}
            setEditStartDate={setEditStartDate}
            editEndDate={editEndDate}
            setEditEndDate={setEditEndDate}
            setEditCertificateData={setEditCertificateData}
            id={id}
            toast={toast}
            axios={axios}
            Cookies={Cookies}
          />
        );
      case 'Profile':
        return (
          <Profile 
            editProfile={editProfile} 
            setEditProfile={setEditProfile} 
            userId={id} 
          />
        );
      case 'Referrals':
        return (
          <ReferralsTab
            referrals={referrals}
            referralsLoading={referralsLoading}
            referralsError={referralsError}
            referralCode={ownReferral.code}
            walletBalance={ownReferral.wallet}
            toast={toast}
          />
        );
      default:
        return null;
    }
  };



  // Function to find matching certificate template by name
  const findMatchingTemplate = (certificateName) => {

    // First try exact match
    let template = certificateTemplates.find(template => template.name === certificateName);
    if (template) {
      return template;
    }

    // Try case-insensitive exact match
    template = certificateTemplates.find(template =>
      template.name.toLowerCase() === certificateName.toLowerCase()
    );
    if (template) {
      return template;
    }

    // Try partial matches
    template = certificateTemplates.find(template =>
      template.name.toLowerCase().includes(certificateName.toLowerCase()) ||
      certificateName.toLowerCase().includes(template.name.toLowerCase())
    );
    if (template) {
      return template;
    }

    // Try removing common suffixes/prefixes
    const cleanCertificateName = certificateName.replace(/^(certificate|cert|completion|completion certificate)\s*/i, '').trim();
    template = certificateTemplates.find(template => {
      const cleanTemplateName = template.name.replace(/^(certificate|cert|completion|completion certificate)\s*/i, '').trim();
      return cleanTemplateName === cleanCertificateName ||
        cleanTemplateName.toLowerCase() === cleanCertificateName.toLowerCase();
    });
    if (template) {
      return template;
    }

    return null;
  };



  // Function to handle edit issued certificate
  const handleEditCertificate = async (cert) => {
    try {

      // Find the template ID by matching certificate name
      const matchingTemplate = findMatchingTemplate(cert.certificateName);
      const templateId = matchingTemplate?.templateId || 1;
      const userId = id; // Use the current learner ID from URL


      // Fetch actual certificate details from backend
      const token = Cookies.get('accessToken');
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_BACKEND_REST_API_BASE_URL}/api/certificates/getissuedcertificatedetails/${templateId}/${userId}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data.success) {
        const certificateDetails = response.data.data;

        // Set the certificate data for editing with real data from backend
        const certificateData = {
          certificateName: cert.certificateName,
          courseName: certificateDetails.courseName || '',
          collegeName: certificateDetails.collegeName || '',
          isPublished: certificateDetails.isPublished || false,
          templateId: templateId,
          issuedAt: certificateDetails.issuedAt ? new Date(certificateDetails.issuedAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
          startDate: certificateDetails.startDate ? new Date(certificateDetails.startDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
          endDate: certificateDetails.endDate ? new Date(certificateDetails.endDate).toISOString().split('T')[0] : new Date(Date.now() + 6 * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        };

        setEditCertificateData(certificateData);
        setEditCertificateDrawerOpen(true);
        setOpenCertificateDropdown(null);
      } else {
        console.error('Failed to fetch certificate details:', response.data.message);
        toast.error('Failed to load certificate details');
      }

    } catch (error) {
      console.error('Error in handleEditCertificate:', error);
      toast.error('Failed to load certificate for editing: ' + (error.response?.data?.message || error.message));
    }
  };

  // Function to handle delete certificate
  const handleDeleteCertificate = async (cert) => {
    try {
      
      // Show confirmation dialog
      if (!window.confirm('Are you sure you want to delete this certificate? This action cannot be undone.')) {
        return;
      }

      // Find the template ID by matching certificate name
      const matchingTemplate = findMatchingTemplate(cert.certificateName);
      const templateId = matchingTemplate?.templateId || 1;
      const userId = id; // Use the current learner ID from URL


      const token = Cookies.get('accessToken');
      const response = await axios.delete(
        `${process.env.NEXT_PUBLIC_BACKEND_REST_API_BASE_URL}/api/certificates/deleteissuedcertificate/${templateId}/${userId}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data.success) {
        toast.success('Certificate deleted successfully!');
        // Refresh certificates list
        fetchCertificates();
        setOpenCertificateDropdown(null);
      } else {
        toast.error('Failed to delete certificate: ' + (response.data.message || 'Unknown error'));
      }

    } catch (error) {
      console.error('Error in handleDeleteCertificate:', error);
      toast.error('Failed to delete certificate: ' + (error.response?.data?.message || error.message));
    }
  };



  // Handler for reset password
  const handleAdminResetPassword = async () => {
    setResetPasswordLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_REST_API_BASE_URL}/api/user/resetpassword?email=${encodeURIComponent(learner.email)}&newPassword=${encodeURIComponent(resetPasswordValue)}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${Cookies.get('accessToken')}`,
          'Content-Type': 'application/json',
        },
      });
      const text = await res.text();
      if (res.ok) {
        toast.success('Password reset successful!');
        setShowResetPasswordModal(false);
        setResetPasswordValue('');
      } else {
        toast.error(text || 'Failed to reset password');
      }
    } catch (err) {
      toast.error('Failed to reset password');
    }
    setResetPasswordLoading(false);
  };

  return (
    <div className="p-6 bg-white rounded-xl shadow overflow-y-visible">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <button onClick={() => router.back()} className="hover:bg-gray-100 rounded-full p-2">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{learner.name}</h1>
            <p className="text-gray-500 text-sm mt-1">
              {learner.email} • {learner.phone}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative" ref={actionsDropdownRef}>
            <button
              className="border px-3 py-1.5 rounded-md bg-white text-gray-700 font-semibold flex items-center gap-2 shadow hover:shadow-lg hover:bg-gray-50 transition-all duration-150 text-sm"
              onClick={() => setActionsDropdownOpen(v => !v)}
            >
              <MoreVertical className="w-4 h-4" /> Actions
              <svg className="w-3 h-3 ml-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
            </button>
            {actionsDropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 rounded-xl shadow-2xl bg-white ring-1 ring-black ring-opacity-5 z-30 animate-fade-in">
                <div className="py-2 text-sm">
                  <button className="w-full flex items-center gap-2 text-left px-4 py-2 hover:bg-gray-100 text-gray-700 transition rounded-xl" onClick={() => { setActionsDropdownOpen(false); setShowUpdateStatusModal(true); }}>
                    <RefreshCw className="w-4 h-4 text-green-600" /> Update Status
                  </button>
                  <button className="w-full flex items-center gap-2 text-left px-4 py-2 hover:bg-gray-100 text-gray-700 transition rounded-xl" onClick={() => { setActionsDropdownOpen(false); setShowResetPasswordModal(true); }}>
                    <KeyRound className="w-4 h-4 text-blue-600" /> Reset Password
                  </button>
                </div>
              </div>
            )}
          </div>
          <button
            className="bg-green-600 text-white px-3 py-1.5 rounded-md flex items-center gap-2 font-semibold shadow hover:bg-green-700 transition-all duration-150 text-sm border border-green-700"
            onClick={() => {
              // Route to NewEnrollment with Single Enrollment tab and prefill learner's email or phone
              const params = new URLSearchParams();
              params.append('tab', 'single');
              if (learner.email) params.append('email', learner.email);
              else if (learner.phone) params.append('phone', learner.phone);
              router.push(`/admin/users/new-enrollment?${params.toString()}`);
            }}
          >
            <Plus className="w-4 h-4" /> Add to course
          </button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-4">
        <div>
          <p className="text-sm text-gray-600">REGISTERED ON</p>
          <p className="text-sm font-medium">{learner.createdAt ? new Date(learner.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: '2-digit', day: '2-digit' }) : 'N/A'}</p>
        </div>
        <div>
          <p className="text-sm text-gray-600">REG. ID</p>
          <p className="text-sm font-medium">{learner.abcId ?? 'N/A'}</p>
        </div>
        <div>
          <p className="text-sm text-gray-600">REVENUE</p>
          <div className="flex items-center">
            <p className="text-sm font-medium">₹{learner.revenue || '0.00'}</p>
            <span
              className="inline-flex items-center ml-1 cursor-pointer relative"
              onMouseEnter={() => setShowRevenueCard(true)}
              onMouseLeave={() => setShowRevenueCard(false)}
            >
              <Eye className="w-4 h-4 text-gray-400 hover:text-blue-600 transition" />
              {showRevenueCard && (
                <div className="absolute left-1/2 -translate-x-1/2 mt-2 z-50 flex flex-col bg-white shadow-xl border border-gray-200 rounded-xl p-4 min-w-[220px] text-sm text-gray-800 transition-all duration-150">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-gray-500">TOTAL</span>
                    <span className="font-bold text-blue-900">₹1999.00</span>
                  </div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-gray-500">PAID</span>
                    <span className="font-bold text-green-700">₹0.00</span>
                  </div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-gray-500">OUTSTANDING</span>
                    <span className="font-bold text-orange-500">₹1999.00</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-gray-500">OVERDUE</span>
                    <span className="font-bold text-red-600">₹1999.00</span>
                  </div>
                </div>
              )}
            </span>
          </div>
        </div>
        <div>
          <p className="text-sm text-gray-600">USERNAME</p>
          <p className="text-sm font-medium">{learner.name}</p>
        </div>
      </div>

      <div className="border-b">
        <nav className="flex space-x-1">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-sm font-medium border-b-2 ${activeTab === tab
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
            >
              {tab}
            </button>
          ))}
        </nav>
      </div>

      {renderTabContent()}



      {/* Update Status Modal */}
      {showUpdateStatusModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl p-0 w-full max-w-md relative animate-modern-pop-in overflow-hidden">
            {/* Top Accent & Icon */}
            <div className="w-full flex flex-col items-center justify-center bg-green-500 py-6 rounded-t-3xl">
              <div className="bg-white rounded-full shadow-lg p-3 flex items-center justify-center mb-2 animate-bounce-in">
                <svg xmlns='http://www.w3.org/2000/svg' className='w-10 h-10 text-green-500' fill='none' viewBox='0 0 24 24' stroke='currentColor'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M5 13l4 4L19 7' /></svg>
              </div>
              <h2 className="text-2xl font-extrabold text-white tracking-tight drop-shadow mb-1 animate-fade-in">Update Status</h2>
            </div>
            {/* Card Content */}
            <div className="p-8 pt-6 flex flex-col gap-6 animate-slide-in-up">
              {/* Status Selection */}
              <div>
                <label className="block text-base font-semibold mb-2 text-gray-700">Change status to</label>
                <div className="relative">
                  <select
                    className="w-full border border-gray-300 rounded-xl px-5 py-3 text-lg appearance-none focus:ring-2 focus:ring-green-300 focus:border-green-500 transition-all bg-white font-semibold shadow-md outline-none"
                    value={selectedStatus}
                    onChange={e => setSelectedStatus(e.target.value)}
                  >
                    <option value="">Select status</option>
                    <option value="REGISTERED">Registered</option>
                    <option value="ADMITTED">Admitted</option>
                  </select>
                  <ChevronLeft className="w-5 h-5 absolute right-3 top-1/2 -translate-y-1/2 rotate-[-90deg] text-gray-400 pointer-events-none" />
                </div>
              </div>
              {/* Action Buttons */}
              <div className="flex justify-end gap-3 mt-2">
                <button
                  className="px-5 py-2 border-2 border-gray-200 rounded-xl font-semibold text-gray-700 bg-white hover:bg-gray-100 transition-all shadow-sm disabled:opacity-60"
                  onClick={() => setShowUpdateStatusModal(false)}
                  disabled={updateStatusLoading}
                >
                  Cancel
                </button>
                <button
                  className={`px-5 py-2 rounded-xl font-semibold text-white transition-all duration-200 shadow-lg flex items-center gap-2 ${!selectedStatus || updateStatusLoading
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-green-500 hover:bg-green-600 active:bg-green-700'
                    }`}
                  disabled={!selectedStatus || updateStatusLoading}
                  onClick={async () => {
                    if (!selectedStatus) return;
                    setUpdateStatusLoading(true);
                    try {
                      const token = Cookies.get('accessToken');
                      const response = await axios.put(
                        `${process.env.NEXT_PUBLIC_BACKEND_REST_API_BASE_URL}/api/admin/users/status/${id}?newStatus=${selectedStatus}`,
                        {},
                        {
                          headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                          }
                        }
                      );
                      if (response.status === 200) {
                        toast.success('Status updated successfully!');
                        setShowUpdateStatusModal(false);
                        setSelectedStatus('');
                        window.location.reload();
                      } else {
                        toast.error('Failed to update status');
                      }
                    } catch (error) {
                      console.error('Error updating status:', error);
                      toast.error(error.response?.data?.message || 'Failed to update status');
                    }
                    setUpdateStatusLoading(false);
                  }}
                >
                  {updateStatusLoading ? (
                    <span className="flex items-center gap-2"><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>Updating...</span>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                      <span>Update Status</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}



      {showResetPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md relative animate-slide-in-up">
            <button className="absolute top-4 right-4 text-gray-400 hover:text-black" onClick={() => { setShowResetPasswordModal(false); setResetPasswordValue(''); setConfirmResetPasswordValue(''); setResetPasswordError(''); }}>
              <X className="w-6 h-6" />
            </button>
            <h2 className="text-xl font-bold mb-6 text-center flex items-center justify-center gap-2"><KeyRound className="w-5 h-5 text-blue-600" /> Reset Password</h2>
            <form onSubmit={e => {
              e.preventDefault();
              setResetPasswordError('');
              if (resetPasswordValue !== confirmResetPasswordValue) {
                setResetPasswordError('Passwords do not match');
                return;
              }
              handleAdminResetPassword();
            }}>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">New Password</label>
                <input type="password" className="w-full border rounded-lg px-4 py-2 text-base" value={resetPasswordValue} onChange={e => setResetPasswordValue(e.target.value)} required minLength={8} />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Confirm Password</label>
                <input type="password" className="w-full border rounded-lg px-4 py-2 text-base" value={confirmResetPasswordValue} onChange={e => setConfirmResetPasswordValue(e.target.value)} required minLength={8} />
              </div>
              {resetPasswordError && <div className="text-red-600 text-sm mb-2">{resetPasswordError}</div>}
              <div className="flex justify-end gap-3 mt-4">
                <button type="button" className="px-5 py-2 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-100 transition" onClick={() => { setShowResetPasswordModal(false); setResetPasswordValue(''); setConfirmResetPasswordValue(''); setResetPasswordError(''); }}>Cancel</button>
                <button type="submit" className="px-5 py-2 bg-green-600 text-white rounded-lg font-semibold shadow hover:bg-green-700 transition disabled:opacity-50" disabled={resetPasswordLoading}>{resetPasswordLoading ? 'Resetting...' : 'Reset Password'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md relative">
            <button
              className="absolute top-3 right-3 text-gray-400 hover:text-black text-2xl"
              onClick={closePaymentModal}
            >
              &times;
            </button>
            <h2 className="text-xl font-bold mb-4 text-blue-700">Record Payment</h2>
            <form
              onSubmit={async e => {
                e.preventDefault();

                // Prevent multiple submissions
                if (paymentLoading) {
                  return;
                }

                if (!paymentInstallment?.installmentId) {
                  toast.error('Installment ID missing!');
                  return;
                }
                if (!paymentDate || !paymentMode) {
                  toast.error('Please fill all required fields.');
                  return;
                }
                // Reference required for all except CASH
                if (paymentMode !== 'CASH' && !paymentReference) {
                  toast.error('Reference number is required for non-cash payments.');
                  return;
                }
                setPaymentLoading(true);
                try {
                  const token = Cookies.get('accessToken');
                  const payload = {
                    installmentId: paymentInstallment.installmentId,
                    date: paymentDate instanceof Date ? paymentDate.toISOString() : paymentDate,
                    paymentMode,
                  };
                  if (paymentReference) payload.referenceNo = paymentReference;
                  const res = await axios.post(
                    `${process.env.NEXT_PUBLIC_BACKEND_REST_API_BASE_URL}/api/payment/updateinstallment`,
                    payload,
                    { headers: { 'Authorization': `Bearer ${token}` } }
                  );
                  if (res.data.success) {
                    toast.success('Payment recorded successfully!');
                    closePaymentModal();
                    // Add a small delay before refreshing to ensure modal is closed
                    setTimeout(async () => {
                      try {
                        // Refresh admissions data directly
                        const token = Cookies.get('accessToken');
                        try {
                          const admissionsRes = await axios.get(`${process.env.NEXT_PUBLIC_BACKEND_REST_API_BASE_URL}/api/admission/getadmission?userid=${id}`,
                            token ? { headers: { Authorization: `Bearer ${token}` } } : undefined);
                          setAdmissions(Array.isArray(admissionsRes.data) ? admissionsRes.data : (admissionsRes.data.Data || admissionsRes.data.data || []));
                        } catch (admissionsError) {
                          setAdmissions([]);
                        }

                        // Also refresh payments data
                        const paymentsRes = await axios.get(`${process.env.NEXT_PUBLIC_BACKEND_REST_API_BASE_URL}/api/payment/getpayments?userid=${id}`,
                          token ? { headers: { Authorization: `Bearer ${token}` } } : undefined);

                        if (paymentsRes.data && paymentsRes.data.success) {
                          const paymentsData = paymentsRes.data.Data || [];

                          // Fetch course details for each payment to get course names
                          const paymentsWithCourseInfo = await Promise.all(
                            paymentsData.map(async (payment, index) => {
                              if (payment.courseId) {
                                try {
                                  const courseRes = await axios.get(`${process.env.NEXT_PUBLIC_BACKEND_REST_API_BASE_URL}/api/courses/${payment.courseId}`,
                                    token ? { headers: { Authorization: `Bearer ${token}` } } : undefined);
                                  return {
                                    ...payment,
                                    courseName: courseRes.data?.title || courseRes.data?.name || 'Unknown Course',
                                    serialNumber: index + 1
                                  };
                                } catch (error) {
                                  console.error('Error fetching course details:', error);
                                  return {
                                    ...payment,
                                    courseName: 'Unknown Course',
                                    serialNumber: index + 1
                                  };
                                }
                              } else {
                                return {
                                  ...payment,
                                  courseName: 'No Course',
                                  serialNumber: index + 1
                                };
                              }
                            })
                          );

                          setPayments(paymentsWithCourseInfo);
                        } else {
                          setPayments([]);
                        }
                      } catch (refreshError) {
                        // Don't show toast for refresh errors to avoid conflicts
                      }
                    }, 100);
                  } else {
                    toast.error(res.data.message || 'Failed to record payment.');
                  }
                } catch (err) {
                  toast.error('Failed to record payment.');
                } finally {
                  setPaymentLoading(false);
                }
              }}
              className="flex flex-col gap-4"
            >
              <div>
                <label className="block text-xs font-semibold mb-1 text-gray-700">Payment Date & Time <span className="text-red-500">*</span></label>
                <DatePicker
                  selected={paymentDate}
                  onChange={date => setPaymentDate(date)}
                  showTimeSelect
                  timeFormat="HH:mm"
                  timeIntervals={15}
                  dateFormat="yyyy-MM-dd HH:mm"
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-blue-400 bg-gray-50"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1 text-gray-700">Payment Mode <span className="text-red-500">*</span></label>
                <select
                  value={paymentMode}
                  onChange={e => setPaymentMode(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-blue-400 bg-gray-50"
                  required
                >
                  <option value="">Select Mode</option>
                  <option value="CASH">Cash</option>
                  <option value="UPI">UPI</option>
                  <option value="CARD">Card</option>
                  <option value="BANK">Bank Transfer</option>
                  <option value="CHEQUE">Cheque</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1 text-gray-700">
                  Reference No. {paymentMode !== 'CASH' && <span className="text-red-500">*</span>}
                  <span className="text-xs text-gray-400 ml-1">(Transaction/Reference Number)</span>
                </label>
                <input
                  type="text"
                  value={paymentReference}
                  onChange={e => setPaymentReference(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-blue-400 bg-gray-50"
                  placeholder="Transaction/Reference Number"
                  required={paymentMode !== 'CASH'}
                />
              </div>
              <div className="flex justify-end gap-3 mt-2">
                <button type="button" className="px-5 py-2 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-100 transition" onClick={closePaymentModal}>Cancel</button>
                <button type="submit" className="px-5 py-2 bg-green-600 text-white rounded-lg font-semibold shadow hover:bg-green-700 transition disabled:opacity-50" disabled={paymentLoading}>{paymentLoading ? 'Recording...' : 'Record Payment'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

