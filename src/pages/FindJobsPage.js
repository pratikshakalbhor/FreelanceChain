import React, { useEffect, useRef } from "react";
import { useEscrow } from "../hooks/useEscrow";
import FindJobs from "./FindJobs";
import { motion } from "framer-motion";
import { createScrollObserver } from "../utils/paginator";

export default function FindJobsPage({ walletAddress }) {
  const { jobs, loading, handleAcceptJob, loadMoreJobs, hasMore, totalJobs } = useEscrow();
  const observerRef = useRef(null);

  useEffect(() => {
    const observer = createScrollObserver(() => {
      if (hasMore && !loading) {
        console.log("[FindJobs] Sentinel reached, loading more...");
        loadMoreJobs();
      }
    });

    if (observer && observerRef.current) {
      observer.observe(observerRef.current);
    }

    return () => observer?.disconnect();
  }, [hasMore, loading, loadMoreJobs]);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ padding: "0" }}>
      <FindJobs 
        jobs={jobs} 
        loading={loading} 
        walletAddress={walletAddress} 
        onAccept={handleAcceptJob}
        hasMore={hasMore}
        totalJobs={totalJobs}
      />
      {/* Sentinel for infinite scroll */}
      <div ref={observerRef} style={{ height: "40px", width: "100%" }} />
    </motion.div>
  );
}
