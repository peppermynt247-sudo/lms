import api from "@/services/api";

export const getDashboardSessions = async () => {
  try {
    // 1. Fetch student's enrolled courses and bundles to extract batch IDs
    const studentDashRes = await api.get('/api/student/dashboard');
    const { courses, bundles } = studentDashRes.data;
    
    // Extract unique batch IDs
    const batchIds = new Set();
    if (courses && Array.isArray(courses)) {
      courses.forEach(c => {
        if (c.batchId) batchIds.add(c.batchId);
      });
    }
    if (bundles && Array.isArray(bundles)) {
      bundles.forEach(b => {
        if (b.batchId) batchIds.add(b.batchId);
      });
    }
    
    if (batchIds.size === 0) {
      return { success: true, data: [] };
    }

    // 2. Fetch sessions for all batch IDs
    const allSessions = [];
    const batchPromises = Array.from(batchIds).map(async (batchId) => {
      try {
        const res = await api.get(`/api/sessions/batch/${batchId}`);
        if (res.data && res.data.success && Array.isArray(res.data.data)) {
           return res.data.data;
        }
      } catch (e) {
        console.warn(`Could not fetch sessions for batch ${batchId}`, e);
      }
      return [];
    });

    const batchResults = await Promise.all(batchPromises);
    batchResults.forEach(sessions => {
      allSessions.push(...sessions);
    });

    // Deduplicate sessions (if any overlap between courses/bundles)
    const uniqueSessionsMap = new Map();
    allSessions.forEach(session => {
       uniqueSessionsMap.set(session.sessionId, session);
    });

    const uniqueSessions = Array.from(uniqueSessionsMap.values());

    // Sort by scheduledAt descending
    uniqueSessions.sort((a, b) => new Date(b.scheduledAt) - new Date(a.scheduledAt));

    // 3. For LIVE/SCHEDULED sessions, fetch the join link if it is available
    // The batch API returns SessionSummary which lacks zoomJoinUrl
    const joinPromises = uniqueSessions.map(async (session) => {
      if (session.joinUrlAvailable && (session.status === 'LIVE' || session.status === 'SCHEDULED')) {
        try {
           const joinRes = await api.get(`/api/sessions/${session.sessionId}/join`);
           if (joinRes.data && joinRes.data.success && joinRes.data.data.zoomJoinUrl) {
             session.zoomJoinUrl = joinRes.data.data.zoomJoinUrl;
           }
        } catch (e) {
           console.warn(`Could not fetch join url for session ${session.sessionId}`, e);
        }
      }
      return session;
    });

    await Promise.all(joinPromises);

    // 4. For COMPLETED sessions, fetch the recordings for the student
    const recordingPromises = uniqueSessions.map(async (session) => {
      if (session.status === 'COMPLETED') {
        try {
           const recRes = await api.get(`/api/sessions/${session.sessionId}/recordings/student`);
           if (recRes.data && recRes.data.success && Array.isArray(recRes.data.data)) {
             session.recordings = recRes.data.data;
           } else {
             session.recordings = [];
           }
        } catch (e) {
           console.warn(`Could not fetch recordings for session ${session.sessionId}`, e);
           session.recordings = [];
        }
      }
      return session;
    });

    await Promise.all(recordingPromises);

    // Provide the combined result matching the expected API format
    return {
      success: true,
      message: "Dashboard sessions retrieved (aggregated)",
      data: uniqueSessions
    };

  } catch (err) {
    console.error("Error fetching dashboard sessions:", err);
    throw err;
  }
};
