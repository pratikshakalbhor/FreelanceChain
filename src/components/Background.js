import React from "react";

const Background = () => {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden bg-black">
      <div className="absolute w-[600px] h-[600px] bg-purple-700 rounded-full blur-3xl opacity-30 animate-pulse top-[-150px] left-[-150px]" />
      <div className="absolute w-[500px] h-[500px] bg-indigo-600 rounded-full blur-3xl opacity-30 bottom-[-150px] right-[-150px]" />
      <div className="absolute w-[400px] h-[400px] bg-pink-600 rounded-full blur-3xl opacity-20 top-[40%] left-[40%]" />
    </div>
  );
};

export default Background;