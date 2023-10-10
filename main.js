(()=>{"use strict";const o=document.getElementById("canvas"),n=o.getContext("webgl"),t=1e-6,e=function(o,n,t){const e=i(o,o.VERTEX_SHADER,"\n    attribute vec4 a_Position;\n    void main() {\n        gl_Position = a_Position;\n    }\n"),l=i(o,o.FRAGMENT_SHADER,"\n    precision mediump float;\n    uniform vec3 my_color;\n    void main() {\n        gl_FragColor.rgb = my_color;\n        gl_FragColor.a = 1.0;\n    }\n");if(!e||!l)return null;const r=o.createProgram();if(!r)return console.log("unable to create program"),null;o.attachShader(r,e),o.attachShader(r,l),o.linkProgram(r);if(!o.getProgramParameter(r,o.LINK_STATUS)){const n=o.getProgramInfoLog(r);return console.log("Failed to link program: "+n),o.deleteProgram(r),o.deleteShader(l),o.deleteShader(e),null}return r}(n);e||console.log("Failed to create program"),n.useProgram(e);const l=n.getAttribLocation(e,"a_Position");n.enableVertexAttribArray(l);const r=n.createBuffer();n.bindBuffer(n.ARRAY_BUFFER,r);const c=n.FLOAT;n.vertexAttribPointer(l,2,c,!1,0,0);const s=n.getUniformLocation(e,"my_color");function i(o,n,t){const e=o.createShader(n);if(null===e)return console.log("unable to create shader"),null;if(o.shaderSource(e,t),o.compileShader(e),!o.getShaderParameter(e,o.COMPILE_STATUS)){const n=o.getShaderInfoLog(e);return console.log("Failed to compile shader: "+n),o.deleteShader(e),null}return e}function a(o){const t=[];o.forEach((o=>{t.push(o.x,o.y)}));const e=new Float32Array(t);n.bufferData(n.ARRAY_BUFFER,e,n.STATIC_DRAW);const l=n.LINE_LOOP,r=e.length/2;n.drawArrays(l,0,r)}class u{constructor(o,n){this.x=0,this.y=0,this.x=o,this.y=n}same(o){return Math.abs(this.x-o.x)<t&&Math.abs(this.y-o.y)<t}copy(){return new u(this.x,this.y)}toString(){return`(${this.x}, ${this.y})`}}class p{constructor(o,n){this.p1=o,this.p2=n}copy(){return new p(this.p1,this.p2)}}function g(o,n){const t=o.p1,e=o.p2,l=n;return(e.x-t.x)*(l.y-t.y)-(l.x-t.x)*(e.y-t.y)}class h{constructor(o){this.points=[],o.forEach((o=>{this.points.push(new u(o.x,o.y))}))}getedges(){const o=[];for(let n=0;n<this.points.length;n++){const t=this.points[n],e=this.points[(n+1)%this.points.length];o.push(new p(t,e))}return o}copy(){return new h(this.points)}}class f{constructor(){this.loops=[]}add_loop(o){this.loops.push(o.copy())}}const d=new f,y=new f,m=new f,E=document.getElementById("main-polygon-button"),_=document.getElementById("clip-polygon-button"),x=document.getElementById("clip-button"),A=document.getElementById("clear-button"),P=document.getElementById("undo-button"),R=document.getElementById("state-text");function w(o,n){const e=[];return o.getedges().forEach((o=>{const l=[];n.loops.forEach((n=>{n.getedges().forEach((n=>{const e=function(o,n){if(g(o,n.p1)*g(o,n.p2)>=-t)return null;const e=g(n,o.p1),l=g(n,o.p2);if(e*l>=-t)return null;const r=e/(e-l),c=o.p1.x+(o.p2.x-o.p1.x)*r,s=o.p1.y+(o.p2.y-o.p1.y)*r;return new u(c,s)}(o,n);null!==e&&l.push(e)}))})),l.sort(((n,t)=>(n.x-o.p1.x)*(n.x-o.p1.x)+(n.y-o.p1.y)*(n.y-o.p1.y)-((t.x-o.p1.x)*(t.x-o.p1.x)+(t.y-o.p1.y)*(t.y-o.p1.y)))),e.push(o.p1.copy()),e.push(...l)})),e}function S(o,n){for(const[t,e]of n){const n=F(o,e);if(-1!==n)return[t,n,e]}return[null,-1,[]]}function F(o,n){for(let t=0;t<n.length;t++)if(n[t].same(o))return t;return-1}function b(o,n){for(const t of n)if(t.same(o))return!0;return!1}function I(o,n,t){for(const[e,l]of o)for(let o=0;o<l.length;o++){const e=l[o];if(b(e,t))continue;const[r,c]=S(e,n);if(null!==r&&-1!==c)return e}return null}var L;!function(o){o[o.MainPolygon=0]="MainPolygon",o[o.ClipPolygon=1]="ClipPolygon"}(L||(L={}));let T=L.MainPolygon;const v=[];function M(o,t,e){n.uniform3f(s,o,t,e)}function B(){n.clearColor(1,1,1,1),n.clear(n.COLOR_BUFFER_BIT),M(1,0,0),console.log("main_polygon",d),d.loops.forEach((o=>{a(o.points)})),M(0,0,1),console.log("clip_polygon",y),y.loops.forEach((o=>{a(o.points)})),M(0,1,1),console.log("clipped_polygon",m),m.loops.forEach((o=>{a(o.points)})),T===L.MainPolygon?M(1,0,0):M(0,0,1),console.log("current_points",v),v.forEach((o=>{!function(o,t,e=.01){const l=[o,t];for(let n=0;n<=100;n++){const r=2*Math.PI/100*n,c=o+e*Math.cos(r),s=t+e*Math.sin(r);l.push(c,s)}const r=new Float32Array(l);n.bufferData(n.ARRAY_BUFFER,r,n.STATIC_DRAW);const c=n.TRIANGLE_FAN,s=r.length/2;n.drawArrays(c,0,s)}(o.x,o.y)})),function(o){const t=[];o.forEach((o=>{t.push(o.x,o.y)}));const e=new Float32Array(t);n.bufferData(n.ARRAY_BUFFER,e,n.STATIC_DRAW);const l=n.LINE_STRIP,r=e.length/2;n.drawArrays(l,0,r)}(v)}E.addEventListener("click",(o=>{v.length>0?alert("请先绘制当前多边形"):(T=L.MainPolygon,R.innerText="输入主多边形")})),_.addEventListener("click",(o=>{v.length>0?alert("请先绘制当前多边形"):(T=L.ClipPolygon,R.innerText="输入裁剪多边形")})),A.addEventListener("click",(o=>{console.log("clear"),d.loops.length=0,y.loops.length=0,m.loops.length=0,v.length=0,T=L.MainPolygon,R.innerText="输入主多边形",B()})),x.addEventListener("click",(o=>{console.log("clip"),function(o,n){const t=new Map,e=new Map;o.loops.forEach((o=>{t.set(o,w(o,n))})),n.loops.forEach((n=>{e.set(n,w(n,o))})),console.log("m_points",t),console.log("c_points",e);const l=[];let r=I(t,e,l);if(null===r)return void alert("没有交点");const c=[],s=[];for(;!b(r,l)||(r=I(t,e,l),console.log("find loop",s.toString()),c.push([]),s.forEach((o=>{c[c.length-1].push(o.copy())})),s.length=0,null!==r);){const[o,n,c]=S(r,t),[i,a,u]=S(r,e);if(s.push(r.copy()),l.push(r.copy()),null===o){r=u[(a+1)%u.length];continue}if(null===i){r=c[(n+1)%c.length];continue}const h=c[(n+1)%c.length],f=u[(a+1)%u.length];r=g(new p(r,h),f)<0?h.copy():f.copy()}m.loops.length=0,c.forEach((o=>{m.add_loop(new h(o))}))}(d,y),B()})),P.addEventListener("click",(o=>{console.log("undo"),v.length>0?v.pop():T===L.MainPolygon?d.loops.length>0&&d.loops.pop():y.loops.length>0&&y.loops.pop(),B()})),o.addEventListener("click",(n=>{const[t,e]=function(n,t){const e=o.getBoundingClientRect(),l=o.width,r=o.height;return[(n-e.left)/l*2-1,(t-e.top)/r*-2+1]}(n.clientX,n.clientY);console.log("left click"),v.push(new u(t,e)),B()})),o.addEventListener("contextmenu",(o=>{if(console.log("right click"),o.preventDefault(),v.length<3)return void alert("至少需要三个点");const n=new h(v);T===L.MainPolygon?d.add_loop(n):y.add_loop(n),v.length=0,B()}))})();