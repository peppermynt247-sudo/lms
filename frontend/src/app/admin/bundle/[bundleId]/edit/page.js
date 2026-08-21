"use client";
import React, { useState, useEffect, useRef, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "@utils/api";
import AddCoursesModal from "@/components/AddCoursesModal";
import { toast } from "react-toastify";
import EditBundleBatchModal from "@/components/sections/admin/batches/Components/EditBundleBatchModal";
import EditBundleDetails from "@/components/bundle/EditBundleDetails";

export default function EditBundlePage() {
  const dropdownRef = useRef(null);
  const { bundleId } = useParams();
  const [activeTab, setActiveTab] = useState("details");
  const [loading, setLoading] = useState(true);
  const [bundle, setBundle] = useState(null);
  const [form, setForm] = useState({ title: "", description: "", price: "" });
  const [thumbnailPreview, setThumbnailPreview] = useState("");
  const [thumbnail, setThumbnail] = useState(null);
  const [showAddCoursesModal, setShowAddCoursesModal] = useState(false);
  const [openMenuIdx, setOpenMenuIdx] = useState(null);
  const [selectedBatch, setSelectedBatch] = useState("");
  const [batchDropdownOpen, setBatchDropdownOpen] = useState(false);
  const [allBatches, setAllBatches] = useState([]);
  const [batchesLoading, setBatchesLoading] = useState(false);
  const [batchesError, setBatchesError] = useState(null);
  // Batches tab state
  const [bundleBatches, setBundleBatches] = useState([]);
  const [batchesTabLoading, setBatchesTabLoading] = useState(false);
  const [batchesTabError, setBatchesTabError] = useState(null);
  const [batchStatusFilter, setBatchStatusFilter] = useState("Active Batches");
  const router = useRouter();

  // Edit batch modal state (for bundle batches)
  const [isEditBatchModalOpen, setIsEditBatchModalOpen] = useState(false);
  const [editBatchInitialData, setEditBatchInitialData] = useState(null);
  const [instructorData, setInstructorData] = useState([]);

  // Learners tab state
  const [learners, setLearners] = useState([]);
  const [learnersLoading, setLearnersLoading] = useState(false);
  const [learnersError, setLearnersError] = useState(null);
  const [openLearnerMenuIdx, setOpenLearnerMenuIdx] = useState(null);
  const [openCourseMenuIdx, setOpenCourseMenuIdx] = useState(null);
  const [courseDropdownOpen, setCourseDropdownOpen] = useState(false);
  
  // Learners tab batches state (separate from batches tab)
  const [learnersTabBatches, setLearnersTabBatches] = useState([]);
  const [learnersTabBatchesLoading, setLearnersTabBatchesLoading] = useState(false);
  const [learnersTabBatchesError, setLearnersTabBatchesError] = useState(null);

  // Action button dropdown state for batches
  const [batchDropdownId, setBatchDropdownId] = useState(null);
  const batchDropdownRef = useRef(null);

  // Memoize linkedCourseIds to prevent infinite re-renders
  const linkedCourseIds = useMemo(() => {
    return bundle?.courses ? bundle.courses.map(c => c.courseId) : [];
  }, [bundle?.courses]);



  // Learners tab data and handlers
 
  const handleMenuClick = (idx) => {
    setOpenMenuIdx(openMenuIdx === idx ? null : idx);
  };

  const handleOption = (option, learner) => {
    setOpenMenuIdx(null);
    alert(`${option} for ${learner.name}`); // Replace with real logic
  };

  // Action button handlers for batches
  const handleBatchEdit = (batchId) => {
    const batchData = filteredBatches.find((b) => b.batchId === batchId);
    if (batchData) {
      // Navigate to batch edit page or open edit modal
      router.push(`/admin/batches/${batchId}`);
    }
    setBatchDropdownId(null);
  };

  const handleBatchMakeDefault = async (batchId) => {
    try {
      // Find courseId from batch data
      const batchData = bundleBatches.find(b => b.batchId === batchId);
      const courseId = batchData?.courses?.[0]?.courseId;
      if (!courseId) {
        toast.error('Course ID not found for this batch.');
        return;
      }
      await api.put(`/api/courses/${courseId}/batches/${batchId}/set-default`);
      toast.success('Batch set as default successfully.');
      // Refresh batches data
      fetchBundleBatches();
    } catch (err) {
      toast.error('Failed to set batch as default.');
    }
    setBatchDropdownId(null);
  };

  const handleBatchDelete = async (batchId) => {
    if (window.confirm('Are you sure you want to delete this batch?')) {
      try {
        await api.delete(`/api/batches/${batchId}`);
        toast.success('Batch deleted successfully');
        // Refresh batches data
        fetchBundleBatches();
      } catch (err) {
        toast.error('Failed to delete batch.');
      }
    }
    setBatchDropdownId(null);
  };

  // Function to fetch bundle batches
  const fetchBundleBatches = async () => {
    setBatchesTabLoading(true);
    setBatchesTabError(null);
    try {
      const res = await api.get(`/api/course-bundles/${bundleId}/batches`);
      setBundleBatches(res.data.data || []);
    } catch (err) {
      setBatchesTabError("Failed to fetch batches");
      setBundleBatches([]);
    } finally {
      setBatchesTabLoading(false);
    }
  };

  // Fetch instructors for edit modal (once when Batches tab is active)
  useEffect(() => {
    if (activeTab !== "batches") return;
    api
      .get("/api/admin/getadminsandinstructors")
      .then((res) => setInstructorData(res.data || []))
      .catch(() => setInstructorData([]));
  }, [activeTab]);

  const handleOpenEditBundleBatch = (rawBatch) => {
    const normalized = {
      batchId: rawBatch.batchId || rawBatch.id,
      batchName: rawBatch.batchName || rawBatch.name,
      startDate: rawBatch.startDate || null,
      endDate: rawBatch.endDate || null,
      status: rawBatch.status,
      accommodation: rawBatch.accommodation,
      batchManagerId: rawBatch.batchManager?.id || rawBatch.batchManagerId || null,
      additionalBatchManager: rawBatch.additionalBatchManager || null,
      courses: rawBatch.courses || [],
      bundleId: rawBatch.bundleId || (bundle?.bundleId || Number(bundleId)),
      default: rawBatch.default || false,
    };
    setEditBatchInitialData(normalized);
    setIsEditBatchModalOpen(true);
  };

  const handleUpdateBundleBatch = async (updatedData) => {
    try {
      await api.put(`/api/batches/${updatedData.batchId}`, updatedData);
      toast.success("Batch updated successfully");
      setIsEditBatchModalOpen(false);
      setEditBatchInitialData(null);
      fetchBundleBatches();
    } catch (err) {
      toast.error("Failed to update batch");
    }
  };

  // Handle click outside dropdown
  useEffect(() => {
    if (!batchDropdownId) return;
    const handleClickOutside = (event) => {
      if (batchDropdownRef.current && !batchDropdownRef.current.contains(event.target)) {
        setBatchDropdownId(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [batchDropdownId]);

  // Function to fetch batches from API
  const fetchBatches = async () => {
    setBatchesLoading(true);
    setBatchesError(null);
    try {
     
      
      const response = await api.get('/api/batches');
    // Debug log
      
      // Handle paginated response structure
      let data = [];
      if (response.data && response.data.data) {
        // If it's wrapped in ApiResponse with data field
        if (response.data.data.content) {
          // Paginated response
          data = response.data.data.content;
        } else {
          // Direct data array
          data = response.data.data;
        }
      } else if (response.data) {
        // Direct response
        if (response.data.content) {
          // Paginated response
          data = response.data.content;
        } else {
          
          data = response.data;
        }
      }
      
      setAllBatches(Array.isArray(data) ? data : []);
      
      // Set the first batch as selected if no batch is currently selected
      if (data && data.length > 0 && !selectedBatch) {
        setSelectedBatch(data[0].batchName || data[0].name || data[0].id);
      }
    } catch (error) {
      setBatchesError(`Failed to fetch batches: ${error.response?.status || error.message}`);
      
          // Set the first batch as selected if no batch is currently selected
          if (!selectedBatch) {
            setSelectedBatch(mockBatches[0].batchName);
          }
    } finally {
      setBatchesLoading(false);
    }
  };

  // Get learners for the selected batch (placeholder for now)
  // This will be replaced with actual API call

  // Fetch bundle data
  const fetchBundle = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/api/course-bundles/${bundleId}`);
      const data = res.data.data || res.data;
      setBundle(data);
      setForm({
        title: data.title || "",
        description: data.description || "",
        price: data.price ? data.price.toString() : "",
        // Backend uses `validityInDays`; fall back to `validity` if present
        validity: (data.validityInDays ?? data.validity ?? "") !== ""
          ? String(data.validityInDays ?? data.validity)
          : ""
      });
    } catch (e) {
      setBundle(null);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchBundle();
  }, [bundleId]);

  // Fetch batches when learners tab is active
  useEffect(() => {
    if (activeTab === "learners") {
      fetchBatches();
    }
  }, [activeTab]);

  // Fetch batches for this bundle when Batches tab is active
  useEffect(() => {
    if (activeTab === "batches") {
      fetchBundleBatches();
    }
  }, [activeTab, bundleId]);

  // Fetch batches for learners tab dropdown
  useEffect(() => {
    if (activeTab === "learners") {
      setLearnersTabBatchesLoading(true);
      setLearnersTabBatchesError(null);
      api.get(`/api/course-bundles/${bundleId}/batches`)
        .then(res => {
          setLearnersTabBatches(res.data.data || []);
          // Auto-select first batch if available and no batch is selected
          if (res.data.data && res.data.data.length > 0 && !selectedBatch) {
            const firstBatch = res.data.data[0];
            setSelectedBatch(firstBatch.batchId || firstBatch.id);
          }
        })
        .catch(err => {
          setLearnersTabBatchesError("Failed to fetch batches");
          setLearnersTabBatches([]);
        })
        .finally(() => setLearnersTabBatchesLoading(false));
    }
  }, [activeTab, bundleId, selectedBatch]);

  // Fetch learners for selected batch
  useEffect(() => {
    if (activeTab === "learners" && selectedBatch) {
      setLearnersLoading(true);
      setLearnersError(null);
      api.get(`/api/batchusers/batch?batchid=${selectedBatch}`)
        .then(res => {
          setLearners(res.data.data || []);
        })
        .catch(err => {
          setLearnersError("Failed to fetch learners");
          setLearners([]);
        })
        .finally(() => setLearnersLoading(false));
    }
  }, [activeTab, selectedBatch]);

  // Handle clicking outside dropdown to close it
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (batchDropdownOpen && !event.target.closest('.batch-dropdown-trigger')) {
        setBatchDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [batchDropdownOpen]);

  const handleChange = e => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  };

  const handleThumbnailChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setThumbnail(file);
      const reader = new FileReader();
      reader.onloadend = () => setThumbnailPreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  // Filtering logic for batches
  const filteredBatches = bundleBatches.filter(batch => {
    if (batchStatusFilter === "All Batches") return true;
    if (batchStatusFilter === "Active Batches") return batch.status === "ACTIVE";
    if (batchStatusFilter === "Completed Batches") return batch.status === "COMPLETED";
    if (batchStatusFilter === "Archived Batches") return batch.status === "ARCHIVED";
    return true;
  });

  const [showPlanSidebar, setShowPlanSidebar] = useState(false);
  const [installments, setInstallments] = useState([]);
  const handleInstallmentChange = (idx, field, value) => {
    setInstallments(insts => insts.map((inst, i) => i === idx ? { ...inst, [field]: value } : inst));
  };
  const handleAddInstallment = () => {
    setInstallments(insts => [...insts, { name: `Instalment ${insts.length + 1}`, amount: '', after: insts.length + 1, unit: 'Months' }]);
  };
  const handleDeleteInstallment = idx => {
    setInstallments(insts => insts.filter((_, i) => i !== idx));
  };

  const [bundlePlans, setBundlePlans] = useState([]);
  const [selectedPlanId, setSelectedPlanId] = useState(null);

  // Fetch payment plans for this bundle when Payment and Plans tab is active
  useEffect(() => {
    if (activeTab === "payment-plan") {
      
      api.get(`/api/course-bundles/${bundleId}/pricing-details`).then(res => {
        const plans = (res.data.data && Array.isArray(res.data.data.plans)) ? res.data.data.plans : [];
        setBundlePlans(plans);
        if (plans.length > 0) setSelectedPlanId(plans[0].planId || plans[0].id);
      });
    }
  }, [activeTab, bundleId]);

  // Update selectedPlan to use plansToShow
  const selectedPlan = bundlePlans.find(p => (p.planId || p.id) === selectedPlanId);
  const bundlePrice = bundle?.price || 0;
  const numInstallments = selectedPlan?.installments || (selectedPlan?.name?.toLowerCase().includes('three') ? 3 : selectedPlan?.name?.toLowerCase().includes('two') ? 2 : 1);
  const perInstallment = numInstallments > 0 ? (bundlePrice / numInstallments).toFixed(2) : bundlePrice;
  const installmentRows = Array.from({ length: numInstallments }, (_, i) => ({
    name: `Installment ${i + 1}`,
    amount: perInstallment,
    after: i + 1,
    unit: "Months"
  }));

  // Sidebar: manage multiple plan containers
  const [sidebarPlans, setSidebarPlans] = useState([]);

  // In the sidebar, show installment breakdown for selected plan
  const [selectedSidebarPlanId, setSelectedSidebarPlanId] = useState('1');
  const selectedSidebarPlan = sidebarPlans.find(p => p.planId === selectedSidebarPlanId);

  // Fetch available payment plans when sidebar opens
  useEffect(() => {
    if (showPlanSidebar) {
      const fetchAvailablePlans = async () => {
        try {
          const res = await api.get("/api/paymentplan/all");
          if (res.data.success && Array.isArray(res.data.data)) {
            const plans = res.data.data.map(plan => ({
              planId: plan.planId,
              name: plan.name,
              description: plan.description,
              installments: plan.billingCycle,
              paymentPlanRules: plan.paymentPlanRules
            }));
            setSidebarPlans(plans);
            if (plans.length > 0) {
              setSelectedSidebarPlanId(plans[0].planId);
              // Update the first container to use the first available plan
              setSidebarPlanContainers(containers => 
                containers.map((container, index) => 
                  index === 0 ? { ...container, selectedPlanId: plans[0].planId } : container
                )
              );
            }
          }
        } catch (error) {
          console.error("Failed to fetch payment plans:", error);
        }
      };
      fetchAvailablePlans();
    }
  }, [showPlanSidebar]);
  const [sidebarPlanContainers, setSidebarPlanContainers] = useState([
    { id: Date.now().toString(), selectedPlanId: '', frozen: false }
  ]);
  const handleSidebarAddPlanContainer = () => {
    const firstPlanId = sidebarPlans.length > 0 ? sidebarPlans[0].planId : '';
    setSidebarPlanContainers(containers => [
      ...containers,
      { id: Date.now().toString(), selectedPlanId: firstPlanId, frozen: false }
    ]);
  };
  const handleSidebarPlanChange = (containerId, newPlanId) => {
    setSidebarPlanContainers(containers =>
      containers.map(c => c.id === containerId ? { ...c, selectedPlanId: newPlanId } : c)
    );
  };

  // Add delete handler for plan containers
  const handleSidebarDeletePlanContainer = (containerId) => {
    setSidebarPlanContainers(containers => containers.filter(c => c.id !== containerId));
  };

  // Function to calculate installments based on selected plan and bundle price
  const calculateInstallmentsForPlan = (plan, bundlePrice) => {
    
    if (!plan || !plan.paymentPlanRules || plan.paymentPlanRules.length === 0) {
      // Fallback: create equal installments based on billing cycle
      const numInstallments = plan?.billingCycle || plan?.installments || 1;
      const perInstallment = (bundlePrice / numInstallments).toFixed(2);
      return Array.from({ length: numInstallments }, (_, i) => ({
        name: `Installment ${i + 1}`,
        amount: perInstallment,
        after: i + 1,
        unit: 'Months',
        weightage: (100 / numInstallments).toFixed(2)
      }));
    }

    // Use actual payment plan rules
    const installments = plan.paymentPlanRules.map((rule, index) => {
      const weightage = rule.weightage || 0;
      const amount = ((bundlePrice * weightage) / 100).toFixed(2);
      return {
        name: `Installment ${rule.installment}`,
        amount: amount,
        after: rule.interval || rule.installment,
        unit: 'Months',
        weightage: weightage
      };
    }).sort((a, b) => a.after - b.after); // Sort by interval
    
    return installments;
  };

  const handleLinkPlanToBundle = async (planId, containerId) => {
    try {
      if (!bundleId || !planId) return;
      await api.post(`/api/course-bundles/${bundleId}/plans`, { planId });
      toast.success('Plan linked to bundle successfully!');
      // Freeze this container
      setSidebarPlanContainers(containers =>
        containers.map(c => c.id === containerId ? { ...c, frozen: true } : c)
      );
    } catch (err) {
      toast.error('Failed to link plan: ' + (err?.response?.data?.message || err.message));
    }
  };

  // New function to save multiple payment plans at once
  const handleSaveMultiplePlans = async () => {
    try {
      if (!bundleId) return;
      
      // Prepare the data for multiple plans
      const plansToLink = sidebarPlanContainers
        .filter(container => !container.frozen && container.selectedPlanId)
        .map(container => ({
          planId: container.selectedPlanId,
          containerId: container.id
        }));

      if (plansToLink.length === 0) {
        toast.error('Please select at least one payment plan to link.');
        return;
      }

      // Send each plan individually using the same API as the Done button
      const promises = plansToLink.map(plan => 
        api.post(`/api/course-bundles/${bundleId}/plans`, { planId: plan.planId })
      );

      await Promise.all(promises);
      
      toast.success(`${plansToLink.length} payment plan(s) linked to bundle successfully!`);
      
      // Close sidebar and refresh plans
      setShowPlanSidebar(false);
      
      // Refresh the bundle plans
      if (activeTab === "payment-plan") {
        const res = await api.get(`/api/course-bundles/${bundleId}/pricing-details`);
        const plans = (res.data.data && Array.isArray(res.data.data.plans)) ? res.data.data.plans : [];
        setBundlePlans(plans);
      }
      
    } catch (err) {
      toast.error('Failed to link payment plans: ' + (err?.response?.data?.message || err.message));
    }
  };

  const handleSaveChanges = async () => {
    try {
      // Backend expects @ModelAttribute, so always use FormData
      const payload = new FormData();
      const current = bundle || {};
      // Strings: use current value if form is undefined; allow empty string if user explicitly cleared
      if (form.title !== undefined) {
        payload.append('title', form.title);
      } else if (current.title !== undefined && current.title !== null) {
        payload.append('title', current.title);
      }

      if (form.description !== undefined) {
        payload.append('description', form.description);
      } else if (current.description !== undefined && current.description !== null) {
        payload.append('description', current.description);
      }

      // Numeric-like fields: avoid sending empty string which could coerce incorrectly
      const priceToSend = form.price === '' || form.price === undefined ? (current.price != null ? `${current.price}` : '') : `${form.price}`;
      if (priceToSend !== '') payload.append('price', priceToSend);

      const validityToSend = form.validity === '' || form.validity === undefined
        ? (current.validityInDays != null ? `${current.validityInDays}` : '')
        : `${form.validity}`;
      if (validityToSend !== '') payload.append('validityInDays', validityToSend);

      // Fields not currently edited in UI: include existing values to prevent data loss on PUT
      if (current.enrollmentLimit != null) payload.append('enrollmentLimit', `${current.enrollmentLimit}`);
      if (current.enrollmentStartDate != null) payload.append('enrollmentStartDate', `${current.enrollmentStartDate}`);
      if (current.enrollmentEndDate != null) payload.append('enrollmentEndDate', `${current.enrollmentEndDate}`);
      if (current.discountPercentage != null) payload.append('discountPercentage', `${current.discountPercentage}`);
      if (current.isFeatured != null) payload.append('isFeatured', `${current.isFeatured}`);

      // Add thumbnail if present (DTO expects 'thumbnailImage')
      if (thumbnail) {
        payload.append('thumbnailImage', thumbnail);
      }
      
      // Set content type for FormData (though browser will set this automatically)
      const config = {
        headers: {
          'Content-Type': 'multipart/form-data',
        }
      };
      
      await api.put(`/api/course-bundles/${bundleId}`, payload, config);
      toast.success('Bundle updated successfully!');
      fetchBundle();
      // Optionally refetch bundle data or update UI
    } catch (err) {
      toast.error('Failed to update bundle: ' + (err?.response?.data?.message || err.message));
    }
  };

  const [showBatchModal, setShowBatchModal] = useState(false);
  const [batchName, setBatchName] = useState("");
  const [selectedCourses, setSelectedCourses] = useState([]);
  const [allCourses, setAllCourses] = useState([]);
  // Remove mockCurriculums, use real API data for curriculums
  const [curriculumsByCourse, setCurriculumsByCourse] = useState({});
  const [selectedCurriculums, setSelectedCurriculums] = useState([]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [loadingCurriculums, setLoadingCurriculums] = useState(false);
  // Add loadingCurriculumsByCourse state
  const [loadingCurriculumsByCourse, setLoadingCurriculumsByCourse] = useState({});
  const [courseHasValidPlan, setCourseHasValidPlan] = useState({});
  const [pricingError, setPricingError] = useState({});

  // Fetch bundle courses when modal opens
  useEffect(() => {
    if (showBatchModal) {
      setLoadingCourses(true);
      api.get(`/api/courses/bundle/${bundleId}`).then(res => {
        let courses = [];
        if (Array.isArray(res.data)) {
          courses = res.data;
        } else if (Array.isArray(res.data.data)) {
          courses = res.data.data;
        } else if (res.data.data && Array.isArray(res.data.data.content)) {
          courses = res.data.data.content;
        } else if (Array.isArray(res.data.content)) {
          courses = res.data.content;
        }
        setAllCourses(courses);
      }).catch(err => {
        toast.error("Failed to fetch bundle courses");
        setAllCourses([]);
      }).finally(() => setLoadingCourses(false));
    }
  }, [showBatchModal, bundleId]);

  const fetchCoursePricingDetails = async (courseId) => {
    try {
      const res = await api.get(`/api/courses/${courseId}/pricing-details`);
      if (res.status === 200) {
        const plans = res?.data?.data?.plans || [];
        if (plans.length === 0) {
          setCourseHasValidPlan(prev => ({ ...prev, [courseId]: false }));
          setPricingError(prev => ({ ...prev, [courseId]: "This course does not have a valid pricing plan. Please set one before creating a batch." }));
          return false;
        } else {
          setCourseHasValidPlan(prev => ({ ...prev, [courseId]: true }));
          setPricingError(prev => ({ ...prev, [courseId]: "" }));
          return true;
        }
      } else {
        setCourseHasValidPlan(prev => ({ ...prev, [courseId]: false }));
        setPricingError(prev => ({ ...prev, [courseId]: "Unable to fetch course pricing plans, Try again later !" }));
        return false;
      }
    } catch (error) {
      setCourseHasValidPlan(prev => ({ ...prev, [courseId]: false }));
      setPricingError(prev => ({ ...prev, [courseId]: "Failed to verify pricing details for this course." }));
      return false;
    }
  };

  // Fetch all payment plans when the sidebar is opened
  useEffect(() => {
    if (showPlanSidebar) {
      api.get('/api/paymentplan/all').then(res => {
        setSidebarPlans(res.data.data || []);
      });
    }
  }, [showPlanSidebar]);

  if (loading) return <div className="p-8">Loading...</div>;
  if (!bundle) return <div className="p-8 text-red-600">Bundle not found.</div>;

  return (
    <div className="p-8">
      <div className="flex items-center gap-3 mb-6">
        <button
          type="button"
          onClick={() => router.push('/admin/bundle')}
          style={{
            background: 'none',
            border: 'none',
            padding: 0,
            marginRight: '0.5rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
          }}
          aria-label="Back to Bundles"
        >
          <svg width="24" height="24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
        </button>
        <h1 className="text-3xl font-bold">Edit Bundle #{bundleId}</h1>
      </div>
      {/* Tab Navigation */}
      <div className="flex border-b mb-8">
        <button
          className={`px-6 py-3 -mb-px border-b-2 font-medium transition-colors duration-200 focus:outline-none ${
            activeTab === "details"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-gray-500 hover:text-blue-600"
          }`}
          onClick={() => setActiveTab("details")}
        >
          Bundle Details
        </button>
        <button
          className={`px-6 py-3 -mb-px border-b-2 font-medium transition-colors duration-200 focus:outline-none ${
            activeTab === "courses"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-gray-500 hover:text-blue-600"
          }`}
          onClick={() => setActiveTab("courses")}
        >
          Courses
        </button>
        <button
          className={`px-6 py-3 -mb-px border-b-2 font-medium transition-colors duration-200 focus:outline-none ${
            activeTab === "batches"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-gray-500 hover:text-blue-600"
          }`}
          onClick={() => setActiveTab("batches")}
        >
          Batches
        </button>
        <button
          className={`px-6 py-3 -mb-px border-b-2 font-medium transition-colors duration-200 focus:outline-none ${
            activeTab === "payment-plan"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-gray-500 hover:text-blue-600"
          }`}
          onClick={() => setActiveTab("payment-plan")}
        >
          Fee Template
        </button>
        <button
          className={`px-6 py-3 -mb-px border-b-2 font-medium transition-colors duration-200 focus:outline-none ${
            activeTab === "learners"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-gray-500 hover:text-blue-600"
          }`}
          onClick={() => setActiveTab("learners")}
        >
          Learners
        </button>
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-xl shadow p-8">
        {activeTab === "details" && (
          <EditBundleDetails
            form={form}
            onChange={handleChange}
            thumbnailPreview={thumbnailPreview}
            thumbnail={thumbnail}
            currentThumbnail={bundle?.thumbnailImage}
            onThumbnailChange={handleThumbnailChange}
            onRemoveNewThumbnail={() => { setThumbnail(null); setThumbnailPreview(""); }}
            onSave={handleSaveChanges}
          />
        )}
        {activeTab === "courses" && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="text-lg font-medium">All Courses</span>
                <span className="bg-gray-100 text-gray-700 rounded px-2 py-0.5 text-sm font-semibold">
                  {bundle?.courses?.length?.toString().padStart(2, '0') || '00'}
                </span>
              </div>
              <button
                className="text-blue-600 font-medium flex items-center gap-1 hover:underline"
                type="button"
                onClick={() => setShowAddCoursesModal(true)}
              >
                + Add Course
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full table-auto rounded-2xl overflow-hidden border border-gray-200 bg-white">
                <thead>
                  <tr>
                    <th className="px-4 py-3 text-left bg-gray-50 font-semibold text-base rounded-tl-2xl">Sr.</th>
                    <th className="px-4 py-3 text-left bg-gray-50 font-semibold text-base">Course Name</th>
                    <th className="px-4 py-3 text-left bg-gray-50 font-semibold text-base">Content</th>
                  </tr>
                </thead>
                <tbody>
                  {(Array.isArray(bundle?.courses) && bundle.courses.length > 0 ? bundle.courses : []).map((course, idx) => (
                    <tr
                      key={course.courseId || idx}
                      className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}
                      style={{ cursor: 'pointer' }}
                      onClick={() => router.push(`/admin/courses/${course.courseId || course.id}/details`)}
                    >
                      <td className="px-4 py-3">{(idx + 1).toString().padStart(2, '0')}</td>
                      <td className="px-4 py-3">{course.title || course.name || `Course ${idx + 1}`}</td>
                      <td className="px-4 py-3 text-gray-600 flex items-center gap-2">
                        <svg width="18" height="18" fill="none" stroke="#6b7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{display:'inline'}}><rect x="3" y="4" width="14" height="10" rx="2"/><line x1="8" y1="9" x2="16" y2="9"/></svg>
                        {course.sectionsCount != null ? `${course.sectionsCount} Section(s)` : '0 Section(s)'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        {activeTab === "payment-plan" && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Pricing Plans for this Bundle</h2>
              <button
                className="flex items-center gap-1 font-medium px-4 py-2 rounded"
                style={{ background: '#202745', color: '#fff', border: 'none' }}
                onClick={() => setShowPlanSidebar(true)}
                type="button"
              >
                + Add Payment Plan
              </button>
            </div>
            {bundlePlans.length === 0 ? (
              <div className="text-gray-500">Bundle has no plans.</div>
            ) : (
              <div className="overflow-x-auto rounded-2xl shadow bg-white border border-gray-200">
                <table className="min-w-full table-auto">
                  <thead>
                    <tr>
                      <th className="px-4 py-3 text-left bg-gray-50 font-semibold text-base">ID</th>
                      <th className="px-4 py-3 text-left bg-gray-50 font-semibold text-base">Plan Name</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bundlePlans.map((plan, index) => (
                      <tr key={`${plan.planId}-${index}`} className="bg-white">
                        <td className="px-4 py-3">{plan.planId}</td>
                        <td className="px-4 py-3">{plan.name}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {/* Sidebar Drawer for Create/Edit Pricing Plan */}
            {showPlanSidebar && (
              <div className="fixed inset-0 z-50 flex justify-start bg-black bg-opacity-30">
                <div className="bg-white w-full max-w-2xl h-full shadow-xl p-6 relative overflow-y-auto animate-slideInRight">
                  <button className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-2xl" onClick={() => setShowPlanSidebar(false)}>&times;</button>
                  <h2 className="text-2xl font-bold mb-2">Link Payment Plans to Bundle</h2>
                  <p className="text-gray-600 mb-6">Select payment plan templates to link with this bundle. You can add multiple plans at once.</p>
                  <form className="space-y-6">
                    <div className="mt-4">
                      <label className="block text-sm font-medium mb-1">Payment Plans</label>
                      <div className="bg-gray-50 border rounded p-4">
                        {sidebarPlanContainers.map((container, idx) => {
                          const plan = sidebarPlans.find(p => 
                            p.planId == container.selectedPlanId || 
                            p.planId === container.selectedPlanId
                          ) || sidebarPlans[0];
                          
                          if (!plan) {
                            return (
                              <div key={container.id} className="mb-8 border-b pb-6">
                                <div className="text-red-500 text-sm mb-4">No plans available. Please add a plan first.</div>
                              </div>
                            );
                          }
                          // Calculate installments based on selected plan and bundle price
                          const dynamicInstallments = calculateInstallmentsForPlan(plan, bundlePrice);
                          return (
                            <div key={container.id} className="mb-6 bg-white rounded-lg border border-gray-200 overflow-hidden">
                              <div className="bg-gray-50 px-4 py-3 border-b">
                                <h4 className="font-semibold text-sm text-gray-700">Payment Plan Configuration</h4>
                              </div>
                              <div className="p-4">
                                <div className="mb-4">
                                  <label className="block text-sm font-medium mb-2 text-gray-700">Select Payment Plan</label>
                                  <select
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    value={container.selectedPlanId}
                                    onChange={e => handleSidebarPlanChange(container.id, e.target.value)}
                                    disabled={container.frozen}
                                  >
                                    <option value="">Select a plan...</option>
                                    {sidebarPlans.map((plan, index) => (
                                      <option key={`${plan.planId}-${index}`} value={plan.planId}>{plan.name}</option>
                                    ))}
                                                                    </select>
                                </div>
                              </div>
                              <div className="bg-white rounded-lg border border-gray-200 mb-4 overflow-hidden">
                                <div className="bg-gray-50 px-4 py-3 border-b">
                                  <h4 className="font-semibold text-sm text-gray-700">Installment Breakdown</h4>
                                </div>
                                <div className="overflow-x-auto">
                                  <table className="w-full text-sm">
                                    <thead>
                                      <tr className="bg-gray-50">
                                        <th className="px-3 py-2 text-left font-medium text-xs text-gray-600">#</th>
                                        <th className="px-3 py-2 text-left font-medium text-xs text-gray-600">Name</th>
                                        <th className="px-3 py-2 text-left font-medium text-xs text-gray-600">Amount</th>
                                        <th className="px-3 py-2 text-left font-medium text-xs text-gray-600">Weightage</th>
                                        <th className="px-3 py-2 text-left font-medium text-xs text-gray-600">Timing</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {dynamicInstallments.map((inst, idx) => (
                                        <tr key={`installment-${container.id}-${idx}`} className="border-b border-gray-100 last:border-b-0">
                                          <td className="px-3 py-2 text-gray-600">{idx + 1}</td>
                                          <td className="px-3 py-2">
                                            <span className="text-sm font-medium text-gray-800">{inst.name}</span>
                                          </td>
                                          <td className="px-3 py-2">
                                            <span className="text-sm font-semibold text-green-600">₹{inst.amount}</span>
                                          </td>
                                          <td className="px-3 py-2">
                                            <span className="text-sm text-gray-600">{inst.weightage}%</span>
                                          </td>
                                          <td className="px-3 py-2">
                                            <span className="text-sm text-gray-600">{inst.after} {inst.unit}</span>
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                              {/* Summary section */}
                              <div className="mt-4 bg-white rounded-lg border border-gray-200 overflow-hidden">
                                <div className="bg-gray-50 px-4 py-3 border-b">
                                  <h4 className="font-semibold text-sm text-gray-700">Payment Summary</h4>
                                </div>
                                <div className="p-4 space-y-3">
                                  <div className="flex justify-between items-center">
                                    <span className="text-sm font-medium text-gray-600">Bundle Price:</span>
                                    <span className="text-lg font-bold text-gray-900">₹{bundlePrice}</span>
                                  </div>
                                  <div className="flex justify-between items-center">
                                    <span className="text-sm font-medium text-gray-600">Payment Plan:</span>
                                    <span className="text-sm font-semibold text-blue-600">{plan.name}</span>
                                  </div>
                                  <div className="flex justify-between items-center">
                                    <span className="text-sm font-medium text-gray-600">Installment Count:</span>
                                    <span className="text-sm font-semibold text-green-600">{dynamicInstallments.length} installments</span>
                                  </div>
                                  <div className="flex justify-between items-center">
                                    <span className="text-sm font-medium text-gray-600">Per Installment:</span>
                                    <span className="text-sm font-semibold text-green-600">₹{(bundlePrice / dynamicInstallments.length).toFixed(2)}</span>
                                  </div>
                                  <div className="pt-2 border-t border-gray-100">
                                    <div className="flex justify-between items-center">
                                      <span className="text-sm font-medium text-gray-600">Total Amount:</span>
                                      <span className="text-lg font-bold text-green-600">₹{bundlePrice}</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                              <div className="flex justify-end gap-2 mt-4">
                                {!container.frozen && (
                                  <button
                                    type="button"
                                    className="flex items-center gap-1 text-red-500 font-medium mt-2"
                                    onClick={() => handleSidebarDeletePlanContainer(container.id)}
                                  >
                                    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h12M9 6v9m-4 0h8a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2z" /></svg>
                                    Delete
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      {/* Add Plan button below all containers, always visible */}
                      <div className="flex justify-end mt-4">
                        <button
                          type="button"
                          className="text-blue-600 font-medium"
                          onClick={handleSidebarAddPlanContainer}
                        >
                          + Add Plan
                        </button>
                      </div>
                    </div>
                    <div className="flex justify-end gap-4 mt-8">
                      <button type="button" className="px-6 py-2 rounded border border-gray-300 text-gray-700 bg-white hover:bg-gray-100" onClick={() => setShowPlanSidebar(false)}>Cancel</button>
                      <button
                        type="button"
                        className="px-6 py-2 rounded bg-darkblue text-white font-semibold hover:bg-blue-700"
                        onClick={handleSaveMultiplePlans}
                      >
                        Save Plans
                      </button>
                    </div>
                  </form>
                </div>
                {/* Click outside to close */}
                <div className="flex-1" onClick={() => setShowPlanSidebar(false)} />
              </div>
            )}
          </div>
        )}
        {activeTab === "batches" && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Batches</h2>
            <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
              <div className="flex items-center gap-2">
                <div className="relative">
                  <button
                    className="flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-700 rounded-lg font-medium text-sm border border-blue-200"
                    onClick={() => setBatchDropdownOpen(open => !open)}
                    type="button"
                  >
                    {batchStatusFilter}
                    <svg width="16" height="16" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="4 6 8 10 12 6" />
                    </svg>
                  </button>
                  <span className="ml-2 text-xs bg-blue-600 text-white rounded-full px-2 py-0.5 font-semibold">
                    {filteredBatches.length.toString().padStart(2, '0')}
                  </span>
                  {batchDropdownOpen && (
                    <div className="absolute left-0 mt-2 w-48 rounded-xl shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50">
                      {["Active Batches", "Completed Batches", "Archived Batches", "All Batches"].map(option => (
                        <div
                          key={option}
                          className={`px-6 py-3 cursor-pointer hover:bg-gray-100 ${option === batchStatusFilter ? "font-semibold text-blue-600" : ""}`}
                          onClick={() => {
                            setBatchStatusFilter(option);
                            setBatchDropdownOpen(false);
                          }}
                        >
                          {option}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Search by batch name..."
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  style={{ minWidth: 220 }}
                />
                <button
                  style={{ background: '#202745', color: '#fff' }}
                  className="px-4 py-2 rounded-lg font-semibold shadow transition-all text-sm"
                  onClick={() => setShowBatchModal(true)}
                >
                  + Create Batch
                </button>
              </div>
            </div>
            {batchesTabLoading ? (
              <div>Loading...</div>
            ) : batchesTabError ? (
              <div className="text-red-500">{batchesTabError}</div>
            ) : filteredBatches.length === 0 ? (
              <div className="text-gray-500">No batches found for this bundle.</div>
            ) : (
              <div className="overflow-x-auto overflow-y-auto rounded-2xl shadow bg-white border border-gray-200 max-h-[420px]">
                <table className="min-w-[1100px] w-full table-auto text-sm">
                  <thead>
                    <tr>
                      <th className="px-6 py-3 text-left bg-gray-50 font-semibold text-sm text-gray-900 rounded-tl-2xl">#</th>
                      <th className="px-6 py-3 text-left bg-gray-50 font-semibold text-sm text-gray-900">Batch name</th>
                      <th className="px-6 py-3 text-left bg-gray-50 font-semibold text-sm text-gray-900">Course</th>
                      <th className="px-6 py-3 text-left bg-gray-50 font-semibold text-sm text-gray-900">Duration</th>
                      <th className="px-6 py-3 text-left bg-gray-50 font-semibold text-sm text-gray-900">Subject & Instructor</th>
                      <th className="px-6 py-3 text-left bg-gray-50 font-semibold text-sm text-gray-900">Batch manager</th>
                      <th className="px-6 py-3 text-left bg-gray-50 font-semibold text-sm text-gray-900">Batch Progress</th>
                      <th className="px-6 py-3 text-left bg-gray-50 font-semibold text-sm text-gray-900 rounded-tr-2xl">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredBatches.map((batch, idx) => (
                      <tr
                        key={batch.batchId || idx}
                        className={"border-b last:border-b-0 hover:bg-gray-50 transition cursor-pointer"}
                        onClick={() => router.push(`/admin/batches/${batch.batchId}`)}
                      >
                        <td className="px-6 py-4 text-gray-700 text-sm">{(idx + 1).toString().padStart(2, '0')}</td>
                        <td className="px-6 py-4 text-gray-700 text-sm">
                          <div className="flex flex-col gap-1">
                            <span className="font-medium text-sm">{batch.batchName}</span>
                            {/* Real data from API response */}
                            <div className="flex flex-wrap items-center gap-2 mt-1">
                              {batch.default && (
                                <span className="text-xs text-blue-600 font-semibold">DEFAULT</span>
                              )}
                              <span className="text-xs bg-gray-100 px-2 rounded">{batch.learnersCount || 0} Learners</span>
                              <span className={`text-xs px-2 rounded ${
                                batch.status === 'ACTIVE' ? 'bg-green-100 text-green-600' : 
                                batch.status === 'UPCOMING' ? 'bg-blue-100 text-blue-600' :
                                batch.status === 'COMPLETED' ? 'bg-gray-100 text-gray-600' :
                                'bg-yellow-100 text-yellow-600'
                              }`}>
                                {batch.status || 'UNKNOWN'}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-gray-700 text-sm">
                          {batch.courses && batch.courses.length > 0 
                            ? batch.courses.map(course => course.courseName || course.name).join(', ')
                            : 'No courses assigned'
                          }
                        </td>
                        <td className="px-6 py-4 text-gray-700 text-sm">
                          <span className="text-xs">{batch.startDate ? new Date(batch.startDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Not set'}</span><br/>
                          <span className="text-xs">{batch.endDate ? new Date(batch.endDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : ''}</span>
                        </td>
                        <td className="px-6 py-4 text-gray-700 text-sm">
                          {/* Real subjects & instructors from courses data */}
                          {batch.courses && batch.courses.length > 0 ? (
                            batch.courses.map((course, courseIdx) => (
                              <div key={courseIdx} className="text-xs">
                                {course.courseName || course.name} 
                                {course.instructor && (
                                  <span className="text-gray-400"> ({course.instructor})</span>
                                )}
                              </div>
                            ))
                          ) : (
                            <div className="text-xs text-gray-400">No courses assigned</div>
                          )}
                        </td>
                        <td className="px-6 py-4 text-gray-700 text-sm">
                          {batch.batchManager ? batch.batchManager.name : 'Not assigned'}
                        </td>
                        <td className="px-6 py-4 text-gray-700 text-sm">
                          <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden mb-1">
                            <div style={{ width: (batch.progress || 0) + '%' }} className="bg-blue-600 h-full"></div>
                          </div>
                          <span className="text-xs">{batch.progress || 0}%</span>
                        </td>
                        <td className="relative px-6 py-4">
                          <button
                            className="p-1 rounded-full hover:bg-gray-100 focus:outline-none"
                            onClick={(e) => {
                              e.stopPropagation();
                              setBatchDropdownId(batchDropdownId === batch.batchId ? null : batch.batchId);
                            }}
                            aria-label="Actions"
                          >
                            <svg width="20" height="20" fill="none" stroke="#6b7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <circle cx="10" cy="4" r="1.5"/>
                              <circle cx="10" cy="10" r="1.5"/>
                              <circle cx="10" cy="16" r="1.5"/>
                            </svg>
                          </button>
                          {batchDropdownId === batch.batchId && (
                            <div ref={batchDropdownRef} className="absolute right-4 top-10 bg-white border rounded-lg shadow-lg z-50">
                          <button
                            className="block w-full px-4 py-2 text-left hover:bg-gray-100"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenEditBundleBatch(batch);
                            }}
                          >
                            Edit
                          </button>
                              <button
                                className="block w-full px-4 py-2 text-left hover:bg-gray-100"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleBatchMakeDefault(batch.batchId);
                                }}
                              >
                                Make Default
                              </button>
                              <button
                                className="block w-full px-4 py-2 text-left text-red-600 hover:bg-gray-100"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleBatchDelete(batch.batchId);
                                }}
                              >
                                Delete
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
        {activeTab === "learners" && (
          <div>
            {/* Modern Batch Selector */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Learners Management</h2>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">
                    {learners.length} learners in selected batch
                  </span>
                </div>
              </div>
              
              {/* Enhanced Batch Dropdown */}
              <div className="relative inline-block batch-dropdown-trigger">
                {learnersTabBatchesLoading ? (
                  <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    <span className="text-gray-600">Loading batches...</span>
                  </div>
                ) : learnersTabBatchesError ? (
                  <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-lg">
                    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-500">
                      <circle cx="12" cy="12" r="10"/>
                      <line x1="15" y1="9" x2="9" y2="15"/>
                      <line x1="9" y1="9" x2="15" y2="15"/>
                    </svg>
                    <span className="text-red-600">{learnersTabBatchesError}</span>
                  </div>
                ) : learnersTabBatches.length === 0 ? (
                  <div className="flex items-center gap-2 px-4 py-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-yellow-500">
                      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                      <line x1="12" y1="9" x2="12" y2="13"/>
                      <line x1="12" y1="17" x2="12.01" y2="17"/>
                    </svg>
                    <span className="text-yellow-700">No batches available for this bundle</span>
                  </div>
                ) : (
                  <>
                    <button
                      type="button"
                      className="flex items-center justify-between gap-3 px-4 py-3 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 min-w-[280px] group"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setBatchDropdownOpen(open => !open);
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-lg">
                          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600">
                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                            <circle cx="9" cy="7" r="4"/>
                            <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                            <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                          </svg>
                        </div>
                        <div className="text-left">
                          <div className="text-sm font-medium text-gray-900">
                            {(() => {
                              const selectedBatchData = learnersTabBatches.find(batch => 
                                batch.batchId === selectedBatch || batch.id === selectedBatch
                              );
                              return selectedBatchData ? (selectedBatchData.batchName || selectedBatchData.name || `Batch ${selectedBatchData.id}`) : "Select a batch";
                            })()}
                          </div>
                          <div className="text-xs text-gray-500">
                            {learnersTabBatches.length} batch{learnersTabBatches.length !== 1 ? 'es' : ''} available
                          </div>
                        </div>
                      </div>
                      <svg 
                        width="20" 
                        height="20" 
                        fill="none" 
                        stroke="currentColor" 
                        strokeWidth="2" 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        className={`text-gray-400 transition-transform duration-200 ${batchDropdownOpen ? 'rotate-180' : ''}`}
                      >
                        <polyline points="6 9 12 15 18 9" />
                      </svg>
                    </button>
                    
                    {batchDropdownOpen && (
                      <div
                        className="absolute left-0 mt-2 w-80 rounded-xl shadow-xl bg-white ring-1 ring-black ring-opacity-5 z-50 border border-gray-200"
                        style={{ 
                          boxShadow: "0 10px 40px 0 rgba(0,0,0,0.15)", 
                          position: 'absolute', 
                          top: '100%', 
                          left: '0', 
                          zIndex: 9999 
                        }}
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
                      >
                        {/* Search Input */}
                        <div className="p-3 border-b border-gray-100">
                          <div className="relative">
                            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                              <circle cx="11" cy="11" r="8"/>
                              <path d="m21 21-4.35-4.35"/>
                            </svg>
                            <input
                              type="text"
                              placeholder="Search batches..."
                              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              onChange={(e) => {
                                // Add search functionality here if needed
                              }}
                            />
                          </div>
                        </div>
                        
                        {/* Batch List */}
                        <div className="max-h-64 overflow-y-auto">
                          {learnersTabBatches.map((batch) => {
                            const batchId = batch.batchId || batch.id;
                            const batchName = batch.batchName || batch.name || `Batch ${batch.id}`;
                            const isSelected = batchId === selectedBatch;
                            
                            return (
                              <div
                                key={batchId}
                                className={`px-4 py-3 cursor-pointer transition-colors duration-150 hover:bg-gray-50 ${
                                  isSelected 
                                    ? "bg-blue-50 border-l-4 border-l-blue-500" 
                                    : "border-l-4 border-l-transparent"
                                }`}
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  setSelectedBatch(batchId);
                                  setBatchDropdownOpen(false);
                                }}
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                    <div className={`w-2 h-2 rounded-full ${isSelected ? 'bg-blue-500' : 'bg-gray-300'}`}></div>
                                    <div>
                                      <div className={`text-sm font-medium ${isSelected ? 'text-blue-700' : 'text-gray-900'}`}>
                                        {batchName}
                                      </div>
                                      <div className="text-xs text-gray-500">
                                        {batch.startDate ? new Date(batch.startDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'No start date'}
                                      </div>
                                    </div>
                                  </div>
                                  {isSelected && (
                                    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500">
                                      <polyline points="20 6 9 17 4 12"/>
                                    </svg>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                        
                        {/* Footer */}
                        <div className="p-3 border-t border-gray-100 bg-gray-50 rounded-b-xl">
                          <div className="text-xs text-gray-500 text-center">
                            {learnersTabBatches.length} batch{learnersTabBatches.length !== 1 ? 'es' : ''} found
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Learners Table */}
            {learnersLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="flex items-center gap-3">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                  <span className="text-gray-600">Loading learners...</span>
                </div>
              </div>
            ) : learnersError ? (
              <div className="flex items-center justify-center py-12">
                <div className="flex items-center gap-3 text-red-600">
                  <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="15" y1="9" x2="9" y2="15"/>
                    <line x1="9" y1="9" x2="15" y2="15"/>
                  </svg>
                  <span>{learnersError}</span>
                </div>
              </div>
            ) : !selectedBatch ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                      <circle cx="9" cy="7" r="4"/>
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Batch</h3>
                  <p className="text-gray-500">Choose a batch from the dropdown above to view its learners</p>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900">Learners List</h3>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-500">Total:</span>
                        <span className="text-sm font-semibold text-gray-900">{learners.length}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-500">Active:</span>
                        <span className="text-sm font-semibold text-green-600">{learners.filter(l => l.status === 'active').length}</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Sr.</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Learner</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Contact</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Enrolled</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Progress</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {learners.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-6 py-12 text-center">
                            <div className="flex flex-col items-center gap-3">
                              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                                <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
                                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                                  <circle cx="9" cy="7" r="4"/>
                                </svg>
                              </div>
                              <div>
                                <h3 className="text-sm font-medium text-gray-900 mb-1">No learners found</h3>
                                <p className="text-sm text-gray-500">This batch doesn't have any enrolled learners yet.</p>
                              </div>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        learners.map((learner, idx) => (
                          <tr key={learner.id} className="hover:bg-gray-50 transition-colors duration-150">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">{(idx + 1).toString().padStart(2, '0')}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                  <span className="text-sm font-semibold text-blue-600">
                                    {learner.name ? learner.name.charAt(0).toUpperCase() : 'L'}
                                  </span>
                                </div>
                                <div>
                                  <div className="text-sm font-medium text-gray-900">{learner.name}</div>
                                  <div className="text-xs text-gray-500">#{learner.id}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">
                                <div className="flex items-center gap-1 mb-1">
                                  <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
                                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                                    <polyline points="22,6 12,13 2,6"/>
                                  </svg>
                                  <span className="text-blue-600 truncate max-w-[200px]" title={learner.email}>
                                    {learner.email}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
                                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                                  </svg>
                                  <span className="text-gray-600 truncate max-w-[200px]" title={learner.phone}>
                                    {learner.phone}
                                  </span>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">
                                {new Date(learner.enrolled).toLocaleDateString('en-GB', { 
                                  day: '2-digit', 
                                  month: 'short', 
                                  year: 'numeric' 
                                })}
                              </div>
                              <div className="text-xs text-gray-500">
                                {Math.floor((new Date() - new Date(learner.enrolled)) / (1000 * 60 * 60 * 24))} days ago
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                <div className="flex-1">
                                  <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                                    <div 
                                      style={{ width: `${learner.progress}%` }} 
                                      className={`h-full rounded-full transition-all duration-300 ${
                                        learner.progress >= 80 ? 'bg-green-500' : 
                                        learner.progress >= 50 ? 'bg-yellow-500' : 'bg-blue-500'
                                      }`}
                                    ></div>
                                  </div>
                                </div>
                                <span className={`text-xs font-medium ${
                                  learner.progress >= 80 ? 'text-green-600' : 
                                  learner.progress >= 50 ? 'text-yellow-600' : 'text-blue-600'
                                }`}>
                                  {learner.progress}%
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="relative">
                                <button
                                  className="p-2 rounded-lg border border-gray-200 bg-white shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
                                  onClick={e => {
                                    e.stopPropagation();
                                    setOpenLearnerMenuIdx(openLearnerMenuIdx === idx ? null : idx);
                                  }}
                                >
                                  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-600">
                                    <circle cx="12" cy="6" r="2" />
                                    <circle cx="12" cy="12" r="2" />
                                    <circle cx="12" cy="18" r="2" />
                                  </svg>
                                </button>
                                
                                {openLearnerMenuIdx === idx && (
                                  <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                                    <div className="py-1">
                                      <button
                                        className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors duration-150"
                                        onClick={() => {
                                          setOpenLearnerMenuIdx(null);
                                          router.push(`/admin/users/learners/${learner.id}`);
                                        }}
                                      >
                                        <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                                          <circle cx="12" cy="7" r="4"/>
                                        </svg>
                                        View Profile
                                      </button>
                                      <button
                                        className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors duration-150"
                                        onClick={() => {
                                          setOpenLearnerMenuIdx(null);
                                          // Add message functionality
                                        }}
                                      >
                                        <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                                        </svg>
                                        Send Message
                                      </button>
                                      <button
                                        className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors duration-150"
                                        onClick={() => {
                                          setOpenLearnerMenuIdx(null);
                                          // Add certificate functionality
                                        }}
                                      >
                                        <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                                          <circle cx="9" cy="9" r="2"/>
                                          <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>
                                        </svg>
                                        View Certificate
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      
      <AddCoursesModal
        open={showAddCoursesModal}
        onClose={() => setShowAddCoursesModal(false)}
        bundleId={bundleId}
        onSuccess={() => {
          // Refetch bundle data after linking courses
          async function refetch() {
            try {
              const res = await api.get(`/api/course-bundles/${bundleId}`);
              const data = res.data.data || res.data;
              setBundle(data);
            } catch {}
          }
          refetch();
        }}
        linkedCourseIds={linkedCourseIds}
      />

      {isEditBatchModalOpen && (
        <EditBundleBatchModal
          isOpen={isEditBatchModalOpen}
          onClose={() => {
            setIsEditBatchModalOpen(false);
            setEditBatchInitialData(null);
          }}
          initialData={editBatchInitialData}
          onUpdate={handleUpdateBundleBatch}
          bundleData={bundle ? [bundle] : []}
          instrData={instructorData}
        />
      )}
      {showBatchModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-xl shadow-xl p-8 w-full max-w-2xl relative">
            <button
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-2xl"
              onClick={() => setShowBatchModal(false)}
            >
              &times;
            </button>
            <h2 className="text-xl font-bold mb-6">Create Batch for Bundle: {bundle?.title}</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Batch Name *</label>
                <input
                  type="text"
                  className="w-full border rounded px-3 py-2"
                  value={batchName}
                  onChange={e => setBatchName(e.target.value)}
                  placeholder="Enter batch name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Bundle Courses *</label>
                <div className="relative" ref={dropdownRef}>
                  <button
                    type="button"
                    className="w-full border rounded px-3 py-2 text-left flex justify-between items-center bg-white"
                    onClick={() => setCourseDropdownOpen(open => !open)}
                  >
                    <span>
                      {selectedCourses.length === 0
                        ? "Select courses..."
                        : allCourses
                            .filter(c => selectedCourses.includes(c.id || c.courseId))
                            .map(c => c.title || c.name)
                            .join(", ")}
                    </span>
                    <svg width="18" height="18" fill="none" stroke="#6b7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </button>
                  {courseDropdownOpen && (
                    <div className="absolute left-0 mt-2 w-full max-h-56 overflow-y-auto rounded-xl shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50">
                      {loadingCourses ? (
                        <div className="p-4 text-gray-500">Loading courses...</div>
                      ) : (Array.isArray(allCourses) && allCourses.length > 0 ? (
                        allCourses.map(course => {
                          const courseId = course.id || course.courseId;
                          return (
                            <div key={courseId} className="px-4 py-2 hover:bg-gray-100 flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={selectedCourses.includes(courseId)}
                                onChange={async e => {
                                  if (e.target.checked) {
                                    setSelectedCourses(prev => [...prev, courseId]);
                                    setLoadingCurriculumsByCourse(prev => ({ ...prev, [courseId]: true }));
                                    const hasPlan = await fetchCoursePricingDetails(courseId);
                                    if (hasPlan) {
                                      api.get(`/api/courses/${courseId}`).then(res => {
                                        const course = res.data.data || res.data;
                                        const curriculums = course.curriculums || course.curriculum || [];
                                        setCurriculumsByCourse(prev => ({ ...prev, [courseId]: curriculums }));
                                        setLoadingCurriculumsByCourse(prev => ({ ...prev, [courseId]: false }));
                                      });
                                    } else {
                                      setLoadingCurriculumsByCourse(prev => ({ ...prev, [courseId]: false }));
                                    }
                                  } else {
                                    setSelectedCourses(prev => prev.filter(id => id !== courseId));
                                    setSelectedCurriculums(prev => prev.filter(cid => !curriculumsByCourse[courseId]?.some(cur => (cur.id || cur.curriculumId) === cid)));
                                  }
                                }}
                                className="mr-2"
                              />
                              <span className="font-semibold text-blue-700">{course.title || course.name}</span>
                              {pricingError[courseId] && (
                                <span className="text-red-500 text-xs ml-2">{pricingError[courseId]}</span>
                              )}
                            </div>
                          );
                        })
                      ) : <div className="p-4 text-gray-500">No courses available</div>)}
                    </div>
                  )}
                </div>
              </div>
              {/* Curriculums container below courses */}
              {selectedCourses.length > 0 && (
                <div className="mt-4 p-4 border rounded-lg bg-gray-50">
                  <label className="block text-sm font-medium mb-2">Curriculums *</label>
                  {selectedCourses.map(courseId => (
                    <div key={courseId} className="mb-2">
                      <div className="font-semibold text-blue-600 mb-1">
                        {allCourses.find(c => (c.id || c.courseId) == courseId)?.title || allCourses.find(c => (c.id || c.courseId) == courseId)?.name || `Course ${courseId}`}
                      </div>
                      {pricingError[courseId] ? (
                        <div className="text-red-500 text-sm mb-2">{pricingError[courseId]}</div>
                      ) : loadingCurriculumsByCourse[courseId] ? (
                        <div className="text-gray-400 text-sm">Loading curriculums...</div>
                      ) : curriculumsByCourse[courseId]?.length > 0 ? (
                        curriculumsByCourse[courseId].map(cur => (
                          <label key={cur.curriculumId || cur.id} className="inline-flex items-center mr-4 mb-1">
                            <input
                              type="checkbox"
                              className="mr-2"
                              checked={selectedCurriculums.includes(cur.curriculumId || cur.id)}
                              onChange={e => {
                                const curId = cur.curriculumId || cur.id;
                                if (e.target.checked) setSelectedCurriculums(prev => [...prev, curId]);
                                else setSelectedCurriculums(prev => prev.filter(id => id !== curId));
                              }}
                            />
                            {cur.title}
                          </label>
                        ))
                      ) : (
                        <div className="text-gray-400 text-sm">No curriculums</div>
                      )}
                    </div>
                  ))}
                </div>
              )}
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium mb-1">Start Date</label>
                  <input
                    type="date"
                    className="w-full border rounded px-3 py-2"
                    value={startDate}
                    onChange={e => setStartDate(e.target.value)}
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium mb-1">End Date</label>
                  <input
                    type="date"
                    className="w-full border rounded px-3 py-2"
                    value={endDate}
                    onChange={e => setEndDate(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setShowBatchModal(false)}
                  className="px-4 py-2 border rounded-lg text-gray-600 hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    if (!batchName || selectedCourses.length === 0 || selectedCurriculums.length === 0 || !startDate || !endDate) {
                      alert('Please fill all required fields.');
                      return;
                    }
                    // TODO: Replace with actual batch manager selection logic
                    const batchManagerId = 1; // Replace with real batch manager selection
                    // Build courses array with selected curriculums per course
                    const courses = selectedCourses.map(courseId => ({
                      courseId,
                      curriculumIds: (curriculumsByCourse[courseId] || [])
                        .filter(cur => selectedCurriculums.includes(cur.curriculumId || cur.id))
                        .map(cur => cur.curriculumId || cur.id)
                    }));
                    const payload = {
                      batchName,
                      bundleId: Number(bundleId),
                      courses,
                      startDate,
                      endDate,
                      batchManagerId,
                      // additionalBatchManagerId: null, // Add if you have this field
                      // accommodation: false, // Add if you have this field
                    };
                    try {
                      const res = await api.post('/api/batches', payload);
                      toast.success('Batch created successfully!');
                      setShowBatchModal(false);
                      // Optionally, refresh batches list here
                    } catch (err) {
                      toast.error('Failed to create batch: ' + (err.response?.data?.message || err.message));
                    }
                  }}
                  style={{ background: '#202745', color: '#fff' }}
                  className="px-4 py-2 rounded-lg font-semibold shadow transition-all text-sm"
                >
                  Create
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Add Courses Modal */}
      <AddCoursesModal
        open={showAddCoursesModal}
        onClose={() => setShowAddCoursesModal(false)}
        bundleId={bundleId}
        linkedCourseIds={linkedCourseIds}
        onSuccess={async () => {
          // Refresh bundle data after linking/unlinking courses
          try {
            await fetchBundle();
          } catch (error) {
            console.error('Error refreshing bundle:', error);
          }
        }}
      />
    </div>
  );
} 