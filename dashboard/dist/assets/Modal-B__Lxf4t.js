import{j as e}from"./index-BfI2KKV7.js";import{X as x,D as u,F as n,aq as f}from"./vendor-icons-DZHMoBuq.js";function p({isOpen:i,onClose:s,onConfirm:r,title:t,message:l,type:a="info",confirmText:o="OK",cancelText:c="Annuler",showCancel:d=!1}){if(!i)return null;const m=()=>{r&&r(),s()};return e.jsxs("div",{className:"fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4",children:[e.jsxs("div",{className:"rounded-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in duration-200",style:{background:"var(--surface-card-bg)",backdropFilter:"blur(20px)",WebkitBackdropFilter:"blur(20px)",border:"1px solid var(--surface-card-border)",boxShadow:"var(--shadow-card)"},children:[e.jsx("div",{className:"flex justify-end p-2",children:e.jsx("button",{onClick:s,className:"p-2 rounded-lg hover:bg-gray-100 transition-colors",children:e.jsx(x,{size:20,className:"text-gray-400"})})}),e.jsxs("div",{className:"px-8 pb-8 text-center",children:[e.jsxs("div",{className:"flex justify-center mb-4",children:[a==="success"&&e.jsx("div",{className:"animate-bounce-in",children:e.jsx(u,{size:48,className:"text-emerald-500"})}),a==="warning"&&e.jsx("div",{className:"animate-shake",children:e.jsx(n,{size:48,className:"text-amber-500"})}),a==="error"&&e.jsx("div",{className:"animate-shake",children:e.jsx(n,{size:48,className:"text-red-500"})}),(a==="info"||a==="confirm")&&e.jsx("div",{className:"animate-pulse-slow",children:e.jsx(f,{size:48,className:"text-[#1E3A5F]"})})]}),e.jsx("h3",{className:"text-xl font-bold text-[#1E3A5F] mb-2",children:t}),e.jsx("p",{className:"text-gray-600 whitespace-pre-line",children:l}),e.jsxs("div",{className:"flex items-center justify-center gap-3 mt-6",children:[d&&e.jsx("button",{onClick:s,className:"px-6 py-2.5 text-gray-600 font-medium rounded-xl hover:bg-gray-100 transition-colors",children:c}),e.jsx("button",{onClick:m,className:"px-6 py-2.5 font-semibold rounded-xl transition-colors text-white",style:a==="error"?{background:"#ef4444"}:a==="warning"?{background:"#f59e0b"}:{background:"var(--gradient-primary)",boxShadow:"var(--shadow-button)"},children:o})]})]})]}),e.jsx("style",{children:`
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
      `})]})}export{p as M};
