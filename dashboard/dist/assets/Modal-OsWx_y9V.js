import{j as e}from"./index-DM7CdZmV.js";import{X as d,a2 as f,F as n,ar as h}from"./vendor-icons-Cowr8jNy.js";function j({isOpen:r,onClose:a,onConfirm:i,title:t,message:l,type:s="info",confirmText:c="OK",cancelText:o="Annuler",showCancel:m=!1}){if(!r)return null;const x=()=>{i&&i(),a()};return e.jsxs("div",{className:"fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4",children:[e.jsxs("div",{className:"bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in duration-200",children:[e.jsx("div",{className:"flex justify-end p-2",children:e.jsx("button",{onClick:a,className:"p-2 rounded-lg hover:bg-gray-100 transition-colors",children:e.jsx(d,{size:20,className:"text-gray-400"})})}),e.jsxs("div",{className:"px-8 pb-8 text-center",children:[e.jsxs("div",{className:"flex justify-center mb-4",children:[s==="success"&&e.jsx("div",{className:"animate-bounce-in",children:e.jsx(f,{size:48,className:"text-emerald-500"})}),s==="warning"&&e.jsx("div",{className:"animate-shake",children:e.jsx(n,{size:48,className:"text-amber-500"})}),s==="error"&&e.jsx("div",{className:"animate-shake",children:e.jsx(n,{size:48,className:"text-red-500"})}),(s==="info"||s==="confirm")&&e.jsx("div",{className:"animate-pulse-slow",children:e.jsx(h,{size:48,className:"text-[#1E3A5F]"})})]}),e.jsx("h3",{className:"text-xl font-bold text-[#1E3A5F] mb-2",children:t}),e.jsx("p",{className:"text-gray-600 whitespace-pre-line",children:l}),e.jsxs("div",{className:"flex items-center justify-center gap-3 mt-6",children:[m&&e.jsx("button",{onClick:a,className:"px-6 py-2.5 text-gray-600 font-medium rounded-xl hover:bg-gray-100 transition-colors",children:o}),e.jsx("button",{onClick:x,className:`px-6 py-2.5 font-semibold rounded-xl transition-colors ${s==="error"?"bg-red-500 text-white hover:bg-red-600":s==="warning"?"bg-amber-500 text-white hover:bg-amber-600":"bg-[#1E3A5F] text-white hover:bg-[#2D5A8A]"}`,children:c})]})]})]}),e.jsx("style",{children:`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); }
          20%, 40%, 60%, 80% { transform: translateX(4px); }
        }
        
        @keyframes bounce-in {
          0% { transform: scale(0); opacity: 0; }
          50% { transform: scale(1.2); }
          100% { transform: scale(1); opacity: 1; }
        }
        
        @keyframes pulse-slow {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.1); opacity: 0.8; }
        }
        
        .animate-shake {
          animation: shake 0.6s ease-in-out;
        }
        
        .animate-bounce-in {
          animation: bounce-in 0.5s ease-out;
        }
        
        .animate-pulse-slow {
          animation: pulse-slow 2s ease-in-out infinite;
        }
      `})]})}export{j as M};
