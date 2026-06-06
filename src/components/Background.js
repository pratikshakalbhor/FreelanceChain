import { useEffect, useRef } from "react";
import { useTheme } from "../context/ThemeContext";
import bgDark from "../assets/bg-dark.png";
import bgLight from "../assets/bg-light.png";

export default function Background() {
  const canvasRef = useRef(null);
  const { isDark } = useTheme();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    let animId;
    let W = window.innerWidth;
    let H = window.innerHeight;
    canvas.width = W;
    canvas.height = H;

    const NODE_COUNT = 60;
    const MAX_DIST = 200;
    const SPEED = 0.25;

    const nodeColor = isDark ? "rgba(167,139,250,{a})" : "rgba(99,102,241,{a})";
    const lineColor = isDark ? "rgba(139,92,246,{a})" : "rgba(79,70,229,{a})";
    
    const nodes = Array.from({ length: NODE_COUNT }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      vx: (Math.random() - 0.5) * SPEED,
      vy: (Math.random() - 0.5) * SPEED,
      r: Math.random() * 2 + 1,
    }));

    function mkColor(template, alpha) {
      return template.replace("{a}", alpha.toFixed(3));
    }

    function draw() {
      ctx.clearRect(0, 0, W, H);

      // Draw Network Lines
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x;
          const dy = nodes[i].y - nodes[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < MAX_DIST) {
            const alpha = (1 - dist / MAX_DIST) * (isDark ? 0.2 : 0.15);
            ctx.beginPath();
            ctx.moveTo(nodes[i].x, nodes[i].y);
            ctx.lineTo(nodes[j].x, nodes[j].y);
            ctx.strokeStyle = mkColor(lineColor, alpha);
            ctx.lineWidth = 0.8;
            ctx.stroke();
          }
        }
      }

      // Draw Talent Nodes
      for (const node of nodes) {
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.r, 0, Math.PI * 2);
        ctx.fillStyle = mkColor(nodeColor, isDark ? 0.6 : 0.4);
        ctx.fill();
        
        // Add subtle glow
        if (isDark) {
          ctx.beginPath();
          const grd = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, node.r * 4);
          grd.addColorStop(0, mkColor(nodeColor, 0.2));
          grd.addColorStop(1, mkColor(nodeColor, 0));
          ctx.arc(node.x, node.y, node.r * 4, 0, Math.PI * 2);
          ctx.fillStyle = grd;
          ctx.fill();
        }
      }
    }

    function update() {
      for (const node of nodes) {
        node.x += node.vx;
        node.y += node.vy;
        if (node.x < 0 || node.x > W) node.vx *= -1;
        if (node.y < 0 || node.y > H) node.vy *= -1;
      }
    }

    function loop() {
      update();
      draw();
      animId = requestAnimationFrame(loop);
    }

    loop();

    const onResize = () => {
      W = window.innerWidth;
      H = window.innerHeight;
      canvas.width = W;
      canvas.height = H;
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", onResize);
    };
  }, [isDark]);

  return (
    <>
      {/* Base Layer — Job Platform Themed Blurrred Image */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: -2,
          backgroundImage: `url(${isDark ? bgDark : bgLight})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          filter: "blur(60px) saturate(1.1)",
          transform: "scale(1.15)", // prevent blur edges
        }}
      />

      {/* Overlay Layer — Darken for readability */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: -1,
          background: isDark 
            ? "linear-gradient(135deg, rgba(2,6,15,0.92) 0%, rgba(10,14,24,0.85) 100%)"
            : "linear-gradient(135deg, rgba(255,255,255,0.85) 0%, rgba(243,244,246,0.7) 100%)",
        }}
      />

      {/* Animation Layer — Talent Network Plexus */}
      <canvas
        ref={canvasRef}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 0,
          pointerEvents: "none",
          display: "block",
          opacity: 0.35,
        }}
      />
    </>
  );
}