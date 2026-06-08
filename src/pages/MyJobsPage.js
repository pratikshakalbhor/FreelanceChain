import React from "react";
import { useEscrow } from "../hooks/useEscrow";
import MyJobs from "./MyJobs";
import { motion } from "framer-motion";



export default function MyJobsPage({ walletAddress }) {
  const { 
    jobs, loading, handleSubmitWork, handleApproveJob, handleCancelJob, handleAcceptJob
  } = useEscrow();

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ padding: "20px" }}>

      <MyJobs 
        jobs={jobs} 
        loading={loading} 
        walletAddress={walletAddress} 
        onSubmitWork={handleSubmitWork}
        onApprove={handleApproveJob}
        onCancel={handleCancelJob}
        onAccept={handleAcceptJob}
      />
    </motion.div>
  );
}
