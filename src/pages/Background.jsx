import React from "react";

const Background = () => {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden bg-black">
      <style>{`
        @keyframes float-blob-1 {
          0% {
            transform: translate(0, 0) scale(1);
            opacity: 0.3;
          }
          33% {
            transform: translate(100px, -50px) scale(1.1);
            opacity: 0.4;
          }
          66% {
            transform: translate(-50px, 100px) scale(0.9);
            opacity: 0.35;
          }
          100% {
            transform: translate(0, 0) scale(1);
            opacity: 0.3;
          }
        }
        
        @keyframes float-blob-2 {
          0% {
            transform: translate(0, 0) scale(1);
            opacity: 0.3;
          }
          33% {
            transform: translate(-80px, 60px) scale(0.9);
            opacity: 0.4;
          }
          66% {
            transform: translate(40px, -120px) scale(1.2);
            opacity: 0.35;
          }
          100% {
            transform: translate(0, 0) scale(1);
            opacity: 0.3;
          }
        }
        
        @keyframes float-blob-3 {
          0% {
            transform: translate(0, 0) scale(1);
            opacity: 0.2;
          }
          33% {
            transform: translate(60px, -60px) scale(1.1);
            opacity: 0.25;
          }
          66% {
            transform: translate(-40px, 80px) scale(0.95);
            opacity: 0.22;
          }
          100% {
            transform: translate(0, 0) scale(1);
            opacity: 0.2;
          }
        }
        
        .blob {
          position: absolute;
          border-radius: 50%;
          filter: blur(80px);
        }
        
        .blob-1 {
          width: 600px;
          height: 600px;
          background: rgba(147, 51, 234, 0.3);
          top: -150px;
          left: -150px;
          animation: float-blob-1 22s ease-in-out infinite;
        }
        
        .blob-2 {
          width: 500px;
          height: 500px;
          background: rgba(79, 70, 229, 0.3);
          bottom: -150px;
          right: -150px;
          animation: float-blob-2 28s ease-in-out infinite 5s;
        }
        
        .blob-3 {
          width: 400px;
          height: 400px;
          background: rgba(236, 72, 153, 0.2);
          top: 40%;
          left: 40%;
          animation: float-blob-3 25s ease-in-out infinite 2s;
        }
      `}</style>
      <div className="blob blob-1" />
      <div className="blob blob-2" />
      <div className="blob blob-3" />
    </div>
  );
};

export default Background;