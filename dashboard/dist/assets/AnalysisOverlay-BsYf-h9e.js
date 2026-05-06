import{j as e}from"./index-CyMuWM7Q.js";import{r as i}from"./vendor-react-D-oR_zYz.js";function Z({isVisible:o,totalProspects:a,currentProspect:s,currentProspectName:x,isCompleted:d,onCancel:p,errors:m=[],showErrors:j=!1}){const[r,f]=i.useState(0),[y,h]=i.useState(0);if(i.useEffect(()=>{if(o){f(0),h(0);const t=setInterval(()=>{f(n=>n+1)},1e3);return()=>clearInterval(t)}},[o]),i.useEffect(()=>{s>0&&r>0&&h(r/s)},[s,r]),!o)return null;const c=a===1;let l;d?l=100:c?l=98*(1-Math.exp(-r/18)):l=a>0?(s-1)/a*100:0;const w=a-s,u=Math.max(0,Math.round(w*y)),g=t=>{if(t<60)return`${t}s`;const n=Math.floor(t/60),b=t%60;return`${n}m ${b}s`};return j&&m.length>0?e.jsx("div",{className:"fixed inset-0 bg-[#1E3A5F]/80 backdrop-blur-sm flex items-center justify-center z-50",children:e.jsxs("div",{className:"bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 text-center",children:[e.jsx("div",{className:"w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4",children:e.jsxs("svg",{width:"32",height:"32",viewBox:"0 0 24 24",fill:"none",stroke:"#d97706",strokeWidth:"2.5",strokeLinecap:"round",strokeLinejoin:"round",children:[e.jsx("path",{d:"M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"}),e.jsx("line",{x1:"12",y1:"9",x2:"12",y2:"13"}),e.jsx("line",{x1:"12",y1:"17",x2:"12.01",y2:"17"})]})}),e.jsx("h2",{className:"text-xl font-bold text-gray-800 mb-1",children:"Aucun bien disponible"}),e.jsx("p",{className:"text-gray-500 text-sm mb-5",children:"Aucun bien du catalogue ne correspond aux critères de ce prospect."}),e.jsx("div",{className:"space-y-3 mb-2",children:m.map((t,n)=>e.jsxs("div",{className:"bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-left",children:[e.jsx("p",{className:"font-bold text-amber-900 text-base mb-0.5",children:t.nom}),e.jsx("p",{className:"text-amber-700 text-sm",children:t.msg})]},n))}),e.jsx("p",{className:"text-xs text-gray-400 mt-4",children:"Fermeture automatique dans quelques secondes…"})]})}):e.jsx("div",{className:"fixed inset-0 bg-[#1E3A5F]/80 backdrop-blur-sm flex items-center justify-center z-50",children:e.jsxs("div",{className:"bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 text-center relative",children:[p&&!d&&e.jsx("button",{onClick:p,className:"absolute top-4 right-4 w-9 h-9 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors",title:"Annuler l'analyse",children:e.jsxs("svg",{xmlns:"http://www.w3.org/2000/svg",width:"18",height:"18",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2.5",strokeLinecap:"round",strokeLinejoin:"round",children:[e.jsx("line",{x1:"18",y1:"6",x2:"6",y2:"18"}),e.jsx("line",{x1:"6",y1:"6",x2:"18",y2:"18"})]})}),e.jsxs("div",{className:"relative w-32 h-40 mx-auto mb-4",children:[e.jsx("style",{children:`
            .loader-container {
              --fill-color: #1E3A5F;
              --shine-color: #1E3A5F33;
              transform: scale(0.6);
              width: 100px;
              height: 100px;
              position: relative;
              filter: drop-shadow(0 0 10px var(--shine-color));
            }
            .loader-container #pegtopone {
              position: absolute;
              animation: flowe-one 1s linear infinite;
            }
            .loader-container #pegtoptwo {
              position: absolute;
              opacity: 0;
              transform: scale(0) translateY(-200px) translateX(-100px);
              animation: flowe-two 1s linear infinite;
              animation-delay: 0.3s;
            }
            .loader-container #pegtopthree {
              position: absolute;
              opacity: 0;
              transform: scale(0) translateY(-200px) translateX(100px);
              animation: flowe-three 1s linear infinite;
              animation-delay: 0.6s;
            }
            .loader-container svg g path:first-child {
              fill: var(--fill-color);
            }
            @keyframes flowe-one {
              0% { transform: scale(0.5) translateY(-200px); opacity: 0; }
              25% { transform: scale(0.75) translateY(-100px); opacity: 1; }
              50% { transform: scale(1) translateY(0px); opacity: 1; }
              75% { transform: scale(0.5) translateY(50px); opacity: 1; }
              100% { transform: scale(0) translateY(100px); opacity: 0; }
            }
            @keyframes flowe-two {
              0% { transform: scale(0.5) rotateZ(-10deg) translateY(-200px) translateX(-100px); opacity: 0; }
              25% { transform: scale(1) rotateZ(-5deg) translateY(-100px) translateX(-50px); opacity: 1; }
              50% { transform: scale(1) rotateZ(0deg) translateY(0px) translateX(-25px); opacity: 1; }
              75% { transform: scale(0.5) rotateZ(5deg) translateY(50px) translateX(0px); opacity: 1; }
              100% { transform: scale(0) rotateZ(10deg) translateY(100px) translateX(25px); opacity: 0; }
            }
            @keyframes flowe-three {
              0% { transform: scale(0.5) rotateZ(10deg) translateY(-200px) translateX(100px); opacity: 0; }
              25% { transform: scale(1) rotateZ(5deg) translateY(-100px) translateX(50px); opacity: 1; }
              50% { transform: scale(1) rotateZ(0deg) translateY(0px) translateX(25px); opacity: 1; }
              75% { transform: scale(0.5) rotateZ(-5deg) translateY(50px) translateX(0px); opacity: 1; }
              100% { transform: scale(0) rotateZ(-10deg) translateY(100px) translateX(-25px); opacity: 0; }
            }
          `}),e.jsxs("div",{className:"loader-container absolute inset-0 flex items-center justify-center mt-6",children:[e.jsxs("svg",{id:"pegtopone",xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 100 100",className:"w-full h-full",children:[e.jsxs("defs",{children:[e.jsx("filter",{id:"shine1",children:e.jsx("feGaussianBlur",{stdDeviation:"3"})}),e.jsx("mask",{id:"mask1",children:e.jsx("path",{d:"M63,37c-6.7-4-4-27-13-27s-6.3,23-13,27-27,4-27,13,20.3,9,27,13,4,27,13,27,6.3-23,13-27,27-4,27-13-20.3-9-27-13Z",fill:"white"})}),e.jsxs("radialGradient",{id:"grad1a",cx:"50",cy:"66",fx:"50",fy:"66",r:"30",gradientTransform:"translate(0 35) scale(1 0.5)",gradientUnits:"userSpaceOnUse",children:[e.jsx("stop",{offset:"0%",stopColor:"black",stopOpacity:"0.3"}),e.jsx("stop",{offset:"50%",stopColor:"black",stopOpacity:"0.1"}),e.jsx("stop",{offset:"100%",stopColor:"black",stopOpacity:"0"})]}),e.jsxs("radialGradient",{id:"grad1b",cx:"55",cy:"20",fx:"55",fy:"20",r:"30",gradientUnits:"userSpaceOnUse",children:[e.jsx("stop",{offset:"0%",stopColor:"white",stopOpacity:"0.3"}),e.jsx("stop",{offset:"50%",stopColor:"white",stopOpacity:"0.1"}),e.jsx("stop",{offset:"100%",stopColor:"white",stopOpacity:"0"})]})]}),e.jsxs("g",{children:[e.jsx("path",{d:"M63,37c-6.7-4-4-27-13-27s-6.3,23-13,27-27,4-27,13,20.3,9,27,13,4,27,13,27,6.3-23,13-27,27-4,27-13-20.3-9-27-13Z",fill:"currentColor"}),e.jsx("path",{d:"M63,37c-6.7-4-4-27-13-27s-6.3,23-13,27-27,4-27,13,20.3,9,27,13,4,27,13,27,6.3-23,13-27,27-4,27-13-20.3-9-27-13Z",fill:"url(#grad1a)"}),e.jsx("path",{d:"M63,37c-6.7-4-4-27-13-27s-6.3,23-13,27-27,4-27,13,20.3,9,27,13,4,27,13,27,6.3-23,13-27,27-4,27-13-20.3-9-27-13Z",fill:"url(#grad1b)"})]})]}),e.jsx("svg",{id:"pegtoptwo",xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 100 100",className:"w-full h-full",children:e.jsxs("g",{children:[e.jsx("path",{d:"M63,37c-6.7-4-4-27-13-27s-6.3,23-13,27-27,4-27,13,20.3,9,27,13,4,27,13,27,6.3-23,13-27,27-4,27-13-20.3-9-27-13Z",fill:"currentColor"}),e.jsx("path",{d:"M63,37c-6.7-4-4-27-13-27s-6.3,23-13,27-27,4-27,13,20.3,9,27,13,4,27,13,27,6.3-23,13-27,27-4,27-13-20.3-9-27-13Z",fill:"url(#grad1a)"}),e.jsx("path",{d:"M63,37c-6.7-4-4-27-13-27s-6.3,23-13,27-27,4-27,13,20.3,9,27,13,4,27,13,27,6.3-23,13-27,27-4,27-13-20.3-9-27-13Z",fill:"url(#grad1b)"})]})}),e.jsx("svg",{id:"pegtopthree",xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 100 100",className:"w-full h-full",children:e.jsxs("g",{children:[e.jsx("path",{d:"M63,37c-6.7-4-4-27-13-27s-6.3,23-13,27-27,4-27,13,20.3,9,27,13,4,27,13,27,6.3-23,13-27,27-4,27-13-20.3-9-27-13Z",fill:"currentColor"}),e.jsx("path",{d:"M63,37c-6.7-4-4-27-13-27s-6.3,23-13,27-27,4-27,13,20.3,9,27,13,4,27,13,27,6.3-23,13-27,27-4,27-13-20.3-9-27-13Z",fill:"url(#grad1a)"}),e.jsx("path",{d:"M63,37c-6.7-4-4-27-13-27s-6.3,23-13,27-27,4-27,13,20.3,9,27,13,4,27,13,27,6.3-23,13-27,27-4,27-13-20.3-9-27-13Z",fill:"url(#grad1b)"})]})})]})]}),e.jsx("h2",{className:"text-xl font-bold text-[#1E3A5F] mb-1",children:"Analyse en cours"}),e.jsx("p",{className:"text-gray-500 mb-6 text-sm",children:"L'IA analyse les correspondances..."}),x&&e.jsx("div",{className:"bg-[#DCE7F3] rounded-lg px-4 py-2 mb-4",children:e.jsx("p",{className:"text-sm text-[#1E3A5F] font-medium",children:x})}),e.jsxs("div",{className:"mb-4",children:[e.jsxs("div",{className:"flex justify-between text-sm text-gray-500 mb-2",children:[e.jsx("span",{children:c?"Analyse...":`${s} / ${a} prospects`}),e.jsxs("span",{children:[Math.round(l),"%"]})]}),e.jsx("div",{className:"h-2 bg-gray-200 rounded-full overflow-hidden",children:e.jsx("div",{className:"h-full bg-gradient-to-r from-[#1E3A5F] to-[#2D5A8A] rounded-full transition-all duration-500",style:{width:`${l}%`}})})]}),e.jsxs("div",{className:"flex justify-center gap-6 text-sm text-gray-400",children:[e.jsxs("span",{children:["Écoulé : ",g(r)]}),!c&&s>1&&u>0&&e.jsxs("span",{children:["Restant : ~",g(u)]})]})]})})}export{Z as A};
