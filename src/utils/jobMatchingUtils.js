
/**
 * jobMatchingUtils.js
 * AI Job Matching engine for FreelanceChain
 * - Fetches user profile skills from Firebase (users collection)
 * - Compares against job requiredSkills / _meta.skills
 * - Returns a match score (0-100) and matched/missing skill arrays
 */

import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";

/**
 * Fetch user skills array from Firebase users collection
 * @param {string} walletAddress - the user's wallet address (used as doc ID)
 * @returns {Promise<string[]>} - array of skill strings, lowercase
 */
export async function fetchUserSkills(walletAddress) {
  if (!walletAddress) return [];
  try {
    const ref = doc(db, "users", walletAddress);
    // getDoc will now use the persistent cache we enabled in firebase.js if offline
    const snap = await getDoc(ref);
    if (snap.exists()) {
      const data = snap.data();
      const skills = data.skills || data.skillSet || [];
      return skills.map((s) => String(s).toLowerCase().trim());
    }
  } catch (err) {
    if (err.code === "unavailable" || err.message.includes("offline")) {
      console.log("[AI Match] Client is offline, matching based on local cache or returning empty.");
    } else {
      console.warn("[AI Match] Failed to load user skills:", err);
    }
  }
  return [];
}

/**
 * Calculate match score between user skills and a job's required skills
 * @param {string[]} userSkills   - lowercase user skills
 * @param {string[]} jobSkills    - job's required/relevant skills (any case)
 * @returns {{ score: number, matchedSkills: string[], missingSkills: string[], matchPct: number }}
 */
export function calculateMatchScore(userSkills, jobSkills) {
  if (!jobSkills || jobSkills.length === 0) {
    return { score: 0, matchedSkills: [], missingSkills: [], matchPct: 0 };
  }

  const normalizedJob = jobSkills.map((s) => String(s).toLowerCase().trim());
  const matched = normalizedJob.filter((js) =>
    userSkills.some((us) => us === js || js.includes(us) || us.includes(js))
  );
  const missing = normalizedJob.filter((js) => !matched.includes(js));

  const matchPct = Math.round((matched.length / normalizedJob.length) * 100);

  return {
    score: matched.length,
    matchedSkills: matched,
    missingSkills: missing,
    matchPct,
  };
}

/**
 * Badge color based on match %
 */
export function getMatchBadgeStyle(matchPct) {
  if (matchPct >= 80) {
    return {
      bg: "rgba(52, 211, 153, 0.15)",
      border: "rgba(52, 211, 153, 0.4)",
      color: "#34d399",
      label: `${matchPct}% MATCH`,
    };
  } else if (matchPct >= 60) {
    return {
      bg: "rgba(251, 191, 36, 0.15)",
      border: "rgba(251, 191, 36, 0.4)",
      color: "#fbbf24",
      label: `${matchPct}% MATCH`,
    };
  } else {
    return {
      bg: "rgba(99, 102, 241, 0.1)",
      border: "rgba(99, 102, 241, 0.3)",
      color: "#a78bfa",
      label: `${matchPct}% MATCH`,
    };
  }
}

/**
 * Sort & filter jobs with AI match scores applied
 * @param {object[]} jobs       - raw jobs (already filtered)
 * @param {string[]} userSkills - user skills (lowercase)
 * @param {Function} getSkillsFn - fn(job) => string[] to extract job skills
 * @returns {object[]} jobs with _matchScore, _matchedSkills, _missingSkills, _matchPct attached
 */
export function applyMatchScores(jobs, userSkills, getSkillsFn) {
  return jobs.map((job) => {
    const jobSkills = getSkillsFn(job);
    const { score, matchedSkills, missingSkills, matchPct } =
      calculateMatchScore(userSkills, jobSkills);
    return { ...job, _matchScore: score, _matchedSkills: matchedSkills, _missingSkills: missingSkills, _matchPct: matchPct };
  });
}
