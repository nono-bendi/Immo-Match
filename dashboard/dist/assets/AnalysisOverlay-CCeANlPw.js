import{j as t}from"./index-4UyToUmK.js";import{r as n}from"./vendor-react-D-oR_zYz.js";function b({isVisible:o,totalProspects:a,currentProspect:e,currentProspectName:x,isCompleted:d,onCancel:p}){const[r,f]=n.useState(0),[j,m]=n.useState(0);if(n.useEffect(()=>{if(o){f(0),m(0);const s=setInterval(()=>{f(c=>c+1)},1e3);return()=>clearInterval(s)}},[o]),n.useEffect(()=>{e>0&&r>0&&m(r/e)},[e,r]),!o)return null;const i=a===1;let l;d?l=100:i?l=98*(1-Math.exp(-r/18)):l=a>0?(e-1)/a*100:0;const u=a-e,h=Math.max(0,Math.round(u*j)),g=s=>{if(s<60)return`${s}s`;const c=Math.floor(s/60),y=s%60;return`${c}m ${y}s`};return t.jsx("div",{className:"fixed inset-0 bg-[#1E3A5F]/80 backdrop-blur-sm flex items-center justify-center z-50",children:t.jsxs("div",{className:"bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 text-center relative",children:[p&&!d&&t.jsx("button",{onClick:p,className:"absolute top-4 right-4 w-9 h-9 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors",title:"Annuler l'analyse",children:t.jsxs("svg",{xmlns:"http://www.w3.org/2000/svg",width:"18",height:"18",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2.5",strokeLinecap:"round",strokeLinejoin:"round",children:[t.jsx("line",{x1:"18",y1:"6",x2:"6",y2:"18"}),t.jsx("line",{x1:"6",y1:"6",x2:"18",y2:"18"})]})}),t.jsxs("div",{className:"relative w-32 h-40 mx-auto mb-4",children:[t.jsx("style",{children:`
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
          `}),t.jsxs("div",{className:"loader-container absolute inset-0 flex items-center justify-center mt-6",children:[t.jsxs("svg",{id:"pegtopone",xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 100 100",className:"w-full h-full",children:[t.jsxs("defs",{children:[t.jsx("filter",{id:"shine1",children:t.jsx("feGaussianBlur",{stdDeviation:"3"})}),t.jsx("mask",{id:"mask1",children:t.jsx("path",{d:"M63,37c-6.7-4-4-27-13-27s-6.3,23-13,27-27,4-27,13,20.3,9,27,13,4,27,13,27,6.3-23,13-27,27-4,27-13-20.3-9-27-13Z",fill:"white"})}),t.jsxs("radialGradient",{id:"grad1a",cx:"50",cy:"66",fx:"50",fy:"66",r:"30",gradientTransform:"translate(0 35) scale(1 0.5)",gradientUnits:"userSpaceOnUse",children:[t.jsx("stop",{offset:"0%",stopColor:"black",stopOpacity:"0.3"}),t.jsx("stop",{offset:"50%",stopColor:"black",stopOpacity:"0.1"}),t.jsx("stop",{offset:"100%",stopColor:"black",stopOpacity:"0"})]}),t.jsxs("radialGradient",{id:"grad1b",cx:"55",cy:"20",fx:"55",fy:"20",r:"30",gradientUnits:"userSpaceOnUse",children:[t.jsx("stop",{offset:"0%",stopColor:"white",stopOpacity:"0.3"}),t.jsx("stop",{offset:"50%",stopColor:"white",stopOpacity:"0.1"}),t.jsx("stop",{offset:"100%",stopColor:"white",stopOpacity:"0"})]})]}),t.jsxs("g",{children:[t.jsx("path",{d:"M63,37c-6.7-4-4-27-13-27s-6.3,23-13,27-27,4-27,13,20.3,9,27,13,4,27,13,27,6.3-23,13-27,27-4,27-13-20.3-9-27-13Z",fill:"currentColor"}),t.jsx("path",{d:"M63,37c-6.7-4-4-27-13-27s-6.3,23-13,27-27,4-27,13,20.3,9,27,13,4,27,13,27,6.3-23,13-27,27-4,27-13-20.3-9-27-13Z",fill:"url(#grad1a)"}),t.jsx("path",{d:"M63,37c-6.7-4-4-27-13-27s-6.3,23-13,27-27,4-27,13,20.3,9,27,13,4,27,13,27,6.3-23,13-27,27-4,27-13-20.3-9-27-13Z",fill:"url(#grad1b)"})]})]}),t.jsx("svg",{id:"pegtoptwo",xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 100 100",className:"w-full h-full",children:t.jsxs("g",{children:[t.jsx("path",{d:"M63,37c-6.7-4-4-27-13-27s-6.3,23-13,27-27,4-27,13,20.3,9,27,13,4,27,13,27,6.3-23,13-27,27-4,27-13-20.3-9-27-13Z",fill:"currentColor"}),t.jsx("path",{d:"M63,37c-6.7-4-4-27-13-27s-6.3,23-13,27-27,4-27,13,20.3,9,27,13,4,27,13,27,6.3-23,13-27,27-4,27-13-20.3-9-27-13Z",fill:"url(#grad1a)"}),t.jsx("path",{d:"M63,37c-6.7-4-4-27-13-27s-6.3,23-13,27-27,4-27,13,20.3,9,27,13,4,27,13,27,6.3-23,13-27,27-4,27-13-20.3-9-27-13Z",fill:"url(#grad1b)"})]})}),t.jsx("svg",{id:"pegtopthree",xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 100 100",className:"w-full h-full",children:t.jsxs("g",{children:[t.jsx("path",{d:"M63,37c-6.7-4-4-27-13-27s-6.3,23-13,27-27,4-27,13,20.3,9,27,13,4,27,13,27,6.3-23,13-27,27-4,27-13-20.3-9-27-13Z",fill:"currentColor"}),t.jsx("path",{d:"M63,37c-6.7-4-4-27-13-27s-6.3,23-13,27-27,4-27,13,20.3,9,27,13,4,27,13,27,6.3-23,13-27,27-4,27-13-20.3-9-27-13Z",fill:"url(#grad1a)"}),t.jsx("path",{d:"M63,37c-6.7-4-4-27-13-27s-6.3,23-13,27-27,4-27,13,20.3,9,27,13,4,27,13,27,6.3-23,13-27,27-4,27-13-20.3-9-27-13Z",fill:"url(#grad1b)"})]})})]})]}),t.jsx("h2",{className:"text-xl font-bold text-[#1E3A5F] mb-1",children:"Analyse en cours"}),t.jsx("p",{className:"text-gray-500 mb-6 text-sm",children:"L'IA analyse les correspondances..."}),x&&t.jsx("div",{className:"bg-[#DCE7F3] rounded-lg px-4 py-2 mb-4",children:t.jsx("p",{className:"text-sm text-[#1E3A5F] font-medium",children:x})}),t.jsxs("div",{className:"mb-4",children:[t.jsxs("div",{className:"flex justify-between text-sm text-gray-500 mb-2",children:[t.jsx("span",{children:i?"Analyse...":`${e} / ${a} prospects`}),t.jsxs("span",{children:[Math.round(l),"%"]})]}),t.jsx("div",{className:"h-2 bg-gray-200 rounded-full overflow-hidden",children:t.jsx("div",{className:"h-full bg-gradient-to-r from-[#1E3A5F] to-[#2D5A8A] rounded-full transition-all duration-500",style:{width:`${l}%`}})})]}),t.jsxs("div",{className:"flex justify-center gap-6 text-sm text-gray-400",children:[t.jsxs("span",{children:["Écoulé : ",g(r)]}),!i&&e>1&&h>0&&t.jsxs("span",{children:["Restant : ~",g(h)]})]})]})})}export{b as A};
