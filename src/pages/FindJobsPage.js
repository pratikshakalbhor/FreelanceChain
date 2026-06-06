import React from "react";
import { useEscrow } from "../hooks/useEscrow";
import FindJobs from "./FindJobs";
import { motion } from "framer-motion";

export default function FindJobsPage({ walletAddress }) {
  const { jobs, loading, handleAcceptJob } = useEscrow();

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ padding: "20px" }}>
      <FindJobs 
        jobs={jobs} 
        loading={loading} 
        walletAddress={walletAddress} 
        onAccept={handleAcceptJob}
      />
    </motion.div>
  );
}
