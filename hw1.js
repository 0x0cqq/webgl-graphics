(()=>{"use strict";const o=document.getElementById("canvas"),n=o.getContext("webgl"),t=1e-6,e=function(o,n,t){const e=i(o,o.VERTEX_SHADER,"\n    attribute vec4 a_Position;\n    void main() {\n        gl_Position = a_Position;\n    }\n"),l=i(o,o.FRAGMENT_SHADER,"\n    precision mediump float;\n    uniform vec3 my_color;\n    void main() {\n        gl_FragColor.rgb = my_color;\n        gl_FragColor.a = 1.0;\n    }\n");if(!e||!l)return null;const r=o.createProgram();if(!r)return console.log("unable to create program"),null;o.attachShader(r,e),o.attachShader(r,l),o.linkProgram(r);if(!o.getProgramParameter(r,o.LINK_STATUS)){const n=o.getProgramInfoLog(r);return console.log("Failed to link program: "+n),o.deleteProgram(r),o.deleteShader(l),o.deleteShader(e),null}return r}(n);e||console.log("Failed to create program"),n.useProgram(e);const l=n.getAttribLocation(e,"a_Position");n.enableVertexAttribArray(l);const r=n.createBuffer();n.bindBuffer(n.ARRAY_BUFFER,r);const c=n.FLOAT;n.vertexAttribPointer(l,2,c,!1,0,0);const s=n.getUniformLocation(e,"my_color");function i(o,n,t){const e=o.createShader(n);if(null===e)return console.log("unable to create shader"),null;if(o.shaderSource(e,t),o.compileShader(e),!o.getShaderParameter(e,o.COMPILE_STATUS)){const n=o.getShaderInfoLog(e);return console.log("Failed to compile shader: "+n),o.deleteShader(e),null}return e}function a(o){const t=[];o.forEach((o=>{t.push(o.x,o.y)}));const e=new Float32Array(t);n.bufferData(n.ARRAY_BUFFER,e,n.STATIC_DRAW);const l=n.LINE_LOOP,r=e.length/2;n.drawArrays(l,0,r)}class p{constructor(o,n){this.x=0,this.y=0,this.x=o,this.y=n}same(o){return Math.abs(this.x-o.x)<t&&Math.abs(this.y-o.y)<t}copy(){return new p(this.x,this.y)}toString(){return`(${this.x}, ${this.y})`}}class u{constructor(o,n){this.p1=o,this.p2=n}copy(){return new u(this.p1,this.p2)}}function g(o,n,t){return(n.x-o.x)*(t.y-o.y)-(t.x-o.x)*(n.y-o.y)}function h(o,n){return g(o.p1,o.p2,n)}class f{constructor(o){this.points=[],o.forEach((o=>{this.points.push(new p(o.x,o.y))}))}getedges(){const o=[];for(let n=0;n<this.points.length;n++){const t=this.points[n],e=this.points[(n+1)%this.points.length];o.push(new u(t.copy(),e.copy()))}return o}copy(){return new f(this.points)}}class d{constructor(){this.loops=[]}add_loop(o){this.loops.push(o.copy())}}const y=new d,E=new d,m=new d,x=document.getElementById("main-polygon-button"),_=document.getElementById("clip-polygon-button"),A=document.getElementById("clip-button"),P=document.getElementById("clear-button"),R=document.getElementById("undo-button"),w=document.getElementById("state-text");function v(o,n){const e=[];return o.getedges().forEach((o=>{const l=[];n.loops.forEach((n=>{n.getedges().forEach((n=>{const e=function(o,n){if(h(o,n.p1)*h(o,n.p2)>=-t)return null;const e=h(n,o.p1),l=h(n,o.p2);if(e*l>=-t)return null;const r=e/(e-l),c=o.p1.x+(o.p2.x-o.p1.x)*r,s=o.p1.y+(o.p2.y-o.p1.y)*r;return new p(c,s)}(o,n);null!==e&&l.push(e)}))})),l.sort(((n,t)=>(n.x-o.p1.x)*(n.x-o.p1.x)+(n.y-o.p1.y)*(n.y-o.p1.y)-((t.x-o.p1.x)*(t.x-o.p1.x)+(t.y-o.p1.y)*(t.y-o.p1.y)))),e.push(o.p1.copy()),e.push(...l)})),e}function S(o,n){for(const[t,e]of n){const n=b(o,e);if(-1!==n)return[t,n,e]}return[null,-1,[]]}function b(o,n){for(let t=0;t<n.length;t++)if(n[t].same(o))return t;return-1}function F(o,n){for(const t of n)if(t.same(o))return!0;return!1}function I(o,n,t){for(const[e,l]of o)for(let o=0;o<l.length;o++){const e=l[o];if(F(e,t))continue;const[r,c]=S(e,n);if(null!==r&&-1!==c)return e}return null}function L(o,n){let e=!0;return o.points.forEach((o=>{!1===function(o,n){let e=0;return n.loops.forEach((n=>{e+=function(o,n){let e=0;return n.getedges().forEach((n=>{e+=function(o,n,t){const e=g(o,n,t),l=function(o,n,t){return(n.x-o.x)*(t.x-o.x)+(n.y-o.y)*(t.y-o.y)}(o,n,t);return Math.atan2(e,l)}(o,n.p1,n.p2)})),Math.abs(e)<t?0:e>0?1:-1}(o,n)})),e>0}(o,n)&&(console.log("not in polygon"),e=!1)})),e}var M;!function(o){o[o.MainPolygon=0]="MainPolygon",o[o.ClipPolygon=1]="ClipPolygon"}(M||(M={}));let T=M.MainPolygon;const B=[];function C(o,t,e){n.uniform3f(s,o,t,e)}function k(){n.clearColor(1,1,1,1),n.clear(n.COLOR_BUFFER_BIT),C(1,0,0),console.log("main_polygon",y),y.loops.forEach((o=>{a(o.points)})),C(0,0,1),console.log("clip_polygon",E),E.loops.forEach((o=>{a(o.points)})),C(0,1,1),console.log("clipped_polygon",m),m.loops.forEach((o=>{a(o.points)})),T===M.MainPolygon?C(1,0,0):C(0,0,1),console.log("current_points",B),B.forEach((o=>{!function(o,t,e=.01){const l=[o,t];for(let n=0;n<=100;n++){const r=2*Math.PI/100*n,c=o+e*Math.cos(r),s=t+e*Math.sin(r);l.push(c,s)}const r=new Float32Array(l);n.bufferData(n.ARRAY_BUFFER,r,n.STATIC_DRAW);const c=n.TRIANGLE_FAN,s=r.length/2;n.drawArrays(c,0,s)}(o.x,o.y)})),function(o){const t=[];o.forEach((o=>{t.push(o.x,o.y)}));const e=new Float32Array(t);n.bufferData(n.ARRAY_BUFFER,e,n.STATIC_DRAW);const l=n.LINE_STRIP,r=e.length/2;n.drawArrays(l,0,r)}(B)}x.addEventListener("click",(o=>{B.length>0?alert("请先绘制当前多边形"):(T=M.MainPolygon,w.innerText="输入主多边形")})),_.addEventListener("click",(o=>{B.length>0?alert("请先绘制当前多边形"):(T=M.ClipPolygon,w.innerText="输入裁剪多边形")})),P.addEventListener("click",(o=>{console.log("clear"),y.loops.length=0,E.loops.length=0,m.loops.length=0,B.length=0,T=M.MainPolygon,w.innerText="输入主多边形",k()})),A.addEventListener("click",(o=>{console.log("clip"),function(o,n){const t=new Map,e=new Map;o.loops.forEach((o=>{t.set(o,v(o,n))})),n.loops.forEach((n=>{e.set(n,v(n,o))})),console.log("m_points",t),console.log("c_points",e);const l=[];let r=I(t,e,l);const c=[],s=[];for(;null!==r&&(!F(r,l)||(r=I(t,e,l),console.log("find loop",s.toString()),c.push([]),s.forEach((o=>{c[c.length-1].push(o.copy())})),s.length=0,null!==r));){const[o,n,c]=S(r,t),[i,a,p]=S(r,e);if(s.push(r.copy()),l.push(r.copy()),null===o){r=p[(a+1)%p.length];continue}if(null===i){r=c[(n+1)%c.length];continue}const g=c[(n+1)%c.length],f=p[(a+1)%p.length];r=h(new u(r,g),f)<0?g.copy():f.copy()}o.loops.forEach((o=>{var e;(null===(e=t.get(o))||void 0===e?void 0:e.length)===o.points.length&&L(o,n)&&c.push(o.points)})),n.loops.forEach((n=>{var t;(null===(t=e.get(n))||void 0===t?void 0:t.length)===n.points.length?L(n,o)?c.push(n.points):console.log("not in polygon"):console.log("not intersected")})),m.loops.length=0,c.forEach((o=>{m.add_loop(new f(o))}))}(y,E),k()})),R.addEventListener("click",(o=>{console.log("undo"),B.length>0?B.pop():T===M.MainPolygon?y.loops.length>0&&y.loops.pop():E.loops.length>0&&E.loops.pop(),k()})),o.addEventListener("click",(n=>{const[t,e]=function(n,t){const e=o.getBoundingClientRect(),l=o.width,r=o.height;return[(n-e.left)/l*2-1,(t-e.top)/r*-2+1]}(n.clientX,n.clientY);console.log("left click"),B.push(new p(t,e)),k()})),o.addEventListener("contextmenu",(o=>{if(console.log("right click"),o.preventDefault(),B.length<3)return void alert("至少需要三个点");const n=new f(B);T===M.MainPolygon?y.add_loop(n):E.add_loop(n),B.length=0,k()}))})();