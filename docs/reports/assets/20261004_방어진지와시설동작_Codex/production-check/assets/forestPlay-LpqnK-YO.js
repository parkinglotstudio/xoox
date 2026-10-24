var wp=Object.defineProperty;var Ep=(r,t,e)=>t in r?wp(r,t,{enumerable:!0,configurable:!0,writable:!0,value:e}):r[t]=e;var R=(r,t,e)=>Ep(r,typeof t!="symbol"?t+"":t,e);(function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const i of document.querySelectorAll('link[rel="modulepreload"]'))n(i);new MutationObserver(i=>{for(const s of i)if(s.type==="childList")for(const o of s.addedNodes)o.tagName==="LINK"&&o.rel==="modulepreload"&&n(o)}).observe(document,{childList:!0,subtree:!0});function e(i){const s={};return i.integrity&&(s.integrity=i.integrity),i.referrerPolicy&&(s.referrerPolicy=i.referrerPolicy),i.crossOrigin==="use-credentials"?s.credentials="include":i.crossOrigin==="anonymous"?s.credentials="omit":s.credentials="same-origin",s}function n(i){if(i.ep)return;i.ep=!0;const s=e(i);fetch(i.href,s)}})();const Tp="modulepreload",Ap=function(r){return"/"+r},Ih={},$d=function(t,e,n){let i=Promise.resolve();if(e&&e.length>0){document.getElementsByTagName("link");const o=document.querySelector("meta[property=csp-nonce]"),a=(o==null?void 0:o.nonce)||(o==null?void 0:o.getAttribute("nonce"));i=Promise.allSettled(e.map(l=>{if(l=Ap(l),l in Ih)return;Ih[l]=!0;const c=l.endsWith(".css"),h=c?'[rel="stylesheet"]':"";if(document.querySelector(`link[href="${l}"]${h}`))return;const u=document.createElement("link");if(u.rel=c?"stylesheet":Tp,c||(u.as="script"),u.crossOrigin="",u.href=l,a&&u.setAttribute("nonce",a),document.head.appendChild(u),c)return new Promise((d,f)=>{u.addEventListener("load",d),u.addEventListener("error",()=>f(new Error(`Unable to preload CSS for ${l}`)))})}))}function s(o){const a=new Event("vite:preloadError",{cancelable:!0});if(a.payload=o,window.dispatchEvent(a),!a.defaultPrevented)throw o}return i.then(o=>{for(const a of o||[])a.status==="rejected"&&s(a.reason);return t().catch(s)})};/**
 * @license
 * Copyright 2010-2026 Three.js Authors
 * SPDX-License-Identifier: MIT
 */const Pc="185",Vs={ROTATE:0,DOLLY:1,PAN:2},Fs={ROTATE:0,PAN:1,DOLLY_PAN:2,DOLLY_ROTATE:3},Cp=0,Lh=1,Rp=2,zo=1,Yd=2,Rr=3,bi=0,cn=1,on=2,vi=0,Gs=1,Os=2,Dh=3,Nh=4,Pp=5,Qi=100,Ip=101,Lp=102,Dp=103,Np=104,Up=200,Fp=201,Op=202,kp=203,wl=204,El=205,Bp=206,zp=207,Hp=208,Vp=209,Gp=210,Wp=211,Xp=212,qp=213,$p=214,Tl=0,Al=1,Cl=2,js=3,Rl=4,Pl=5,Il=6,Ll=7,Kd=0,Yp=1,Kp=2,zn=0,Zd=1,jd=2,Jd=3,Qd=4,tf=5,ef=6,nf=7,Uh="attached",Zp="detached",sf=300,ss=301,Js=302,wa=303,Ea=304,fa=306,rs=1e3,Dn=1001,kr=1002,$e=1003,rf=1004,Pr=1005,We=1006,Ho=1007,ei=1008,wn=1009,of=1010,af=1011,Br=1012,Ic=1013,oi=1014,Nn=1015,Si=1016,Lc=1017,Dc=1018,zr=1020,lf=35902,cf=35899,hf=1021,uf=1022,Un=1023,wi=1026,ns=1027,Nc=1028,Uc=1029,os=1030,Fc=1031,Oc=1033,Vo=33776,Go=33777,Wo=33778,Xo=33779,Dl=35840,Nl=35841,Ul=35842,Fl=35843,Ol=36196,kl=37492,Bl=37496,zl=37488,Hl=37489,Ko=37490,Vl=37491,Gl=37808,Wl=37809,Xl=37810,ql=37811,$l=37812,Yl=37813,Kl=37814,Zl=37815,jl=37816,Jl=37817,Ql=37818,tc=37819,ec=37820,nc=37821,ic=36492,sc=36494,rc=36495,oc=36283,ac=36284,Zo=36285,lc=36286,df=2200,yi=2201,jp=2202,Hr=2300,Vr=2301,Ta=2302,Fh=2303,ks=2400,Bs=2401,jo=2402,kc=2500,Jp=2501,Qp=0,ff=1,cc=2,tm=3200,hc=0,em=1,ki="",Be="srgb",Tn="srgb-linear",Jo="linear",me="srgb",ds=7680,Oh=519,nm=512,im=513,sm=514,Bc=515,rm=516,om=517,zc=518,am=519,uc=35044,lm=35048,kh="300 es",ni=2e3,Gr=2001;function cm(r){for(let t=r.length-1;t>=0;--t)if(r[t]>=65535)return!0;return!1}function hm(r){return ArrayBuffer.isView(r)&&!(r instanceof DataView)}function Wr(r){return document.createElementNS("http://www.w3.org/1999/xhtml",r)}function um(){const r=Wr("canvas");return r.style.display="block",r}const Bh={};function Qo(...r){const t="THREE."+r.shift();console.log(t,...r)}function pf(r){const t=r[0];if(typeof t=="string"&&t.startsWith("TSL:")){const e=r[1];e&&e.isStackTrace?r[0]+=" "+e.getLocation():r[1]='Stack trace not available. Enable "THREE.Node.captureStackTrace" to capture stack traces.'}return r}function wt(...r){r=pf(r);const t="THREE."+r.shift();{const e=r[0];e&&e.isStackTrace?console.warn(e.getError(t)):console.warn(t,...r)}}function Ot(...r){r=pf(r);const t="THREE."+r.shift();{const e=r[0];e&&e.isStackTrace?console.error(e.getError(t)):console.error(t,...r)}}function Ws(...r){const t=r.join(" ");t in Bh||(Bh[t]=!0,wt(...r))}function dm(r,t,e){return new Promise(function(n,i){function s(){switch(r.clientWaitSync(t,r.SYNC_FLUSH_COMMANDS_BIT,0)){case r.WAIT_FAILED:i();break;case r.TIMEOUT_EXPIRED:setTimeout(s,e);break;default:n()}}setTimeout(s,e)})}const fm={[Tl]:Al,[Cl]:Il,[Rl]:Ll,[js]:Pl,[Al]:Tl,[Il]:Cl,[Ll]:Rl,[Pl]:js};class Ei{addEventListener(t,e){this._listeners===void 0&&(this._listeners={});const n=this._listeners;n[t]===void 0&&(n[t]=[]),n[t].indexOf(e)===-1&&n[t].push(e)}hasEventListener(t,e){const n=this._listeners;return n===void 0?!1:n[t]!==void 0&&n[t].indexOf(e)!==-1}removeEventListener(t,e){const n=this._listeners;if(n===void 0)return;const i=n[t];if(i!==void 0){const s=i.indexOf(e);s!==-1&&i.splice(s,1)}}dispatchEvent(t){const e=this._listeners;if(e===void 0)return;const n=e[t.type];if(n!==void 0){t.target=this;const i=n.slice(0);for(let s=0,o=i.length;s<o;s++)i[s].call(this,t);t.target=null}}}const nn=["00","01","02","03","04","05","06","07","08","09","0a","0b","0c","0d","0e","0f","10","11","12","13","14","15","16","17","18","19","1a","1b","1c","1d","1e","1f","20","21","22","23","24","25","26","27","28","29","2a","2b","2c","2d","2e","2f","30","31","32","33","34","35","36","37","38","39","3a","3b","3c","3d","3e","3f","40","41","42","43","44","45","46","47","48","49","4a","4b","4c","4d","4e","4f","50","51","52","53","54","55","56","57","58","59","5a","5b","5c","5d","5e","5f","60","61","62","63","64","65","66","67","68","69","6a","6b","6c","6d","6e","6f","70","71","72","73","74","75","76","77","78","79","7a","7b","7c","7d","7e","7f","80","81","82","83","84","85","86","87","88","89","8a","8b","8c","8d","8e","8f","90","91","92","93","94","95","96","97","98","99","9a","9b","9c","9d","9e","9f","a0","a1","a2","a3","a4","a5","a6","a7","a8","a9","aa","ab","ac","ad","ae","af","b0","b1","b2","b3","b4","b5","b6","b7","b8","b9","ba","bb","bc","bd","be","bf","c0","c1","c2","c3","c4","c5","c6","c7","c8","c9","ca","cb","cc","cd","ce","cf","d0","d1","d2","d3","d4","d5","d6","d7","d8","d9","da","db","dc","dd","de","df","e0","e1","e2","e3","e4","e5","e6","e7","e8","e9","ea","eb","ec","ed","ee","ef","f0","f1","f2","f3","f4","f5","f6","f7","f8","f9","fa","fb","fc","fd","fe","ff"];let zh=1234567;const Lr=Math.PI/180,Qs=180/Math.PI;function Hn(){const r=Math.random()*4294967295|0,t=Math.random()*4294967295|0,e=Math.random()*4294967295|0,n=Math.random()*4294967295|0;return(nn[r&255]+nn[r>>8&255]+nn[r>>16&255]+nn[r>>24&255]+"-"+nn[t&255]+nn[t>>8&255]+"-"+nn[t>>16&15|64]+nn[t>>24&255]+"-"+nn[e&63|128]+nn[e>>8&255]+"-"+nn[e>>16&255]+nn[e>>24&255]+nn[n&255]+nn[n>>8&255]+nn[n>>16&255]+nn[n>>24&255]).toLowerCase()}function Kt(r,t,e){return Math.max(t,Math.min(e,r))}function Hc(r,t){return(r%t+t)%t}function pm(r,t,e,n,i){return n+(r-t)*(i-n)/(e-t)}function mm(r,t,e){return r!==t?(e-r)/(t-r):0}function Dr(r,t,e){return(1-e)*r+e*t}function gm(r,t,e,n){return Dr(r,t,1-Math.exp(-e*n))}function _m(r,t=1){return t-Math.abs(Hc(r,t*2)-t)}function xm(r,t,e){return r<=t?0:r>=e?1:(r=(r-t)/(e-t),r*r*(3-2*r))}function vm(r,t,e){return r<=t?0:r>=e?1:(r=(r-t)/(e-t),r*r*r*(r*(r*6-15)+10))}function ym(r,t){return r+Math.floor(Math.random()*(t-r+1))}function Mm(r,t){return r+Math.random()*(t-r)}function bm(r){return r*(.5-Math.random())}function Sm(r){r!==void 0&&(zh=r);let t=zh+=1831565813;return t=Math.imul(t^t>>>15,t|1),t^=t+Math.imul(t^t>>>7,t|61),((t^t>>>14)>>>0)/4294967296}function wm(r){return r*Lr}function Em(r){return r*Qs}function Tm(r){return(r&r-1)===0&&r!==0}function Am(r){return Math.pow(2,Math.ceil(Math.log(r)/Math.LN2))}function Cm(r){return Math.pow(2,Math.floor(Math.log(r)/Math.LN2))}function Rm(r,t,e,n,i){const s=Math.cos,o=Math.sin,a=s(e/2),l=o(e/2),c=s((t+n)/2),h=o((t+n)/2),u=s((t-n)/2),d=o((t-n)/2),f=s((n-t)/2),m=o((n-t)/2);switch(i){case"XYX":r.set(a*h,l*u,l*d,a*c);break;case"YZY":r.set(l*d,a*h,l*u,a*c);break;case"ZXZ":r.set(l*u,l*d,a*h,a*c);break;case"XZX":r.set(a*h,l*m,l*f,a*c);break;case"YXY":r.set(l*f,a*h,l*m,a*c);break;case"ZYZ":r.set(l*m,l*f,a*h,a*c);break;default:wt("MathUtils: .setQuaternionFromProperEuler() encountered an unknown order: "+i)}}function Bn(r,t){switch(t.constructor){case Float32Array:return r;case Uint32Array:return r/4294967295;case Uint16Array:return r/65535;case Uint8Array:return r/255;case Int32Array:return Math.max(r/2147483647,-1);case Int16Array:return Math.max(r/32767,-1);case Int8Array:return Math.max(r/127,-1);default:throw new Error("THREE.MathUtils: Invalid component type.")}}function ge(r,t){switch(t.constructor){case Float32Array:return r;case Uint32Array:return Math.round(r*4294967295);case Uint16Array:return Math.round(r*65535);case Uint8Array:return Math.round(r*255);case Int32Array:return Math.round(r*2147483647);case Int16Array:return Math.round(r*32767);case Int8Array:return Math.round(r*127);default:throw new Error("THREE.MathUtils: Invalid component type.")}}const Qe={DEG2RAD:Lr,RAD2DEG:Qs,generateUUID:Hn,clamp:Kt,euclideanModulo:Hc,mapLinear:pm,inverseLerp:mm,lerp:Dr,damp:gm,pingpong:_m,smoothstep:xm,smootherstep:vm,randInt:ym,randFloat:Mm,randFloatSpread:bm,seededRandom:Sm,degToRad:wm,radToDeg:Em,isPowerOfTwo:Tm,ceilPowerOfTwo:Am,floorPowerOfTwo:Cm,setQuaternionFromProperEuler:Rm,normalize:ge,denormalize:Bn},_h=class _h{constructor(t=0,e=0){this.x=t,this.y=e}get width(){return this.x}set width(t){this.x=t}get height(){return this.y}set height(t){this.y=t}set(t,e){return this.x=t,this.y=e,this}setScalar(t){return this.x=t,this.y=t,this}setX(t){return this.x=t,this}setY(t){return this.y=t,this}setComponent(t,e){switch(t){case 0:this.x=e;break;case 1:this.y=e;break;default:throw new Error("THREE.Vector2: index is out of range: "+t)}return this}getComponent(t){switch(t){case 0:return this.x;case 1:return this.y;default:throw new Error("THREE.Vector2: index is out of range: "+t)}}clone(){return new this.constructor(this.x,this.y)}copy(t){return this.x=t.x,this.y=t.y,this}add(t){return this.x+=t.x,this.y+=t.y,this}addScalar(t){return this.x+=t,this.y+=t,this}addVectors(t,e){return this.x=t.x+e.x,this.y=t.y+e.y,this}addScaledVector(t,e){return this.x+=t.x*e,this.y+=t.y*e,this}sub(t){return this.x-=t.x,this.y-=t.y,this}subScalar(t){return this.x-=t,this.y-=t,this}subVectors(t,e){return this.x=t.x-e.x,this.y=t.y-e.y,this}multiply(t){return this.x*=t.x,this.y*=t.y,this}multiplyScalar(t){return this.x*=t,this.y*=t,this}divide(t){return this.x/=t.x,this.y/=t.y,this}divideScalar(t){return this.multiplyScalar(1/t)}applyMatrix3(t){const e=this.x,n=this.y,i=t.elements;return this.x=i[0]*e+i[3]*n+i[6],this.y=i[1]*e+i[4]*n+i[7],this}min(t){return this.x=Math.min(this.x,t.x),this.y=Math.min(this.y,t.y),this}max(t){return this.x=Math.max(this.x,t.x),this.y=Math.max(this.y,t.y),this}clamp(t,e){return this.x=Kt(this.x,t.x,e.x),this.y=Kt(this.y,t.y,e.y),this}clampScalar(t,e){return this.x=Kt(this.x,t,e),this.y=Kt(this.y,t,e),this}clampLength(t,e){const n=this.length();return this.divideScalar(n||1).multiplyScalar(Kt(n,t,e))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this}negate(){return this.x=-this.x,this.y=-this.y,this}dot(t){return this.x*t.x+this.y*t.y}cross(t){return this.x*t.y-this.y*t.x}lengthSq(){return this.x*this.x+this.y*this.y}length(){return Math.sqrt(this.x*this.x+this.y*this.y)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)}normalize(){return this.divideScalar(this.length()||1)}angle(){return Math.atan2(-this.y,-this.x)+Math.PI}angleTo(t){const e=Math.sqrt(this.lengthSq()*t.lengthSq());if(e===0)return Math.PI/2;const n=this.dot(t)/e;return Math.acos(Kt(n,-1,1))}distanceTo(t){return Math.sqrt(this.distanceToSquared(t))}distanceToSquared(t){const e=this.x-t.x,n=this.y-t.y;return e*e+n*n}manhattanDistanceTo(t){return Math.abs(this.x-t.x)+Math.abs(this.y-t.y)}setLength(t){return this.normalize().multiplyScalar(t)}lerp(t,e){return this.x+=(t.x-this.x)*e,this.y+=(t.y-this.y)*e,this}lerpVectors(t,e,n){return this.x=t.x+(e.x-t.x)*n,this.y=t.y+(e.y-t.y)*n,this}equals(t){return t.x===this.x&&t.y===this.y}fromArray(t,e=0){return this.x=t[e],this.y=t[e+1],this}toArray(t=[],e=0){return t[e]=this.x,t[e+1]=this.y,t}fromBufferAttribute(t,e){return this.x=t.getX(e),this.y=t.getY(e),this}rotateAround(t,e){const n=Math.cos(e),i=Math.sin(e),s=this.x-t.x,o=this.y-t.y;return this.x=s*n-o*i+t.x,this.y=s*i+o*n+t.y,this}random(){return this.x=Math.random(),this.y=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y}};_h.prototype.isVector2=!0;let At=_h;class mn{constructor(t=0,e=0,n=0,i=1){this.isQuaternion=!0,this._x=t,this._y=e,this._z=n,this._w=i}static slerpFlat(t,e,n,i,s,o,a){let l=n[i+0],c=n[i+1],h=n[i+2],u=n[i+3],d=s[o+0],f=s[o+1],m=s[o+2],_=s[o+3];if(u!==_||l!==d||c!==f||h!==m){let g=l*d+c*f+h*m+u*_;g<0&&(d=-d,f=-f,m=-m,_=-_,g=-g);let p=1-a;if(g<.9995){const b=Math.acos(g),E=Math.sin(b);p=Math.sin(p*b)/E,a=Math.sin(a*b)/E,l=l*p+d*a,c=c*p+f*a,h=h*p+m*a,u=u*p+_*a}else{l=l*p+d*a,c=c*p+f*a,h=h*p+m*a,u=u*p+_*a;const b=1/Math.sqrt(l*l+c*c+h*h+u*u);l*=b,c*=b,h*=b,u*=b}}t[e]=l,t[e+1]=c,t[e+2]=h,t[e+3]=u}static multiplyQuaternionsFlat(t,e,n,i,s,o){const a=n[i],l=n[i+1],c=n[i+2],h=n[i+3],u=s[o],d=s[o+1],f=s[o+2],m=s[o+3];return t[e]=a*m+h*u+l*f-c*d,t[e+1]=l*m+h*d+c*u-a*f,t[e+2]=c*m+h*f+a*d-l*u,t[e+3]=h*m-a*u-l*d-c*f,t}get x(){return this._x}set x(t){this._x=t,this._onChangeCallback()}get y(){return this._y}set y(t){this._y=t,this._onChangeCallback()}get z(){return this._z}set z(t){this._z=t,this._onChangeCallback()}get w(){return this._w}set w(t){this._w=t,this._onChangeCallback()}set(t,e,n,i){return this._x=t,this._y=e,this._z=n,this._w=i,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._w)}copy(t){return this._x=t.x,this._y=t.y,this._z=t.z,this._w=t.w,this._onChangeCallback(),this}setFromEuler(t,e=!0){const n=t._x,i=t._y,s=t._z,o=t._order,a=Math.cos,l=Math.sin,c=a(n/2),h=a(i/2),u=a(s/2),d=l(n/2),f=l(i/2),m=l(s/2);switch(o){case"XYZ":this._x=d*h*u+c*f*m,this._y=c*f*u-d*h*m,this._z=c*h*m+d*f*u,this._w=c*h*u-d*f*m;break;case"YXZ":this._x=d*h*u+c*f*m,this._y=c*f*u-d*h*m,this._z=c*h*m-d*f*u,this._w=c*h*u+d*f*m;break;case"ZXY":this._x=d*h*u-c*f*m,this._y=c*f*u+d*h*m,this._z=c*h*m+d*f*u,this._w=c*h*u-d*f*m;break;case"ZYX":this._x=d*h*u-c*f*m,this._y=c*f*u+d*h*m,this._z=c*h*m-d*f*u,this._w=c*h*u+d*f*m;break;case"YZX":this._x=d*h*u+c*f*m,this._y=c*f*u+d*h*m,this._z=c*h*m-d*f*u,this._w=c*h*u-d*f*m;break;case"XZY":this._x=d*h*u-c*f*m,this._y=c*f*u-d*h*m,this._z=c*h*m+d*f*u,this._w=c*h*u+d*f*m;break;default:wt("Quaternion: .setFromEuler() encountered an unknown order: "+o)}return e===!0&&this._onChangeCallback(),this}setFromAxisAngle(t,e){const n=e/2,i=Math.sin(n);return this._x=t.x*i,this._y=t.y*i,this._z=t.z*i,this._w=Math.cos(n),this._onChangeCallback(),this}setFromRotationMatrix(t){const e=t.elements,n=e[0],i=e[4],s=e[8],o=e[1],a=e[5],l=e[9],c=e[2],h=e[6],u=e[10],d=n+a+u;if(d>0){const f=.5/Math.sqrt(d+1);this._w=.25/f,this._x=(h-l)*f,this._y=(s-c)*f,this._z=(o-i)*f}else if(n>a&&n>u){const f=2*Math.sqrt(1+n-a-u);this._w=(h-l)/f,this._x=.25*f,this._y=(i+o)/f,this._z=(s+c)/f}else if(a>u){const f=2*Math.sqrt(1+a-n-u);this._w=(s-c)/f,this._x=(i+o)/f,this._y=.25*f,this._z=(l+h)/f}else{const f=2*Math.sqrt(1+u-n-a);this._w=(o-i)/f,this._x=(s+c)/f,this._y=(l+h)/f,this._z=.25*f}return this._onChangeCallback(),this}setFromUnitVectors(t,e){let n=t.dot(e)+1;return n<1e-8?(n=0,Math.abs(t.x)>Math.abs(t.z)?(this._x=-t.y,this._y=t.x,this._z=0,this._w=n):(this._x=0,this._y=-t.z,this._z=t.y,this._w=n)):(this._x=t.y*e.z-t.z*e.y,this._y=t.z*e.x-t.x*e.z,this._z=t.x*e.y-t.y*e.x,this._w=n),this.normalize()}angleTo(t){return 2*Math.acos(Math.abs(Kt(this.dot(t),-1,1)))}rotateTowards(t,e){const n=this.angleTo(t);if(n===0)return this;const i=Math.min(1,e/n);return this.slerp(t,i),this}identity(){return this.set(0,0,0,1)}invert(){return this.conjugate()}conjugate(){return this._x*=-1,this._y*=-1,this._z*=-1,this._onChangeCallback(),this}dot(t){return this._x*t._x+this._y*t._y+this._z*t._z+this._w*t._w}lengthSq(){return this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w}length(){return Math.sqrt(this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w)}normalize(){let t=this.length();return t===0?(this._x=0,this._y=0,this._z=0,this._w=1):(t=1/t,this._x=this._x*t,this._y=this._y*t,this._z=this._z*t,this._w=this._w*t),this._onChangeCallback(),this}multiply(t){return this.multiplyQuaternions(this,t)}premultiply(t){return this.multiplyQuaternions(t,this)}multiplyQuaternions(t,e){const n=t._x,i=t._y,s=t._z,o=t._w,a=e._x,l=e._y,c=e._z,h=e._w;return this._x=n*h+o*a+i*c-s*l,this._y=i*h+o*l+s*a-n*c,this._z=s*h+o*c+n*l-i*a,this._w=o*h-n*a-i*l-s*c,this._onChangeCallback(),this}slerp(t,e){let n=t._x,i=t._y,s=t._z,o=t._w,a=this.dot(t);a<0&&(n=-n,i=-i,s=-s,o=-o,a=-a);let l=1-e;if(a<.9995){const c=Math.acos(a),h=Math.sin(c);l=Math.sin(l*c)/h,e=Math.sin(e*c)/h,this._x=this._x*l+n*e,this._y=this._y*l+i*e,this._z=this._z*l+s*e,this._w=this._w*l+o*e,this._onChangeCallback()}else this._x=this._x*l+n*e,this._y=this._y*l+i*e,this._z=this._z*l+s*e,this._w=this._w*l+o*e,this.normalize();return this}slerpQuaternions(t,e,n){return this.copy(t).slerp(e,n)}random(){const t=2*Math.PI*Math.random(),e=2*Math.PI*Math.random(),n=Math.random(),i=Math.sqrt(1-n),s=Math.sqrt(n);return this.set(i*Math.sin(t),i*Math.cos(t),s*Math.sin(e),s*Math.cos(e))}equals(t){return t._x===this._x&&t._y===this._y&&t._z===this._z&&t._w===this._w}fromArray(t,e=0){return this._x=t[e],this._y=t[e+1],this._z=t[e+2],this._w=t[e+3],this._onChangeCallback(),this}toArray(t=[],e=0){return t[e]=this._x,t[e+1]=this._y,t[e+2]=this._z,t[e+3]=this._w,t}fromBufferAttribute(t,e){return this._x=t.getX(e),this._y=t.getY(e),this._z=t.getZ(e),this._w=t.getW(e),this._onChangeCallback(),this}toJSON(){return this.toArray()}_onChange(t){return this._onChangeCallback=t,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._w}}const xh=class xh{constructor(t=0,e=0,n=0){this.x=t,this.y=e,this.z=n}set(t,e,n){return n===void 0&&(n=this.z),this.x=t,this.y=e,this.z=n,this}setScalar(t){return this.x=t,this.y=t,this.z=t,this}setX(t){return this.x=t,this}setY(t){return this.y=t,this}setZ(t){return this.z=t,this}setComponent(t,e){switch(t){case 0:this.x=e;break;case 1:this.y=e;break;case 2:this.z=e;break;default:throw new Error("THREE.Vector3: index is out of range: "+t)}return this}getComponent(t){switch(t){case 0:return this.x;case 1:return this.y;case 2:return this.z;default:throw new Error("THREE.Vector3: index is out of range: "+t)}}clone(){return new this.constructor(this.x,this.y,this.z)}copy(t){return this.x=t.x,this.y=t.y,this.z=t.z,this}add(t){return this.x+=t.x,this.y+=t.y,this.z+=t.z,this}addScalar(t){return this.x+=t,this.y+=t,this.z+=t,this}addVectors(t,e){return this.x=t.x+e.x,this.y=t.y+e.y,this.z=t.z+e.z,this}addScaledVector(t,e){return this.x+=t.x*e,this.y+=t.y*e,this.z+=t.z*e,this}sub(t){return this.x-=t.x,this.y-=t.y,this.z-=t.z,this}subScalar(t){return this.x-=t,this.y-=t,this.z-=t,this}subVectors(t,e){return this.x=t.x-e.x,this.y=t.y-e.y,this.z=t.z-e.z,this}multiply(t){return this.x*=t.x,this.y*=t.y,this.z*=t.z,this}multiplyScalar(t){return this.x*=t,this.y*=t,this.z*=t,this}multiplyVectors(t,e){return this.x=t.x*e.x,this.y=t.y*e.y,this.z=t.z*e.z,this}applyEuler(t){return this.applyQuaternion(Hh.setFromEuler(t))}applyAxisAngle(t,e){return this.applyQuaternion(Hh.setFromAxisAngle(t,e))}applyMatrix3(t){const e=this.x,n=this.y,i=this.z,s=t.elements;return this.x=s[0]*e+s[3]*n+s[6]*i,this.y=s[1]*e+s[4]*n+s[7]*i,this.z=s[2]*e+s[5]*n+s[8]*i,this}applyNormalMatrix(t){return this.applyMatrix3(t).normalize()}applyMatrix4(t){const e=this.x,n=this.y,i=this.z,s=t.elements,o=1/(s[3]*e+s[7]*n+s[11]*i+s[15]);return this.x=(s[0]*e+s[4]*n+s[8]*i+s[12])*o,this.y=(s[1]*e+s[5]*n+s[9]*i+s[13])*o,this.z=(s[2]*e+s[6]*n+s[10]*i+s[14])*o,this}applyQuaternion(t){const e=this.x,n=this.y,i=this.z,s=t.x,o=t.y,a=t.z,l=t.w,c=2*(o*i-a*n),h=2*(a*e-s*i),u=2*(s*n-o*e);return this.x=e+l*c+o*u-a*h,this.y=n+l*h+a*c-s*u,this.z=i+l*u+s*h-o*c,this}project(t){return this.applyMatrix4(t.matrixWorldInverse).applyMatrix4(t.projectionMatrix)}unproject(t){return this.applyMatrix4(t.projectionMatrixInverse).applyMatrix4(t.matrixWorld)}transformDirection(t){const e=this.x,n=this.y,i=this.z,s=t.elements;return this.x=s[0]*e+s[4]*n+s[8]*i,this.y=s[1]*e+s[5]*n+s[9]*i,this.z=s[2]*e+s[6]*n+s[10]*i,this.normalize()}divide(t){return this.x/=t.x,this.y/=t.y,this.z/=t.z,this}divideScalar(t){return this.multiplyScalar(1/t)}min(t){return this.x=Math.min(this.x,t.x),this.y=Math.min(this.y,t.y),this.z=Math.min(this.z,t.z),this}max(t){return this.x=Math.max(this.x,t.x),this.y=Math.max(this.y,t.y),this.z=Math.max(this.z,t.z),this}clamp(t,e){return this.x=Kt(this.x,t.x,e.x),this.y=Kt(this.y,t.y,e.y),this.z=Kt(this.z,t.z,e.z),this}clampScalar(t,e){return this.x=Kt(this.x,t,e),this.y=Kt(this.y,t,e),this.z=Kt(this.z,t,e),this}clampLength(t,e){const n=this.length();return this.divideScalar(n||1).multiplyScalar(Kt(n,t,e))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this}dot(t){return this.x*t.x+this.y*t.y+this.z*t.z}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)}normalize(){return this.divideScalar(this.length()||1)}setLength(t){return this.normalize().multiplyScalar(t)}lerp(t,e){return this.x+=(t.x-this.x)*e,this.y+=(t.y-this.y)*e,this.z+=(t.z-this.z)*e,this}lerpVectors(t,e,n){return this.x=t.x+(e.x-t.x)*n,this.y=t.y+(e.y-t.y)*n,this.z=t.z+(e.z-t.z)*n,this}cross(t){return this.crossVectors(this,t)}crossVectors(t,e){const n=t.x,i=t.y,s=t.z,o=e.x,a=e.y,l=e.z;return this.x=i*l-s*a,this.y=s*o-n*l,this.z=n*a-i*o,this}projectOnVector(t){const e=t.lengthSq();if(e===0)return this.set(0,0,0);const n=t.dot(this)/e;return this.copy(t).multiplyScalar(n)}projectOnPlane(t){return Aa.copy(this).projectOnVector(t),this.sub(Aa)}reflect(t){return this.sub(Aa.copy(t).multiplyScalar(2*this.dot(t)))}angleTo(t){const e=Math.sqrt(this.lengthSq()*t.lengthSq());if(e===0)return Math.PI/2;const n=this.dot(t)/e;return Math.acos(Kt(n,-1,1))}distanceTo(t){return Math.sqrt(this.distanceToSquared(t))}distanceToSquared(t){const e=this.x-t.x,n=this.y-t.y,i=this.z-t.z;return e*e+n*n+i*i}manhattanDistanceTo(t){return Math.abs(this.x-t.x)+Math.abs(this.y-t.y)+Math.abs(this.z-t.z)}setFromSpherical(t){return this.setFromSphericalCoords(t.radius,t.phi,t.theta)}setFromSphericalCoords(t,e,n){const i=Math.sin(e)*t;return this.x=i*Math.sin(n),this.y=Math.cos(e)*t,this.z=i*Math.cos(n),this}setFromCylindrical(t){return this.setFromCylindricalCoords(t.radius,t.theta,t.y)}setFromCylindricalCoords(t,e,n){return this.x=t*Math.sin(e),this.y=n,this.z=t*Math.cos(e),this}setFromMatrixPosition(t){const e=t.elements;return this.x=e[12],this.y=e[13],this.z=e[14],this}setFromMatrixScale(t){const e=this.setFromMatrixColumn(t,0).length(),n=this.setFromMatrixColumn(t,1).length(),i=this.setFromMatrixColumn(t,2).length();return this.x=e,this.y=n,this.z=i,this}setFromMatrixColumn(t,e){return this.fromArray(t.elements,e*4)}setFromMatrix3Column(t,e){return this.fromArray(t.elements,e*3)}setFromEuler(t){return this.x=t._x,this.y=t._y,this.z=t._z,this}setFromColor(t){return this.x=t.r,this.y=t.g,this.z=t.b,this}equals(t){return t.x===this.x&&t.y===this.y&&t.z===this.z}fromArray(t,e=0){return this.x=t[e],this.y=t[e+1],this.z=t[e+2],this}toArray(t=[],e=0){return t[e]=this.x,t[e+1]=this.y,t[e+2]=this.z,t}fromBufferAttribute(t,e){return this.x=t.getX(e),this.y=t.getY(e),this.z=t.getZ(e),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this}randomDirection(){const t=Math.random()*Math.PI*2,e=Math.random()*2-1,n=Math.sqrt(1-e*e);return this.x=n*Math.cos(t),this.y=e,this.z=n*Math.sin(t),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z}};xh.prototype.isVector3=!0;let P=xh;const Aa=new P,Hh=new mn,vh=class vh{constructor(t,e,n,i,s,o,a,l,c){this.elements=[1,0,0,0,1,0,0,0,1],t!==void 0&&this.set(t,e,n,i,s,o,a,l,c)}set(t,e,n,i,s,o,a,l,c){const h=this.elements;return h[0]=t,h[1]=i,h[2]=a,h[3]=e,h[4]=s,h[5]=l,h[6]=n,h[7]=o,h[8]=c,this}identity(){return this.set(1,0,0,0,1,0,0,0,1),this}copy(t){const e=this.elements,n=t.elements;return e[0]=n[0],e[1]=n[1],e[2]=n[2],e[3]=n[3],e[4]=n[4],e[5]=n[5],e[6]=n[6],e[7]=n[7],e[8]=n[8],this}extractBasis(t,e,n){return t.setFromMatrix3Column(this,0),e.setFromMatrix3Column(this,1),n.setFromMatrix3Column(this,2),this}setFromMatrix4(t){const e=t.elements;return this.set(e[0],e[4],e[8],e[1],e[5],e[9],e[2],e[6],e[10]),this}multiply(t){return this.multiplyMatrices(this,t)}premultiply(t){return this.multiplyMatrices(t,this)}multiplyMatrices(t,e){const n=t.elements,i=e.elements,s=this.elements,o=n[0],a=n[3],l=n[6],c=n[1],h=n[4],u=n[7],d=n[2],f=n[5],m=n[8],_=i[0],g=i[3],p=i[6],b=i[1],E=i[4],y=i[7],S=i[2],w=i[5],A=i[8];return s[0]=o*_+a*b+l*S,s[3]=o*g+a*E+l*w,s[6]=o*p+a*y+l*A,s[1]=c*_+h*b+u*S,s[4]=c*g+h*E+u*w,s[7]=c*p+h*y+u*A,s[2]=d*_+f*b+m*S,s[5]=d*g+f*E+m*w,s[8]=d*p+f*y+m*A,this}multiplyScalar(t){const e=this.elements;return e[0]*=t,e[3]*=t,e[6]*=t,e[1]*=t,e[4]*=t,e[7]*=t,e[2]*=t,e[5]*=t,e[8]*=t,this}determinant(){const t=this.elements,e=t[0],n=t[1],i=t[2],s=t[3],o=t[4],a=t[5],l=t[6],c=t[7],h=t[8];return e*o*h-e*a*c-n*s*h+n*a*l+i*s*c-i*o*l}invert(){const t=this.elements,e=t[0],n=t[1],i=t[2],s=t[3],o=t[4],a=t[5],l=t[6],c=t[7],h=t[8],u=h*o-a*c,d=a*l-h*s,f=c*s-o*l,m=e*u+n*d+i*f;if(m===0)return this.set(0,0,0,0,0,0,0,0,0);const _=1/m;return t[0]=u*_,t[1]=(i*c-h*n)*_,t[2]=(a*n-i*o)*_,t[3]=d*_,t[4]=(h*e-i*l)*_,t[5]=(i*s-a*e)*_,t[6]=f*_,t[7]=(n*l-c*e)*_,t[8]=(o*e-n*s)*_,this}transpose(){let t;const e=this.elements;return t=e[1],e[1]=e[3],e[3]=t,t=e[2],e[2]=e[6],e[6]=t,t=e[5],e[5]=e[7],e[7]=t,this}getNormalMatrix(t){return this.setFromMatrix4(t).invert().transpose()}transposeIntoArray(t){const e=this.elements;return t[0]=e[0],t[1]=e[3],t[2]=e[6],t[3]=e[1],t[4]=e[4],t[5]=e[7],t[6]=e[2],t[7]=e[5],t[8]=e[8],this}setUvTransform(t,e,n,i,s,o,a){const l=Math.cos(s),c=Math.sin(s);return this.set(n*l,n*c,-n*(l*o+c*a)+o+t,-i*c,i*l,-i*(-c*o+l*a)+a+e,0,0,1),this}scale(t,e){return Ws("Matrix3: .scale() is deprecated. Use .makeScale() instead."),this.premultiply(Ca.makeScale(t,e)),this}rotate(t){return Ws("Matrix3: .rotate() is deprecated. Use .makeRotation() instead."),this.premultiply(Ca.makeRotation(-t)),this}translate(t,e){return Ws("Matrix3: .translate() is deprecated. Use .makeTranslation() instead."),this.premultiply(Ca.makeTranslation(t,e)),this}makeTranslation(t,e){return t.isVector2?this.set(1,0,t.x,0,1,t.y,0,0,1):this.set(1,0,t,0,1,e,0,0,1),this}makeRotation(t){const e=Math.cos(t),n=Math.sin(t);return this.set(e,-n,0,n,e,0,0,0,1),this}makeScale(t,e){return this.set(t,0,0,0,e,0,0,0,1),this}equals(t){const e=this.elements,n=t.elements;for(let i=0;i<9;i++)if(e[i]!==n[i])return!1;return!0}fromArray(t,e=0){for(let n=0;n<9;n++)this.elements[n]=t[n+e];return this}toArray(t=[],e=0){const n=this.elements;return t[e]=n[0],t[e+1]=n[1],t[e+2]=n[2],t[e+3]=n[3],t[e+4]=n[4],t[e+5]=n[5],t[e+6]=n[6],t[e+7]=n[7],t[e+8]=n[8],t}clone(){return new this.constructor().fromArray(this.elements)}};vh.prototype.isMatrix3=!0;let Vt=vh;const Ca=new Vt,Vh=new Vt().set(.4123908,.3575843,.1804808,.212639,.7151687,.0721923,.0193308,.1191948,.9505322),Gh=new Vt().set(3.2409699,-1.5373832,-.4986108,-.9692436,1.8759675,.0415551,.0556301,-.203977,1.0569715);function Pm(){const r={enabled:!0,workingColorSpace:Tn,spaces:{},convert:function(i,s,o){return this.enabled===!1||s===o||!s||!o||(this.spaces[s].transfer===me&&(i.r=Mi(i.r),i.g=Mi(i.g),i.b=Mi(i.b)),this.spaces[s].primaries!==this.spaces[o].primaries&&(i.applyMatrix3(this.spaces[s].toXYZ),i.applyMatrix3(this.spaces[o].fromXYZ)),this.spaces[o].transfer===me&&(i.r=Xs(i.r),i.g=Xs(i.g),i.b=Xs(i.b))),i},workingToColorSpace:function(i,s){return this.convert(i,this.workingColorSpace,s)},colorSpaceToWorking:function(i,s){return this.convert(i,s,this.workingColorSpace)},getPrimaries:function(i){return this.spaces[i].primaries},getTransfer:function(i){return i===ki?Jo:this.spaces[i].transfer},getToneMappingMode:function(i){return this.spaces[i].outputColorSpaceConfig.toneMappingMode||"standard"},getLuminanceCoefficients:function(i,s=this.workingColorSpace){return i.fromArray(this.spaces[s].luminanceCoefficients)},define:function(i){Object.assign(this.spaces,i)},_getMatrix:function(i,s,o){return i.copy(this.spaces[s].toXYZ).multiply(this.spaces[o].fromXYZ)},_getDrawingBufferColorSpace:function(i){return this.spaces[i].outputColorSpaceConfig.drawingBufferColorSpace},_getUnpackColorSpace:function(i=this.workingColorSpace){return this.spaces[i].workingColorSpaceConfig.unpackColorSpace},fromWorkingColorSpace:function(i,s){return Ws("ColorManagement: .fromWorkingColorSpace() has been renamed to .workingToColorSpace()."),r.workingToColorSpace(i,s)},toWorkingColorSpace:function(i,s){return Ws("ColorManagement: .toWorkingColorSpace() has been renamed to .colorSpaceToWorking()."),r.colorSpaceToWorking(i,s)}},t=[.64,.33,.3,.6,.15,.06],e=[.2126,.7152,.0722],n=[.3127,.329];return r.define({[Tn]:{primaries:t,whitePoint:n,transfer:Jo,toXYZ:Vh,fromXYZ:Gh,luminanceCoefficients:e,workingColorSpaceConfig:{unpackColorSpace:Be},outputColorSpaceConfig:{drawingBufferColorSpace:Be}},[Be]:{primaries:t,whitePoint:n,transfer:me,toXYZ:Vh,fromXYZ:Gh,luminanceCoefficients:e,outputColorSpaceConfig:{drawingBufferColorSpace:Be}}}),r}const Qt=Pm();function Mi(r){return r<.04045?r*.0773993808:Math.pow(r*.9478672986+.0521327014,2.4)}function Xs(r){return r<.0031308?r*12.92:1.055*Math.pow(r,.41666)-.055}let fs;class Im{static getDataURL(t,e="image/png"){if(/^data:/i.test(t.src)||typeof HTMLCanvasElement>"u")return t.src;let n;if(t instanceof HTMLCanvasElement)n=t;else{fs===void 0&&(fs=Wr("canvas")),fs.width=t.width,fs.height=t.height;const i=fs.getContext("2d");t instanceof ImageData?i.putImageData(t,0,0):i.drawImage(t,0,0,t.width,t.height),n=fs}return n.toDataURL(e)}static sRGBToLinear(t){if(typeof HTMLImageElement<"u"&&t instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&t instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&t instanceof ImageBitmap){const e=Wr("canvas");e.width=t.width,e.height=t.height;const n=e.getContext("2d");n.drawImage(t,0,0,t.width,t.height);const i=n.getImageData(0,0,t.width,t.height),s=i.data;for(let o=0;o<s.length;o++)s[o]=Mi(s[o]/255)*255;return n.putImageData(i,0,0),e}else if(t.data){const e=t.data.slice(0);for(let n=0;n<e.length;n++)e instanceof Uint8Array||e instanceof Uint8ClampedArray?e[n]=Math.floor(Mi(e[n]/255)*255):e[n]=Mi(e[n]);return{data:e,width:t.width,height:t.height}}else return wt("ImageUtils.sRGBToLinear(): Unsupported image type. No color space conversion applied."),t}}let Lm=0;class Vc{constructor(t=null){this.isSource=!0,Object.defineProperty(this,"id",{value:Lm++}),this.uuid=Hn(),this.data=t,this.dataReady=!0,this.version=0}getSize(t){const e=this.data;return typeof HTMLVideoElement<"u"&&e instanceof HTMLVideoElement?t.set(e.videoWidth,e.videoHeight,0):typeof VideoFrame<"u"&&e instanceof VideoFrame?t.set(e.displayWidth,e.displayHeight,0):e!==null?t.set(e.width,e.height,e.depth||0):t.set(0,0,0),t}set needsUpdate(t){t===!0&&this.version++}toJSON(t){const e=t===void 0||typeof t=="string";if(!e&&t.images[this.uuid]!==void 0)return t.images[this.uuid];const n={uuid:this.uuid,url:""},i=this.data;if(i!==null){let s;if(Array.isArray(i)){s=[];for(let o=0,a=i.length;o<a;o++)i[o].isDataTexture?s.push(Ra(i[o].image)):s.push(Ra(i[o]))}else s=Ra(i);n.url=s}return e||(t.images[this.uuid]=n),n}}function Ra(r){return typeof HTMLImageElement<"u"&&r instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&r instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&r instanceof ImageBitmap?Im.getDataURL(r):r.data?{data:Array.from(r.data),width:r.width,height:r.height,type:r.data.constructor.name}:(wt("Texture: Unable to serialize Texture."),{})}let Dm=0;const Pa=new P;class Xe extends Ei{constructor(t=Xe.DEFAULT_IMAGE,e=Xe.DEFAULT_MAPPING,n=Dn,i=Dn,s=We,o=ei,a=Un,l=wn,c=Xe.DEFAULT_ANISOTROPY,h=ki){super(),this.isTexture=!0,Object.defineProperty(this,"id",{value:Dm++}),this.uuid=Hn(),this.name="",this.source=new Vc(t),this.mipmaps=[],this.mapping=e,this.channel=0,this.wrapS=n,this.wrapT=i,this.magFilter=s,this.minFilter=o,this.anisotropy=c,this.format=a,this.internalFormat=null,this.type=l,this.offset=new At(0,0),this.repeat=new At(1,1),this.center=new At(0,0),this.rotation=0,this.matrixAutoUpdate=!0,this.matrix=new Vt,this.generateMipmaps=!0,this.premultiplyAlpha=!1,this.flipY=!0,this.unpackAlignment=4,this.colorSpace=h,this.userData={},this.updateRanges=[],this.version=0,this.onUpdate=null,this.renderTarget=null,this.isRenderTargetTexture=!1,this.isArrayTexture=!!(t&&t.depth&&t.depth>1),this.pmremVersion=0,this.normalized=!1}get width(){return this.source.getSize(Pa).x}get height(){return this.source.getSize(Pa).y}get depth(){return this.source.getSize(Pa).z}get image(){return this.source.data}set image(t){this.source.data=t}updateMatrix(){this.matrix.setUvTransform(this.offset.x,this.offset.y,this.repeat.x,this.repeat.y,this.rotation,this.center.x,this.center.y)}addUpdateRange(t,e){this.updateRanges.push({start:t,count:e})}clearUpdateRanges(){this.updateRanges.length=0}clone(){return new this.constructor().copy(this)}copy(t){return this.name=t.name,this.source=t.source,this.mipmaps=t.mipmaps.slice(0),this.mapping=t.mapping,this.channel=t.channel,this.wrapS=t.wrapS,this.wrapT=t.wrapT,this.magFilter=t.magFilter,this.minFilter=t.minFilter,this.anisotropy=t.anisotropy,this.format=t.format,this.internalFormat=t.internalFormat,this.type=t.type,this.normalized=t.normalized,this.offset.copy(t.offset),this.repeat.copy(t.repeat),this.center.copy(t.center),this.rotation=t.rotation,this.matrixAutoUpdate=t.matrixAutoUpdate,this.matrix.copy(t.matrix),this.generateMipmaps=t.generateMipmaps,this.premultiplyAlpha=t.premultiplyAlpha,this.flipY=t.flipY,this.unpackAlignment=t.unpackAlignment,this.colorSpace=t.colorSpace,this.renderTarget=t.renderTarget,this.isRenderTargetTexture=t.isRenderTargetTexture,this.isArrayTexture=t.isArrayTexture,this.userData=JSON.parse(JSON.stringify(t.userData)),this.needsUpdate=!0,this}setValues(t){for(const e in t){const n=t[e];if(n===void 0){wt(`Texture.setValues(): parameter '${e}' has value of undefined.`);continue}const i=this[e];if(i===void 0){wt(`Texture.setValues(): property '${e}' does not exist.`);continue}i&&n&&i.isVector2&&n.isVector2||i&&n&&i.isVector3&&n.isVector3||i&&n&&i.isMatrix3&&n.isMatrix3?i.copy(n):this[e]=n}}toJSON(t){const e=t===void 0||typeof t=="string";if(!e&&t.textures[this.uuid]!==void 0)return t.textures[this.uuid];const n={metadata:{version:4.7,type:"Texture",generator:"Texture.toJSON"},uuid:this.uuid,name:this.name,image:this.source.toJSON(t).uuid,mapping:this.mapping,channel:this.channel,repeat:[this.repeat.x,this.repeat.y],offset:[this.offset.x,this.offset.y],center:[this.center.x,this.center.y],rotation:this.rotation,wrap:[this.wrapS,this.wrapT],format:this.format,internalFormat:this.internalFormat,type:this.type,normalized:this.normalized,colorSpace:this.colorSpace,minFilter:this.minFilter,magFilter:this.magFilter,anisotropy:this.anisotropy,flipY:this.flipY,generateMipmaps:this.generateMipmaps,premultiplyAlpha:this.premultiplyAlpha,unpackAlignment:this.unpackAlignment};return Object.keys(this.userData).length>0&&(n.userData=this.userData),e||(t.textures[this.uuid]=n),n}dispose(){this.dispatchEvent({type:"dispose"})}transformUv(t){if(this.mapping!==sf)return t;if(t.applyMatrix3(this.matrix),t.x<0||t.x>1)switch(this.wrapS){case rs:t.x=t.x-Math.floor(t.x);break;case Dn:t.x=t.x<0?0:1;break;case kr:Math.abs(Math.floor(t.x)%2)===1?t.x=Math.ceil(t.x)-t.x:t.x=t.x-Math.floor(t.x);break}if(t.y<0||t.y>1)switch(this.wrapT){case rs:t.y=t.y-Math.floor(t.y);break;case Dn:t.y=t.y<0?0:1;break;case kr:Math.abs(Math.floor(t.y)%2)===1?t.y=Math.ceil(t.y)-t.y:t.y=t.y-Math.floor(t.y);break}return this.flipY&&(t.y=1-t.y),t}set needsUpdate(t){t===!0&&(this.version++,this.source.needsUpdate=!0)}set needsPMREMUpdate(t){t===!0&&this.pmremVersion++}}Xe.DEFAULT_IMAGE=null;Xe.DEFAULT_MAPPING=sf;Xe.DEFAULT_ANISOTROPY=1;const yh=class yh{constructor(t=0,e=0,n=0,i=1){this.x=t,this.y=e,this.z=n,this.w=i}get width(){return this.z}set width(t){this.z=t}get height(){return this.w}set height(t){this.w=t}set(t,e,n,i){return this.x=t,this.y=e,this.z=n,this.w=i,this}setScalar(t){return this.x=t,this.y=t,this.z=t,this.w=t,this}setX(t){return this.x=t,this}setY(t){return this.y=t,this}setZ(t){return this.z=t,this}setW(t){return this.w=t,this}setComponent(t,e){switch(t){case 0:this.x=e;break;case 1:this.y=e;break;case 2:this.z=e;break;case 3:this.w=e;break;default:throw new Error("THREE.Vector4: index is out of range: "+t)}return this}getComponent(t){switch(t){case 0:return this.x;case 1:return this.y;case 2:return this.z;case 3:return this.w;default:throw new Error("THREE.Vector4: index is out of range: "+t)}}clone(){return new this.constructor(this.x,this.y,this.z,this.w)}copy(t){return this.x=t.x,this.y=t.y,this.z=t.z,this.w=t.w!==void 0?t.w:1,this}add(t){return this.x+=t.x,this.y+=t.y,this.z+=t.z,this.w+=t.w,this}addScalar(t){return this.x+=t,this.y+=t,this.z+=t,this.w+=t,this}addVectors(t,e){return this.x=t.x+e.x,this.y=t.y+e.y,this.z=t.z+e.z,this.w=t.w+e.w,this}addScaledVector(t,e){return this.x+=t.x*e,this.y+=t.y*e,this.z+=t.z*e,this.w+=t.w*e,this}sub(t){return this.x-=t.x,this.y-=t.y,this.z-=t.z,this.w-=t.w,this}subScalar(t){return this.x-=t,this.y-=t,this.z-=t,this.w-=t,this}subVectors(t,e){return this.x=t.x-e.x,this.y=t.y-e.y,this.z=t.z-e.z,this.w=t.w-e.w,this}multiply(t){return this.x*=t.x,this.y*=t.y,this.z*=t.z,this.w*=t.w,this}multiplyScalar(t){return this.x*=t,this.y*=t,this.z*=t,this.w*=t,this}applyMatrix4(t){const e=this.x,n=this.y,i=this.z,s=this.w,o=t.elements;return this.x=o[0]*e+o[4]*n+o[8]*i+o[12]*s,this.y=o[1]*e+o[5]*n+o[9]*i+o[13]*s,this.z=o[2]*e+o[6]*n+o[10]*i+o[14]*s,this.w=o[3]*e+o[7]*n+o[11]*i+o[15]*s,this}divide(t){return this.x/=t.x,this.y/=t.y,this.z/=t.z,this.w/=t.w,this}divideScalar(t){return this.multiplyScalar(1/t)}setAxisAngleFromQuaternion(t){this.w=2*Math.acos(t.w);const e=Math.sqrt(1-t.w*t.w);return e<1e-4?(this.x=1,this.y=0,this.z=0):(this.x=t.x/e,this.y=t.y/e,this.z=t.z/e),this}setAxisAngleFromRotationMatrix(t){let e,n,i,s;const l=t.elements,c=l[0],h=l[4],u=l[8],d=l[1],f=l[5],m=l[9],_=l[2],g=l[6],p=l[10];if(Math.abs(h-d)<.01&&Math.abs(u-_)<.01&&Math.abs(m-g)<.01){if(Math.abs(h+d)<.1&&Math.abs(u+_)<.1&&Math.abs(m+g)<.1&&Math.abs(c+f+p-3)<.1)return this.set(1,0,0,0),this;e=Math.PI;const E=(c+1)/2,y=(f+1)/2,S=(p+1)/2,w=(h+d)/4,A=(u+_)/4,v=(m+g)/4;return E>y&&E>S?E<.01?(n=0,i=.707106781,s=.707106781):(n=Math.sqrt(E),i=w/n,s=A/n):y>S?y<.01?(n=.707106781,i=0,s=.707106781):(i=Math.sqrt(y),n=w/i,s=v/i):S<.01?(n=.707106781,i=.707106781,s=0):(s=Math.sqrt(S),n=A/s,i=v/s),this.set(n,i,s,e),this}let b=Math.sqrt((g-m)*(g-m)+(u-_)*(u-_)+(d-h)*(d-h));return Math.abs(b)<.001&&(b=1),this.x=(g-m)/b,this.y=(u-_)/b,this.z=(d-h)/b,this.w=Math.acos((c+f+p-1)/2),this}setFromMatrixPosition(t){const e=t.elements;return this.x=e[12],this.y=e[13],this.z=e[14],this.w=e[15],this}min(t){return this.x=Math.min(this.x,t.x),this.y=Math.min(this.y,t.y),this.z=Math.min(this.z,t.z),this.w=Math.min(this.w,t.w),this}max(t){return this.x=Math.max(this.x,t.x),this.y=Math.max(this.y,t.y),this.z=Math.max(this.z,t.z),this.w=Math.max(this.w,t.w),this}clamp(t,e){return this.x=Kt(this.x,t.x,e.x),this.y=Kt(this.y,t.y,e.y),this.z=Kt(this.z,t.z,e.z),this.w=Kt(this.w,t.w,e.w),this}clampScalar(t,e){return this.x=Kt(this.x,t,e),this.y=Kt(this.y,t,e),this.z=Kt(this.z,t,e),this.w=Kt(this.w,t,e),this}clampLength(t,e){const n=this.length();return this.divideScalar(n||1).multiplyScalar(Kt(n,t,e))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this.w=Math.floor(this.w),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this.w=Math.ceil(this.w),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this.w=Math.round(this.w),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this.w=Math.trunc(this.w),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this.w=-this.w,this}dot(t){return this.x*t.x+this.y*t.y+this.z*t.z+this.w*t.w}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)+Math.abs(this.w)}normalize(){return this.divideScalar(this.length()||1)}setLength(t){return this.normalize().multiplyScalar(t)}lerp(t,e){return this.x+=(t.x-this.x)*e,this.y+=(t.y-this.y)*e,this.z+=(t.z-this.z)*e,this.w+=(t.w-this.w)*e,this}lerpVectors(t,e,n){return this.x=t.x+(e.x-t.x)*n,this.y=t.y+(e.y-t.y)*n,this.z=t.z+(e.z-t.z)*n,this.w=t.w+(e.w-t.w)*n,this}equals(t){return t.x===this.x&&t.y===this.y&&t.z===this.z&&t.w===this.w}fromArray(t,e=0){return this.x=t[e],this.y=t[e+1],this.z=t[e+2],this.w=t[e+3],this}toArray(t=[],e=0){return t[e]=this.x,t[e+1]=this.y,t[e+2]=this.z,t[e+3]=this.w,t}fromBufferAttribute(t,e){return this.x=t.getX(e),this.y=t.getY(e),this.z=t.getZ(e),this.w=t.getW(e),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this.w=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z,yield this.w}};yh.prototype.isVector4=!0;let be=yh;class Nm extends Ei{constructor(t=1,e=1,n={}){super(),n=Object.assign({generateMipmaps:!1,internalFormat:null,minFilter:We,depthBuffer:!0,stencilBuffer:!1,resolveDepthBuffer:!0,resolveStencilBuffer:!0,depthTexture:null,samples:0,count:1,depth:1,multiview:!1,useArrayDepthTexture:!1},n),this.isRenderTarget=!0,this.width=t,this.height=e,this.depth=n.depth,this.scissor=new be(0,0,t,e),this.scissorTest=!1,this.viewport=new be(0,0,t,e),this.textures=[];const i={width:t,height:e,depth:n.depth},s=new Xe(i),o=n.count;for(let a=0;a<o;a++)this.textures[a]=s.clone(),this.textures[a].isRenderTargetTexture=!0,this.textures[a].renderTarget=this;this._setTextureOptions(n),this.depthBuffer=n.depthBuffer,this.stencilBuffer=n.stencilBuffer,this.resolveDepthBuffer=n.resolveDepthBuffer,this.resolveStencilBuffer=n.resolveStencilBuffer,this._depthTexture=null,this.depthTexture=n.depthTexture,this.samples=n.samples,this.multiview=n.multiview,this.useArrayDepthTexture=n.useArrayDepthTexture}_setTextureOptions(t={}){const e={minFilter:We,generateMipmaps:!1,flipY:!1,internalFormat:null};t.mapping!==void 0&&(e.mapping=t.mapping),t.wrapS!==void 0&&(e.wrapS=t.wrapS),t.wrapT!==void 0&&(e.wrapT=t.wrapT),t.wrapR!==void 0&&(e.wrapR=t.wrapR),t.magFilter!==void 0&&(e.magFilter=t.magFilter),t.minFilter!==void 0&&(e.minFilter=t.minFilter),t.format!==void 0&&(e.format=t.format),t.type!==void 0&&(e.type=t.type),t.anisotropy!==void 0&&(e.anisotropy=t.anisotropy),t.colorSpace!==void 0&&(e.colorSpace=t.colorSpace),t.flipY!==void 0&&(e.flipY=t.flipY),t.generateMipmaps!==void 0&&(e.generateMipmaps=t.generateMipmaps),t.internalFormat!==void 0&&(e.internalFormat=t.internalFormat);for(let n=0;n<this.textures.length;n++)this.textures[n].setValues(e)}get texture(){return this.textures[0]}set texture(t){this.textures[0]=t}set depthTexture(t){this._depthTexture!==null&&(this._depthTexture.renderTarget=null),t!==null&&(t.renderTarget=this),this._depthTexture=t}get depthTexture(){return this._depthTexture}setSize(t,e,n=1){if(this.width!==t||this.height!==e||this.depth!==n){this.width=t,this.height=e,this.depth=n;for(let i=0,s=this.textures.length;i<s;i++)this.textures[i].image.width=t,this.textures[i].image.height=e,this.textures[i].image.depth=n,this.textures[i].isData3DTexture!==!0&&(this.textures[i].isArrayTexture=this.textures[i].image.depth>1);this.dispose()}this.viewport.set(0,0,t,e),this.scissor.set(0,0,t,e)}clone(){return new this.constructor().copy(this)}copy(t){this.width=t.width,this.height=t.height,this.depth=t.depth,this.scissor.copy(t.scissor),this.scissorTest=t.scissorTest,this.viewport.copy(t.viewport),this.textures.length=0;for(let e=0,n=t.textures.length;e<n;e++){this.textures[e]=t.textures[e].clone(),this.textures[e].isRenderTargetTexture=!0,this.textures[e].renderTarget=this;const i=Object.assign({},t.textures[e].image);this.textures[e].source=new Vc(i)}return this.depthBuffer=t.depthBuffer,this.stencilBuffer=t.stencilBuffer,this.resolveDepthBuffer=t.resolveDepthBuffer,this.resolveStencilBuffer=t.resolveStencilBuffer,t.depthTexture!==null&&(this.depthTexture=t.depthTexture.clone()),this.samples=t.samples,this.multiview=t.multiview,this.useArrayDepthTexture=t.useArrayDepthTexture,this}dispose(){this.dispatchEvent({type:"dispose"})}}class si extends Nm{constructor(t=1,e=1,n={}){super(t,e,n),this.isWebGLRenderTarget=!0}}class mf extends Xe{constructor(t=null,e=1,n=1,i=1){super(null),this.isDataArrayTexture=!0,this.image={data:t,width:e,height:n,depth:i},this.magFilter=$e,this.minFilter=$e,this.wrapR=Dn,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1,this.layerUpdates=new Set}addLayerUpdate(t){this.layerUpdates.add(t)}clearLayerUpdates(){this.layerUpdates.clear()}}class Um extends Xe{constructor(t=null,e=1,n=1,i=1){super(null),this.isData3DTexture=!0,this.image={data:t,width:e,height:n,depth:i},this.magFilter=$e,this.minFilter=$e,this.wrapR=Dn,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}}const da=class da{constructor(t,e,n,i,s,o,a,l,c,h,u,d,f,m,_,g){this.elements=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1],t!==void 0&&this.set(t,e,n,i,s,o,a,l,c,h,u,d,f,m,_,g)}set(t,e,n,i,s,o,a,l,c,h,u,d,f,m,_,g){const p=this.elements;return p[0]=t,p[4]=e,p[8]=n,p[12]=i,p[1]=s,p[5]=o,p[9]=a,p[13]=l,p[2]=c,p[6]=h,p[10]=u,p[14]=d,p[3]=f,p[7]=m,p[11]=_,p[15]=g,this}identity(){return this.set(1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1),this}clone(){return new da().fromArray(this.elements)}copy(t){const e=this.elements,n=t.elements;return e[0]=n[0],e[1]=n[1],e[2]=n[2],e[3]=n[3],e[4]=n[4],e[5]=n[5],e[6]=n[6],e[7]=n[7],e[8]=n[8],e[9]=n[9],e[10]=n[10],e[11]=n[11],e[12]=n[12],e[13]=n[13],e[14]=n[14],e[15]=n[15],this}copyPosition(t){const e=this.elements,n=t.elements;return e[12]=n[12],e[13]=n[13],e[14]=n[14],this}setFromMatrix3(t){const e=t.elements;return this.set(e[0],e[3],e[6],0,e[1],e[4],e[7],0,e[2],e[5],e[8],0,0,0,0,1),this}extractBasis(t,e,n){return this.determinantAffine()===0?(t.set(1,0,0),e.set(0,1,0),n.set(0,0,1),this):(t.setFromMatrixColumn(this,0),e.setFromMatrixColumn(this,1),n.setFromMatrixColumn(this,2),this)}makeBasis(t,e,n){return this.set(t.x,e.x,n.x,0,t.y,e.y,n.y,0,t.z,e.z,n.z,0,0,0,0,1),this}extractRotation(t){if(t.determinantAffine()===0)return this.identity();const e=this.elements,n=t.elements,i=1/ps.setFromMatrixColumn(t,0).length(),s=1/ps.setFromMatrixColumn(t,1).length(),o=1/ps.setFromMatrixColumn(t,2).length();return e[0]=n[0]*i,e[1]=n[1]*i,e[2]=n[2]*i,e[3]=0,e[4]=n[4]*s,e[5]=n[5]*s,e[6]=n[6]*s,e[7]=0,e[8]=n[8]*o,e[9]=n[9]*o,e[10]=n[10]*o,e[11]=0,e[12]=0,e[13]=0,e[14]=0,e[15]=1,this}makeRotationFromEuler(t){const e=this.elements,n=t.x,i=t.y,s=t.z,o=Math.cos(n),a=Math.sin(n),l=Math.cos(i),c=Math.sin(i),h=Math.cos(s),u=Math.sin(s);if(t.order==="XYZ"){const d=o*h,f=o*u,m=a*h,_=a*u;e[0]=l*h,e[4]=-l*u,e[8]=c,e[1]=f+m*c,e[5]=d-_*c,e[9]=-a*l,e[2]=_-d*c,e[6]=m+f*c,e[10]=o*l}else if(t.order==="YXZ"){const d=l*h,f=l*u,m=c*h,_=c*u;e[0]=d+_*a,e[4]=m*a-f,e[8]=o*c,e[1]=o*u,e[5]=o*h,e[9]=-a,e[2]=f*a-m,e[6]=_+d*a,e[10]=o*l}else if(t.order==="ZXY"){const d=l*h,f=l*u,m=c*h,_=c*u;e[0]=d-_*a,e[4]=-o*u,e[8]=m+f*a,e[1]=f+m*a,e[5]=o*h,e[9]=_-d*a,e[2]=-o*c,e[6]=a,e[10]=o*l}else if(t.order==="ZYX"){const d=o*h,f=o*u,m=a*h,_=a*u;e[0]=l*h,e[4]=m*c-f,e[8]=d*c+_,e[1]=l*u,e[5]=_*c+d,e[9]=f*c-m,e[2]=-c,e[6]=a*l,e[10]=o*l}else if(t.order==="YZX"){const d=o*l,f=o*c,m=a*l,_=a*c;e[0]=l*h,e[4]=_-d*u,e[8]=m*u+f,e[1]=u,e[5]=o*h,e[9]=-a*h,e[2]=-c*h,e[6]=f*u+m,e[10]=d-_*u}else if(t.order==="XZY"){const d=o*l,f=o*c,m=a*l,_=a*c;e[0]=l*h,e[4]=-u,e[8]=c*h,e[1]=d*u+_,e[5]=o*h,e[9]=f*u-m,e[2]=m*u-f,e[6]=a*h,e[10]=_*u+d}return e[3]=0,e[7]=0,e[11]=0,e[12]=0,e[13]=0,e[14]=0,e[15]=1,this}makeRotationFromQuaternion(t){return this.compose(Fm,t,Om)}lookAt(t,e,n){const i=this.elements;return yn.subVectors(t,e),yn.lengthSq()===0&&(yn.z=1),yn.normalize(),Ri.crossVectors(n,yn),Ri.lengthSq()===0&&(Math.abs(n.z)===1?yn.x+=1e-4:yn.z+=1e-4,yn.normalize(),Ri.crossVectors(n,yn)),Ri.normalize(),ro.crossVectors(yn,Ri),i[0]=Ri.x,i[4]=ro.x,i[8]=yn.x,i[1]=Ri.y,i[5]=ro.y,i[9]=yn.y,i[2]=Ri.z,i[6]=ro.z,i[10]=yn.z,this}multiply(t){return this.multiplyMatrices(this,t)}premultiply(t){return this.multiplyMatrices(t,this)}multiplyMatrices(t,e){const n=t.elements,i=e.elements,s=this.elements,o=n[0],a=n[4],l=n[8],c=n[12],h=n[1],u=n[5],d=n[9],f=n[13],m=n[2],_=n[6],g=n[10],p=n[14],b=n[3],E=n[7],y=n[11],S=n[15],w=i[0],A=i[4],v=i[8],T=i[12],I=i[1],L=i[5],U=i[9],W=i[13],K=i[2],k=i[6],$=i[10],V=i[14],Q=i[3],it=i[7],ft=i[11],at=i[15];return s[0]=o*w+a*I+l*K+c*Q,s[4]=o*A+a*L+l*k+c*it,s[8]=o*v+a*U+l*$+c*ft,s[12]=o*T+a*W+l*V+c*at,s[1]=h*w+u*I+d*K+f*Q,s[5]=h*A+u*L+d*k+f*it,s[9]=h*v+u*U+d*$+f*ft,s[13]=h*T+u*W+d*V+f*at,s[2]=m*w+_*I+g*K+p*Q,s[6]=m*A+_*L+g*k+p*it,s[10]=m*v+_*U+g*$+p*ft,s[14]=m*T+_*W+g*V+p*at,s[3]=b*w+E*I+y*K+S*Q,s[7]=b*A+E*L+y*k+S*it,s[11]=b*v+E*U+y*$+S*ft,s[15]=b*T+E*W+y*V+S*at,this}multiplyScalar(t){const e=this.elements;return e[0]*=t,e[4]*=t,e[8]*=t,e[12]*=t,e[1]*=t,e[5]*=t,e[9]*=t,e[13]*=t,e[2]*=t,e[6]*=t,e[10]*=t,e[14]*=t,e[3]*=t,e[7]*=t,e[11]*=t,e[15]*=t,this}determinant(){const t=this.elements,e=t[0],n=t[4],i=t[8],s=t[12],o=t[1],a=t[5],l=t[9],c=t[13],h=t[2],u=t[6],d=t[10],f=t[14],m=t[3],_=t[7],g=t[11],p=t[15],b=l*f-c*d,E=a*f-c*u,y=a*d-l*u,S=o*f-c*h,w=o*d-l*h,A=o*u-a*h;return e*(_*b-g*E+p*y)-n*(m*b-g*S+p*w)+i*(m*E-_*S+p*A)-s*(m*y-_*w+g*A)}determinantAffine(){const t=this.elements,e=t[0],n=t[4],i=t[8],s=t[1],o=t[5],a=t[9],l=t[2],c=t[6],h=t[10];return e*(o*h-a*c)-n*(s*h-a*l)+i*(s*c-o*l)}transpose(){const t=this.elements;let e;return e=t[1],t[1]=t[4],t[4]=e,e=t[2],t[2]=t[8],t[8]=e,e=t[6],t[6]=t[9],t[9]=e,e=t[3],t[3]=t[12],t[12]=e,e=t[7],t[7]=t[13],t[13]=e,e=t[11],t[11]=t[14],t[14]=e,this}setPosition(t,e,n){const i=this.elements;return t.isVector3?(i[12]=t.x,i[13]=t.y,i[14]=t.z):(i[12]=t,i[13]=e,i[14]=n),this}invert(){const t=this.elements,e=t[0],n=t[1],i=t[2],s=t[3],o=t[4],a=t[5],l=t[6],c=t[7],h=t[8],u=t[9],d=t[10],f=t[11],m=t[12],_=t[13],g=t[14],p=t[15],b=e*a-n*o,E=e*l-i*o,y=e*c-s*o,S=n*l-i*a,w=n*c-s*a,A=i*c-s*l,v=h*_-u*m,T=h*g-d*m,I=h*p-f*m,L=u*g-d*_,U=u*p-f*_,W=d*p-f*g,K=b*W-E*U+y*L+S*I-w*T+A*v;if(K===0)return this.set(0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0);const k=1/K;return t[0]=(a*W-l*U+c*L)*k,t[1]=(i*U-n*W-s*L)*k,t[2]=(_*A-g*w+p*S)*k,t[3]=(d*w-u*A-f*S)*k,t[4]=(l*I-o*W-c*T)*k,t[5]=(e*W-i*I+s*T)*k,t[6]=(g*y-m*A-p*E)*k,t[7]=(h*A-d*y+f*E)*k,t[8]=(o*U-a*I+c*v)*k,t[9]=(n*I-e*U-s*v)*k,t[10]=(m*w-_*y+p*b)*k,t[11]=(u*y-h*w-f*b)*k,t[12]=(a*T-o*L-l*v)*k,t[13]=(e*L-n*T+i*v)*k,t[14]=(_*E-m*S-g*b)*k,t[15]=(h*S-u*E+d*b)*k,this}scale(t){const e=this.elements,n=t.x,i=t.y,s=t.z;return e[0]*=n,e[4]*=i,e[8]*=s,e[1]*=n,e[5]*=i,e[9]*=s,e[2]*=n,e[6]*=i,e[10]*=s,e[3]*=n,e[7]*=i,e[11]*=s,this}getMaxScaleOnAxis(){const t=this.elements,e=t[0]*t[0]+t[1]*t[1]+t[2]*t[2],n=t[4]*t[4]+t[5]*t[5]+t[6]*t[6],i=t[8]*t[8]+t[9]*t[9]+t[10]*t[10];return Math.sqrt(Math.max(e,n,i))}makeTranslation(t,e,n){return t.isVector3?this.set(1,0,0,t.x,0,1,0,t.y,0,0,1,t.z,0,0,0,1):this.set(1,0,0,t,0,1,0,e,0,0,1,n,0,0,0,1),this}makeRotationX(t){const e=Math.cos(t),n=Math.sin(t);return this.set(1,0,0,0,0,e,-n,0,0,n,e,0,0,0,0,1),this}makeRotationY(t){const e=Math.cos(t),n=Math.sin(t);return this.set(e,0,n,0,0,1,0,0,-n,0,e,0,0,0,0,1),this}makeRotationZ(t){const e=Math.cos(t),n=Math.sin(t);return this.set(e,-n,0,0,n,e,0,0,0,0,1,0,0,0,0,1),this}makeRotationAxis(t,e){const n=Math.cos(e),i=Math.sin(e),s=1-n,o=t.x,a=t.y,l=t.z,c=s*o,h=s*a;return this.set(c*o+n,c*a-i*l,c*l+i*a,0,c*a+i*l,h*a+n,h*l-i*o,0,c*l-i*a,h*l+i*o,s*l*l+n,0,0,0,0,1),this}makeScale(t,e,n){return this.set(t,0,0,0,0,e,0,0,0,0,n,0,0,0,0,1),this}makeShear(t,e,n,i,s,o){return this.set(1,n,s,0,t,1,o,0,e,i,1,0,0,0,0,1),this}compose(t,e,n){const i=this.elements,s=e._x,o=e._y,a=e._z,l=e._w,c=s+s,h=o+o,u=a+a,d=s*c,f=s*h,m=s*u,_=o*h,g=o*u,p=a*u,b=l*c,E=l*h,y=l*u,S=n.x,w=n.y,A=n.z;return i[0]=(1-(_+p))*S,i[1]=(f+y)*S,i[2]=(m-E)*S,i[3]=0,i[4]=(f-y)*w,i[5]=(1-(d+p))*w,i[6]=(g+b)*w,i[7]=0,i[8]=(m+E)*A,i[9]=(g-b)*A,i[10]=(1-(d+_))*A,i[11]=0,i[12]=t.x,i[13]=t.y,i[14]=t.z,i[15]=1,this}decompose(t,e,n){const i=this.elements;t.x=i[12],t.y=i[13],t.z=i[14];const s=this.determinantAffine();if(s===0)return n.set(1,1,1),e.identity(),this;let o=ps.set(i[0],i[1],i[2]).length();const a=ps.set(i[4],i[5],i[6]).length(),l=ps.set(i[8],i[9],i[10]).length();s<0&&(o=-o),Fn.copy(this);const c=1/o,h=1/a,u=1/l;return Fn.elements[0]*=c,Fn.elements[1]*=c,Fn.elements[2]*=c,Fn.elements[4]*=h,Fn.elements[5]*=h,Fn.elements[6]*=h,Fn.elements[8]*=u,Fn.elements[9]*=u,Fn.elements[10]*=u,e.setFromRotationMatrix(Fn),n.x=o,n.y=a,n.z=l,this}makePerspective(t,e,n,i,s,o,a=ni,l=!1){const c=this.elements,h=2*s/(e-t),u=2*s/(n-i),d=(e+t)/(e-t),f=(n+i)/(n-i);let m,_;if(l)m=s/(o-s),_=o*s/(o-s);else if(a===ni)m=-(o+s)/(o-s),_=-2*o*s/(o-s);else if(a===Gr)m=-o/(o-s),_=-o*s/(o-s);else throw new Error("THREE.Matrix4.makePerspective(): Invalid coordinate system: "+a);return c[0]=h,c[4]=0,c[8]=d,c[12]=0,c[1]=0,c[5]=u,c[9]=f,c[13]=0,c[2]=0,c[6]=0,c[10]=m,c[14]=_,c[3]=0,c[7]=0,c[11]=-1,c[15]=0,this}makeOrthographic(t,e,n,i,s,o,a=ni,l=!1){const c=this.elements,h=2/(e-t),u=2/(n-i),d=-(e+t)/(e-t),f=-(n+i)/(n-i);let m,_;if(l)m=1/(o-s),_=o/(o-s);else if(a===ni)m=-2/(o-s),_=-(o+s)/(o-s);else if(a===Gr)m=-1/(o-s),_=-s/(o-s);else throw new Error("THREE.Matrix4.makeOrthographic(): Invalid coordinate system: "+a);return c[0]=h,c[4]=0,c[8]=0,c[12]=d,c[1]=0,c[5]=u,c[9]=0,c[13]=f,c[2]=0,c[6]=0,c[10]=m,c[14]=_,c[3]=0,c[7]=0,c[11]=0,c[15]=1,this}equals(t){const e=this.elements,n=t.elements;for(let i=0;i<16;i++)if(e[i]!==n[i])return!1;return!0}fromArray(t,e=0){for(let n=0;n<16;n++)this.elements[n]=t[n+e];return this}toArray(t=[],e=0){const n=this.elements;return t[e]=n[0],t[e+1]=n[1],t[e+2]=n[2],t[e+3]=n[3],t[e+4]=n[4],t[e+5]=n[5],t[e+6]=n[6],t[e+7]=n[7],t[e+8]=n[8],t[e+9]=n[9],t[e+10]=n[10],t[e+11]=n[11],t[e+12]=n[12],t[e+13]=n[13],t[e+14]=n[14],t[e+15]=n[15],t}};da.prototype.isMatrix4=!0;let Ht=da;const ps=new P,Fn=new Ht,Fm=new P(0,0,0),Om=new P(1,1,1),Ri=new P,ro=new P,yn=new P,Wh=new Ht,Xh=new mn;class Hi{constructor(t=0,e=0,n=0,i=Hi.DEFAULT_ORDER){this.isEuler=!0,this._x=t,this._y=e,this._z=n,this._order=i}get x(){return this._x}set x(t){this._x=t,this._onChangeCallback()}get y(){return this._y}set y(t){this._y=t,this._onChangeCallback()}get z(){return this._z}set z(t){this._z=t,this._onChangeCallback()}get order(){return this._order}set order(t){this._order=t,this._onChangeCallback()}set(t,e,n,i=this._order){return this._x=t,this._y=e,this._z=n,this._order=i,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._order)}copy(t){return this._x=t._x,this._y=t._y,this._z=t._z,this._order=t._order,this._onChangeCallback(),this}setFromRotationMatrix(t,e=this._order,n=!0){const i=t.elements,s=i[0],o=i[4],a=i[8],l=i[1],c=i[5],h=i[9],u=i[2],d=i[6],f=i[10];switch(e){case"XYZ":this._y=Math.asin(Kt(a,-1,1)),Math.abs(a)<.9999999?(this._x=Math.atan2(-h,f),this._z=Math.atan2(-o,s)):(this._x=Math.atan2(d,c),this._z=0);break;case"YXZ":this._x=Math.asin(-Kt(h,-1,1)),Math.abs(h)<.9999999?(this._y=Math.atan2(a,f),this._z=Math.atan2(l,c)):(this._y=Math.atan2(-u,s),this._z=0);break;case"ZXY":this._x=Math.asin(Kt(d,-1,1)),Math.abs(d)<.9999999?(this._y=Math.atan2(-u,f),this._z=Math.atan2(-o,c)):(this._y=0,this._z=Math.atan2(l,s));break;case"ZYX":this._y=Math.asin(-Kt(u,-1,1)),Math.abs(u)<.9999999?(this._x=Math.atan2(d,f),this._z=Math.atan2(l,s)):(this._x=0,this._z=Math.atan2(-o,c));break;case"YZX":this._z=Math.asin(Kt(l,-1,1)),Math.abs(l)<.9999999?(this._x=Math.atan2(-h,c),this._y=Math.atan2(-u,s)):(this._x=0,this._y=Math.atan2(a,f));break;case"XZY":this._z=Math.asin(-Kt(o,-1,1)),Math.abs(o)<.9999999?(this._x=Math.atan2(d,c),this._y=Math.atan2(a,s)):(this._x=Math.atan2(-h,f),this._y=0);break;default:wt("Euler: .setFromRotationMatrix() encountered an unknown order: "+e)}return this._order=e,n===!0&&this._onChangeCallback(),this}setFromQuaternion(t,e,n){return Wh.makeRotationFromQuaternion(t),this.setFromRotationMatrix(Wh,e,n)}setFromVector3(t,e=this._order){return this.set(t.x,t.y,t.z,e)}reorder(t){return Xh.setFromEuler(this),this.setFromQuaternion(Xh,t)}equals(t){return t._x===this._x&&t._y===this._y&&t._z===this._z&&t._order===this._order}fromArray(t){return this._x=t[0],this._y=t[1],this._z=t[2],t[3]!==void 0&&(this._order=t[3]),this._onChangeCallback(),this}toArray(t=[],e=0){return t[e]=this._x,t[e+1]=this._y,t[e+2]=this._z,t[e+3]=this._order,t}_onChange(t){return this._onChangeCallback=t,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._order}}Hi.DEFAULT_ORDER="XYZ";class Gc{constructor(){this.mask=1}set(t){this.mask=(1<<t|0)>>>0}enable(t){this.mask|=1<<t|0}enableAll(){this.mask=-1}toggle(t){this.mask^=1<<t|0}disable(t){this.mask&=~(1<<t|0)}disableAll(){this.mask=0}test(t){return(this.mask&t.mask)!==0}isEnabled(t){return(this.mask&(1<<t|0))!==0}}let km=0;const qh=new P,ms=new mn,ui=new Ht,oo=new P,ur=new P,Bm=new P,zm=new mn,$h=new P(1,0,0),Yh=new P(0,1,0),Kh=new P(0,0,1),Zh={type:"added"},Hm={type:"removed"},gs={type:"childadded",child:null},Ia={type:"childremoved",child:null};class Re extends Ei{constructor(){super(),this.isObject3D=!0,Object.defineProperty(this,"id",{value:km++}),this.uuid=Hn(),this.name="",this.type="Object3D",this.parent=null,this.children=[],this.up=Re.DEFAULT_UP.clone();const t=new P,e=new Hi,n=new mn,i=new P(1,1,1);function s(){n.setFromEuler(e,!1)}function o(){e.setFromQuaternion(n,void 0,!1)}e._onChange(s),n._onChange(o),Object.defineProperties(this,{position:{configurable:!0,enumerable:!0,value:t},rotation:{configurable:!0,enumerable:!0,value:e},quaternion:{configurable:!0,enumerable:!0,value:n},scale:{configurable:!0,enumerable:!0,value:i},modelViewMatrix:{value:new Ht},normalMatrix:{value:new Vt}}),this.matrix=new Ht,this.matrixWorld=new Ht,this.matrixAutoUpdate=Re.DEFAULT_MATRIX_AUTO_UPDATE,this.matrixWorldAutoUpdate=Re.DEFAULT_MATRIX_WORLD_AUTO_UPDATE,this.matrixWorldNeedsUpdate=!1,this.layers=new Gc,this.visible=!0,this.castShadow=!1,this.receiveShadow=!1,this.frustumCulled=!0,this.renderOrder=0,this.animations=[],this.customDepthMaterial=void 0,this.customDistanceMaterial=void 0,this.static=!1,this.userData={},this.pivot=null}onBeforeShadow(){}onAfterShadow(){}onBeforeRender(){}onAfterRender(){}applyMatrix4(t){this.matrixAutoUpdate&&this.updateMatrix(),this.matrix.premultiply(t),this.matrix.decompose(this.position,this.quaternion,this.scale)}applyQuaternion(t){return this.quaternion.premultiply(t),this}setRotationFromAxisAngle(t,e){this.quaternion.setFromAxisAngle(t,e)}setRotationFromEuler(t){this.quaternion.setFromEuler(t,!0)}setRotationFromMatrix(t){this.quaternion.setFromRotationMatrix(t)}setRotationFromQuaternion(t){this.quaternion.copy(t)}rotateOnAxis(t,e){return ms.setFromAxisAngle(t,e),this.quaternion.multiply(ms),this}rotateOnWorldAxis(t,e){return ms.setFromAxisAngle(t,e),this.quaternion.premultiply(ms),this}rotateX(t){return this.rotateOnAxis($h,t)}rotateY(t){return this.rotateOnAxis(Yh,t)}rotateZ(t){return this.rotateOnAxis(Kh,t)}translateOnAxis(t,e){return qh.copy(t).applyQuaternion(this.quaternion),this.position.add(qh.multiplyScalar(e)),this}translateX(t){return this.translateOnAxis($h,t)}translateY(t){return this.translateOnAxis(Yh,t)}translateZ(t){return this.translateOnAxis(Kh,t)}localToWorld(t){return this.updateWorldMatrix(!0,!1),t.applyMatrix4(this.matrixWorld)}worldToLocal(t){return this.updateWorldMatrix(!0,!1),t.applyMatrix4(ui.copy(this.matrixWorld).invert())}lookAt(t,e,n){t.isVector3?oo.copy(t):oo.set(t,e,n);const i=this.parent;this.updateWorldMatrix(!0,!1),ur.setFromMatrixPosition(this.matrixWorld),this.isCamera||this.isLight?ui.lookAt(ur,oo,this.up):ui.lookAt(oo,ur,this.up),this.quaternion.setFromRotationMatrix(ui),i&&(ui.extractRotation(i.matrixWorld),ms.setFromRotationMatrix(ui),this.quaternion.premultiply(ms.invert()))}add(t){if(arguments.length>1){for(let e=0;e<arguments.length;e++)this.add(arguments[e]);return this}return t===this?(Ot("Object3D.add: object can't be added as a child of itself.",t),this):(t&&t.isObject3D?(t.removeFromParent(),t.parent=this,this.children.push(t),t.dispatchEvent(Zh),gs.child=t,this.dispatchEvent(gs),gs.child=null):Ot("Object3D.add: object not an instance of THREE.Object3D.",t),this)}remove(t){if(arguments.length>1){for(let n=0;n<arguments.length;n++)this.remove(arguments[n]);return this}const e=this.children.indexOf(t);return e!==-1&&(t.parent=null,this.children.splice(e,1),t.dispatchEvent(Hm),Ia.child=t,this.dispatchEvent(Ia),Ia.child=null),this}removeFromParent(){const t=this.parent;return t!==null&&t.remove(this),this}clear(){return this.remove(...this.children)}attach(t){return this.updateWorldMatrix(!0,!1),ui.copy(this.matrixWorld).invert(),t.parent!==null&&(t.parent.updateWorldMatrix(!0,!1),ui.multiply(t.parent.matrixWorld)),t.applyMatrix4(ui),t.removeFromParent(),t.parent=this,this.children.push(t),t.updateWorldMatrix(!1,!0),t.dispatchEvent(Zh),gs.child=t,this.dispatchEvent(gs),gs.child=null,this}getObjectById(t){return this.getObjectByProperty("id",t)}getObjectByName(t){return this.getObjectByProperty("name",t)}getObjectByProperty(t,e){if(this[t]===e)return this;for(let n=0,i=this.children.length;n<i;n++){const o=this.children[n].getObjectByProperty(t,e);if(o!==void 0)return o}}getObjectsByProperty(t,e,n=[]){this[t]===e&&n.push(this);const i=this.children;for(let s=0,o=i.length;s<o;s++)i[s].getObjectsByProperty(t,e,n);return n}getWorldPosition(t){return this.updateWorldMatrix(!0,!1),t.setFromMatrixPosition(this.matrixWorld)}getWorldQuaternion(t){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(ur,t,Bm),t}getWorldScale(t){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(ur,zm,t),t}getWorldDirection(t){this.updateWorldMatrix(!0,!1);const e=this.matrixWorld.elements;return t.set(e[8],e[9],e[10]).normalize()}raycast(){}traverse(t){t(this);const e=this.children;for(let n=0,i=e.length;n<i;n++)e[n].traverse(t)}traverseVisible(t){if(this.visible===!1)return;t(this);const e=this.children;for(let n=0,i=e.length;n<i;n++)e[n].traverseVisible(t)}traverseAncestors(t){const e=this.parent;e!==null&&(t(e),e.traverseAncestors(t))}updateMatrix(){this.matrix.compose(this.position,this.quaternion,this.scale);const t=this.pivot;if(t!==null){const e=t.x,n=t.y,i=t.z,s=this.matrix.elements;s[12]+=e-s[0]*e-s[4]*n-s[8]*i,s[13]+=n-s[1]*e-s[5]*n-s[9]*i,s[14]+=i-s[2]*e-s[6]*n-s[10]*i}this.matrixWorldNeedsUpdate=!0}updateMatrixWorld(t){this.matrixAutoUpdate&&this.updateMatrix(),(this.matrixWorldNeedsUpdate||t)&&(this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),this.matrixWorldNeedsUpdate=!1,t=!0);const e=this.children;for(let n=0,i=e.length;n<i;n++)e[n].updateMatrixWorld(t)}updateWorldMatrix(t,e,n=!1){const i=this.parent;if(t===!0&&i!==null&&i.updateWorldMatrix(!0,!1),this.matrixAutoUpdate&&this.updateMatrix(),(this.matrixWorldNeedsUpdate||n)&&(this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),this.matrixWorldNeedsUpdate=!1,n=!0),e===!0){const s=this.children;for(let o=0,a=s.length;o<a;o++)s[o].updateWorldMatrix(!1,!0,n)}}toJSON(t){const e=t===void 0||typeof t=="string",n={};e&&(t={geometries:{},materials:{},textures:{},images:{},shapes:{},skeletons:{},animations:{},nodes:{}},n.metadata={version:4.7,type:"Object",generator:"Object3D.toJSON"});const i={};i.uuid=this.uuid,i.type=this.type,this.name!==""&&(i.name=this.name),this.castShadow===!0&&(i.castShadow=!0),this.receiveShadow===!0&&(i.receiveShadow=!0),this.visible===!1&&(i.visible=!1),this.frustumCulled===!1&&(i.frustumCulled=!1),this.renderOrder!==0&&(i.renderOrder=this.renderOrder),this.static!==!1&&(i.static=this.static),Object.keys(this.userData).length>0&&(i.userData=this.userData),i.layers=this.layers.mask,i.matrix=this.matrix.toArray(),i.up=this.up.toArray(),this.pivot!==null&&(i.pivot=this.pivot.toArray()),this.matrixAutoUpdate===!1&&(i.matrixAutoUpdate=!1),this.morphTargetDictionary!==void 0&&(i.morphTargetDictionary=Object.assign({},this.morphTargetDictionary)),this.morphTargetInfluences!==void 0&&(i.morphTargetInfluences=this.morphTargetInfluences.slice()),this.isInstancedMesh&&(i.type="InstancedMesh",i.count=this.count,i.instanceMatrix=this.instanceMatrix.toJSON(),this.instanceColor!==null&&(i.instanceColor=this.instanceColor.toJSON())),this.isBatchedMesh&&(i.type="BatchedMesh",i.perObjectFrustumCulled=this.perObjectFrustumCulled,i.sortObjects=this.sortObjects,i.drawRanges=this._drawRanges,i.reservedRanges=this._reservedRanges,i.geometryInfo=this._geometryInfo.map(a=>({...a,boundingBox:a.boundingBox?a.boundingBox.toJSON():void 0,boundingSphere:a.boundingSphere?a.boundingSphere.toJSON():void 0})),i.instanceInfo=this._instanceInfo.map(a=>({...a})),i.availableInstanceIds=this._availableInstanceIds.slice(),i.availableGeometryIds=this._availableGeometryIds.slice(),i.nextIndexStart=this._nextIndexStart,i.nextVertexStart=this._nextVertexStart,i.geometryCount=this._geometryCount,i.maxInstanceCount=this._maxInstanceCount,i.maxVertexCount=this._maxVertexCount,i.maxIndexCount=this._maxIndexCount,i.geometryInitialized=this._geometryInitialized,i.matricesTexture=this._matricesTexture.toJSON(t),i.indirectTexture=this._indirectTexture.toJSON(t),this._colorsTexture!==null&&(i.colorsTexture=this._colorsTexture.toJSON(t)),this.boundingSphere!==null&&(i.boundingSphere=this.boundingSphere.toJSON()),this.boundingBox!==null&&(i.boundingBox=this.boundingBox.toJSON()));function s(a,l){return a[l.uuid]===void 0&&(a[l.uuid]=l.toJSON(t)),l.uuid}if(this.isScene)this.background&&(this.background.isColor?i.background=this.background.toJSON():this.background.isTexture&&(i.background=this.background.toJSON(t).uuid)),this.environment&&this.environment.isTexture&&this.environment.isRenderTargetTexture!==!0&&(i.environment=this.environment.toJSON(t).uuid);else if(this.isMesh||this.isLine||this.isPoints){i.geometry=s(t.geometries,this.geometry);const a=this.geometry.parameters;if(a!==void 0&&a.shapes!==void 0){const l=a.shapes;if(Array.isArray(l))for(let c=0,h=l.length;c<h;c++){const u=l[c];s(t.shapes,u)}else s(t.shapes,l)}}if(this.isSkinnedMesh&&(i.bindMode=this.bindMode,i.bindMatrix=this.bindMatrix.toArray(),this.skeleton!==void 0&&(s(t.skeletons,this.skeleton),i.skeleton=this.skeleton.uuid)),this.material!==void 0)if(Array.isArray(this.material)){const a=[];for(let l=0,c=this.material.length;l<c;l++)a.push(s(t.materials,this.material[l]));i.material=a}else i.material=s(t.materials,this.material);if(this.children.length>0){i.children=[];for(let a=0;a<this.children.length;a++)i.children.push(this.children[a].toJSON(t).object)}if(this.animations.length>0){i.animations=[];for(let a=0;a<this.animations.length;a++){const l=this.animations[a];i.animations.push(s(t.animations,l))}}if(e){const a=o(t.geometries),l=o(t.materials),c=o(t.textures),h=o(t.images),u=o(t.shapes),d=o(t.skeletons),f=o(t.animations),m=o(t.nodes);a.length>0&&(n.geometries=a),l.length>0&&(n.materials=l),c.length>0&&(n.textures=c),h.length>0&&(n.images=h),u.length>0&&(n.shapes=u),d.length>0&&(n.skeletons=d),f.length>0&&(n.animations=f),m.length>0&&(n.nodes=m)}return n.object=i,n;function o(a){const l=[];for(const c in a){const h=a[c];delete h.metadata,l.push(h)}return l}}clone(t){return new this.constructor().copy(this,t)}copy(t,e=!0){if(this.name=t.name,this.up.copy(t.up),this.position.copy(t.position),this.rotation.order=t.rotation.order,this.quaternion.copy(t.quaternion),this.scale.copy(t.scale),this.pivot=t.pivot!==null?t.pivot.clone():null,this.matrix.copy(t.matrix),this.matrixWorld.copy(t.matrixWorld),this.matrixAutoUpdate=t.matrixAutoUpdate,this.matrixWorldAutoUpdate=t.matrixWorldAutoUpdate,this.matrixWorldNeedsUpdate=t.matrixWorldNeedsUpdate,this.layers.mask=t.layers.mask,this.visible=t.visible,this.castShadow=t.castShadow,this.receiveShadow=t.receiveShadow,this.frustumCulled=t.frustumCulled,this.renderOrder=t.renderOrder,this.static=t.static,this.animations=t.animations.slice(),this.userData=JSON.parse(JSON.stringify(t.userData)),e===!0)for(let n=0;n<t.children.length;n++){const i=t.children[n];this.add(i.clone())}return this}}Re.DEFAULT_UP=new P(0,1,0);Re.DEFAULT_MATRIX_AUTO_UPDATE=!0;Re.DEFAULT_MATRIX_WORLD_AUTO_UPDATE=!0;class _e extends Re{constructor(){super(),this.isGroup=!0,this.type="Group"}}const Vm={type:"move"};class La{constructor(){this._targetRay=null,this._grip=null,this._hand=null}getHandSpace(){return this._hand===null&&(this._hand=new _e,this._hand.matrixAutoUpdate=!1,this._hand.visible=!1,this._hand.joints={},this._hand.inputState={pinching:!1}),this._hand}getTargetRaySpace(){return this._targetRay===null&&(this._targetRay=new _e,this._targetRay.matrixAutoUpdate=!1,this._targetRay.visible=!1,this._targetRay.hasLinearVelocity=!1,this._targetRay.linearVelocity=new P,this._targetRay.hasAngularVelocity=!1,this._targetRay.angularVelocity=new P),this._targetRay}getGripSpace(){return this._grip===null&&(this._grip=new _e,this._grip.matrixAutoUpdate=!1,this._grip.visible=!1,this._grip.hasLinearVelocity=!1,this._grip.linearVelocity=new P,this._grip.hasAngularVelocity=!1,this._grip.angularVelocity=new P,this._grip.eventsEnabled=!1),this._grip}dispatchEvent(t){return this._targetRay!==null&&this._targetRay.dispatchEvent(t),this._grip!==null&&this._grip.dispatchEvent(t),this._hand!==null&&this._hand.dispatchEvent(t),this}connect(t){if(t&&t.hand){const e=this._hand;if(e)for(const n of t.hand.values())this._getHandJoint(e,n)}return this.dispatchEvent({type:"connected",data:t}),this}disconnect(t){return this.dispatchEvent({type:"disconnected",data:t}),this._targetRay!==null&&(this._targetRay.visible=!1),this._grip!==null&&(this._grip.visible=!1),this._hand!==null&&(this._hand.visible=!1),this}update(t,e,n){let i=null,s=null,o=null;const a=this._targetRay,l=this._grip,c=this._hand;if(t&&e.session.visibilityState!=="visible-blurred"){if(c&&t.hand){o=!0;for(const _ of t.hand.values()){const g=e.getJointPose(_,n),p=this._getHandJoint(c,_);g!==null&&(p.matrix.fromArray(g.transform.matrix),p.matrix.decompose(p.position,p.rotation,p.scale),p.matrixWorldNeedsUpdate=!0,p.jointRadius=g.radius),p.visible=g!==null}const h=c.joints["index-finger-tip"],u=c.joints["thumb-tip"],d=h.position.distanceTo(u.position),f=.02,m=.005;c.inputState.pinching&&d>f+m?(c.inputState.pinching=!1,this.dispatchEvent({type:"pinchend",handedness:t.handedness,target:this})):!c.inputState.pinching&&d<=f-m&&(c.inputState.pinching=!0,this.dispatchEvent({type:"pinchstart",handedness:t.handedness,target:this}))}else l!==null&&t.gripSpace&&(s=e.getPose(t.gripSpace,n),s!==null&&(l.matrix.fromArray(s.transform.matrix),l.matrix.decompose(l.position,l.rotation,l.scale),l.matrixWorldNeedsUpdate=!0,s.linearVelocity?(l.hasLinearVelocity=!0,l.linearVelocity.copy(s.linearVelocity)):l.hasLinearVelocity=!1,s.angularVelocity?(l.hasAngularVelocity=!0,l.angularVelocity.copy(s.angularVelocity)):l.hasAngularVelocity=!1,l.eventsEnabled&&l.dispatchEvent({type:"gripUpdated",data:t,target:this})));a!==null&&(i=e.getPose(t.targetRaySpace,n),i===null&&s!==null&&(i=s),i!==null&&(a.matrix.fromArray(i.transform.matrix),a.matrix.decompose(a.position,a.rotation,a.scale),a.matrixWorldNeedsUpdate=!0,i.linearVelocity?(a.hasLinearVelocity=!0,a.linearVelocity.copy(i.linearVelocity)):a.hasLinearVelocity=!1,i.angularVelocity?(a.hasAngularVelocity=!0,a.angularVelocity.copy(i.angularVelocity)):a.hasAngularVelocity=!1,this.dispatchEvent(Vm)))}return a!==null&&(a.visible=i!==null),l!==null&&(l.visible=s!==null),c!==null&&(c.visible=o!==null),this}_getHandJoint(t,e){if(t.joints[e.jointName]===void 0){const n=new _e;n.matrixAutoUpdate=!1,n.visible=!1,t.joints[e.jointName]=n,t.add(n)}return t.joints[e.jointName]}}const gf={aliceblue:15792383,antiquewhite:16444375,aqua:65535,aquamarine:8388564,azure:15794175,beige:16119260,bisque:16770244,black:0,blanchedalmond:16772045,blue:255,blueviolet:9055202,brown:10824234,burlywood:14596231,cadetblue:6266528,chartreuse:8388352,chocolate:13789470,coral:16744272,cornflowerblue:6591981,cornsilk:16775388,crimson:14423100,cyan:65535,darkblue:139,darkcyan:35723,darkgoldenrod:12092939,darkgray:11119017,darkgreen:25600,darkgrey:11119017,darkkhaki:12433259,darkmagenta:9109643,darkolivegreen:5597999,darkorange:16747520,darkorchid:10040012,darkred:9109504,darksalmon:15308410,darkseagreen:9419919,darkslateblue:4734347,darkslategray:3100495,darkslategrey:3100495,darkturquoise:52945,darkviolet:9699539,deeppink:16716947,deepskyblue:49151,dimgray:6908265,dimgrey:6908265,dodgerblue:2003199,firebrick:11674146,floralwhite:16775920,forestgreen:2263842,fuchsia:16711935,gainsboro:14474460,ghostwhite:16316671,gold:16766720,goldenrod:14329120,gray:8421504,green:32768,greenyellow:11403055,grey:8421504,honeydew:15794160,hotpink:16738740,indianred:13458524,indigo:4915330,ivory:16777200,khaki:15787660,lavender:15132410,lavenderblush:16773365,lawngreen:8190976,lemonchiffon:16775885,lightblue:11393254,lightcoral:15761536,lightcyan:14745599,lightgoldenrodyellow:16448210,lightgray:13882323,lightgreen:9498256,lightgrey:13882323,lightpink:16758465,lightsalmon:16752762,lightseagreen:2142890,lightskyblue:8900346,lightslategray:7833753,lightslategrey:7833753,lightsteelblue:11584734,lightyellow:16777184,lime:65280,limegreen:3329330,linen:16445670,magenta:16711935,maroon:8388608,mediumaquamarine:6737322,mediumblue:205,mediumorchid:12211667,mediumpurple:9662683,mediumseagreen:3978097,mediumslateblue:8087790,mediumspringgreen:64154,mediumturquoise:4772300,mediumvioletred:13047173,midnightblue:1644912,mintcream:16121850,mistyrose:16770273,moccasin:16770229,navajowhite:16768685,navy:128,oldlace:16643558,olive:8421376,olivedrab:7048739,orange:16753920,orangered:16729344,orchid:14315734,palegoldenrod:15657130,palegreen:10025880,paleturquoise:11529966,palevioletred:14381203,papayawhip:16773077,peachpuff:16767673,peru:13468991,pink:16761035,plum:14524637,powderblue:11591910,purple:8388736,rebeccapurple:6697881,red:16711680,rosybrown:12357519,royalblue:4286945,saddlebrown:9127187,salmon:16416882,sandybrown:16032864,seagreen:3050327,seashell:16774638,sienna:10506797,silver:12632256,skyblue:8900331,slateblue:6970061,slategray:7372944,slategrey:7372944,snow:16775930,springgreen:65407,steelblue:4620980,tan:13808780,teal:32896,thistle:14204888,tomato:16737095,turquoise:4251856,violet:15631086,wheat:16113331,white:16777215,whitesmoke:16119285,yellow:16776960,yellowgreen:10145074},Pi={h:0,s:0,l:0},ao={h:0,s:0,l:0};function Da(r,t,e){return e<0&&(e+=1),e>1&&(e-=1),e<1/6?r+(t-r)*6*e:e<1/2?t:e<2/3?r+(t-r)*6*(2/3-e):r}class Et{constructor(t,e,n){return this.isColor=!0,this.r=1,this.g=1,this.b=1,this.set(t,e,n)}set(t,e,n){if(e===void 0&&n===void 0){const i=t;i&&i.isColor?this.copy(i):typeof i=="number"?this.setHex(i):typeof i=="string"&&this.setStyle(i)}else this.setRGB(t,e,n);return this}setScalar(t){return this.r=t,this.g=t,this.b=t,this}setHex(t,e=Be){return t=Math.floor(t),this.r=(t>>16&255)/255,this.g=(t>>8&255)/255,this.b=(t&255)/255,Qt.colorSpaceToWorking(this,e),this}setRGB(t,e,n,i=Qt.workingColorSpace){return this.r=t,this.g=e,this.b=n,Qt.colorSpaceToWorking(this,i),this}setHSL(t,e,n,i=Qt.workingColorSpace){if(t=Hc(t,1),e=Kt(e,0,1),n=Kt(n,0,1),e===0)this.r=this.g=this.b=n;else{const s=n<=.5?n*(1+e):n+e-n*e,o=2*n-s;this.r=Da(o,s,t+1/3),this.g=Da(o,s,t),this.b=Da(o,s,t-1/3)}return Qt.colorSpaceToWorking(this,i),this}setStyle(t,e=Be){function n(s){s!==void 0&&parseFloat(s)<1&&wt("Color: Alpha component of "+t+" will be ignored.")}let i;if(i=/^(\w+)\(([^\)]*)\)/.exec(t)){let s;const o=i[1],a=i[2];switch(o){case"rgb":case"rgba":if(s=/^\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(a))return n(s[4]),this.setRGB(Math.min(255,parseInt(s[1],10))/255,Math.min(255,parseInt(s[2],10))/255,Math.min(255,parseInt(s[3],10))/255,e);if(s=/^\s*(\d+)\%\s*,\s*(\d+)\%\s*,\s*(\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(a))return n(s[4]),this.setRGB(Math.min(100,parseInt(s[1],10))/100,Math.min(100,parseInt(s[2],10))/100,Math.min(100,parseInt(s[3],10))/100,e);break;case"hsl":case"hsla":if(s=/^\s*(\d*\.?\d+)\s*,\s*(\d*\.?\d+)\%\s*,\s*(\d*\.?\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(a))return n(s[4]),this.setHSL(parseFloat(s[1])/360,parseFloat(s[2])/100,parseFloat(s[3])/100,e);break;default:wt("Color: Unknown color model "+t)}}else if(i=/^\#([A-Fa-f\d]+)$/.exec(t)){const s=i[1],o=s.length;if(o===3)return this.setRGB(parseInt(s.charAt(0),16)/15,parseInt(s.charAt(1),16)/15,parseInt(s.charAt(2),16)/15,e);if(o===6)return this.setHex(parseInt(s,16),e);wt("Color: Invalid hex color "+t)}else if(t&&t.length>0)return this.setColorName(t,e);return this}setColorName(t,e=Be){const n=gf[t.toLowerCase()];return n!==void 0?this.setHex(n,e):wt("Color: Unknown color "+t),this}clone(){return new this.constructor(this.r,this.g,this.b)}copy(t){return this.r=t.r,this.g=t.g,this.b=t.b,this}copySRGBToLinear(t){return this.r=Mi(t.r),this.g=Mi(t.g),this.b=Mi(t.b),this}copyLinearToSRGB(t){return this.r=Xs(t.r),this.g=Xs(t.g),this.b=Xs(t.b),this}convertSRGBToLinear(){return this.copySRGBToLinear(this),this}convertLinearToSRGB(){return this.copyLinearToSRGB(this),this}getHex(t=Be){return Qt.workingToColorSpace(sn.copy(this),t),Math.round(Kt(sn.r*255,0,255))*65536+Math.round(Kt(sn.g*255,0,255))*256+Math.round(Kt(sn.b*255,0,255))}getHexString(t=Be){return("000000"+this.getHex(t).toString(16)).slice(-6)}getHSL(t,e=Qt.workingColorSpace){Qt.workingToColorSpace(sn.copy(this),e);const n=sn.r,i=sn.g,s=sn.b,o=Math.max(n,i,s),a=Math.min(n,i,s);let l,c;const h=(a+o)/2;if(a===o)l=0,c=0;else{const u=o-a;switch(c=h<=.5?u/(o+a):u/(2-o-a),o){case n:l=(i-s)/u+(i<s?6:0);break;case i:l=(s-n)/u+2;break;case s:l=(n-i)/u+4;break}l/=6}return t.h=l,t.s=c,t.l=h,t}getRGB(t,e=Qt.workingColorSpace){return Qt.workingToColorSpace(sn.copy(this),e),t.r=sn.r,t.g=sn.g,t.b=sn.b,t}getStyle(t=Be){Qt.workingToColorSpace(sn.copy(this),t);const e=sn.r,n=sn.g,i=sn.b;return t!==Be?`color(${t} ${e.toFixed(3)} ${n.toFixed(3)} ${i.toFixed(3)})`:`rgb(${Math.round(e*255)},${Math.round(n*255)},${Math.round(i*255)})`}offsetHSL(t,e,n){return this.getHSL(Pi),this.setHSL(Pi.h+t,Pi.s+e,Pi.l+n)}add(t){return this.r+=t.r,this.g+=t.g,this.b+=t.b,this}addColors(t,e){return this.r=t.r+e.r,this.g=t.g+e.g,this.b=t.b+e.b,this}addScalar(t){return this.r+=t,this.g+=t,this.b+=t,this}sub(t){return this.r=Math.max(0,this.r-t.r),this.g=Math.max(0,this.g-t.g),this.b=Math.max(0,this.b-t.b),this}multiply(t){return this.r*=t.r,this.g*=t.g,this.b*=t.b,this}multiplyScalar(t){return this.r*=t,this.g*=t,this.b*=t,this}lerp(t,e){return this.r+=(t.r-this.r)*e,this.g+=(t.g-this.g)*e,this.b+=(t.b-this.b)*e,this}lerpColors(t,e,n){return this.r=t.r+(e.r-t.r)*n,this.g=t.g+(e.g-t.g)*n,this.b=t.b+(e.b-t.b)*n,this}lerpHSL(t,e){this.getHSL(Pi),t.getHSL(ao);const n=Dr(Pi.h,ao.h,e),i=Dr(Pi.s,ao.s,e),s=Dr(Pi.l,ao.l,e);return this.setHSL(n,i,s),this}setFromVector3(t){return this.r=t.x,this.g=t.y,this.b=t.z,this}applyMatrix3(t){const e=this.r,n=this.g,i=this.b,s=t.elements;return this.r=s[0]*e+s[3]*n+s[6]*i,this.g=s[1]*e+s[4]*n+s[7]*i,this.b=s[2]*e+s[5]*n+s[8]*i,this}equals(t){return t.r===this.r&&t.g===this.g&&t.b===this.b}fromArray(t,e=0){return this.r=t[e],this.g=t[e+1],this.b=t[e+2],this}toArray(t=[],e=0){return t[e]=this.r,t[e+1]=this.g,t[e+2]=this.b,t}fromBufferAttribute(t,e){return this.r=t.getX(e),this.g=t.getY(e),this.b=t.getZ(e),this}toJSON(){return this.getHex()}*[Symbol.iterator](){yield this.r,yield this.g,yield this.b}}const sn=new Et;Et.NAMES=gf;class Wc{constructor(t,e=1,n=1e3){this.isFog=!0,this.name="",this.color=new Et(t),this.near=e,this.far=n}clone(){return new Wc(this.color,this.near,this.far)}toJSON(){return{type:"Fog",name:this.name,color:this.color.getHex(),near:this.near,far:this.far}}}class _f extends Re{constructor(){super(),this.isScene=!0,this.type="Scene",this.background=null,this.environment=null,this.fog=null,this.backgroundBlurriness=0,this.backgroundIntensity=1,this.backgroundRotation=new Hi,this.environmentIntensity=1,this.environmentRotation=new Hi,this.overrideMaterial=null,typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}copy(t,e){return super.copy(t,e),t.background!==null&&(this.background=t.background.clone()),t.environment!==null&&(this.environment=t.environment.clone()),t.fog!==null&&(this.fog=t.fog.clone()),this.backgroundBlurriness=t.backgroundBlurriness,this.backgroundIntensity=t.backgroundIntensity,this.backgroundRotation.copy(t.backgroundRotation),this.environmentIntensity=t.environmentIntensity,this.environmentRotation.copy(t.environmentRotation),t.overrideMaterial!==null&&(this.overrideMaterial=t.overrideMaterial.clone()),this.matrixAutoUpdate=t.matrixAutoUpdate,this}toJSON(t){const e=super.toJSON(t);return this.fog!==null&&(e.object.fog=this.fog.toJSON()),this.backgroundBlurriness>0&&(e.object.backgroundBlurriness=this.backgroundBlurriness),this.backgroundIntensity!==1&&(e.object.backgroundIntensity=this.backgroundIntensity),e.object.backgroundRotation=this.backgroundRotation.toArray(),this.environmentIntensity!==1&&(e.object.environmentIntensity=this.environmentIntensity),e.object.environmentRotation=this.environmentRotation.toArray(),e}}const On=new P,di=new P,Na=new P,fi=new P,_s=new P,xs=new P,jh=new P,Ua=new P,Fa=new P,Oa=new P,ka=new be,Ba=new be,za=new be;class Ln{constructor(t=new P,e=new P,n=new P){this.a=t,this.b=e,this.c=n}static getNormal(t,e,n,i){i.subVectors(n,e),On.subVectors(t,e),i.cross(On);const s=i.lengthSq();return s>0?i.multiplyScalar(1/Math.sqrt(s)):i.set(0,0,0)}static getBarycoord(t,e,n,i,s){On.subVectors(i,e),di.subVectors(n,e),Na.subVectors(t,e);const o=On.dot(On),a=On.dot(di),l=On.dot(Na),c=di.dot(di),h=di.dot(Na),u=o*c-a*a;if(u===0)return s.set(0,0,0),null;const d=1/u,f=(c*l-a*h)*d,m=(o*h-a*l)*d;return s.set(1-f-m,m,f)}static containsPoint(t,e,n,i){return this.getBarycoord(t,e,n,i,fi)===null?!1:fi.x>=0&&fi.y>=0&&fi.x+fi.y<=1}static getInterpolation(t,e,n,i,s,o,a,l){return this.getBarycoord(t,e,n,i,fi)===null?(l.x=0,l.y=0,"z"in l&&(l.z=0),"w"in l&&(l.w=0),null):(l.setScalar(0),l.addScaledVector(s,fi.x),l.addScaledVector(o,fi.y),l.addScaledVector(a,fi.z),l)}static getInterpolatedAttribute(t,e,n,i,s,o){return ka.setScalar(0),Ba.setScalar(0),za.setScalar(0),ka.fromBufferAttribute(t,e),Ba.fromBufferAttribute(t,n),za.fromBufferAttribute(t,i),o.setScalar(0),o.addScaledVector(ka,s.x),o.addScaledVector(Ba,s.y),o.addScaledVector(za,s.z),o}static isFrontFacing(t,e,n,i){return On.subVectors(n,e),di.subVectors(t,e),On.cross(di).dot(i)<0}set(t,e,n){return this.a.copy(t),this.b.copy(e),this.c.copy(n),this}setFromPointsAndIndices(t,e,n,i){return this.a.copy(t[e]),this.b.copy(t[n]),this.c.copy(t[i]),this}setFromAttributeAndIndices(t,e,n,i){return this.a.fromBufferAttribute(t,e),this.b.fromBufferAttribute(t,n),this.c.fromBufferAttribute(t,i),this}clone(){return new this.constructor().copy(this)}copy(t){return this.a.copy(t.a),this.b.copy(t.b),this.c.copy(t.c),this}getArea(){return On.subVectors(this.c,this.b),di.subVectors(this.a,this.b),On.cross(di).length()*.5}getMidpoint(t){return t.addVectors(this.a,this.b).add(this.c).multiplyScalar(1/3)}getNormal(t){return Ln.getNormal(this.a,this.b,this.c,t)}getPlane(t){return t.setFromCoplanarPoints(this.a,this.b,this.c)}getBarycoord(t,e){return Ln.getBarycoord(t,this.a,this.b,this.c,e)}getInterpolation(t,e,n,i,s){return Ln.getInterpolation(t,this.a,this.b,this.c,e,n,i,s)}containsPoint(t){return Ln.containsPoint(t,this.a,this.b,this.c)}isFrontFacing(t){return Ln.isFrontFacing(this.a,this.b,this.c,t)}intersectsBox(t){return t.intersectsTriangle(this)}closestPointToPoint(t,e){const n=this.a,i=this.b,s=this.c;let o,a;_s.subVectors(i,n),xs.subVectors(s,n),Ua.subVectors(t,n);const l=_s.dot(Ua),c=xs.dot(Ua);if(l<=0&&c<=0)return e.copy(n);Fa.subVectors(t,i);const h=_s.dot(Fa),u=xs.dot(Fa);if(h>=0&&u<=h)return e.copy(i);const d=l*u-h*c;if(d<=0&&l>=0&&h<=0)return o=l/(l-h),e.copy(n).addScaledVector(_s,o);Oa.subVectors(t,s);const f=_s.dot(Oa),m=xs.dot(Oa);if(m>=0&&f<=m)return e.copy(s);const _=f*c-l*m;if(_<=0&&c>=0&&m<=0)return a=c/(c-m),e.copy(n).addScaledVector(xs,a);const g=h*m-f*u;if(g<=0&&u-h>=0&&f-m>=0)return jh.subVectors(s,i),a=(u-h)/(u-h+(f-m)),e.copy(i).addScaledVector(jh,a);const p=1/(g+_+d);return o=_*p,a=d*p,e.copy(n).addScaledVector(_s,o).addScaledVector(xs,a)}equals(t){return t.a.equals(this.a)&&t.b.equals(this.b)&&t.c.equals(this.c)}}class Pe{constructor(t=new P(1/0,1/0,1/0),e=new P(-1/0,-1/0,-1/0)){this.isBox3=!0,this.min=t,this.max=e}set(t,e){return this.min.copy(t),this.max.copy(e),this}setFromArray(t){this.makeEmpty();for(let e=0,n=t.length;e<n;e+=3)this.expandByPoint(kn.fromArray(t,e));return this}setFromBufferAttribute(t){this.makeEmpty();for(let e=0,n=t.count;e<n;e++)this.expandByPoint(kn.fromBufferAttribute(t,e));return this}setFromPoints(t){this.makeEmpty();for(let e=0,n=t.length;e<n;e++)this.expandByPoint(t[e]);return this}setFromCenterAndSize(t,e){const n=kn.copy(e).multiplyScalar(.5);return this.min.copy(t).sub(n),this.max.copy(t).add(n),this}setFromObject(t,e=!1){return this.makeEmpty(),this.expandByObject(t,e)}clone(){return new this.constructor().copy(this)}copy(t){return this.min.copy(t.min),this.max.copy(t.max),this}makeEmpty(){return this.min.x=this.min.y=this.min.z=1/0,this.max.x=this.max.y=this.max.z=-1/0,this}isEmpty(){return this.max.x<this.min.x||this.max.y<this.min.y||this.max.z<this.min.z}getCenter(t){return this.isEmpty()?t.set(0,0,0):t.addVectors(this.min,this.max).multiplyScalar(.5)}getSize(t){return this.isEmpty()?t.set(0,0,0):t.subVectors(this.max,this.min)}expandByPoint(t){return this.min.min(t),this.max.max(t),this}expandByVector(t){return this.min.sub(t),this.max.add(t),this}expandByScalar(t){return this.min.addScalar(-t),this.max.addScalar(t),this}expandByObject(t,e=!1){t.updateWorldMatrix(!1,!1);const n=t.geometry;if(n!==void 0){const s=n.getAttribute("position");if(e===!0&&s!==void 0&&t.isInstancedMesh!==!0)for(let o=0,a=s.count;o<a;o++)t.isMesh===!0?t.getVertexPosition(o,kn):kn.fromBufferAttribute(s,o),kn.applyMatrix4(t.matrixWorld),this.expandByPoint(kn);else t.boundingBox!==void 0?(t.boundingBox===null&&t.computeBoundingBox(),lo.copy(t.boundingBox)):(n.boundingBox===null&&n.computeBoundingBox(),lo.copy(n.boundingBox)),lo.applyMatrix4(t.matrixWorld),this.union(lo)}const i=t.children;for(let s=0,o=i.length;s<o;s++)this.expandByObject(i[s],e);return this}containsPoint(t){return t.x>=this.min.x&&t.x<=this.max.x&&t.y>=this.min.y&&t.y<=this.max.y&&t.z>=this.min.z&&t.z<=this.max.z}containsBox(t){return this.min.x<=t.min.x&&t.max.x<=this.max.x&&this.min.y<=t.min.y&&t.max.y<=this.max.y&&this.min.z<=t.min.z&&t.max.z<=this.max.z}getParameter(t,e){return e.set((t.x-this.min.x)/(this.max.x-this.min.x),(t.y-this.min.y)/(this.max.y-this.min.y),(t.z-this.min.z)/(this.max.z-this.min.z))}intersectsBox(t){return t.max.x>=this.min.x&&t.min.x<=this.max.x&&t.max.y>=this.min.y&&t.min.y<=this.max.y&&t.max.z>=this.min.z&&t.min.z<=this.max.z}intersectsSphere(t){return this.clampPoint(t.center,kn),kn.distanceToSquared(t.center)<=t.radius*t.radius}intersectsPlane(t){let e,n;return t.normal.x>0?(e=t.normal.x*this.min.x,n=t.normal.x*this.max.x):(e=t.normal.x*this.max.x,n=t.normal.x*this.min.x),t.normal.y>0?(e+=t.normal.y*this.min.y,n+=t.normal.y*this.max.y):(e+=t.normal.y*this.max.y,n+=t.normal.y*this.min.y),t.normal.z>0?(e+=t.normal.z*this.min.z,n+=t.normal.z*this.max.z):(e+=t.normal.z*this.max.z,n+=t.normal.z*this.min.z),e<=-t.constant&&n>=-t.constant}intersectsTriangle(t){if(this.isEmpty())return!1;this.getCenter(dr),co.subVectors(this.max,dr),vs.subVectors(t.a,dr),ys.subVectors(t.b,dr),Ms.subVectors(t.c,dr),Ii.subVectors(ys,vs),Li.subVectors(Ms,ys),$i.subVectors(vs,Ms);let e=[0,-Ii.z,Ii.y,0,-Li.z,Li.y,0,-$i.z,$i.y,Ii.z,0,-Ii.x,Li.z,0,-Li.x,$i.z,0,-$i.x,-Ii.y,Ii.x,0,-Li.y,Li.x,0,-$i.y,$i.x,0];return!Ha(e,vs,ys,Ms,co)||(e=[1,0,0,0,1,0,0,0,1],!Ha(e,vs,ys,Ms,co))?!1:(ho.crossVectors(Ii,Li),e=[ho.x,ho.y,ho.z],Ha(e,vs,ys,Ms,co))}clampPoint(t,e){return e.copy(t).clamp(this.min,this.max)}distanceToPoint(t){return this.clampPoint(t,kn).distanceTo(t)}getBoundingSphere(t){return this.isEmpty()?t.makeEmpty():(this.getCenter(t.center),t.radius=this.getSize(kn).length()*.5),t}intersect(t){return this.min.max(t.min),this.max.min(t.max),this.isEmpty()&&this.makeEmpty(),this}union(t){return this.min.min(t.min),this.max.max(t.max),this}applyMatrix4(t){return this.isEmpty()?this:(pi[0].set(this.min.x,this.min.y,this.min.z).applyMatrix4(t),pi[1].set(this.min.x,this.min.y,this.max.z).applyMatrix4(t),pi[2].set(this.min.x,this.max.y,this.min.z).applyMatrix4(t),pi[3].set(this.min.x,this.max.y,this.max.z).applyMatrix4(t),pi[4].set(this.max.x,this.min.y,this.min.z).applyMatrix4(t),pi[5].set(this.max.x,this.min.y,this.max.z).applyMatrix4(t),pi[6].set(this.max.x,this.max.y,this.min.z).applyMatrix4(t),pi[7].set(this.max.x,this.max.y,this.max.z).applyMatrix4(t),this.setFromPoints(pi),this)}translate(t){return this.min.add(t),this.max.add(t),this}equals(t){return t.min.equals(this.min)&&t.max.equals(this.max)}toJSON(){return{min:this.min.toArray(),max:this.max.toArray()}}fromJSON(t){return this.min.fromArray(t.min),this.max.fromArray(t.max),this}}const pi=[new P,new P,new P,new P,new P,new P,new P,new P],kn=new P,lo=new Pe,vs=new P,ys=new P,Ms=new P,Ii=new P,Li=new P,$i=new P,dr=new P,co=new P,ho=new P,Yi=new P;function Ha(r,t,e,n,i){for(let s=0,o=r.length-3;s<=o;s+=3){Yi.fromArray(r,s);const a=i.x*Math.abs(Yi.x)+i.y*Math.abs(Yi.y)+i.z*Math.abs(Yi.z),l=t.dot(Yi),c=e.dot(Yi),h=n.dot(Yi);if(Math.max(-Math.max(l,c,h),Math.min(l,c,h))>a)return!1}return!0}const Ve=new P,uo=new At;let Gm=0;class gn extends Ei{constructor(t,e,n=!1){if(super(),Array.isArray(t))throw new TypeError("THREE.BufferAttribute: array should be a Typed Array.");this.isBufferAttribute=!0,Object.defineProperty(this,"id",{value:Gm++}),this.name="",this.array=t,this.itemSize=e,this.count=t!==void 0?t.length/e:0,this.normalized=n,this.usage=uc,this.updateRanges=[],this.gpuType=Nn,this.version=0}onUploadCallback(){}set needsUpdate(t){t===!0&&this.version++}setUsage(t){return this.usage=t,this}addUpdateRange(t,e){this.updateRanges.push({start:t,count:e})}clearUpdateRanges(){this.updateRanges.length=0}copy(t){return this.name=t.name,this.array=new t.array.constructor(t.array),this.itemSize=t.itemSize,this.count=t.count,this.normalized=t.normalized,this.usage=t.usage,this.gpuType=t.gpuType,this}copyAt(t,e,n){t*=this.itemSize,n*=e.itemSize;for(let i=0,s=this.itemSize;i<s;i++)this.array[t+i]=e.array[n+i];return this}copyArray(t){return this.array.set(t),this}applyMatrix3(t){if(this.itemSize===2)for(let e=0,n=this.count;e<n;e++)uo.fromBufferAttribute(this,e),uo.applyMatrix3(t),this.setXY(e,uo.x,uo.y);else if(this.itemSize===3)for(let e=0,n=this.count;e<n;e++)Ve.fromBufferAttribute(this,e),Ve.applyMatrix3(t),this.setXYZ(e,Ve.x,Ve.y,Ve.z);return this}applyMatrix4(t){for(let e=0,n=this.count;e<n;e++)Ve.fromBufferAttribute(this,e),Ve.applyMatrix4(t),this.setXYZ(e,Ve.x,Ve.y,Ve.z);return this}applyNormalMatrix(t){for(let e=0,n=this.count;e<n;e++)Ve.fromBufferAttribute(this,e),Ve.applyNormalMatrix(t),this.setXYZ(e,Ve.x,Ve.y,Ve.z);return this}transformDirection(t){for(let e=0,n=this.count;e<n;e++)Ve.fromBufferAttribute(this,e),Ve.transformDirection(t),this.setXYZ(e,Ve.x,Ve.y,Ve.z);return this}set(t,e=0){return this.array.set(t,e),this}getComponent(t,e){let n=this.array[t*this.itemSize+e];return this.normalized&&(n=Bn(n,this.array)),n}setComponent(t,e,n){return this.normalized&&(n=ge(n,this.array)),this.array[t*this.itemSize+e]=n,this}getX(t){let e=this.array[t*this.itemSize];return this.normalized&&(e=Bn(e,this.array)),e}setX(t,e){return this.normalized&&(e=ge(e,this.array)),this.array[t*this.itemSize]=e,this}getY(t){let e=this.array[t*this.itemSize+1];return this.normalized&&(e=Bn(e,this.array)),e}setY(t,e){return this.normalized&&(e=ge(e,this.array)),this.array[t*this.itemSize+1]=e,this}getZ(t){let e=this.array[t*this.itemSize+2];return this.normalized&&(e=Bn(e,this.array)),e}setZ(t,e){return this.normalized&&(e=ge(e,this.array)),this.array[t*this.itemSize+2]=e,this}getW(t){let e=this.array[t*this.itemSize+3];return this.normalized&&(e=Bn(e,this.array)),e}setW(t,e){return this.normalized&&(e=ge(e,this.array)),this.array[t*this.itemSize+3]=e,this}setXY(t,e,n){return t*=this.itemSize,this.normalized&&(e=ge(e,this.array),n=ge(n,this.array)),this.array[t+0]=e,this.array[t+1]=n,this}setXYZ(t,e,n,i){return t*=this.itemSize,this.normalized&&(e=ge(e,this.array),n=ge(n,this.array),i=ge(i,this.array)),this.array[t+0]=e,this.array[t+1]=n,this.array[t+2]=i,this}setXYZW(t,e,n,i,s){return t*=this.itemSize,this.normalized&&(e=ge(e,this.array),n=ge(n,this.array),i=ge(i,this.array),s=ge(s,this.array)),this.array[t+0]=e,this.array[t+1]=n,this.array[t+2]=i,this.array[t+3]=s,this}onUpload(t){return this.onUploadCallback=t,this}clone(){return new this.constructor(this.array,this.itemSize).copy(this)}toJSON(){const t={itemSize:this.itemSize,type:this.array.constructor.name,array:Array.from(this.array),normalized:this.normalized};return this.name!==""&&(t.name=this.name),this.usage!==uc&&(t.usage=this.usage),t}dispose(){this.dispatchEvent({type:"dispose"})}}class xf extends gn{constructor(t,e,n){super(new Uint16Array(t),e,n)}}class vf extends gn{constructor(t,e,n){super(new Uint32Array(t),e,n)}}class he extends gn{constructor(t,e,n){super(new Float32Array(t),e,n)}}const Wm=new Pe,fr=new P,Va=new P;class li{constructor(t=new P,e=-1){this.isSphere=!0,this.center=t,this.radius=e}set(t,e){return this.center.copy(t),this.radius=e,this}setFromPoints(t,e){const n=this.center;e!==void 0?n.copy(e):Wm.setFromPoints(t).getCenter(n);let i=0;for(let s=0,o=t.length;s<o;s++)i=Math.max(i,n.distanceToSquared(t[s]));return this.radius=Math.sqrt(i),this}copy(t){return this.center.copy(t.center),this.radius=t.radius,this}isEmpty(){return this.radius<0}makeEmpty(){return this.center.set(0,0,0),this.radius=-1,this}containsPoint(t){return t.distanceToSquared(this.center)<=this.radius*this.radius}distanceToPoint(t){return t.distanceTo(this.center)-this.radius}intersectsSphere(t){const e=this.radius+t.radius;return t.center.distanceToSquared(this.center)<=e*e}intersectsBox(t){return t.intersectsSphere(this)}intersectsPlane(t){return Math.abs(t.distanceToPoint(this.center))<=this.radius}clampPoint(t,e){const n=this.center.distanceToSquared(t);return e.copy(t),n>this.radius*this.radius&&(e.sub(this.center).normalize(),e.multiplyScalar(this.radius).add(this.center)),e}getBoundingBox(t){return this.isEmpty()?(t.makeEmpty(),t):(t.set(this.center,this.center),t.expandByScalar(this.radius),t)}applyMatrix4(t){return this.center.applyMatrix4(t),this.radius=this.radius*t.getMaxScaleOnAxis(),this}translate(t){return this.center.add(t),this}expandByPoint(t){if(this.isEmpty())return this.center.copy(t),this.radius=0,this;fr.subVectors(t,this.center);const e=fr.lengthSq();if(e>this.radius*this.radius){const n=Math.sqrt(e),i=(n-this.radius)*.5;this.center.addScaledVector(fr,i/n),this.radius+=i}return this}union(t){return t.isEmpty()?this:this.isEmpty()?(this.copy(t),this):(this.center.equals(t.center)===!0?this.radius=Math.max(this.radius,t.radius):(Va.subVectors(t.center,this.center).setLength(t.radius),this.expandByPoint(fr.copy(t.center).add(Va)),this.expandByPoint(fr.copy(t.center).sub(Va))),this)}equals(t){return t.center.equals(this.center)&&t.radius===this.radius}clone(){return new this.constructor().copy(this)}toJSON(){return{radius:this.radius,center:this.center.toArray()}}fromJSON(t){return this.radius=t.radius,this.center.fromArray(t.center),this}}let Xm=0;const Cn=new Ht,Ga=new Re,bs=new P,Mn=new Pe,pr=new Pe,Ze=new P;class De extends Ei{constructor(){super(),this.isBufferGeometry=!0,Object.defineProperty(this,"id",{value:Xm++}),this.uuid=Hn(),this.name="",this.type="BufferGeometry",this.index=null,this.indirect=null,this.indirectOffset=0,this.attributes={},this.morphAttributes={},this.morphTargetsRelative=!1,this.groups=[],this.boundingBox=null,this.boundingSphere=null,this.drawRange={start:0,count:1/0},this.userData={},this._transformed=!1}getIndex(){return this.index}setIndex(t){return Array.isArray(t)?this.index=new(cm(t)?vf:xf)(t,1):this.index=t,this}setIndirect(t,e=0){return this.indirect=t,this.indirectOffset=e,this}getIndirect(){return this.indirect}getAttribute(t){return this.attributes[t]}setAttribute(t,e){return this.attributes[t]=e,this}deleteAttribute(t){return delete this.attributes[t],this}hasAttribute(t){return this.attributes[t]!==void 0}addGroup(t,e,n=0){this.groups.push({start:t,count:e,materialIndex:n})}clearGroups(){this.groups=[]}setDrawRange(t,e){this.drawRange.start=t,this.drawRange.count=e}applyMatrix4(t){const e=this.attributes.position;e!==void 0&&(e.applyMatrix4(t),e.needsUpdate=!0);const n=this.attributes.normal;if(n!==void 0){const s=new Vt().getNormalMatrix(t);n.applyNormalMatrix(s),n.needsUpdate=!0}const i=this.attributes.tangent;return i!==void 0&&(i.transformDirection(t),i.needsUpdate=!0),this.boundingBox!==null&&this.computeBoundingBox(),this.boundingSphere!==null&&this.computeBoundingSphere(),this._transformed=!0,this}applyQuaternion(t){return Cn.makeRotationFromQuaternion(t),this.applyMatrix4(Cn),this}rotateX(t){return Cn.makeRotationX(t),this.applyMatrix4(Cn),this}rotateY(t){return Cn.makeRotationY(t),this.applyMatrix4(Cn),this}rotateZ(t){return Cn.makeRotationZ(t),this.applyMatrix4(Cn),this}translate(t,e,n){return Cn.makeTranslation(t,e,n),this.applyMatrix4(Cn),this}scale(t,e,n){return Cn.makeScale(t,e,n),this.applyMatrix4(Cn),this}lookAt(t){return Ga.lookAt(t),Ga.updateMatrix(),this.applyMatrix4(Ga.matrix),this}center(){return this.computeBoundingBox(),this.boundingBox.getCenter(bs).negate(),this.translate(bs.x,bs.y,bs.z),this}setFromPoints(t){const e=this.getAttribute("position");if(e===void 0){const n=[];for(let i=0,s=t.length;i<s;i++){const o=t[i];n.push(o.x,o.y,o.z||0)}this.setAttribute("position",new he(n,3))}else{const n=Math.min(t.length,e.count);for(let i=0;i<n;i++){const s=t[i];e.setXYZ(i,s.x,s.y,s.z||0)}t.length>e.count&&wt("BufferGeometry: Buffer size too small for points data. Use .dispose() and create a new geometry."),e.needsUpdate=!0}return this}computeBoundingBox(){this.boundingBox===null&&(this.boundingBox=new Pe);const t=this.attributes.position,e=this.morphAttributes.position;if(t&&t.isGLBufferAttribute){Ot("BufferGeometry.computeBoundingBox(): GLBufferAttribute requires a manual bounding box.",this),this.boundingBox.set(new P(-1/0,-1/0,-1/0),new P(1/0,1/0,1/0));return}if(t!==void 0){if(this.boundingBox.setFromBufferAttribute(t),e)for(let n=0,i=e.length;n<i;n++){const s=e[n];Mn.setFromBufferAttribute(s),this.morphTargetsRelative?(Ze.addVectors(this.boundingBox.min,Mn.min),this.boundingBox.expandByPoint(Ze),Ze.addVectors(this.boundingBox.max,Mn.max),this.boundingBox.expandByPoint(Ze)):(this.boundingBox.expandByPoint(Mn.min),this.boundingBox.expandByPoint(Mn.max))}}else this.boundingBox.makeEmpty();(isNaN(this.boundingBox.min.x)||isNaN(this.boundingBox.min.y)||isNaN(this.boundingBox.min.z))&&Ot('BufferGeometry.computeBoundingBox(): Computed min/max have NaN values. The "position" attribute is likely to have NaN values.',this)}computeBoundingSphere(){this.boundingSphere===null&&(this.boundingSphere=new li);const t=this.attributes.position,e=this.morphAttributes.position;if(t&&t.isGLBufferAttribute){Ot("BufferGeometry.computeBoundingSphere(): GLBufferAttribute requires a manual bounding sphere.",this),this.boundingSphere.set(new P,1/0);return}if(t){const n=this.boundingSphere.center;if(Mn.setFromBufferAttribute(t),e)for(let s=0,o=e.length;s<o;s++){const a=e[s];pr.setFromBufferAttribute(a),this.morphTargetsRelative?(Ze.addVectors(Mn.min,pr.min),Mn.expandByPoint(Ze),Ze.addVectors(Mn.max,pr.max),Mn.expandByPoint(Ze)):(Mn.expandByPoint(pr.min),Mn.expandByPoint(pr.max))}Mn.getCenter(n);let i=0;for(let s=0,o=t.count;s<o;s++)Ze.fromBufferAttribute(t,s),i=Math.max(i,n.distanceToSquared(Ze));if(e)for(let s=0,o=e.length;s<o;s++){const a=e[s],l=this.morphTargetsRelative;for(let c=0,h=a.count;c<h;c++)Ze.fromBufferAttribute(a,c),l&&(bs.fromBufferAttribute(t,c),Ze.add(bs)),i=Math.max(i,n.distanceToSquared(Ze))}this.boundingSphere.radius=Math.sqrt(i),isNaN(this.boundingSphere.radius)&&Ot('BufferGeometry.computeBoundingSphere(): Computed radius is NaN. The "position" attribute is likely to have NaN values.',this)}}computeTangents(){const t=this.index,e=this.attributes;if(t===null||e.position===void 0||e.normal===void 0||e.uv===void 0){Ot("BufferGeometry: .computeTangents() failed. Missing required attributes (index, position, normal or uv)");return}const n=e.position,i=e.normal,s=e.uv;let o=this.getAttribute("tangent");(o===void 0||o.count!==n.count)&&(o=new gn(new Float32Array(4*n.count),4),this.setAttribute("tangent",o));const a=[],l=[];for(let v=0;v<n.count;v++)a[v]=new P,l[v]=new P;const c=new P,h=new P,u=new P,d=new At,f=new At,m=new At,_=new P,g=new P;function p(v,T,I){c.fromBufferAttribute(n,v),h.fromBufferAttribute(n,T),u.fromBufferAttribute(n,I),d.fromBufferAttribute(s,v),f.fromBufferAttribute(s,T),m.fromBufferAttribute(s,I),h.sub(c),u.sub(c),f.sub(d),m.sub(d);const L=1/(f.x*m.y-m.x*f.y);isFinite(L)&&(_.copy(h).multiplyScalar(m.y).addScaledVector(u,-f.y).multiplyScalar(L),g.copy(u).multiplyScalar(f.x).addScaledVector(h,-m.x).multiplyScalar(L),a[v].add(_),a[T].add(_),a[I].add(_),l[v].add(g),l[T].add(g),l[I].add(g))}let b=this.groups;b.length===0&&(b=[{start:0,count:t.count}]);for(let v=0,T=b.length;v<T;++v){const I=b[v],L=I.start,U=I.count;for(let W=L,K=L+U;W<K;W+=3)p(t.getX(W+0),t.getX(W+1),t.getX(W+2))}const E=new P,y=new P,S=new P,w=new P;function A(v){S.fromBufferAttribute(i,v),w.copy(S);const T=a[v];E.copy(T),E.sub(S.multiplyScalar(S.dot(T))).normalize(),y.crossVectors(w,T);const L=y.dot(l[v])<0?-1:1;o.setXYZW(v,E.x,E.y,E.z,L)}for(let v=0,T=b.length;v<T;++v){const I=b[v],L=I.start,U=I.count;for(let W=L,K=L+U;W<K;W+=3)A(t.getX(W+0)),A(t.getX(W+1)),A(t.getX(W+2))}this._transformed=!0}computeVertexNormals(){const t=this.index,e=this.getAttribute("position");if(e!==void 0){let n=this.getAttribute("normal");if(n===void 0||n.count!==e.count)n=new gn(new Float32Array(e.count*3),3),this.setAttribute("normal",n);else for(let d=0,f=n.count;d<f;d++)n.setXYZ(d,0,0,0);const i=new P,s=new P,o=new P,a=new P,l=new P,c=new P,h=new P,u=new P;if(t)for(let d=0,f=t.count;d<f;d+=3){const m=t.getX(d+0),_=t.getX(d+1),g=t.getX(d+2);i.fromBufferAttribute(e,m),s.fromBufferAttribute(e,_),o.fromBufferAttribute(e,g),h.subVectors(o,s),u.subVectors(i,s),h.cross(u),a.fromBufferAttribute(n,m),l.fromBufferAttribute(n,_),c.fromBufferAttribute(n,g),a.add(h),l.add(h),c.add(h),n.setXYZ(m,a.x,a.y,a.z),n.setXYZ(_,l.x,l.y,l.z),n.setXYZ(g,c.x,c.y,c.z)}else for(let d=0,f=e.count;d<f;d+=3)i.fromBufferAttribute(e,d+0),s.fromBufferAttribute(e,d+1),o.fromBufferAttribute(e,d+2),h.subVectors(o,s),u.subVectors(i,s),h.cross(u),n.setXYZ(d+0,h.x,h.y,h.z),n.setXYZ(d+1,h.x,h.y,h.z),n.setXYZ(d+2,h.x,h.y,h.z);this.normalizeNormals(),n.needsUpdate=!0}}normalizeNormals(){const t=this.attributes.normal;for(let e=0,n=t.count;e<n;e++)Ze.fromBufferAttribute(t,e),Ze.normalize(),t.setXYZ(e,Ze.x,Ze.y,Ze.z)}toNonIndexed(){function t(a,l){const c=a.array,h=a.itemSize,u=a.normalized,d=new c.constructor(l.length*h);let f=0,m=0;for(let _=0,g=l.length;_<g;_++){a.isInterleavedBufferAttribute?f=l[_]*a.data.stride+a.offset:f=l[_]*h;for(let p=0;p<h;p++)d[m++]=c[f++]}return new gn(d,h,u)}if(this.index===null)return wt("BufferGeometry.toNonIndexed(): BufferGeometry is already non-indexed."),this;const e=new De,n=this.index.array,i=this.attributes;for(const a in i){const l=i[a],c=t(l,n);e.setAttribute(a,c)}const s=this.morphAttributes;for(const a in s){const l=[],c=s[a];for(let h=0,u=c.length;h<u;h++){const d=c[h],f=t(d,n);l.push(f)}e.morphAttributes[a]=l}e.morphTargetsRelative=this.morphTargetsRelative;const o=this.groups;for(let a=0,l=o.length;a<l;a++){const c=o[a];e.addGroup(c.start,c.count,c.materialIndex)}return e}toJSON(){const t={metadata:{version:4.7,type:"BufferGeometry",generator:"BufferGeometry.toJSON"}};if(t.uuid=this.uuid,t.type=this.parameters!==void 0&&this._transformed===!0?"BufferGeometry":this.type,this.name!==""&&(t.name=this.name),Object.keys(this.userData).length>0&&(t.userData=this.userData),this.parameters!==void 0&&this._transformed!==!0){const l=this.parameters;for(const c in l)l[c]!==void 0&&(t[c]=l[c]);return t}t.data={attributes:{}};const e=this.index;e!==null&&(t.data.index={type:e.array.constructor.name,array:Array.prototype.slice.call(e.array)});const n=this.attributes;for(const l in n){const c=n[l];t.data.attributes[l]=c.toJSON(t.data)}const i={};let s=!1;for(const l in this.morphAttributes){const c=this.morphAttributes[l],h=[];for(let u=0,d=c.length;u<d;u++){const f=c[u];h.push(f.toJSON(t.data))}h.length>0&&(i[l]=h,s=!0)}s&&(t.data.morphAttributes=i,t.data.morphTargetsRelative=this.morphTargetsRelative);const o=this.groups;o.length>0&&(t.data.groups=JSON.parse(JSON.stringify(o)));const a=this.boundingSphere;return a!==null&&(t.data.boundingSphere=a.toJSON()),t}clone(){return new this.constructor().copy(this)}copy(t){this.index=null,this.attributes={},this.morphAttributes={},this.groups=[],this.boundingBox=null,this.boundingSphere=null;const e={};this.name=t.name;const n=t.index;n!==null&&this.setIndex(n.clone());const i=t.attributes;for(const c in i){const h=i[c];this.setAttribute(c,h.clone(e))}const s=t.morphAttributes;for(const c in s){const h=[],u=s[c];for(let d=0,f=u.length;d<f;d++)h.push(u[d].clone(e));this.morphAttributes[c]=h}this.morphTargetsRelative=t.morphTargetsRelative;const o=t.groups;for(let c=0,h=o.length;c<h;c++){const u=o[c];this.addGroup(u.start,u.count,u.materialIndex)}const a=t.boundingBox;a!==null&&(this.boundingBox=a.clone());const l=t.boundingSphere;return l!==null&&(this.boundingSphere=l.clone()),this.drawRange.start=t.drawRange.start,this.drawRange.count=t.drawRange.count,this.userData=t.userData,this._transformed=t._transformed,this}dispose(){this.dispatchEvent({type:"dispose"})}}class yf{constructor(t,e){this.isInterleavedBuffer=!0,this.array=t,this.stride=e,this.count=t!==void 0?t.length/e:0,this.usage=uc,this.updateRanges=[],this.version=0,this.uuid=Hn()}onUploadCallback(){}set needsUpdate(t){t===!0&&this.version++}setUsage(t){return this.usage=t,this}addUpdateRange(t,e){this.updateRanges.push({start:t,count:e})}clearUpdateRanges(){this.updateRanges.length=0}copy(t){return this.array=new t.array.constructor(t.array),this.count=t.count,this.stride=t.stride,this.usage=t.usage,this}copyAt(t,e,n){t*=this.stride,n*=e.stride;for(let i=0,s=this.stride;i<s;i++)this.array[t+i]=e.array[n+i];return this}set(t,e=0){return this.array.set(t,e),this}clone(t){t.arrayBuffers===void 0&&(t.arrayBuffers={}),this.array.buffer._uuid===void 0&&(this.array.buffer._uuid=Hn()),t.arrayBuffers[this.array.buffer._uuid]===void 0&&(t.arrayBuffers[this.array.buffer._uuid]=this.array.slice(0).buffer);const e=new this.array.constructor(t.arrayBuffers[this.array.buffer._uuid]),n=new this.constructor(e,this.stride);return n.setUsage(this.usage),n}onUpload(t){return this.onUploadCallback=t,this}toJSON(t){return t.arrayBuffers===void 0&&(t.arrayBuffers={}),this.array.buffer._uuid===void 0&&(this.array.buffer._uuid=Hn()),t.arrayBuffers[this.array.buffer._uuid]===void 0&&(t.arrayBuffers[this.array.buffer._uuid]=Array.from(new Uint32Array(this.array.buffer))),{uuid:this.uuid,buffer:this.array.buffer._uuid,type:this.array.constructor.name,stride:this.stride}}}const un=new P;class Xr{constructor(t,e,n,i=!1){this.isInterleavedBufferAttribute=!0,this.name="",this.data=t,this.itemSize=e,this.offset=n,this.normalized=i}get count(){return this.data.count}get array(){return this.data.array}set needsUpdate(t){this.data.needsUpdate=t}applyMatrix4(t){for(let e=0,n=this.data.count;e<n;e++)un.fromBufferAttribute(this,e),un.applyMatrix4(t),this.setXYZ(e,un.x,un.y,un.z);return this}applyNormalMatrix(t){for(let e=0,n=this.count;e<n;e++)un.fromBufferAttribute(this,e),un.applyNormalMatrix(t),this.setXYZ(e,un.x,un.y,un.z);return this}transformDirection(t){for(let e=0,n=this.count;e<n;e++)un.fromBufferAttribute(this,e),un.transformDirection(t),this.setXYZ(e,un.x,un.y,un.z);return this}getComponent(t,e){let n=this.array[t*this.data.stride+this.offset+e];return this.normalized&&(n=Bn(n,this.array)),n}setComponent(t,e,n){return this.normalized&&(n=ge(n,this.array)),this.data.array[t*this.data.stride+this.offset+e]=n,this}setX(t,e){return this.normalized&&(e=ge(e,this.array)),this.data.array[t*this.data.stride+this.offset]=e,this}setY(t,e){return this.normalized&&(e=ge(e,this.array)),this.data.array[t*this.data.stride+this.offset+1]=e,this}setZ(t,e){return this.normalized&&(e=ge(e,this.array)),this.data.array[t*this.data.stride+this.offset+2]=e,this}setW(t,e){return this.normalized&&(e=ge(e,this.array)),this.data.array[t*this.data.stride+this.offset+3]=e,this}getX(t){let e=this.data.array[t*this.data.stride+this.offset];return this.normalized&&(e=Bn(e,this.array)),e}getY(t){let e=this.data.array[t*this.data.stride+this.offset+1];return this.normalized&&(e=Bn(e,this.array)),e}getZ(t){let e=this.data.array[t*this.data.stride+this.offset+2];return this.normalized&&(e=Bn(e,this.array)),e}getW(t){let e=this.data.array[t*this.data.stride+this.offset+3];return this.normalized&&(e=Bn(e,this.array)),e}setXY(t,e,n){return t=t*this.data.stride+this.offset,this.normalized&&(e=ge(e,this.array),n=ge(n,this.array)),this.data.array[t+0]=e,this.data.array[t+1]=n,this}setXYZ(t,e,n,i){return t=t*this.data.stride+this.offset,this.normalized&&(e=ge(e,this.array),n=ge(n,this.array),i=ge(i,this.array)),this.data.array[t+0]=e,this.data.array[t+1]=n,this.data.array[t+2]=i,this}setXYZW(t,e,n,i,s){return t=t*this.data.stride+this.offset,this.normalized&&(e=ge(e,this.array),n=ge(n,this.array),i=ge(i,this.array),s=ge(s,this.array)),this.data.array[t+0]=e,this.data.array[t+1]=n,this.data.array[t+2]=i,this.data.array[t+3]=s,this}clone(t){if(t===void 0){Qo("InterleavedBufferAttribute.clone(): Cloning an interleaved buffer attribute will de-interleave buffer data.");const e=[];for(let n=0;n<this.count;n++){const i=n*this.data.stride+this.offset;for(let s=0;s<this.itemSize;s++)e.push(this.data.array[i+s])}return new gn(new this.array.constructor(e),this.itemSize,this.normalized)}else return t.interleavedBuffers===void 0&&(t.interleavedBuffers={}),t.interleavedBuffers[this.data.uuid]===void 0&&(t.interleavedBuffers[this.data.uuid]=this.data.clone(t)),new Xr(t.interleavedBuffers[this.data.uuid],this.itemSize,this.offset,this.normalized)}toJSON(t){if(t===void 0){Qo("InterleavedBufferAttribute.toJSON(): Serializing an interleaved buffer attribute will de-interleave buffer data.");const e=[];for(let n=0;n<this.count;n++){const i=n*this.data.stride+this.offset;for(let s=0;s<this.itemSize;s++)e.push(this.data.array[i+s])}return{itemSize:this.itemSize,type:this.array.constructor.name,array:e,normalized:this.normalized}}else return t.interleavedBuffers===void 0&&(t.interleavedBuffers={}),t.interleavedBuffers[this.data.uuid]===void 0&&(t.interleavedBuffers[this.data.uuid]=this.data.toJSON(t)),{isInterleavedBufferAttribute:!0,itemSize:this.itemSize,data:this.data.uuid,offset:this.offset,normalized:this.normalized}}}let qm=0;class Vn extends Ei{constructor(){super(),this.isMaterial=!0,Object.defineProperty(this,"id",{value:qm++}),this.uuid=Hn(),this.name="",this.type="Material",this.blending=Gs,this.side=bi,this.vertexColors=!1,this.opacity=1,this.transparent=!1,this.alphaHash=!1,this.blendSrc=wl,this.blendDst=El,this.blendEquation=Qi,this.blendSrcAlpha=null,this.blendDstAlpha=null,this.blendEquationAlpha=null,this.blendColor=new Et(0,0,0),this.blendAlpha=0,this.depthFunc=js,this.depthTest=!0,this.depthWrite=!0,this.stencilWriteMask=255,this.stencilFunc=Oh,this.stencilRef=0,this.stencilFuncMask=255,this.stencilFail=ds,this.stencilZFail=ds,this.stencilZPass=ds,this.stencilWrite=!1,this.clippingPlanes=null,this.clipIntersection=!1,this.clipShadows=!1,this.shadowSide=null,this.colorWrite=!0,this.precision=null,this.polygonOffset=!1,this.polygonOffsetFactor=0,this.polygonOffsetUnits=0,this.dithering=!1,this.alphaToCoverage=!1,this.premultipliedAlpha=!1,this.forceSinglePass=!1,this.allowOverride=!0,this.visible=!0,this.toneMapped=!0,this.userData={},this.version=0,this._alphaTest=0}get alphaTest(){return this._alphaTest}set alphaTest(t){this._alphaTest>0!=t>0&&this.version++,this._alphaTest=t}onBeforeRender(){}onBeforeCompile(){}customProgramCacheKey(){return this.onBeforeCompile.toString()}setValues(t){if(t!==void 0)for(const e in t){const n=t[e];if(n===void 0){wt(`Material: parameter '${e}' has value of undefined.`);continue}const i=this[e];if(i===void 0){wt(`Material: '${e}' is not a property of THREE.${this.type}.`);continue}i&&i.isColor?i.set(n):i&&i.isVector2&&n&&n.isVector2||i&&i.isEuler&&n&&n.isEuler||i&&i.isVector3&&n&&n.isVector3?i.copy(n):this[e]=n}}toJSON(t){const e=t===void 0||typeof t=="string";e&&(t={textures:{},images:{}});const n={metadata:{version:4.7,type:"Material",generator:"Material.toJSON"}};n.uuid=this.uuid,n.type=this.type,this.name!==""&&(n.name=this.name),this.color&&this.color.isColor&&(n.color=this.color.getHex()),this.roughness!==void 0&&(n.roughness=this.roughness),this.metalness!==void 0&&(n.metalness=this.metalness),this.sheen!==void 0&&(n.sheen=this.sheen),this.sheenColor&&this.sheenColor.isColor&&(n.sheenColor=this.sheenColor.getHex()),this.sheenRoughness!==void 0&&(n.sheenRoughness=this.sheenRoughness),this.emissive&&this.emissive.isColor&&(n.emissive=this.emissive.getHex()),this.emissiveIntensity!==void 0&&this.emissiveIntensity!==1&&(n.emissiveIntensity=this.emissiveIntensity),this.specular&&this.specular.isColor&&(n.specular=this.specular.getHex()),this.specularIntensity!==void 0&&(n.specularIntensity=this.specularIntensity),this.specularColor&&this.specularColor.isColor&&(n.specularColor=this.specularColor.getHex()),this.shininess!==void 0&&(n.shininess=this.shininess),this.clearcoat!==void 0&&(n.clearcoat=this.clearcoat),this.clearcoatRoughness!==void 0&&(n.clearcoatRoughness=this.clearcoatRoughness),this.clearcoatMap&&this.clearcoatMap.isTexture&&(n.clearcoatMap=this.clearcoatMap.toJSON(t).uuid),this.clearcoatRoughnessMap&&this.clearcoatRoughnessMap.isTexture&&(n.clearcoatRoughnessMap=this.clearcoatRoughnessMap.toJSON(t).uuid),this.clearcoatNormalMap&&this.clearcoatNormalMap.isTexture&&(n.clearcoatNormalMap=this.clearcoatNormalMap.toJSON(t).uuid,n.clearcoatNormalScale=this.clearcoatNormalScale.toArray()),this.sheenColorMap&&this.sheenColorMap.isTexture&&(n.sheenColorMap=this.sheenColorMap.toJSON(t).uuid),this.sheenRoughnessMap&&this.sheenRoughnessMap.isTexture&&(n.sheenRoughnessMap=this.sheenRoughnessMap.toJSON(t).uuid),this.dispersion!==void 0&&(n.dispersion=this.dispersion),this.iridescence!==void 0&&(n.iridescence=this.iridescence),this.iridescenceIOR!==void 0&&(n.iridescenceIOR=this.iridescenceIOR),this.iridescenceThicknessRange!==void 0&&(n.iridescenceThicknessRange=this.iridescenceThicknessRange),this.iridescenceMap&&this.iridescenceMap.isTexture&&(n.iridescenceMap=this.iridescenceMap.toJSON(t).uuid),this.iridescenceThicknessMap&&this.iridescenceThicknessMap.isTexture&&(n.iridescenceThicknessMap=this.iridescenceThicknessMap.toJSON(t).uuid),this.anisotropy!==void 0&&(n.anisotropy=this.anisotropy),this.anisotropyRotation!==void 0&&(n.anisotropyRotation=this.anisotropyRotation),this.anisotropyMap&&this.anisotropyMap.isTexture&&(n.anisotropyMap=this.anisotropyMap.toJSON(t).uuid),this.map&&this.map.isTexture&&(n.map=this.map.toJSON(t).uuid),this.matcap&&this.matcap.isTexture&&(n.matcap=this.matcap.toJSON(t).uuid),this.alphaMap&&this.alphaMap.isTexture&&(n.alphaMap=this.alphaMap.toJSON(t).uuid),this.lightMap&&this.lightMap.isTexture&&(n.lightMap=this.lightMap.toJSON(t).uuid,n.lightMapIntensity=this.lightMapIntensity),this.aoMap&&this.aoMap.isTexture&&(n.aoMap=this.aoMap.toJSON(t).uuid,n.aoMapIntensity=this.aoMapIntensity),this.bumpMap&&this.bumpMap.isTexture&&(n.bumpMap=this.bumpMap.toJSON(t).uuid,n.bumpScale=this.bumpScale),this.normalMap&&this.normalMap.isTexture&&(n.normalMap=this.normalMap.toJSON(t).uuid,n.normalMapType=this.normalMapType,n.normalScale=this.normalScale.toArray()),this.displacementMap&&this.displacementMap.isTexture&&(n.displacementMap=this.displacementMap.toJSON(t).uuid,n.displacementScale=this.displacementScale,n.displacementBias=this.displacementBias),this.roughnessMap&&this.roughnessMap.isTexture&&(n.roughnessMap=this.roughnessMap.toJSON(t).uuid),this.metalnessMap&&this.metalnessMap.isTexture&&(n.metalnessMap=this.metalnessMap.toJSON(t).uuid),this.emissiveMap&&this.emissiveMap.isTexture&&(n.emissiveMap=this.emissiveMap.toJSON(t).uuid),this.specularMap&&this.specularMap.isTexture&&(n.specularMap=this.specularMap.toJSON(t).uuid),this.specularIntensityMap&&this.specularIntensityMap.isTexture&&(n.specularIntensityMap=this.specularIntensityMap.toJSON(t).uuid),this.specularColorMap&&this.specularColorMap.isTexture&&(n.specularColorMap=this.specularColorMap.toJSON(t).uuid),this.envMap&&this.envMap.isTexture&&(n.envMap=this.envMap.toJSON(t).uuid,this.combine!==void 0&&(n.combine=this.combine)),this.envMapRotation!==void 0&&(n.envMapRotation=this.envMapRotation.toArray()),this.envMapIntensity!==void 0&&(n.envMapIntensity=this.envMapIntensity),this.reflectivity!==void 0&&(n.reflectivity=this.reflectivity),this.refractionRatio!==void 0&&(n.refractionRatio=this.refractionRatio),this.gradientMap&&this.gradientMap.isTexture&&(n.gradientMap=this.gradientMap.toJSON(t).uuid),this.transmission!==void 0&&(n.transmission=this.transmission),this.transmissionMap&&this.transmissionMap.isTexture&&(n.transmissionMap=this.transmissionMap.toJSON(t).uuid),this.thickness!==void 0&&(n.thickness=this.thickness),this.thicknessMap&&this.thicknessMap.isTexture&&(n.thicknessMap=this.thicknessMap.toJSON(t).uuid),this.attenuationDistance!==void 0&&this.attenuationDistance!==1/0&&(n.attenuationDistance=this.attenuationDistance),this.attenuationColor!==void 0&&(n.attenuationColor=this.attenuationColor.getHex()),this.size!==void 0&&(n.size=this.size),this.shadowSide!==null&&(n.shadowSide=this.shadowSide),this.sizeAttenuation!==void 0&&(n.sizeAttenuation=this.sizeAttenuation),this.blending!==Gs&&(n.blending=this.blending),this.side!==bi&&(n.side=this.side),this.vertexColors===!0&&(n.vertexColors=!0),this.opacity<1&&(n.opacity=this.opacity),this.transparent===!0&&(n.transparent=!0),this.blendSrc!==wl&&(n.blendSrc=this.blendSrc),this.blendDst!==El&&(n.blendDst=this.blendDst),this.blendEquation!==Qi&&(n.blendEquation=this.blendEquation),this.blendSrcAlpha!==null&&(n.blendSrcAlpha=this.blendSrcAlpha),this.blendDstAlpha!==null&&(n.blendDstAlpha=this.blendDstAlpha),this.blendEquationAlpha!==null&&(n.blendEquationAlpha=this.blendEquationAlpha),this.blendColor&&this.blendColor.isColor&&(n.blendColor=this.blendColor.getHex()),this.blendAlpha!==0&&(n.blendAlpha=this.blendAlpha),this.depthFunc!==js&&(n.depthFunc=this.depthFunc),this.depthTest===!1&&(n.depthTest=this.depthTest),this.depthWrite===!1&&(n.depthWrite=this.depthWrite),this.colorWrite===!1&&(n.colorWrite=this.colorWrite),this.stencilWriteMask!==255&&(n.stencilWriteMask=this.stencilWriteMask),this.stencilFunc!==Oh&&(n.stencilFunc=this.stencilFunc),this.stencilRef!==0&&(n.stencilRef=this.stencilRef),this.stencilFuncMask!==255&&(n.stencilFuncMask=this.stencilFuncMask),this.stencilFail!==ds&&(n.stencilFail=this.stencilFail),this.stencilZFail!==ds&&(n.stencilZFail=this.stencilZFail),this.stencilZPass!==ds&&(n.stencilZPass=this.stencilZPass),this.stencilWrite===!0&&(n.stencilWrite=this.stencilWrite),this.rotation!==void 0&&this.rotation!==0&&(n.rotation=this.rotation),this.polygonOffset===!0&&(n.polygonOffset=!0),this.polygonOffsetFactor!==0&&(n.polygonOffsetFactor=this.polygonOffsetFactor),this.polygonOffsetUnits!==0&&(n.polygonOffsetUnits=this.polygonOffsetUnits),this.linewidth!==void 0&&this.linewidth!==1&&(n.linewidth=this.linewidth),this.dashSize!==void 0&&(n.dashSize=this.dashSize),this.gapSize!==void 0&&(n.gapSize=this.gapSize),this.scale!==void 0&&(n.scale=this.scale),this.dithering===!0&&(n.dithering=!0),this.alphaTest>0&&(n.alphaTest=this.alphaTest),this.alphaHash===!0&&(n.alphaHash=!0),this.alphaToCoverage===!0&&(n.alphaToCoverage=!0),this.premultipliedAlpha===!0&&(n.premultipliedAlpha=!0),this.forceSinglePass===!0&&(n.forceSinglePass=!0),this.allowOverride===!1&&(n.allowOverride=!1),this.wireframe===!0&&(n.wireframe=!0),this.wireframeLinewidth>1&&(n.wireframeLinewidth=this.wireframeLinewidth),this.wireframeLinecap!=="round"&&(n.wireframeLinecap=this.wireframeLinecap),this.wireframeLinejoin!=="round"&&(n.wireframeLinejoin=this.wireframeLinejoin),this.flatShading===!0&&(n.flatShading=!0),this.visible===!1&&(n.visible=!1),this.toneMapped===!1&&(n.toneMapped=!1),this.fog===!1&&(n.fog=!1),Object.keys(this.userData).length>0&&(n.userData=this.userData);function i(s){const o=[];for(const a in s){const l=s[a];delete l.metadata,o.push(l)}return o}if(e){const s=i(t.textures),o=i(t.images);s.length>0&&(n.textures=s),o.length>0&&(n.images=o)}return n}fromJSON(t,e){if(t.uuid!==void 0&&(this.uuid=t.uuid),t.name!==void 0&&(this.name=t.name),t.color!==void 0&&this.color!==void 0&&this.color.setHex(t.color),t.roughness!==void 0&&(this.roughness=t.roughness),t.metalness!==void 0&&(this.metalness=t.metalness),t.sheen!==void 0&&(this.sheen=t.sheen),t.sheenColor!==void 0&&(this.sheenColor=new Et().setHex(t.sheenColor)),t.sheenRoughness!==void 0&&(this.sheenRoughness=t.sheenRoughness),t.emissive!==void 0&&this.emissive!==void 0&&this.emissive.setHex(t.emissive),t.specular!==void 0&&this.specular!==void 0&&this.specular.setHex(t.specular),t.specularIntensity!==void 0&&(this.specularIntensity=t.specularIntensity),t.specularColor!==void 0&&this.specularColor!==void 0&&this.specularColor.setHex(t.specularColor),t.shininess!==void 0&&(this.shininess=t.shininess),t.clearcoat!==void 0&&(this.clearcoat=t.clearcoat),t.clearcoatRoughness!==void 0&&(this.clearcoatRoughness=t.clearcoatRoughness),t.dispersion!==void 0&&(this.dispersion=t.dispersion),t.iridescence!==void 0&&(this.iridescence=t.iridescence),t.iridescenceIOR!==void 0&&(this.iridescenceIOR=t.iridescenceIOR),t.iridescenceThicknessRange!==void 0&&(this.iridescenceThicknessRange=t.iridescenceThicknessRange),t.transmission!==void 0&&(this.transmission=t.transmission),t.thickness!==void 0&&(this.thickness=t.thickness),t.attenuationDistance!==void 0&&(this.attenuationDistance=t.attenuationDistance),t.attenuationColor!==void 0&&this.attenuationColor!==void 0&&this.attenuationColor.setHex(t.attenuationColor),t.anisotropy!==void 0&&(this.anisotropy=t.anisotropy),t.anisotropyRotation!==void 0&&(this.anisotropyRotation=t.anisotropyRotation),t.fog!==void 0&&(this.fog=t.fog),t.flatShading!==void 0&&(this.flatShading=t.flatShading),t.blending!==void 0&&(this.blending=t.blending),t.combine!==void 0&&(this.combine=t.combine),t.side!==void 0&&(this.side=t.side),t.shadowSide!==void 0&&(this.shadowSide=t.shadowSide),t.opacity!==void 0&&(this.opacity=t.opacity),t.transparent!==void 0&&(this.transparent=t.transparent),t.alphaTest!==void 0&&(this.alphaTest=t.alphaTest),t.alphaHash!==void 0&&(this.alphaHash=t.alphaHash),t.depthFunc!==void 0&&(this.depthFunc=t.depthFunc),t.depthTest!==void 0&&(this.depthTest=t.depthTest),t.depthWrite!==void 0&&(this.depthWrite=t.depthWrite),t.colorWrite!==void 0&&(this.colorWrite=t.colorWrite),t.blendSrc!==void 0&&(this.blendSrc=t.blendSrc),t.blendDst!==void 0&&(this.blendDst=t.blendDst),t.blendEquation!==void 0&&(this.blendEquation=t.blendEquation),t.blendSrcAlpha!==void 0&&(this.blendSrcAlpha=t.blendSrcAlpha),t.blendDstAlpha!==void 0&&(this.blendDstAlpha=t.blendDstAlpha),t.blendEquationAlpha!==void 0&&(this.blendEquationAlpha=t.blendEquationAlpha),t.blendColor!==void 0&&this.blendColor!==void 0&&this.blendColor.setHex(t.blendColor),t.blendAlpha!==void 0&&(this.blendAlpha=t.blendAlpha),t.stencilWriteMask!==void 0&&(this.stencilWriteMask=t.stencilWriteMask),t.stencilFunc!==void 0&&(this.stencilFunc=t.stencilFunc),t.stencilRef!==void 0&&(this.stencilRef=t.stencilRef),t.stencilFuncMask!==void 0&&(this.stencilFuncMask=t.stencilFuncMask),t.stencilFail!==void 0&&(this.stencilFail=t.stencilFail),t.stencilZFail!==void 0&&(this.stencilZFail=t.stencilZFail),t.stencilZPass!==void 0&&(this.stencilZPass=t.stencilZPass),t.stencilWrite!==void 0&&(this.stencilWrite=t.stencilWrite),t.wireframe!==void 0&&(this.wireframe=t.wireframe),t.wireframeLinewidth!==void 0&&(this.wireframeLinewidth=t.wireframeLinewidth),t.wireframeLinecap!==void 0&&(this.wireframeLinecap=t.wireframeLinecap),t.wireframeLinejoin!==void 0&&(this.wireframeLinejoin=t.wireframeLinejoin),t.rotation!==void 0&&(this.rotation=t.rotation),t.linewidth!==void 0&&(this.linewidth=t.linewidth),t.dashSize!==void 0&&(this.dashSize=t.dashSize),t.gapSize!==void 0&&(this.gapSize=t.gapSize),t.scale!==void 0&&(this.scale=t.scale),t.polygonOffset!==void 0&&(this.polygonOffset=t.polygonOffset),t.polygonOffsetFactor!==void 0&&(this.polygonOffsetFactor=t.polygonOffsetFactor),t.polygonOffsetUnits!==void 0&&(this.polygonOffsetUnits=t.polygonOffsetUnits),t.dithering!==void 0&&(this.dithering=t.dithering),t.alphaToCoverage!==void 0&&(this.alphaToCoverage=t.alphaToCoverage),t.premultipliedAlpha!==void 0&&(this.premultipliedAlpha=t.premultipliedAlpha),t.forceSinglePass!==void 0&&(this.forceSinglePass=t.forceSinglePass),t.allowOverride!==void 0&&(this.allowOverride=t.allowOverride),t.visible!==void 0&&(this.visible=t.visible),t.toneMapped!==void 0&&(this.toneMapped=t.toneMapped),t.userData!==void 0&&(this.userData=t.userData),t.vertexColors!==void 0&&(typeof t.vertexColors=="number"?this.vertexColors=t.vertexColors>0:this.vertexColors=t.vertexColors),t.size!==void 0&&(this.size=t.size),t.sizeAttenuation!==void 0&&(this.sizeAttenuation=t.sizeAttenuation),t.map!==void 0&&(this.map=e[t.map]||null),t.matcap!==void 0&&(this.matcap=e[t.matcap]||null),t.alphaMap!==void 0&&(this.alphaMap=e[t.alphaMap]||null),t.bumpMap!==void 0&&(this.bumpMap=e[t.bumpMap]||null),t.bumpScale!==void 0&&(this.bumpScale=t.bumpScale),t.normalMap!==void 0&&(this.normalMap=e[t.normalMap]||null),t.normalMapType!==void 0&&(this.normalMapType=t.normalMapType),t.normalScale!==void 0){let n=t.normalScale;Array.isArray(n)===!1&&(n=[n,n]),this.normalScale=new At().fromArray(n)}return t.displacementMap!==void 0&&(this.displacementMap=e[t.displacementMap]||null),t.displacementScale!==void 0&&(this.displacementScale=t.displacementScale),t.displacementBias!==void 0&&(this.displacementBias=t.displacementBias),t.roughnessMap!==void 0&&(this.roughnessMap=e[t.roughnessMap]||null),t.metalnessMap!==void 0&&(this.metalnessMap=e[t.metalnessMap]||null),t.emissiveMap!==void 0&&(this.emissiveMap=e[t.emissiveMap]||null),t.emissiveIntensity!==void 0&&(this.emissiveIntensity=t.emissiveIntensity),t.specularMap!==void 0&&(this.specularMap=e[t.specularMap]||null),t.specularIntensityMap!==void 0&&(this.specularIntensityMap=e[t.specularIntensityMap]||null),t.specularColorMap!==void 0&&(this.specularColorMap=e[t.specularColorMap]||null),t.envMap!==void 0&&(this.envMap=e[t.envMap]||null),t.envMapRotation!==void 0&&this.envMapRotation.fromArray(t.envMapRotation),t.envMapIntensity!==void 0&&(this.envMapIntensity=t.envMapIntensity),t.reflectivity!==void 0&&(this.reflectivity=t.reflectivity),t.refractionRatio!==void 0&&(this.refractionRatio=t.refractionRatio),t.lightMap!==void 0&&(this.lightMap=e[t.lightMap]||null),t.lightMapIntensity!==void 0&&(this.lightMapIntensity=t.lightMapIntensity),t.aoMap!==void 0&&(this.aoMap=e[t.aoMap]||null),t.aoMapIntensity!==void 0&&(this.aoMapIntensity=t.aoMapIntensity),t.gradientMap!==void 0&&(this.gradientMap=e[t.gradientMap]||null),t.clearcoatMap!==void 0&&(this.clearcoatMap=e[t.clearcoatMap]||null),t.clearcoatRoughnessMap!==void 0&&(this.clearcoatRoughnessMap=e[t.clearcoatRoughnessMap]||null),t.clearcoatNormalMap!==void 0&&(this.clearcoatNormalMap=e[t.clearcoatNormalMap]||null),t.clearcoatNormalScale!==void 0&&(this.clearcoatNormalScale=new At().fromArray(t.clearcoatNormalScale)),t.iridescenceMap!==void 0&&(this.iridescenceMap=e[t.iridescenceMap]||null),t.iridescenceThicknessMap!==void 0&&(this.iridescenceThicknessMap=e[t.iridescenceThicknessMap]||null),t.transmissionMap!==void 0&&(this.transmissionMap=e[t.transmissionMap]||null),t.thicknessMap!==void 0&&(this.thicknessMap=e[t.thicknessMap]||null),t.anisotropyMap!==void 0&&(this.anisotropyMap=e[t.anisotropyMap]||null),t.sheenColorMap!==void 0&&(this.sheenColorMap=e[t.sheenColorMap]||null),t.sheenRoughnessMap!==void 0&&(this.sheenRoughnessMap=e[t.sheenRoughnessMap]||null),this}clone(){return new this.constructor().copy(this)}copy(t){this.name=t.name,this.blending=t.blending,this.side=t.side,this.vertexColors=t.vertexColors,this.opacity=t.opacity,this.transparent=t.transparent,this.blendSrc=t.blendSrc,this.blendDst=t.blendDst,this.blendEquation=t.blendEquation,this.blendSrcAlpha=t.blendSrcAlpha,this.blendDstAlpha=t.blendDstAlpha,this.blendEquationAlpha=t.blendEquationAlpha,this.blendColor.copy(t.blendColor),this.blendAlpha=t.blendAlpha,this.depthFunc=t.depthFunc,this.depthTest=t.depthTest,this.depthWrite=t.depthWrite,this.stencilWriteMask=t.stencilWriteMask,this.stencilFunc=t.stencilFunc,this.stencilRef=t.stencilRef,this.stencilFuncMask=t.stencilFuncMask,this.stencilFail=t.stencilFail,this.stencilZFail=t.stencilZFail,this.stencilZPass=t.stencilZPass,this.stencilWrite=t.stencilWrite;const e=t.clippingPlanes;let n=null;if(e!==null){const i=e.length;n=new Array(i);for(let s=0;s!==i;++s)n[s]=e[s].clone()}return this.clippingPlanes=n,this.clipIntersection=t.clipIntersection,this.clipShadows=t.clipShadows,this.shadowSide=t.shadowSide,this.colorWrite=t.colorWrite,this.precision=t.precision,this.polygonOffset=t.polygonOffset,this.polygonOffsetFactor=t.polygonOffsetFactor,this.polygonOffsetUnits=t.polygonOffsetUnits,this.dithering=t.dithering,this.alphaTest=t.alphaTest,this.alphaHash=t.alphaHash,this.alphaToCoverage=t.alphaToCoverage,this.premultipliedAlpha=t.premultipliedAlpha,this.forceSinglePass=t.forceSinglePass,this.allowOverride=t.allowOverride,this.visible=t.visible,this.toneMapped=t.toneMapped,this.userData=JSON.parse(JSON.stringify(t.userData)),this}dispose(){this.dispatchEvent({type:"dispose"})}set needsUpdate(t){t===!0&&this.version++}}class Mf extends Vn{constructor(t){super(),this.isSpriteMaterial=!0,this.type="SpriteMaterial",this.color=new Et(16777215),this.map=null,this.alphaMap=null,this.rotation=0,this.sizeAttenuation=!0,this.transparent=!0,this.fog=!0,this.setValues(t)}copy(t){return super.copy(t),this.color.copy(t.color),this.map=t.map,this.alphaMap=t.alphaMap,this.rotation=t.rotation,this.sizeAttenuation=t.sizeAttenuation,this.fog=t.fog,this}}let Ss;const mr=new P,ws=new P,Es=new P,Ts=new At,gr=new At,bf=new Ht,fo=new P,_r=new P,po=new P,Jh=new At,Wa=new At,Qh=new At;class $m extends Re{constructor(t=new Mf){if(super(),this.isSprite=!0,this.type="Sprite",Ss===void 0){Ss=new De;const e=new Float32Array([-.5,-.5,0,0,0,.5,-.5,0,1,0,.5,.5,0,1,1,-.5,.5,0,0,1]),n=new yf(e,5);Ss.setIndex([0,1,2,0,2,3]),Ss.setAttribute("position",new Xr(n,3,0,!1)),Ss.setAttribute("uv",new Xr(n,2,3,!1))}this.geometry=Ss,this.material=t,this.center=new At(.5,.5),this.count=1}raycast(t,e){t.camera===null&&Ot('Sprite: "Raycaster.camera" needs to be set in order to raycast against sprites.'),ws.setFromMatrixScale(this.matrixWorld),bf.copy(t.camera.matrixWorld),this.modelViewMatrix.multiplyMatrices(t.camera.matrixWorldInverse,this.matrixWorld),Es.setFromMatrixPosition(this.modelViewMatrix),t.camera.isPerspectiveCamera&&this.material.sizeAttenuation===!1&&ws.multiplyScalar(-Es.z);const n=this.material.rotation;let i,s;n!==0&&(s=Math.cos(n),i=Math.sin(n));const o=this.center;mo(fo.set(-.5,-.5,0),Es,o,ws,i,s),mo(_r.set(.5,-.5,0),Es,o,ws,i,s),mo(po.set(.5,.5,0),Es,o,ws,i,s),Jh.set(0,0),Wa.set(1,0),Qh.set(1,1);let a=t.ray.intersectTriangle(fo,_r,po,!1,mr);if(a===null&&(mo(_r.set(-.5,.5,0),Es,o,ws,i,s),Wa.set(0,1),a=t.ray.intersectTriangle(fo,po,_r,!1,mr),a===null))return;const l=t.ray.origin.distanceTo(mr);l<t.near||l>t.far||e.push({distance:l,point:mr.clone(),uv:Ln.getInterpolation(mr,fo,_r,po,Jh,Wa,Qh,new At),face:null,object:this})}copy(t,e){return super.copy(t,e),t.center!==void 0&&this.center.copy(t.center),this.material=t.material,this}}function mo(r,t,e,n,i,s){Ts.subVectors(r,e).addScalar(.5).multiply(n),i!==void 0?(gr.x=s*Ts.x-i*Ts.y,gr.y=i*Ts.x+s*Ts.y):gr.copy(Ts),r.copy(t),r.x+=gr.x,r.y+=gr.y,r.applyMatrix4(bf)}const mi=new P,Xa=new P,go=new P,Di=new P,qa=new P,_o=new P,$a=new P;class rr{constructor(t=new P,e=new P(0,0,-1)){this.origin=t,this.direction=e}set(t,e){return this.origin.copy(t),this.direction.copy(e),this}copy(t){return this.origin.copy(t.origin),this.direction.copy(t.direction),this}at(t,e){return e.copy(this.origin).addScaledVector(this.direction,t)}lookAt(t){return this.direction.copy(t).sub(this.origin).normalize(),this}recast(t){return this.origin.copy(this.at(t,mi)),this}closestPointToPoint(t,e){e.subVectors(t,this.origin);const n=e.dot(this.direction);return n<0?e.copy(this.origin):e.copy(this.origin).addScaledVector(this.direction,n)}distanceToPoint(t){return Math.sqrt(this.distanceSqToPoint(t))}distanceSqToPoint(t){const e=mi.subVectors(t,this.origin).dot(this.direction);return e<0?this.origin.distanceToSquared(t):(mi.copy(this.origin).addScaledVector(this.direction,e),mi.distanceToSquared(t))}distanceSqToSegment(t,e,n,i){Xa.copy(t).add(e).multiplyScalar(.5),go.copy(e).sub(t).normalize(),Di.copy(this.origin).sub(Xa);const s=t.distanceTo(e)*.5,o=-this.direction.dot(go),a=Di.dot(this.direction),l=-Di.dot(go),c=Di.lengthSq(),h=Math.abs(1-o*o);let u,d,f,m;if(h>0)if(u=o*l-a,d=o*a-l,m=s*h,u>=0)if(d>=-m)if(d<=m){const _=1/h;u*=_,d*=_,f=u*(u+o*d+2*a)+d*(o*u+d+2*l)+c}else d=s,u=Math.max(0,-(o*d+a)),f=-u*u+d*(d+2*l)+c;else d=-s,u=Math.max(0,-(o*d+a)),f=-u*u+d*(d+2*l)+c;else d<=-m?(u=Math.max(0,-(-o*s+a)),d=u>0?-s:Math.min(Math.max(-s,-l),s),f=-u*u+d*(d+2*l)+c):d<=m?(u=0,d=Math.min(Math.max(-s,-l),s),f=d*(d+2*l)+c):(u=Math.max(0,-(o*s+a)),d=u>0?s:Math.min(Math.max(-s,-l),s),f=-u*u+d*(d+2*l)+c);else d=o>0?-s:s,u=Math.max(0,-(o*d+a)),f=-u*u+d*(d+2*l)+c;return n&&n.copy(this.origin).addScaledVector(this.direction,u),i&&i.copy(Xa).addScaledVector(go,d),f}intersectSphere(t,e){mi.subVectors(t.center,this.origin);const n=mi.dot(this.direction),i=mi.dot(mi)-n*n,s=t.radius*t.radius;if(i>s)return null;const o=Math.sqrt(s-i),a=n-o,l=n+o;return l<0?null:a<0?this.at(l,e):this.at(a,e)}intersectsSphere(t){return t.radius<0?!1:this.distanceSqToPoint(t.center)<=t.radius*t.radius}distanceToPlane(t){const e=t.normal.dot(this.direction);if(e===0)return t.distanceToPoint(this.origin)===0?0:null;const n=-(this.origin.dot(t.normal)+t.constant)/e;return n>=0?n:null}intersectPlane(t,e){const n=this.distanceToPlane(t);return n===null?null:this.at(n,e)}intersectsPlane(t){const e=t.distanceToPoint(this.origin);return e===0||t.normal.dot(this.direction)*e<0}intersectBox(t,e){let n,i,s,o,a,l;const c=1/this.direction.x,h=1/this.direction.y,u=1/this.direction.z,d=this.origin;return c>=0?(n=(t.min.x-d.x)*c,i=(t.max.x-d.x)*c):(n=(t.max.x-d.x)*c,i=(t.min.x-d.x)*c),h>=0?(s=(t.min.y-d.y)*h,o=(t.max.y-d.y)*h):(s=(t.max.y-d.y)*h,o=(t.min.y-d.y)*h),n>o||s>i||((s>n||isNaN(n))&&(n=s),(o<i||isNaN(i))&&(i=o),u>=0?(a=(t.min.z-d.z)*u,l=(t.max.z-d.z)*u):(a=(t.max.z-d.z)*u,l=(t.min.z-d.z)*u),n>l||a>i)||((a>n||n!==n)&&(n=a),(l<i||i!==i)&&(i=l),i<0)?null:this.at(n>=0?n:i,e)}intersectsBox(t){return this.intersectBox(t,mi)!==null}intersectTriangle(t,e,n,i,s){qa.subVectors(e,t),_o.subVectors(n,t),$a.crossVectors(qa,_o);let o=this.direction.dot($a),a;if(o>0){if(i)return null;a=1}else if(o<0)a=-1,o=-o;else return null;Di.subVectors(this.origin,t);const l=a*this.direction.dot(_o.crossVectors(Di,_o));if(l<0)return null;const c=a*this.direction.dot(qa.cross(Di));if(c<0||l+c>o)return null;const h=-a*Di.dot($a);return h<0?null:this.at(h/o,s)}applyMatrix4(t){return this.origin.applyMatrix4(t),this.direction.transformDirection(t),this}equals(t){return t.origin.equals(this.origin)&&t.direction.equals(this.direction)}clone(){return new this.constructor().copy(this)}}class Le extends Vn{constructor(t){super(),this.isMeshBasicMaterial=!0,this.type="MeshBasicMaterial",this.color=new Et(16777215),this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.specularMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new Hi,this.combine=Kd,this.reflectivity=1,this.refractionRatio=.98,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.fog=!0,this.setValues(t)}copy(t){return super.copy(t),this.color.copy(t.color),this.map=t.map,this.lightMap=t.lightMap,this.lightMapIntensity=t.lightMapIntensity,this.aoMap=t.aoMap,this.aoMapIntensity=t.aoMapIntensity,this.specularMap=t.specularMap,this.alphaMap=t.alphaMap,this.envMap=t.envMap,this.envMapRotation.copy(t.envMapRotation),this.combine=t.combine,this.reflectivity=t.reflectivity,this.refractionRatio=t.refractionRatio,this.wireframe=t.wireframe,this.wireframeLinewidth=t.wireframeLinewidth,this.wireframeLinecap=t.wireframeLinecap,this.wireframeLinejoin=t.wireframeLinejoin,this.fog=t.fog,this}}const tu=new Ht,Ki=new rr,xo=new li,eu=new P,vo=new P,yo=new P,Mo=new P,Ya=new P,bo=new P,nu=new P,So=new P;class te extends Re{constructor(t=new De,e=new Le){super(),this.isMesh=!0,this.type="Mesh",this.geometry=t,this.material=e,this.morphTargetDictionary=void 0,this.morphTargetInfluences=void 0,this.count=1,this.updateMorphTargets()}copy(t,e){return super.copy(t,e),t.morphTargetInfluences!==void 0&&(this.morphTargetInfluences=t.morphTargetInfluences.slice()),t.morphTargetDictionary!==void 0&&(this.morphTargetDictionary=Object.assign({},t.morphTargetDictionary)),this.material=Array.isArray(t.material)?t.material.slice():t.material,this.geometry=t.geometry,this}updateMorphTargets(){const e=this.geometry.morphAttributes,n=Object.keys(e);if(n.length>0){const i=e[n[0]];if(i!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let s=0,o=i.length;s<o;s++){const a=i[s].name||String(s);this.morphTargetInfluences.push(0),this.morphTargetDictionary[a]=s}}}}getVertexPosition(t,e){const n=this.geometry,i=n.attributes.position,s=n.morphAttributes.position,o=n.morphTargetsRelative;e.fromBufferAttribute(i,t);const a=this.morphTargetInfluences;if(s&&a){bo.set(0,0,0);for(let l=0,c=s.length;l<c;l++){const h=a[l],u=s[l];h!==0&&(Ya.fromBufferAttribute(u,t),o?bo.addScaledVector(Ya,h):bo.addScaledVector(Ya.sub(e),h))}e.add(bo)}return e}raycast(t,e){const n=this.geometry,i=this.material,s=this.matrixWorld;i!==void 0&&(n.boundingSphere===null&&n.computeBoundingSphere(),xo.copy(n.boundingSphere),xo.applyMatrix4(s),Ki.copy(t.ray).recast(t.near),!(xo.containsPoint(Ki.origin)===!1&&(Ki.intersectSphere(xo,eu)===null||Ki.origin.distanceToSquared(eu)>(t.far-t.near)**2))&&(tu.copy(s).invert(),Ki.copy(t.ray).applyMatrix4(tu),!(n.boundingBox!==null&&Ki.intersectsBox(n.boundingBox)===!1)&&this._computeIntersections(t,e,Ki)))}_computeIntersections(t,e,n){let i;const s=this.geometry,o=this.material,a=s.index,l=s.attributes.position,c=s.attributes.uv,h=s.attributes.uv1,u=s.attributes.normal,d=s.groups,f=s.drawRange;if(a!==null)if(Array.isArray(o))for(let m=0,_=d.length;m<_;m++){const g=d[m],p=o[g.materialIndex],b=Math.max(g.start,f.start),E=Math.min(a.count,Math.min(g.start+g.count,f.start+f.count));for(let y=b,S=E;y<S;y+=3){const w=a.getX(y),A=a.getX(y+1),v=a.getX(y+2);i=wo(this,p,t,n,c,h,u,w,A,v),i&&(i.faceIndex=Math.floor(y/3),i.face.materialIndex=g.materialIndex,e.push(i))}}else{const m=Math.max(0,f.start),_=Math.min(a.count,f.start+f.count);for(let g=m,p=_;g<p;g+=3){const b=a.getX(g),E=a.getX(g+1),y=a.getX(g+2);i=wo(this,o,t,n,c,h,u,b,E,y),i&&(i.faceIndex=Math.floor(g/3),e.push(i))}}else if(l!==void 0)if(Array.isArray(o))for(let m=0,_=d.length;m<_;m++){const g=d[m],p=o[g.materialIndex],b=Math.max(g.start,f.start),E=Math.min(l.count,Math.min(g.start+g.count,f.start+f.count));for(let y=b,S=E;y<S;y+=3){const w=y,A=y+1,v=y+2;i=wo(this,p,t,n,c,h,u,w,A,v),i&&(i.faceIndex=Math.floor(y/3),i.face.materialIndex=g.materialIndex,e.push(i))}}else{const m=Math.max(0,f.start),_=Math.min(l.count,f.start+f.count);for(let g=m,p=_;g<p;g+=3){const b=g,E=g+1,y=g+2;i=wo(this,o,t,n,c,h,u,b,E,y),i&&(i.faceIndex=Math.floor(g/3),e.push(i))}}}}function Ym(r,t,e,n,i,s,o,a){let l;if(t.side===cn?l=n.intersectTriangle(o,s,i,!0,a):l=n.intersectTriangle(i,s,o,t.side===bi,a),l===null)return null;So.copy(a),So.applyMatrix4(r.matrixWorld);const c=e.ray.origin.distanceTo(So);return c<e.near||c>e.far?null:{distance:c,point:So.clone(),object:r}}function wo(r,t,e,n,i,s,o,a,l,c){r.getVertexPosition(a,vo),r.getVertexPosition(l,yo),r.getVertexPosition(c,Mo);const h=Ym(r,t,e,n,vo,yo,Mo,nu);if(h){const u=new P;Ln.getBarycoord(nu,vo,yo,Mo,u),i&&(h.uv=Ln.getInterpolatedAttribute(i,a,l,c,u,new At)),s&&(h.uv1=Ln.getInterpolatedAttribute(s,a,l,c,u,new At)),o&&(h.normal=Ln.getInterpolatedAttribute(o,a,l,c,u,new P),h.normal.dot(n.direction)>0&&h.normal.multiplyScalar(-1));const d={a,b:l,c,normal:new P,materialIndex:0};Ln.getNormal(vo,yo,Mo,d.normal),h.face=d,h.barycoord=u}return h}const xr=new be,iu=new be,su=new be,Km=new be,ru=new Ht,Eo=new P,Ka=new li,ou=new Ht,Za=new rr;class Zm extends te{constructor(t,e){super(t,e),this.isSkinnedMesh=!0,this.type="SkinnedMesh",this.bindMode=Uh,this.bindMatrix=new Ht,this.bindMatrixInverse=new Ht,this.boundingBox=null,this.boundingSphere=null}computeBoundingBox(){const t=this.geometry;this.boundingBox===null&&(this.boundingBox=new Pe),this.boundingBox.makeEmpty();const e=t.getAttribute("position");for(let n=0;n<e.count;n++)this.getVertexPosition(n,Eo),this.boundingBox.expandByPoint(Eo)}computeBoundingSphere(){const t=this.geometry;this.boundingSphere===null&&(this.boundingSphere=new li),this.boundingSphere.makeEmpty();const e=t.getAttribute("position");for(let n=0;n<e.count;n++)this.getVertexPosition(n,Eo),this.boundingSphere.expandByPoint(Eo)}copy(t,e){return super.copy(t,e),this.bindMode=t.bindMode,this.bindMatrix.copy(t.bindMatrix),this.bindMatrixInverse.copy(t.bindMatrixInverse),this.skeleton=t.skeleton,t.boundingBox!==null&&(this.boundingBox=t.boundingBox.clone()),t.boundingSphere!==null&&(this.boundingSphere=t.boundingSphere.clone()),this}raycast(t,e){const n=this.material,i=this.matrixWorld;n!==void 0&&(this.boundingSphere===null&&this.computeBoundingSphere(),Ka.copy(this.boundingSphere),Ka.applyMatrix4(i),t.ray.intersectsSphere(Ka)!==!1&&(ou.copy(i).invert(),Za.copy(t.ray).applyMatrix4(ou),!(this.boundingBox!==null&&Za.intersectsBox(this.boundingBox)===!1)&&this._computeIntersections(t,e,Za)))}getVertexPosition(t,e){return super.getVertexPosition(t,e),this.applyBoneTransform(t,e),e}bind(t,e){this.skeleton=t,e===void 0&&(this.updateMatrixWorld(!0),this.skeleton.calculateInverses(),e=this.matrixWorld),this.bindMatrix.copy(e),this.bindMatrixInverse.copy(e).invert()}pose(){this.skeleton.pose()}normalizeSkinWeights(){const t=new be,e=this.geometry.attributes.skinWeight;for(let n=0,i=e.count;n<i;n++){t.fromBufferAttribute(e,n);const s=1/t.manhattanLength();s!==1/0?t.multiplyScalar(s):t.set(1,0,0,0),e.setXYZW(n,t.x,t.y,t.z,t.w)}}updateMatrixWorld(t){super.updateMatrixWorld(t),this.bindMode===Uh?this.bindMatrixInverse.copy(this.matrixWorld).invert():this.bindMode===Zp?this.bindMatrixInverse.copy(this.bindMatrix).invert():wt("SkinnedMesh: Unrecognized bindMode: "+this.bindMode)}applyBoneTransform(t,e){const n=this.skeleton,i=this.geometry;iu.fromBufferAttribute(i.attributes.skinIndex,t),su.fromBufferAttribute(i.attributes.skinWeight,t),e.isVector4?(xr.copy(e),e.set(0,0,0,0)):(xr.set(...e,1),e.set(0,0,0)),xr.applyMatrix4(this.bindMatrix);for(let s=0;s<4;s++){const o=su.getComponent(s);if(o!==0){const a=iu.getComponent(s);ru.multiplyMatrices(n.bones[a].matrixWorld,n.boneInverses[a]),e.addScaledVector(Km.copy(xr).applyMatrix4(ru),o)}}return e.isVector4&&(e.w=xr.w),e.applyMatrix4(this.bindMatrixInverse)}}class Sf extends Re{constructor(){super(),this.isBone=!0,this.type="Bone"}}class Xc extends Xe{constructor(t=null,e=1,n=1,i,s,o,a,l,c=$e,h=$e,u,d){super(null,o,a,l,c,h,i,s,u,d),this.isDataTexture=!0,this.image={data:t,width:e,height:n},this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}}const au=new Ht,jm=new Ht;class qc{constructor(t=[],e=[]){this.uuid=Hn(),this.bones=t.slice(0),this.boneInverses=e,this.boneMatrices=null,this.boneTexture=null,this.init()}init(){const t=this.bones,e=this.boneInverses;if(this.boneMatrices=new Float32Array(t.length*16),e.length===0)this.calculateInverses();else if(t.length!==e.length){wt("Skeleton: Number of inverse bone matrices does not match amount of bones."),this.boneInverses=[];for(let n=0,i=this.bones.length;n<i;n++)this.boneInverses.push(new Ht)}}calculateInverses(){this.boneInverses.length=0;for(let t=0,e=this.bones.length;t<e;t++){const n=new Ht;this.bones[t]&&n.copy(this.bones[t].matrixWorld).invert(),this.boneInverses.push(n)}}pose(){for(let t=0,e=this.bones.length;t<e;t++){const n=this.bones[t];n&&n.matrixWorld.copy(this.boneInverses[t]).invert()}for(let t=0,e=this.bones.length;t<e;t++){const n=this.bones[t];n&&(n.parent&&n.parent.isBone?(n.matrix.copy(n.parent.matrixWorld).invert(),n.matrix.multiply(n.matrixWorld)):n.matrix.copy(n.matrixWorld),n.matrix.decompose(n.position,n.quaternion,n.scale))}}update(){const t=this.bones,e=this.boneInverses,n=this.boneMatrices,i=this.boneTexture;for(let s=0,o=t.length;s<o;s++){const a=t[s]?t[s].matrixWorld:jm;au.multiplyMatrices(a,e[s]),au.toArray(n,s*16)}i!==null&&(i.needsUpdate=!0)}clone(){return new qc(this.bones,this.boneInverses)}computeBoneTexture(){let t=Math.sqrt(this.bones.length*4);t=Math.ceil(t/4)*4,t=Math.max(t,4);const e=new Float32Array(t*t*4);e.set(this.boneMatrices);const n=new Xc(e,t,t,Un,Nn);return n.needsUpdate=!0,this.boneMatrices=e,this.boneTexture=n,this}getBoneByName(t){for(let e=0,n=this.bones.length;e<n;e++){const i=this.bones[e];if(i.name===t)return i}}dispose(){this.boneTexture!==null&&(this.boneTexture.dispose(),this.boneTexture=null)}fromJSON(t,e){this.uuid=t.uuid;for(let n=0,i=t.bones.length;n<i;n++){const s=t.bones[n];let o=e[s];o===void 0&&(wt("Skeleton: No bone found with UUID:",s),o=new Sf),this.bones.push(o),this.boneInverses.push(new Ht().fromArray(t.boneInverses[n]))}return this.init(),this}toJSON(){const t={metadata:{version:4.7,type:"Skeleton",generator:"Skeleton.toJSON"},bones:[],boneInverses:[]};t.uuid=this.uuid;const e=this.bones,n=this.boneInverses;for(let i=0,s=e.length;i<s;i++){const o=e[i];t.bones.push(o.uuid);const a=n[i];t.boneInverses.push(a.toArray())}return t}}class dc extends gn{constructor(t,e,n,i=1){super(t,e,n),this.isInstancedBufferAttribute=!0,this.meshPerAttribute=i}copy(t){return super.copy(t),this.meshPerAttribute=t.meshPerAttribute,this}toJSON(){const t=super.toJSON();return t.meshPerAttribute=this.meshPerAttribute,t.isInstancedBufferAttribute=!0,t}}const As=new Ht,lu=new Ht,To=[],cu=new Pe,Jm=new Ht,vr=new te,yr=new li;class $c extends te{constructor(t,e,n){super(t,e),this.isInstancedMesh=!0,this.instanceMatrix=new dc(new Float32Array(n*16),16),this.instanceColor=null,this.morphTexture=null,this.count=n,this.boundingBox=null,this.boundingSphere=null;for(let i=0;i<n;i++)this.setMatrixAt(i,Jm)}computeBoundingBox(){const t=this.geometry,e=this.count;this.boundingBox===null&&(this.boundingBox=new Pe),t.boundingBox===null&&t.computeBoundingBox(),this.boundingBox.makeEmpty();for(let n=0;n<e;n++)this.getMatrixAt(n,As),cu.copy(t.boundingBox).applyMatrix4(As),this.boundingBox.union(cu)}computeBoundingSphere(){const t=this.geometry,e=this.count;this.boundingSphere===null&&(this.boundingSphere=new li),t.boundingSphere===null&&t.computeBoundingSphere(),this.boundingSphere.makeEmpty();for(let n=0;n<e;n++)this.getMatrixAt(n,As),yr.copy(t.boundingSphere).applyMatrix4(As),this.boundingSphere.union(yr)}copy(t,e){return super.copy(t,e),this.instanceMatrix.copy(t.instanceMatrix),t.morphTexture!==null&&(this.morphTexture=t.morphTexture.clone()),t.instanceColor!==null&&(this.instanceColor=t.instanceColor.clone()),this.count=t.count,t.boundingBox!==null&&(this.boundingBox=t.boundingBox.clone()),t.boundingSphere!==null&&(this.boundingSphere=t.boundingSphere.clone()),this}getColorAt(t,e){return this.instanceColor===null?e.setRGB(1,1,1):e.fromArray(this.instanceColor.array,t*3)}getMatrixAt(t,e){return e.fromArray(this.instanceMatrix.array,t*16)}getMorphAt(t,e){const n=e.morphTargetInfluences,i=this.morphTexture.source.data.data,s=n.length+1,o=t*s+1;for(let a=0;a<n.length;a++)n[a]=i[o+a]}raycast(t,e){const n=this.matrixWorld,i=this.count;if(vr.geometry=this.geometry,vr.material=this.material,vr.material!==void 0&&(this.boundingSphere===null&&this.computeBoundingSphere(),yr.copy(this.boundingSphere),yr.applyMatrix4(n),t.ray.intersectsSphere(yr)!==!1))for(let s=0;s<i;s++){this.getMatrixAt(s,As),lu.multiplyMatrices(n,As),vr.matrixWorld=lu,vr.raycast(t,To);for(let o=0,a=To.length;o<a;o++){const l=To[o];l.instanceId=s,l.object=this,e.push(l)}To.length=0}}setColorAt(t,e){return this.instanceColor===null&&(this.instanceColor=new dc(new Float32Array(this.instanceMatrix.count*3).fill(1),3)),e.toArray(this.instanceColor.array,t*3),this}setMatrixAt(t,e){return e.toArray(this.instanceMatrix.array,t*16),this}setMorphAt(t,e){const n=e.morphTargetInfluences,i=n.length+1;this.morphTexture===null&&(this.morphTexture=new Xc(new Float32Array(i*this.count),i,this.count,Nc,Nn));const s=this.morphTexture.source.data.data;let o=0;for(let c=0;c<n.length;c++)o+=n[c];const a=this.geometry.morphTargetsRelative?1:1-o,l=i*t;return s[l]=a,s.set(n,l+1),this}updateMorphTargets(){}dispose(){this.dispatchEvent({type:"dispose"}),this.morphTexture!==null&&(this.morphTexture.dispose(),this.morphTexture=null)}}const ja=new P,Qm=new P,tg=new Vt;class Oi{constructor(t=new P(1,0,0),e=0){this.isPlane=!0,this.normal=t,this.constant=e}set(t,e){return this.normal.copy(t),this.constant=e,this}setComponents(t,e,n,i){return this.normal.set(t,e,n),this.constant=i,this}setFromNormalAndCoplanarPoint(t,e){return this.normal.copy(t),this.constant=-e.dot(this.normal),this}setFromCoplanarPoints(t,e,n){const i=ja.subVectors(n,e).cross(Qm.subVectors(t,e)).normalize();return this.setFromNormalAndCoplanarPoint(i,t),this}copy(t){return this.normal.copy(t.normal),this.constant=t.constant,this}normalize(){const t=1/this.normal.length();return this.normal.multiplyScalar(t),this.constant*=t,this}negate(){return this.constant*=-1,this.normal.negate(),this}distanceToPoint(t){return this.normal.dot(t)+this.constant}distanceToSphere(t){return this.distanceToPoint(t.center)-t.radius}projectPoint(t,e){return e.copy(t).addScaledVector(this.normal,-this.distanceToPoint(t))}intersectLine(t,e,n=!0){const i=t.delta(ja),s=this.normal.dot(i);if(s===0)return this.distanceToPoint(t.start)===0?e.copy(t.start):null;const o=-(t.start.dot(this.normal)+this.constant)/s;return n===!0&&(o<0||o>1)?null:e.copy(t.start).addScaledVector(i,o)}intersectsLine(t){const e=this.distanceToPoint(t.start),n=this.distanceToPoint(t.end);return e<0&&n>0||n<0&&e>0}intersectsBox(t){return t.intersectsPlane(this)}intersectsSphere(t){return t.intersectsPlane(this)}coplanarPoint(t){return t.copy(this.normal).multiplyScalar(-this.constant)}applyMatrix4(t,e){const n=e||tg.getNormalMatrix(t),i=this.coplanarPoint(ja).applyMatrix4(t),s=this.normal.applyMatrix3(n).normalize();return this.constant=-i.dot(s),this}translate(t){return this.constant-=t.dot(this.normal),this}equals(t){return t.normal.equals(this.normal)&&t.constant===this.constant}clone(){return new this.constructor().copy(this)}}const Zi=new li,eg=new At(.5,.5),Ao=new P;class Yc{constructor(t=new Oi,e=new Oi,n=new Oi,i=new Oi,s=new Oi,o=new Oi){this.planes=[t,e,n,i,s,o]}set(t,e,n,i,s,o){const a=this.planes;return a[0].copy(t),a[1].copy(e),a[2].copy(n),a[3].copy(i),a[4].copy(s),a[5].copy(o),this}copy(t){const e=this.planes;for(let n=0;n<6;n++)e[n].copy(t.planes[n]);return this}setFromProjectionMatrix(t,e=ni,n=!1){const i=this.planes,s=t.elements,o=s[0],a=s[1],l=s[2],c=s[3],h=s[4],u=s[5],d=s[6],f=s[7],m=s[8],_=s[9],g=s[10],p=s[11],b=s[12],E=s[13],y=s[14],S=s[15];if(i[0].setComponents(c-o,f-h,p-m,S-b).normalize(),i[1].setComponents(c+o,f+h,p+m,S+b).normalize(),i[2].setComponents(c+a,f+u,p+_,S+E).normalize(),i[3].setComponents(c-a,f-u,p-_,S-E).normalize(),n)i[4].setComponents(l,d,g,y).normalize(),i[5].setComponents(c-l,f-d,p-g,S-y).normalize();else if(i[4].setComponents(c-l,f-d,p-g,S-y).normalize(),e===ni)i[5].setComponents(c+l,f+d,p+g,S+y).normalize();else if(e===Gr)i[5].setComponents(l,d,g,y).normalize();else throw new Error("THREE.Frustum.setFromProjectionMatrix(): Invalid coordinate system: "+e);return this}intersectsObject(t){if(t.boundingSphere!==void 0)t.boundingSphere===null&&t.computeBoundingSphere(),Zi.copy(t.boundingSphere).applyMatrix4(t.matrixWorld);else{const e=t.geometry;e.boundingSphere===null&&e.computeBoundingSphere(),Zi.copy(e.boundingSphere).applyMatrix4(t.matrixWorld)}return this.intersectsSphere(Zi)}intersectsSprite(t){Zi.center.set(0,0,0);const e=eg.distanceTo(t.center);return Zi.radius=.7071067811865476+e,Zi.applyMatrix4(t.matrixWorld),this.intersectsSphere(Zi)}intersectsSphere(t){const e=this.planes,n=t.center,i=-t.radius;for(let s=0;s<6;s++)if(e[s].distanceToPoint(n)<i)return!1;return!0}intersectsBox(t){const e=this.planes;for(let n=0;n<6;n++){const i=e[n];if(Ao.x=i.normal.x>0?t.max.x:t.min.x,Ao.y=i.normal.y>0?t.max.y:t.min.y,Ao.z=i.normal.z>0?t.max.z:t.min.z,i.distanceToPoint(Ao)<0)return!1}return!0}containsPoint(t){const e=this.planes;for(let n=0;n<6;n++)if(e[n].distanceToPoint(t)<0)return!1;return!0}clone(){return new this.constructor().copy(this)}}class as extends Vn{constructor(t){super(),this.isLineBasicMaterial=!0,this.type="LineBasicMaterial",this.color=new Et(16777215),this.map=null,this.linewidth=1,this.linecap="round",this.linejoin="round",this.fog=!0,this.setValues(t)}copy(t){return super.copy(t),this.color.copy(t.color),this.map=t.map,this.linewidth=t.linewidth,this.linecap=t.linecap,this.linejoin=t.linejoin,this.fog=t.fog,this}}const ta=new P,ea=new P,hu=new Ht,Mr=new rr,Co=new li,Ja=new P,uu=new P;class is extends Re{constructor(t=new De,e=new as){super(),this.isLine=!0,this.type="Line",this.geometry=t,this.material=e,this.morphTargetDictionary=void 0,this.morphTargetInfluences=void 0,this.updateMorphTargets()}copy(t,e){return super.copy(t,e),this.material=Array.isArray(t.material)?t.material.slice():t.material,this.geometry=t.geometry,this}computeLineDistances(){const t=this.geometry;if(t.index===null){const e=t.attributes.position,n=[0];for(let i=1,s=e.count;i<s;i++)ta.fromBufferAttribute(e,i-1),ea.fromBufferAttribute(e,i),n[i]=n[i-1],n[i]+=ta.distanceTo(ea);t.setAttribute("lineDistance",new he(n,1))}else wt("Line.computeLineDistances(): Computation only possible with non-indexed BufferGeometry.");return this}raycast(t,e){const n=this.geometry,i=this.matrixWorld,s=t.params.Line.threshold,o=n.drawRange;if(n.boundingSphere===null&&n.computeBoundingSphere(),Co.copy(n.boundingSphere),Co.applyMatrix4(i),Co.radius+=s,t.ray.intersectsSphere(Co)===!1)return;hu.copy(i).invert(),Mr.copy(t.ray).applyMatrix4(hu);const a=s/((this.scale.x+this.scale.y+this.scale.z)/3),l=a*a,c=this.isLineSegments?2:1,h=n.index,d=n.attributes.position;if(h!==null){const f=Math.max(0,o.start),m=Math.min(h.count,o.start+o.count);for(let _=f,g=m-1;_<g;_+=c){const p=h.getX(_),b=h.getX(_+1),E=Ro(this,t,Mr,l,p,b,_);E&&e.push(E)}if(this.isLineLoop){const _=h.getX(m-1),g=h.getX(f),p=Ro(this,t,Mr,l,_,g,m-1);p&&e.push(p)}}else{const f=Math.max(0,o.start),m=Math.min(d.count,o.start+o.count);for(let _=f,g=m-1;_<g;_+=c){const p=Ro(this,t,Mr,l,_,_+1,_);p&&e.push(p)}if(this.isLineLoop){const _=Ro(this,t,Mr,l,m-1,f,m-1);_&&e.push(_)}}}updateMorphTargets(){const e=this.geometry.morphAttributes,n=Object.keys(e);if(n.length>0){const i=e[n[0]];if(i!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let s=0,o=i.length;s<o;s++){const a=i[s].name||String(s);this.morphTargetInfluences.push(0),this.morphTargetDictionary[a]=s}}}}}function Ro(r,t,e,n,i,s,o){const a=r.geometry.attributes.position;if(ta.fromBufferAttribute(a,i),ea.fromBufferAttribute(a,s),e.distanceSqToSegment(ta,ea,Ja,uu)>n)return;Ja.applyMatrix4(r.matrixWorld);const c=t.ray.origin.distanceTo(Ja);if(!(c<t.near||c>t.far))return{distance:c,point:uu.clone().applyMatrix4(r.matrixWorld),index:o,face:null,faceIndex:null,barycoord:null,object:r}}const du=new P,fu=new P;class wf extends is{constructor(t,e){super(t,e),this.isLineSegments=!0,this.type="LineSegments"}computeLineDistances(){const t=this.geometry;if(t.index===null){const e=t.attributes.position,n=[];for(let i=0,s=e.count;i<s;i+=2)du.fromBufferAttribute(e,i),fu.fromBufferAttribute(e,i+1),n[i]=i===0?0:n[i-1],n[i+1]=n[i]+du.distanceTo(fu);t.setAttribute("lineDistance",new he(n,1))}else wt("LineSegments.computeLineDistances(): Computation only possible with non-indexed BufferGeometry.");return this}}class Ef extends is{constructor(t,e){super(t,e),this.isLineLoop=!0,this.type="LineLoop"}}class Tf extends Vn{constructor(t){super(),this.isPointsMaterial=!0,this.type="PointsMaterial",this.color=new Et(16777215),this.map=null,this.alphaMap=null,this.size=1,this.sizeAttenuation=!0,this.fog=!0,this.setValues(t)}copy(t){return super.copy(t),this.color.copy(t.color),this.map=t.map,this.alphaMap=t.alphaMap,this.size=t.size,this.sizeAttenuation=t.sizeAttenuation,this.fog=t.fog,this}}const pu=new Ht,fc=new rr,Po=new li,Io=new P;class ng extends Re{constructor(t=new De,e=new Tf){super(),this.isPoints=!0,this.type="Points",this.geometry=t,this.material=e,this.morphTargetDictionary=void 0,this.morphTargetInfluences=void 0,this.updateMorphTargets()}copy(t,e){return super.copy(t,e),this.material=Array.isArray(t.material)?t.material.slice():t.material,this.geometry=t.geometry,this}raycast(t,e){const n=this.geometry,i=this.matrixWorld,s=t.params.Points.threshold,o=n.drawRange;if(n.boundingSphere===null&&n.computeBoundingSphere(),Po.copy(n.boundingSphere),Po.applyMatrix4(i),Po.radius+=s,t.ray.intersectsSphere(Po)===!1)return;pu.copy(i).invert(),fc.copy(t.ray).applyMatrix4(pu);const a=s/((this.scale.x+this.scale.y+this.scale.z)/3),l=a*a,c=n.index,u=n.attributes.position;if(c!==null){const d=Math.max(0,o.start),f=Math.min(c.count,o.start+o.count);for(let m=d,_=f;m<_;m++){const g=c.getX(m);Io.fromBufferAttribute(u,g),mu(Io,g,l,i,t,e,this)}}else{const d=Math.max(0,o.start),f=Math.min(u.count,o.start+o.count);for(let m=d,_=f;m<_;m++)Io.fromBufferAttribute(u,m),mu(Io,m,l,i,t,e,this)}}updateMorphTargets(){const e=this.geometry.morphAttributes,n=Object.keys(e);if(n.length>0){const i=e[n[0]];if(i!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let s=0,o=i.length;s<o;s++){const a=i[s].name||String(s);this.morphTargetInfluences.push(0),this.morphTargetDictionary[a]=s}}}}}function mu(r,t,e,n,i,s,o){const a=fc.distanceSqToPoint(r);if(a<e){const l=new P;fc.closestPointToPoint(r,l),l.applyMatrix4(n);const c=i.ray.origin.distanceTo(l);if(c<i.near||c>i.far)return;s.push({distance:c,distanceToRay:Math.sqrt(a),point:l,index:t,face:null,faceIndex:null,barycoord:null,object:o})}}class Af extends Xe{constructor(t=[],e=ss,n,i,s,o,a,l,c,h){super(t,e,n,i,s,o,a,l,c,h),this.isCubeTexture=!0,this.flipY=!1}get images(){return this.image}set images(t){this.image=t}}class Cf extends Xe{constructor(t,e,n,i,s,o,a,l,c){super(t,e,n,i,s,o,a,l,c),this.isCanvasTexture=!0,this.needsUpdate=!0}}class tr extends Xe{constructor(t,e,n=oi,i,s,o,a=$e,l=$e,c,h=wi,u=1){if(h!==wi&&h!==ns)throw new Error("THREE.DepthTexture: format must be either THREE.DepthFormat or THREE.DepthStencilFormat");const d={width:t,height:e,depth:u};super(d,i,s,o,a,l,h,n,c),this.isDepthTexture=!0,this.flipY=!1,this.generateMipmaps=!1,this.compareFunction=null}copy(t){return super.copy(t),this.source=new Vc(Object.assign({},t.image)),this.compareFunction=t.compareFunction,this}toJSON(t){const e=super.toJSON(t);return this.compareFunction!==null&&(e.compareFunction=this.compareFunction),e}}class ig extends tr{constructor(t,e=oi,n=ss,i,s,o=$e,a=$e,l,c=wi){const h={width:t,height:t,depth:1},u=[h,h,h,h,h,h];super(t,t,e,n,i,s,o,a,l,c),this.image=u,this.isCubeDepthTexture=!0,this.isCubeTexture=!0}get images(){return this.image}set images(t){this.image=t}}class Rf extends Xe{constructor(t=null){super(),this.sourceTexture=t,this.isExternalTexture=!0}copy(t){return super.copy(t),this.sourceTexture=t.sourceTexture,this}}class ci extends De{constructor(t=1,e=1,n=1,i=1,s=1,o=1){super(),this.type="BoxGeometry",this.parameters={width:t,height:e,depth:n,widthSegments:i,heightSegments:s,depthSegments:o};const a=this;i=Math.floor(i),s=Math.floor(s),o=Math.floor(o);const l=[],c=[],h=[],u=[];let d=0,f=0;m("z","y","x",-1,-1,n,e,t,o,s,0),m("z","y","x",1,-1,n,e,-t,o,s,1),m("x","z","y",1,1,t,n,e,i,o,2),m("x","z","y",1,-1,t,n,-e,i,o,3),m("x","y","z",1,-1,t,e,n,i,s,4),m("x","y","z",-1,-1,t,e,-n,i,s,5),this.setIndex(l),this.setAttribute("position",new he(c,3)),this.setAttribute("normal",new he(h,3)),this.setAttribute("uv",new he(u,2));function m(_,g,p,b,E,y,S,w,A,v,T){const I=y/A,L=S/v,U=y/2,W=S/2,K=w/2,k=A+1,$=v+1;let V=0,Q=0;const it=new P;for(let ft=0;ft<$;ft++){const at=ft*L-W;for(let Y=0;Y<k;Y++){const Bt=Y*I-U;it[_]=Bt*b,it[g]=at*E,it[p]=K,c.push(it.x,it.y,it.z),it[_]=0,it[g]=0,it[p]=w>0?1:-1,h.push(it.x,it.y,it.z),u.push(Y/A),u.push(1-ft/v),V+=1}}for(let ft=0;ft<v;ft++)for(let at=0;at<A;at++){const Y=d+at+k*ft,Bt=d+at+k*(ft+1),re=d+(at+1)+k*(ft+1),Zt=d+(at+1)+k*ft;l.push(Y,Bt,Zt),l.push(Bt,re,Zt),Q+=6}a.addGroup(f,Q,T),f+=Q,d+=V}}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new ci(t.width,t.height,t.depth,t.widthSegments,t.heightSegments,t.depthSegments)}}class Kc extends De{constructor(t=1,e=1,n=4,i=8,s=1){super(),this.type="CapsuleGeometry",this.parameters={radius:t,height:e,capSegments:n,radialSegments:i,heightSegments:s},e=Math.max(0,e),n=Math.max(1,Math.floor(n)),i=Math.max(3,Math.floor(i)),s=Math.max(1,Math.floor(s));const o=[],a=[],l=[],c=[],h=e/2,u=Math.PI/2*t,d=e,f=2*u+d,m=n*2+s,_=i+1,g=new P,p=new P;for(let b=0;b<=m;b++){let E=0,y=0,S=0,w=0;if(b<=n){const T=b/n,I=T*Math.PI/2;y=-h-t*Math.cos(I),S=t*Math.sin(I),w=-t*Math.cos(I),E=T*u}else if(b<=n+s){const T=(b-n)/s;y=-h+T*e,S=t,w=0,E=u+T*d}else{const T=(b-n-s)/n,I=T*Math.PI/2;y=h+t*Math.sin(I),S=t*Math.cos(I),w=t*Math.sin(I),E=u+d+T*u}const A=Math.max(0,Math.min(1,E/f));let v=0;b===0?v=.5/i:b===m&&(v=-.5/i);for(let T=0;T<=i;T++){const I=T/i,L=I*Math.PI*2,U=Math.sin(L),W=Math.cos(L);p.x=-S*W,p.y=y,p.z=S*U,a.push(p.x,p.y,p.z),g.set(-S*W,w,S*U),g.normalize(),l.push(g.x,g.y,g.z),c.push(I+v,A)}if(b>0){const T=(b-1)*_;for(let I=0;I<i;I++){const L=T+I,U=T+I+1,W=b*_+I,K=b*_+I+1;o.push(L,U,W),o.push(U,K,W)}}}this.setIndex(o),this.setAttribute("position",new he(a,3)),this.setAttribute("normal",new he(l,3)),this.setAttribute("uv",new he(c,2))}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new Kc(t.radius,t.height,t.capSegments,t.radialSegments,t.heightSegments)}}class Vi extends De{constructor(t=1,e=1,n=1,i=32,s=1,o=!1,a=0,l=Math.PI*2){super(),this.type="CylinderGeometry",this.parameters={radiusTop:t,radiusBottom:e,height:n,radialSegments:i,heightSegments:s,openEnded:o,thetaStart:a,thetaLength:l};const c=this;i=Math.floor(i),s=Math.floor(s);const h=[],u=[],d=[],f=[];let m=0;const _=[],g=n/2;let p=0;b(),o===!1&&(t>0&&E(!0),e>0&&E(!1)),this.setIndex(h),this.setAttribute("position",new he(u,3)),this.setAttribute("normal",new he(d,3)),this.setAttribute("uv",new he(f,2));function b(){const y=new P,S=new P;let w=0;const A=(e-t)/n;for(let v=0;v<=s;v++){const T=[],I=v/s,L=I*(e-t)+t;for(let U=0;U<=i;U++){const W=U/i,K=W*l+a,k=Math.sin(K),$=Math.cos(K);S.x=L*k,S.y=-I*n+g,S.z=L*$,u.push(S.x,S.y,S.z),y.set(k,A,$).normalize(),d.push(y.x,y.y,y.z),f.push(W,1-I),T.push(m++)}_.push(T)}for(let v=0;v<i;v++)for(let T=0;T<s;T++){const I=_[T][v],L=_[T+1][v],U=_[T+1][v+1],W=_[T][v+1];(t>0||T!==0)&&(h.push(I,L,W),w+=3),(e>0||T!==s-1)&&(h.push(L,U,W),w+=3)}c.addGroup(p,w,0),p+=w}function E(y){const S=m,w=new At,A=new P;let v=0;const T=y===!0?t:e,I=y===!0?1:-1;for(let U=1;U<=i;U++)u.push(0,g*I,0),d.push(0,I,0),f.push(.5,.5),m++;const L=m;for(let U=0;U<=i;U++){const K=U/i*l+a,k=Math.cos(K),$=Math.sin(K);A.x=T*$,A.y=g*I,A.z=T*k,u.push(A.x,A.y,A.z),d.push(0,I,0),w.x=k*.5+.5,w.y=$*.5*I+.5,f.push(w.x,w.y),m++}for(let U=0;U<i;U++){const W=S+U,K=L+U;y===!0?h.push(K,K+1,W):h.push(K+1,K,W),v+=3}c.addGroup(p,v,y===!0?1:2),p+=v}}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new Vi(t.radiusTop,t.radiusBottom,t.height,t.radialSegments,t.heightSegments,t.openEnded,t.thetaStart,t.thetaLength)}}class er extends De{constructor(t=1,e=1,n=1,i=1){super(),this.type="PlaneGeometry",this.parameters={width:t,height:e,widthSegments:n,heightSegments:i};const s=t/2,o=e/2,a=Math.floor(n),l=Math.floor(i),c=a+1,h=l+1,u=t/a,d=e/l,f=[],m=[],_=[],g=[];for(let p=0;p<h;p++){const b=p*d-o;for(let E=0;E<c;E++){const y=E*u-s;m.push(y,-b,0),_.push(0,0,1),g.push(E/a),g.push(1-p/l)}}for(let p=0;p<l;p++)for(let b=0;b<a;b++){const E=b+c*p,y=b+c*(p+1),S=b+1+c*(p+1),w=b+1+c*p;f.push(E,y,w),f.push(y,S,w)}this.setIndex(f),this.setAttribute("position",new he(m,3)),this.setAttribute("normal",new he(_,3)),this.setAttribute("uv",new he(g,2))}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new er(t.width,t.height,t.widthSegments,t.heightSegments)}}class pa extends De{constructor(t=.5,e=1,n=32,i=1,s=0,o=Math.PI*2){super(),this.type="RingGeometry",this.parameters={innerRadius:t,outerRadius:e,thetaSegments:n,phiSegments:i,thetaStart:s,thetaLength:o},n=Math.max(3,n),i=Math.max(1,i);const a=[],l=[],c=[],h=[];let u=t;const d=(e-t)/i,f=new P,m=new At;for(let _=0;_<=i;_++){for(let g=0;g<=n;g++){const p=s+g/n*o;f.x=u*Math.cos(p),f.y=u*Math.sin(p),l.push(f.x,f.y,f.z),c.push(0,0,1),m.x=(f.x/e+1)/2,m.y=(f.y/e+1)/2,h.push(m.x,m.y)}u+=d}for(let _=0;_<i;_++){const g=_*(n+1);for(let p=0;p<n;p++){const b=p+g,E=b,y=b+n+1,S=b+n+2,w=b+1;a.push(E,y,w),a.push(y,S,w)}}this.setIndex(a),this.setAttribute("position",new he(l,3)),this.setAttribute("normal",new he(c,3)),this.setAttribute("uv",new he(h,2))}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new pa(t.innerRadius,t.outerRadius,t.thetaSegments,t.phiSegments,t.thetaStart,t.thetaLength)}}class nr extends De{constructor(t=1,e=32,n=16,i=0,s=Math.PI*2,o=0,a=Math.PI){super(),this.type="SphereGeometry",this.parameters={radius:t,widthSegments:e,heightSegments:n,phiStart:i,phiLength:s,thetaStart:o,thetaLength:a},e=Math.max(3,Math.floor(e)),n=Math.max(2,Math.floor(n));const l=Math.min(o+a,Math.PI);let c=0;const h=[],u=new P,d=new P,f=[],m=[],_=[],g=[];for(let p=0;p<=n;p++){const b=[],E=p/n,y=o+E*a,S=t*Math.cos(y),w=Math.sqrt(t*t-S*S);let A=0;p===0&&o===0?A=.5/e:p===n&&l===Math.PI&&(A=-.5/e);for(let v=0;v<=e;v++){const T=v/e,I=i+T*s;u.x=-w*Math.cos(I),u.y=S,u.z=w*Math.sin(I),m.push(u.x,u.y,u.z),d.copy(u).normalize(),_.push(d.x,d.y,d.z),g.push(T+A,1-E),b.push(c++)}h.push(b)}for(let p=0;p<n;p++)for(let b=0;b<e;b++){const E=h[p][b+1],y=h[p][b],S=h[p+1][b],w=h[p+1][b+1];(p!==0||o>0)&&f.push(E,y,w),(p!==n-1||l<Math.PI)&&f.push(y,S,w)}this.setIndex(f),this.setAttribute("position",new he(m,3)),this.setAttribute("normal",new he(_,3)),this.setAttribute("uv",new he(g,2))}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new nr(t.radius,t.widthSegments,t.heightSegments,t.phiStart,t.phiLength,t.thetaStart,t.thetaLength)}}function ir(r){const t={};for(const e in r){t[e]={};for(const n in r[e]){const i=r[e][n];if(gu(i))i.isRenderTargetTexture?(wt("UniformsUtils: Textures of render targets cannot be cloned via cloneUniforms() or mergeUniforms()."),t[e][n]=null):t[e][n]=i.clone();else if(Array.isArray(i))if(gu(i[0])){const s=[];for(let o=0,a=i.length;o<a;o++)s[o]=i[o].clone();t[e][n]=s}else t[e][n]=i.slice();else t[e][n]=i}}return t}function dn(r){const t={};for(let e=0;e<r.length;e++){const n=ir(r[e]);for(const i in n)t[i]=n[i]}return t}function gu(r){return r&&(r.isColor||r.isMatrix3||r.isMatrix4||r.isVector2||r.isVector3||r.isVector4||r.isTexture||r.isQuaternion)}function sg(r){const t=[];for(let e=0;e<r.length;e++)t.push(r[e].clone());return t}function Pf(r){const t=r.getRenderTarget();return t===null?r.outputColorSpace:t.isXRRenderTarget===!0?t.texture.colorSpace:Qt.workingColorSpace}const rg={clone:ir,merge:dn};var og=`void main() {
	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}`,ag=`void main() {
	gl_FragColor = vec4( 1.0, 0.0, 0.0, 1.0 );
}`;class ai extends Vn{constructor(t){super(),this.isShaderMaterial=!0,this.type="ShaderMaterial",this.defines={},this.uniforms={},this.uniformsGroups=[],this.vertexShader=og,this.fragmentShader=ag,this.linewidth=1,this.wireframe=!1,this.wireframeLinewidth=1,this.fog=!1,this.lights=!1,this.clipping=!1,this.forceSinglePass=!0,this.extensions={clipCullDistance:!1,multiDraw:!1},this.defaultAttributeValues={color:[1,1,1],uv:[0,0],uv1:[0,0]},this.index0AttributeName=void 0,this.uniformsNeedUpdate=!1,this.glslVersion=null,t!==void 0&&this.setValues(t)}copy(t){return super.copy(t),this.fragmentShader=t.fragmentShader,this.vertexShader=t.vertexShader,this.uniforms=ir(t.uniforms),this.uniformsGroups=sg(t.uniformsGroups),this.defines=Object.assign({},t.defines),this.wireframe=t.wireframe,this.wireframeLinewidth=t.wireframeLinewidth,this.fog=t.fog,this.lights=t.lights,this.clipping=t.clipping,this.extensions=Object.assign({},t.extensions),this.glslVersion=t.glslVersion,this.defaultAttributeValues=Object.assign({},t.defaultAttributeValues),this.index0AttributeName=t.index0AttributeName,this.uniformsNeedUpdate=t.uniformsNeedUpdate,this}toJSON(t){const e=super.toJSON(t);e.glslVersion=this.glslVersion,e.uniforms={};for(const i in this.uniforms){const o=this.uniforms[i].value;o&&o.isTexture?e.uniforms[i]={type:"t",value:o.toJSON(t).uuid}:o&&o.isColor?e.uniforms[i]={type:"c",value:o.getHex()}:o&&o.isVector2?e.uniforms[i]={type:"v2",value:o.toArray()}:o&&o.isVector3?e.uniforms[i]={type:"v3",value:o.toArray()}:o&&o.isVector4?e.uniforms[i]={type:"v4",value:o.toArray()}:o&&o.isMatrix3?e.uniforms[i]={type:"m3",value:o.toArray()}:o&&o.isMatrix4?e.uniforms[i]={type:"m4",value:o.toArray()}:e.uniforms[i]={value:o}}Object.keys(this.defines).length>0&&(e.defines=this.defines),e.vertexShader=this.vertexShader,e.fragmentShader=this.fragmentShader,e.lights=this.lights,e.clipping=this.clipping;const n={};for(const i in this.extensions)this.extensions[i]===!0&&(n[i]=!0);return Object.keys(n).length>0&&(e.extensions=n),e}fromJSON(t,e){if(super.fromJSON(t,e),t.uniforms!==void 0)for(const n in t.uniforms){const i=t.uniforms[n];switch(this.uniforms[n]={},i.type){case"t":this.uniforms[n].value=e[i.value]||null;break;case"c":this.uniforms[n].value=new Et().setHex(i.value);break;case"v2":this.uniforms[n].value=new At().fromArray(i.value);break;case"v3":this.uniforms[n].value=new P().fromArray(i.value);break;case"v4":this.uniforms[n].value=new be().fromArray(i.value);break;case"m3":this.uniforms[n].value=new Vt().fromArray(i.value);break;case"m4":this.uniforms[n].value=new Ht().fromArray(i.value);break;default:this.uniforms[n].value=i.value}}if(t.defines!==void 0&&(this.defines=t.defines),t.vertexShader!==void 0&&(this.vertexShader=t.vertexShader),t.fragmentShader!==void 0&&(this.fragmentShader=t.fragmentShader),t.glslVersion!==void 0&&(this.glslVersion=t.glslVersion),t.extensions!==void 0)for(const n in t.extensions)this.extensions[n]=t.extensions[n];return t.lights!==void 0&&(this.lights=t.lights),t.clipping!==void 0&&(this.clipping=t.clipping),this}}class lg extends ai{constructor(t){super(t),this.isRawShaderMaterial=!0,this.type="RawShaderMaterial"}}class hn extends Vn{constructor(t){super(),this.isMeshStandardMaterial=!0,this.type="MeshStandardMaterial",this.defines={STANDARD:""},this.color=new Et(16777215),this.roughness=1,this.metalness=0,this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.emissive=new Et(0),this.emissiveIntensity=1,this.emissiveMap=null,this.bumpMap=null,this.bumpScale=1,this.normalMap=null,this.normalMapType=hc,this.normalScale=new At(1,1),this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.roughnessMap=null,this.metalnessMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new Hi,this.envMapIntensity=1,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.flatShading=!1,this.fog=!0,this.setValues(t)}copy(t){return super.copy(t),this.defines={STANDARD:""},this.color.copy(t.color),this.roughness=t.roughness,this.metalness=t.metalness,this.map=t.map,this.lightMap=t.lightMap,this.lightMapIntensity=t.lightMapIntensity,this.aoMap=t.aoMap,this.aoMapIntensity=t.aoMapIntensity,this.emissive.copy(t.emissive),this.emissiveMap=t.emissiveMap,this.emissiveIntensity=t.emissiveIntensity,this.bumpMap=t.bumpMap,this.bumpScale=t.bumpScale,this.normalMap=t.normalMap,this.normalMapType=t.normalMapType,this.normalScale.copy(t.normalScale),this.displacementMap=t.displacementMap,this.displacementScale=t.displacementScale,this.displacementBias=t.displacementBias,this.roughnessMap=t.roughnessMap,this.metalnessMap=t.metalnessMap,this.alphaMap=t.alphaMap,this.envMap=t.envMap,this.envMapRotation.copy(t.envMapRotation),this.envMapIntensity=t.envMapIntensity,this.wireframe=t.wireframe,this.wireframeLinewidth=t.wireframeLinewidth,this.wireframeLinecap=t.wireframeLinecap,this.wireframeLinejoin=t.wireframeLinejoin,this.flatShading=t.flatShading,this.fog=t.fog,this}}class hi extends hn{constructor(t){super(),this.isMeshPhysicalMaterial=!0,this.defines={STANDARD:"",PHYSICAL:""},this.type="MeshPhysicalMaterial",this.anisotropyRotation=0,this.anisotropyMap=null,this.clearcoatMap=null,this.clearcoatRoughness=0,this.clearcoatRoughnessMap=null,this.clearcoatNormalScale=new At(1,1),this.clearcoatNormalMap=null,this.ior=1.5,Object.defineProperty(this,"reflectivity",{get:function(){return Kt(2.5*(this.ior-1)/(this.ior+1),0,1)},set:function(e){this.ior=(1+.4*e)/(1-.4*e)}}),this.iridescenceMap=null,this.iridescenceIOR=1.3,this.iridescenceThicknessRange=[100,400],this.iridescenceThicknessMap=null,this.sheenColor=new Et(0),this.sheenColorMap=null,this.sheenRoughness=1,this.sheenRoughnessMap=null,this.transmissionMap=null,this.thickness=0,this.thicknessMap=null,this.attenuationDistance=1/0,this.attenuationColor=new Et(1,1,1),this.specularIntensity=1,this.specularIntensityMap=null,this.specularColor=new Et(1,1,1),this.specularColorMap=null,this._anisotropy=0,this._clearcoat=0,this._dispersion=0,this._iridescence=0,this._sheen=0,this._transmission=0,this.setValues(t)}get anisotropy(){return this._anisotropy}set anisotropy(t){this._anisotropy>0!=t>0&&this.version++,this._anisotropy=t}get clearcoat(){return this._clearcoat}set clearcoat(t){this._clearcoat>0!=t>0&&this.version++,this._clearcoat=t}get iridescence(){return this._iridescence}set iridescence(t){this._iridescence>0!=t>0&&this.version++,this._iridescence=t}get dispersion(){return this._dispersion}set dispersion(t){this._dispersion>0!=t>0&&this.version++,this._dispersion=t}get sheen(){return this._sheen}set sheen(t){this._sheen>0!=t>0&&this.version++,this._sheen=t}get transmission(){return this._transmission}set transmission(t){this._transmission>0!=t>0&&this.version++,this._transmission=t}copy(t){return super.copy(t),this.defines={STANDARD:"",PHYSICAL:""},this.anisotropy=t.anisotropy,this.anisotropyRotation=t.anisotropyRotation,this.anisotropyMap=t.anisotropyMap,this.clearcoat=t.clearcoat,this.clearcoatMap=t.clearcoatMap,this.clearcoatRoughness=t.clearcoatRoughness,this.clearcoatRoughnessMap=t.clearcoatRoughnessMap,this.clearcoatNormalMap=t.clearcoatNormalMap,this.clearcoatNormalScale.copy(t.clearcoatNormalScale),this.dispersion=t.dispersion,this.ior=t.ior,this.iridescence=t.iridescence,this.iridescenceMap=t.iridescenceMap,this.iridescenceIOR=t.iridescenceIOR,this.iridescenceThicknessRange=[...t.iridescenceThicknessRange],this.iridescenceThicknessMap=t.iridescenceThicknessMap,this.sheen=t.sheen,this.sheenColor.copy(t.sheenColor),this.sheenColorMap=t.sheenColorMap,this.sheenRoughness=t.sheenRoughness,this.sheenRoughnessMap=t.sheenRoughnessMap,this.transmission=t.transmission,this.transmissionMap=t.transmissionMap,this.thickness=t.thickness,this.thicknessMap=t.thicknessMap,this.attenuationDistance=t.attenuationDistance,this.attenuationColor.copy(t.attenuationColor),this.specularIntensity=t.specularIntensity,this.specularIntensityMap=t.specularIntensityMap,this.specularColor.copy(t.specularColor),this.specularColorMap=t.specularColorMap,this}}class cg extends Vn{constructor(t){super(),this.isMeshDepthMaterial=!0,this.type="MeshDepthMaterial",this.depthPacking=tm,this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.wireframe=!1,this.wireframeLinewidth=1,this.setValues(t)}copy(t){return super.copy(t),this.depthPacking=t.depthPacking,this.map=t.map,this.alphaMap=t.alphaMap,this.displacementMap=t.displacementMap,this.displacementScale=t.displacementScale,this.displacementBias=t.displacementBias,this.wireframe=t.wireframe,this.wireframeLinewidth=t.wireframeLinewidth,this}}class hg extends Vn{constructor(t){super(),this.isMeshDistanceMaterial=!0,this.type="MeshDistanceMaterial",this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.setValues(t)}copy(t){return super.copy(t),this.map=t.map,this.alphaMap=t.alphaMap,this.displacementMap=t.displacementMap,this.displacementScale=t.displacementScale,this.displacementBias=t.displacementBias,this}}class ug extends as{constructor(t){super(),this.isLineDashedMaterial=!0,this.type="LineDashedMaterial",this.scale=1,this.dashSize=3,this.gapSize=1,this.setValues(t)}copy(t){return super.copy(t),this.scale=t.scale,this.dashSize=t.dashSize,this.gapSize=t.gapSize,this}}function Lo(r,t){return!r||r.constructor===t?r:typeof t.BYTES_PER_ELEMENT=="number"?new t(r):Array.prototype.slice.call(r)}function dg(r){function t(i,s){return r[i]-r[s]}const e=r.length,n=new Array(e);for(let i=0;i!==e;++i)n[i]=i;return n.sort(t),n}function _u(r,t,e){const n=r.length,i=new r.constructor(n);for(let s=0,o=0;o!==n;++s){const a=e[s]*t;for(let l=0;l!==t;++l)i[o++]=r[a+l]}return i}function fg(r,t,e,n){let i=1,s=r[0];for(;s!==void 0&&s[n]===void 0;)s=r[i++];if(s===void 0)return;let o=s[n];if(o!==void 0)if(Array.isArray(o))do o=s[n],o!==void 0&&(t.push(s.time),e.push(...o)),s=r[i++];while(s!==void 0);else if(o.toArray!==void 0)do o=s[n],o!==void 0&&(t.push(s.time),o.toArray(e,e.length)),s=r[i++];while(s!==void 0);else do o=s[n],o!==void 0&&(t.push(s.time),e.push(o)),s=r[i++];while(s!==void 0)}class or{constructor(t,e,n,i){this.parameterPositions=t,this._cachedIndex=0,this.resultBuffer=i!==void 0?i:new e.constructor(n),this.sampleValues=e,this.valueSize=n,this.settings=null,this.DefaultSettings_={}}evaluate(t){const e=this.parameterPositions;let n=this._cachedIndex,i=e[n],s=e[n-1];t:{e:{let o;n:{i:if(!(t<i)){for(let a=n+2;;){if(i===void 0){if(t<s)break i;return n=e.length,this._cachedIndex=n,this.copySampleValue_(n-1)}if(n===a)break;if(s=i,i=e[++n],t<i)break e}o=e.length;break n}if(!(t>=s)){const a=e[1];t<a&&(n=2,s=a);for(let l=n-2;;){if(s===void 0)return this._cachedIndex=0,this.copySampleValue_(0);if(n===l)break;if(i=s,s=e[--n-1],t>=s)break e}o=n,n=0;break n}break t}for(;n<o;){const a=n+o>>>1;t<e[a]?o=a:n=a+1}if(i=e[n],s=e[n-1],s===void 0)return this._cachedIndex=0,this.copySampleValue_(0);if(i===void 0)return n=e.length,this._cachedIndex=n,this.copySampleValue_(n-1)}this._cachedIndex=n,this.intervalChanged_(n,s,i)}return this.interpolate_(n,s,t,i)}getSettings_(){return this.settings||this.DefaultSettings_}copySampleValue_(t){const e=this.resultBuffer,n=this.sampleValues,i=this.valueSize,s=t*i;for(let o=0;o!==i;++o)e[o]=n[s+o];return e}interpolate_(){throw new Error("THREE.Interpolant: Call to abstract method.")}intervalChanged_(){}}class pg extends or{constructor(t,e,n,i){super(t,e,n,i),this._weightPrev=-0,this._offsetPrev=-0,this._weightNext=-0,this._offsetNext=-0,this.DefaultSettings_={endingStart:ks,endingEnd:ks}}intervalChanged_(t,e,n){const i=this.parameterPositions;let s=t-2,o=t+1,a=i[s],l=i[o];if(a===void 0)switch(this.getSettings_().endingStart){case Bs:s=t,a=2*e-n;break;case jo:s=i.length-2,a=e+i[s]-i[s+1];break;default:s=t,a=n}if(l===void 0)switch(this.getSettings_().endingEnd){case Bs:o=t,l=2*n-e;break;case jo:o=1,l=n+i[1]-i[0];break;default:o=t-1,l=e}const c=(n-e)*.5,h=this.valueSize;this._weightPrev=c/(e-a),this._weightNext=c/(l-n),this._offsetPrev=s*h,this._offsetNext=o*h}interpolate_(t,e,n,i){const s=this.resultBuffer,o=this.sampleValues,a=this.valueSize,l=t*a,c=l-a,h=this._offsetPrev,u=this._offsetNext,d=this._weightPrev,f=this._weightNext,m=(n-e)/(i-e),_=m*m,g=_*m,p=-d*g+2*d*_-d*m,b=(1+d)*g+(-1.5-2*d)*_+(-.5+d)*m+1,E=(-1-f)*g+(1.5+f)*_+.5*m,y=f*g-f*_;for(let S=0;S!==a;++S)s[S]=p*o[h+S]+b*o[c+S]+E*o[l+S]+y*o[u+S];return s}}class If extends or{constructor(t,e,n,i){super(t,e,n,i)}interpolate_(t,e,n,i){const s=this.resultBuffer,o=this.sampleValues,a=this.valueSize,l=t*a,c=l-a,h=(n-e)/(i-e),u=1-h;for(let d=0;d!==a;++d)s[d]=o[c+d]*u+o[l+d]*h;return s}}class mg extends or{constructor(t,e,n,i){super(t,e,n,i)}interpolate_(t){return this.copySampleValue_(t-1)}}class gg extends or{interpolate_(t,e,n,i){const s=this.resultBuffer,o=this.sampleValues,a=this.valueSize,l=t*a,c=l-a,h=this.inTangents,u=this.outTangents;if(!h||!u){const m=(n-e)/(i-e),_=1-m;for(let g=0;g!==a;++g)s[g]=o[c+g]*_+o[l+g]*m;return s}const d=a*2,f=t-1;for(let m=0;m!==a;++m){const _=o[c+m],g=o[l+m],p=f*d+m*2,b=u[p],E=u[p+1],y=t*d+m*2,S=h[y],w=h[y+1];let A=(n-e)/(i-e),v,T,I,L,U;for(let W=0;W<8;W++){v=A*A,T=v*A,I=1-A,L=I*I,U=L*I;const k=U*e+3*L*A*b+3*I*v*S+T*i-n;if(Math.abs(k)<1e-10)break;const $=3*L*(b-e)+6*I*A*(S-b)+3*v*(i-S);if(Math.abs($)<1e-10)break;A=A-k/$,A=Math.max(0,Math.min(1,A))}s[m]=U*_+3*L*A*E+3*I*v*w+T*g}return s}}class Wn{constructor(t,e,n,i){if(t===void 0)throw new Error("THREE.KeyframeTrack: track name is undefined");if(e===void 0||e.length===0)throw new Error("THREE.KeyframeTrack: no keyframes in track named "+t);this.name=t,this.times=Lo(e,this.TimeBufferType),this.values=Lo(n,this.ValueBufferType),this.setInterpolation(i||this.DefaultInterpolation)}static toJSON(t){const e=t.constructor;let n;if(e.toJSON!==this.toJSON)n=e.toJSON(t);else{n={name:t.name,times:Lo(t.times,Array),values:Lo(t.values,Array)};const i=t.getInterpolation();i!==t.DefaultInterpolation&&(n.interpolation=i)}return n.type=t.ValueTypeName,n}InterpolantFactoryMethodDiscrete(t){return new mg(this.times,this.values,this.getValueSize(),t)}InterpolantFactoryMethodLinear(t){return new If(this.times,this.values,this.getValueSize(),t)}InterpolantFactoryMethodSmooth(t){return new pg(this.times,this.values,this.getValueSize(),t)}InterpolantFactoryMethodBezier(t){const e=new gg(this.times,this.values,this.getValueSize(),t);return this.settings&&(e.inTangents=this.settings.inTangents,e.outTangents=this.settings.outTangents),e}setInterpolation(t){let e;switch(t){case Hr:e=this.InterpolantFactoryMethodDiscrete;break;case Vr:e=this.InterpolantFactoryMethodLinear;break;case Ta:e=this.InterpolantFactoryMethodSmooth;break;case Fh:e=this.InterpolantFactoryMethodBezier;break}if(e===void 0){const n="unsupported interpolation for "+this.ValueTypeName+" keyframe track named "+this.name;if(this.createInterpolant===void 0)if(t!==this.DefaultInterpolation)this.setInterpolation(this.DefaultInterpolation);else throw new Error(n);return wt("KeyframeTrack:",n),this}return this.createInterpolant=e,this}getInterpolation(){switch(this.createInterpolant){case this.InterpolantFactoryMethodDiscrete:return Hr;case this.InterpolantFactoryMethodLinear:return Vr;case this.InterpolantFactoryMethodSmooth:return Ta;case this.InterpolantFactoryMethodBezier:return Fh}}getValueSize(){return this.values.length/this.times.length}shift(t){if(t!==0){const e=this.times;for(let n=0,i=e.length;n!==i;++n)e[n]+=t}return this}scale(t){if(t!==1){const e=this.times;for(let n=0,i=e.length;n!==i;++n)e[n]*=t}return this}trim(t,e){const n=this.times,i=n.length;let s=0,o=i-1;for(;s!==i&&n[s]<t;)++s;for(;o!==-1&&n[o]>e;)--o;if(++o,s!==0||o!==i){s>=o&&(o=Math.max(o,1),s=o-1);const a=this.getValueSize();this.times=n.slice(s,o),this.values=this.values.slice(s*a,o*a)}return this}validate(){let t=!0;const e=this.getValueSize();e-Math.floor(e)!==0&&(Ot("KeyframeTrack: Invalid value size in track.",this),t=!1);const n=this.times,i=this.values,s=n.length;s===0&&(Ot("KeyframeTrack: Track is empty.",this),t=!1);let o=null;for(let a=0;a!==s;a++){const l=n[a];if(typeof l=="number"&&isNaN(l)){Ot("KeyframeTrack: Time is not a valid number.",this,a,l),t=!1;break}if(o!==null&&o>l){Ot("KeyframeTrack: Out of order keys.",this,a,l,o),t=!1;break}o=l}if(i!==void 0&&hm(i))for(let a=0,l=i.length;a!==l;++a){const c=i[a];if(isNaN(c)){Ot("KeyframeTrack: Value is not a valid number.",this,a,c),t=!1;break}}return t}optimize(){const t=this.times.slice(),e=this.values.slice(),n=this.getValueSize(),i=this.getInterpolation()===Ta,s=t.length-1;let o=1;for(let a=1;a<s;++a){let l=!1;const c=t[a],h=t[a+1];if(c!==h&&(a!==1||c!==t[0]))if(i)l=!0;else{const u=a*n,d=u-n,f=u+n;for(let m=0;m!==n;++m){const _=e[u+m];if(_!==e[d+m]||_!==e[f+m]){l=!0;break}}}if(l){if(a!==o){t[o]=t[a];const u=a*n,d=o*n;for(let f=0;f!==n;++f)e[d+f]=e[u+f]}++o}}if(s>0){t[o]=t[s];for(let a=s*n,l=o*n,c=0;c!==n;++c)e[l+c]=e[a+c];++o}return o!==t.length?(this.times=t.slice(0,o),this.values=e.slice(0,o*n)):(this.times=t,this.values=e),this}clone(){const t=this.times.slice(),e=this.values.slice(),n=this.constructor,i=new n(this.name,t,e);return i.createInterpolant=this.createInterpolant,i}}Wn.prototype.ValueTypeName="";Wn.prototype.TimeBufferType=Float32Array;Wn.prototype.ValueBufferType=Float32Array;Wn.prototype.DefaultInterpolation=Vr;class ar extends Wn{constructor(t,e,n){super(t,e,n)}}ar.prototype.ValueTypeName="bool";ar.prototype.ValueBufferType=Array;ar.prototype.DefaultInterpolation=Hr;ar.prototype.InterpolantFactoryMethodLinear=void 0;ar.prototype.InterpolantFactoryMethodSmooth=void 0;class Lf extends Wn{constructor(t,e,n,i){super(t,e,n,i)}}Lf.prototype.ValueTypeName="color";class qr extends Wn{constructor(t,e,n,i){super(t,e,n,i)}}qr.prototype.ValueTypeName="number";class _g extends or{constructor(t,e,n,i){super(t,e,n,i)}interpolate_(t,e,n,i){const s=this.resultBuffer,o=this.sampleValues,a=this.valueSize,l=(n-e)/(i-e);let c=t*a;for(let h=c+a;c!==h;c+=4)mn.slerpFlat(s,0,o,c-a,o,c,l);return s}}class $r extends Wn{constructor(t,e,n,i){super(t,e,n,i)}InterpolantFactoryMethodLinear(t){return new _g(this.times,this.values,this.getValueSize(),t)}}$r.prototype.ValueTypeName="quaternion";$r.prototype.InterpolantFactoryMethodSmooth=void 0;class lr extends Wn{constructor(t,e,n){super(t,e,n)}}lr.prototype.ValueTypeName="string";lr.prototype.ValueBufferType=Array;lr.prototype.DefaultInterpolation=Hr;lr.prototype.InterpolantFactoryMethodLinear=void 0;lr.prototype.InterpolantFactoryMethodSmooth=void 0;class na extends Wn{constructor(t,e,n,i){super(t,e,n,i)}}na.prototype.ValueTypeName="vector";class pc{constructor(t="",e=-1,n=[],i=kc){this.name=t,this.tracks=n,this.duration=e,this.blendMode=i,this.uuid=Hn(),this.userData={},this.duration<0&&this.resetDuration()}static parse(t){const e=[],n=t.tracks,i=1/(t.fps||1);for(let o=0,a=n.length;o!==a;++o)e.push(vg(n[o]).scale(i));const s=new this(t.name,t.duration,e,t.blendMode);return s.uuid=t.uuid,s.userData=JSON.parse(t.userData||"{}"),s}static toJSON(t){const e=[],n=t.tracks,i={name:t.name,duration:t.duration,tracks:e,uuid:t.uuid,blendMode:t.blendMode,userData:JSON.stringify(t.userData)};for(let s=0,o=n.length;s!==o;++s)e.push(Wn.toJSON(n[s]));return i}static CreateFromMorphTargetSequence(t,e,n,i){const s=e.length,o=[];for(let a=0;a<s;a++){let l=[],c=[];l.push((a+s-1)%s,a,(a+1)%s),c.push(0,1,0);const h=dg(l);l=_u(l,1,h),c=_u(c,1,h),!i&&l[0]===0&&(l.push(s),c.push(c[0])),o.push(new qr(".morphTargetInfluences["+e[a].name+"]",l,c).scale(1/n))}return new this(t,-1,o)}static findByName(t,e){let n=t;if(!Array.isArray(t)){const i=t;n=i.geometry&&i.geometry.animations||i.animations}for(let i=0;i<n.length;i++)if(n[i].name===e)return n[i];return null}static CreateClipsFromMorphTargetSequences(t,e,n){const i={},s=/^([\w-]*?)([\d]+)$/;for(let a=0,l=t.length;a<l;a++){const c=t[a],h=c.name.match(s);if(h&&h.length>1){const u=h[1];let d=i[u];d||(i[u]=d=[]),d.push(c)}}const o=[];for(const a in i)o.push(this.CreateFromMorphTargetSequence(a,i[a],e,n));return o}resetDuration(){const t=this.tracks;let e=0;for(let n=0,i=t.length;n!==i;++n){const s=this.tracks[n];e=Math.max(e,s.times[s.times.length-1])}return this.duration=e,this}trim(){for(let t=0;t<this.tracks.length;t++)this.tracks[t].trim(0,this.duration);return this}validate(){let t=!0;for(let e=0;e<this.tracks.length;e++)t=t&&this.tracks[e].validate();return t}optimize(){for(let t=0;t<this.tracks.length;t++)this.tracks[t].optimize();return this}clone(){const t=[];for(let n=0;n<this.tracks.length;n++)t.push(this.tracks[n].clone());const e=new this.constructor(this.name,this.duration,t,this.blendMode);return e.userData=JSON.parse(JSON.stringify(this.userData)),e}toJSON(){return this.constructor.toJSON(this)}}function xg(r){switch(r.toLowerCase()){case"scalar":case"double":case"float":case"number":case"integer":return qr;case"vector":case"vector2":case"vector3":case"vector4":return na;case"color":return Lf;case"quaternion":return $r;case"bool":case"boolean":return ar;case"string":return lr}throw new Error("THREE.KeyframeTrack: Unsupported typeName: "+r)}function vg(r){if(r.type===void 0)throw new Error("THREE.KeyframeTrack: track type undefined, can not parse");const t=xg(r.type);if(r.times===void 0){const e=[],n=[];fg(r.keys,e,n,"value"),r.times=e,r.values=n}return t.parse!==void 0?t.parse(r):new t(r.name,r.times,r.values,r.interpolation)}const xi={enabled:!1,files:{},add:function(r,t){this.enabled!==!1&&(xu(r)||(this.files[r]=t))},get:function(r){if(this.enabled!==!1&&!xu(r))return this.files[r]},remove:function(r){delete this.files[r]},clear:function(){this.files={}}};function xu(r){try{const t=r.slice(r.indexOf(":")+1);return new URL(t).protocol==="blob:"}catch{return!1}}class yg{constructor(t,e,n){const i=this;let s=!1,o=0,a=0,l;const c=[];this.onStart=void 0,this.onLoad=t,this.onProgress=e,this.onError=n,this._abortController=null,this.itemStart=function(h){a++,s===!1&&i.onStart!==void 0&&i.onStart(h,o,a),s=!0},this.itemEnd=function(h){o++,i.onProgress!==void 0&&i.onProgress(h,o,a),o===a&&(s=!1,i.onLoad!==void 0&&i.onLoad())},this.itemError=function(h){i.onError!==void 0&&i.onError(h)},this.resolveURL=function(h){return h=h.normalize("NFC"),l?l(h):h},this.setURLModifier=function(h){return l=h,this},this.addHandler=function(h,u){return c.push(h,u),this},this.removeHandler=function(h){const u=c.indexOf(h);return u!==-1&&c.splice(u,2),this},this.getHandler=function(h){for(let u=0,d=c.length;u<d;u+=2){const f=c[u],m=c[u+1];if(f.global&&(f.lastIndex=0),f.test(h))return m}return null},this.abort=function(){return this.abortController.abort(),this._abortController=null,this}}get abortController(){return this._abortController||(this._abortController=new AbortController),this._abortController}}const Mg=new yg;class cr{constructor(t){this.manager=t!==void 0?t:Mg,this.crossOrigin="anonymous",this.withCredentials=!1,this.path="",this.resourcePath="",this.requestHeader={},typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}load(){}loadAsync(t,e){const n=this;return new Promise(function(i,s){n.load(t,i,e,s)})}parse(){}setCrossOrigin(t){return this.crossOrigin=t,this}setWithCredentials(t){return this.withCredentials=t,this}setPath(t){return this.path=t,this}setResourcePath(t){return this.resourcePath=t,this}setRequestHeader(t){return this.requestHeader=t,this}abort(){return this}}cr.DEFAULT_MATERIAL_NAME="__DEFAULT";const gi={};class bg extends Error{constructor(t,e){super(t),this.response=e}}class Df extends cr{constructor(t){super(t),this.mimeType="",this.responseType="",this._abortController=new AbortController}load(t,e,n,i){t===void 0&&(t=""),this.path!==void 0&&(t=this.path+t),t=this.manager.resolveURL(t);const s=xi.get(`file:${t}`);if(s!==void 0){this.manager.itemStart(t),setTimeout(()=>{e&&e(s),this.manager.itemEnd(t)},0);return}if(gi[t]!==void 0){gi[t].push({onLoad:e,onProgress:n,onError:i});return}gi[t]=[],gi[t].push({onLoad:e,onProgress:n,onError:i});const o=new Request(t,{headers:new Headers(this.requestHeader),credentials:this.withCredentials?"include":"same-origin",signal:typeof AbortSignal.any=="function"?AbortSignal.any([this._abortController.signal,this.manager.abortController.signal]):this._abortController.signal}),a=this.mimeType,l=this.responseType;fetch(o).then(c=>{if(c.status===200||c.status===0){if(c.status===0&&wt("FileLoader: HTTP Status 0 received."),typeof ReadableStream>"u"||c.body===void 0||c.body.getReader===void 0)return c;const h=gi[t],u=c.body.getReader(),d=c.headers.get("X-File-Size")||c.headers.get("Content-Length"),f=d?parseInt(d):0,m=f!==0;let _=0;const g=new ReadableStream({start(p){b();function b(){u.read().then(({done:E,value:y})=>{if(E)p.close();else{_+=y.byteLength;const S=new ProgressEvent("progress",{lengthComputable:m,loaded:_,total:f});for(let w=0,A=h.length;w<A;w++){const v=h[w];v.onProgress&&v.onProgress(S)}p.enqueue(y),b()}},E=>{p.error(E)})}}});return new Response(g)}else throw new bg(`fetch for "${c.url}" responded with ${c.status}: ${c.statusText}`,c)}).then(c=>{switch(l){case"arraybuffer":return c.arrayBuffer();case"blob":return c.blob();case"document":return c.text().then(h=>new DOMParser().parseFromString(h,a));case"json":return c.json();default:if(a==="")return c.text();{const u=/charset="?([^;"\s]*)"?/i.exec(a),d=u&&u[1]?u[1].toLowerCase():void 0,f=new TextDecoder(d);return c.arrayBuffer().then(m=>f.decode(m))}}}).then(c=>{xi.add(`file:${t}`,c);const h=gi[t];delete gi[t];for(let u=0,d=h.length;u<d;u++){const f=h[u];f.onLoad&&f.onLoad(c)}}).catch(c=>{const h=gi[t];if(h===void 0)throw this.manager.itemError(t),c;delete gi[t];for(let u=0,d=h.length;u<d;u++){const f=h[u];f.onError&&f.onError(c)}this.manager.itemError(t)}).finally(()=>{this.manager.itemEnd(t)}),this.manager.itemStart(t)}setResponseType(t){return this.responseType=t,this}setMimeType(t){return this.mimeType=t,this}abort(){return this._abortController.abort(),this._abortController=new AbortController,this}}const Cs=new WeakMap;class Sg extends cr{constructor(t){super(t)}load(t,e,n,i){this.path!==void 0&&(t=this.path+t),t=this.manager.resolveURL(t);const s=this,o=xi.get(`image:${t}`);if(o!==void 0){if(o.complete===!0)s.manager.itemStart(t),setTimeout(function(){e&&e(o),s.manager.itemEnd(t)},0);else{let u=Cs.get(o);u===void 0&&(u=[],Cs.set(o,u)),u.push({onLoad:e,onError:i})}return o}const a=Wr("img");function l(){h(),e&&e(this);const u=Cs.get(this)||[];for(let d=0;d<u.length;d++){const f=u[d];f.onLoad&&f.onLoad(this)}Cs.delete(this),s.manager.itemEnd(t)}function c(u){h(),i&&i(u),xi.remove(`image:${t}`);const d=Cs.get(this)||[];for(let f=0;f<d.length;f++){const m=d[f];m.onError&&m.onError(u)}Cs.delete(this),s.manager.itemError(t),s.manager.itemEnd(t)}function h(){a.removeEventListener("load",l,!1),a.removeEventListener("error",c,!1)}return a.addEventListener("load",l,!1),a.addEventListener("error",c,!1),t.slice(0,5)!=="data:"&&this.crossOrigin!==void 0&&(a.crossOrigin=this.crossOrigin),xi.add(`image:${t}`,a),s.manager.itemStart(t),a.src=t,a}}class Zc extends cr{constructor(t){super(t)}load(t,e,n,i){const s=new Xe,o=new Sg(this.manager);return o.setCrossOrigin(this.crossOrigin),o.setPath(this.path),o.load(t,function(a){s.image=a,s.needsUpdate=!0,e!==void 0&&e(s)},n,i),s}}class ma extends Re{constructor(t,e=1){super(),this.isLight=!0,this.type="Light",this.color=new Et(t),this.intensity=e}dispose(){this.dispatchEvent({type:"dispose"})}copy(t,e){return super.copy(t,e),this.color.copy(t.color),this.intensity=t.intensity,this}toJSON(t){const e=super.toJSON(t);return e.object.color=this.color.getHex(),e.object.intensity=this.intensity,e}}class Nf extends ma{constructor(t,e,n){super(t,n),this.isHemisphereLight=!0,this.type="HemisphereLight",this.position.copy(Re.DEFAULT_UP),this.updateMatrix(),this.groundColor=new Et(e)}copy(t,e){return super.copy(t,e),this.groundColor.copy(t.groundColor),this}toJSON(t){const e=super.toJSON(t);return e.object.groundColor=this.groundColor.getHex(),e}}const Qa=new Ht,vu=new P,yu=new P;class jc{constructor(t){this.camera=t,this.intensity=1,this.bias=0,this.biasNode=null,this.normalBias=0,this.radius=1,this.blurSamples=8,this.mapSize=new At(512,512),this.mapType=wn,this.map=null,this.mapPass=null,this.matrix=new Ht,this.autoUpdate=!0,this.needsUpdate=!1,this._frustum=new Yc,this._frameExtents=new At(1,1),this._viewportCount=1,this._viewports=[new be(0,0,1,1)]}getViewportCount(){return this._viewportCount}getFrustum(){return this._frustum}updateMatrices(t){const e=this.camera,n=this.matrix;vu.setFromMatrixPosition(t.matrixWorld),e.position.copy(vu),yu.setFromMatrixPosition(t.target.matrixWorld),e.lookAt(yu),e.updateMatrixWorld(),Qa.multiplyMatrices(e.projectionMatrix,e.matrixWorldInverse),this._frustum.setFromProjectionMatrix(Qa,e.coordinateSystem,e.reversedDepth),e.coordinateSystem===Gr||e.reversedDepth?n.set(.5,0,0,.5,0,.5,0,.5,0,0,1,0,0,0,0,1):n.set(.5,0,0,.5,0,.5,0,.5,0,0,.5,.5,0,0,0,1),n.multiply(Qa)}getViewport(t){return this._viewports[t]}getFrameExtents(){return this._frameExtents}dispose(){this.map&&this.map.dispose(),this.mapPass&&this.mapPass.dispose()}copy(t){return this.camera=t.camera.clone(),this.intensity=t.intensity,this.bias=t.bias,this.radius=t.radius,this.autoUpdate=t.autoUpdate,this.needsUpdate=t.needsUpdate,this.normalBias=t.normalBias,this.blurSamples=t.blurSamples,this.mapSize.copy(t.mapSize),this.biasNode=t.biasNode,this}clone(){return new this.constructor().copy(this)}toJSON(){const t={};return this.intensity!==1&&(t.intensity=this.intensity),this.bias!==0&&(t.bias=this.bias),this.normalBias!==0&&(t.normalBias=this.normalBias),this.radius!==1&&(t.radius=this.radius),(this.mapSize.x!==512||this.mapSize.y!==512)&&(t.mapSize=this.mapSize.toArray()),t.camera=this.camera.toJSON(!1).object,delete t.camera.matrix,t}}const Do=new P,No=new mn,Yn=new P;class Uf extends Re{constructor(){super(),this.isCamera=!0,this.type="Camera",this.matrixWorldInverse=new Ht,this.projectionMatrix=new Ht,this.projectionMatrixInverse=new Ht,this.coordinateSystem=ni,this._reversedDepth=!1}get reversedDepth(){return this._reversedDepth}copy(t,e){return super.copy(t,e),this.matrixWorldInverse.copy(t.matrixWorldInverse),this.projectionMatrix.copy(t.projectionMatrix),this.projectionMatrixInverse.copy(t.projectionMatrixInverse),this.coordinateSystem=t.coordinateSystem,this}getWorldDirection(t){return super.getWorldDirection(t).negate()}updateMatrixWorld(t){super.updateMatrixWorld(t),this.matrixWorld.decompose(Do,No,Yn),Yn.x===1&&Yn.y===1&&Yn.z===1?this.matrixWorldInverse.copy(this.matrixWorld).invert():this.matrixWorldInverse.compose(Do,No,Yn.set(1,1,1)).invert()}updateWorldMatrix(t,e,n=!1){super.updateWorldMatrix(t,e,n),this.matrixWorld.decompose(Do,No,Yn),Yn.x===1&&Yn.y===1&&Yn.z===1?this.matrixWorldInverse.copy(this.matrixWorld).invert():this.matrixWorldInverse.compose(Do,No,Yn.set(1,1,1)).invert()}clone(){return new this.constructor().copy(this)}}const Ni=new P,Mu=new At,bu=new At;class tn extends Uf{constructor(t=50,e=1,n=.1,i=2e3){super(),this.isPerspectiveCamera=!0,this.type="PerspectiveCamera",this.fov=t,this.zoom=1,this.near=n,this.far=i,this.focus=10,this.aspect=e,this.view=null,this.filmGauge=35,this.filmOffset=0,this.updateProjectionMatrix()}copy(t,e){return super.copy(t,e),this.fov=t.fov,this.zoom=t.zoom,this.near=t.near,this.far=t.far,this.focus=t.focus,this.aspect=t.aspect,this.view=t.view===null?null:Object.assign({},t.view),this.filmGauge=t.filmGauge,this.filmOffset=t.filmOffset,this}setFocalLength(t){const e=.5*this.getFilmHeight()/t;this.fov=Qs*2*Math.atan(e),this.updateProjectionMatrix()}getFocalLength(){const t=Math.tan(Lr*.5*this.fov);return .5*this.getFilmHeight()/t}getEffectiveFOV(){return Qs*2*Math.atan(Math.tan(Lr*.5*this.fov)/this.zoom)}getFilmWidth(){return this.filmGauge*Math.min(this.aspect,1)}getFilmHeight(){return this.filmGauge/Math.max(this.aspect,1)}getViewBounds(t,e,n){Ni.set(-1,-1,.5).applyMatrix4(this.projectionMatrixInverse),e.set(Ni.x,Ni.y).multiplyScalar(-t/Ni.z),Ni.set(1,1,.5).applyMatrix4(this.projectionMatrixInverse),n.set(Ni.x,Ni.y).multiplyScalar(-t/Ni.z)}getViewSize(t,e){return this.getViewBounds(t,Mu,bu),e.subVectors(bu,Mu)}setViewOffset(t,e,n,i,s,o){this.aspect=t/e,this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=t,this.view.fullHeight=e,this.view.offsetX=n,this.view.offsetY=i,this.view.width=s,this.view.height=o,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){const t=this.near;let e=t*Math.tan(Lr*.5*this.fov)/this.zoom,n=2*e,i=this.aspect*n,s=-.5*i;const o=this.view;if(this.view!==null&&this.view.enabled){const l=o.fullWidth,c=o.fullHeight;s+=o.offsetX*i/l,e-=o.offsetY*n/c,i*=o.width/l,n*=o.height/c}const a=this.filmOffset;a!==0&&(s+=t*a/this.getFilmWidth()),this.projectionMatrix.makePerspective(s,s+i,e,e-n,t,this.far,this.coordinateSystem,this.reversedDepth),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(t){const e=super.toJSON(t);return e.object.fov=this.fov,e.object.zoom=this.zoom,e.object.near=this.near,e.object.far=this.far,e.object.focus=this.focus,e.object.aspect=this.aspect,this.view!==null&&(e.object.view=Object.assign({},this.view)),e.object.filmGauge=this.filmGauge,e.object.filmOffset=this.filmOffset,e}}class wg extends jc{constructor(){super(new tn(50,1,.5,500)),this.isSpotLightShadow=!0,this.focus=1,this.aspect=1}updateMatrices(t){const e=this.camera,n=Qs*2*t.angle*this.focus,i=this.mapSize.width/this.mapSize.height*this.aspect,s=t.distance||e.far;(n!==e.fov||i!==e.aspect||s!==e.far)&&(e.fov=n,e.aspect=i,e.far=s,e.updateProjectionMatrix()),super.updateMatrices(t)}copy(t){return super.copy(t),this.focus=t.focus,this}}class Eg extends ma{constructor(t,e,n=0,i=Math.PI/3,s=0,o=2){super(t,e),this.isSpotLight=!0,this.type="SpotLight",this.position.copy(Re.DEFAULT_UP),this.updateMatrix(),this.target=new Re,this.distance=n,this.angle=i,this.penumbra=s,this.decay=o,this.map=null,this.shadow=new wg}get power(){return this.intensity*Math.PI}set power(t){this.intensity=t/Math.PI}dispose(){super.dispose(),this.shadow.dispose()}copy(t,e){return super.copy(t,e),this.distance=t.distance,this.angle=t.angle,this.penumbra=t.penumbra,this.decay=t.decay,this.target=t.target.clone(),this.map=t.map,this.shadow=t.shadow.clone(),this}toJSON(t){const e=super.toJSON(t);return e.object.distance=this.distance,e.object.angle=this.angle,e.object.decay=this.decay,e.object.penumbra=this.penumbra,e.object.target=this.target.uuid,this.map&&this.map.isTexture&&(e.object.map=this.map.toJSON(t).uuid),e.object.shadow=this.shadow.toJSON(),e}}class Tg extends jc{constructor(){super(new tn(90,1,.5,500)),this.isPointLightShadow=!0}}class Ag extends ma{constructor(t,e,n=0,i=2){super(t,e),this.isPointLight=!0,this.type="PointLight",this.distance=n,this.decay=i,this.shadow=new Tg}get power(){return this.intensity*4*Math.PI}set power(t){this.intensity=t/(4*Math.PI)}dispose(){super.dispose(),this.shadow.dispose()}copy(t,e){return super.copy(t,e),this.distance=t.distance,this.decay=t.decay,this.shadow=t.shadow.clone(),this}toJSON(t){const e=super.toJSON(t);return e.object.distance=this.distance,e.object.decay=this.decay,e.object.shadow=this.shadow.toJSON(),e}}class ga extends Uf{constructor(t=-1,e=1,n=1,i=-1,s=.1,o=2e3){super(),this.isOrthographicCamera=!0,this.type="OrthographicCamera",this.zoom=1,this.view=null,this.left=t,this.right=e,this.top=n,this.bottom=i,this.near=s,this.far=o,this.updateProjectionMatrix()}copy(t,e){return super.copy(t,e),this.left=t.left,this.right=t.right,this.top=t.top,this.bottom=t.bottom,this.near=t.near,this.far=t.far,this.zoom=t.zoom,this.view=t.view===null?null:Object.assign({},t.view),this}setViewOffset(t,e,n,i,s,o){this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=t,this.view.fullHeight=e,this.view.offsetX=n,this.view.offsetY=i,this.view.width=s,this.view.height=o,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){const t=(this.right-this.left)/(2*this.zoom),e=(this.top-this.bottom)/(2*this.zoom),n=(this.right+this.left)/2,i=(this.top+this.bottom)/2;let s=n-t,o=n+t,a=i+e,l=i-e;if(this.view!==null&&this.view.enabled){const c=(this.right-this.left)/this.view.fullWidth/this.zoom,h=(this.top-this.bottom)/this.view.fullHeight/this.zoom;s+=c*this.view.offsetX,o=s+c*this.view.width,a-=h*this.view.offsetY,l=a-h*this.view.height}this.projectionMatrix.makeOrthographic(s,o,a,l,this.near,this.far,this.coordinateSystem,this.reversedDepth),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(t){const e=super.toJSON(t);return e.object.zoom=this.zoom,e.object.left=this.left,e.object.right=this.right,e.object.top=this.top,e.object.bottom=this.bottom,e.object.near=this.near,e.object.far=this.far,this.view!==null&&(e.object.view=Object.assign({},this.view)),e}}class Cg extends jc{constructor(){super(new ga(-5,5,5,-5,.5,500)),this.isDirectionalLightShadow=!0}}class ia extends ma{constructor(t,e){super(t,e),this.isDirectionalLight=!0,this.type="DirectionalLight",this.position.copy(Re.DEFAULT_UP),this.updateMatrix(),this.target=new Re,this.shadow=new Cg}dispose(){super.dispose(),this.shadow.dispose()}copy(t){return super.copy(t),this.target=t.target.clone(),this.shadow=t.shadow.clone(),this}toJSON(t){const e=super.toJSON(t);return e.object.shadow=this.shadow.toJSON(),e.object.target=this.target.uuid,e}}class Nr{static extractUrlBase(t){const e=t.lastIndexOf("/");return e===-1?"./":t.slice(0,e+1)}static resolveURL(t,e){return typeof t!="string"||t===""?"":(/^https?:\/\//i.test(e)&&/^\//.test(t)&&(e=e.replace(/(^https?:\/\/[^\/]+).*/i,"$1")),/^(https?:)?\/\//i.test(t)||/^data:.*,.*$/i.test(t)||/^blob:.*$/i.test(t)?t:e+t)}}const tl=new WeakMap;class Rg extends cr{constructor(t){super(t),this.isImageBitmapLoader=!0,typeof createImageBitmap>"u"&&wt("ImageBitmapLoader: createImageBitmap() not supported."),typeof fetch>"u"&&wt("ImageBitmapLoader: fetch() not supported."),this.options={premultiplyAlpha:"none"},this._abortController=new AbortController}setOptions(t){return this.options=t,this}load(t,e,n,i){t===void 0&&(t=""),this.path!==void 0&&(t=this.path+t),t=this.manager.resolveURL(t);const s=this,o=xi.get(`image-bitmap:${t}`);if(o!==void 0){if(s.manager.itemStart(t),o.then){o.then(c=>{tl.has(o)===!0?(i&&i(tl.get(o)),s.manager.itemError(t),s.manager.itemEnd(t)):(e&&e(c),s.manager.itemEnd(t))});return}setTimeout(function(){e&&e(o),s.manager.itemEnd(t)},0);return}const a={};a.credentials=this.crossOrigin==="anonymous"?"same-origin":"include",a.headers=this.requestHeader,a.signal=typeof AbortSignal.any=="function"?AbortSignal.any([this._abortController.signal,this.manager.abortController.signal]):this._abortController.signal;const l=fetch(t,a).then(function(c){return c.blob()}).then(function(c){return createImageBitmap(c,Object.assign(s.options,{colorSpaceConversion:"none"}))}).then(function(c){xi.add(`image-bitmap:${t}`,c),e&&e(c),s.manager.itemEnd(t)}).catch(function(c){i&&i(c),tl.set(l,c),xi.remove(`image-bitmap:${t}`),s.manager.itemError(t),s.manager.itemEnd(t)});xi.add(`image-bitmap:${t}`,l),s.manager.itemStart(t)}abort(){return this._abortController.abort(),this._abortController=new AbortController,this}}const Rs=-90,Ps=1;class Pg extends Re{constructor(t,e,n){super(),this.type="CubeCamera",this.renderTarget=n,this.coordinateSystem=null,this.activeMipmapLevel=0;const i=new tn(Rs,Ps,t,e);i.layers=this.layers,this.add(i);const s=new tn(Rs,Ps,t,e);s.layers=this.layers,this.add(s);const o=new tn(Rs,Ps,t,e);o.layers=this.layers,this.add(o);const a=new tn(Rs,Ps,t,e);a.layers=this.layers,this.add(a);const l=new tn(Rs,Ps,t,e);l.layers=this.layers,this.add(l);const c=new tn(Rs,Ps,t,e);c.layers=this.layers,this.add(c)}updateCoordinateSystem(){const t=this.coordinateSystem,e=this.children.concat(),[n,i,s,o,a,l]=e;for(const c of e)this.remove(c);if(t===ni)n.up.set(0,1,0),n.lookAt(1,0,0),i.up.set(0,1,0),i.lookAt(-1,0,0),s.up.set(0,0,-1),s.lookAt(0,1,0),o.up.set(0,0,1),o.lookAt(0,-1,0),a.up.set(0,1,0),a.lookAt(0,0,1),l.up.set(0,1,0),l.lookAt(0,0,-1);else if(t===Gr)n.up.set(0,-1,0),n.lookAt(-1,0,0),i.up.set(0,-1,0),i.lookAt(1,0,0),s.up.set(0,0,1),s.lookAt(0,1,0),o.up.set(0,0,-1),o.lookAt(0,-1,0),a.up.set(0,-1,0),a.lookAt(0,0,1),l.up.set(0,-1,0),l.lookAt(0,0,-1);else throw new Error("THREE.CubeCamera.updateCoordinateSystem(): Invalid coordinate system: "+t);for(const c of e)this.add(c),c.updateMatrixWorld()}update(t,e){this.parent===null&&this.updateMatrixWorld();const{renderTarget:n,activeMipmapLevel:i}=this;this.coordinateSystem!==t.coordinateSystem&&(this.coordinateSystem=t.coordinateSystem,this.updateCoordinateSystem());const[s,o,a,l,c,h]=this.children,u=t.getRenderTarget(),d=t.getActiveCubeFace(),f=t.getActiveMipmapLevel(),m=t.xr.enabled;t.xr.enabled=!1;const _=n.texture.generateMipmaps;n.texture.generateMipmaps=!1;let g=!1;t.isWebGLRenderer===!0?g=t.state.buffers.depth.getReversed():g=t.reversedDepthBuffer,t.setRenderTarget(n,0,i),g&&t.autoClear===!1&&t.clearDepth(),t.render(e,s),t.setRenderTarget(n,1,i),g&&t.autoClear===!1&&t.clearDepth(),t.render(e,o),t.setRenderTarget(n,2,i),g&&t.autoClear===!1&&t.clearDepth(),t.render(e,a),t.setRenderTarget(n,3,i),g&&t.autoClear===!1&&t.clearDepth(),t.render(e,l),t.setRenderTarget(n,4,i),g&&t.autoClear===!1&&t.clearDepth(),t.render(e,c),n.texture.generateMipmaps=_,t.setRenderTarget(n,5,i),g&&t.autoClear===!1&&t.clearDepth(),t.render(e,h),t.setRenderTarget(u,d,f),t.xr.enabled=m,n.texture.needsPMREMUpdate=!0}}class Ig extends tn{constructor(t=[]){super(),this.isArrayCamera=!0,this.isMultiViewCamera=!1,this.cameras=t}}class Lg{constructor(t,e,n){this.binding=t,this.valueSize=n;let i,s,o;switch(e){case"quaternion":i=this._slerp,s=this._slerpAdditive,o=this._setAdditiveIdentityQuaternion,this.buffer=new Float64Array(n*6),this._workIndex=5;break;case"string":case"bool":i=this._select,s=this._select,o=this._setAdditiveIdentityOther,this.buffer=new Array(n*5);break;default:i=this._lerp,s=this._lerpAdditive,o=this._setAdditiveIdentityNumeric,this.buffer=new Float64Array(n*5)}this._mixBufferRegion=i,this._mixBufferRegionAdditive=s,this._setIdentity=o,this._origIndex=3,this._addIndex=4,this.cumulativeWeight=0,this.cumulativeWeightAdditive=0,this.useCount=0,this.referenceCount=0}accumulate(t,e){const n=this.buffer,i=this.valueSize,s=t*i+i;let o=this.cumulativeWeight;if(o===0){for(let a=0;a!==i;++a)n[s+a]=n[a];o=e}else{o+=e;const a=e/o;this._mixBufferRegion(n,s,0,a,i)}this.cumulativeWeight=o}accumulateAdditive(t){const e=this.buffer,n=this.valueSize,i=n*this._addIndex;this.cumulativeWeightAdditive===0&&this._setIdentity(),this._mixBufferRegionAdditive(e,i,0,t,n),this.cumulativeWeightAdditive+=t}apply(t){const e=this.valueSize,n=this.buffer,i=t*e+e,s=this.cumulativeWeight,o=this.cumulativeWeightAdditive,a=this.binding;if(this.cumulativeWeight=0,this.cumulativeWeightAdditive=0,s<1){const l=e*this._origIndex;this._mixBufferRegion(n,i,l,1-s,e)}o>0&&this._mixBufferRegionAdditive(n,i,this._addIndex*e,1,e);for(let l=e,c=e+e;l!==c;++l)if(n[l]!==n[l+e]){a.setValue(n,i);break}}saveOriginalState(){const t=this.binding,e=this.buffer,n=this.valueSize,i=n*this._origIndex;t.getValue(e,i);for(let s=n,o=i;s!==o;++s)e[s]=e[i+s%n];this._setIdentity(),this.cumulativeWeight=0,this.cumulativeWeightAdditive=0}restoreOriginalState(){const t=this.valueSize*3;this.binding.setValue(this.buffer,t)}_setAdditiveIdentityNumeric(){const t=this._addIndex*this.valueSize,e=t+this.valueSize;for(let n=t;n<e;n++)this.buffer[n]=0}_setAdditiveIdentityQuaternion(){this._setAdditiveIdentityNumeric(),this.buffer[this._addIndex*this.valueSize+3]=1}_setAdditiveIdentityOther(){const t=this._origIndex*this.valueSize,e=this._addIndex*this.valueSize;for(let n=0;n<this.valueSize;n++)this.buffer[e+n]=this.buffer[t+n]}_select(t,e,n,i,s){if(i>=.5)for(let o=0;o!==s;++o)t[e+o]=t[n+o]}_slerp(t,e,n,i){mn.slerpFlat(t,e,t,e,t,n,i)}_slerpAdditive(t,e,n,i,s){const o=this._workIndex*s;mn.multiplyQuaternionsFlat(t,o,t,e,t,n),mn.slerpFlat(t,e,t,e,t,o,i)}_lerp(t,e,n,i,s){const o=1-i;for(let a=0;a!==s;++a){const l=e+a;t[l]=t[l]*o+t[n+a]*i}}_lerpAdditive(t,e,n,i,s){for(let o=0;o!==s;++o){const a=e+o;t[a]=t[a]+t[n+o]*i}}}const Jc="\\[\\]\\.:\\/",Dg=new RegExp("["+Jc+"]","g"),Qc="[^"+Jc+"]",Ng="[^"+Jc.replace("\\.","")+"]",Ug=/((?:WC+[\/:])*)/.source.replace("WC",Qc),Fg=/(WCOD+)?/.source.replace("WCOD",Ng),Og=/(?:\.(WC+)(?:\[(.+)\])?)?/.source.replace("WC",Qc),kg=/\.(WC+)(?:\[(.+)\])?/.source.replace("WC",Qc),Bg=new RegExp("^"+Ug+Fg+Og+kg+"$"),zg=["material","materials","bones","map"];class Hg{constructor(t,e,n){const i=n||pe.parseTrackName(e);this._targetGroup=t,this._bindings=t.subscribe_(e,i)}getValue(t,e){this.bind();const n=this._targetGroup.nCachedObjects_,i=this._bindings[n];i!==void 0&&i.getValue(t,e)}setValue(t,e){const n=this._bindings;for(let i=this._targetGroup.nCachedObjects_,s=n.length;i!==s;++i)n[i].setValue(t,e)}bind(){const t=this._bindings;for(let e=this._targetGroup.nCachedObjects_,n=t.length;e!==n;++e)t[e].bind()}unbind(){const t=this._bindings;for(let e=this._targetGroup.nCachedObjects_,n=t.length;e!==n;++e)t[e].unbind()}}class pe{constructor(t,e,n){this.path=e,this.parsedPath=n||pe.parseTrackName(e),this.node=pe.findNode(t,this.parsedPath.nodeName),this.rootNode=t,this.getValue=this._getValue_unbound,this.setValue=this._setValue_unbound}static create(t,e,n){return t&&t.isAnimationObjectGroup?new pe.Composite(t,e,n):new pe(t,e,n)}static sanitizeNodeName(t){return t.replace(/\s/g,"_").replace(Dg,"")}static parseTrackName(t){const e=Bg.exec(t);if(e===null)throw new Error("THREE.PropertyBinding: Cannot parse trackName: "+t);const n={nodeName:e[2],objectName:e[3],objectIndex:e[4],propertyName:e[5],propertyIndex:e[6]},i=n.nodeName&&n.nodeName.lastIndexOf(".");if(i!==void 0&&i!==-1){const s=n.nodeName.substring(i+1);zg.indexOf(s)!==-1&&(n.nodeName=n.nodeName.substring(0,i),n.objectName=s)}if(n.propertyName===null||n.propertyName.length===0)throw new Error("THREE.PropertyBinding: can not parse propertyName from trackName: "+t);return n}static findNode(t,e){if(e===void 0||e===""||e==="."||e===-1||e===t.name||e===t.uuid)return t;if(t.skeleton){const n=t.skeleton.getBoneByName(e);if(n!==void 0)return n}if(t.children){const n=function(s){for(let o=0;o<s.length;o++){const a=s[o];if(a.name===e||a.uuid===e)return a;const l=n(a.children);if(l)return l}return null},i=n(t.children);if(i)return i}return null}_getValue_unavailable(){}_setValue_unavailable(){}_getValue_direct(t,e){t[e]=this.targetObject[this.propertyName]}_getValue_array(t,e){const n=this.resolvedProperty;for(let i=0,s=n.length;i!==s;++i)t[e++]=n[i]}_getValue_arrayElement(t,e){t[e]=this.resolvedProperty[this.propertyIndex]}_getValue_toArray(t,e){this.resolvedProperty.toArray(t,e)}_setValue_direct(t,e){this.targetObject[this.propertyName]=t[e]}_setValue_direct_setNeedsUpdate(t,e){this.targetObject[this.propertyName]=t[e],this.targetObject.needsUpdate=!0}_setValue_direct_setMatrixWorldNeedsUpdate(t,e){this.targetObject[this.propertyName]=t[e],this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_array(t,e){const n=this.resolvedProperty;for(let i=0,s=n.length;i!==s;++i)n[i]=t[e++]}_setValue_array_setNeedsUpdate(t,e){const n=this.resolvedProperty;for(let i=0,s=n.length;i!==s;++i)n[i]=t[e++];this.targetObject.needsUpdate=!0}_setValue_array_setMatrixWorldNeedsUpdate(t,e){const n=this.resolvedProperty;for(let i=0,s=n.length;i!==s;++i)n[i]=t[e++];this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_arrayElement(t,e){this.resolvedProperty[this.propertyIndex]=t[e]}_setValue_arrayElement_setNeedsUpdate(t,e){this.resolvedProperty[this.propertyIndex]=t[e],this.targetObject.needsUpdate=!0}_setValue_arrayElement_setMatrixWorldNeedsUpdate(t,e){this.resolvedProperty[this.propertyIndex]=t[e],this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_fromArray(t,e){this.resolvedProperty.fromArray(t,e)}_setValue_fromArray_setNeedsUpdate(t,e){this.resolvedProperty.fromArray(t,e),this.targetObject.needsUpdate=!0}_setValue_fromArray_setMatrixWorldNeedsUpdate(t,e){this.resolvedProperty.fromArray(t,e),this.targetObject.matrixWorldNeedsUpdate=!0}_getValue_unbound(t,e){this.bind(),this.getValue(t,e)}_setValue_unbound(t,e){this.bind(),this.setValue(t,e)}bind(){let t=this.node;const e=this.parsedPath,n=e.objectName,i=e.propertyName;let s=e.propertyIndex;if(t||(t=pe.findNode(this.rootNode,e.nodeName),this.node=t),this.getValue=this._getValue_unavailable,this.setValue=this._setValue_unavailable,!t){wt("PropertyBinding: No target node found for track: "+this.path+".");return}if(n){let c=e.objectIndex;switch(n){case"materials":if(!t.material){Ot("PropertyBinding: Can not bind to material as node does not have a material.",this);return}if(!t.material.materials){Ot("PropertyBinding: Can not bind to material.materials as node.material does not have a materials array.",this);return}t=t.material.materials;break;case"bones":if(!t.skeleton){Ot("PropertyBinding: Can not bind to bones as node does not have a skeleton.",this);return}t=t.skeleton.bones;for(let h=0;h<t.length;h++)if(t[h].name===c){c=h;break}break;case"map":if("map"in t){t=t.map;break}if(!t.material){Ot("PropertyBinding: Can not bind to material as node does not have a material.",this);return}if(!t.material.map){Ot("PropertyBinding: Can not bind to material.map as node.material does not have a map.",this);return}t=t.material.map;break;default:if(t[n]===void 0){Ot("PropertyBinding: Can not bind to objectName of node undefined.",this);return}t=t[n]}if(c!==void 0){if(t[c]===void 0){Ot("PropertyBinding: Trying to bind to objectIndex of objectName, but is undefined.",this,t);return}t=t[c]}}const o=t[i];if(o===void 0){const c=e.nodeName;Ot("PropertyBinding: Trying to update property for track: "+c+"."+i+" but it wasn't found.",t);return}let a=this.Versioning.None;this.targetObject=t,t.isMaterial===!0?a=this.Versioning.NeedsUpdate:t.isObject3D===!0&&(a=this.Versioning.MatrixWorldNeedsUpdate);let l=this.BindingType.Direct;if(s!==void 0){if(i==="morphTargetInfluences"){if(!t.geometry){Ot("PropertyBinding: Can not bind to morphTargetInfluences because node does not have a geometry.",this);return}if(!t.geometry.morphAttributes){Ot("PropertyBinding: Can not bind to morphTargetInfluences because node does not have a geometry.morphAttributes.",this);return}t.morphTargetDictionary[s]!==void 0&&(s=t.morphTargetDictionary[s])}l=this.BindingType.ArrayElement,this.resolvedProperty=o,this.propertyIndex=s}else o.fromArray!==void 0&&o.toArray!==void 0?(l=this.BindingType.HasFromToArray,this.resolvedProperty=o):Array.isArray(o)?(l=this.BindingType.EntireArray,this.resolvedProperty=o):this.propertyName=i;this.getValue=this.GetterByBindingType[l],this.setValue=this.SetterByBindingTypeAndVersioning[l][a]}unbind(){this.node=null,this.getValue=this._getValue_unbound,this.setValue=this._setValue_unbound}}pe.Composite=Hg;pe.prototype.BindingType={Direct:0,EntireArray:1,ArrayElement:2,HasFromToArray:3};pe.prototype.Versioning={None:0,NeedsUpdate:1,MatrixWorldNeedsUpdate:2};pe.prototype.GetterByBindingType=[pe.prototype._getValue_direct,pe.prototype._getValue_array,pe.prototype._getValue_arrayElement,pe.prototype._getValue_toArray];pe.prototype.SetterByBindingTypeAndVersioning=[[pe.prototype._setValue_direct,pe.prototype._setValue_direct_setNeedsUpdate,pe.prototype._setValue_direct_setMatrixWorldNeedsUpdate],[pe.prototype._setValue_array,pe.prototype._setValue_array_setNeedsUpdate,pe.prototype._setValue_array_setMatrixWorldNeedsUpdate],[pe.prototype._setValue_arrayElement,pe.prototype._setValue_arrayElement_setNeedsUpdate,pe.prototype._setValue_arrayElement_setMatrixWorldNeedsUpdate],[pe.prototype._setValue_fromArray,pe.prototype._setValue_fromArray_setNeedsUpdate,pe.prototype._setValue_fromArray_setMatrixWorldNeedsUpdate]];class Vg{constructor(t,e,n=null,i=e.blendMode){this._mixer=t,this._clip=e,this._localRoot=n,this.blendMode=i;const s=e.tracks,o=s.length,a=new Array(o),l={endingStart:ks,endingEnd:ks};for(let c=0;c!==o;++c){const h=s[c].createInterpolant(null);a[c]=h,h.settings=l}this._interpolantSettings=l,this._interpolants=a,this._propertyBindings=new Array(o),this._cacheIndex=null,this._byClipCacheIndex=null,this._timeScaleInterpolant=null,this._restoreTimeScale=null,this._weightInterpolant=null,this.loop=yi,this._loopCount=-1,this._startTime=null,this.time=0,this.timeScale=1,this._effectiveTimeScale=1,this.weight=1,this._effectiveWeight=1,this.repetitions=1/0,this.paused=!1,this.enabled=!0,this.clampWhenFinished=!1,this.zeroSlopeAtStart=!0,this.zeroSlopeAtEnd=!0}play(){return this._mixer._activateAction(this),this}stop(){return this._mixer._deactivateAction(this),this.reset()}reset(){return this.paused=!1,this.enabled=!0,this.time=0,this._loopCount=-1,this._startTime=null,this.stopFading().stopWarping()}isRunning(){return this.enabled&&!this.paused&&this.timeScale!==0&&this._startTime===null&&this._mixer._isActiveAction(this)}isScheduled(){return this._mixer._isActiveAction(this)}startAt(t){return this._startTime=t,this}setLoop(t,e){return this.loop=t,this.repetitions=e,this}setEffectiveWeight(t){return this.weight=t,this._effectiveWeight=this.enabled?t:0,this.stopFading()}getEffectiveWeight(){return this._effectiveWeight}fadeIn(t){return this._scheduleFading(t,0,1)}fadeOut(t){return this._scheduleFading(t,1,0)}crossFadeFrom(t,e,n=!1){if(t.fadeOut(e),this.fadeIn(e),n===!0){const i=this._clip.duration,s=t._clip.duration,o=s/i,a=i/s;t._restoreTimeScale=t.timeScale,this._restoreTimeScale=this.timeScale,t.warp(1,o,e),this.warp(a,1,e)}return this}crossFadeTo(t,e,n=!1){return t.crossFadeFrom(this,e,n)}stopFading(){const t=this._weightInterpolant;return t!==null&&(this._weightInterpolant=null,this._mixer._takeBackControlInterpolant(t)),this}setEffectiveTimeScale(t){return this.timeScale=t,this._effectiveTimeScale=this.paused?0:t,this.stopWarping()}getEffectiveTimeScale(){return this._effectiveTimeScale}setDuration(t){return this.timeScale=this._clip.duration/t,this.stopWarping()}syncWith(t){return this.time=t.time,this.timeScale=t.timeScale,this.stopWarping()}halt(t){return this.warp(this._effectiveTimeScale,0,t)}warp(t,e,n){const i=this._mixer,s=i.time,o=this.timeScale;let a=this._timeScaleInterpolant;a===null&&(a=i._lendControlInterpolant(),this._timeScaleInterpolant=a);const l=a.parameterPositions,c=a.sampleValues;return l[0]=s,l[1]=s+n,c[0]=t/o,c[1]=e/o,this}stopWarping(){const t=this._timeScaleInterpolant;return t!==null&&(this._timeScaleInterpolant=null,this._mixer._takeBackControlInterpolant(t)),this._restoreTimeScale=null,this}getMixer(){return this._mixer}getClip(){return this._clip}getRoot(){return this._localRoot||this._mixer._root}_update(t,e,n,i){if(!this.enabled){this._updateWeight(t);return}const s=this._startTime;if(s!==null){const l=(t-s)*n;l<0||n===0?e=0:(this._startTime=null,e=n*l)}e*=this._updateTimeScale(t);const o=this._updateTime(e),a=this._updateWeight(t);if(a>0){const l=this._interpolants,c=this._propertyBindings;switch(this.blendMode){case Jp:for(let h=0,u=l.length;h!==u;++h)l[h].evaluate(o),c[h].accumulateAdditive(a);break;case kc:default:for(let h=0,u=l.length;h!==u;++h)l[h].evaluate(o),c[h].accumulate(i,a)}}}_updateWeight(t){let e=0;if(this.enabled){e=this.weight;const n=this._weightInterpolant;if(n!==null){const i=n.evaluate(t)[0];e*=i,t>n.parameterPositions[1]&&(this.stopFading(),i===0&&(this.enabled=!1))}}return this._effectiveWeight=e,e}_updateTimeScale(t){let e=0;if(!this.paused){e=this.timeScale;const n=this._timeScaleInterpolant;if(n!==null){const i=n.evaluate(t)[0];e*=i,t>n.parameterPositions[1]&&(e===0?this.paused=!0:(this._restoreTimeScale!==null&&(e=this._restoreTimeScale),this.timeScale=e),this.stopWarping())}}return this._effectiveTimeScale=e,e}_updateTime(t){const e=this._clip.duration,n=this.loop;let i=this.time+t,s=this._loopCount;const o=n===jp;if(t===0)return s===-1?i:o&&(s&1)===1?e-i:i;if(n===df){s===-1&&(this._loopCount=0,this._setEndings(!0,!0,!1));t:{if(i>=e)i=e;else if(i<0)i=0;else{this.time=i;break t}this.clampWhenFinished?this.paused=!0:this.enabled=!1,this.time=i,this._mixer.dispatchEvent({type:"finished",action:this,direction:t<0?-1:1})}}else{if(s===-1&&(t>=0?(s=0,this._setEndings(!0,this.repetitions===0,o)):this._setEndings(this.repetitions===0,!0,o)),i>=e||i<0){const a=Math.floor(i/e);i-=e*a,s+=Math.abs(a);const l=this.repetitions-s;if(l<=0)this.clampWhenFinished?this.paused=!0:this.enabled=!1,i=t>0?e:0,this.time=i,this._mixer.dispatchEvent({type:"finished",action:this,direction:t>0?1:-1});else{if(l===1){const c=t<0;this._setEndings(c,!c,o)}else this._setEndings(!1,!1,o);this._loopCount=s,this.time=i,this._mixer.dispatchEvent({type:"loop",action:this,loopDelta:a})}}else this._loopCount=s,this.time=i;if(o&&(s&1)===1)return e-i}return i}_setEndings(t,e,n){const i=this._interpolantSettings;n?(i.endingStart=Bs,i.endingEnd=Bs):(t?i.endingStart=this.zeroSlopeAtStart?Bs:ks:i.endingStart=jo,e?i.endingEnd=this.zeroSlopeAtEnd?Bs:ks:i.endingEnd=jo)}_scheduleFading(t,e,n){const i=this._mixer,s=i.time;let o=this._weightInterpolant;o===null&&(o=i._lendControlInterpolant(),this._weightInterpolant=o);const a=o.parameterPositions,l=o.sampleValues;return a[0]=s,l[0]=e,a[1]=s+t,l[1]=n,this}}const Gg=new Float32Array(1);class Gi extends Ei{constructor(t){super(),this._root=t,this._initMemoryManager(),this._accuIndex=0,this.time=0,this.timeScale=1,typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}_bindAction(t,e){const n=t._localRoot||this._root,i=t._clip.tracks,s=i.length,o=t._propertyBindings,a=t._interpolants,l=n.uuid,c=this._bindingsByRootAndName;let h=c[l];h===void 0&&(h={},c[l]=h);for(let u=0;u!==s;++u){const d=i[u],f=d.name;let m=h[f];if(m!==void 0)++m.referenceCount,o[u]=m;else{if(m=o[u],m!==void 0){m._cacheIndex===null&&(++m.referenceCount,this._addInactiveBinding(m,l,f));continue}const _=e&&e._propertyBindings[u].binding.parsedPath;m=new Lg(pe.create(n,f,_),d.ValueTypeName,d.getValueSize()),++m.referenceCount,this._addInactiveBinding(m,l,f),o[u]=m}a[u].resultBuffer=m.buffer}}_activateAction(t){if(!this._isActiveAction(t)){if(t._cacheIndex===null){const n=(t._localRoot||this._root).uuid,i=t._clip.uuid,s=this._actionsByClip[i];this._bindAction(t,s&&s.knownActions[0]),this._addInactiveAction(t,i,n)}const e=t._propertyBindings;for(let n=0,i=e.length;n!==i;++n){const s=e[n];s.useCount++===0&&(this._lendBinding(s),s.saveOriginalState())}this._lendAction(t)}}_deactivateAction(t){if(this._isActiveAction(t)){const e=t._propertyBindings;for(let n=0,i=e.length;n!==i;++n){const s=e[n];--s.useCount===0&&(s.restoreOriginalState(),this._takeBackBinding(s))}this._takeBackAction(t)}}_initMemoryManager(){this._actions=[],this._nActiveActions=0,this._actionsByClip={},this._bindings=[],this._nActiveBindings=0,this._bindingsByRootAndName={},this._controlInterpolants=[],this._nActiveControlInterpolants=0;const t=this;this.stats={actions:{get total(){return t._actions.length},get inUse(){return t._nActiveActions}},bindings:{get total(){return t._bindings.length},get inUse(){return t._nActiveBindings}},controlInterpolants:{get total(){return t._controlInterpolants.length},get inUse(){return t._nActiveControlInterpolants}}}}_isActiveAction(t){const e=t._cacheIndex;return e!==null&&e<this._nActiveActions}_addInactiveAction(t,e,n){const i=this._actions,s=this._actionsByClip;let o=s[e];if(o===void 0)o={knownActions:[t],actionByRoot:{}},t._byClipCacheIndex=0,s[e]=o;else{const a=o.knownActions;t._byClipCacheIndex=a.length,a.push(t)}t._cacheIndex=i.length,i.push(t),o.actionByRoot[n]=t}_removeInactiveAction(t){const e=this._actions,n=e[e.length-1],i=t._cacheIndex;n._cacheIndex=i,e[i]=n,e.pop(),t._cacheIndex=null;const s=t._clip.uuid,o=this._actionsByClip,a=o[s],l=a.knownActions,c=l[l.length-1],h=t._byClipCacheIndex;c._byClipCacheIndex=h,l[h]=c,l.pop(),t._byClipCacheIndex=null;const u=a.actionByRoot,d=(t._localRoot||this._root).uuid;delete u[d],l.length===0&&delete o[s],this._removeInactiveBindingsForAction(t)}_removeInactiveBindingsForAction(t){const e=t._propertyBindings;for(let n=0,i=e.length;n!==i;++n){const s=e[n];--s.referenceCount===0&&this._removeInactiveBinding(s)}}_lendAction(t){const e=this._actions,n=t._cacheIndex,i=this._nActiveActions++,s=e[i];t._cacheIndex=i,e[i]=t,s._cacheIndex=n,e[n]=s}_takeBackAction(t){const e=this._actions,n=t._cacheIndex,i=--this._nActiveActions,s=e[i];t._cacheIndex=i,e[i]=t,s._cacheIndex=n,e[n]=s}_addInactiveBinding(t,e,n){const i=this._bindingsByRootAndName,s=this._bindings;let o=i[e];o===void 0&&(o={},i[e]=o),o[n]=t,t._cacheIndex=s.length,s.push(t)}_removeInactiveBinding(t){const e=this._bindings,n=t.binding,i=n.rootNode.uuid,s=n.path,o=this._bindingsByRootAndName,a=o[i],l=e[e.length-1],c=t._cacheIndex;l._cacheIndex=c,e[c]=l,e.pop(),delete a[s],Object.keys(a).length===0&&delete o[i]}_lendBinding(t){const e=this._bindings,n=t._cacheIndex,i=this._nActiveBindings++,s=e[i];t._cacheIndex=i,e[i]=t,s._cacheIndex=n,e[n]=s}_takeBackBinding(t){const e=this._bindings,n=t._cacheIndex,i=--this._nActiveBindings,s=e[i];t._cacheIndex=i,e[i]=t,s._cacheIndex=n,e[n]=s}_lendControlInterpolant(){const t=this._controlInterpolants,e=this._nActiveControlInterpolants++;let n=t[e];return n===void 0&&(n=new If(new Float32Array(2),new Float32Array(2),1,Gg),n.__cacheIndex=e,t[e]=n),n}_takeBackControlInterpolant(t){const e=this._controlInterpolants,n=t.__cacheIndex,i=--this._nActiveControlInterpolants,s=e[i];t.__cacheIndex=i,e[i]=t,s.__cacheIndex=n,e[n]=s}clipAction(t,e,n){const i=e||this._root,s=i.uuid;let o=typeof t=="string"?pc.findByName(i,t):t;const a=o!==null?o.uuid:t,l=this._actionsByClip[a];let c=null;if(n===void 0&&(o!==null?n=o.blendMode:n=kc),l!==void 0){const u=l.actionByRoot[s];if(u!==void 0&&u.blendMode===n)return u;c=l.knownActions[0],o===null&&(o=c._clip)}if(o===null)return null;const h=new Vg(this,o,e,n);return this._bindAction(h,c),this._addInactiveAction(h,a,s),h}existingAction(t,e){const n=e||this._root,i=n.uuid,s=typeof t=="string"?pc.findByName(n,t):t,o=s?s.uuid:t,a=this._actionsByClip[o];return a!==void 0&&a.actionByRoot[i]||null}stopAllAction(){const t=this._actions,e=this._nActiveActions;for(let n=e-1;n>=0;--n)t[n].stop();return this}update(t){t*=this.timeScale;const e=this._actions,n=this._nActiveActions,i=this.time+=t,s=Math.sign(t),o=this._accuIndex^=1;for(let c=0;c!==n;++c)e[c]._update(i,t,s,o);const a=this._bindings,l=this._nActiveBindings;for(let c=0;c!==l;++c)a[c].apply(o);return this}setTime(t){this.time=0;for(let e=0;e<this._actions.length;e++)this._actions[e].time=0;return this.update(t)}getRoot(){return this._root}uncacheClip(t){const e=this._actions,n=t.uuid,i=this._actionsByClip,s=i[n];if(s!==void 0){const o=s.knownActions;for(let a=0,l=o.length;a!==l;++a){const c=o[a];this._deactivateAction(c);const h=c._cacheIndex,u=e[e.length-1];c._cacheIndex=null,c._byClipCacheIndex=null,u._cacheIndex=h,e[h]=u,e.pop(),this._removeInactiveBindingsForAction(c)}delete i[n]}}uncacheRoot(t){const e=t.uuid,n=this._actionsByClip;for(const o in n){const a=n[o].actionByRoot,l=a[e];l!==void 0&&(this._deactivateAction(l),this._removeInactiveAction(l))}const i=this._bindingsByRootAndName,s=i[e];if(s!==void 0)for(const o in s){const a=s[o];a.restoreOriginalState(),this._removeInactiveBinding(a)}}uncacheAction(t,e){const n=this.existingAction(t,e);n!==null&&(this._deactivateAction(n),this._removeInactiveAction(n))}}const Su=new Ht;class Wg{constructor(t,e,n=0,i=1/0){this.ray=new rr(t,e),this.near=n,this.far=i,this.camera=null,this.layers=new Gc,this.params={Mesh:{},Line:{threshold:1},LOD:{},Points:{threshold:1},Sprite:{}}}set(t,e){this.ray.set(t,e)}setFromCamera(t,e){e.isPerspectiveCamera?(this.ray.origin.setFromMatrixPosition(e.matrixWorld),this.ray.direction.set(t.x,t.y,.5).unproject(e).sub(this.ray.origin).normalize(),this.camera=e):e.isOrthographicCamera?(this.ray.origin.set(t.x,t.y,e.projectionMatrix.elements[14]).unproject(e),this.ray.direction.set(0,0,-1).transformDirection(e.matrixWorld),this.camera=e):Ot("Raycaster: Unsupported camera type: "+e.type)}setFromXRController(t){return Su.identity().extractRotation(t.matrixWorld),this.ray.origin.setFromMatrixPosition(t.matrixWorld),this.ray.direction.set(0,0,-1).applyMatrix4(Su),this}intersectObject(t,e=!0,n=[]){return mc(t,this,n,e),n.sort(wu),n}intersectObjects(t,e=!0,n=[]){for(let i=0,s=t.length;i<s;i++)mc(t[i],this,n,e);return n.sort(wu),n}}function wu(r,t){return r.distance-t.distance}function mc(r,t,e,n){let i=!0;if(r.layers.test(t.layers)&&r.raycast(t,e)===!1&&(i=!1),i===!0&&n===!0){const s=r.children;for(let o=0,a=s.length;o<a;o++)mc(s[o],t,e,!0)}}class Xg{constructor(t=!0){this.autoStart=t,this.startTime=0,this.oldTime=0,this.elapsedTime=0,this.running=!1,wt("Clock: This module has been deprecated. Please use THREE.Timer instead.")}start(){this.startTime=performance.now(),this.oldTime=this.startTime,this.elapsedTime=0,this.running=!0}stop(){this.getElapsedTime(),this.running=!1,this.autoStart=!1}getElapsedTime(){return this.getDelta(),this.elapsedTime}getDelta(){let t=0;if(this.autoStart&&!this.running)return this.start(),0;if(this.running){const e=performance.now();t=(e-this.oldTime)/1e3,this.oldTime=e,this.elapsedTime+=t}return t}}class Eu{constructor(t=1,e=0,n=0){this.radius=t,this.phi=e,this.theta=n}set(t,e,n){return this.radius=t,this.phi=e,this.theta=n,this}copy(t){return this.radius=t.radius,this.phi=t.phi,this.theta=t.theta,this}makeSafe(){return this.phi=Kt(this.phi,1e-6,Math.PI-1e-6),this}setFromVector3(t){return this.setFromCartesianCoords(t.x,t.y,t.z)}setFromCartesianCoords(t,e,n){return this.radius=Math.sqrt(t*t+e*e+n*n),this.radius===0?(this.theta=0,this.phi=0):(this.theta=Math.atan2(t,n),this.phi=Math.acos(Kt(e/this.radius,-1,1))),this}clone(){return new this.constructor().copy(this)}}const Mh=class Mh{constructor(t,e,n,i){this.elements=[1,0,0,1],t!==void 0&&this.set(t,e,n,i)}identity(){return this.set(1,0,0,1),this}fromArray(t,e=0){for(let n=0;n<4;n++)this.elements[n]=t[n+e];return this}set(t,e,n,i){const s=this.elements;return s[0]=t,s[2]=e,s[1]=n,s[3]=i,this}};Mh.prototype.isMatrix2=!0;let Tu=Mh;class Au extends wf{constructor(t=10,e=10,n=4473924,i=8947848){n=new Et(n),i=new Et(i);const s=e/2,o=t/e,a=t/2,l=[],c=[];for(let d=0,f=0,m=-a;d<=e;d++,m+=o){l.push(-a,0,m,a,0,m),l.push(m,0,-a,m,0,a);const _=d===s?n:i;_.toArray(c,f),f+=3,_.toArray(c,f),f+=3,_.toArray(c,f),f+=3,_.toArray(c,f),f+=3}const h=new De;h.setAttribute("position",new he(l,3)),h.setAttribute("color",new he(c,3));const u=new as({vertexColors:!0,toneMapped:!1});super(h,u),this.type="GridHelper"}dispose(){this.geometry.dispose(),this.material.dispose()}}class qg extends Ei{constructor(t,e=null){super(),this.object=t,this.domElement=e,this.enabled=!0,this.state=-1,this.keys={},this.mouseButtons={LEFT:null,MIDDLE:null,RIGHT:null},this.touches={ONE:null,TWO:null}}connect(t){if(t===void 0){wt("Controls: connect() now requires an element.");return}this.domElement!==null&&this.disconnect(),this.domElement=t}disconnect(){}dispose(){}update(){}}function Cu(r,t,e,n){const i=$g(n);switch(e){case hf:return r*t;case Nc:return r*t/i.components*i.byteLength;case Uc:return r*t/i.components*i.byteLength;case os:return r*t*2/i.components*i.byteLength;case Fc:return r*t*2/i.components*i.byteLength;case uf:return r*t*3/i.components*i.byteLength;case Un:return r*t*4/i.components*i.byteLength;case Oc:return r*t*4/i.components*i.byteLength;case Vo:case Go:return Math.floor((r+3)/4)*Math.floor((t+3)/4)*8;case Wo:case Xo:return Math.floor((r+3)/4)*Math.floor((t+3)/4)*16;case Nl:case Fl:return Math.max(r,16)*Math.max(t,8)/4;case Dl:case Ul:return Math.max(r,8)*Math.max(t,8)/2;case Ol:case kl:case zl:case Hl:return Math.floor((r+3)/4)*Math.floor((t+3)/4)*8;case Bl:case Ko:case Vl:return Math.floor((r+3)/4)*Math.floor((t+3)/4)*16;case Gl:return Math.floor((r+3)/4)*Math.floor((t+3)/4)*16;case Wl:return Math.floor((r+4)/5)*Math.floor((t+3)/4)*16;case Xl:return Math.floor((r+4)/5)*Math.floor((t+4)/5)*16;case ql:return Math.floor((r+5)/6)*Math.floor((t+4)/5)*16;case $l:return Math.floor((r+5)/6)*Math.floor((t+5)/6)*16;case Yl:return Math.floor((r+7)/8)*Math.floor((t+4)/5)*16;case Kl:return Math.floor((r+7)/8)*Math.floor((t+5)/6)*16;case Zl:return Math.floor((r+7)/8)*Math.floor((t+7)/8)*16;case jl:return Math.floor((r+9)/10)*Math.floor((t+4)/5)*16;case Jl:return Math.floor((r+9)/10)*Math.floor((t+5)/6)*16;case Ql:return Math.floor((r+9)/10)*Math.floor((t+7)/8)*16;case tc:return Math.floor((r+9)/10)*Math.floor((t+9)/10)*16;case ec:return Math.floor((r+11)/12)*Math.floor((t+9)/10)*16;case nc:return Math.floor((r+11)/12)*Math.floor((t+11)/12)*16;case ic:case sc:case rc:return Math.ceil(r/4)*Math.ceil(t/4)*16;case oc:case ac:return Math.ceil(r/4)*Math.ceil(t/4)*8;case Zo:case lc:return Math.ceil(r/4)*Math.ceil(t/4)*16}throw new Error(`Unable to determine texture byte length for ${e} format.`)}function $g(r){switch(r){case wn:case of:return{byteLength:1,components:1};case Br:case af:case Si:return{byteLength:2,components:1};case Lc:case Dc:return{byteLength:2,components:4};case oi:case Ic:case Nn:return{byteLength:4,components:1};case lf:case cf:return{byteLength:4,components:3}}throw new Error(`THREE.TextureUtils: Unknown texture type ${r}.`)}typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("register",{detail:{revision:Pc}}));typeof window<"u"&&(window.__THREE__?wt("WARNING: Multiple instances of Three.js being imported."):window.__THREE__=Pc);/**
 * @license
 * Copyright 2010-2026 Three.js Authors
 * SPDX-License-Identifier: MIT
 */function Ff(){let r=null,t=!1,e=null,n=null;function i(s,o){e(s,o),n=r.requestAnimationFrame(i)}return{start:function(){t!==!0&&e!==null&&r!==null&&(n=r.requestAnimationFrame(i),t=!0)},stop:function(){r!==null&&r.cancelAnimationFrame(n),t=!1},setAnimationLoop:function(s){e=s},setContext:function(s){r=s}}}function Yg(r){const t=new WeakMap;function e(a,l){const c=a.array,h=a.usage,u=c.byteLength,d=r.createBuffer();r.bindBuffer(l,d),r.bufferData(l,c,h),a.onUploadCallback();let f;if(c instanceof Float32Array)f=r.FLOAT;else if(typeof Float16Array<"u"&&c instanceof Float16Array)f=r.HALF_FLOAT;else if(c instanceof Uint16Array)a.isFloat16BufferAttribute?f=r.HALF_FLOAT:f=r.UNSIGNED_SHORT;else if(c instanceof Int16Array)f=r.SHORT;else if(c instanceof Uint32Array)f=r.UNSIGNED_INT;else if(c instanceof Int32Array)f=r.INT;else if(c instanceof Int8Array)f=r.BYTE;else if(c instanceof Uint8Array)f=r.UNSIGNED_BYTE;else if(c instanceof Uint8ClampedArray)f=r.UNSIGNED_BYTE;else throw new Error("THREE.WebGLAttributes: Unsupported buffer data format: "+c);return{buffer:d,type:f,bytesPerElement:c.BYTES_PER_ELEMENT,version:a.version,size:u}}function n(a,l,c){const h=l.array,u=l.updateRanges;if(r.bindBuffer(c,a),u.length===0)r.bufferSubData(c,0,h);else{u.sort((f,m)=>f.start-m.start);let d=0;for(let f=1;f<u.length;f++){const m=u[d],_=u[f];_.start<=m.start+m.count+1?m.count=Math.max(m.count,_.start+_.count-m.start):(++d,u[d]=_)}u.length=d+1;for(let f=0,m=u.length;f<m;f++){const _=u[f];r.bufferSubData(c,_.start*h.BYTES_PER_ELEMENT,h,_.start,_.count)}l.clearUpdateRanges()}l.onUploadCallback()}function i(a){return a.isInterleavedBufferAttribute&&(a=a.data),t.get(a)}function s(a){a.isInterleavedBufferAttribute&&(a=a.data);const l=t.get(a);l&&(r.deleteBuffer(l.buffer),t.delete(a))}function o(a,l){if(a.isInterleavedBufferAttribute&&(a=a.data),a.isGLBufferAttribute){const h=t.get(a);(!h||h.version<a.version)&&t.set(a,{buffer:a.buffer,type:a.type,bytesPerElement:a.elementSize,version:a.version});return}const c=t.get(a);if(c===void 0)t.set(a,e(a,l));else if(c.version<a.version){if(c.size!==a.array.byteLength)throw new Error("THREE.WebGLAttributes: The size of the buffer attribute's array buffer does not match the original size. Resizing buffer attributes is not supported.");n(c.buffer,a,l),c.version=a.version}}return{get:i,remove:s,update:o}}var Kg=`#ifdef USE_ALPHAHASH
	if ( diffuseColor.a < getAlphaHashThreshold( vPosition ) ) discard;
#endif`,Zg=`#ifdef USE_ALPHAHASH
	const float ALPHA_HASH_SCALE = 0.05;
	float hash2D( vec2 value ) {
		return fract( 1.0e4 * sin( 17.0 * value.x + 0.1 * value.y ) * ( 0.1 + abs( sin( 13.0 * value.y + value.x ) ) ) );
	}
	float hash3D( vec3 value ) {
		return hash2D( vec2( hash2D( value.xy ), value.z ) );
	}
	float getAlphaHashThreshold( vec3 position ) {
		float maxDeriv = max(
			length( dFdx( position.xyz ) ),
			length( dFdy( position.xyz ) )
		);
		float pixScale = 1.0 / ( ALPHA_HASH_SCALE * maxDeriv );
		vec2 pixScales = vec2(
			exp2( floor( log2( pixScale ) ) ),
			exp2( ceil( log2( pixScale ) ) )
		);
		vec2 alpha = vec2(
			hash3D( floor( pixScales.x * position.xyz ) ),
			hash3D( floor( pixScales.y * position.xyz ) )
		);
		float lerpFactor = fract( log2( pixScale ) );
		float x = ( 1.0 - lerpFactor ) * alpha.x + lerpFactor * alpha.y;
		float a = min( lerpFactor, 1.0 - lerpFactor );
		vec3 cases = vec3(
			x * x / ( 2.0 * a * ( 1.0 - a ) ),
			( x - 0.5 * a ) / ( 1.0 - a ),
			1.0 - ( ( 1.0 - x ) * ( 1.0 - x ) / ( 2.0 * a * ( 1.0 - a ) ) )
		);
		float threshold = ( x < ( 1.0 - a ) )
			? ( ( x < a ) ? cases.x : cases.y )
			: cases.z;
		return clamp( threshold , 1.0e-6, 1.0 );
	}
#endif`,jg=`#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, vAlphaMapUv ).g;
#endif`,Jg=`#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,Qg=`#ifdef USE_ALPHATEST
	#ifdef ALPHA_TO_COVERAGE
	diffuseColor.a = smoothstep( alphaTest, alphaTest + fwidth( diffuseColor.a ), diffuseColor.a );
	if ( diffuseColor.a == 0.0 ) discard;
	#else
	if ( diffuseColor.a < alphaTest ) discard;
	#endif
#endif`,t_=`#ifdef USE_ALPHATEST
	uniform float alphaTest;
#endif`,e_=`#ifdef USE_AOMAP
	float ambientOcclusion = ( texture2D( aoMap, vAoMapUv ).r - 1.0 ) * aoMapIntensity + 1.0;
	reflectedLight.indirectDiffuse *= ambientOcclusion;
	#if defined( USE_CLEARCOAT ) 
		clearcoatSpecularIndirect *= ambientOcclusion;
	#endif
	#if defined( USE_SHEEN ) 
		sheenSpecularIndirect *= ambientOcclusion;
	#endif
	#if defined( USE_ENVMAP ) && defined( STANDARD )
		float dotNV = saturate( dot( geometryNormal, geometryViewDir ) );
		reflectedLight.indirectSpecular *= computeSpecularOcclusion( dotNV, ambientOcclusion, material.roughness );
	#endif
#endif`,n_=`#ifdef USE_AOMAP
	uniform sampler2D aoMap;
	uniform float aoMapIntensity;
#endif`,i_=`#ifdef USE_BATCHING
	#if ! defined( GL_ANGLE_multi_draw )
	#define gl_DrawID _gl_DrawID
	uniform int _gl_DrawID;
	#endif
	uniform highp sampler2D batchingTexture;
	uniform highp usampler2D batchingIdTexture;
	mat4 getBatchingMatrix( const in float i ) {
		int size = textureSize( batchingTexture, 0 ).x;
		int j = int( i ) * 4;
		int x = j % size;
		int y = j / size;
		vec4 v1 = texelFetch( batchingTexture, ivec2( x, y ), 0 );
		vec4 v2 = texelFetch( batchingTexture, ivec2( x + 1, y ), 0 );
		vec4 v3 = texelFetch( batchingTexture, ivec2( x + 2, y ), 0 );
		vec4 v4 = texelFetch( batchingTexture, ivec2( x + 3, y ), 0 );
		return mat4( v1, v2, v3, v4 );
	}
	float getIndirectIndex( const in int i ) {
		int size = textureSize( batchingIdTexture, 0 ).x;
		int x = i % size;
		int y = i / size;
		return float( texelFetch( batchingIdTexture, ivec2( x, y ), 0 ).r );
	}
#endif
#ifdef USE_BATCHING_COLOR
	uniform sampler2D batchingColorTexture;
	vec4 getBatchingColor( const in float i ) {
		int size = textureSize( batchingColorTexture, 0 ).x;
		int j = int( i );
		int x = j % size;
		int y = j / size;
		return texelFetch( batchingColorTexture, ivec2( x, y ), 0 );
	}
#endif`,s_=`#ifdef USE_BATCHING
	mat4 batchingMatrix = getBatchingMatrix( getIndirectIndex( gl_DrawID ) );
#endif`,r_=`vec3 transformed = vec3( position );
#ifdef USE_ALPHAHASH
	vPosition = vec3( position );
#endif`,o_=`vec3 objectNormal = vec3( normal );
#ifdef USE_TANGENT
	vec3 objectTangent = vec3( tangent.xyz );
#endif`,a_=`float G_BlinnPhong_Implicit( ) {
	return 0.25;
}
float D_BlinnPhong( const in float shininess, const in float dotNH ) {
	return RECIPROCAL_PI * ( shininess * 0.5 + 1.0 ) * pow( dotNH, shininess );
}
vec3 BRDF_BlinnPhong( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in vec3 specularColor, const in float shininess ) {
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNH = saturate( dot( normal, halfDir ) );
	float dotVH = saturate( dot( viewDir, halfDir ) );
	vec3 F = F_Schlick( specularColor, 1.0, dotVH );
	float G = G_BlinnPhong_Implicit( );
	float D = D_BlinnPhong( shininess, dotNH );
	return F * ( G * D );
} // validated`,l_=`#ifdef USE_IRIDESCENCE
	const mat3 XYZ_TO_REC709 = mat3(
		 3.2404542, -0.9692660,  0.0556434,
		-1.5371385,  1.8760108, -0.2040259,
		-0.4985314,  0.0415560,  1.0572252
	);
	vec3 Fresnel0ToIor( vec3 fresnel0 ) {
		vec3 sqrtF0 = sqrt( fresnel0 );
		return ( vec3( 1.0 ) + sqrtF0 ) / ( vec3( 1.0 ) - sqrtF0 );
	}
	vec3 IorToFresnel0( vec3 transmittedIor, float incidentIor ) {
		return pow2( ( transmittedIor - vec3( incidentIor ) ) / ( transmittedIor + vec3( incidentIor ) ) );
	}
	float IorToFresnel0( float transmittedIor, float incidentIor ) {
		return pow2( ( transmittedIor - incidentIor ) / ( transmittedIor + incidentIor ));
	}
	vec3 evalSensitivity( float OPD, vec3 shift ) {
		float phase = 2.0 * PI * OPD * 1.0e-9;
		vec3 val = vec3( 5.4856e-13, 4.4201e-13, 5.2481e-13 );
		vec3 pos = vec3( 1.6810e+06, 1.7953e+06, 2.2084e+06 );
		vec3 var = vec3( 4.3278e+09, 9.3046e+09, 6.6121e+09 );
		vec3 xyz = val * sqrt( 2.0 * PI * var ) * cos( pos * phase + shift ) * exp( - pow2( phase ) * var );
		xyz.x += 9.7470e-14 * sqrt( 2.0 * PI * 4.5282e+09 ) * cos( 2.2399e+06 * phase + shift[ 0 ] ) * exp( - 4.5282e+09 * pow2( phase ) );
		xyz /= 1.0685e-7;
		vec3 rgb = XYZ_TO_REC709 * xyz;
		return rgb;
	}
	vec3 evalIridescence( float outsideIOR, float eta2, float cosTheta1, float thinFilmThickness, vec3 baseF0 ) {
		vec3 I;
		float iridescenceIOR = mix( outsideIOR, eta2, smoothstep( 0.0, 0.03, thinFilmThickness ) );
		float sinTheta2Sq = pow2( outsideIOR / iridescenceIOR ) * ( 1.0 - pow2( cosTheta1 ) );
		float cosTheta2Sq = 1.0 - sinTheta2Sq;
		if ( cosTheta2Sq < 0.0 ) {
			return vec3( 1.0 );
		}
		float cosTheta2 = sqrt( cosTheta2Sq );
		float R0 = IorToFresnel0( iridescenceIOR, outsideIOR );
		float R12 = F_Schlick( R0, 1.0, cosTheta1 );
		float T121 = 1.0 - R12;
		float phi12 = 0.0;
		if ( iridescenceIOR < outsideIOR ) phi12 = PI;
		float phi21 = PI - phi12;
		vec3 baseIOR = Fresnel0ToIor( clamp( baseF0, 0.0, 0.9999 ) );		vec3 R1 = IorToFresnel0( baseIOR, iridescenceIOR );
		vec3 R23 = F_Schlick( R1, 1.0, cosTheta2 );
		vec3 phi23 = vec3( 0.0 );
		if ( baseIOR[ 0 ] < iridescenceIOR ) phi23[ 0 ] = PI;
		if ( baseIOR[ 1 ] < iridescenceIOR ) phi23[ 1 ] = PI;
		if ( baseIOR[ 2 ] < iridescenceIOR ) phi23[ 2 ] = PI;
		float OPD = 2.0 * iridescenceIOR * thinFilmThickness * cosTheta2;
		vec3 phi = vec3( phi21 ) + phi23;
		vec3 R123 = clamp( R12 * R23, 1e-5, 0.9999 );
		vec3 r123 = sqrt( R123 );
		vec3 Rs = pow2( T121 ) * R23 / ( vec3( 1.0 ) - R123 );
		vec3 C0 = R12 + Rs;
		I = C0;
		vec3 Cm = Rs - T121;
		for ( int m = 1; m <= 2; ++ m ) {
			Cm *= r123;
			vec3 Sm = 2.0 * evalSensitivity( float( m ) * OPD, float( m ) * phi );
			I += Cm * Sm;
		}
		return max( I, vec3( 0.0 ) );
	}
#endif`,c_=`#ifdef USE_BUMPMAP
	uniform sampler2D bumpMap;
	uniform float bumpScale;
	vec2 dHdxy_fwd() {
		vec2 dSTdx = dFdx( vBumpMapUv );
		vec2 dSTdy = dFdy( vBumpMapUv );
		float Hll = bumpScale * texture2D( bumpMap, vBumpMapUv ).x;
		float dBx = bumpScale * texture2D( bumpMap, vBumpMapUv + dSTdx ).x - Hll;
		float dBy = bumpScale * texture2D( bumpMap, vBumpMapUv + dSTdy ).x - Hll;
		return vec2( dBx, dBy );
	}
	vec3 perturbNormalArb( vec3 surf_pos, vec3 surf_norm, vec2 dHdxy, float faceDirection ) {
		vec3 vSigmaX = normalize( dFdx( surf_pos.xyz ) );
		vec3 vSigmaY = normalize( dFdy( surf_pos.xyz ) );
		vec3 vN = surf_norm;
		vec3 R1 = cross( vSigmaY, vN );
		vec3 R2 = cross( vN, vSigmaX );
		float fDet = dot( vSigmaX, R1 ) * faceDirection;
		vec3 vGrad = sign( fDet ) * ( dHdxy.x * R1 + dHdxy.y * R2 );
		return normalize( abs( fDet ) * surf_norm - vGrad );
	}
#endif`,h_=`#if NUM_CLIPPING_PLANES > 0
	vec4 plane;
	#ifdef ALPHA_TO_COVERAGE
		float distanceToPlane, distanceGradient;
		float clipOpacity = 1.0;
		#pragma unroll_loop_start
		for ( int i = 0; i < UNION_CLIPPING_PLANES; i ++ ) {
			plane = clippingPlanes[ i ];
			distanceToPlane = - dot( vClipPosition, plane.xyz ) + plane.w;
			distanceGradient = fwidth( distanceToPlane ) / 2.0;
			clipOpacity *= smoothstep( - distanceGradient, distanceGradient, distanceToPlane );
			if ( clipOpacity == 0.0 ) discard;
		}
		#pragma unroll_loop_end
		#if UNION_CLIPPING_PLANES < NUM_CLIPPING_PLANES
			float unionClipOpacity = 1.0;
			#pragma unroll_loop_start
			for ( int i = UNION_CLIPPING_PLANES; i < NUM_CLIPPING_PLANES; i ++ ) {
				plane = clippingPlanes[ i ];
				distanceToPlane = - dot( vClipPosition, plane.xyz ) + plane.w;
				distanceGradient = fwidth( distanceToPlane ) / 2.0;
				unionClipOpacity *= 1.0 - smoothstep( - distanceGradient, distanceGradient, distanceToPlane );
			}
			#pragma unroll_loop_end
			clipOpacity *= 1.0 - unionClipOpacity;
		#endif
		diffuseColor.a *= clipOpacity;
		if ( diffuseColor.a == 0.0 ) discard;
	#else
		#pragma unroll_loop_start
		for ( int i = 0; i < UNION_CLIPPING_PLANES; i ++ ) {
			plane = clippingPlanes[ i ];
			if ( dot( vClipPosition, plane.xyz ) > plane.w ) discard;
		}
		#pragma unroll_loop_end
		#if UNION_CLIPPING_PLANES < NUM_CLIPPING_PLANES
			bool clipped = true;
			#pragma unroll_loop_start
			for ( int i = UNION_CLIPPING_PLANES; i < NUM_CLIPPING_PLANES; i ++ ) {
				plane = clippingPlanes[ i ];
				clipped = ( dot( vClipPosition, plane.xyz ) > plane.w ) && clipped;
			}
			#pragma unroll_loop_end
			if ( clipped ) discard;
		#endif
	#endif
#endif`,u_=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
	uniform vec4 clippingPlanes[ NUM_CLIPPING_PLANES ];
#endif`,d_=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
#endif`,f_=`#if NUM_CLIPPING_PLANES > 0
	vClipPosition = - mvPosition.xyz;
#endif`,p_=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA )
	diffuseColor *= vColor;
#endif`,m_=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#endif`,g_=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	varying vec4 vColor;
#endif`,__=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	vColor = vec4( 1.0 );
#endif
#ifdef USE_COLOR_ALPHA
	vColor *= color;
#elif defined( USE_COLOR )
	vColor.rgb *= color;
#endif
#ifdef USE_INSTANCING_COLOR
	vColor.rgb *= instanceColor.rgb;
#endif
#ifdef USE_BATCHING_COLOR
	vColor *= getBatchingColor( getIndirectIndex( gl_DrawID ) );
#endif`,x_=`#define PI 3.141592653589793
#define PI2 6.283185307179586
#define PI_HALF 1.5707963267948966
#define RECIPROCAL_PI 0.3183098861837907
#define RECIPROCAL_PI2 0.15915494309189535
#define EPSILON 1e-6
#ifndef saturate
#define saturate( a ) clamp( a, 0.0, 1.0 )
#endif
#define whiteComplement( a ) ( 1.0 - saturate( a ) )
float pow2( const in float x ) { return x*x; }
vec3 pow2( const in vec3 x ) { return x*x; }
float pow3( const in float x ) { return x*x*x; }
float pow4( const in float x ) { float x2 = x*x; return x2*x2; }
float max3( const in vec3 v ) { return max( max( v.x, v.y ), v.z ); }
float average( const in vec3 v ) { return dot( v, vec3( 0.3333333 ) ); }
highp float rand( const in vec2 uv ) {
	const highp float a = 12.9898, b = 78.233, c = 43758.5453;
	highp float dt = dot( uv.xy, vec2( a,b ) ), sn = mod( dt, PI );
	return fract( sin( sn ) * c );
}
#ifdef HIGH_PRECISION
	float precisionSafeLength( vec3 v ) { return length( v ); }
#else
	float precisionSafeLength( vec3 v ) {
		float maxComponent = max3( abs( v ) );
		return length( v / maxComponent ) * maxComponent;
	}
#endif
struct IncidentLight {
	vec3 color;
	vec3 direction;
	bool visible;
};
struct ReflectedLight {
	vec3 directDiffuse;
	vec3 directSpecular;
	vec3 indirectDiffuse;
	vec3 indirectSpecular;
};
#ifdef USE_ALPHAHASH
	varying vec3 vPosition;
#endif
vec3 transformDirection( in vec3 dir, in mat4 matrix ) {
	return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );
}
#define inverseTransformDirection transformDirectionByInverseViewMatrix
vec3 transformNormalByInverseViewMatrix( in vec3 normal, in mat4 viewMatrix ) {
	return normalize( ( vec4( normal, 0.0 ) * viewMatrix ).xyz );
}
vec3 transformDirectionByInverseViewMatrix( in vec3 dir, in mat4 viewMatrix ) {
	return normalize( ( vec4( dir, 0.0 ) * viewMatrix ).xyz );
}
bool isPerspectiveMatrix( mat4 m ) {
	return m[ 2 ][ 3 ] == - 1.0;
}
vec2 equirectUv( in vec3 dir ) {
	float u = atan( dir.z, dir.x ) * RECIPROCAL_PI2 + 0.5;
	float v = asin( clamp( dir.y, - 1.0, 1.0 ) ) * RECIPROCAL_PI + 0.5;
	return vec2( u, v );
}
vec3 BRDF_Lambert( const in vec3 diffuseColor ) {
	return RECIPROCAL_PI * diffuseColor;
}
vec3 F_Schlick( const in vec3 f0, const in float f90, const in float dotVH ) {
	float fresnel = exp2( ( - 5.55473 * dotVH - 6.98316 ) * dotVH );
	return f0 * ( 1.0 - fresnel ) + ( f90 * fresnel );
}
float F_Schlick( const in float f0, const in float f90, const in float dotVH ) {
	float fresnel = exp2( ( - 5.55473 * dotVH - 6.98316 ) * dotVH );
	return f0 * ( 1.0 - fresnel ) + ( f90 * fresnel );
} // validated`,v_=`#ifdef ENVMAP_TYPE_CUBE_UV
	#define cubeUV_minMipLevel 4.0
	#define cubeUV_minTileSize 16.0
	float getFace( vec3 direction ) {
		vec3 absDirection = abs( direction );
		float face = - 1.0;
		if ( absDirection.x > absDirection.z ) {
			if ( absDirection.x > absDirection.y )
				face = direction.x > 0.0 ? 0.0 : 3.0;
			else
				face = direction.y > 0.0 ? 1.0 : 4.0;
		} else {
			if ( absDirection.z > absDirection.y )
				face = direction.z > 0.0 ? 2.0 : 5.0;
			else
				face = direction.y > 0.0 ? 1.0 : 4.0;
		}
		return face;
	}
	vec2 getUV( vec3 direction, float face ) {
		vec2 uv;
		if ( face == 0.0 ) {
			uv = vec2( direction.z, direction.y ) / abs( direction.x );
		} else if ( face == 1.0 ) {
			uv = vec2( - direction.x, - direction.z ) / abs( direction.y );
		} else if ( face == 2.0 ) {
			uv = vec2( - direction.x, direction.y ) / abs( direction.z );
		} else if ( face == 3.0 ) {
			uv = vec2( - direction.z, direction.y ) / abs( direction.x );
		} else if ( face == 4.0 ) {
			uv = vec2( - direction.x, direction.z ) / abs( direction.y );
		} else {
			uv = vec2( direction.x, direction.y ) / abs( direction.z );
		}
		return 0.5 * ( uv + 1.0 );
	}
	vec3 bilinearCubeUV( sampler2D envMap, vec3 direction, float mipInt ) {
		float face = getFace( direction );
		float filterInt = max( cubeUV_minMipLevel - mipInt, 0.0 );
		mipInt = max( mipInt, cubeUV_minMipLevel );
		float faceSize = exp2( mipInt );
		highp vec2 uv = getUV( direction, face ) * ( faceSize - 2.0 ) + 1.0;
		if ( face > 2.0 ) {
			uv.y += faceSize;
			face -= 3.0;
		}
		uv.x += face * faceSize;
		uv.x += filterInt * 3.0 * cubeUV_minTileSize;
		uv.y += 4.0 * ( exp2( CUBEUV_MAX_MIP ) - faceSize );
		uv.x *= CUBEUV_TEXEL_WIDTH;
		uv.y *= CUBEUV_TEXEL_HEIGHT;
		#ifdef texture2DGradEXT
			return texture2DGradEXT( envMap, uv, vec2( 0.0 ), vec2( 0.0 ) ).rgb;
		#else
			return texture2D( envMap, uv ).rgb;
		#endif
	}
	#define cubeUV_r0 1.0
	#define cubeUV_m0 - 2.0
	#define cubeUV_r1 0.8
	#define cubeUV_m1 - 1.0
	#define cubeUV_r4 0.4
	#define cubeUV_m4 2.0
	#define cubeUV_r5 0.305
	#define cubeUV_m5 3.0
	#define cubeUV_r6 0.21
	#define cubeUV_m6 4.0
	float roughnessToMip( float roughness ) {
		float mip = 0.0;
		if ( roughness >= cubeUV_r1 ) {
			mip = ( cubeUV_r0 - roughness ) * ( cubeUV_m1 - cubeUV_m0 ) / ( cubeUV_r0 - cubeUV_r1 ) + cubeUV_m0;
		} else if ( roughness >= cubeUV_r4 ) {
			mip = ( cubeUV_r1 - roughness ) * ( cubeUV_m4 - cubeUV_m1 ) / ( cubeUV_r1 - cubeUV_r4 ) + cubeUV_m1;
		} else if ( roughness >= cubeUV_r5 ) {
			mip = ( cubeUV_r4 - roughness ) * ( cubeUV_m5 - cubeUV_m4 ) / ( cubeUV_r4 - cubeUV_r5 ) + cubeUV_m4;
		} else if ( roughness >= cubeUV_r6 ) {
			mip = ( cubeUV_r5 - roughness ) * ( cubeUV_m6 - cubeUV_m5 ) / ( cubeUV_r5 - cubeUV_r6 ) + cubeUV_m5;
		} else {
			mip = - 2.0 * log2( 1.16 * roughness );		}
		return mip;
	}
	vec4 textureCubeUV( sampler2D envMap, vec3 sampleDir, float roughness ) {
		float mip = clamp( roughnessToMip( roughness ), cubeUV_m0, CUBEUV_MAX_MIP );
		float mipF = fract( mip );
		float mipInt = floor( mip );
		vec3 color0 = bilinearCubeUV( envMap, sampleDir, mipInt );
		if ( mipF == 0.0 ) {
			return vec4( color0, 1.0 );
		} else {
			vec3 color1 = bilinearCubeUV( envMap, sampleDir, mipInt + 1.0 );
			return vec4( mix( color0, color1, mipF ), 1.0 );
		}
	}
#endif`,y_=`vec3 transformedNormal = objectNormal;
#ifdef USE_TANGENT
	vec3 transformedTangent = objectTangent;
#endif
#ifdef USE_BATCHING
	mat3 bm = mat3( batchingMatrix );
	transformedNormal /= vec3( dot( bm[ 0 ], bm[ 0 ] ), dot( bm[ 1 ], bm[ 1 ] ), dot( bm[ 2 ], bm[ 2 ] ) );
	transformedNormal = bm * transformedNormal;
	#ifdef USE_TANGENT
		transformedTangent = bm * transformedTangent;
	#endif
#endif
#ifdef USE_INSTANCING
	mat3 im = mat3( instanceMatrix );
	transformedNormal /= vec3( dot( im[ 0 ], im[ 0 ] ), dot( im[ 1 ], im[ 1 ] ), dot( im[ 2 ], im[ 2 ] ) );
	transformedNormal = im * transformedNormal;
	#ifdef USE_TANGENT
		transformedTangent = im * transformedTangent;
	#endif
#endif
transformedNormal = normalMatrix * transformedNormal;
#ifdef FLIP_SIDED
	transformedNormal = - transformedNormal;
#endif
#ifdef USE_TANGENT
	transformedTangent = ( modelViewMatrix * vec4( transformedTangent, 0.0 ) ).xyz;
#endif`,M_=`#ifdef USE_DISPLACEMENTMAP
	uniform sampler2D displacementMap;
	uniform float displacementScale;
	uniform float displacementBias;
#endif`,b_=`#ifdef USE_DISPLACEMENTMAP
	transformed += normalize( objectNormal ) * ( texture2D( displacementMap, vDisplacementMapUv ).x * displacementScale + displacementBias );
#endif`,S_=`#ifdef USE_EMISSIVEMAP
	vec4 emissiveColor = texture2D( emissiveMap, vEmissiveMapUv );
	#ifdef DECODE_VIDEO_TEXTURE_EMISSIVE
		emissiveColor = sRGBTransferEOTF( emissiveColor );
	#endif
	totalEmissiveRadiance *= emissiveColor.rgb;
#endif`,w_=`#ifdef USE_EMISSIVEMAP
	uniform sampler2D emissiveMap;
#endif`,E_="gl_FragColor = linearToOutputTexel( gl_FragColor );",T_=`vec4 LinearTransferOETF( in vec4 value ) {
	return value;
}
vec4 sRGBTransferEOTF( in vec4 value ) {
	return vec4( mix( pow( value.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), value.rgb * 0.0773993808, vec3( lessThanEqual( value.rgb, vec3( 0.04045 ) ) ) ), value.a );
}
vec4 sRGBTransferOETF( in vec4 value ) {
	return vec4( mix( pow( value.rgb, vec3( 0.41666 ) ) * 1.055 - vec3( 0.055 ), value.rgb * 12.92, vec3( lessThanEqual( value.rgb, vec3( 0.0031308 ) ) ) ), value.a );
}`,A_=`#ifdef USE_ENVMAP
	#ifdef ENV_WORLDPOS
		vec3 cameraToFrag;
		if ( isOrthographic ) {
			cameraToFrag = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );
		} else {
			cameraToFrag = normalize( vWorldPosition - cameraPosition );
		}
		vec3 worldNormal = transformNormalByInverseViewMatrix( normal, viewMatrix );
		#ifdef ENVMAP_MODE_REFLECTION
			vec3 reflectVec = reflect( cameraToFrag, worldNormal );
		#else
			vec3 reflectVec = refract( cameraToFrag, worldNormal, refractionRatio );
		#endif
	#else
		vec3 reflectVec = vReflect;
	#endif
	#ifdef ENVMAP_TYPE_CUBE
		vec4 envColor = textureCube( envMap, envMapRotation * reflectVec );
		#ifdef ENVMAP_BLENDING_MULTIPLY
			outgoingLight = mix( outgoingLight, outgoingLight * envColor.xyz, specularStrength * reflectivity );
		#elif defined( ENVMAP_BLENDING_MIX )
			outgoingLight = mix( outgoingLight, envColor.xyz, specularStrength * reflectivity );
		#elif defined( ENVMAP_BLENDING_ADD )
			outgoingLight += envColor.xyz * specularStrength * reflectivity;
		#endif
	#endif
#endif`,C_=`#ifdef USE_ENVMAP
	uniform float envMapIntensity;
	uniform mat3 envMapRotation;
	#ifdef ENVMAP_TYPE_CUBE
		uniform samplerCube envMap;
	#else
		uniform sampler2D envMap;
	#endif
#endif`,R_=`#ifdef USE_ENVMAP
	uniform float reflectivity;
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		varying vec3 vWorldPosition;
		uniform float refractionRatio;
	#else
		varying vec3 vReflect;
	#endif
#endif`,P_=`#ifdef USE_ENVMAP
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		
		varying vec3 vWorldPosition;
	#else
		varying vec3 vReflect;
		uniform float refractionRatio;
	#endif
#endif`,I_=`#ifdef USE_ENVMAP
	#ifdef ENV_WORLDPOS
		vWorldPosition = worldPosition.xyz;
	#else
		vec3 cameraToVertex;
		if ( isOrthographic ) {
			cameraToVertex = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );
		} else {
			cameraToVertex = normalize( worldPosition.xyz - cameraPosition );
		}
		vec3 worldNormal = transformNormalByInverseViewMatrix( transformedNormal, viewMatrix );
		#ifdef ENVMAP_MODE_REFLECTION
			vReflect = reflect( cameraToVertex, worldNormal );
		#else
			vReflect = refract( cameraToVertex, worldNormal, refractionRatio );
		#endif
	#endif
#endif`,L_=`#ifdef USE_FOG
	vFogDepth = - mvPosition.z;
#endif`,D_=`#ifdef USE_FOG
	varying float vFogDepth;
#endif`,N_=`#ifdef USE_FOG
	#ifdef FOG_EXP2
		float fogFactor = 1.0 - exp( - fogDensity * fogDensity * vFogDepth * vFogDepth );
	#else
		float fogFactor = smoothstep( fogNear, fogFar, vFogDepth );
	#endif
	gl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, fogFactor );
#endif`,U_=`#ifdef USE_FOG
	uniform vec3 fogColor;
	varying float vFogDepth;
	#ifdef FOG_EXP2
		uniform float fogDensity;
	#else
		uniform float fogNear;
		uniform float fogFar;
	#endif
#endif`,F_=`#ifdef USE_GRADIENTMAP
	uniform sampler2D gradientMap;
#endif
vec3 getGradientIrradiance( vec3 normal, vec3 lightDirection ) {
	float dotNL = dot( normal, lightDirection );
	vec2 coord = vec2( dotNL * 0.5 + 0.5, 0.0 );
	#ifdef USE_GRADIENTMAP
		return vec3( texture2D( gradientMap, coord ).r );
	#else
		vec2 fw = fwidth( coord ) * 0.5;
		return mix( vec3( 0.7 ), vec3( 1.0 ), smoothstep( 0.7 - fw.x, 0.7 + fw.x, coord.x ) );
	#endif
}`,O_=`#ifdef USE_LIGHTMAP
	uniform sampler2D lightMap;
	uniform float lightMapIntensity;
#endif`,k_=`LambertMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularStrength = specularStrength;`,B_=`varying vec3 vViewPosition;
struct LambertMaterial {
	vec3 diffuseColor;
	float specularStrength;
};
void RE_Direct_Lambert( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in LambertMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Lambert( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in LambertMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_Lambert
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Lambert`,z_=`uniform bool receiveShadow;
uniform vec3 ambientLightColor;
#if defined( USE_LIGHT_PROBES )
	uniform vec3 lightProbe[ 9 ];
#endif
vec3 shGetIrradianceAt( in vec3 normal, in vec3 shCoefficients[ 9 ] ) {
	float x = normal.x, y = normal.y, z = normal.z;
	vec3 result = shCoefficients[ 0 ] * 0.886227;
	result += shCoefficients[ 1 ] * 2.0 * 0.511664 * y;
	result += shCoefficients[ 2 ] * 2.0 * 0.511664 * z;
	result += shCoefficients[ 3 ] * 2.0 * 0.511664 * x;
	result += shCoefficients[ 4 ] * 2.0 * 0.429043 * x * y;
	result += shCoefficients[ 5 ] * 2.0 * 0.429043 * y * z;
	result += shCoefficients[ 6 ] * ( 0.743125 * z * z - 0.247708 );
	result += shCoefficients[ 7 ] * 2.0 * 0.429043 * x * z;
	result += shCoefficients[ 8 ] * 0.429043 * ( x * x - y * y );
	return result;
}
vec3 getLightProbeIrradiance( const in vec3 lightProbe[ 9 ], const in vec3 normal ) {
	vec3 worldNormal = transformNormalByInverseViewMatrix( normal, viewMatrix );
	vec3 irradiance = shGetIrradianceAt( worldNormal, lightProbe );
	return irradiance;
}
vec3 getAmbientLightIrradiance( const in vec3 ambientLightColor ) {
	vec3 irradiance = ambientLightColor;
	return irradiance;
}
float getDistanceAttenuation( const in float lightDistance, const in float cutoffDistance, const in float decayExponent ) {
	float distanceFalloff = 1.0 / max( pow( lightDistance, decayExponent ), 0.01 );
	if ( cutoffDistance > 0.0 ) {
		distanceFalloff *= pow2( saturate( 1.0 - pow4( lightDistance / cutoffDistance ) ) );
	}
	return distanceFalloff;
}
float getSpotAttenuation( const in float coneCosine, const in float penumbraCosine, const in float angleCosine ) {
	return smoothstep( coneCosine, penumbraCosine, angleCosine );
}
#if NUM_DIR_LIGHTS > 0
	struct DirectionalLight {
		vec3 direction;
		vec3 color;
	};
	uniform DirectionalLight directionalLights[ NUM_DIR_LIGHTS ];
	void getDirectionalLightInfo( const in DirectionalLight directionalLight, out IncidentLight light ) {
		light.color = directionalLight.color;
		light.direction = directionalLight.direction;
		light.visible = true;
	}
#endif
#if NUM_POINT_LIGHTS > 0
	struct PointLight {
		vec3 position;
		vec3 color;
		float distance;
		float decay;
	};
	uniform PointLight pointLights[ NUM_POINT_LIGHTS ];
	void getPointLightInfo( const in PointLight pointLight, const in vec3 geometryPosition, out IncidentLight light ) {
		vec3 lVector = pointLight.position - geometryPosition;
		light.direction = normalize( lVector );
		float lightDistance = length( lVector );
		light.color = pointLight.color;
		light.color *= getDistanceAttenuation( lightDistance, pointLight.distance, pointLight.decay );
		light.visible = ( light.color != vec3( 0.0 ) );
	}
#endif
#if NUM_SPOT_LIGHTS > 0
	struct SpotLight {
		vec3 position;
		vec3 direction;
		vec3 color;
		float distance;
		float decay;
		float coneCos;
		float penumbraCos;
	};
	uniform SpotLight spotLights[ NUM_SPOT_LIGHTS ];
	void getSpotLightInfo( const in SpotLight spotLight, const in vec3 geometryPosition, out IncidentLight light ) {
		vec3 lVector = spotLight.position - geometryPosition;
		light.direction = normalize( lVector );
		float angleCos = dot( light.direction, spotLight.direction );
		float spotAttenuation = getSpotAttenuation( spotLight.coneCos, spotLight.penumbraCos, angleCos );
		if ( spotAttenuation > 0.0 ) {
			float lightDistance = length( lVector );
			light.color = spotLight.color * spotAttenuation;
			light.color *= getDistanceAttenuation( lightDistance, spotLight.distance, spotLight.decay );
			light.visible = ( light.color != vec3( 0.0 ) );
		} else {
			light.color = vec3( 0.0 );
			light.visible = false;
		}
	}
#endif
#if NUM_RECT_AREA_LIGHTS > 0
	struct RectAreaLight {
		vec3 color;
		vec3 position;
		vec3 halfWidth;
		vec3 halfHeight;
	};
	uniform sampler2D ltc_1;	uniform sampler2D ltc_2;
	uniform RectAreaLight rectAreaLights[ NUM_RECT_AREA_LIGHTS ];
#endif
#if NUM_HEMI_LIGHTS > 0
	struct HemisphereLight {
		vec3 direction;
		vec3 skyColor;
		vec3 groundColor;
	};
	uniform HemisphereLight hemisphereLights[ NUM_HEMI_LIGHTS ];
	vec3 getHemisphereLightIrradiance( const in HemisphereLight hemiLight, const in vec3 normal ) {
		float dotNL = dot( normal, hemiLight.direction );
		float hemiDiffuseWeight = 0.5 * dotNL + 0.5;
		vec3 irradiance = mix( hemiLight.groundColor, hemiLight.skyColor, hemiDiffuseWeight );
		return irradiance;
	}
#endif
#include <lightprobes_pars_fragment>`,H_=`#ifdef USE_ENVMAP
	vec3 getIBLIrradiance( const in vec3 normal ) {
		#ifdef ENVMAP_TYPE_CUBE_UV
			vec3 worldNormal = transformNormalByInverseViewMatrix( normal, viewMatrix );
			vec4 envMapColor = textureCubeUV( envMap, envMapRotation * worldNormal, 1.0 );
			return PI * envMapColor.rgb * envMapIntensity;
		#else
			return vec3( 0.0 );
		#endif
	}
	vec3 getIBLRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness ) {
		#ifdef ENVMAP_TYPE_CUBE_UV
			vec3 reflectVec = reflect( - viewDir, normal );
			reflectVec = normalize( mix( reflectVec, normal, pow4( roughness ) ) );
			reflectVec = transformDirectionByInverseViewMatrix( reflectVec, viewMatrix );
			vec4 envMapColor = textureCubeUV( envMap, envMapRotation * reflectVec, roughness );
			return envMapColor.rgb * envMapIntensity;
		#else
			return vec3( 0.0 );
		#endif
	}
	#ifdef USE_ANISOTROPY
		vec3 getIBLAnisotropyRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness, const in vec3 bitangent, const in float anisotropy ) {
			#ifdef ENVMAP_TYPE_CUBE_UV
				vec3 bentNormal = cross( bitangent, viewDir );
				bentNormal = normalize( cross( bentNormal, bitangent ) );
				bentNormal = normalize( mix( bentNormal, normal, pow2( pow2( 1.0 - anisotropy * ( 1.0 - roughness ) ) ) ) );
				return getIBLRadiance( viewDir, bentNormal, roughness );
			#else
				return vec3( 0.0 );
			#endif
		}
	#endif
#endif`,V_=`ToonMaterial material;
material.diffuseColor = diffuseColor.rgb;`,G_=`varying vec3 vViewPosition;
struct ToonMaterial {
	vec3 diffuseColor;
};
void RE_Direct_Toon( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in ToonMaterial material, inout ReflectedLight reflectedLight ) {
	vec3 irradiance = getGradientIrradiance( geometryNormal, directLight.direction ) * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Toon( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in ToonMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_Toon
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Toon`,W_=`BlinnPhongMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularColor = specular;
material.specularShininess = shininess;
material.specularStrength = specularStrength;`,X_=`varying vec3 vViewPosition;
struct BlinnPhongMaterial {
	vec3 diffuseColor;
	vec3 specularColor;
	float specularShininess;
	float specularStrength;
};
void RE_Direct_BlinnPhong( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
	reflectedLight.directSpecular += irradiance * BRDF_BlinnPhong( directLight.direction, geometryViewDir, geometryNormal, material.specularColor, material.specularShininess ) * material.specularStrength;
}
void RE_IndirectDiffuse_BlinnPhong( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_BlinnPhong
#define RE_IndirectDiffuse		RE_IndirectDiffuse_BlinnPhong`,q_=`PhysicalMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.diffuseContribution = diffuseColor.rgb * ( 1.0 - metalnessFactor );
material.metalness = metalnessFactor;
vec3 dxy = max( abs( dFdx( nonPerturbedNormal ) ), abs( dFdy( nonPerturbedNormal ) ) );
float geometryRoughness = max( max( dxy.x, dxy.y ), dxy.z );
material.roughness = max( roughnessFactor, 0.0525 );material.roughness += geometryRoughness;
material.roughness = min( material.roughness, 1.0 );
#ifdef IOR
	material.ior = ior;
	#ifdef USE_SPECULAR
		float specularIntensityFactor = specularIntensity;
		vec3 specularColorFactor = specularColor;
		#ifdef USE_SPECULAR_COLORMAP
			specularColorFactor *= texture2D( specularColorMap, vSpecularColorMapUv ).rgb;
		#endif
		#ifdef USE_SPECULAR_INTENSITYMAP
			specularIntensityFactor *= texture2D( specularIntensityMap, vSpecularIntensityMapUv ).a;
		#endif
		material.specularF90 = mix( specularIntensityFactor, 1.0, metalnessFactor );
	#else
		float specularIntensityFactor = 1.0;
		vec3 specularColorFactor = vec3( 1.0 );
		material.specularF90 = 1.0;
	#endif
	material.specularColor = min( pow2( ( material.ior - 1.0 ) / ( material.ior + 1.0 ) ) * specularColorFactor, vec3( 1.0 ) ) * specularIntensityFactor;
	material.specularColorBlended = mix( material.specularColor, diffuseColor.rgb, metalnessFactor );
#else
	material.specularColor = vec3( 0.04 );
	material.specularColorBlended = mix( material.specularColor, diffuseColor.rgb, metalnessFactor );
	material.specularF90 = 1.0;
#endif
#ifdef USE_CLEARCOAT
	material.clearcoat = clearcoat;
	material.clearcoatRoughness = clearcoatRoughness;
	material.clearcoatF0 = vec3( 0.04 );
	material.clearcoatF90 = 1.0;
	#ifdef USE_CLEARCOATMAP
		material.clearcoat *= texture2D( clearcoatMap, vClearcoatMapUv ).x;
	#endif
	#ifdef USE_CLEARCOAT_ROUGHNESSMAP
		material.clearcoatRoughness *= texture2D( clearcoatRoughnessMap, vClearcoatRoughnessMapUv ).y;
	#endif
	material.clearcoat = saturate( material.clearcoat );	material.clearcoatRoughness = max( material.clearcoatRoughness, 0.0525 );
	material.clearcoatRoughness += geometryRoughness;
	material.clearcoatRoughness = min( material.clearcoatRoughness, 1.0 );
#endif
#ifdef USE_DISPERSION
	material.dispersion = dispersion;
#endif
#ifdef USE_IRIDESCENCE
	material.iridescence = iridescence;
	material.iridescenceIOR = iridescenceIOR;
	#ifdef USE_IRIDESCENCEMAP
		material.iridescence *= texture2D( iridescenceMap, vIridescenceMapUv ).r;
	#endif
	#ifdef USE_IRIDESCENCE_THICKNESSMAP
		material.iridescenceThickness = (iridescenceThicknessMaximum - iridescenceThicknessMinimum) * texture2D( iridescenceThicknessMap, vIridescenceThicknessMapUv ).g + iridescenceThicknessMinimum;
	#else
		material.iridescenceThickness = iridescenceThicknessMaximum;
	#endif
#endif
#ifdef USE_SHEEN
	material.sheenColor = sheenColor;
	#ifdef USE_SHEEN_COLORMAP
		material.sheenColor *= texture2D( sheenColorMap, vSheenColorMapUv ).rgb;
	#endif
	material.sheenRoughness = clamp( sheenRoughness, 0.0001, 1.0 );
	#ifdef USE_SHEEN_ROUGHNESSMAP
		material.sheenRoughness *= texture2D( sheenRoughnessMap, vSheenRoughnessMapUv ).a;
	#endif
#endif
#ifdef USE_ANISOTROPY
	#ifdef USE_ANISOTROPYMAP
		mat2 anisotropyMat = mat2( anisotropyVector.x, anisotropyVector.y, - anisotropyVector.y, anisotropyVector.x );
		vec3 anisotropyPolar = texture2D( anisotropyMap, vAnisotropyMapUv ).rgb;
		vec2 anisotropyV = anisotropyMat * normalize( 2.0 * anisotropyPolar.rg - vec2( 1.0 ) ) * anisotropyPolar.b;
	#else
		vec2 anisotropyV = anisotropyVector;
	#endif
	material.anisotropy = length( anisotropyV );
	if( material.anisotropy == 0.0 ) {
		anisotropyV = vec2( 1.0, 0.0 );
	} else {
		anisotropyV /= material.anisotropy;
		material.anisotropy = saturate( material.anisotropy );
	}
	material.alphaT = mix( pow2( material.roughness ), 1.0, pow2( material.anisotropy ) );
	material.anisotropyT = tbn[ 0 ] * anisotropyV.x + tbn[ 1 ] * anisotropyV.y;
	material.anisotropyB = tbn[ 1 ] * anisotropyV.x - tbn[ 0 ] * anisotropyV.y;
#endif`,$_=`uniform sampler2D dfgLUT;
struct PhysicalMaterial {
	vec3 diffuseColor;
	vec3 diffuseContribution;
	vec3 specularColor;
	vec3 specularColorBlended;
	float roughness;
	float metalness;
	float specularF90;
	float dispersion;
	#ifdef USE_CLEARCOAT
		float clearcoat;
		float clearcoatRoughness;
		vec3 clearcoatF0;
		float clearcoatF90;
	#endif
	#ifdef USE_IRIDESCENCE
		float iridescence;
		float iridescenceIOR;
		float iridescenceThickness;
		vec3 iridescenceFresnel;
		vec3 iridescenceF0;
		vec3 iridescenceFresnelDielectric;
		vec3 iridescenceFresnelMetallic;
	#endif
	#ifdef USE_SHEEN
		vec3 sheenColor;
		float sheenRoughness;
	#endif
	#ifdef IOR
		float ior;
	#endif
	#ifdef USE_TRANSMISSION
		float transmission;
		float transmissionAlpha;
		float thickness;
		float attenuationDistance;
		vec3 attenuationColor;
	#endif
	#ifdef USE_ANISOTROPY
		float anisotropy;
		float alphaT;
		vec3 anisotropyT;
		vec3 anisotropyB;
	#endif
};
vec3 clearcoatSpecularDirect = vec3( 0.0 );
vec3 clearcoatSpecularIndirect = vec3( 0.0 );
vec3 sheenSpecularDirect = vec3( 0.0 );
vec3 sheenSpecularIndirect = vec3(0.0 );
vec3 Schlick_to_F0( const in vec3 f, const in float f90, const in float dotVH ) {
    float x = clamp( 1.0 - dotVH, 0.0, 1.0 );
    float x2 = x * x;
    float x5 = clamp( x * x2 * x2, 0.0, 0.9999 );
    return ( f - vec3( f90 ) * x5 ) / ( 1.0 - x5 );
}
float V_GGX_SmithCorrelated( const in float alpha, const in float dotNL, const in float dotNV ) {
	float a2 = pow2( alpha );
	float gv = dotNL * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNV ) );
	float gl = dotNV * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNL ) );
	return 0.5 / max( gv + gl, EPSILON );
}
float D_GGX( const in float alpha, const in float dotNH ) {
	float a2 = pow2( alpha );
	float denom = pow2( dotNH ) * ( a2 - 1.0 ) + 1.0;
	return RECIPROCAL_PI * a2 / pow2( denom );
}
#ifdef USE_ANISOTROPY
	float V_GGX_SmithCorrelated_Anisotropic( const in float alphaT, const in float alphaB, const in float dotTV, const in float dotBV, const in float dotTL, const in float dotBL, const in float dotNV, const in float dotNL ) {
		float gv = dotNL * length( vec3( alphaT * dotTV, alphaB * dotBV, dotNV ) );
		float gl = dotNV * length( vec3( alphaT * dotTL, alphaB * dotBL, dotNL ) );
		return 0.5 / max( gv + gl, EPSILON );
	}
	float D_GGX_Anisotropic( const in float alphaT, const in float alphaB, const in float dotNH, const in float dotTH, const in float dotBH ) {
		float a2 = alphaT * alphaB;
		highp vec3 v = vec3( alphaB * dotTH, alphaT * dotBH, a2 * dotNH );
		highp float v2 = dot( v, v );
		float w2 = a2 / v2;
		return RECIPROCAL_PI * a2 * pow2 ( w2 );
	}
#endif
#ifdef USE_CLEARCOAT
	vec3 BRDF_GGX_Clearcoat( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material) {
		vec3 f0 = material.clearcoatF0;
		float f90 = material.clearcoatF90;
		float roughness = material.clearcoatRoughness;
		float alpha = pow2( roughness );
		vec3 halfDir = normalize( lightDir + viewDir );
		float dotNL = saturate( dot( normal, lightDir ) );
		float dotNV = saturate( dot( normal, viewDir ) );
		float dotNH = saturate( dot( normal, halfDir ) );
		float dotVH = saturate( dot( viewDir, halfDir ) );
		vec3 F = F_Schlick( f0, f90, dotVH );
		float V = V_GGX_SmithCorrelated( alpha, dotNL, dotNV );
		float D = D_GGX( alpha, dotNH );
		return F * ( V * D );
	}
#endif
vec3 BRDF_GGX( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material ) {
	vec3 f0 = material.specularColorBlended;
	float f90 = material.specularF90;
	float roughness = material.roughness;
	float alpha = pow2( roughness );
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	float dotNH = saturate( dot( normal, halfDir ) );
	float dotVH = saturate( dot( viewDir, halfDir ) );
	vec3 F = F_Schlick( f0, f90, dotVH );
	#ifdef USE_IRIDESCENCE
		F = mix( F, material.iridescenceFresnel, material.iridescence );
	#endif
	#ifdef USE_ANISOTROPY
		float dotTL = dot( material.anisotropyT, lightDir );
		float dotTV = dot( material.anisotropyT, viewDir );
		float dotTH = dot( material.anisotropyT, halfDir );
		float dotBL = dot( material.anisotropyB, lightDir );
		float dotBV = dot( material.anisotropyB, viewDir );
		float dotBH = dot( material.anisotropyB, halfDir );
		float V = V_GGX_SmithCorrelated_Anisotropic( material.alphaT, alpha, dotTV, dotBV, dotTL, dotBL, dotNV, dotNL );
		float D = D_GGX_Anisotropic( material.alphaT, alpha, dotNH, dotTH, dotBH );
	#else
		float V = V_GGX_SmithCorrelated( alpha, dotNL, dotNV );
		float D = D_GGX( alpha, dotNH );
	#endif
	return F * ( V * D );
}
vec2 LTC_Uv( const in vec3 N, const in vec3 V, const in float roughness ) {
	const float LUT_SIZE = 64.0;
	const float LUT_SCALE = ( LUT_SIZE - 1.0 ) / LUT_SIZE;
	const float LUT_BIAS = 0.5 / LUT_SIZE;
	float dotNV = saturate( dot( N, V ) );
	vec2 uv = vec2( roughness, sqrt( 1.0 - dotNV ) );
	uv = uv * LUT_SCALE + LUT_BIAS;
	return uv;
}
float LTC_ClippedSphereFormFactor( const in vec3 f ) {
	float l = length( f );
	return max( ( l * l + f.z ) / ( l + 1.0 ), 0.0 );
}
vec3 LTC_EdgeVectorFormFactor( const in vec3 v1, const in vec3 v2 ) {
	float x = dot( v1, v2 );
	float y = abs( x );
	float a = 0.8543985 + ( 0.4965155 + 0.0145206 * y ) * y;
	float b = 3.4175940 + ( 4.1616724 + y ) * y;
	float v = a / b;
	float theta_sintheta = ( x > 0.0 ) ? v : 0.5 * inversesqrt( max( 1.0 - x * x, 1e-7 ) ) - v;
	return cross( v1, v2 ) * theta_sintheta;
}
vec3 LTC_Evaluate( const in vec3 N, const in vec3 V, const in vec3 P, const in mat3 mInv, const in vec3 rectCoords[ 4 ] ) {
	vec3 v1 = rectCoords[ 1 ] - rectCoords[ 0 ];
	vec3 v2 = rectCoords[ 3 ] - rectCoords[ 0 ];
	vec3 lightNormal = cross( v1, v2 );
	if( dot( lightNormal, P - rectCoords[ 0 ] ) < 0.0 ) return vec3( 0.0 );
	vec3 T1, T2;
	T1 = normalize( V - N * dot( V, N ) );
	T2 = - cross( N, T1 );
	mat3 mat = mInv * transpose( mat3( T1, T2, N ) );
	vec3 coords[ 4 ];
	coords[ 0 ] = mat * ( rectCoords[ 0 ] - P );
	coords[ 1 ] = mat * ( rectCoords[ 1 ] - P );
	coords[ 2 ] = mat * ( rectCoords[ 2 ] - P );
	coords[ 3 ] = mat * ( rectCoords[ 3 ] - P );
	coords[ 0 ] = normalize( coords[ 0 ] );
	coords[ 1 ] = normalize( coords[ 1 ] );
	coords[ 2 ] = normalize( coords[ 2 ] );
	coords[ 3 ] = normalize( coords[ 3 ] );
	vec3 vectorFormFactor = vec3( 0.0 );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 0 ], coords[ 1 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 1 ], coords[ 2 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 2 ], coords[ 3 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 3 ], coords[ 0 ] );
	float result = LTC_ClippedSphereFormFactor( vectorFormFactor );
	return vec3( result );
}
#if defined( USE_SHEEN )
float D_Charlie( float roughness, float dotNH ) {
	float alpha = pow2( roughness );
	float invAlpha = 1.0 / alpha;
	float cos2h = dotNH * dotNH;
	float sin2h = max( 1.0 - cos2h, 0.0078125 );
	return ( 2.0 + invAlpha ) * pow( sin2h, invAlpha * 0.5 ) / ( 2.0 * PI );
}
float V_Neubelt( float dotNV, float dotNL ) {
	return saturate( 1.0 / ( 4.0 * ( dotNL + dotNV - dotNL * dotNV ) ) );
}
vec3 BRDF_Sheen( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, vec3 sheenColor, const in float sheenRoughness ) {
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	float dotNH = saturate( dot( normal, halfDir ) );
	float D = D_Charlie( sheenRoughness, dotNH );
	float V = V_Neubelt( dotNV, dotNL );
	return sheenColor * ( D * V );
}
#endif
float IBLSheenBRDF( const in vec3 normal, const in vec3 viewDir, const in float roughness ) {
	float dotNV = saturate( dot( normal, viewDir ) );
	float r2 = roughness * roughness;
	float rInv = 1.0 / ( roughness + 0.1 );
	float a = -1.9362 + 1.0678 * roughness + 0.4573 * r2 - 0.8469 * rInv;
	float b = -0.6014 + 0.5538 * roughness - 0.4670 * r2 - 0.1255 * rInv;
	float DG = exp( a * dotNV + b );
	return saturate( DG );
}
vec3 EnvironmentBRDF( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float roughness ) {
	float dotNV = saturate( dot( normal, viewDir ) );
	vec2 fab = texture2D( dfgLUT, vec2( roughness, dotNV ) ).rg;
	return specularColor * fab.x + specularF90 * fab.y;
}
#ifdef USE_IRIDESCENCE
void computeMultiscatteringIridescence( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float iridescence, const in vec3 iridescenceF0, const in float roughness, inout vec3 singleScatter, inout vec3 multiScatter ) {
#else
void computeMultiscattering( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float roughness, inout vec3 singleScatter, inout vec3 multiScatter ) {
#endif
	float dotNV = saturate( dot( normal, viewDir ) );
	vec2 fab = texture2D( dfgLUT, vec2( roughness, dotNV ) ).rg;
	#ifdef USE_IRIDESCENCE
		vec3 Fr = mix( specularColor, iridescenceF0, iridescence );
	#else
		vec3 Fr = specularColor;
	#endif
	vec3 FssEss = Fr * fab.x + specularF90 * fab.y;
	float Ess = fab.x + fab.y;
	float Ems = 1.0 - Ess;
	vec3 Favg = Fr + ( 1.0 - Fr ) * 0.047619;	vec3 Fms = FssEss * Favg / ( 1.0 - Ems * Favg );
	singleScatter += FssEss;
	multiScatter += Fms * Ems;
}
vec3 BRDF_GGX_Multiscatter( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material ) {
	vec3 singleScatter = BRDF_GGX( lightDir, viewDir, normal, material );
	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	vec2 dfgV = texture2D( dfgLUT, vec2( material.roughness, dotNV ) ).rg;
	vec2 dfgL = texture2D( dfgLUT, vec2( material.roughness, dotNL ) ).rg;
	vec3 FssEss_V = material.specularColorBlended * dfgV.x + material.specularF90 * dfgV.y;
	vec3 FssEss_L = material.specularColorBlended * dfgL.x + material.specularF90 * dfgL.y;
	float Ess_V = dfgV.x + dfgV.y;
	float Ess_L = dfgL.x + dfgL.y;
	float Ems_V = 1.0 - Ess_V;
	float Ems_L = 1.0 - Ess_L;
	vec3 Favg = material.specularColorBlended + ( 1.0 - material.specularColorBlended ) * 0.047619;
	vec3 Fms = FssEss_V * FssEss_L * Favg / ( 1.0 - Ems_V * Ems_L * Favg + EPSILON );
	float compensationFactor = Ems_V * Ems_L;
	vec3 multiScatter = Fms * compensationFactor;
	return singleScatter + multiScatter;
}
#if NUM_RECT_AREA_LIGHTS > 0
	void RE_Direct_RectArea_Physical( const in RectAreaLight rectAreaLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
		vec3 normal = geometryNormal;
		vec3 viewDir = geometryViewDir;
		vec3 position = geometryPosition;
		vec3 lightPos = rectAreaLight.position;
		vec3 halfWidth = rectAreaLight.halfWidth;
		vec3 halfHeight = rectAreaLight.halfHeight;
		vec3 lightColor = rectAreaLight.color;
		float roughness = material.roughness;
		vec3 rectCoords[ 4 ];
		rectCoords[ 0 ] = lightPos + halfWidth - halfHeight;		rectCoords[ 1 ] = lightPos - halfWidth - halfHeight;
		rectCoords[ 2 ] = lightPos - halfWidth + halfHeight;
		rectCoords[ 3 ] = lightPos + halfWidth + halfHeight;
		vec2 uv = LTC_Uv( normal, viewDir, roughness );
		vec4 t1 = texture2D( ltc_1, uv );
		vec4 t2 = texture2D( ltc_2, uv );
		mat3 mInv = mat3(
			vec3( t1.x, 0, t1.y ),
			vec3(    0, 1,    0 ),
			vec3( t1.z, 0, t1.w )
		);
		vec3 fresnel = ( material.specularColorBlended * t2.x + ( material.specularF90 - material.specularColorBlended ) * t2.y );
		reflectedLight.directSpecular += lightColor * fresnel * LTC_Evaluate( normal, viewDir, position, mInv, rectCoords );
		reflectedLight.directDiffuse += lightColor * material.diffuseContribution * LTC_Evaluate( normal, viewDir, position, mat3( 1.0 ), rectCoords );
		#ifdef USE_CLEARCOAT
			vec3 Ncc = geometryClearcoatNormal;
			vec2 uvClearcoat = LTC_Uv( Ncc, viewDir, material.clearcoatRoughness );
			vec4 t1Clearcoat = texture2D( ltc_1, uvClearcoat );
			vec4 t2Clearcoat = texture2D( ltc_2, uvClearcoat );
			mat3 mInvClearcoat = mat3(
				vec3( t1Clearcoat.x, 0, t1Clearcoat.y ),
				vec3(             0, 1,             0 ),
				vec3( t1Clearcoat.z, 0, t1Clearcoat.w )
			);
			vec3 fresnelClearcoat = material.clearcoatF0 * t2Clearcoat.x + ( material.clearcoatF90 - material.clearcoatF0 ) * t2Clearcoat.y;
			clearcoatSpecularDirect += lightColor * fresnelClearcoat * LTC_Evaluate( Ncc, viewDir, position, mInvClearcoat, rectCoords );
		#endif
	}
#endif
void RE_Direct_Physical( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	#ifdef USE_CLEARCOAT
		float dotNLcc = saturate( dot( geometryClearcoatNormal, directLight.direction ) );
		vec3 ccIrradiance = dotNLcc * directLight.color;
		clearcoatSpecularDirect += ccIrradiance * BRDF_GGX_Clearcoat( directLight.direction, geometryViewDir, geometryClearcoatNormal, material );
	#endif
	#ifdef USE_SHEEN
 
 		sheenSpecularDirect += irradiance * BRDF_Sheen( directLight.direction, geometryViewDir, geometryNormal, material.sheenColor, material.sheenRoughness );
 
 		float sheenAlbedoV = IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness );
 		float sheenAlbedoL = IBLSheenBRDF( geometryNormal, directLight.direction, material.sheenRoughness );
 
 		float sheenEnergyComp = 1.0 - max3( material.sheenColor ) * max( sheenAlbedoV, sheenAlbedoL );
 
 		irradiance *= sheenEnergyComp;
 
 	#endif
	reflectedLight.directSpecular += irradiance * BRDF_GGX_Multiscatter( directLight.direction, geometryViewDir, geometryNormal, material );
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseContribution );
}
void RE_IndirectDiffuse_Physical( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
	vec3 diffuse = irradiance * BRDF_Lambert( material.diffuseContribution );
	#ifdef USE_SHEEN
		float sheenAlbedo = IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness );
		float sheenEnergyComp = 1.0 - max3( material.sheenColor ) * sheenAlbedo;
		diffuse *= sheenEnergyComp;
	#endif
	reflectedLight.indirectDiffuse += diffuse;
}
void RE_IndirectSpecular_Physical( const in vec3 radiance, const in vec3 irradiance, const in vec3 clearcoatRadiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight) {
	#ifdef USE_CLEARCOAT
		clearcoatSpecularIndirect += clearcoatRadiance * EnvironmentBRDF( geometryClearcoatNormal, geometryViewDir, material.clearcoatF0, material.clearcoatF90, material.clearcoatRoughness );
	#endif
	#ifdef USE_SHEEN
		sheenSpecularIndirect += irradiance * material.sheenColor * IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness ) * RECIPROCAL_PI;
 	#endif
	vec3 singleScatteringDielectric = vec3( 0.0 );
	vec3 multiScatteringDielectric = vec3( 0.0 );
	vec3 singleScatteringMetallic = vec3( 0.0 );
	vec3 multiScatteringMetallic = vec3( 0.0 );
	#ifdef USE_IRIDESCENCE
		computeMultiscatteringIridescence( geometryNormal, geometryViewDir, material.specularColor, material.specularF90, material.iridescence, material.iridescenceFresnelDielectric, material.roughness, singleScatteringDielectric, multiScatteringDielectric );
		computeMultiscatteringIridescence( geometryNormal, geometryViewDir, material.diffuseColor, material.specularF90, material.iridescence, material.iridescenceFresnelMetallic, material.roughness, singleScatteringMetallic, multiScatteringMetallic );
	#else
		computeMultiscattering( geometryNormal, geometryViewDir, material.specularColor, material.specularF90, material.roughness, singleScatteringDielectric, multiScatteringDielectric );
		computeMultiscattering( geometryNormal, geometryViewDir, material.diffuseColor, material.specularF90, material.roughness, singleScatteringMetallic, multiScatteringMetallic );
	#endif
	vec3 singleScattering = mix( singleScatteringDielectric, singleScatteringMetallic, material.metalness );
	vec3 multiScattering = mix( multiScatteringDielectric, multiScatteringMetallic, material.metalness );
	vec3 totalScatteringDielectric = singleScatteringDielectric + multiScatteringDielectric;
	vec3 diffuse = material.diffuseContribution * ( 1.0 - totalScatteringDielectric );
	vec3 cosineWeightedIrradiance = irradiance * RECIPROCAL_PI;
	vec3 indirectSpecular = radiance * singleScattering;
	indirectSpecular += multiScattering * cosineWeightedIrradiance;
	vec3 indirectDiffuse = diffuse * cosineWeightedIrradiance;
	#ifdef USE_SHEEN
		float sheenAlbedo = IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness );
		float sheenEnergyComp = 1.0 - max3( material.sheenColor ) * sheenAlbedo;
		indirectSpecular *= sheenEnergyComp;
		indirectDiffuse *= sheenEnergyComp;
	#endif
	reflectedLight.indirectSpecular += indirectSpecular;
	reflectedLight.indirectDiffuse += indirectDiffuse;
}
#define RE_Direct				RE_Direct_Physical
#define RE_Direct_RectArea		RE_Direct_RectArea_Physical
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Physical
#define RE_IndirectSpecular		RE_IndirectSpecular_Physical
float computeSpecularOcclusion( const in float dotNV, const in float ambientOcclusion, const in float roughness ) {
	return saturate( pow( dotNV + ambientOcclusion, exp2( - 16.0 * roughness - 1.0 ) ) - 1.0 + ambientOcclusion );
}`,Y_=`
vec3 geometryPosition = - vViewPosition;
vec3 geometryNormal = normal;
vec3 geometryViewDir = ( isOrthographic ) ? vec3( 0, 0, 1 ) : normalize( vViewPosition );
vec3 geometryClearcoatNormal = vec3( 0.0 );
#ifdef USE_CLEARCOAT
	geometryClearcoatNormal = clearcoatNormal;
#endif
#ifdef USE_IRIDESCENCE
	float dotNVi = saturate( dot( normal, geometryViewDir ) );
	if ( material.iridescenceThickness == 0.0 ) {
		material.iridescence = 0.0;
	} else {
		material.iridescence = saturate( material.iridescence );
	}
	if ( material.iridescence > 0.0 ) {
		material.iridescenceFresnelDielectric = evalIridescence( 1.0, material.iridescenceIOR, dotNVi, material.iridescenceThickness, material.specularColor );
		material.iridescenceFresnelMetallic = evalIridescence( 1.0, material.iridescenceIOR, dotNVi, material.iridescenceThickness, material.diffuseColor );
		material.iridescenceFresnel = mix( material.iridescenceFresnelDielectric, material.iridescenceFresnelMetallic, material.metalness );
		material.iridescenceF0 = Schlick_to_F0( material.iridescenceFresnel, 1.0, dotNVi );
	}
#endif
IncidentLight directLight;
#if ( NUM_POINT_LIGHTS > 0 ) && defined( RE_Direct )
	PointLight pointLight;
	#if defined( USE_SHADOWMAP ) && NUM_POINT_LIGHT_SHADOWS > 0
	PointLightShadow pointLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_POINT_LIGHTS; i ++ ) {
		pointLight = pointLights[ i ];
		getPointLightInfo( pointLight, geometryPosition, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_POINT_LIGHT_SHADOWS ) && ( defined( SHADOWMAP_TYPE_PCF ) || defined( SHADOWMAP_TYPE_BASIC ) )
		pointLightShadow = pointLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getPointShadow( pointShadowMap[ i ], pointLightShadow.shadowMapSize, pointLightShadow.shadowIntensity, pointLightShadow.shadowBias, pointLightShadow.shadowRadius, vPointShadowCoord[ i ], pointLightShadow.shadowCameraNear, pointLightShadow.shadowCameraFar ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_SPOT_LIGHTS > 0 ) && defined( RE_Direct )
	SpotLight spotLight;
	vec4 spotColor;
	vec3 spotLightCoord;
	bool inSpotLightMap;
	#if defined( USE_SHADOWMAP ) && NUM_SPOT_LIGHT_SHADOWS > 0
	SpotLightShadow spotLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHTS; i ++ ) {
		spotLight = spotLights[ i ];
		getSpotLightInfo( spotLight, geometryPosition, directLight );
		#if ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS )
		#define SPOT_LIGHT_MAP_INDEX UNROLLED_LOOP_INDEX
		#elif ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
		#define SPOT_LIGHT_MAP_INDEX NUM_SPOT_LIGHT_MAPS
		#else
		#define SPOT_LIGHT_MAP_INDEX ( UNROLLED_LOOP_INDEX - NUM_SPOT_LIGHT_SHADOWS + NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS )
		#endif
		#if ( SPOT_LIGHT_MAP_INDEX < NUM_SPOT_LIGHT_MAPS )
			spotLightCoord = vSpotLightCoord[ i ].xyz / vSpotLightCoord[ i ].w;
			inSpotLightMap = all( lessThan( abs( spotLightCoord * 2. - 1. ), vec3( 1.0 ) ) );
			spotColor = texture2D( spotLightMap[ SPOT_LIGHT_MAP_INDEX ], spotLightCoord.xy );
			directLight.color = inSpotLightMap ? directLight.color * spotColor.rgb : directLight.color;
		#endif
		#undef SPOT_LIGHT_MAP_INDEX
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
		spotLightShadow = spotLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( spotShadowMap[ i ], spotLightShadow.shadowMapSize, spotLightShadow.shadowIntensity, spotLightShadow.shadowBias, spotLightShadow.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_DIR_LIGHTS > 0 ) && defined( RE_Direct )
	DirectionalLight directionalLight;
	#if defined( USE_SHADOWMAP ) && NUM_DIR_LIGHT_SHADOWS > 0
	DirectionalLightShadow directionalLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_DIR_LIGHTS; i ++ ) {
		directionalLight = directionalLights[ i ];
		getDirectionalLightInfo( directionalLight, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_DIR_LIGHT_SHADOWS )
		directionalLightShadow = directionalLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( directionalShadowMap[ i ], directionalLightShadow.shadowMapSize, directionalLightShadow.shadowIntensity, directionalLightShadow.shadowBias, directionalLightShadow.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_RECT_AREA_LIGHTS > 0 ) && defined( RE_Direct_RectArea )
	RectAreaLight rectAreaLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_RECT_AREA_LIGHTS; i ++ ) {
		rectAreaLight = rectAreaLights[ i ];
		RE_Direct_RectArea( rectAreaLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if defined( RE_IndirectDiffuse )
	vec3 iblIrradiance = vec3( 0.0 );
	vec3 irradiance = getAmbientLightIrradiance( ambientLightColor );
	#if defined( USE_LIGHT_PROBES )
		irradiance += getLightProbeIrradiance( lightProbe, geometryNormal );
	#endif
	#if ( NUM_HEMI_LIGHTS > 0 )
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_HEMI_LIGHTS; i ++ ) {
			irradiance += getHemisphereLightIrradiance( hemisphereLights[ i ], geometryNormal );
		}
		#pragma unroll_loop_end
	#endif
	#ifdef USE_LIGHT_PROBES_GRID
		vec3 probeWorldPos = ( ( vec4( geometryPosition, 1.0 ) - viewMatrix[ 3 ] ) * viewMatrix ).xyz;
		vec3 probeWorldNormal = transformNormalByInverseViewMatrix( geometryNormal, viewMatrix );
		irradiance += getLightProbeGridIrradiance( probeWorldPos, probeWorldNormal );
	#endif
#endif
#if defined( RE_IndirectSpecular )
	vec3 radiance = vec3( 0.0 );
	vec3 clearcoatRadiance = vec3( 0.0 );
#endif`,K_=`#if defined( RE_IndirectDiffuse )
	#ifdef USE_LIGHTMAP
		vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
		vec3 lightMapIrradiance = lightMapTexel.rgb * lightMapIntensity;
		irradiance += lightMapIrradiance;
	#endif
	#if defined( USE_ENVMAP ) && defined( ENVMAP_TYPE_CUBE_UV )
		#if defined( STANDARD ) || defined( LAMBERT ) || defined( PHONG )
			iblIrradiance += getIBLIrradiance( geometryNormal );
		#endif
	#endif
#endif
#if defined( USE_ENVMAP ) && defined( RE_IndirectSpecular )
	#ifdef USE_ANISOTROPY
		radiance += getIBLAnisotropyRadiance( geometryViewDir, geometryNormal, material.roughness, material.anisotropyB, material.anisotropy );
	#else
		radiance += getIBLRadiance( geometryViewDir, geometryNormal, material.roughness );
	#endif
	#ifdef USE_CLEARCOAT
		clearcoatRadiance += getIBLRadiance( geometryViewDir, geometryClearcoatNormal, material.clearcoatRoughness );
	#endif
#endif`,Z_=`#if defined( RE_IndirectDiffuse )
	#if defined( LAMBERT ) || defined( PHONG )
		irradiance += iblIrradiance;
	#endif
	RE_IndirectDiffuse( irradiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif
#if defined( RE_IndirectSpecular )
	RE_IndirectSpecular( radiance, iblIrradiance, clearcoatRadiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif`,j_=`#ifdef USE_LIGHT_PROBES_GRID
uniform highp sampler3D probesSH;
uniform vec3 probesMin;
uniform vec3 probesMax;
uniform vec3 probesResolution;
vec3 getLightProbeGridIrradiance( vec3 worldPos, vec3 worldNormal ) {
	vec3 res = probesResolution;
	vec3 gridRange = probesMax - probesMin;
	vec3 resMinusOne = res - 1.0;
	vec3 probeSpacing = gridRange / resMinusOne;
	vec3 samplePos = worldPos + worldNormal * probeSpacing * 0.5;
	vec3 uvw = clamp( ( samplePos - probesMin ) / gridRange, 0.0, 1.0 );
	uvw = uvw * resMinusOne / res + 0.5 / res;
	float nz          = res.z;
	float paddedSlices = nz + 2.0;
	float atlasDepth  = 7.0 * paddedSlices;
	float uvZBase     = uvw.z * nz + 1.0;
	vec4 s0 = texture( probesSH, vec3( uvw.xy, ( uvZBase                       ) / atlasDepth ) );
	vec4 s1 = texture( probesSH, vec3( uvw.xy, ( uvZBase +       paddedSlices   ) / atlasDepth ) );
	vec4 s2 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 2.0 * paddedSlices   ) / atlasDepth ) );
	vec4 s3 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 3.0 * paddedSlices   ) / atlasDepth ) );
	vec4 s4 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 4.0 * paddedSlices   ) / atlasDepth ) );
	vec4 s5 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 5.0 * paddedSlices   ) / atlasDepth ) );
	vec4 s6 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 6.0 * paddedSlices   ) / atlasDepth ) );
	vec3 c0 = s0.xyz;
	vec3 c1 = vec3( s0.w, s1.xy );
	vec3 c2 = vec3( s1.zw, s2.x );
	vec3 c3 = s2.yzw;
	vec3 c4 = s3.xyz;
	vec3 c5 = vec3( s3.w, s4.xy );
	vec3 c6 = vec3( s4.zw, s5.x );
	vec3 c7 = s5.yzw;
	vec3 c8 = s6.xyz;
	float x = worldNormal.x, y = worldNormal.y, z = worldNormal.z;
	vec3 result = c0 * 0.886227;
	result += c1 * 2.0 * 0.511664 * y;
	result += c2 * 2.0 * 0.511664 * z;
	result += c3 * 2.0 * 0.511664 * x;
	result += c4 * 2.0 * 0.429043 * x * y;
	result += c5 * 2.0 * 0.429043 * y * z;
	result += c6 * ( 0.743125 * z * z - 0.247708 );
	result += c7 * 2.0 * 0.429043 * x * z;
	result += c8 * 0.429043 * ( x * x - y * y );
	return max( result, vec3( 0.0 ) );
}
#endif`,J_=`#if defined( USE_LOGARITHMIC_DEPTH_BUFFER )
	gl_FragDepth = vIsPerspective == 0.0 ? gl_FragCoord.z : log2( vFragDepth ) * logDepthBufFC * 0.5;
#endif`,Q_=`#if defined( USE_LOGARITHMIC_DEPTH_BUFFER )
	uniform float logDepthBufFC;
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,t0=`#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,e0=`#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
	vFragDepth = 1.0 + gl_Position.w;
	vIsPerspective = float( isPerspectiveMatrix( projectionMatrix ) );
#endif`,n0=`#ifdef USE_MAP
	vec4 sampledDiffuseColor = texture2D( map, vMapUv );
	#ifdef DECODE_VIDEO_TEXTURE
		sampledDiffuseColor = sRGBTransferEOTF( sampledDiffuseColor );
	#endif
	diffuseColor *= sampledDiffuseColor;
#endif`,i0=`#ifdef USE_MAP
	uniform sampler2D map;
#endif`,s0=`#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
	#if defined( USE_POINTS_UV )
		vec2 uv = vUv;
	#else
		vec2 uv = ( uvTransform * vec3( gl_PointCoord.x, 1.0 - gl_PointCoord.y, 1 ) ).xy;
	#endif
#endif
#ifdef USE_MAP
	diffuseColor *= texture2D( map, uv );
#endif
#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, uv ).g;
#endif`,r0=`#if defined( USE_POINTS_UV )
	varying vec2 vUv;
#else
	#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
		uniform mat3 uvTransform;
	#endif
#endif
#ifdef USE_MAP
	uniform sampler2D map;
#endif
#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,o0=`float metalnessFactor = metalness;
#ifdef USE_METALNESSMAP
	vec4 texelMetalness = texture2D( metalnessMap, vMetalnessMapUv );
	metalnessFactor *= texelMetalness.b;
#endif`,a0=`#ifdef USE_METALNESSMAP
	uniform sampler2D metalnessMap;
#endif`,l0=`#ifdef USE_INSTANCING_MORPH
	float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	float morphTargetBaseInfluence = texelFetch( morphTexture, ivec2( 0, gl_InstanceID ), 0 ).r;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		morphTargetInfluences[i] =  texelFetch( morphTexture, ivec2( i + 1, gl_InstanceID ), 0 ).r;
	}
#endif`,c0=`#if defined( USE_MORPHCOLORS )
	vColor *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		#if defined( USE_COLOR_ALPHA )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ) * morphTargetInfluences[ i ];
		#elif defined( USE_COLOR )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ).rgb * morphTargetInfluences[ i ];
		#endif
	}
#endif`,h0=`#ifdef USE_MORPHNORMALS
	objectNormal *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) objectNormal += getMorph( gl_VertexID, i, 1 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,u0=`#ifdef USE_MORPHTARGETS
	#ifndef USE_INSTANCING_MORPH
		uniform float morphTargetBaseInfluence;
		uniform float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	#endif
	uniform sampler2DArray morphTargetsTexture;
	uniform ivec2 morphTargetsTextureSize;
	vec4 getMorph( const in int vertexIndex, const in int morphTargetIndex, const in int offset ) {
		int texelIndex = vertexIndex * MORPHTARGETS_TEXTURE_STRIDE + offset;
		int y = texelIndex / morphTargetsTextureSize.x;
		int x = texelIndex - y * morphTargetsTextureSize.x;
		ivec3 morphUV = ivec3( x, y, morphTargetIndex );
		return texelFetch( morphTargetsTexture, morphUV, 0 );
	}
#endif`,d0=`#ifdef USE_MORPHTARGETS
	transformed *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) transformed += getMorph( gl_VertexID, i, 0 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,f0=`float faceDirection = gl_FrontFacing ? 1.0 : - 1.0;
#ifdef FLAT_SHADED
	vec3 fdx = dFdx( vViewPosition );
	vec3 fdy = dFdy( vViewPosition );
	vec3 normal = normalize( cross( fdx, fdy ) );
#else
	vec3 normal = normalize( vNormal );
	#ifdef DOUBLE_SIDED
		normal *= faceDirection;
	#endif
#endif
#if defined( USE_NORMALMAP_TANGENTSPACE ) || defined( USE_CLEARCOAT_NORMALMAP ) || defined( USE_ANISOTROPY )
	#ifdef USE_TANGENT
		mat3 tbn = mat3( normalize( vTangent ), normalize( vBitangent ), normal );
	#else
		mat3 tbn = getTangentFrame( - vViewPosition, normal,
		#if defined( USE_NORMALMAP )
			vNormalMapUv
		#elif defined( USE_CLEARCOAT_NORMALMAP )
			vClearcoatNormalMapUv
		#else
			vUv
		#endif
		);
	#endif
	#ifdef DOUBLE_SIDED
		tbn[0] *= faceDirection;
		tbn[1] *= faceDirection;
	#endif
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	#ifdef USE_TANGENT
		mat3 tbn2 = mat3( normalize( vTangent ), normalize( vBitangent ), normal );
	#else
		mat3 tbn2 = getTangentFrame( - vViewPosition, normal, vClearcoatNormalMapUv );
	#endif
	#ifdef DOUBLE_SIDED
		tbn2[0] *= faceDirection;
		tbn2[1] *= faceDirection;
	#endif
#endif
vec3 nonPerturbedNormal = normal;`,p0=`#ifdef USE_NORMALMAP_OBJECTSPACE
	normal = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;
	#ifdef FLIP_SIDED
		normal = - normal;
	#endif
	#ifdef DOUBLE_SIDED
		normal = normal * faceDirection;
	#endif
	normal = normalize( normalMatrix * normal );
#elif defined( USE_NORMALMAP_TANGENTSPACE )
	vec3 mapN = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;
	#if defined( USE_PACKED_NORMALMAP )
		mapN = vec3( mapN.xy, sqrt( saturate( 1.0 - dot( mapN.xy, mapN.xy ) ) ) );
	#endif
	mapN.xy *= normalScale;
	normal = normalize( tbn * mapN );
#elif defined( USE_BUMPMAP )
	normal = perturbNormalArb( - vViewPosition, normal, dHdxy_fwd(), faceDirection );
#endif`,m0=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,g0=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,_0=`#ifndef FLAT_SHADED
	vNormal = normalize( transformedNormal );
	#ifdef USE_TANGENT
		vTangent = normalize( transformedTangent );
		vBitangent = normalize( cross( vNormal, vTangent ) * tangent.w );
		#ifdef FLIP_SIDED
			vBitangent = - vBitangent;
		#endif
	#endif
#endif`,x0=`#ifdef USE_NORMALMAP
	uniform sampler2D normalMap;
	uniform vec2 normalScale;
#endif
#ifdef USE_NORMALMAP_OBJECTSPACE
	uniform mat3 normalMatrix;
#endif
#if ! defined ( USE_TANGENT ) && ( defined ( USE_NORMALMAP_TANGENTSPACE ) || defined ( USE_CLEARCOAT_NORMALMAP ) || defined( USE_ANISOTROPY ) )
	mat3 getTangentFrame( vec3 eye_pos, vec3 surf_norm, vec2 uv ) {
		vec3 q0 = dFdx( eye_pos.xyz );
		vec3 q1 = dFdy( eye_pos.xyz );
		vec2 st0 = dFdx( uv.st );
		vec2 st1 = dFdy( uv.st );
		vec3 N = surf_norm;
		vec3 q1perp = cross( q1, N );
		vec3 q0perp = cross( N, q0 );
		vec3 T = q1perp * st0.x + q0perp * st1.x;
		vec3 B = q1perp * st0.y + q0perp * st1.y;
		float det = max( dot( T, T ), dot( B, B ) );
		float scale = ( det == 0.0 ) ? 0.0 : inversesqrt( det );
		return mat3( T * scale, B * scale, N );
	}
#endif`,v0=`#ifdef USE_CLEARCOAT
	vec3 clearcoatNormal = nonPerturbedNormal;
#endif`,y0=`#ifdef USE_CLEARCOAT_NORMALMAP
	vec3 clearcoatMapN = texture2D( clearcoatNormalMap, vClearcoatNormalMapUv ).xyz * 2.0 - 1.0;
	clearcoatMapN.xy *= clearcoatNormalScale;
	clearcoatNormal = normalize( tbn2 * clearcoatMapN );
#endif`,M0=`#ifdef USE_CLEARCOATMAP
	uniform sampler2D clearcoatMap;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform sampler2D clearcoatNormalMap;
	uniform vec2 clearcoatNormalScale;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform sampler2D clearcoatRoughnessMap;
#endif`,b0=`#ifdef USE_IRIDESCENCEMAP
	uniform sampler2D iridescenceMap;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform sampler2D iridescenceThicknessMap;
#endif`,S0=`#ifdef OPAQUE
diffuseColor.a = 1.0;
#endif
#ifdef USE_TRANSMISSION
diffuseColor.a *= material.transmissionAlpha;
#endif
gl_FragColor = vec4( outgoingLight, diffuseColor.a );`,w0=`vec3 packNormalToRGB( const in vec3 normal ) {
	return normalize( normal ) * 0.5 + 0.5;
}
vec3 unpackRGBToNormal( const in vec3 rgb ) {
	return 2.0 * rgb.xyz - 1.0;
}
const float PackUpscale = 256. / 255.;const float UnpackDownscale = 255. / 256.;const float ShiftRight8 = 1. / 256.;
const float Inv255 = 1. / 255.;
const vec4 PackFactors = vec4( 1.0, 256.0, 256.0 * 256.0, 256.0 * 256.0 * 256.0 );
const vec2 UnpackFactors2 = vec2( UnpackDownscale, 1.0 / PackFactors.g );
const vec3 UnpackFactors3 = vec3( UnpackDownscale / PackFactors.rg, 1.0 / PackFactors.b );
const vec4 UnpackFactors4 = vec4( UnpackDownscale / PackFactors.rgb, 1.0 / PackFactors.a );
vec4 packDepthToRGBA( const in float v ) {
	if( v <= 0.0 )
		return vec4( 0., 0., 0., 0. );
	if( v >= 1.0 )
		return vec4( 1., 1., 1., 1. );
	float vuf;
	float af = modf( v * PackFactors.a, vuf );
	float bf = modf( vuf * ShiftRight8, vuf );
	float gf = modf( vuf * ShiftRight8, vuf );
	return vec4( vuf * Inv255, gf * PackUpscale, bf * PackUpscale, af );
}
vec3 packDepthToRGB( const in float v ) {
	if( v <= 0.0 )
		return vec3( 0., 0., 0. );
	if( v >= 1.0 )
		return vec3( 1., 1., 1. );
	float vuf;
	float bf = modf( v * PackFactors.b, vuf );
	float gf = modf( vuf * ShiftRight8, vuf );
	return vec3( vuf * Inv255, gf * PackUpscale, bf );
}
vec2 packDepthToRG( const in float v ) {
	if( v <= 0.0 )
		return vec2( 0., 0. );
	if( v >= 1.0 )
		return vec2( 1., 1. );
	float vuf;
	float gf = modf( v * 256., vuf );
	return vec2( vuf * Inv255, gf );
}
float unpackRGBAToDepth( const in vec4 v ) {
	return dot( v, UnpackFactors4 );
}
float unpackRGBToDepth( const in vec3 v ) {
	return dot( v, UnpackFactors3 );
}
float unpackRGToDepth( const in vec2 v ) {
	return v.r * UnpackFactors2.r + v.g * UnpackFactors2.g;
}
vec4 pack2HalfToRGBA( const in vec2 v ) {
	vec4 r = vec4( v.x, fract( v.x * 255.0 ), v.y, fract( v.y * 255.0 ) );
	return vec4( r.x - r.y / 255.0, r.y, r.z - r.w / 255.0, r.w );
}
vec2 unpackRGBATo2Half( const in vec4 v ) {
	return vec2( v.x + ( v.y / 255.0 ), v.z + ( v.w / 255.0 ) );
}
float viewZToOrthographicDepth( const in float viewZ, const in float near, const in float far ) {
	return ( viewZ + near ) / ( near - far );
}
float orthographicDepthToViewZ( const in float depth, const in float near, const in float far ) {
	#ifdef USE_REVERSED_DEPTH_BUFFER
	
		return depth * ( far - near ) - far;
	#else
		return depth * ( near - far ) - near;
	#endif
}
float viewZToPerspectiveDepth( const in float viewZ, const in float near, const in float far ) {
	return ( ( near + viewZ ) * far ) / ( ( far - near ) * viewZ );
}
float perspectiveDepthToViewZ( const in float depth, const in float near, const in float far ) {
	
	#ifdef USE_REVERSED_DEPTH_BUFFER
		return ( near * far ) / ( ( near - far ) * depth - near );
	#else
		return ( near * far ) / ( ( far - near ) * depth - far );
	#endif
}`,E0=`#ifdef PREMULTIPLIED_ALPHA
	gl_FragColor.rgb *= gl_FragColor.a;
#endif`,T0=`vec4 mvPosition = vec4( transformed, 1.0 );
#ifdef USE_BATCHING
	mvPosition = batchingMatrix * mvPosition;
#endif
#ifdef USE_INSTANCING
	mvPosition = instanceMatrix * mvPosition;
#endif
mvPosition = modelViewMatrix * mvPosition;
gl_Position = projectionMatrix * mvPosition;`,A0=`#ifdef DITHERING
	gl_FragColor.rgb = dithering( gl_FragColor.rgb );
#endif`,C0=`#ifdef DITHERING
	vec3 dithering( vec3 color ) {
		float grid_position = rand( gl_FragCoord.xy );
		vec3 dither_shift_RGB = vec3( 0.25 / 255.0, -0.25 / 255.0, 0.25 / 255.0 );
		dither_shift_RGB = mix( 2.0 * dither_shift_RGB, -2.0 * dither_shift_RGB, grid_position );
		return color + dither_shift_RGB;
	}
#endif`,R0=`float roughnessFactor = roughness;
#ifdef USE_ROUGHNESSMAP
	vec4 texelRoughness = texture2D( roughnessMap, vRoughnessMapUv );
	roughnessFactor *= texelRoughness.g;
#endif`,P0=`#ifdef USE_ROUGHNESSMAP
	uniform sampler2D roughnessMap;
#endif`,I0=`#if NUM_SPOT_LIGHT_COORDS > 0
	varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];
#endif
#if NUM_SPOT_LIGHT_MAPS > 0
	uniform sampler2D spotLightMap[ NUM_SPOT_LIGHT_MAPS ];
#endif
#ifdef USE_SHADOWMAP
	#if NUM_DIR_LIGHT_SHADOWS > 0
		#if defined( SHADOWMAP_TYPE_PCF )
			uniform sampler2DShadow directionalShadowMap[ NUM_DIR_LIGHT_SHADOWS ];
		#else
			uniform sampler2D directionalShadowMap[ NUM_DIR_LIGHT_SHADOWS ];
		#endif
		varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];
		struct DirectionalLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform DirectionalLightShadow directionalLightShadows[ NUM_DIR_LIGHT_SHADOWS ];
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
		#if defined( SHADOWMAP_TYPE_PCF )
			uniform sampler2DShadow spotShadowMap[ NUM_SPOT_LIGHT_SHADOWS ];
		#else
			uniform sampler2D spotShadowMap[ NUM_SPOT_LIGHT_SHADOWS ];
		#endif
		struct SpotLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SpotLightShadow spotLightShadows[ NUM_SPOT_LIGHT_SHADOWS ];
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		#if defined( SHADOWMAP_TYPE_PCF )
			uniform samplerCubeShadow pointShadowMap[ NUM_POINT_LIGHT_SHADOWS ];
		#elif defined( SHADOWMAP_TYPE_BASIC )
			uniform samplerCube pointShadowMap[ NUM_POINT_LIGHT_SHADOWS ];
		#endif
		varying vec4 vPointShadowCoord[ NUM_POINT_LIGHT_SHADOWS ];
		struct PointLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
			float shadowCameraNear;
			float shadowCameraFar;
		};
		uniform PointLightShadow pointLightShadows[ NUM_POINT_LIGHT_SHADOWS ];
	#endif
	#if defined( SHADOWMAP_TYPE_PCF )
		float interleavedGradientNoise( vec2 position ) {
			return fract( 52.9829189 * fract( dot( position, vec2( 0.06711056, 0.00583715 ) ) ) );
		}
		vec2 vogelDiskSample( int sampleIndex, int samplesCount, float phi ) {
			const float goldenAngle = 2.399963229728653;
			float r = sqrt( ( float( sampleIndex ) + 0.5 ) / float( samplesCount ) );
			float theta = float( sampleIndex ) * goldenAngle + phi;
			return vec2( cos( theta ), sin( theta ) ) * r;
		}
	#endif
	#if defined( SHADOWMAP_TYPE_PCF )
		float getShadow( sampler2DShadow shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord ) {
			float shadow = 1.0;
			shadowCoord.xyz /= shadowCoord.w;
			shadowCoord.z += shadowBias;
			bool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;
			bool frustumTest = inFrustum && shadowCoord.z <= 1.0;
			if ( frustumTest ) {
				vec2 texelSize = vec2( 1.0 ) / shadowMapSize;
				float radius = shadowRadius * texelSize.x;
				float phi = interleavedGradientNoise( gl_FragCoord.xy ) * PI2;
				shadow = (
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 0, 5, phi ) * radius, shadowCoord.z ) ) +
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 1, 5, phi ) * radius, shadowCoord.z ) ) +
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 2, 5, phi ) * radius, shadowCoord.z ) ) +
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 3, 5, phi ) * radius, shadowCoord.z ) ) +
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 4, 5, phi ) * radius, shadowCoord.z ) )
				) * 0.2;
			}
			return mix( 1.0, shadow, shadowIntensity );
		}
	#elif defined( SHADOWMAP_TYPE_VSM )
		float getShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord ) {
			float shadow = 1.0;
			shadowCoord.xyz /= shadowCoord.w;
			#ifdef USE_REVERSED_DEPTH_BUFFER
				shadowCoord.z -= shadowBias;
			#else
				shadowCoord.z += shadowBias;
			#endif
			bool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;
			bool frustumTest = inFrustum && shadowCoord.z <= 1.0;
			if ( frustumTest ) {
				vec2 distribution = texture2D( shadowMap, shadowCoord.xy ).rg;
				float mean = distribution.x;
				float variance = distribution.y * distribution.y;
				#ifdef USE_REVERSED_DEPTH_BUFFER
					float hard_shadow = step( mean, shadowCoord.z );
				#else
					float hard_shadow = step( shadowCoord.z, mean );
				#endif
				
				if ( hard_shadow == 1.0 ) {
					shadow = 1.0;
				} else {
					variance = max( variance, 0.0000001 );
					float d = shadowCoord.z - mean;
					float p_max = variance / ( variance + d * d );
					p_max = clamp( ( p_max - 0.3 ) / 0.65, 0.0, 1.0 );
					shadow = max( hard_shadow, p_max );
				}
			}
			return mix( 1.0, shadow, shadowIntensity );
		}
	#else
		float getShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord ) {
			float shadow = 1.0;
			shadowCoord.xyz /= shadowCoord.w;
			#ifdef USE_REVERSED_DEPTH_BUFFER
				shadowCoord.z -= shadowBias;
			#else
				shadowCoord.z += shadowBias;
			#endif
			bool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;
			bool frustumTest = inFrustum && shadowCoord.z <= 1.0;
			if ( frustumTest ) {
				float depth = texture2D( shadowMap, shadowCoord.xy ).r;
				#ifdef USE_REVERSED_DEPTH_BUFFER
					shadow = step( depth, shadowCoord.z );
				#else
					shadow = step( shadowCoord.z, depth );
				#endif
			}
			return mix( 1.0, shadow, shadowIntensity );
		}
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
	#if defined( SHADOWMAP_TYPE_PCF )
	float getPointShadow( samplerCubeShadow shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord, float shadowCameraNear, float shadowCameraFar ) {
		float shadow = 1.0;
		vec3 lightToPosition = shadowCoord.xyz;
		vec3 bd3D = normalize( lightToPosition );
		vec3 absVec = abs( lightToPosition );
		float viewSpaceZ = max( max( absVec.x, absVec.y ), absVec.z );
		if ( viewSpaceZ - shadowCameraFar <= 0.0 && viewSpaceZ - shadowCameraNear >= 0.0 ) {
			#ifdef USE_REVERSED_DEPTH_BUFFER
				float dp = ( shadowCameraNear * ( shadowCameraFar - viewSpaceZ ) ) / ( viewSpaceZ * ( shadowCameraFar - shadowCameraNear ) );
				dp -= shadowBias;
			#else
				float dp = ( shadowCameraFar * ( viewSpaceZ - shadowCameraNear ) ) / ( viewSpaceZ * ( shadowCameraFar - shadowCameraNear ) );
				dp += shadowBias;
			#endif
			float texelSize = shadowRadius / shadowMapSize.x;
			vec3 absDir = abs( bd3D );
			vec3 tangent = absDir.x > absDir.z ? vec3( 0.0, 1.0, 0.0 ) : vec3( 1.0, 0.0, 0.0 );
			tangent = normalize( cross( bd3D, tangent ) );
			vec3 bitangent = cross( bd3D, tangent );
			float phi = interleavedGradientNoise( gl_FragCoord.xy ) * PI2;
			vec2 sample0 = vogelDiskSample( 0, 5, phi );
			vec2 sample1 = vogelDiskSample( 1, 5, phi );
			vec2 sample2 = vogelDiskSample( 2, 5, phi );
			vec2 sample3 = vogelDiskSample( 3, 5, phi );
			vec2 sample4 = vogelDiskSample( 4, 5, phi );
			shadow = (
				texture( shadowMap, vec4( bd3D + ( tangent * sample0.x + bitangent * sample0.y ) * texelSize, dp ) ) +
				texture( shadowMap, vec4( bd3D + ( tangent * sample1.x + bitangent * sample1.y ) * texelSize, dp ) ) +
				texture( shadowMap, vec4( bd3D + ( tangent * sample2.x + bitangent * sample2.y ) * texelSize, dp ) ) +
				texture( shadowMap, vec4( bd3D + ( tangent * sample3.x + bitangent * sample3.y ) * texelSize, dp ) ) +
				texture( shadowMap, vec4( bd3D + ( tangent * sample4.x + bitangent * sample4.y ) * texelSize, dp ) )
			) * 0.2;
		}
		return mix( 1.0, shadow, shadowIntensity );
	}
	#elif defined( SHADOWMAP_TYPE_BASIC )
	float getPointShadow( samplerCube shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord, float shadowCameraNear, float shadowCameraFar ) {
		float shadow = 1.0;
		vec3 lightToPosition = shadowCoord.xyz;
		vec3 absVec = abs( lightToPosition );
		float viewSpaceZ = max( max( absVec.x, absVec.y ), absVec.z );
		if ( viewSpaceZ - shadowCameraFar <= 0.0 && viewSpaceZ - shadowCameraNear >= 0.0 ) {
			float dp = ( shadowCameraFar * ( viewSpaceZ - shadowCameraNear ) ) / ( viewSpaceZ * ( shadowCameraFar - shadowCameraNear ) );
			dp += shadowBias;
			vec3 bd3D = normalize( lightToPosition );
			float depth = textureCube( shadowMap, bd3D ).r;
			#ifdef USE_REVERSED_DEPTH_BUFFER
				depth = 1.0 - depth;
			#endif
			shadow = step( dp, depth );
		}
		return mix( 1.0, shadow, shadowIntensity );
	}
	#endif
	#endif
#endif`,L0=`#if NUM_SPOT_LIGHT_COORDS > 0
	uniform mat4 spotLightMatrix[ NUM_SPOT_LIGHT_COORDS ];
	varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];
#endif
#ifdef USE_SHADOWMAP
	#if NUM_DIR_LIGHT_SHADOWS > 0
		uniform mat4 directionalShadowMatrix[ NUM_DIR_LIGHT_SHADOWS ];
		varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];
		struct DirectionalLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform DirectionalLightShadow directionalLightShadows[ NUM_DIR_LIGHT_SHADOWS ];
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
		struct SpotLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SpotLightShadow spotLightShadows[ NUM_SPOT_LIGHT_SHADOWS ];
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		uniform mat4 pointShadowMatrix[ NUM_POINT_LIGHT_SHADOWS ];
		varying vec4 vPointShadowCoord[ NUM_POINT_LIGHT_SHADOWS ];
		struct PointLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
			float shadowCameraNear;
			float shadowCameraFar;
		};
		uniform PointLightShadow pointLightShadows[ NUM_POINT_LIGHT_SHADOWS ];
	#endif
#endif`,D0=`#if ( defined( USE_SHADOWMAP ) && ( NUM_DIR_LIGHT_SHADOWS > 0 || NUM_POINT_LIGHT_SHADOWS > 0 ) ) || ( NUM_SPOT_LIGHT_COORDS > 0 )
	#ifdef HAS_NORMAL
		vec3 shadowWorldNormal = transformNormalByInverseViewMatrix( transformedNormal, viewMatrix );
	#else
		vec3 shadowWorldNormal = vec3( 0.0 );
	#endif
	vec4 shadowWorldPosition;
#endif
#if defined( USE_SHADOWMAP )
	#if NUM_DIR_LIGHT_SHADOWS > 0
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {
			shadowWorldPosition = worldPosition + vec4( shadowWorldNormal * directionalLightShadows[ i ].shadowNormalBias, 0 );
			vDirectionalShadowCoord[ i ] = directionalShadowMatrix[ i ] * shadowWorldPosition;
		}
		#pragma unroll_loop_end
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_POINT_LIGHT_SHADOWS; i ++ ) {
			shadowWorldPosition = worldPosition + vec4( shadowWorldNormal * pointLightShadows[ i ].shadowNormalBias, 0 );
			vPointShadowCoord[ i ] = pointShadowMatrix[ i ] * shadowWorldPosition;
		}
		#pragma unroll_loop_end
	#endif
#endif
#if NUM_SPOT_LIGHT_COORDS > 0
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHT_COORDS; i ++ ) {
		shadowWorldPosition = worldPosition;
		#if ( defined( USE_SHADOWMAP ) && UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
			shadowWorldPosition.xyz += shadowWorldNormal * spotLightShadows[ i ].shadowNormalBias;
		#endif
		vSpotLightCoord[ i ] = spotLightMatrix[ i ] * shadowWorldPosition;
	}
	#pragma unroll_loop_end
#endif`,N0=`float getShadowMask() {
	float shadow = 1.0;
	#ifdef USE_SHADOWMAP
	#if NUM_DIR_LIGHT_SHADOWS > 0
	DirectionalLightShadow directionalLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {
		directionalLight = directionalLightShadows[ i ];
		shadow *= receiveShadow ? getShadow( directionalShadowMap[ i ], directionalLight.shadowMapSize, directionalLight.shadowIntensity, directionalLight.shadowBias, directionalLight.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
	SpotLightShadow spotLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHT_SHADOWS; i ++ ) {
		spotLight = spotLightShadows[ i ];
		shadow *= receiveShadow ? getShadow( spotShadowMap[ i ], spotLight.shadowMapSize, spotLight.shadowIntensity, spotLight.shadowBias, spotLight.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0 && ( defined( SHADOWMAP_TYPE_PCF ) || defined( SHADOWMAP_TYPE_BASIC ) )
	PointLightShadow pointLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_POINT_LIGHT_SHADOWS; i ++ ) {
		pointLight = pointLightShadows[ i ];
		shadow *= receiveShadow ? getPointShadow( pointShadowMap[ i ], pointLight.shadowMapSize, pointLight.shadowIntensity, pointLight.shadowBias, pointLight.shadowRadius, vPointShadowCoord[ i ], pointLight.shadowCameraNear, pointLight.shadowCameraFar ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#endif
	return shadow;
}`,U0=`#ifdef USE_SKINNING
	mat4 boneMatX = getBoneMatrix( skinIndex.x );
	mat4 boneMatY = getBoneMatrix( skinIndex.y );
	mat4 boneMatZ = getBoneMatrix( skinIndex.z );
	mat4 boneMatW = getBoneMatrix( skinIndex.w );
#endif`,F0=`#ifdef USE_SKINNING
	uniform mat4 bindMatrix;
	uniform mat4 bindMatrixInverse;
	uniform highp sampler2D boneTexture;
	mat4 getBoneMatrix( const in float i ) {
		int size = textureSize( boneTexture, 0 ).x;
		int j = int( i ) * 4;
		int x = j % size;
		int y = j / size;
		vec4 v1 = texelFetch( boneTexture, ivec2( x, y ), 0 );
		vec4 v2 = texelFetch( boneTexture, ivec2( x + 1, y ), 0 );
		vec4 v3 = texelFetch( boneTexture, ivec2( x + 2, y ), 0 );
		vec4 v4 = texelFetch( boneTexture, ivec2( x + 3, y ), 0 );
		return mat4( v1, v2, v3, v4 );
	}
#endif`,O0=`#ifdef USE_SKINNING
	vec4 skinVertex = bindMatrix * vec4( transformed, 1.0 );
	vec4 skinned = vec4( 0.0 );
	skinned += boneMatX * skinVertex * skinWeight.x;
	skinned += boneMatY * skinVertex * skinWeight.y;
	skinned += boneMatZ * skinVertex * skinWeight.z;
	skinned += boneMatW * skinVertex * skinWeight.w;
	transformed = ( bindMatrixInverse * skinned ).xyz;
#endif`,k0=`#ifdef USE_SKINNING
	mat4 skinMatrix = mat4( 0.0 );
	skinMatrix += skinWeight.x * boneMatX;
	skinMatrix += skinWeight.y * boneMatY;
	skinMatrix += skinWeight.z * boneMatZ;
	skinMatrix += skinWeight.w * boneMatW;
	skinMatrix = bindMatrixInverse * skinMatrix * bindMatrix;
	objectNormal = vec4( skinMatrix * vec4( objectNormal, 0.0 ) ).xyz;
	#ifdef USE_TANGENT
		objectTangent = vec4( skinMatrix * vec4( objectTangent, 0.0 ) ).xyz;
	#endif
#endif`,B0=`float specularStrength;
#ifdef USE_SPECULARMAP
	vec4 texelSpecular = texture2D( specularMap, vSpecularMapUv );
	specularStrength = texelSpecular.r;
#else
	specularStrength = 1.0;
#endif`,z0=`#ifdef USE_SPECULARMAP
	uniform sampler2D specularMap;
#endif`,H0=`#if defined( TONE_MAPPING )
	gl_FragColor.rgb = toneMapping( gl_FragColor.rgb );
#endif`,V0=`#ifndef saturate
#define saturate( a ) clamp( a, 0.0, 1.0 )
#endif
uniform float toneMappingExposure;
vec3 LinearToneMapping( vec3 color ) {
	return saturate( toneMappingExposure * color );
}
vec3 ReinhardToneMapping( vec3 color ) {
	color *= toneMappingExposure;
	return saturate( color / ( vec3( 1.0 ) + color ) );
}
vec3 CineonToneMapping( vec3 color ) {
	color *= toneMappingExposure;
	color = max( vec3( 0.0 ), color - 0.004 );
	return pow( ( color * ( 6.2 * color + 0.5 ) ) / ( color * ( 6.2 * color + 1.7 ) + 0.06 ), vec3( 2.2 ) );
}
vec3 RRTAndODTFit( vec3 v ) {
	vec3 a = v * ( v + 0.0245786 ) - 0.000090537;
	vec3 b = v * ( 0.983729 * v + 0.4329510 ) + 0.238081;
	return a / b;
}
vec3 ACESFilmicToneMapping( vec3 color ) {
	const mat3 ACESInputMat = mat3(
		vec3( 0.59719, 0.07600, 0.02840 ),		vec3( 0.35458, 0.90834, 0.13383 ),
		vec3( 0.04823, 0.01566, 0.83777 )
	);
	const mat3 ACESOutputMat = mat3(
		vec3(  1.60475, -0.10208, -0.00327 ),		vec3( -0.53108,  1.10813, -0.07276 ),
		vec3( -0.07367, -0.00605,  1.07602 )
	);
	color *= toneMappingExposure / 0.6;
	color = ACESInputMat * color;
	color = RRTAndODTFit( color );
	color = ACESOutputMat * color;
	return saturate( color );
}
const mat3 LINEAR_REC2020_TO_LINEAR_SRGB = mat3(
	vec3( 1.6605, - 0.1246, - 0.0182 ),
	vec3( - 0.5876, 1.1329, - 0.1006 ),
	vec3( - 0.0728, - 0.0083, 1.1187 )
);
const mat3 LINEAR_SRGB_TO_LINEAR_REC2020 = mat3(
	vec3( 0.6274, 0.0691, 0.0164 ),
	vec3( 0.3293, 0.9195, 0.0880 ),
	vec3( 0.0433, 0.0113, 0.8956 )
);
vec3 agxDefaultContrastApprox( vec3 x ) {
	vec3 x2 = x * x;
	vec3 x4 = x2 * x2;
	return + 15.5 * x4 * x2
		- 40.14 * x4 * x
		+ 31.96 * x4
		- 6.868 * x2 * x
		+ 0.4298 * x2
		+ 0.1191 * x
		- 0.00232;
}
vec3 AgXToneMapping( vec3 color ) {
	const mat3 AgXInsetMatrix = mat3(
		vec3( 0.856627153315983, 0.137318972929847, 0.11189821299995 ),
		vec3( 0.0951212405381588, 0.761241990602591, 0.0767994186031903 ),
		vec3( 0.0482516061458583, 0.101439036467562, 0.811302368396859 )
	);
	const mat3 AgXOutsetMatrix = mat3(
		vec3( 1.1271005818144368, - 0.1413297634984383, - 0.14132976349843826 ),
		vec3( - 0.11060664309660323, 1.157823702216272, - 0.11060664309660294 ),
		vec3( - 0.016493938717834573, - 0.016493938717834257, 1.2519364065950405 )
	);
	const float AgxMinEv = - 12.47393;	const float AgxMaxEv = 4.026069;
	color *= toneMappingExposure;
	color = LINEAR_SRGB_TO_LINEAR_REC2020 * color;
	color = AgXInsetMatrix * color;
	color = max( color, 1e-10 );	color = log2( color );
	color = ( color - AgxMinEv ) / ( AgxMaxEv - AgxMinEv );
	color = clamp( color, 0.0, 1.0 );
	color = agxDefaultContrastApprox( color );
	color = AgXOutsetMatrix * color;
	color = pow( max( vec3( 0.0 ), color ), vec3( 2.2 ) );
	color = LINEAR_REC2020_TO_LINEAR_SRGB * color;
	color = clamp( color, 0.0, 1.0 );
	return color;
}
vec3 NeutralToneMapping( vec3 color ) {
	const float StartCompression = 0.8 - 0.04;
	const float Desaturation = 0.15;
	color *= toneMappingExposure;
	float x = min( color.r, min( color.g, color.b ) );
	float offset = x < 0.08 ? x - 6.25 * x * x : 0.04;
	color -= offset;
	float peak = max( color.r, max( color.g, color.b ) );
	if ( peak < StartCompression ) return color;
	float d = 1. - StartCompression;
	float newPeak = 1. - d * d / ( peak + d - StartCompression );
	color *= newPeak / peak;
	float g = 1. - 1. / ( Desaturation * ( peak - newPeak ) + 1. );
	return mix( color, vec3( newPeak ), g );
}
vec3 CustomToneMapping( vec3 color ) { return color; }`,G0=`#ifdef USE_TRANSMISSION
	material.transmission = transmission;
	material.transmissionAlpha = 1.0;
	material.thickness = thickness;
	material.attenuationDistance = attenuationDistance;
	material.attenuationColor = attenuationColor;
	#ifdef USE_TRANSMISSIONMAP
		material.transmission *= texture2D( transmissionMap, vTransmissionMapUv ).r;
	#endif
	#ifdef USE_THICKNESSMAP
		material.thickness *= texture2D( thicknessMap, vThicknessMapUv ).g;
	#endif
	vec3 pos = vWorldPosition;
	vec3 v = normalize( cameraPosition - pos );
	vec3 n = transformNormalByInverseViewMatrix( normal, viewMatrix );
	vec4 transmitted = getIBLVolumeRefraction(
		n, v, material.roughness, material.diffuseContribution, material.specularColorBlended, material.specularF90,
		pos, modelMatrix, viewMatrix, projectionMatrix, material.dispersion, material.ior, material.thickness,
		material.attenuationColor, material.attenuationDistance );
	material.transmissionAlpha = mix( material.transmissionAlpha, transmitted.a, material.transmission );
	totalDiffuse = mix( totalDiffuse, transmitted.rgb, material.transmission );
#endif`,W0=`#ifdef USE_TRANSMISSION
	uniform float transmission;
	uniform float thickness;
	uniform float attenuationDistance;
	uniform vec3 attenuationColor;
	#ifdef USE_TRANSMISSIONMAP
		uniform sampler2D transmissionMap;
	#endif
	#ifdef USE_THICKNESSMAP
		uniform sampler2D thicknessMap;
	#endif
	uniform vec2 transmissionSamplerSize;
	uniform sampler2D transmissionSamplerMap;
	uniform mat4 modelMatrix;
	uniform mat4 projectionMatrix;
	varying vec3 vWorldPosition;
	float w0( float a ) {
		return ( 1.0 / 6.0 ) * ( a * ( a * ( - a + 3.0 ) - 3.0 ) + 1.0 );
	}
	float w1( float a ) {
		return ( 1.0 / 6.0 ) * ( a *  a * ( 3.0 * a - 6.0 ) + 4.0 );
	}
	float w2( float a ){
		return ( 1.0 / 6.0 ) * ( a * ( a * ( - 3.0 * a + 3.0 ) + 3.0 ) + 1.0 );
	}
	float w3( float a ) {
		return ( 1.0 / 6.0 ) * ( a * a * a );
	}
	float g0( float a ) {
		return w0( a ) + w1( a );
	}
	float g1( float a ) {
		return w2( a ) + w3( a );
	}
	float h0( float a ) {
		return - 1.0 + w1( a ) / ( w0( a ) + w1( a ) );
	}
	float h1( float a ) {
		return 1.0 + w3( a ) / ( w2( a ) + w3( a ) );
	}
	vec4 bicubic( sampler2D tex, vec2 uv, vec4 texelSize, float lod ) {
		uv = uv * texelSize.zw + 0.5;
		vec2 iuv = floor( uv );
		vec2 fuv = fract( uv );
		float g0x = g0( fuv.x );
		float g1x = g1( fuv.x );
		float h0x = h0( fuv.x );
		float h1x = h1( fuv.x );
		float h0y = h0( fuv.y );
		float h1y = h1( fuv.y );
		vec2 p0 = ( vec2( iuv.x + h0x, iuv.y + h0y ) - 0.5 ) * texelSize.xy;
		vec2 p1 = ( vec2( iuv.x + h1x, iuv.y + h0y ) - 0.5 ) * texelSize.xy;
		vec2 p2 = ( vec2( iuv.x + h0x, iuv.y + h1y ) - 0.5 ) * texelSize.xy;
		vec2 p3 = ( vec2( iuv.x + h1x, iuv.y + h1y ) - 0.5 ) * texelSize.xy;
		return g0( fuv.y ) * ( g0x * textureLod( tex, p0, lod ) + g1x * textureLod( tex, p1, lod ) ) +
			g1( fuv.y ) * ( g0x * textureLod( tex, p2, lod ) + g1x * textureLod( tex, p3, lod ) );
	}
	vec4 textureBicubic( sampler2D sampler, vec2 uv, float lod ) {
		vec2 fLodSize = vec2( textureSize( sampler, int( lod ) ) );
		vec2 cLodSize = vec2( textureSize( sampler, int( lod + 1.0 ) ) );
		vec2 fLodSizeInv = 1.0 / fLodSize;
		vec2 cLodSizeInv = 1.0 / cLodSize;
		vec4 fSample = bicubic( sampler, uv, vec4( fLodSizeInv, fLodSize ), floor( lod ) );
		vec4 cSample = bicubic( sampler, uv, vec4( cLodSizeInv, cLodSize ), ceil( lod ) );
		return mix( fSample, cSample, fract( lod ) );
	}
	vec3 getVolumeTransmissionRay( const in vec3 n, const in vec3 v, const in float thickness, const in float ior, const in mat4 modelMatrix ) {
		vec3 refractionVector = refract( - v, normalize( n ), 1.0 / ior );
		vec3 modelScale;
		modelScale.x = length( vec3( modelMatrix[ 0 ].xyz ) );
		modelScale.y = length( vec3( modelMatrix[ 1 ].xyz ) );
		modelScale.z = length( vec3( modelMatrix[ 2 ].xyz ) );
		return normalize( refractionVector ) * thickness * modelScale;
	}
	float applyIorToRoughness( const in float roughness, const in float ior ) {
		return roughness * clamp( ior * 2.0 - 2.0, 0.0, 1.0 );
	}
	vec4 getTransmissionSample( const in vec2 fragCoord, const in float roughness, const in float ior ) {
		float lod = log2( transmissionSamplerSize.x ) * applyIorToRoughness( roughness, ior );
		return textureBicubic( transmissionSamplerMap, fragCoord.xy, lod );
	}
	vec3 volumeAttenuation( const in float transmissionDistance, const in vec3 attenuationColor, const in float attenuationDistance ) {
		if ( isinf( attenuationDistance ) ) {
			return vec3( 1.0 );
		} else {
			vec3 attenuationCoefficient = -log( attenuationColor ) / attenuationDistance;
			vec3 transmittance = exp( - attenuationCoefficient * transmissionDistance );			return transmittance;
		}
	}
	vec4 getIBLVolumeRefraction( const in vec3 n, const in vec3 v, const in float roughness, const in vec3 diffuseColor,
		const in vec3 specularColor, const in float specularF90, const in vec3 position, const in mat4 modelMatrix,
		const in mat4 viewMatrix, const in mat4 projMatrix, const in float dispersion, const in float ior, const in float thickness,
		const in vec3 attenuationColor, const in float attenuationDistance ) {
		vec4 transmittedLight;
		vec3 transmittance;
		#ifdef USE_DISPERSION
			float halfSpread = ( ior - 1.0 ) * 0.025 * dispersion;
			vec3 iors = vec3( ior - halfSpread, ior, ior + halfSpread );
			for ( int i = 0; i < 3; i ++ ) {
				vec3 transmissionRay = getVolumeTransmissionRay( n, v, thickness, iors[ i ], modelMatrix );
				vec3 refractedRayExit = position + transmissionRay;
				vec4 ndcPos = projMatrix * viewMatrix * vec4( refractedRayExit, 1.0 );
				vec2 refractionCoords = ndcPos.xy / ndcPos.w;
				refractionCoords += 1.0;
				refractionCoords /= 2.0;
				vec4 transmissionSample = getTransmissionSample( refractionCoords, roughness, iors[ i ] );
				transmittedLight[ i ] = transmissionSample[ i ];
				transmittedLight.a += transmissionSample.a;
				transmittance[ i ] = diffuseColor[ i ] * volumeAttenuation( length( transmissionRay ), attenuationColor, attenuationDistance )[ i ];
			}
			transmittedLight.a /= 3.0;
		#else
			vec3 transmissionRay = getVolumeTransmissionRay( n, v, thickness, ior, modelMatrix );
			vec3 refractedRayExit = position + transmissionRay;
			vec4 ndcPos = projMatrix * viewMatrix * vec4( refractedRayExit, 1.0 );
			vec2 refractionCoords = ndcPos.xy / ndcPos.w;
			refractionCoords += 1.0;
			refractionCoords /= 2.0;
			transmittedLight = getTransmissionSample( refractionCoords, roughness, ior );
			transmittance = diffuseColor * volumeAttenuation( length( transmissionRay ), attenuationColor, attenuationDistance );
		#endif
		vec3 attenuatedColor = transmittance * transmittedLight.rgb;
		vec3 F = EnvironmentBRDF( n, v, specularColor, specularF90, roughness );
		float transmittanceFactor = ( transmittance.r + transmittance.g + transmittance.b ) / 3.0;
		return vec4( ( 1.0 - F ) * attenuatedColor, 1.0 - ( 1.0 - transmittedLight.a ) * transmittanceFactor );
	}
#endif`,X0=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	varying vec2 vUv;
#endif
#ifdef USE_MAP
	varying vec2 vMapUv;
#endif
#ifdef USE_ALPHAMAP
	varying vec2 vAlphaMapUv;
#endif
#ifdef USE_LIGHTMAP
	varying vec2 vLightMapUv;
#endif
#ifdef USE_AOMAP
	varying vec2 vAoMapUv;
#endif
#ifdef USE_BUMPMAP
	varying vec2 vBumpMapUv;
#endif
#ifdef USE_NORMALMAP
	varying vec2 vNormalMapUv;
#endif
#ifdef USE_EMISSIVEMAP
	varying vec2 vEmissiveMapUv;
#endif
#ifdef USE_METALNESSMAP
	varying vec2 vMetalnessMapUv;
#endif
#ifdef USE_ROUGHNESSMAP
	varying vec2 vRoughnessMapUv;
#endif
#ifdef USE_ANISOTROPYMAP
	varying vec2 vAnisotropyMapUv;
#endif
#ifdef USE_CLEARCOATMAP
	varying vec2 vClearcoatMapUv;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	varying vec2 vClearcoatNormalMapUv;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	varying vec2 vClearcoatRoughnessMapUv;
#endif
#ifdef USE_IRIDESCENCEMAP
	varying vec2 vIridescenceMapUv;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	varying vec2 vIridescenceThicknessMapUv;
#endif
#ifdef USE_SHEEN_COLORMAP
	varying vec2 vSheenColorMapUv;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	varying vec2 vSheenRoughnessMapUv;
#endif
#ifdef USE_SPECULARMAP
	varying vec2 vSpecularMapUv;
#endif
#ifdef USE_SPECULAR_COLORMAP
	varying vec2 vSpecularColorMapUv;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	varying vec2 vSpecularIntensityMapUv;
#endif
#ifdef USE_TRANSMISSIONMAP
	uniform mat3 transmissionMapTransform;
	varying vec2 vTransmissionMapUv;
#endif
#ifdef USE_THICKNESSMAP
	uniform mat3 thicknessMapTransform;
	varying vec2 vThicknessMapUv;
#endif`,q0=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	varying vec2 vUv;
#endif
#ifdef USE_MAP
	uniform mat3 mapTransform;
	varying vec2 vMapUv;
#endif
#ifdef USE_ALPHAMAP
	uniform mat3 alphaMapTransform;
	varying vec2 vAlphaMapUv;
#endif
#ifdef USE_LIGHTMAP
	uniform mat3 lightMapTransform;
	varying vec2 vLightMapUv;
#endif
#ifdef USE_AOMAP
	uniform mat3 aoMapTransform;
	varying vec2 vAoMapUv;
#endif
#ifdef USE_BUMPMAP
	uniform mat3 bumpMapTransform;
	varying vec2 vBumpMapUv;
#endif
#ifdef USE_NORMALMAP
	uniform mat3 normalMapTransform;
	varying vec2 vNormalMapUv;
#endif
#ifdef USE_DISPLACEMENTMAP
	uniform mat3 displacementMapTransform;
	varying vec2 vDisplacementMapUv;
#endif
#ifdef USE_EMISSIVEMAP
	uniform mat3 emissiveMapTransform;
	varying vec2 vEmissiveMapUv;
#endif
#ifdef USE_METALNESSMAP
	uniform mat3 metalnessMapTransform;
	varying vec2 vMetalnessMapUv;
#endif
#ifdef USE_ROUGHNESSMAP
	uniform mat3 roughnessMapTransform;
	varying vec2 vRoughnessMapUv;
#endif
#ifdef USE_ANISOTROPYMAP
	uniform mat3 anisotropyMapTransform;
	varying vec2 vAnisotropyMapUv;
#endif
#ifdef USE_CLEARCOATMAP
	uniform mat3 clearcoatMapTransform;
	varying vec2 vClearcoatMapUv;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform mat3 clearcoatNormalMapTransform;
	varying vec2 vClearcoatNormalMapUv;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform mat3 clearcoatRoughnessMapTransform;
	varying vec2 vClearcoatRoughnessMapUv;
#endif
#ifdef USE_SHEEN_COLORMAP
	uniform mat3 sheenColorMapTransform;
	varying vec2 vSheenColorMapUv;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	uniform mat3 sheenRoughnessMapTransform;
	varying vec2 vSheenRoughnessMapUv;
#endif
#ifdef USE_IRIDESCENCEMAP
	uniform mat3 iridescenceMapTransform;
	varying vec2 vIridescenceMapUv;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform mat3 iridescenceThicknessMapTransform;
	varying vec2 vIridescenceThicknessMapUv;
#endif
#ifdef USE_SPECULARMAP
	uniform mat3 specularMapTransform;
	varying vec2 vSpecularMapUv;
#endif
#ifdef USE_SPECULAR_COLORMAP
	uniform mat3 specularColorMapTransform;
	varying vec2 vSpecularColorMapUv;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	uniform mat3 specularIntensityMapTransform;
	varying vec2 vSpecularIntensityMapUv;
#endif
#ifdef USE_TRANSMISSIONMAP
	uniform mat3 transmissionMapTransform;
	varying vec2 vTransmissionMapUv;
#endif
#ifdef USE_THICKNESSMAP
	uniform mat3 thicknessMapTransform;
	varying vec2 vThicknessMapUv;
#endif`,$0=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	vUv = vec3( uv, 1 ).xy;
#endif
#ifdef USE_MAP
	vMapUv = ( mapTransform * vec3( MAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ALPHAMAP
	vAlphaMapUv = ( alphaMapTransform * vec3( ALPHAMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_LIGHTMAP
	vLightMapUv = ( lightMapTransform * vec3( LIGHTMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_AOMAP
	vAoMapUv = ( aoMapTransform * vec3( AOMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_BUMPMAP
	vBumpMapUv = ( bumpMapTransform * vec3( BUMPMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_NORMALMAP
	vNormalMapUv = ( normalMapTransform * vec3( NORMALMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_DISPLACEMENTMAP
	vDisplacementMapUv = ( displacementMapTransform * vec3( DISPLACEMENTMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_EMISSIVEMAP
	vEmissiveMapUv = ( emissiveMapTransform * vec3( EMISSIVEMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_METALNESSMAP
	vMetalnessMapUv = ( metalnessMapTransform * vec3( METALNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ROUGHNESSMAP
	vRoughnessMapUv = ( roughnessMapTransform * vec3( ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ANISOTROPYMAP
	vAnisotropyMapUv = ( anisotropyMapTransform * vec3( ANISOTROPYMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOATMAP
	vClearcoatMapUv = ( clearcoatMapTransform * vec3( CLEARCOATMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	vClearcoatNormalMapUv = ( clearcoatNormalMapTransform * vec3( CLEARCOAT_NORMALMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	vClearcoatRoughnessMapUv = ( clearcoatRoughnessMapTransform * vec3( CLEARCOAT_ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_IRIDESCENCEMAP
	vIridescenceMapUv = ( iridescenceMapTransform * vec3( IRIDESCENCEMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	vIridescenceThicknessMapUv = ( iridescenceThicknessMapTransform * vec3( IRIDESCENCE_THICKNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SHEEN_COLORMAP
	vSheenColorMapUv = ( sheenColorMapTransform * vec3( SHEEN_COLORMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	vSheenRoughnessMapUv = ( sheenRoughnessMapTransform * vec3( SHEEN_ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULARMAP
	vSpecularMapUv = ( specularMapTransform * vec3( SPECULARMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULAR_COLORMAP
	vSpecularColorMapUv = ( specularColorMapTransform * vec3( SPECULAR_COLORMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	vSpecularIntensityMapUv = ( specularIntensityMapTransform * vec3( SPECULAR_INTENSITYMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_TRANSMISSIONMAP
	vTransmissionMapUv = ( transmissionMapTransform * vec3( TRANSMISSIONMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_THICKNESSMAP
	vThicknessMapUv = ( thicknessMapTransform * vec3( THICKNESSMAP_UV, 1 ) ).xy;
#endif`,Y0=`#if defined( USE_ENVMAP ) || defined( DISTANCE ) || defined ( USE_SHADOWMAP ) || defined ( USE_TRANSMISSION ) || NUM_SPOT_LIGHT_COORDS > 0
	vec4 worldPosition = vec4( transformed, 1.0 );
	#ifdef USE_BATCHING
		worldPosition = batchingMatrix * worldPosition;
	#endif
	#ifdef USE_INSTANCING
		worldPosition = instanceMatrix * worldPosition;
	#endif
	worldPosition = modelMatrix * worldPosition;
#endif`;const K0=`varying vec2 vUv;
uniform mat3 uvTransform;
void main() {
	vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	gl_Position = vec4( position.xy, 1.0, 1.0 );
}`,Z0=`uniform sampler2D t2D;
uniform float backgroundIntensity;
varying vec2 vUv;
void main() {
	vec4 texColor = texture2D( t2D, vUv );
	#ifdef DECODE_VIDEO_TEXTURE
		texColor = vec4( mix( pow( texColor.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), texColor.rgb * 0.0773993808, vec3( lessThanEqual( texColor.rgb, vec3( 0.04045 ) ) ) ), texColor.w );
	#endif
	texColor.rgb *= backgroundIntensity;
	gl_FragColor = texColor;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,j0=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,J0=`#ifdef ENVMAP_TYPE_CUBE
	uniform samplerCube envMap;
#elif defined( ENVMAP_TYPE_CUBE_UV )
	uniform sampler2D envMap;
#endif
uniform float backgroundBlurriness;
uniform float backgroundIntensity;
uniform mat3 backgroundRotation;
varying vec3 vWorldDirection;
#include <cube_uv_reflection_fragment>
void main() {
	#ifdef ENVMAP_TYPE_CUBE
		vec4 texColor = textureCube( envMap, backgroundRotation * vWorldDirection );
	#elif defined( ENVMAP_TYPE_CUBE_UV )
		vec4 texColor = textureCubeUV( envMap, backgroundRotation * vWorldDirection, backgroundBlurriness );
	#else
		vec4 texColor = vec4( 0.0, 0.0, 0.0, 1.0 );
	#endif
	texColor.rgb *= backgroundIntensity;
	gl_FragColor = texColor;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,Q0=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,tx=`uniform samplerCube tCube;
uniform float tFlip;
uniform float opacity;
varying vec3 vWorldDirection;
void main() {
	vec4 texColor = textureCube( tCube, vec3( tFlip * vWorldDirection.x, vWorldDirection.yz ) );
	gl_FragColor = texColor;
	gl_FragColor.a *= opacity;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,ex=`#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
varying vec2 vHighPrecisionZW;
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <skinbase_vertex>
	#include <morphinstance_vertex>
	#ifdef USE_DISPLACEMENTMAP
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vHighPrecisionZW = gl_Position.zw;
}`,nx=`#if DEPTH_PACKING == 3200
	uniform float opacity;
#endif
#include <common>
#include <packing>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
varying vec2 vHighPrecisionZW;
void main() {
	vec4 diffuseColor = vec4( 1.0 );
	#include <clipping_planes_fragment>
	#if DEPTH_PACKING == 3200
		diffuseColor.a = opacity;
	#endif
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <logdepthbuf_fragment>
	#ifdef USE_REVERSED_DEPTH_BUFFER
		float fragCoordZ = vHighPrecisionZW[ 0 ] / vHighPrecisionZW[ 1 ];
	#else
		float fragCoordZ = 0.5 * vHighPrecisionZW[ 0 ] / vHighPrecisionZW[ 1 ] + 0.5;
	#endif
	#if DEPTH_PACKING == 3200
		gl_FragColor = vec4( vec3( 1.0 - fragCoordZ ), opacity );
	#elif DEPTH_PACKING == 3201
		gl_FragColor = packDepthToRGBA( fragCoordZ );
	#elif DEPTH_PACKING == 3202
		gl_FragColor = vec4( packDepthToRGB( fragCoordZ ), 1.0 );
	#elif DEPTH_PACKING == 3203
		gl_FragColor = vec4( packDepthToRG( fragCoordZ ), 0.0, 1.0 );
	#endif
}`,ix=`#define DISTANCE
varying vec3 vWorldPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <skinbase_vertex>
	#include <morphinstance_vertex>
	#ifdef USE_DISPLACEMENTMAP
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <worldpos_vertex>
	#include <clipping_planes_vertex>
	vWorldPosition = worldPosition.xyz;
}`,sx=`#define DISTANCE
uniform vec3 referencePosition;
uniform float nearDistance;
uniform float farDistance;
varying vec3 vWorldPosition;
#include <common>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( 1.0 );
	#include <clipping_planes_fragment>
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	float dist = length( vWorldPosition - referencePosition );
	dist = ( dist - nearDistance ) / ( farDistance - nearDistance );
	dist = saturate( dist );
	gl_FragColor = vec4( dist, 0.0, 0.0, 1.0 );
}`,rx=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
}`,ox=`uniform sampler2D tEquirect;
varying vec3 vWorldDirection;
#include <common>
void main() {
	vec3 direction = normalize( vWorldDirection );
	vec2 sampleUV = equirectUv( direction );
	gl_FragColor = texture2D( tEquirect, sampleUV );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,ax=`uniform float scale;
attribute float lineDistance;
varying float vLineDistance;
#include <common>
#include <uv_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	vLineDistance = scale * lineDistance;
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
}`,lx=`uniform vec3 diffuse;
uniform float opacity;
uniform float dashSize;
uniform float totalSize;
varying float vLineDistance;
#include <common>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	if ( mod( vLineDistance, totalSize ) > dashSize ) {
		discard;
	}
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,cx=`#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#if defined ( USE_ENVMAP ) || defined ( USE_SKINNING )
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinbase_vertex>
		#include <skinnormal_vertex>
		#include <defaultnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <fog_vertex>
}`,hx=`uniform vec3 diffuse;
uniform float opacity;
#ifndef FLAT_SHADED
	varying vec3 vNormal;
#endif
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	#ifdef USE_LIGHTMAP
		vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
		reflectedLight.indirectDiffuse += lightMapTexel.rgb * lightMapIntensity * RECIPROCAL_PI;
	#else
		reflectedLight.indirectDiffuse += vec3( 1.0 );
	#endif
	#include <aomap_fragment>
	reflectedLight.indirectDiffuse *= diffuseColor.rgb;
	vec3 outgoingLight = reflectedLight.indirectDiffuse;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,ux=`#define LAMBERT
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,dx=`#define LAMBERT
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float opacity;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <cube_uv_reflection_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <envmap_physical_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_lambert_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_lambert_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,fx=`#define MATCAP
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <color_pars_vertex>
#include <displacementmap_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
	vViewPosition = - mvPosition.xyz;
}`,px=`#define MATCAP
uniform vec3 diffuse;
uniform float opacity;
uniform sampler2D matcap;
varying vec3 vViewPosition;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <normal_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	vec3 viewDir = normalize( vViewPosition );
	vec3 x = normalize( vec3( viewDir.z, 0.0, - viewDir.x ) );
	vec3 y = cross( viewDir, x );
	vec2 uv = vec2( dot( x, normal ), dot( y, normal ) ) * 0.495 + 0.5;
	#ifdef USE_MATCAP
		vec4 matcapColor = texture2D( matcap, uv );
	#else
		vec4 matcapColor = vec4( vec3( mix( 0.2, 0.8, uv.y ) ), 1.0 );
	#endif
	vec3 outgoingLight = diffuseColor.rgb * matcapColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,mx=`#define NORMAL
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	varying vec3 vViewPosition;
#endif
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	vViewPosition = - mvPosition.xyz;
#endif
}`,gx=`#define NORMAL
uniform float opacity;
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	varying vec3 vViewPosition;
#endif
#include <uv_pars_fragment>
#include <normal_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( 0.0, 0.0, 0.0, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	gl_FragColor = vec4( normalize( normal ) * 0.5 + 0.5, diffuseColor.a );
	#ifdef OPAQUE
		gl_FragColor.a = 1.0;
	#endif
}`,_x=`#define PHONG
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,xx=`#define PHONG
uniform vec3 diffuse;
uniform vec3 emissive;
uniform vec3 specular;
uniform float shininess;
uniform float opacity;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <cube_uv_reflection_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <envmap_physical_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_phong_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_phong_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + reflectedLight.directSpecular + reflectedLight.indirectSpecular + totalEmissiveRadiance;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,vx=`#define STANDARD
varying vec3 vViewPosition;
#ifdef USE_TRANSMISSION
	varying vec3 vWorldPosition;
#endif
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
#ifdef USE_TRANSMISSION
	vWorldPosition = worldPosition.xyz;
#endif
}`,yx=`#define STANDARD
#ifdef PHYSICAL
	#define IOR
	#define USE_SPECULAR
#endif
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float roughness;
uniform float metalness;
uniform float opacity;
#ifdef IOR
	uniform float ior;
#endif
#ifdef USE_SPECULAR
	uniform float specularIntensity;
	uniform vec3 specularColor;
	#ifdef USE_SPECULAR_COLORMAP
		uniform sampler2D specularColorMap;
	#endif
	#ifdef USE_SPECULAR_INTENSITYMAP
		uniform sampler2D specularIntensityMap;
	#endif
#endif
#ifdef USE_CLEARCOAT
	uniform float clearcoat;
	uniform float clearcoatRoughness;
#endif
#ifdef USE_DISPERSION
	uniform float dispersion;
#endif
#ifdef USE_IRIDESCENCE
	uniform float iridescence;
	uniform float iridescenceIOR;
	uniform float iridescenceThicknessMinimum;
	uniform float iridescenceThicknessMaximum;
#endif
#ifdef USE_SHEEN
	uniform vec3 sheenColor;
	uniform float sheenRoughness;
	#ifdef USE_SHEEN_COLORMAP
		uniform sampler2D sheenColorMap;
	#endif
	#ifdef USE_SHEEN_ROUGHNESSMAP
		uniform sampler2D sheenRoughnessMap;
	#endif
#endif
#ifdef USE_ANISOTROPY
	uniform vec2 anisotropyVector;
	#ifdef USE_ANISOTROPYMAP
		uniform sampler2D anisotropyMap;
	#endif
#endif
varying vec3 vViewPosition;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <iridescence_fragment>
#include <cube_uv_reflection_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_physical_pars_fragment>
#include <fog_pars_fragment>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_physical_pars_fragment>
#include <transmission_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <clearcoat_pars_fragment>
#include <iridescence_pars_fragment>
#include <roughnessmap_pars_fragment>
#include <metalnessmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <roughnessmap_fragment>
	#include <metalnessmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <clearcoat_normal_fragment_begin>
	#include <clearcoat_normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_physical_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 totalDiffuse = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse;
	vec3 totalSpecular = reflectedLight.directSpecular + reflectedLight.indirectSpecular;
	#include <transmission_fragment>
	vec3 outgoingLight = totalDiffuse + totalSpecular + totalEmissiveRadiance;
	#ifdef USE_SHEEN
 
		outgoingLight = outgoingLight + sheenSpecularDirect + sheenSpecularIndirect;
 
 	#endif
	#ifdef USE_CLEARCOAT
		float dotNVcc = saturate( dot( geometryClearcoatNormal, geometryViewDir ) );
		vec3 Fcc = F_Schlick( material.clearcoatF0, material.clearcoatF90, dotNVcc );
		outgoingLight = outgoingLight * ( 1.0 - material.clearcoat * Fcc ) + ( clearcoatSpecularDirect + clearcoatSpecularIndirect ) * material.clearcoat;
	#endif
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,Mx=`#define TOON
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,bx=`#define TOON
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float opacity;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <gradientmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_toon_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_toon_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,Sx=`uniform float size;
uniform float scale;
#include <common>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
#ifdef USE_POINTS_UV
	varying vec2 vUv;
	uniform mat3 uvTransform;
#endif
void main() {
	#ifdef USE_POINTS_UV
		vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	#endif
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <project_vertex>
	gl_PointSize = size;
	#ifdef USE_SIZEATTENUATION
		bool isPerspective = isPerspectiveMatrix( projectionMatrix );
		if ( isPerspective ) gl_PointSize *= ( scale / - mvPosition.z );
	#endif
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <worldpos_vertex>
	#include <fog_vertex>
}`,wx=`uniform vec3 diffuse;
uniform float opacity;
#include <common>
#include <color_pars_fragment>
#include <map_particle_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_particle_fragment>
	#include <color_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,Ex=`#include <common>
#include <batching_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <shadowmap_pars_vertex>
void main() {
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,Tx=`uniform vec3 color;
uniform float opacity;
#include <common>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <logdepthbuf_pars_fragment>
#include <shadowmap_pars_fragment>
#include <shadowmask_pars_fragment>
void main() {
	#include <logdepthbuf_fragment>
	gl_FragColor = vec4( color, opacity * ( 1.0 - getShadowMask() ) );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,Ax=`uniform float rotation;
uniform vec2 center;
#include <common>
#include <uv_pars_vertex>
#include <fog_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	vec4 mvPosition = modelViewMatrix[ 3 ];
	vec2 scale = vec2( length( modelMatrix[ 0 ].xyz ), length( modelMatrix[ 1 ].xyz ) );
	#ifndef USE_SIZEATTENUATION
		bool isPerspective = isPerspectiveMatrix( projectionMatrix );
		if ( isPerspective ) scale *= - mvPosition.z;
	#endif
	vec2 alignedPosition = ( position.xy - ( center - vec2( 0.5 ) ) ) * scale;
	vec2 rotatedPosition;
	rotatedPosition.x = cos( rotation ) * alignedPosition.x - sin( rotation ) * alignedPosition.y;
	rotatedPosition.y = sin( rotation ) * alignedPosition.x + cos( rotation ) * alignedPosition.y;
	mvPosition.xy += rotatedPosition;
	gl_Position = projectionMatrix * mvPosition;
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
}`,Cx=`uniform vec3 diffuse;
uniform float opacity;
#include <common>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
}`,$t={alphahash_fragment:Kg,alphahash_pars_fragment:Zg,alphamap_fragment:jg,alphamap_pars_fragment:Jg,alphatest_fragment:Qg,alphatest_pars_fragment:t_,aomap_fragment:e_,aomap_pars_fragment:n_,batching_pars_vertex:i_,batching_vertex:s_,begin_vertex:r_,beginnormal_vertex:o_,bsdfs:a_,iridescence_fragment:l_,bumpmap_pars_fragment:c_,clipping_planes_fragment:h_,clipping_planes_pars_fragment:u_,clipping_planes_pars_vertex:d_,clipping_planes_vertex:f_,color_fragment:p_,color_pars_fragment:m_,color_pars_vertex:g_,color_vertex:__,common:x_,cube_uv_reflection_fragment:v_,defaultnormal_vertex:y_,displacementmap_pars_vertex:M_,displacementmap_vertex:b_,emissivemap_fragment:S_,emissivemap_pars_fragment:w_,colorspace_fragment:E_,colorspace_pars_fragment:T_,envmap_fragment:A_,envmap_common_pars_fragment:C_,envmap_pars_fragment:R_,envmap_pars_vertex:P_,envmap_physical_pars_fragment:H_,envmap_vertex:I_,fog_vertex:L_,fog_pars_vertex:D_,fog_fragment:N_,fog_pars_fragment:U_,gradientmap_pars_fragment:F_,lightmap_pars_fragment:O_,lights_lambert_fragment:k_,lights_lambert_pars_fragment:B_,lights_pars_begin:z_,lights_toon_fragment:V_,lights_toon_pars_fragment:G_,lights_phong_fragment:W_,lights_phong_pars_fragment:X_,lights_physical_fragment:q_,lights_physical_pars_fragment:$_,lights_fragment_begin:Y_,lights_fragment_maps:K_,lights_fragment_end:Z_,lightprobes_pars_fragment:j_,logdepthbuf_fragment:J_,logdepthbuf_pars_fragment:Q_,logdepthbuf_pars_vertex:t0,logdepthbuf_vertex:e0,map_fragment:n0,map_pars_fragment:i0,map_particle_fragment:s0,map_particle_pars_fragment:r0,metalnessmap_fragment:o0,metalnessmap_pars_fragment:a0,morphinstance_vertex:l0,morphcolor_vertex:c0,morphnormal_vertex:h0,morphtarget_pars_vertex:u0,morphtarget_vertex:d0,normal_fragment_begin:f0,normal_fragment_maps:p0,normal_pars_fragment:m0,normal_pars_vertex:g0,normal_vertex:_0,normalmap_pars_fragment:x0,clearcoat_normal_fragment_begin:v0,clearcoat_normal_fragment_maps:y0,clearcoat_pars_fragment:M0,iridescence_pars_fragment:b0,opaque_fragment:S0,packing:w0,premultiplied_alpha_fragment:E0,project_vertex:T0,dithering_fragment:A0,dithering_pars_fragment:C0,roughnessmap_fragment:R0,roughnessmap_pars_fragment:P0,shadowmap_pars_fragment:I0,shadowmap_pars_vertex:L0,shadowmap_vertex:D0,shadowmask_pars_fragment:N0,skinbase_vertex:U0,skinning_pars_vertex:F0,skinning_vertex:O0,skinnormal_vertex:k0,specularmap_fragment:B0,specularmap_pars_fragment:z0,tonemapping_fragment:H0,tonemapping_pars_fragment:V0,transmission_fragment:G0,transmission_pars_fragment:W0,uv_pars_fragment:X0,uv_pars_vertex:q0,uv_vertex:$0,worldpos_vertex:Y0,background_vert:K0,background_frag:Z0,backgroundCube_vert:j0,backgroundCube_frag:J0,cube_vert:Q0,cube_frag:tx,depth_vert:ex,depth_frag:nx,distance_vert:ix,distance_frag:sx,equirect_vert:rx,equirect_frag:ox,linedashed_vert:ax,linedashed_frag:lx,meshbasic_vert:cx,meshbasic_frag:hx,meshlambert_vert:ux,meshlambert_frag:dx,meshmatcap_vert:fx,meshmatcap_frag:px,meshnormal_vert:mx,meshnormal_frag:gx,meshphong_vert:_x,meshphong_frag:xx,meshphysical_vert:vx,meshphysical_frag:yx,meshtoon_vert:Mx,meshtoon_frag:bx,points_vert:Sx,points_frag:wx,shadow_vert:Ex,shadow_frag:Tx,sprite_vert:Ax,sprite_frag:Cx},mt={common:{diffuse:{value:new Et(16777215)},opacity:{value:1},map:{value:null},mapTransform:{value:new Vt},alphaMap:{value:null},alphaMapTransform:{value:new Vt},alphaTest:{value:0}},specularmap:{specularMap:{value:null},specularMapTransform:{value:new Vt}},envmap:{envMap:{value:null},envMapRotation:{value:new Vt},reflectivity:{value:1},ior:{value:1.5},refractionRatio:{value:.98},dfgLUT:{value:null}},aomap:{aoMap:{value:null},aoMapIntensity:{value:1},aoMapTransform:{value:new Vt}},lightmap:{lightMap:{value:null},lightMapIntensity:{value:1},lightMapTransform:{value:new Vt}},bumpmap:{bumpMap:{value:null},bumpMapTransform:{value:new Vt},bumpScale:{value:1}},normalmap:{normalMap:{value:null},normalMapTransform:{value:new Vt},normalScale:{value:new At(1,1)}},displacementmap:{displacementMap:{value:null},displacementMapTransform:{value:new Vt},displacementScale:{value:1},displacementBias:{value:0}},emissivemap:{emissiveMap:{value:null},emissiveMapTransform:{value:new Vt}},metalnessmap:{metalnessMap:{value:null},metalnessMapTransform:{value:new Vt}},roughnessmap:{roughnessMap:{value:null},roughnessMapTransform:{value:new Vt}},gradientmap:{gradientMap:{value:null}},fog:{fogDensity:{value:25e-5},fogNear:{value:1},fogFar:{value:2e3},fogColor:{value:new Et(16777215)}},lights:{ambientLightColor:{value:[]},lightProbe:{value:[]},directionalLights:{value:[],properties:{direction:{},color:{}}},directionalLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},directionalShadowMatrix:{value:[]},spotLights:{value:[],properties:{color:{},position:{},direction:{},distance:{},coneCos:{},penumbraCos:{},decay:{}}},spotLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},spotLightMap:{value:[]},spotLightMatrix:{value:[]},pointLights:{value:[],properties:{color:{},position:{},decay:{},distance:{}}},pointLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{},shadowCameraNear:{},shadowCameraFar:{}}},pointShadowMatrix:{value:[]},hemisphereLights:{value:[],properties:{direction:{},skyColor:{},groundColor:{}}},rectAreaLights:{value:[],properties:{color:{},position:{},width:{},height:{}}},ltc_1:{value:null},ltc_2:{value:null},probesSH:{value:null},probesMin:{value:new P},probesMax:{value:new P},probesResolution:{value:new P}},points:{diffuse:{value:new Et(16777215)},opacity:{value:1},size:{value:1},scale:{value:1},map:{value:null},alphaMap:{value:null},alphaMapTransform:{value:new Vt},alphaTest:{value:0},uvTransform:{value:new Vt}},sprite:{diffuse:{value:new Et(16777215)},opacity:{value:1},center:{value:new At(.5,.5)},rotation:{value:0},map:{value:null},mapTransform:{value:new Vt},alphaMap:{value:null},alphaMapTransform:{value:new Vt},alphaTest:{value:0}}},jn={basic:{uniforms:dn([mt.common,mt.specularmap,mt.envmap,mt.aomap,mt.lightmap,mt.fog]),vertexShader:$t.meshbasic_vert,fragmentShader:$t.meshbasic_frag},lambert:{uniforms:dn([mt.common,mt.specularmap,mt.envmap,mt.aomap,mt.lightmap,mt.emissivemap,mt.bumpmap,mt.normalmap,mt.displacementmap,mt.fog,mt.lights,{emissive:{value:new Et(0)},envMapIntensity:{value:1}}]),vertexShader:$t.meshlambert_vert,fragmentShader:$t.meshlambert_frag},phong:{uniforms:dn([mt.common,mt.specularmap,mt.envmap,mt.aomap,mt.lightmap,mt.emissivemap,mt.bumpmap,mt.normalmap,mt.displacementmap,mt.fog,mt.lights,{emissive:{value:new Et(0)},specular:{value:new Et(1118481)},shininess:{value:30},envMapIntensity:{value:1}}]),vertexShader:$t.meshphong_vert,fragmentShader:$t.meshphong_frag},standard:{uniforms:dn([mt.common,mt.envmap,mt.aomap,mt.lightmap,mt.emissivemap,mt.bumpmap,mt.normalmap,mt.displacementmap,mt.roughnessmap,mt.metalnessmap,mt.fog,mt.lights,{emissive:{value:new Et(0)},roughness:{value:1},metalness:{value:0},envMapIntensity:{value:1}}]),vertexShader:$t.meshphysical_vert,fragmentShader:$t.meshphysical_frag},toon:{uniforms:dn([mt.common,mt.aomap,mt.lightmap,mt.emissivemap,mt.bumpmap,mt.normalmap,mt.displacementmap,mt.gradientmap,mt.fog,mt.lights,{emissive:{value:new Et(0)}}]),vertexShader:$t.meshtoon_vert,fragmentShader:$t.meshtoon_frag},matcap:{uniforms:dn([mt.common,mt.bumpmap,mt.normalmap,mt.displacementmap,mt.fog,{matcap:{value:null}}]),vertexShader:$t.meshmatcap_vert,fragmentShader:$t.meshmatcap_frag},points:{uniforms:dn([mt.points,mt.fog]),vertexShader:$t.points_vert,fragmentShader:$t.points_frag},dashed:{uniforms:dn([mt.common,mt.fog,{scale:{value:1},dashSize:{value:1},totalSize:{value:2}}]),vertexShader:$t.linedashed_vert,fragmentShader:$t.linedashed_frag},depth:{uniforms:dn([mt.common,mt.displacementmap]),vertexShader:$t.depth_vert,fragmentShader:$t.depth_frag},normal:{uniforms:dn([mt.common,mt.bumpmap,mt.normalmap,mt.displacementmap,{opacity:{value:1}}]),vertexShader:$t.meshnormal_vert,fragmentShader:$t.meshnormal_frag},sprite:{uniforms:dn([mt.sprite,mt.fog]),vertexShader:$t.sprite_vert,fragmentShader:$t.sprite_frag},background:{uniforms:{uvTransform:{value:new Vt},t2D:{value:null},backgroundIntensity:{value:1}},vertexShader:$t.background_vert,fragmentShader:$t.background_frag},backgroundCube:{uniforms:{envMap:{value:null},backgroundBlurriness:{value:0},backgroundIntensity:{value:1},backgroundRotation:{value:new Vt}},vertexShader:$t.backgroundCube_vert,fragmentShader:$t.backgroundCube_frag},cube:{uniforms:{tCube:{value:null},tFlip:{value:-1},opacity:{value:1}},vertexShader:$t.cube_vert,fragmentShader:$t.cube_frag},equirect:{uniforms:{tEquirect:{value:null}},vertexShader:$t.equirect_vert,fragmentShader:$t.equirect_frag},distance:{uniforms:dn([mt.common,mt.displacementmap,{referencePosition:{value:new P},nearDistance:{value:1},farDistance:{value:1e3}}]),vertexShader:$t.distance_vert,fragmentShader:$t.distance_frag},shadow:{uniforms:dn([mt.lights,mt.fog,{color:{value:new Et(0)},opacity:{value:1}}]),vertexShader:$t.shadow_vert,fragmentShader:$t.shadow_frag}};jn.physical={uniforms:dn([jn.standard.uniforms,{clearcoat:{value:0},clearcoatMap:{value:null},clearcoatMapTransform:{value:new Vt},clearcoatNormalMap:{value:null},clearcoatNormalMapTransform:{value:new Vt},clearcoatNormalScale:{value:new At(1,1)},clearcoatRoughness:{value:0},clearcoatRoughnessMap:{value:null},clearcoatRoughnessMapTransform:{value:new Vt},dispersion:{value:0},iridescence:{value:0},iridescenceMap:{value:null},iridescenceMapTransform:{value:new Vt},iridescenceIOR:{value:1.3},iridescenceThicknessMinimum:{value:100},iridescenceThicknessMaximum:{value:400},iridescenceThicknessMap:{value:null},iridescenceThicknessMapTransform:{value:new Vt},sheen:{value:0},sheenColor:{value:new Et(0)},sheenColorMap:{value:null},sheenColorMapTransform:{value:new Vt},sheenRoughness:{value:1},sheenRoughnessMap:{value:null},sheenRoughnessMapTransform:{value:new Vt},transmission:{value:0},transmissionMap:{value:null},transmissionMapTransform:{value:new Vt},transmissionSamplerSize:{value:new At},transmissionSamplerMap:{value:null},thickness:{value:0},thicknessMap:{value:null},thicknessMapTransform:{value:new Vt},attenuationDistance:{value:0},attenuationColor:{value:new Et(0)},specularColor:{value:new Et(1,1,1)},specularColorMap:{value:null},specularColorMapTransform:{value:new Vt},specularIntensity:{value:1},specularIntensityMap:{value:null},specularIntensityMapTransform:{value:new Vt},anisotropyVector:{value:new At},anisotropyMap:{value:null},anisotropyMapTransform:{value:new Vt}}]),vertexShader:$t.meshphysical_vert,fragmentShader:$t.meshphysical_frag};const Uo={r:0,b:0,g:0},Rx=new Ht,Of=new Vt;Of.set(-1,0,0,0,1,0,0,0,1);function Px(r,t,e,n,i,s){const o=new Et(0);let a=i===!0?0:1,l,c,h=null,u=0,d=null;function f(b){let E=b.isScene===!0?b.background:null;if(E&&E.isTexture){const y=b.backgroundBlurriness>0;E=t.get(E,y)}return E}function m(b){let E=!1;const y=f(b);y===null?g(o,a):y&&y.isColor&&(g(y,1),E=!0);const S=r.xr.getEnvironmentBlendMode();S==="additive"?e.buffers.color.setClear(0,0,0,1,s):S==="alpha-blend"&&e.buffers.color.setClear(0,0,0,0,s),(r.autoClear||E)&&(e.buffers.depth.setTest(!0),e.buffers.depth.setMask(!0),e.buffers.color.setMask(!0),r.clear(r.autoClearColor,r.autoClearDepth,r.autoClearStencil))}function _(b,E){const y=f(E);y&&(y.isCubeTexture||y.mapping===fa)?(c===void 0&&(c=new te(new ci(1,1,1),new ai({name:"BackgroundCubeMaterial",uniforms:ir(jn.backgroundCube.uniforms),vertexShader:jn.backgroundCube.vertexShader,fragmentShader:jn.backgroundCube.fragmentShader,side:cn,depthTest:!1,depthWrite:!1,fog:!1,allowOverride:!1})),c.geometry.deleteAttribute("normal"),c.geometry.deleteAttribute("uv"),c.onBeforeRender=function(S,w,A){this.matrixWorld.copyPosition(A.matrixWorld)},Object.defineProperty(c.material,"envMap",{get:function(){return this.uniforms.envMap.value}}),n.update(c)),c.material.uniforms.envMap.value=y,c.material.uniforms.backgroundBlurriness.value=E.backgroundBlurriness,c.material.uniforms.backgroundIntensity.value=E.backgroundIntensity,c.material.uniforms.backgroundRotation.value.setFromMatrix4(Rx.makeRotationFromEuler(E.backgroundRotation)).transpose(),y.isCubeTexture&&y.isRenderTargetTexture===!1&&c.material.uniforms.backgroundRotation.value.premultiply(Of),c.material.toneMapped=Qt.getTransfer(y.colorSpace)!==me,(h!==y||u!==y.version||d!==r.toneMapping)&&(c.material.needsUpdate=!0,h=y,u=y.version,d=r.toneMapping),c.layers.enableAll(),b.unshift(c,c.geometry,c.material,0,0,null)):y&&y.isTexture&&(l===void 0&&(l=new te(new er(2,2),new ai({name:"BackgroundMaterial",uniforms:ir(jn.background.uniforms),vertexShader:jn.background.vertexShader,fragmentShader:jn.background.fragmentShader,side:bi,depthTest:!1,depthWrite:!1,fog:!1,allowOverride:!1})),l.geometry.deleteAttribute("normal"),Object.defineProperty(l.material,"map",{get:function(){return this.uniforms.t2D.value}}),n.update(l)),l.material.uniforms.t2D.value=y,l.material.uniforms.backgroundIntensity.value=E.backgroundIntensity,l.material.toneMapped=Qt.getTransfer(y.colorSpace)!==me,y.matrixAutoUpdate===!0&&y.updateMatrix(),l.material.uniforms.uvTransform.value.copy(y.matrix),(h!==y||u!==y.version||d!==r.toneMapping)&&(l.material.needsUpdate=!0,h=y,u=y.version,d=r.toneMapping),l.layers.enableAll(),b.unshift(l,l.geometry,l.material,0,0,null))}function g(b,E){b.getRGB(Uo,Pf(r)),e.buffers.color.setClear(Uo.r,Uo.g,Uo.b,E,s)}function p(){c!==void 0&&(c.geometry.dispose(),c.material.dispose(),c=void 0),l!==void 0&&(l.geometry.dispose(),l.material.dispose(),l=void 0)}return{getClearColor:function(){return o},setClearColor:function(b,E=1){o.set(b),a=E,g(o,a)},getClearAlpha:function(){return a},setClearAlpha:function(b){a=b,g(o,a)},render:m,addToRenderList:_,dispose:p}}function Ix(r,t){const e=r.getParameter(r.MAX_VERTEX_ATTRIBS),n={},i=d(null);let s=i,o=!1;function a(L,U,W,K,k){let $=!1;const V=u(L,K,W,U);s!==V&&(s=V,c(s.object)),$=f(L,K,W,k),$&&m(L,K,W,k),k!==null&&t.update(k,r.ELEMENT_ARRAY_BUFFER),($||o)&&(o=!1,y(L,U,W,K),k!==null&&r.bindBuffer(r.ELEMENT_ARRAY_BUFFER,t.get(k).buffer))}function l(){return r.createVertexArray()}function c(L){return r.bindVertexArray(L)}function h(L){return r.deleteVertexArray(L)}function u(L,U,W,K){const k=K.wireframe===!0;let $=n[U.id];$===void 0&&($={},n[U.id]=$);const V=L.isInstancedMesh===!0?L.id:0;let Q=$[V];Q===void 0&&(Q={},$[V]=Q);let it=Q[W.id];it===void 0&&(it={},Q[W.id]=it);let ft=it[k];return ft===void 0&&(ft=d(l()),it[k]=ft),ft}function d(L){const U=[],W=[],K=[];for(let k=0;k<e;k++)U[k]=0,W[k]=0,K[k]=0;return{geometry:null,program:null,wireframe:!1,newAttributes:U,enabledAttributes:W,attributeDivisors:K,object:L,attributes:{},index:null}}function f(L,U,W,K){const k=s.attributes,$=U.attributes;let V=0;const Q=W.getAttributes();for(const it in Q)if(Q[it].location>=0){const at=k[it];let Y=$[it];if(Y===void 0&&(it==="instanceMatrix"&&L.instanceMatrix&&(Y=L.instanceMatrix),it==="instanceColor"&&L.instanceColor&&(Y=L.instanceColor)),at===void 0||at.attribute!==Y||Y&&at.data!==Y.data)return!0;V++}return s.attributesNum!==V||s.index!==K}function m(L,U,W,K){const k={},$=U.attributes;let V=0;const Q=W.getAttributes();for(const it in Q)if(Q[it].location>=0){let at=$[it];at===void 0&&(it==="instanceMatrix"&&L.instanceMatrix&&(at=L.instanceMatrix),it==="instanceColor"&&L.instanceColor&&(at=L.instanceColor));const Y={};Y.attribute=at,at&&at.data&&(Y.data=at.data),k[it]=Y,V++}s.attributes=k,s.attributesNum=V,s.index=K}function _(){const L=s.newAttributes;for(let U=0,W=L.length;U<W;U++)L[U]=0}function g(L){p(L,0)}function p(L,U){const W=s.newAttributes,K=s.enabledAttributes,k=s.attributeDivisors;W[L]=1,K[L]===0&&(r.enableVertexAttribArray(L),K[L]=1),k[L]!==U&&(r.vertexAttribDivisor(L,U),k[L]=U)}function b(){const L=s.newAttributes,U=s.enabledAttributes;for(let W=0,K=U.length;W<K;W++)U[W]!==L[W]&&(r.disableVertexAttribArray(W),U[W]=0)}function E(L,U,W,K,k,$,V){V===!0?r.vertexAttribIPointer(L,U,W,k,$):r.vertexAttribPointer(L,U,W,K,k,$)}function y(L,U,W,K){_();const k=K.attributes,$=W.getAttributes(),V=U.defaultAttributeValues;for(const Q in $){const it=$[Q];if(it.location>=0){let ft=k[Q];if(ft===void 0&&(Q==="instanceMatrix"&&L.instanceMatrix&&(ft=L.instanceMatrix),Q==="instanceColor"&&L.instanceColor&&(ft=L.instanceColor)),ft!==void 0){const at=ft.normalized,Y=ft.itemSize,Bt=t.get(ft);if(Bt===void 0)continue;const re=Bt.buffer,Zt=Bt.type,Z=Bt.bytesPerElement,ht=Zt===r.INT||Zt===r.UNSIGNED_INT||ft.gpuType===Ic;if(ft.isInterleavedBufferAttribute){const et=ft.data,Dt=et.stride,zt=ft.offset;if(et.isInstancedInterleavedBuffer){for(let Lt=0;Lt<it.locationSize;Lt++)p(it.location+Lt,et.meshPerAttribute);L.isInstancedMesh!==!0&&K._maxInstanceCount===void 0&&(K._maxInstanceCount=et.meshPerAttribute*et.count)}else for(let Lt=0;Lt<it.locationSize;Lt++)g(it.location+Lt);r.bindBuffer(r.ARRAY_BUFFER,re);for(let Lt=0;Lt<it.locationSize;Lt++)E(it.location+Lt,Y/it.locationSize,Zt,at,Dt*Z,(zt+Y/it.locationSize*Lt)*Z,ht)}else{if(ft.isInstancedBufferAttribute){for(let et=0;et<it.locationSize;et++)p(it.location+et,ft.meshPerAttribute);L.isInstancedMesh!==!0&&K._maxInstanceCount===void 0&&(K._maxInstanceCount=ft.meshPerAttribute*ft.count)}else for(let et=0;et<it.locationSize;et++)g(it.location+et);r.bindBuffer(r.ARRAY_BUFFER,re);for(let et=0;et<it.locationSize;et++)E(it.location+et,Y/it.locationSize,Zt,at,Y*Z,Y/it.locationSize*et*Z,ht)}}else if(V!==void 0){const at=V[Q];if(at!==void 0)switch(at.length){case 2:r.vertexAttrib2fv(it.location,at);break;case 3:r.vertexAttrib3fv(it.location,at);break;case 4:r.vertexAttrib4fv(it.location,at);break;default:r.vertexAttrib1fv(it.location,at)}}}}b()}function S(){T();for(const L in n){const U=n[L];for(const W in U){const K=U[W];for(const k in K){const $=K[k];for(const V in $)h($[V].object),delete $[V];delete K[k]}}delete n[L]}}function w(L){if(n[L.id]===void 0)return;const U=n[L.id];for(const W in U){const K=U[W];for(const k in K){const $=K[k];for(const V in $)h($[V].object),delete $[V];delete K[k]}}delete n[L.id]}function A(L){for(const U in n){const W=n[U];for(const K in W){const k=W[K];if(k[L.id]===void 0)continue;const $=k[L.id];for(const V in $)h($[V].object),delete $[V];delete k[L.id]}}}function v(L){for(const U in n){const W=n[U],K=L.isInstancedMesh===!0?L.id:0,k=W[K];if(k!==void 0){for(const $ in k){const V=k[$];for(const Q in V)h(V[Q].object),delete V[Q];delete k[$]}delete W[K],Object.keys(W).length===0&&delete n[U]}}}function T(){I(),o=!0,s!==i&&(s=i,c(s.object))}function I(){i.geometry=null,i.program=null,i.wireframe=!1}return{setup:a,reset:T,resetDefaultState:I,dispose:S,releaseStatesOfGeometry:w,releaseStatesOfObject:v,releaseStatesOfProgram:A,initAttributes:_,enableAttribute:g,disableUnusedAttributes:b}}function Lx(r,t,e){let n;function i(l){n=l}function s(l,c){r.drawArrays(n,l,c),e.update(c,n,1)}function o(l,c,h){h!==0&&(r.drawArraysInstanced(n,l,c,h),e.update(c,n,h))}function a(l,c,h){if(h===0)return;t.get("WEBGL_multi_draw").multiDrawArraysWEBGL(n,l,0,c,0,h);let d=0;for(let f=0;f<h;f++)d+=c[f];e.update(d,n,1)}this.setMode=i,this.render=s,this.renderInstances=o,this.renderMultiDraw=a}function Dx(r,t,e,n){let i;function s(){if(i!==void 0)return i;if(t.has("EXT_texture_filter_anisotropic")===!0){const A=t.get("EXT_texture_filter_anisotropic");i=r.getParameter(A.MAX_TEXTURE_MAX_ANISOTROPY_EXT)}else i=0;return i}function o(A){return!(A!==Un&&n.convert(A)!==r.getParameter(r.IMPLEMENTATION_COLOR_READ_FORMAT))}function a(A){const v=A===Si&&(t.has("EXT_color_buffer_half_float")||t.has("EXT_color_buffer_float"));return!(A!==wn&&n.convert(A)!==r.getParameter(r.IMPLEMENTATION_COLOR_READ_TYPE)&&A!==Nn&&!v)}function l(A){if(A==="highp"){if(r.getShaderPrecisionFormat(r.VERTEX_SHADER,r.HIGH_FLOAT).precision>0&&r.getShaderPrecisionFormat(r.FRAGMENT_SHADER,r.HIGH_FLOAT).precision>0)return"highp";A="mediump"}return A==="mediump"&&r.getShaderPrecisionFormat(r.VERTEX_SHADER,r.MEDIUM_FLOAT).precision>0&&r.getShaderPrecisionFormat(r.FRAGMENT_SHADER,r.MEDIUM_FLOAT).precision>0?"mediump":"lowp"}let c=e.precision!==void 0?e.precision:"highp";const h=l(c);h!==c&&(wt("WebGLRenderer:",c,"not supported, using",h,"instead."),c=h);const u=e.logarithmicDepthBuffer===!0,d=e.reversedDepthBuffer===!0&&t.has("EXT_clip_control");e.reversedDepthBuffer===!0&&d===!1&&wt("WebGLRenderer: Unable to use reversed depth buffer due to missing EXT_clip_control extension. Fallback to default depth buffer.");const f=r.getParameter(r.MAX_TEXTURE_IMAGE_UNITS),m=r.getParameter(r.MAX_VERTEX_TEXTURE_IMAGE_UNITS),_=r.getParameter(r.MAX_TEXTURE_SIZE),g=r.getParameter(r.MAX_CUBE_MAP_TEXTURE_SIZE),p=r.getParameter(r.MAX_VERTEX_ATTRIBS),b=r.getParameter(r.MAX_VERTEX_UNIFORM_VECTORS),E=r.getParameter(r.MAX_VARYING_VECTORS),y=r.getParameter(r.MAX_FRAGMENT_UNIFORM_VECTORS),S=r.getParameter(r.MAX_SAMPLES),w=r.getParameter(r.SAMPLES);return{isWebGL2:!0,getMaxAnisotropy:s,getMaxPrecision:l,textureFormatReadable:o,textureTypeReadable:a,precision:c,logarithmicDepthBuffer:u,reversedDepthBuffer:d,maxTextures:f,maxVertexTextures:m,maxTextureSize:_,maxCubemapSize:g,maxAttributes:p,maxVertexUniforms:b,maxVaryings:E,maxFragmentUniforms:y,maxSamples:S,samples:w}}function Nx(r){const t=this;let e=null,n=0,i=!1,s=!1;const o=new Oi,a=new Vt,l={value:null,needsUpdate:!1};this.uniform=l,this.numPlanes=0,this.numIntersection=0,this.init=function(u,d){const f=u.length!==0||d||n!==0||i;return i=d,n=u.length,f},this.beginShadows=function(){s=!0,h(null)},this.endShadows=function(){s=!1},this.setGlobalState=function(u,d){e=h(u,d,0)},this.setState=function(u,d,f){const m=u.clippingPlanes,_=u.clipIntersection,g=u.clipShadows,p=r.get(u);if(!i||m===null||m.length===0||s&&!g)s?h(null):c();else{const b=s?0:n,E=b*4;let y=p.clippingState||null;l.value=y,y=h(m,d,E,f);for(let S=0;S!==E;++S)y[S]=e[S];p.clippingState=y,this.numIntersection=_?this.numPlanes:0,this.numPlanes+=b}};function c(){l.value!==e&&(l.value=e,l.needsUpdate=n>0),t.numPlanes=n,t.numIntersection=0}function h(u,d,f,m){const _=u!==null?u.length:0;let g=null;if(_!==0){if(g=l.value,m!==!0||g===null){const p=f+_*4,b=d.matrixWorldInverse;a.getNormalMatrix(b),(g===null||g.length<p)&&(g=new Float32Array(p));for(let E=0,y=f;E!==_;++E,y+=4)o.copy(u[E]).applyMatrix4(b,a),o.normal.toArray(g,y),g[y+3]=o.constant}l.value=g,l.needsUpdate=!0}return t.numPlanes=_,t.numIntersection=0,g}}const Bi=4,Ru=[.125,.215,.35,.446,.526,.582],ts=20,Ux=256,br=new ga,Pu=new Et;let el=null,nl=0,il=0,sl=!1;const Fx=new P;class Iu{constructor(t){this._renderer=t,this._pingPongRenderTarget=null,this._lodMax=0,this._cubeSize=0,this._sizeLods=[],this._sigmas=[],this._lodMeshes=[],this._backgroundBox=null,this._cubemapMaterial=null,this._equirectMaterial=null,this._blurMaterial=null,this._ggxMaterial=null}fromScene(t,e=0,n=.1,i=100,s={}){const{size:o=256,position:a=Fx}=s;el=this._renderer.getRenderTarget(),nl=this._renderer.getActiveCubeFace(),il=this._renderer.getActiveMipmapLevel(),sl=this._renderer.xr.enabled,this._renderer.xr.enabled=!1,this._setSize(o);const l=this._allocateTargets();return l.depthBuffer=!0,this._sceneToCubeUV(t,n,i,l,a),e>0&&this._blur(l,0,0,e),this._applyPMREM(l),this._cleanup(l),l}fromEquirectangular(t,e=null){return this._fromTexture(t,e)}fromCubemap(t,e=null){return this._fromTexture(t,e)}compileCubemapShader(){this._cubemapMaterial===null&&(this._cubemapMaterial=Nu(),this._compileMaterial(this._cubemapMaterial))}compileEquirectangularShader(){this._equirectMaterial===null&&(this._equirectMaterial=Du(),this._compileMaterial(this._equirectMaterial))}dispose(){this._dispose(),this._cubemapMaterial!==null&&this._cubemapMaterial.dispose(),this._equirectMaterial!==null&&this._equirectMaterial.dispose(),this._backgroundBox!==null&&(this._backgroundBox.geometry.dispose(),this._backgroundBox.material.dispose())}_setSize(t){this._lodMax=Math.floor(Math.log2(t)),this._cubeSize=Math.pow(2,this._lodMax)}_dispose(){this._blurMaterial!==null&&this._blurMaterial.dispose(),this._ggxMaterial!==null&&this._ggxMaterial.dispose(),this._pingPongRenderTarget!==null&&this._pingPongRenderTarget.dispose();for(let t=0;t<this._lodMeshes.length;t++)this._lodMeshes[t].geometry.dispose()}_cleanup(t){this._renderer.setRenderTarget(el,nl,il),this._renderer.xr.enabled=sl,t.scissorTest=!1,Is(t,0,0,t.width,t.height)}_fromTexture(t,e){t.mapping===ss||t.mapping===Js?this._setSize(t.image.length===0?16:t.image[0].width||t.image[0].image.width):this._setSize(t.image.width/4),el=this._renderer.getRenderTarget(),nl=this._renderer.getActiveCubeFace(),il=this._renderer.getActiveMipmapLevel(),sl=this._renderer.xr.enabled,this._renderer.xr.enabled=!1;const n=e||this._allocateTargets();return this._textureToCubeUV(t,n),this._applyPMREM(n),this._cleanup(n),n}_allocateTargets(){const t=3*Math.max(this._cubeSize,112),e=4*this._cubeSize,n={magFilter:We,minFilter:We,generateMipmaps:!1,type:Si,format:Un,colorSpace:Tn,depthBuffer:!1},i=Lu(t,e,n);if(this._pingPongRenderTarget===null||this._pingPongRenderTarget.width!==t||this._pingPongRenderTarget.height!==e){this._pingPongRenderTarget!==null&&this._dispose(),this._pingPongRenderTarget=Lu(t,e,n);const{_lodMax:s}=this;({lodMeshes:this._lodMeshes,sizeLods:this._sizeLods,sigmas:this._sigmas}=Ox(s)),this._blurMaterial=Bx(s,t,e),this._ggxMaterial=kx(s,t,e)}return i}_compileMaterial(t){const e=new te(new De,t);this._renderer.compile(e,br)}_sceneToCubeUV(t,e,n,i,s){const l=new tn(90,1,e,n),c=[1,-1,1,1,1,1],h=[1,1,1,-1,-1,-1],u=this._renderer,d=u.autoClear,f=u.toneMapping;u.getClearColor(Pu),u.toneMapping=zn,u.autoClear=!1,u.state.buffers.depth.getReversed()&&(u.setRenderTarget(i),u.clearDepth(),u.setRenderTarget(null)),this._backgroundBox===null&&(this._backgroundBox=new te(new ci,new Le({name:"PMREM.Background",side:cn,depthWrite:!1,depthTest:!1})));const _=this._backgroundBox,g=_.material;let p=!1;const b=t.background;b?b.isColor&&(g.color.copy(b),t.background=null,p=!0):(g.color.copy(Pu),p=!0);for(let E=0;E<6;E++){const y=E%3;y===0?(l.up.set(0,c[E],0),l.position.set(s.x,s.y,s.z),l.lookAt(s.x+h[E],s.y,s.z)):y===1?(l.up.set(0,0,c[E]),l.position.set(s.x,s.y,s.z),l.lookAt(s.x,s.y+h[E],s.z)):(l.up.set(0,c[E],0),l.position.set(s.x,s.y,s.z),l.lookAt(s.x,s.y,s.z+h[E]));const S=this._cubeSize;Is(i,y*S,E>2?S:0,S,S),u.setRenderTarget(i),p&&u.render(_,l),u.render(t,l)}u.toneMapping=f,u.autoClear=d,t.background=b}_textureToCubeUV(t,e){const n=this._renderer,i=t.mapping===ss||t.mapping===Js;i?(this._cubemapMaterial===null&&(this._cubemapMaterial=Nu()),this._cubemapMaterial.uniforms.flipEnvMap.value=t.isRenderTargetTexture===!1?-1:1):this._equirectMaterial===null&&(this._equirectMaterial=Du());const s=i?this._cubemapMaterial:this._equirectMaterial,o=this._lodMeshes[0];o.material=s;const a=s.uniforms;a.envMap.value=t;const l=this._cubeSize;Is(e,0,0,3*l,2*l),n.setRenderTarget(e),n.render(o,br)}_applyPMREM(t){const e=this._renderer,n=e.autoClear;e.autoClear=!1;const i=this._lodMeshes.length;for(let s=1;s<i;s++)this._applyGGXFilter(t,s-1,s);e.autoClear=n}_applyGGXFilter(t,e,n){const i=this._renderer,s=this._pingPongRenderTarget,o=this._ggxMaterial,a=this._lodMeshes[n];a.material=o;const l=o.uniforms,c=n/(this._lodMeshes.length-1),h=e/(this._lodMeshes.length-1),u=Math.sqrt(c*c-h*h),d=0+c*1.25,f=u*d,{_lodMax:m}=this,_=this._sizeLods[n],g=3*_*(n>m-Bi?n-m+Bi:0),p=4*(this._cubeSize-_);l.envMap.value=t.texture,l.roughness.value=f,l.mipInt.value=m-e,Is(s,g,p,3*_,2*_),i.setRenderTarget(s),i.render(a,br),l.envMap.value=s.texture,l.roughness.value=0,l.mipInt.value=m-n,Is(t,g,p,3*_,2*_),i.setRenderTarget(t),i.render(a,br)}_blur(t,e,n,i,s){const o=this._pingPongRenderTarget;this._halfBlur(t,o,e,n,i,"latitudinal",s),this._halfBlur(o,t,n,n,i,"longitudinal",s)}_halfBlur(t,e,n,i,s,o,a){const l=this._renderer,c=this._blurMaterial;o!=="latitudinal"&&o!=="longitudinal"&&Ot("blur direction must be either latitudinal or longitudinal!");const h=3,u=this._lodMeshes[i];u.material=c;const d=c.uniforms,f=this._sizeLods[n]-1,m=isFinite(s)?Math.PI/(2*f):2*Math.PI/(2*ts-1),_=s/m,g=isFinite(s)?1+Math.floor(h*_):ts;g>ts&&wt(`sigmaRadians, ${s}, is too large and will clip, as it requested ${g} samples when the maximum is set to ${ts}`);const p=[];let b=0;for(let A=0;A<ts;++A){const v=A/_,T=Math.exp(-v*v/2);p.push(T),A===0?b+=T:A<g&&(b+=2*T)}for(let A=0;A<p.length;A++)p[A]=p[A]/b;d.envMap.value=t.texture,d.samples.value=g,d.weights.value=p,d.latitudinal.value=o==="latitudinal",a&&(d.poleAxis.value=a);const{_lodMax:E}=this;d.dTheta.value=m,d.mipInt.value=E-n;const y=this._sizeLods[i],S=3*y*(i>E-Bi?i-E+Bi:0),w=4*(this._cubeSize-y);Is(e,S,w,3*y,2*y),l.setRenderTarget(e),l.render(u,br)}}function Ox(r){const t=[],e=[],n=[];let i=r;const s=r-Bi+1+Ru.length;for(let o=0;o<s;o++){const a=Math.pow(2,i);t.push(a);let l=1/a;o>r-Bi?l=Ru[o-r+Bi-1]:o===0&&(l=0),e.push(l);const c=1/(a-2),h=-c,u=1+c,d=[h,h,u,h,u,u,h,h,u,u,h,u],f=6,m=6,_=3,g=2,p=1,b=new Float32Array(_*m*f),E=new Float32Array(g*m*f),y=new Float32Array(p*m*f);for(let w=0;w<f;w++){const A=w%3*2/3-1,v=w>2?0:-1,T=[A,v,0,A+2/3,v,0,A+2/3,v+1,0,A,v,0,A+2/3,v+1,0,A,v+1,0];b.set(T,_*m*w),E.set(d,g*m*w);const I=[w,w,w,w,w,w];y.set(I,p*m*w)}const S=new De;S.setAttribute("position",new gn(b,_)),S.setAttribute("uv",new gn(E,g)),S.setAttribute("faceIndex",new gn(y,p)),n.push(new te(S,null)),i>Bi&&i--}return{lodMeshes:n,sizeLods:t,sigmas:e}}function Lu(r,t,e){const n=new si(r,t,e);return n.texture.mapping=fa,n.texture.name="PMREM.cubeUv",n.scissorTest=!0,n}function Is(r,t,e,n,i){r.viewport.set(t,e,n,i),r.scissor.set(t,e,n,i)}function kx(r,t,e){return new ai({name:"PMREMGGXConvolution",defines:{GGX_SAMPLES:Ux,CUBEUV_TEXEL_WIDTH:1/t,CUBEUV_TEXEL_HEIGHT:1/e,CUBEUV_MAX_MIP:`${r}.0`},uniforms:{envMap:{value:null},roughness:{value:0},mipInt:{value:0}},vertexShader:_a(),fragmentShader:`

			precision highp float;
			precision highp int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;
			uniform float roughness;
			uniform float mipInt;

			#define ENVMAP_TYPE_CUBE_UV
			#include <cube_uv_reflection_fragment>

			#define PI 3.14159265359

			// Van der Corput radical inverse
			float radicalInverse_VdC(uint bits) {
				bits = (bits << 16u) | (bits >> 16u);
				bits = ((bits & 0x55555555u) << 1u) | ((bits & 0xAAAAAAAAu) >> 1u);
				bits = ((bits & 0x33333333u) << 2u) | ((bits & 0xCCCCCCCCu) >> 2u);
				bits = ((bits & 0x0F0F0F0Fu) << 4u) | ((bits & 0xF0F0F0F0u) >> 4u);
				bits = ((bits & 0x00FF00FFu) << 8u) | ((bits & 0xFF00FF00u) >> 8u);
				return float(bits) * 2.3283064365386963e-10; // / 0x100000000
			}

			// Hammersley sequence
			vec2 hammersley(uint i, uint N) {
				return vec2(float(i) / float(N), radicalInverse_VdC(i));
			}

			// GGX VNDF importance sampling (Eric Heitz 2018)
			// "Sampling the GGX Distribution of Visible Normals"
			// https://jcgt.org/published/0007/04/01/
			vec3 importanceSampleGGX_VNDF(vec2 Xi, vec3 V, float roughness) {
				float alpha = roughness * roughness;

				// Section 4.1: Orthonormal basis
				vec3 T1 = vec3(1.0, 0.0, 0.0);
				vec3 T2 = cross(V, T1);

				// Section 4.2: Parameterization of projected area
				float r = sqrt(Xi.x);
				float phi = 2.0 * PI * Xi.y;
				float t1 = r * cos(phi);
				float t2 = r * sin(phi);
				float s = 0.5 * (1.0 + V.z);
				t2 = (1.0 - s) * sqrt(1.0 - t1 * t1) + s * t2;

				// Section 4.3: Reprojection onto hemisphere
				vec3 Nh = t1 * T1 + t2 * T2 + sqrt(max(0.0, 1.0 - t1 * t1 - t2 * t2)) * V;

				// Section 3.4: Transform back to ellipsoid configuration
				return normalize(vec3(alpha * Nh.x, alpha * Nh.y, max(0.0, Nh.z)));
			}

			void main() {
				vec3 N = normalize(vOutputDirection);
				vec3 V = N; // Assume view direction equals normal for pre-filtering

				vec3 prefilteredColor = vec3(0.0);
				float totalWeight = 0.0;

				// For very low roughness, just sample the environment directly
				if (roughness < 0.001) {
					gl_FragColor = vec4(bilinearCubeUV(envMap, N, mipInt), 1.0);
					return;
				}

				// Tangent space basis for VNDF sampling
				vec3 up = abs(N.z) < 0.999 ? vec3(0.0, 0.0, 1.0) : vec3(1.0, 0.0, 0.0);
				vec3 tangent = normalize(cross(up, N));
				vec3 bitangent = cross(N, tangent);

				for(uint i = 0u; i < uint(GGX_SAMPLES); i++) {
					vec2 Xi = hammersley(i, uint(GGX_SAMPLES));

					// For PMREM, V = N, so in tangent space V is always (0, 0, 1)
					vec3 H_tangent = importanceSampleGGX_VNDF(Xi, vec3(0.0, 0.0, 1.0), roughness);

					// Transform H back to world space
					vec3 H = normalize(tangent * H_tangent.x + bitangent * H_tangent.y + N * H_tangent.z);
					vec3 L = normalize(2.0 * dot(V, H) * H - V);

					float NdotL = max(dot(N, L), 0.0);

					if(NdotL > 0.0) {
						// Sample environment at fixed mip level
						// VNDF importance sampling handles the distribution filtering
						vec3 sampleColor = bilinearCubeUV(envMap, L, mipInt);

						// Weight by NdotL for the split-sum approximation
						// VNDF PDF naturally accounts for the visible microfacet distribution
						prefilteredColor += sampleColor * NdotL;
						totalWeight += NdotL;
					}
				}

				if (totalWeight > 0.0) {
					prefilteredColor = prefilteredColor / totalWeight;
				}

				gl_FragColor = vec4(prefilteredColor, 1.0);
			}
		`,blending:vi,depthTest:!1,depthWrite:!1})}function Bx(r,t,e){const n=new Float32Array(ts),i=new P(0,1,0);return new ai({name:"SphericalGaussianBlur",defines:{n:ts,CUBEUV_TEXEL_WIDTH:1/t,CUBEUV_TEXEL_HEIGHT:1/e,CUBEUV_MAX_MIP:`${r}.0`},uniforms:{envMap:{value:null},samples:{value:1},weights:{value:n},latitudinal:{value:!1},dTheta:{value:0},mipInt:{value:0},poleAxis:{value:i}},vertexShader:_a(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;
			uniform int samples;
			uniform float weights[ n ];
			uniform bool latitudinal;
			uniform float dTheta;
			uniform float mipInt;
			uniform vec3 poleAxis;

			#define ENVMAP_TYPE_CUBE_UV
			#include <cube_uv_reflection_fragment>

			vec3 getSample( float theta, vec3 axis ) {

				float cosTheta = cos( theta );
				// Rodrigues' axis-angle rotation
				vec3 sampleDirection = vOutputDirection * cosTheta
					+ cross( axis, vOutputDirection ) * sin( theta )
					+ axis * dot( axis, vOutputDirection ) * ( 1.0 - cosTheta );

				return bilinearCubeUV( envMap, sampleDirection, mipInt );

			}

			void main() {

				vec3 axis = latitudinal ? poleAxis : cross( poleAxis, vOutputDirection );

				if ( all( equal( axis, vec3( 0.0 ) ) ) ) {

					axis = vec3( vOutputDirection.z, 0.0, - vOutputDirection.x );

				}

				axis = normalize( axis );

				gl_FragColor = vec4( 0.0, 0.0, 0.0, 1.0 );
				gl_FragColor.rgb += weights[ 0 ] * getSample( 0.0, axis );

				for ( int i = 1; i < n; i++ ) {

					if ( i >= samples ) {

						break;

					}

					float theta = dTheta * float( i );
					gl_FragColor.rgb += weights[ i ] * getSample( -1.0 * theta, axis );
					gl_FragColor.rgb += weights[ i ] * getSample( theta, axis );

				}

			}
		`,blending:vi,depthTest:!1,depthWrite:!1})}function Du(){return new ai({name:"EquirectangularToCubeUV",uniforms:{envMap:{value:null}},vertexShader:_a(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;

			#include <common>

			void main() {

				vec3 outputDirection = normalize( vOutputDirection );
				vec2 uv = equirectUv( outputDirection );

				gl_FragColor = vec4( texture2D ( envMap, uv ).rgb, 1.0 );

			}
		`,blending:vi,depthTest:!1,depthWrite:!1})}function Nu(){return new ai({name:"CubemapToCubeUV",uniforms:{envMap:{value:null},flipEnvMap:{value:-1}},vertexShader:_a(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			uniform float flipEnvMap;

			varying vec3 vOutputDirection;

			uniform samplerCube envMap;

			void main() {

				gl_FragColor = textureCube( envMap, vec3( flipEnvMap * vOutputDirection.x, vOutputDirection.yz ) );

			}
		`,blending:vi,depthTest:!1,depthWrite:!1})}function _a(){return`

		precision mediump float;
		precision mediump int;

		attribute float faceIndex;

		varying vec3 vOutputDirection;

		// RH coordinate system; PMREM face-indexing convention
		vec3 getDirection( vec2 uv, float face ) {

			uv = 2.0 * uv - 1.0;

			vec3 direction = vec3( uv, 1.0 );

			if ( face == 0.0 ) {

				direction = direction.zyx; // ( 1, v, u ) pos x

			} else if ( face == 1.0 ) {

				direction = direction.xzy;
				direction.xz *= -1.0; // ( -u, 1, -v ) pos y

			} else if ( face == 2.0 ) {

				direction.x *= -1.0; // ( -u, v, 1 ) pos z

			} else if ( face == 3.0 ) {

				direction = direction.zyx;
				direction.xz *= -1.0; // ( -1, v, -u ) neg x

			} else if ( face == 4.0 ) {

				direction = direction.xzy;
				direction.xy *= -1.0; // ( -u, -1, v ) neg y

			} else if ( face == 5.0 ) {

				direction.z *= -1.0; // ( u, v, -1 ) neg z

			}

			return direction;

		}

		void main() {

			vOutputDirection = getDirection( uv, faceIndex );
			gl_Position = vec4( position, 1.0 );

		}
	`}class kf extends si{constructor(t=1,e={}){super(t,t,e),this.isWebGLCubeRenderTarget=!0;const n={width:t,height:t,depth:1},i=[n,n,n,n,n,n];this.texture=new Af(i),this._setTextureOptions(e),this.texture.isRenderTargetTexture=!0}fromEquirectangularTexture(t,e){this.texture.type=e.type,this.texture.colorSpace=e.colorSpace,this.texture.generateMipmaps=e.generateMipmaps,this.texture.minFilter=e.minFilter,this.texture.magFilter=e.magFilter;const n={uniforms:{tEquirect:{value:null}},vertexShader:`

				varying vec3 vWorldDirection;

				vec3 transformDirection( in vec3 dir, in mat4 matrix ) {

					return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );

				}

				void main() {

					vWorldDirection = transformDirection( position, modelMatrix );

					#include <begin_vertex>
					#include <project_vertex>

				}
			`,fragmentShader:`

				uniform sampler2D tEquirect;

				varying vec3 vWorldDirection;

				#include <common>

				void main() {

					vec3 direction = normalize( vWorldDirection );

					vec2 sampleUV = equirectUv( direction );

					gl_FragColor = texture2D( tEquirect, sampleUV );

				}
			`},i=new ci(5,5,5),s=new ai({name:"CubemapFromEquirect",uniforms:ir(n.uniforms),vertexShader:n.vertexShader,fragmentShader:n.fragmentShader,side:cn,blending:vi});s.uniforms.tEquirect.value=e;const o=new te(i,s),a=e.minFilter;return e.minFilter===ei&&(e.minFilter=We),new Pg(1,10,this).update(t,o),e.minFilter=a,o.geometry.dispose(),o.material.dispose(),this}clear(t,e=!0,n=!0,i=!0){const s=t.getRenderTarget();for(let o=0;o<6;o++)t.setRenderTarget(this,o),t.clear(e,n,i);t.setRenderTarget(s)}}function zx(r){let t=new WeakMap,e=new WeakMap,n=null;function i(d,f=!1){return d==null?null:f?o(d):s(d)}function s(d){if(d&&d.isTexture){const f=d.mapping;if(f===wa||f===Ea)if(t.has(d)){const m=t.get(d).texture;return a(m,d.mapping)}else{const m=d.image;if(m&&m.height>0){const _=new kf(m.height);return _.fromEquirectangularTexture(r,d),t.set(d,_),d.addEventListener("dispose",c),a(_.texture,d.mapping)}else return null}}return d}function o(d){if(d&&d.isTexture){const f=d.mapping,m=f===wa||f===Ea,_=f===ss||f===Js;if(m||_){let g=e.get(d);const p=g!==void 0?g.texture.pmremVersion:0;if(d.isRenderTargetTexture&&d.pmremVersion!==p)return n===null&&(n=new Iu(r)),g=m?n.fromEquirectangular(d,g):n.fromCubemap(d,g),g.texture.pmremVersion=d.pmremVersion,e.set(d,g),g.texture;if(g!==void 0)return g.texture;{const b=d.image;return m&&b&&b.height>0||_&&b&&l(b)?(n===null&&(n=new Iu(r)),g=m?n.fromEquirectangular(d):n.fromCubemap(d),g.texture.pmremVersion=d.pmremVersion,e.set(d,g),d.addEventListener("dispose",h),g.texture):null}}}return d}function a(d,f){return f===wa?d.mapping=ss:f===Ea&&(d.mapping=Js),d}function l(d){let f=0;const m=6;for(let _=0;_<m;_++)d[_]!==void 0&&f++;return f===m}function c(d){const f=d.target;f.removeEventListener("dispose",c);const m=t.get(f);m!==void 0&&(t.delete(f),m.dispose())}function h(d){const f=d.target;f.removeEventListener("dispose",h);const m=e.get(f);m!==void 0&&(e.delete(f),m.dispose())}function u(){t=new WeakMap,e=new WeakMap,n!==null&&(n.dispose(),n=null)}return{get:i,dispose:u}}function Hx(r){const t={};function e(n){if(t[n]!==void 0)return t[n];const i=r.getExtension(n);return t[n]=i,i}return{has:function(n){return e(n)!==null},init:function(){e("EXT_color_buffer_float"),e("WEBGL_clip_cull_distance"),e("OES_texture_float_linear"),e("EXT_color_buffer_half_float"),e("WEBGL_multisampled_render_to_texture"),e("WEBGL_render_shared_exponent")},get:function(n){const i=e(n);return i===null&&Ws("WebGLRenderer: "+n+" extension not supported."),i}}}function Vx(r,t,e,n){const i={},s=new WeakMap;function o(u){const d=u.target;d.index!==null&&t.remove(d.index);for(const m in d.attributes)t.remove(d.attributes[m]);d.removeEventListener("dispose",o),delete i[d.id];const f=s.get(d);f&&(t.remove(f),s.delete(d)),n.releaseStatesOfGeometry(d),d.isInstancedBufferGeometry===!0&&delete d._maxInstanceCount,e.memory.geometries--}function a(u,d){return i[d.id]===!0||(d.addEventListener("dispose",o),i[d.id]=!0,e.memory.geometries++),d}function l(u){const d=u.attributes;for(const f in d)t.update(d[f],r.ARRAY_BUFFER)}function c(u){const d=[],f=u.index,m=u.attributes.position;let _=0;if(m===void 0)return;if(f!==null){const b=f.array;_=f.version;for(let E=0,y=b.length;E<y;E+=3){const S=b[E+0],w=b[E+1],A=b[E+2];d.push(S,w,w,A,A,S)}}else{const b=m.array;_=m.version;for(let E=0,y=b.length/3-1;E<y;E+=3){const S=E+0,w=E+1,A=E+2;d.push(S,w,w,A,A,S)}}const g=new(m.count>=65535?vf:xf)(d,1);g.version=_;const p=s.get(u);p&&t.remove(p),s.set(u,g)}function h(u){const d=s.get(u);if(d){const f=u.index;f!==null&&d.version<f.version&&c(u)}else c(u);return s.get(u)}return{get:a,update:l,getWireframeAttribute:h}}function Gx(r,t,e){let n;function i(u){n=u}let s,o;function a(u){s=u.type,o=u.bytesPerElement}function l(u,d){r.drawElements(n,d,s,u*o),e.update(d,n,1)}function c(u,d,f){f!==0&&(r.drawElementsInstanced(n,d,s,u*o,f),e.update(d,n,f))}function h(u,d,f){if(f===0)return;t.get("WEBGL_multi_draw").multiDrawElementsWEBGL(n,d,0,s,u,0,f);let _=0;for(let g=0;g<f;g++)_+=d[g];e.update(_,n,1)}this.setMode=i,this.setIndex=a,this.render=l,this.renderInstances=c,this.renderMultiDraw=h}function Wx(r){const t={geometries:0,textures:0},e={frame:0,calls:0,triangles:0,points:0,lines:0};function n(s,o,a){switch(e.calls++,o){case r.TRIANGLES:e.triangles+=a*(s/3);break;case r.LINES:e.lines+=a*(s/2);break;case r.LINE_STRIP:e.lines+=a*(s-1);break;case r.LINE_LOOP:e.lines+=a*s;break;case r.POINTS:e.points+=a*s;break;default:Ot("WebGLInfo: Unknown draw mode:",o);break}}function i(){e.calls=0,e.triangles=0,e.points=0,e.lines=0}return{memory:t,render:e,programs:null,autoReset:!0,reset:i,update:n}}function Xx(r,t,e){const n=new WeakMap,i=new be;function s(o,a,l){const c=o.morphTargetInfluences,h=a.morphAttributes.position||a.morphAttributes.normal||a.morphAttributes.color,u=h!==void 0?h.length:0;let d=n.get(a);if(d===void 0||d.count!==u){let I=function(){v.dispose(),n.delete(a),a.removeEventListener("dispose",I)};var f=I;d!==void 0&&d.texture.dispose();const m=a.morphAttributes.position!==void 0,_=a.morphAttributes.normal!==void 0,g=a.morphAttributes.color!==void 0,p=a.morphAttributes.position||[],b=a.morphAttributes.normal||[],E=a.morphAttributes.color||[];let y=0;m===!0&&(y=1),_===!0&&(y=2),g===!0&&(y=3);let S=a.attributes.position.count*y,w=1;S>t.maxTextureSize&&(w=Math.ceil(S/t.maxTextureSize),S=t.maxTextureSize);const A=new Float32Array(S*w*4*u),v=new mf(A,S,w,u);v.type=Nn,v.needsUpdate=!0;const T=y*4;for(let L=0;L<u;L++){const U=p[L],W=b[L],K=E[L],k=S*w*4*L;for(let $=0;$<U.count;$++){const V=$*T;m===!0&&(i.fromBufferAttribute(U,$),A[k+V+0]=i.x,A[k+V+1]=i.y,A[k+V+2]=i.z,A[k+V+3]=0),_===!0&&(i.fromBufferAttribute(W,$),A[k+V+4]=i.x,A[k+V+5]=i.y,A[k+V+6]=i.z,A[k+V+7]=0),g===!0&&(i.fromBufferAttribute(K,$),A[k+V+8]=i.x,A[k+V+9]=i.y,A[k+V+10]=i.z,A[k+V+11]=K.itemSize===4?i.w:1)}}d={count:u,texture:v,size:new At(S,w)},n.set(a,d),a.addEventListener("dispose",I)}if(o.isInstancedMesh===!0&&o.morphTexture!==null)l.getUniforms().setValue(r,"morphTexture",o.morphTexture,e);else{let m=0;for(let g=0;g<c.length;g++)m+=c[g];const _=a.morphTargetsRelative?1:1-m;l.getUniforms().setValue(r,"morphTargetBaseInfluence",_),l.getUniforms().setValue(r,"morphTargetInfluences",c)}l.getUniforms().setValue(r,"morphTargetsTexture",d.texture,e),l.getUniforms().setValue(r,"morphTargetsTextureSize",d.size)}return{update:s}}function qx(r,t,e,n,i){let s=new WeakMap;function o(c){const h=i.render.frame,u=c.geometry,d=t.get(c,u);if(s.get(d)!==h&&(t.update(d),s.set(d,h)),c.isInstancedMesh&&(c.hasEventListener("dispose",l)===!1&&c.addEventListener("dispose",l),s.get(c)!==h&&(e.update(c.instanceMatrix,r.ARRAY_BUFFER),c.instanceColor!==null&&e.update(c.instanceColor,r.ARRAY_BUFFER),s.set(c,h))),c.isSkinnedMesh){const f=c.skeleton;s.get(f)!==h&&(f.update(),s.set(f,h))}return d}function a(){s=new WeakMap}function l(c){const h=c.target;h.removeEventListener("dispose",l),n.releaseStatesOfObject(h),e.remove(h.instanceMatrix),h.instanceColor!==null&&e.remove(h.instanceColor)}return{update:o,dispose:a}}const $x={[Zd]:"LINEAR_TONE_MAPPING",[jd]:"REINHARD_TONE_MAPPING",[Jd]:"CINEON_TONE_MAPPING",[Qd]:"ACES_FILMIC_TONE_MAPPING",[ef]:"AGX_TONE_MAPPING",[nf]:"NEUTRAL_TONE_MAPPING",[tf]:"CUSTOM_TONE_MAPPING"};function Yx(r,t,e,n,i,s){const o=new si(t,e,{type:r,depthBuffer:i,stencilBuffer:s,samples:n?4:0,depthTexture:i?new tr(t,e):void 0}),a=new si(t,e,{type:Si,depthBuffer:!1,stencilBuffer:!1}),l=new De;l.setAttribute("position",new he([-1,3,0,-1,-1,0,3,-1,0],3)),l.setAttribute("uv",new he([0,2,0,0,2,0],2));const c=new lg({uniforms:{tDiffuse:{value:null}},vertexShader:`
			precision highp float;

			uniform mat4 modelViewMatrix;
			uniform mat4 projectionMatrix;

			attribute vec3 position;
			attribute vec2 uv;

			varying vec2 vUv;

			void main() {
				vUv = uv;
				gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
			}`,fragmentShader:`
			precision highp float;

			uniform sampler2D tDiffuse;

			varying vec2 vUv;

			#include <tonemapping_pars_fragment>
			#include <colorspace_pars_fragment>

			void main() {
				gl_FragColor = texture2D( tDiffuse, vUv );

				#ifdef LINEAR_TONE_MAPPING
					gl_FragColor.rgb = LinearToneMapping( gl_FragColor.rgb );
				#elif defined( REINHARD_TONE_MAPPING )
					gl_FragColor.rgb = ReinhardToneMapping( gl_FragColor.rgb );
				#elif defined( CINEON_TONE_MAPPING )
					gl_FragColor.rgb = CineonToneMapping( gl_FragColor.rgb );
				#elif defined( ACES_FILMIC_TONE_MAPPING )
					gl_FragColor.rgb = ACESFilmicToneMapping( gl_FragColor.rgb );
				#elif defined( AGX_TONE_MAPPING )
					gl_FragColor.rgb = AgXToneMapping( gl_FragColor.rgb );
				#elif defined( NEUTRAL_TONE_MAPPING )
					gl_FragColor.rgb = NeutralToneMapping( gl_FragColor.rgb );
				#elif defined( CUSTOM_TONE_MAPPING )
					gl_FragColor.rgb = CustomToneMapping( gl_FragColor.rgb );
				#endif

				#ifdef SRGB_TRANSFER
					gl_FragColor = sRGBTransferOETF( gl_FragColor );
				#endif
			}`,depthTest:!1,depthWrite:!1}),h=new te(l,c),u=new ga(-1,1,1,-1,0,1);let d=null,f=null,m=!1,_,g=null,p=[],b=!1;this.setSize=function(E,y){o.setSize(E,y),a.setSize(E,y);for(let S=0;S<p.length;S++){const w=p[S];w.setSize&&w.setSize(E,y)}},this.setEffects=function(E){p=E,b=p.length>0&&p[0].isRenderPass===!0;const y=o.width,S=o.height;for(let w=0;w<p.length;w++){const A=p[w];A.setSize&&A.setSize(y,S)}},this.begin=function(E,y){if(m||E.toneMapping===zn&&p.length===0)return!1;if(g=y,y!==null){const S=y.width,w=y.height;(o.width!==S||o.height!==w)&&this.setSize(S,w)}return b===!1&&E.setRenderTarget(o),_=E.toneMapping,E.toneMapping=zn,!0},this.hasRenderPass=function(){return b},this.end=function(E,y){E.toneMapping=_,m=!0;let S=o,w=a;for(let A=0;A<p.length;A++){const v=p[A];if(v.enabled!==!1&&(v.render(E,w,S,y),v.needsSwap!==!1)){const T=S;S=w,w=T}}if(d!==E.outputColorSpace||f!==E.toneMapping){d=E.outputColorSpace,f=E.toneMapping,c.defines={},Qt.getTransfer(d)===me&&(c.defines.SRGB_TRANSFER="");const A=$x[f];A&&(c.defines[A]=""),c.needsUpdate=!0}c.uniforms.tDiffuse.value=S.texture,E.setRenderTarget(g),E.render(h,u),g=null,m=!1},this.isCompositing=function(){return m},this.dispose=function(){o.depthTexture&&o.depthTexture.dispose(),o.dispose(),a.dispose(),l.dispose(),c.dispose()}}const Bf=new Xe,gc=new tr(1,1),zf=new mf,Hf=new Um,Vf=new Af,Uu=[],Fu=[],Ou=new Float32Array(16),ku=new Float32Array(9),Bu=new Float32Array(4);function hr(r,t,e){const n=r[0];if(n<=0||n>0)return r;const i=t*e;let s=Uu[i];if(s===void 0&&(s=new Float32Array(i),Uu[i]=s),t!==0){n.toArray(s,0);for(let o=1,a=0;o!==t;++o)a+=e,r[o].toArray(s,a)}return s}function Ye(r,t){if(r.length!==t.length)return!1;for(let e=0,n=r.length;e<n;e++)if(r[e]!==t[e])return!1;return!0}function Ke(r,t){for(let e=0,n=t.length;e<n;e++)r[e]=t[e]}function xa(r,t){let e=Fu[t];e===void 0&&(e=new Int32Array(t),Fu[t]=e);for(let n=0;n!==t;++n)e[n]=r.allocateTextureUnit();return e}function Kx(r,t){const e=this.cache;e[0]!==t&&(r.uniform1f(this.addr,t),e[0]=t)}function Zx(r,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y)&&(r.uniform2f(this.addr,t.x,t.y),e[0]=t.x,e[1]=t.y);else{if(Ye(e,t))return;r.uniform2fv(this.addr,t),Ke(e,t)}}function jx(r,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z)&&(r.uniform3f(this.addr,t.x,t.y,t.z),e[0]=t.x,e[1]=t.y,e[2]=t.z);else if(t.r!==void 0)(e[0]!==t.r||e[1]!==t.g||e[2]!==t.b)&&(r.uniform3f(this.addr,t.r,t.g,t.b),e[0]=t.r,e[1]=t.g,e[2]=t.b);else{if(Ye(e,t))return;r.uniform3fv(this.addr,t),Ke(e,t)}}function Jx(r,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z||e[3]!==t.w)&&(r.uniform4f(this.addr,t.x,t.y,t.z,t.w),e[0]=t.x,e[1]=t.y,e[2]=t.z,e[3]=t.w);else{if(Ye(e,t))return;r.uniform4fv(this.addr,t),Ke(e,t)}}function Qx(r,t){const e=this.cache,n=t.elements;if(n===void 0){if(Ye(e,t))return;r.uniformMatrix2fv(this.addr,!1,t),Ke(e,t)}else{if(Ye(e,n))return;Bu.set(n),r.uniformMatrix2fv(this.addr,!1,Bu),Ke(e,n)}}function tv(r,t){const e=this.cache,n=t.elements;if(n===void 0){if(Ye(e,t))return;r.uniformMatrix3fv(this.addr,!1,t),Ke(e,t)}else{if(Ye(e,n))return;ku.set(n),r.uniformMatrix3fv(this.addr,!1,ku),Ke(e,n)}}function ev(r,t){const e=this.cache,n=t.elements;if(n===void 0){if(Ye(e,t))return;r.uniformMatrix4fv(this.addr,!1,t),Ke(e,t)}else{if(Ye(e,n))return;Ou.set(n),r.uniformMatrix4fv(this.addr,!1,Ou),Ke(e,n)}}function nv(r,t){const e=this.cache;e[0]!==t&&(r.uniform1i(this.addr,t),e[0]=t)}function iv(r,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y)&&(r.uniform2i(this.addr,t.x,t.y),e[0]=t.x,e[1]=t.y);else{if(Ye(e,t))return;r.uniform2iv(this.addr,t),Ke(e,t)}}function sv(r,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z)&&(r.uniform3i(this.addr,t.x,t.y,t.z),e[0]=t.x,e[1]=t.y,e[2]=t.z);else{if(Ye(e,t))return;r.uniform3iv(this.addr,t),Ke(e,t)}}function rv(r,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z||e[3]!==t.w)&&(r.uniform4i(this.addr,t.x,t.y,t.z,t.w),e[0]=t.x,e[1]=t.y,e[2]=t.z,e[3]=t.w);else{if(Ye(e,t))return;r.uniform4iv(this.addr,t),Ke(e,t)}}function ov(r,t){const e=this.cache;e[0]!==t&&(r.uniform1ui(this.addr,t),e[0]=t)}function av(r,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y)&&(r.uniform2ui(this.addr,t.x,t.y),e[0]=t.x,e[1]=t.y);else{if(Ye(e,t))return;r.uniform2uiv(this.addr,t),Ke(e,t)}}function lv(r,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z)&&(r.uniform3ui(this.addr,t.x,t.y,t.z),e[0]=t.x,e[1]=t.y,e[2]=t.z);else{if(Ye(e,t))return;r.uniform3uiv(this.addr,t),Ke(e,t)}}function cv(r,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z||e[3]!==t.w)&&(r.uniform4ui(this.addr,t.x,t.y,t.z,t.w),e[0]=t.x,e[1]=t.y,e[2]=t.z,e[3]=t.w);else{if(Ye(e,t))return;r.uniform4uiv(this.addr,t),Ke(e,t)}}function hv(r,t,e){const n=this.cache,i=e.allocateTextureUnit();n[0]!==i&&(r.uniform1i(this.addr,i),n[0]=i);let s;this.type===r.SAMPLER_2D_SHADOW?(gc.compareFunction=e.isReversedDepthBuffer()?zc:Bc,s=gc):s=Bf,e.setTexture2D(t||s,i)}function uv(r,t,e){const n=this.cache,i=e.allocateTextureUnit();n[0]!==i&&(r.uniform1i(this.addr,i),n[0]=i),e.setTexture3D(t||Hf,i)}function dv(r,t,e){const n=this.cache,i=e.allocateTextureUnit();n[0]!==i&&(r.uniform1i(this.addr,i),n[0]=i),e.setTextureCube(t||Vf,i)}function fv(r,t,e){const n=this.cache,i=e.allocateTextureUnit();n[0]!==i&&(r.uniform1i(this.addr,i),n[0]=i),e.setTexture2DArray(t||zf,i)}function pv(r){switch(r){case 5126:return Kx;case 35664:return Zx;case 35665:return jx;case 35666:return Jx;case 35674:return Qx;case 35675:return tv;case 35676:return ev;case 5124:case 35670:return nv;case 35667:case 35671:return iv;case 35668:case 35672:return sv;case 35669:case 35673:return rv;case 5125:return ov;case 36294:return av;case 36295:return lv;case 36296:return cv;case 35678:case 36198:case 36298:case 36306:case 35682:return hv;case 35679:case 36299:case 36307:return uv;case 35680:case 36300:case 36308:case 36293:return dv;case 36289:case 36303:case 36311:case 36292:return fv}}function mv(r,t){r.uniform1fv(this.addr,t)}function gv(r,t){const e=hr(t,this.size,2);r.uniform2fv(this.addr,e)}function _v(r,t){const e=hr(t,this.size,3);r.uniform3fv(this.addr,e)}function xv(r,t){const e=hr(t,this.size,4);r.uniform4fv(this.addr,e)}function vv(r,t){const e=hr(t,this.size,4);r.uniformMatrix2fv(this.addr,!1,e)}function yv(r,t){const e=hr(t,this.size,9);r.uniformMatrix3fv(this.addr,!1,e)}function Mv(r,t){const e=hr(t,this.size,16);r.uniformMatrix4fv(this.addr,!1,e)}function bv(r,t){r.uniform1iv(this.addr,t)}function Sv(r,t){r.uniform2iv(this.addr,t)}function wv(r,t){r.uniform3iv(this.addr,t)}function Ev(r,t){r.uniform4iv(this.addr,t)}function Tv(r,t){r.uniform1uiv(this.addr,t)}function Av(r,t){r.uniform2uiv(this.addr,t)}function Cv(r,t){r.uniform3uiv(this.addr,t)}function Rv(r,t){r.uniform4uiv(this.addr,t)}function Pv(r,t,e){const n=this.cache,i=t.length,s=xa(e,i);Ye(n,s)||(r.uniform1iv(this.addr,s),Ke(n,s));let o;this.type===r.SAMPLER_2D_SHADOW?o=gc:o=Bf;for(let a=0;a!==i;++a)e.setTexture2D(t[a]||o,s[a])}function Iv(r,t,e){const n=this.cache,i=t.length,s=xa(e,i);Ye(n,s)||(r.uniform1iv(this.addr,s),Ke(n,s));for(let o=0;o!==i;++o)e.setTexture3D(t[o]||Hf,s[o])}function Lv(r,t,e){const n=this.cache,i=t.length,s=xa(e,i);Ye(n,s)||(r.uniform1iv(this.addr,s),Ke(n,s));for(let o=0;o!==i;++o)e.setTextureCube(t[o]||Vf,s[o])}function Dv(r,t,e){const n=this.cache,i=t.length,s=xa(e,i);Ye(n,s)||(r.uniform1iv(this.addr,s),Ke(n,s));for(let o=0;o!==i;++o)e.setTexture2DArray(t[o]||zf,s[o])}function Nv(r){switch(r){case 5126:return mv;case 35664:return gv;case 35665:return _v;case 35666:return xv;case 35674:return vv;case 35675:return yv;case 35676:return Mv;case 5124:case 35670:return bv;case 35667:case 35671:return Sv;case 35668:case 35672:return wv;case 35669:case 35673:return Ev;case 5125:return Tv;case 36294:return Av;case 36295:return Cv;case 36296:return Rv;case 35678:case 36198:case 36298:case 36306:case 35682:return Pv;case 35679:case 36299:case 36307:return Iv;case 35680:case 36300:case 36308:case 36293:return Lv;case 36289:case 36303:case 36311:case 36292:return Dv}}class Uv{constructor(t,e,n){this.id=t,this.addr=n,this.cache=[],this.type=e.type,this.setValue=pv(e.type)}}class Fv{constructor(t,e,n){this.id=t,this.addr=n,this.cache=[],this.type=e.type,this.size=e.size,this.setValue=Nv(e.type)}}class Ov{constructor(t){this.id=t,this.seq=[],this.map={}}setValue(t,e,n){const i=this.seq;for(let s=0,o=i.length;s!==o;++s){const a=i[s];a.setValue(t,e[a.id],n)}}}const rl=/(\w+)(\])?(\[|\.)?/g;function zu(r,t){r.seq.push(t),r.map[t.id]=t}function kv(r,t,e){const n=r.name,i=n.length;for(rl.lastIndex=0;;){const s=rl.exec(n),o=rl.lastIndex;let a=s[1];const l=s[2]==="]",c=s[3];if(l&&(a=a|0),c===void 0||c==="["&&o+2===i){zu(e,c===void 0?new Uv(a,r,t):new Fv(a,r,t));break}else{let u=e.map[a];u===void 0&&(u=new Ov(a),zu(e,u)),e=u}}}class qo{constructor(t,e){this.seq=[],this.map={};const n=t.getProgramParameter(e,t.ACTIVE_UNIFORMS);for(let o=0;o<n;++o){const a=t.getActiveUniform(e,o),l=t.getUniformLocation(e,a.name);kv(a,l,this)}const i=[],s=[];for(const o of this.seq)o.type===t.SAMPLER_2D_SHADOW||o.type===t.SAMPLER_CUBE_SHADOW||o.type===t.SAMPLER_2D_ARRAY_SHADOW?i.push(o):s.push(o);i.length>0&&(this.seq=i.concat(s))}setValue(t,e,n,i){const s=this.map[e];s!==void 0&&s.setValue(t,n,i)}setOptional(t,e,n){const i=e[n];i!==void 0&&this.setValue(t,n,i)}static upload(t,e,n,i){for(let s=0,o=e.length;s!==o;++s){const a=e[s],l=n[a.id];l.needsUpdate!==!1&&a.setValue(t,l.value,i)}}static seqWithValue(t,e){const n=[];for(let i=0,s=t.length;i!==s;++i){const o=t[i];o.id in e&&n.push(o)}return n}}function Hu(r,t,e){const n=r.createShader(t);return r.shaderSource(n,e),r.compileShader(n),n}const Bv=37297;let zv=0;function Hv(r,t){const e=r.split(`
`),n=[],i=Math.max(t-6,0),s=Math.min(t+6,e.length);for(let o=i;o<s;o++){const a=o+1;n.push(`${a===t?">":" "} ${a}: ${e[o]}`)}return n.join(`
`)}const Vu=new Vt;function Vv(r){Qt._getMatrix(Vu,Qt.workingColorSpace,r);const t=`mat3( ${Vu.elements.map(e=>e.toFixed(4))} )`;switch(Qt.getTransfer(r)){case Jo:return[t,"LinearTransferOETF"];case me:return[t,"sRGBTransferOETF"];default:return wt("WebGLProgram: Unsupported color space: ",r),[t,"LinearTransferOETF"]}}function Gu(r,t,e){const n=r.getShaderParameter(t,r.COMPILE_STATUS),s=(r.getShaderInfoLog(t)||"").trim();if(n&&s==="")return"";const o=/ERROR: 0:(\d+)/.exec(s);if(o){const a=parseInt(o[1]);return e.toUpperCase()+`

`+s+`

`+Hv(r.getShaderSource(t),a)}else return s}function Gv(r,t){const e=Vv(t);return[`vec4 ${r}( vec4 value ) {`,`	return ${e[1]}( vec4( value.rgb * ${e[0]}, value.a ) );`,"}"].join(`
`)}const Wv={[Zd]:"Linear",[jd]:"Reinhard",[Jd]:"Cineon",[Qd]:"ACESFilmic",[ef]:"AgX",[nf]:"Neutral",[tf]:"Custom"};function Xv(r,t){const e=Wv[t];return e===void 0?(wt("WebGLProgram: Unsupported toneMapping:",t),"vec3 "+r+"( vec3 color ) { return LinearToneMapping( color ); }"):"vec3 "+r+"( vec3 color ) { return "+e+"ToneMapping( color ); }"}const Fo=new P;function qv(){Qt.getLuminanceCoefficients(Fo);const r=Fo.x.toFixed(4),t=Fo.y.toFixed(4),e=Fo.z.toFixed(4);return["float luminance( const in vec3 rgb ) {",`	const vec3 weights = vec3( ${r}, ${t}, ${e} );`,"	return dot( weights, rgb );","}"].join(`
`)}function $v(r){return[r.extensionClipCullDistance?"#extension GL_ANGLE_clip_cull_distance : require":"",r.extensionMultiDraw?"#extension GL_ANGLE_multi_draw : require":""].filter(Ir).join(`
`)}function Yv(r){const t=[];for(const e in r){const n=r[e];n!==!1&&t.push("#define "+e+" "+n)}return t.join(`
`)}function Kv(r,t){const e={},n=r.getProgramParameter(t,r.ACTIVE_ATTRIBUTES);for(let i=0;i<n;i++){const s=r.getActiveAttrib(t,i),o=s.name;let a=1;s.type===r.FLOAT_MAT2&&(a=2),s.type===r.FLOAT_MAT3&&(a=3),s.type===r.FLOAT_MAT4&&(a=4),e[o]={type:s.type,location:r.getAttribLocation(t,o),locationSize:a}}return e}function Ir(r){return r!==""}function Wu(r,t){const e=t.numSpotLightShadows+t.numSpotLightMaps-t.numSpotLightShadowsWithMaps;return r.replace(/NUM_DIR_LIGHTS/g,t.numDirLights).replace(/NUM_SPOT_LIGHTS/g,t.numSpotLights).replace(/NUM_SPOT_LIGHT_MAPS/g,t.numSpotLightMaps).replace(/NUM_SPOT_LIGHT_COORDS/g,e).replace(/NUM_RECT_AREA_LIGHTS/g,t.numRectAreaLights).replace(/NUM_POINT_LIGHTS/g,t.numPointLights).replace(/NUM_HEMI_LIGHTS/g,t.numHemiLights).replace(/NUM_DIR_LIGHT_SHADOWS/g,t.numDirLightShadows).replace(/NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS/g,t.numSpotLightShadowsWithMaps).replace(/NUM_SPOT_LIGHT_SHADOWS/g,t.numSpotLightShadows).replace(/NUM_POINT_LIGHT_SHADOWS/g,t.numPointLightShadows)}function Xu(r,t){return r.replace(/NUM_CLIPPING_PLANES/g,t.numClippingPlanes).replace(/UNION_CLIPPING_PLANES/g,t.numClippingPlanes-t.numClipIntersection)}const Zv=/^[ \t]*#include +<([\w\d./]+)>/gm;function _c(r){return r.replace(Zv,Jv)}const jv=new Map;function Jv(r,t){let e=$t[t];if(e===void 0){const n=jv.get(t);if(n!==void 0)e=$t[n],wt('WebGLRenderer: Shader chunk "%s" has been deprecated. Use "%s" instead.',t,n);else throw new Error("THREE.WebGLProgram: Can not resolve #include <"+t+">")}return _c(e)}const Qv=/#pragma unroll_loop_start\s+for\s*\(\s*int\s+i\s*=\s*(\d+)\s*;\s*i\s*<\s*(\d+)\s*;\s*i\s*\+\+\s*\)\s*{([\s\S]+?)}\s+#pragma unroll_loop_end/g;function qu(r){return r.replace(Qv,ty)}function ty(r,t,e,n){let i="";for(let s=parseInt(t);s<parseInt(e);s++)i+=n.replace(/\[\s*i\s*\]/g,"[ "+s+" ]").replace(/UNROLLED_LOOP_INDEX/g,s);return i}function $u(r){let t=`precision ${r.precision} float;
	precision ${r.precision} int;
	precision ${r.precision} sampler2D;
	precision ${r.precision} samplerCube;
	precision ${r.precision} sampler3D;
	precision ${r.precision} sampler2DArray;
	precision ${r.precision} sampler2DShadow;
	precision ${r.precision} samplerCubeShadow;
	precision ${r.precision} sampler2DArrayShadow;
	precision ${r.precision} isampler2D;
	precision ${r.precision} isampler3D;
	precision ${r.precision} isamplerCube;
	precision ${r.precision} isampler2DArray;
	precision ${r.precision} usampler2D;
	precision ${r.precision} usampler3D;
	precision ${r.precision} usamplerCube;
	precision ${r.precision} usampler2DArray;
	`;return r.precision==="highp"?t+=`
#define HIGH_PRECISION`:r.precision==="mediump"?t+=`
#define MEDIUM_PRECISION`:r.precision==="lowp"&&(t+=`
#define LOW_PRECISION`),t}const ey={[zo]:"SHADOWMAP_TYPE_PCF",[Rr]:"SHADOWMAP_TYPE_VSM"};function ny(r){return ey[r.shadowMapType]||"SHADOWMAP_TYPE_BASIC"}const iy={[ss]:"ENVMAP_TYPE_CUBE",[Js]:"ENVMAP_TYPE_CUBE",[fa]:"ENVMAP_TYPE_CUBE_UV"};function sy(r){return r.envMap===!1?"ENVMAP_TYPE_CUBE":iy[r.envMapMode]||"ENVMAP_TYPE_CUBE"}const ry={[Js]:"ENVMAP_MODE_REFRACTION"};function oy(r){return r.envMap===!1?"ENVMAP_MODE_REFLECTION":ry[r.envMapMode]||"ENVMAP_MODE_REFLECTION"}const ay={[Kd]:"ENVMAP_BLENDING_MULTIPLY",[Yp]:"ENVMAP_BLENDING_MIX",[Kp]:"ENVMAP_BLENDING_ADD"};function ly(r){return r.envMap===!1?"ENVMAP_BLENDING_NONE":ay[r.combine]||"ENVMAP_BLENDING_NONE"}function cy(r){const t=r.envMapCubeUVHeight;if(t===null)return null;const e=Math.log2(t)-2,n=1/t;return{texelWidth:1/(3*Math.max(Math.pow(2,e),7*16)),texelHeight:n,maxMip:e}}function hy(r,t,e,n){const i=r.getContext(),s=e.defines;let o=e.vertexShader,a=e.fragmentShader;const l=ny(e),c=sy(e),h=oy(e),u=ly(e),d=cy(e),f=$v(e),m=Yv(s),_=i.createProgram();let g,p,b=e.glslVersion?"#version "+e.glslVersion+`
`:"";e.isRawShaderMaterial?(g=["#define SHADER_TYPE "+e.shaderType,"#define SHADER_NAME "+e.shaderName,m].filter(Ir).join(`
`),g.length>0&&(g+=`
`),p=["#define SHADER_TYPE "+e.shaderType,"#define SHADER_NAME "+e.shaderName,m].filter(Ir).join(`
`),p.length>0&&(p+=`
`)):(g=[$u(e),"#define SHADER_TYPE "+e.shaderType,"#define SHADER_NAME "+e.shaderName,m,e.extensionClipCullDistance?"#define USE_CLIP_DISTANCE":"",e.batching?"#define USE_BATCHING":"",e.batchingColor?"#define USE_BATCHING_COLOR":"",e.instancing?"#define USE_INSTANCING":"",e.instancingColor?"#define USE_INSTANCING_COLOR":"",e.instancingMorph?"#define USE_INSTANCING_MORPH":"",e.useFog&&e.fog?"#define USE_FOG":"",e.useFog&&e.fogExp2?"#define FOG_EXP2":"",e.map?"#define USE_MAP":"",e.envMap?"#define USE_ENVMAP":"",e.envMap?"#define "+h:"",e.lightMap?"#define USE_LIGHTMAP":"",e.aoMap?"#define USE_AOMAP":"",e.bumpMap?"#define USE_BUMPMAP":"",e.normalMap?"#define USE_NORMALMAP":"",e.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",e.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",e.displacementMap?"#define USE_DISPLACEMENTMAP":"",e.emissiveMap?"#define USE_EMISSIVEMAP":"",e.anisotropy?"#define USE_ANISOTROPY":"",e.anisotropyMap?"#define USE_ANISOTROPYMAP":"",e.clearcoatMap?"#define USE_CLEARCOATMAP":"",e.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",e.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",e.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",e.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",e.specularMap?"#define USE_SPECULARMAP":"",e.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",e.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",e.roughnessMap?"#define USE_ROUGHNESSMAP":"",e.metalnessMap?"#define USE_METALNESSMAP":"",e.alphaMap?"#define USE_ALPHAMAP":"",e.alphaHash?"#define USE_ALPHAHASH":"",e.transmission?"#define USE_TRANSMISSION":"",e.transmissionMap?"#define USE_TRANSMISSIONMAP":"",e.thicknessMap?"#define USE_THICKNESSMAP":"",e.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",e.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",e.mapUv?"#define MAP_UV "+e.mapUv:"",e.alphaMapUv?"#define ALPHAMAP_UV "+e.alphaMapUv:"",e.lightMapUv?"#define LIGHTMAP_UV "+e.lightMapUv:"",e.aoMapUv?"#define AOMAP_UV "+e.aoMapUv:"",e.emissiveMapUv?"#define EMISSIVEMAP_UV "+e.emissiveMapUv:"",e.bumpMapUv?"#define BUMPMAP_UV "+e.bumpMapUv:"",e.normalMapUv?"#define NORMALMAP_UV "+e.normalMapUv:"",e.displacementMapUv?"#define DISPLACEMENTMAP_UV "+e.displacementMapUv:"",e.metalnessMapUv?"#define METALNESSMAP_UV "+e.metalnessMapUv:"",e.roughnessMapUv?"#define ROUGHNESSMAP_UV "+e.roughnessMapUv:"",e.anisotropyMapUv?"#define ANISOTROPYMAP_UV "+e.anisotropyMapUv:"",e.clearcoatMapUv?"#define CLEARCOATMAP_UV "+e.clearcoatMapUv:"",e.clearcoatNormalMapUv?"#define CLEARCOAT_NORMALMAP_UV "+e.clearcoatNormalMapUv:"",e.clearcoatRoughnessMapUv?"#define CLEARCOAT_ROUGHNESSMAP_UV "+e.clearcoatRoughnessMapUv:"",e.iridescenceMapUv?"#define IRIDESCENCEMAP_UV "+e.iridescenceMapUv:"",e.iridescenceThicknessMapUv?"#define IRIDESCENCE_THICKNESSMAP_UV "+e.iridescenceThicknessMapUv:"",e.sheenColorMapUv?"#define SHEEN_COLORMAP_UV "+e.sheenColorMapUv:"",e.sheenRoughnessMapUv?"#define SHEEN_ROUGHNESSMAP_UV "+e.sheenRoughnessMapUv:"",e.specularMapUv?"#define SPECULARMAP_UV "+e.specularMapUv:"",e.specularColorMapUv?"#define SPECULAR_COLORMAP_UV "+e.specularColorMapUv:"",e.specularIntensityMapUv?"#define SPECULAR_INTENSITYMAP_UV "+e.specularIntensityMapUv:"",e.transmissionMapUv?"#define TRANSMISSIONMAP_UV "+e.transmissionMapUv:"",e.thicknessMapUv?"#define THICKNESSMAP_UV "+e.thicknessMapUv:"",e.vertexTangents&&e.flatShading===!1?"#define USE_TANGENT":"",e.vertexNormals?"#define HAS_NORMAL":"",e.vertexColors?"#define USE_COLOR":"",e.vertexAlphas?"#define USE_COLOR_ALPHA":"",e.vertexUv1s?"#define USE_UV1":"",e.vertexUv2s?"#define USE_UV2":"",e.vertexUv3s?"#define USE_UV3":"",e.pointsUvs?"#define USE_POINTS_UV":"",e.flatShading?"#define FLAT_SHADED":"",e.skinning?"#define USE_SKINNING":"",e.morphTargets?"#define USE_MORPHTARGETS":"",e.morphNormals&&e.flatShading===!1?"#define USE_MORPHNORMALS":"",e.morphColors?"#define USE_MORPHCOLORS":"",e.morphTargetsCount>0?"#define MORPHTARGETS_TEXTURE_STRIDE "+e.morphTextureStride:"",e.morphTargetsCount>0?"#define MORPHTARGETS_COUNT "+e.morphTargetsCount:"",e.doubleSided?"#define DOUBLE_SIDED":"",e.flipSided?"#define FLIP_SIDED":"",e.shadowMapEnabled?"#define USE_SHADOWMAP":"",e.shadowMapEnabled?"#define "+l:"",e.sizeAttenuation?"#define USE_SIZEATTENUATION":"",e.numLightProbes>0?"#define USE_LIGHT_PROBES":"",e.logarithmicDepthBuffer?"#define USE_LOGARITHMIC_DEPTH_BUFFER":"",e.reversedDepthBuffer?"#define USE_REVERSED_DEPTH_BUFFER":"","uniform mat4 modelMatrix;","uniform mat4 modelViewMatrix;","uniform mat4 projectionMatrix;","uniform mat4 viewMatrix;","uniform mat3 normalMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;","#ifdef USE_INSTANCING","	attribute mat4 instanceMatrix;","#endif","#ifdef USE_INSTANCING_COLOR","	attribute vec3 instanceColor;","#endif","#ifdef USE_INSTANCING_MORPH","	uniform sampler2D morphTexture;","#endif","attribute vec3 position;","attribute vec3 normal;","attribute vec2 uv;","#ifdef USE_UV1","	attribute vec2 uv1;","#endif","#ifdef USE_UV2","	attribute vec2 uv2;","#endif","#ifdef USE_UV3","	attribute vec2 uv3;","#endif","#ifdef USE_TANGENT","	attribute vec4 tangent;","#endif","#if defined( USE_COLOR_ALPHA )","	attribute vec4 color;","#elif defined( USE_COLOR )","	attribute vec3 color;","#endif","#ifdef USE_SKINNING","	attribute vec4 skinIndex;","	attribute vec4 skinWeight;","#endif",`
`].filter(Ir).join(`
`),p=[$u(e),"#define SHADER_TYPE "+e.shaderType,"#define SHADER_NAME "+e.shaderName,m,e.useFog&&e.fog?"#define USE_FOG":"",e.useFog&&e.fogExp2?"#define FOG_EXP2":"",e.alphaToCoverage?"#define ALPHA_TO_COVERAGE":"",e.map?"#define USE_MAP":"",e.matcap?"#define USE_MATCAP":"",e.envMap?"#define USE_ENVMAP":"",e.envMap?"#define "+c:"",e.envMap?"#define "+h:"",e.envMap?"#define "+u:"",d?"#define CUBEUV_TEXEL_WIDTH "+d.texelWidth:"",d?"#define CUBEUV_TEXEL_HEIGHT "+d.texelHeight:"",d?"#define CUBEUV_MAX_MIP "+d.maxMip+".0":"",e.lightMap?"#define USE_LIGHTMAP":"",e.aoMap?"#define USE_AOMAP":"",e.bumpMap?"#define USE_BUMPMAP":"",e.normalMap?"#define USE_NORMALMAP":"",e.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",e.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",e.packedNormalMap?"#define USE_PACKED_NORMALMAP":"",e.emissiveMap?"#define USE_EMISSIVEMAP":"",e.anisotropy?"#define USE_ANISOTROPY":"",e.anisotropyMap?"#define USE_ANISOTROPYMAP":"",e.clearcoat?"#define USE_CLEARCOAT":"",e.clearcoatMap?"#define USE_CLEARCOATMAP":"",e.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",e.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",e.dispersion?"#define USE_DISPERSION":"",e.iridescence?"#define USE_IRIDESCENCE":"",e.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",e.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",e.specularMap?"#define USE_SPECULARMAP":"",e.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",e.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",e.roughnessMap?"#define USE_ROUGHNESSMAP":"",e.metalnessMap?"#define USE_METALNESSMAP":"",e.alphaMap?"#define USE_ALPHAMAP":"",e.alphaTest?"#define USE_ALPHATEST":"",e.alphaHash?"#define USE_ALPHAHASH":"",e.sheen?"#define USE_SHEEN":"",e.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",e.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",e.transmission?"#define USE_TRANSMISSION":"",e.transmissionMap?"#define USE_TRANSMISSIONMAP":"",e.thicknessMap?"#define USE_THICKNESSMAP":"",e.vertexTangents&&e.flatShading===!1?"#define USE_TANGENT":"",e.vertexColors||e.instancingColor?"#define USE_COLOR":"",e.vertexAlphas||e.batchingColor?"#define USE_COLOR_ALPHA":"",e.vertexUv1s?"#define USE_UV1":"",e.vertexUv2s?"#define USE_UV2":"",e.vertexUv3s?"#define USE_UV3":"",e.pointsUvs?"#define USE_POINTS_UV":"",e.gradientMap?"#define USE_GRADIENTMAP":"",e.flatShading?"#define FLAT_SHADED":"",e.doubleSided?"#define DOUBLE_SIDED":"",e.flipSided?"#define FLIP_SIDED":"",e.shadowMapEnabled?"#define USE_SHADOWMAP":"",e.shadowMapEnabled?"#define "+l:"",e.premultipliedAlpha?"#define PREMULTIPLIED_ALPHA":"",e.numLightProbes>0?"#define USE_LIGHT_PROBES":"",e.numLightProbeGrids>0?"#define USE_LIGHT_PROBES_GRID":"",e.decodeVideoTexture?"#define DECODE_VIDEO_TEXTURE":"",e.decodeVideoTextureEmissive?"#define DECODE_VIDEO_TEXTURE_EMISSIVE":"",e.logarithmicDepthBuffer?"#define USE_LOGARITHMIC_DEPTH_BUFFER":"",e.reversedDepthBuffer?"#define USE_REVERSED_DEPTH_BUFFER":"","uniform mat4 viewMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;",e.toneMapping!==zn?"#define TONE_MAPPING":"",e.toneMapping!==zn?$t.tonemapping_pars_fragment:"",e.toneMapping!==zn?Xv("toneMapping",e.toneMapping):"",e.dithering?"#define DITHERING":"",e.opaque?"#define OPAQUE":"",$t.colorspace_pars_fragment,Gv("linearToOutputTexel",e.outputColorSpace),qv(),e.useDepthPacking?"#define DEPTH_PACKING "+e.depthPacking:"",`
`].filter(Ir).join(`
`)),o=_c(o),o=Wu(o,e),o=Xu(o,e),a=_c(a),a=Wu(a,e),a=Xu(a,e),o=qu(o),a=qu(a),e.isRawShaderMaterial!==!0&&(b=`#version 300 es
`,g=[f,"#define attribute in","#define varying out","#define texture2D texture"].join(`
`)+`
`+g,p=["#define varying in",e.glslVersion===kh?"":"layout(location = 0) out highp vec4 pc_fragColor;",e.glslVersion===kh?"":"#define gl_FragColor pc_fragColor","#define gl_FragDepthEXT gl_FragDepth","#define texture2D texture","#define textureCube texture","#define texture2DProj textureProj","#define texture2DLodEXT textureLod","#define texture2DProjLodEXT textureProjLod","#define textureCubeLodEXT textureLod","#define texture2DGradEXT textureGrad","#define texture2DProjGradEXT textureProjGrad","#define textureCubeGradEXT textureGrad"].join(`
`)+`
`+p);const E=b+g+o,y=b+p+a,S=Hu(i,i.VERTEX_SHADER,E),w=Hu(i,i.FRAGMENT_SHADER,y);i.attachShader(_,S),i.attachShader(_,w),e.index0AttributeName!==void 0?i.bindAttribLocation(_,0,e.index0AttributeName):e.hasPositionAttribute===!0&&i.bindAttribLocation(_,0,"position"),i.linkProgram(_);function A(L){if(r.debug.checkShaderErrors){const U=i.getProgramInfoLog(_)||"",W=i.getShaderInfoLog(S)||"",K=i.getShaderInfoLog(w)||"",k=U.trim(),$=W.trim(),V=K.trim();let Q=!0,it=!0;if(i.getProgramParameter(_,i.LINK_STATUS)===!1)if(Q=!1,typeof r.debug.onShaderError=="function")r.debug.onShaderError(i,_,S,w);else{const ft=Gu(i,S,"vertex"),at=Gu(i,w,"fragment");Ot("WebGLProgram: Shader Error "+i.getError()+" - VALIDATE_STATUS "+i.getProgramParameter(_,i.VALIDATE_STATUS)+`

Material Name: `+L.name+`
Material Type: `+L.type+`

Program Info Log: `+k+`
`+ft+`
`+at)}else k!==""?wt("WebGLProgram: Program Info Log:",k):($===""||V==="")&&(it=!1);it&&(L.diagnostics={runnable:Q,programLog:k,vertexShader:{log:$,prefix:g},fragmentShader:{log:V,prefix:p}})}i.deleteShader(S),i.deleteShader(w),v=new qo(i,_),T=Kv(i,_)}let v;this.getUniforms=function(){return v===void 0&&A(this),v};let T;this.getAttributes=function(){return T===void 0&&A(this),T};let I=e.rendererExtensionParallelShaderCompile===!1;return this.isReady=function(){return I===!1&&(I=i.getProgramParameter(_,Bv)),I},this.destroy=function(){n.releaseStatesOfProgram(this),i.deleteProgram(_),this.program=void 0},this.type=e.shaderType,this.name=e.shaderName,this.id=zv++,this.cacheKey=t,this.usedTimes=1,this.program=_,this.vertexShader=S,this.fragmentShader=w,this}let uy=0;class dy{constructor(){this.shaderCache=new Map,this.materialCache=new Map}update(t,e,n){const i=this._getShaderCacheForMaterial(t);return i.has(e)===!1&&(i.add(e),e.usedTimes++),i.has(n)===!1&&(i.add(n),n.usedTimes++),this}remove(t){const e=this.materialCache.get(t);for(const n of e)n.usedTimes--,n.usedTimes===0&&this.shaderCache.delete(n.code);return this.materialCache.delete(t),this}getVertexShaderStage(t){return this._getShaderStage(t.vertexShader)}getFragmentShaderStage(t){return this._getShaderStage(t.fragmentShader)}dispose(){this.shaderCache.clear(),this.materialCache.clear()}_getShaderCacheForMaterial(t){const e=this.materialCache;let n=e.get(t);return n===void 0&&(n=new Set,e.set(t,n)),n}_getShaderStage(t){const e=this.shaderCache;let n=e.get(t);return n===void 0&&(n=new fy(t),e.set(t,n)),n}}class fy{constructor(t){this.id=uy++,this.code=t,this.usedTimes=0}}function py(r){return r===os||r===Ko||r===Zo}function my(r,t,e,n,i,s){const o=new Gc,a=new dy,l=new Set,c=[],h=new Map,u=n.logarithmicDepthBuffer;let d=n.precision;const f={MeshDepthMaterial:"depth",MeshDistanceMaterial:"distance",MeshNormalMaterial:"normal",MeshBasicMaterial:"basic",MeshLambertMaterial:"lambert",MeshPhongMaterial:"phong",MeshToonMaterial:"toon",MeshStandardMaterial:"physical",MeshPhysicalMaterial:"physical",MeshMatcapMaterial:"matcap",LineBasicMaterial:"basic",LineDashedMaterial:"dashed",PointsMaterial:"points",ShadowMaterial:"shadow",SpriteMaterial:"sprite"};function m(v){return l.add(v),v===0?"uv":`uv${v}`}function _(v,T,I,L,U,W){const K=L.fog,k=U.geometry,$=v.isMeshStandardMaterial||v.isMeshLambertMaterial||v.isMeshPhongMaterial?L.environment:null,V=v.isMeshStandardMaterial||v.isMeshLambertMaterial&&!v.envMap||v.isMeshPhongMaterial&&!v.envMap,Q=t.get(v.envMap||$,V),it=Q&&Q.mapping===fa?Q.image.height:null,ft=f[v.type];v.precision!==null&&(d=n.getMaxPrecision(v.precision),d!==v.precision&&wt("WebGLProgram.getParameters:",v.precision,"not supported, using",d,"instead."));const at=k.morphAttributes.position||k.morphAttributes.normal||k.morphAttributes.color,Y=at!==void 0?at.length:0;let Bt=0;k.morphAttributes.position!==void 0&&(Bt=1),k.morphAttributes.normal!==void 0&&(Bt=2),k.morphAttributes.color!==void 0&&(Bt=3);let re,Zt,Z,ht;if(ft){const bt=jn[ft];re=bt.vertexShader,Zt=bt.fragmentShader}else{re=v.vertexShader,Zt=v.fragmentShader;const bt=a.getVertexShaderStage(v),Ne=a.getFragmentShaderStage(v);a.update(v,bt,Ne),Z=bt.id,ht=Ne.id}const et=r.getRenderTarget(),Dt=r.state.buffers.depth.getReversed(),zt=U.isInstancedMesh===!0,Lt=U.isBatchedMesh===!0,Ie=!!v.map,Gt=!!v.matcap,ue=!!Q,oe=!!v.aoMap,ee=!!v.lightMap,jt=!!v.bumpMap&&v.wireframe===!1,ae=!!v.normalMap,ie=!!v.displacementMap,de=!!v.emissiveMap,ce=!!v.metalnessMap,Ee=!!v.roughnessMap,N=v.anisotropy>0,qt=v.clearcoat>0,ne=v.dispersion>0,C=v.iridescence>0,x=v.sheen>0,O=v.transmission>0,B=N&&!!v.anisotropyMap,X=qt&&!!v.clearcoatMap,st=qt&&!!v.clearcoatNormalMap,ut=qt&&!!v.clearcoatRoughnessMap,q=C&&!!v.iridescenceMap,j=C&&!!v.iridescenceThicknessMap,rt=x&&!!v.sheenColorMap,Mt=x&&!!v.sheenRoughnessMap,lt=!!v.specularMap,ct=!!v.specularColorMap,It=!!v.specularIntensityMap,Ft=O&&!!v.transmissionMap,Wt=O&&!!v.thicknessMap,D=!!v.gradientMap,dt=!!v.alphaMap,J=v.alphaTest>0,pt=!!v.alphaHash,xt=!!v.extensions;let tt=zn;v.toneMapped&&(et===null||et.isXRRenderTarget===!0)&&(tt=r.toneMapping);const Tt={shaderID:ft,shaderType:v.type,shaderName:v.name,vertexShader:re,fragmentShader:Zt,defines:v.defines,customVertexShaderID:Z,customFragmentShaderID:ht,isRawShaderMaterial:v.isRawShaderMaterial===!0,glslVersion:v.glslVersion,precision:d,batching:Lt,batchingColor:Lt&&U._colorsTexture!==null,instancing:zt,instancingColor:zt&&U.instanceColor!==null,instancingMorph:zt&&U.morphTexture!==null,outputColorSpace:et===null?r.outputColorSpace:et.isXRRenderTarget===!0?et.texture.colorSpace:Qt.workingColorSpace,alphaToCoverage:!!v.alphaToCoverage,map:Ie,matcap:Gt,envMap:ue,envMapMode:ue&&Q.mapping,envMapCubeUVHeight:it,aoMap:oe,lightMap:ee,bumpMap:jt,normalMap:ae,displacementMap:ie,emissiveMap:de,normalMapObjectSpace:ae&&v.normalMapType===em,normalMapTangentSpace:ae&&v.normalMapType===hc,packedNormalMap:ae&&v.normalMapType===hc&&py(v.normalMap.format),metalnessMap:ce,roughnessMap:Ee,anisotropy:N,anisotropyMap:B,clearcoat:qt,clearcoatMap:X,clearcoatNormalMap:st,clearcoatRoughnessMap:ut,dispersion:ne,iridescence:C,iridescenceMap:q,iridescenceThicknessMap:j,sheen:x,sheenColorMap:rt,sheenRoughnessMap:Mt,specularMap:lt,specularColorMap:ct,specularIntensityMap:It,transmission:O,transmissionMap:Ft,thicknessMap:Wt,gradientMap:D,opaque:v.transparent===!1&&v.blending===Gs&&v.alphaToCoverage===!1,alphaMap:dt,alphaTest:J,alphaHash:pt,combine:v.combine,mapUv:Ie&&m(v.map.channel),aoMapUv:oe&&m(v.aoMap.channel),lightMapUv:ee&&m(v.lightMap.channel),bumpMapUv:jt&&m(v.bumpMap.channel),normalMapUv:ae&&m(v.normalMap.channel),displacementMapUv:ie&&m(v.displacementMap.channel),emissiveMapUv:de&&m(v.emissiveMap.channel),metalnessMapUv:ce&&m(v.metalnessMap.channel),roughnessMapUv:Ee&&m(v.roughnessMap.channel),anisotropyMapUv:B&&m(v.anisotropyMap.channel),clearcoatMapUv:X&&m(v.clearcoatMap.channel),clearcoatNormalMapUv:st&&m(v.clearcoatNormalMap.channel),clearcoatRoughnessMapUv:ut&&m(v.clearcoatRoughnessMap.channel),iridescenceMapUv:q&&m(v.iridescenceMap.channel),iridescenceThicknessMapUv:j&&m(v.iridescenceThicknessMap.channel),sheenColorMapUv:rt&&m(v.sheenColorMap.channel),sheenRoughnessMapUv:Mt&&m(v.sheenRoughnessMap.channel),specularMapUv:lt&&m(v.specularMap.channel),specularColorMapUv:ct&&m(v.specularColorMap.channel),specularIntensityMapUv:It&&m(v.specularIntensityMap.channel),transmissionMapUv:Ft&&m(v.transmissionMap.channel),thicknessMapUv:Wt&&m(v.thicknessMap.channel),alphaMapUv:dt&&m(v.alphaMap.channel),vertexTangents:!!k.attributes.tangent&&(ae||N),vertexNormals:!!k.attributes.normal,vertexColors:v.vertexColors,vertexAlphas:v.vertexColors===!0&&!!k.attributes.color&&k.attributes.color.itemSize===4,pointsUvs:U.isPoints===!0&&!!k.attributes.uv&&(Ie||dt),fog:!!K,useFog:v.fog===!0,fogExp2:!!K&&K.isFogExp2,flatShading:v.wireframe===!1&&(v.flatShading===!0||k.attributes.normal===void 0&&ae===!1&&(v.isMeshLambertMaterial||v.isMeshPhongMaterial||v.isMeshStandardMaterial||v.isMeshPhysicalMaterial)),sizeAttenuation:v.sizeAttenuation===!0,logarithmicDepthBuffer:u,reversedDepthBuffer:Dt,skinning:U.isSkinnedMesh===!0,hasPositionAttribute:k.attributes.position!==void 0,morphTargets:k.morphAttributes.position!==void 0,morphNormals:k.morphAttributes.normal!==void 0,morphColors:k.morphAttributes.color!==void 0,morphTargetsCount:Y,morphTextureStride:Bt,numDirLights:T.directional.length,numPointLights:T.point.length,numSpotLights:T.spot.length,numSpotLightMaps:T.spotLightMap.length,numRectAreaLights:T.rectArea.length,numHemiLights:T.hemi.length,numDirLightShadows:T.directionalShadowMap.length,numPointLightShadows:T.pointShadowMap.length,numSpotLightShadows:T.spotShadowMap.length,numSpotLightShadowsWithMaps:T.numSpotLightShadowsWithMaps,numLightProbes:T.numLightProbes,numLightProbeGrids:W.length,numClippingPlanes:s.numPlanes,numClipIntersection:s.numIntersection,dithering:v.dithering,shadowMapEnabled:r.shadowMap.enabled&&I.length>0,shadowMapType:r.shadowMap.type,toneMapping:tt,decodeVideoTexture:Ie&&v.map.isVideoTexture===!0&&Qt.getTransfer(v.map.colorSpace)===me,decodeVideoTextureEmissive:de&&v.emissiveMap.isVideoTexture===!0&&Qt.getTransfer(v.emissiveMap.colorSpace)===me,premultipliedAlpha:v.premultipliedAlpha,doubleSided:v.side===on,flipSided:v.side===cn,useDepthPacking:v.depthPacking>=0,depthPacking:v.depthPacking||0,index0AttributeName:v.index0AttributeName,extensionClipCullDistance:xt&&v.extensions.clipCullDistance===!0&&e.has("WEBGL_clip_cull_distance"),extensionMultiDraw:(xt&&v.extensions.multiDraw===!0||Lt)&&e.has("WEBGL_multi_draw"),rendererExtensionParallelShaderCompile:e.has("KHR_parallel_shader_compile"),customProgramCacheKey:v.customProgramCacheKey()};return Tt.vertexUv1s=l.has(1),Tt.vertexUv2s=l.has(2),Tt.vertexUv3s=l.has(3),l.clear(),Tt}function g(v){const T=[];if(v.shaderID?T.push(v.shaderID):(T.push(v.customVertexShaderID),T.push(v.customFragmentShaderID)),v.defines!==void 0)for(const I in v.defines)T.push(I),T.push(v.defines[I]);return v.isRawShaderMaterial===!1&&(p(T,v),b(T,v),T.push(r.outputColorSpace)),T.push(v.customProgramCacheKey),T.join()}function p(v,T){v.push(T.precision),v.push(T.outputColorSpace),v.push(T.envMapMode),v.push(T.envMapCubeUVHeight),v.push(T.mapUv),v.push(T.alphaMapUv),v.push(T.lightMapUv),v.push(T.aoMapUv),v.push(T.bumpMapUv),v.push(T.normalMapUv),v.push(T.displacementMapUv),v.push(T.emissiveMapUv),v.push(T.metalnessMapUv),v.push(T.roughnessMapUv),v.push(T.anisotropyMapUv),v.push(T.clearcoatMapUv),v.push(T.clearcoatNormalMapUv),v.push(T.clearcoatRoughnessMapUv),v.push(T.iridescenceMapUv),v.push(T.iridescenceThicknessMapUv),v.push(T.sheenColorMapUv),v.push(T.sheenRoughnessMapUv),v.push(T.specularMapUv),v.push(T.specularColorMapUv),v.push(T.specularIntensityMapUv),v.push(T.transmissionMapUv),v.push(T.thicknessMapUv),v.push(T.combine),v.push(T.fogExp2),v.push(T.sizeAttenuation),v.push(T.morphTargetsCount),v.push(T.morphAttributeCount),v.push(T.numDirLights),v.push(T.numPointLights),v.push(T.numSpotLights),v.push(T.numSpotLightMaps),v.push(T.numHemiLights),v.push(T.numRectAreaLights),v.push(T.numDirLightShadows),v.push(T.numPointLightShadows),v.push(T.numSpotLightShadows),v.push(T.numSpotLightShadowsWithMaps),v.push(T.numLightProbes),v.push(T.shadowMapType),v.push(T.toneMapping),v.push(T.numClippingPlanes),v.push(T.numClipIntersection),v.push(T.depthPacking)}function b(v,T){o.disableAll(),T.instancing&&o.enable(0),T.instancingColor&&o.enable(1),T.instancingMorph&&o.enable(2),T.matcap&&o.enable(3),T.envMap&&o.enable(4),T.normalMapObjectSpace&&o.enable(5),T.normalMapTangentSpace&&o.enable(6),T.clearcoat&&o.enable(7),T.iridescence&&o.enable(8),T.alphaTest&&o.enable(9),T.vertexColors&&o.enable(10),T.vertexAlphas&&o.enable(11),T.vertexUv1s&&o.enable(12),T.vertexUv2s&&o.enable(13),T.vertexUv3s&&o.enable(14),T.vertexTangents&&o.enable(15),T.anisotropy&&o.enable(16),T.alphaHash&&o.enable(17),T.batching&&o.enable(18),T.dispersion&&o.enable(19),T.batchingColor&&o.enable(20),T.gradientMap&&o.enable(21),T.packedNormalMap&&o.enable(22),T.vertexNormals&&o.enable(23),v.push(o.mask),o.disableAll(),T.fog&&o.enable(0),T.useFog&&o.enable(1),T.flatShading&&o.enable(2),T.logarithmicDepthBuffer&&o.enable(3),T.reversedDepthBuffer&&o.enable(4),T.skinning&&o.enable(5),T.morphTargets&&o.enable(6),T.morphNormals&&o.enable(7),T.morphColors&&o.enable(8),T.premultipliedAlpha&&o.enable(9),T.shadowMapEnabled&&o.enable(10),T.doubleSided&&o.enable(11),T.flipSided&&o.enable(12),T.useDepthPacking&&o.enable(13),T.dithering&&o.enable(14),T.transmission&&o.enable(15),T.sheen&&o.enable(16),T.opaque&&o.enable(17),T.pointsUvs&&o.enable(18),T.decodeVideoTexture&&o.enable(19),T.decodeVideoTextureEmissive&&o.enable(20),T.alphaToCoverage&&o.enable(21),T.numLightProbeGrids>0&&o.enable(22),T.hasPositionAttribute&&o.enable(23),v.push(o.mask)}function E(v){const T=f[v.type];let I;if(T){const L=jn[T];I=rg.clone(L.uniforms)}else I=v.uniforms;return I}function y(v,T){let I=h.get(T);return I!==void 0?++I.usedTimes:(I=new hy(r,T,v,i),c.push(I),h.set(T,I)),I}function S(v){if(--v.usedTimes===0){const T=c.indexOf(v);c[T]=c[c.length-1],c.pop(),h.delete(v.cacheKey),v.destroy()}}function w(v){a.remove(v)}function A(){a.dispose()}return{getParameters:_,getProgramCacheKey:g,getUniforms:E,acquireProgram:y,releaseProgram:S,releaseShaderCache:w,programs:c,dispose:A}}function gy(){let r=new WeakMap;function t(o){return r.has(o)}function e(o){let a=r.get(o);return a===void 0&&(a={},r.set(o,a)),a}function n(o){r.delete(o)}function i(o,a,l){r.get(o)[a]=l}function s(){r=new WeakMap}return{has:t,get:e,remove:n,update:i,dispose:s}}function _y(r,t){return r.groupOrder!==t.groupOrder?r.groupOrder-t.groupOrder:r.renderOrder!==t.renderOrder?r.renderOrder-t.renderOrder:r.material.id!==t.material.id?r.material.id-t.material.id:r.materialVariant!==t.materialVariant?r.materialVariant-t.materialVariant:r.z!==t.z?r.z-t.z:r.id-t.id}function Yu(r,t){return r.groupOrder!==t.groupOrder?r.groupOrder-t.groupOrder:r.renderOrder!==t.renderOrder?r.renderOrder-t.renderOrder:r.z!==t.z?t.z-r.z:r.id-t.id}function Ku(){const r=[];let t=0;const e=[],n=[],i=[];function s(){t=0,e.length=0,n.length=0,i.length=0}function o(d){let f=0;return d.isInstancedMesh&&(f+=2),d.isSkinnedMesh&&(f+=1),f}function a(d,f,m,_,g,p){let b=r[t];return b===void 0?(b={id:d.id,object:d,geometry:f,material:m,materialVariant:o(d),groupOrder:_,renderOrder:d.renderOrder,z:g,group:p},r[t]=b):(b.id=d.id,b.object=d,b.geometry=f,b.material=m,b.materialVariant=o(d),b.groupOrder=_,b.renderOrder=d.renderOrder,b.z=g,b.group=p),t++,b}function l(d,f,m,_,g,p){const b=a(d,f,m,_,g,p);m.transmission>0?n.push(b):m.transparent===!0?i.push(b):e.push(b)}function c(d,f,m,_,g,p){const b=a(d,f,m,_,g,p);m.transmission>0?n.unshift(b):m.transparent===!0?i.unshift(b):e.unshift(b)}function h(d,f,m){e.length>1&&e.sort(d||_y),n.length>1&&n.sort(f||Yu),i.length>1&&i.sort(f||Yu),m&&(e.reverse(),n.reverse(),i.reverse())}function u(){for(let d=t,f=r.length;d<f;d++){const m=r[d];if(m.id===null)break;m.id=null,m.object=null,m.geometry=null,m.material=null,m.group=null}}return{opaque:e,transmissive:n,transparent:i,init:s,push:l,unshift:c,finish:u,sort:h}}function xy(){let r=new WeakMap;function t(n,i){const s=r.get(n);let o;return s===void 0?(o=new Ku,r.set(n,[o])):i>=s.length?(o=new Ku,s.push(o)):o=s[i],o}function e(){r=new WeakMap}return{get:t,dispose:e}}function vy(){const r={};return{get:function(t){if(r[t.id]!==void 0)return r[t.id];let e;switch(t.type){case"DirectionalLight":e={direction:new P,color:new Et};break;case"SpotLight":e={position:new P,direction:new P,color:new Et,distance:0,coneCos:0,penumbraCos:0,decay:0};break;case"PointLight":e={position:new P,color:new Et,distance:0,decay:0};break;case"HemisphereLight":e={direction:new P,skyColor:new Et,groundColor:new Et};break;case"RectAreaLight":e={color:new Et,position:new P,halfWidth:new P,halfHeight:new P};break}return r[t.id]=e,e}}}function yy(){const r={};return{get:function(t){if(r[t.id]!==void 0)return r[t.id];let e;switch(t.type){case"DirectionalLight":e={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new At};break;case"SpotLight":e={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new At};break;case"PointLight":e={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new At,shadowCameraNear:1,shadowCameraFar:1e3};break}return r[t.id]=e,e}}}let My=0;function by(r,t){return(t.castShadow?2:0)-(r.castShadow?2:0)+(t.map?1:0)-(r.map?1:0)}function Sy(r){const t=new vy,e=yy(),n={version:0,hash:{directionalLength:-1,pointLength:-1,spotLength:-1,rectAreaLength:-1,hemiLength:-1,numDirectionalShadows:-1,numPointShadows:-1,numSpotShadows:-1,numSpotMaps:-1,numLightProbes:-1},ambient:[0,0,0],probe:[],directional:[],directionalShadow:[],directionalShadowMap:[],directionalShadowMatrix:[],spot:[],spotLightMap:[],spotShadow:[],spotShadowMap:[],spotLightMatrix:[],rectArea:[],rectAreaLTC1:null,rectAreaLTC2:null,point:[],pointShadow:[],pointShadowMap:[],pointShadowMatrix:[],hemi:[],numSpotLightShadowsWithMaps:0,numLightProbes:0};for(let c=0;c<9;c++)n.probe.push(new P);const i=new P,s=new Ht,o=new Ht;function a(c){let h=0,u=0,d=0;for(let T=0;T<9;T++)n.probe[T].set(0,0,0);let f=0,m=0,_=0,g=0,p=0,b=0,E=0,y=0,S=0,w=0,A=0;c.sort(by);for(let T=0,I=c.length;T<I;T++){const L=c[T],U=L.color,W=L.intensity,K=L.distance;let k=null;if(L.shadow&&L.shadow.map&&(L.shadow.map.texture.format===os?k=L.shadow.map.texture:k=L.shadow.map.depthTexture||L.shadow.map.texture),L.isAmbientLight)h+=U.r*W,u+=U.g*W,d+=U.b*W;else if(L.isLightProbe){for(let $=0;$<9;$++)n.probe[$].addScaledVector(L.sh.coefficients[$],W);A++}else if(L.isDirectionalLight){const $=t.get(L);if($.color.copy(L.color).multiplyScalar(L.intensity),L.castShadow){const V=L.shadow,Q=e.get(L);Q.shadowIntensity=V.intensity,Q.shadowBias=V.bias,Q.shadowNormalBias=V.normalBias,Q.shadowRadius=V.radius,Q.shadowMapSize=V.mapSize,n.directionalShadow[f]=Q,n.directionalShadowMap[f]=k,n.directionalShadowMatrix[f]=L.shadow.matrix,b++}n.directional[f]=$,f++}else if(L.isSpotLight){const $=t.get(L);$.position.setFromMatrixPosition(L.matrixWorld),$.color.copy(U).multiplyScalar(W),$.distance=K,$.coneCos=Math.cos(L.angle),$.penumbraCos=Math.cos(L.angle*(1-L.penumbra)),$.decay=L.decay,n.spot[_]=$;const V=L.shadow;if(L.map&&(n.spotLightMap[S]=L.map,S++,V.updateMatrices(L),L.castShadow&&w++),n.spotLightMatrix[_]=V.matrix,L.castShadow){const Q=e.get(L);Q.shadowIntensity=V.intensity,Q.shadowBias=V.bias,Q.shadowNormalBias=V.normalBias,Q.shadowRadius=V.radius,Q.shadowMapSize=V.mapSize,n.spotShadow[_]=Q,n.spotShadowMap[_]=k,y++}_++}else if(L.isRectAreaLight){const $=t.get(L);$.color.copy(U).multiplyScalar(W),$.halfWidth.set(L.width*.5,0,0),$.halfHeight.set(0,L.height*.5,0),n.rectArea[g]=$,g++}else if(L.isPointLight){const $=t.get(L);if($.color.copy(L.color).multiplyScalar(L.intensity),$.distance=L.distance,$.decay=L.decay,L.castShadow){const V=L.shadow,Q=e.get(L);Q.shadowIntensity=V.intensity,Q.shadowBias=V.bias,Q.shadowNormalBias=V.normalBias,Q.shadowRadius=V.radius,Q.shadowMapSize=V.mapSize,Q.shadowCameraNear=V.camera.near,Q.shadowCameraFar=V.camera.far,n.pointShadow[m]=Q,n.pointShadowMap[m]=k,n.pointShadowMatrix[m]=L.shadow.matrix,E++}n.point[m]=$,m++}else if(L.isHemisphereLight){const $=t.get(L);$.skyColor.copy(L.color).multiplyScalar(W),$.groundColor.copy(L.groundColor).multiplyScalar(W),n.hemi[p]=$,p++}}g>0&&(r.has("OES_texture_float_linear")===!0?(n.rectAreaLTC1=mt.LTC_FLOAT_1,n.rectAreaLTC2=mt.LTC_FLOAT_2):(n.rectAreaLTC1=mt.LTC_HALF_1,n.rectAreaLTC2=mt.LTC_HALF_2)),n.ambient[0]=h,n.ambient[1]=u,n.ambient[2]=d;const v=n.hash;(v.directionalLength!==f||v.pointLength!==m||v.spotLength!==_||v.rectAreaLength!==g||v.hemiLength!==p||v.numDirectionalShadows!==b||v.numPointShadows!==E||v.numSpotShadows!==y||v.numSpotMaps!==S||v.numLightProbes!==A)&&(n.directional.length=f,n.spot.length=_,n.rectArea.length=g,n.point.length=m,n.hemi.length=p,n.directionalShadow.length=b,n.directionalShadowMap.length=b,n.pointShadow.length=E,n.pointShadowMap.length=E,n.spotShadow.length=y,n.spotShadowMap.length=y,n.directionalShadowMatrix.length=b,n.pointShadowMatrix.length=E,n.spotLightMatrix.length=y+S-w,n.spotLightMap.length=S,n.numSpotLightShadowsWithMaps=w,n.numLightProbes=A,v.directionalLength=f,v.pointLength=m,v.spotLength=_,v.rectAreaLength=g,v.hemiLength=p,v.numDirectionalShadows=b,v.numPointShadows=E,v.numSpotShadows=y,v.numSpotMaps=S,v.numLightProbes=A,n.version=My++)}function l(c,h){let u=0,d=0,f=0,m=0,_=0;const g=h.matrixWorldInverse;for(let p=0,b=c.length;p<b;p++){const E=c[p];if(E.isDirectionalLight){const y=n.directional[u];y.direction.setFromMatrixPosition(E.matrixWorld),i.setFromMatrixPosition(E.target.matrixWorld),y.direction.sub(i),y.direction.transformDirection(g),u++}else if(E.isSpotLight){const y=n.spot[f];y.position.setFromMatrixPosition(E.matrixWorld),y.position.applyMatrix4(g),y.direction.setFromMatrixPosition(E.matrixWorld),i.setFromMatrixPosition(E.target.matrixWorld),y.direction.sub(i),y.direction.transformDirection(g),f++}else if(E.isRectAreaLight){const y=n.rectArea[m];y.position.setFromMatrixPosition(E.matrixWorld),y.position.applyMatrix4(g),o.identity(),s.copy(E.matrixWorld),s.premultiply(g),o.extractRotation(s),y.halfWidth.set(E.width*.5,0,0),y.halfHeight.set(0,E.height*.5,0),y.halfWidth.applyMatrix4(o),y.halfHeight.applyMatrix4(o),m++}else if(E.isPointLight){const y=n.point[d];y.position.setFromMatrixPosition(E.matrixWorld),y.position.applyMatrix4(g),d++}else if(E.isHemisphereLight){const y=n.hemi[_];y.direction.setFromMatrixPosition(E.matrixWorld),y.direction.transformDirection(g),_++}}}return{setup:a,setupView:l,state:n}}function Zu(r){const t=new Sy(r),e=[],n=[],i=[];function s(d){u.camera=d,e.length=0,n.length=0,i.length=0}function o(d){e.push(d)}function a(d){n.push(d)}function l(d){i.push(d)}function c(){t.setup(e)}function h(d){t.setupView(e,d)}const u={lightsArray:e,shadowsArray:n,lightProbeGridArray:i,camera:null,lights:t,transmissionRenderTarget:{},textureUnits:0};return{init:s,state:u,setupLights:c,setupLightsView:h,pushLight:o,pushShadow:a,pushLightProbeGrid:l}}function wy(r){let t=new WeakMap;function e(i,s=0){const o=t.get(i);let a;return o===void 0?(a=new Zu(r),t.set(i,[a])):s>=o.length?(a=new Zu(r),o.push(a)):a=o[s],a}function n(){t=new WeakMap}return{get:e,dispose:n}}const Ey=`void main() {
	gl_Position = vec4( position, 1.0 );
}`,Ty=`uniform sampler2D shadow_pass;
uniform vec2 resolution;
uniform float radius;
void main() {
	const float samples = float( VSM_SAMPLES );
	float mean = 0.0;
	float squared_mean = 0.0;
	float uvStride = samples <= 1.0 ? 0.0 : 2.0 / ( samples - 1.0 );
	float uvStart = samples <= 1.0 ? 0.0 : - 1.0;
	for ( float i = 0.0; i < samples; i ++ ) {
		float uvOffset = uvStart + i * uvStride;
		#ifdef HORIZONTAL_PASS
			vec2 distribution = texture2D( shadow_pass, ( gl_FragCoord.xy + vec2( uvOffset, 0.0 ) * radius ) / resolution ).rg;
			mean += distribution.x;
			squared_mean += distribution.y * distribution.y + distribution.x * distribution.x;
		#else
			float depth = texture2D( shadow_pass, ( gl_FragCoord.xy + vec2( 0.0, uvOffset ) * radius ) / resolution ).r;
			mean += depth;
			squared_mean += depth * depth;
		#endif
	}
	mean = mean / samples;
	squared_mean = squared_mean / samples;
	float std_dev = sqrt( max( 0.0, squared_mean - mean * mean ) );
	gl_FragColor = vec4( mean, std_dev, 0.0, 1.0 );
}`,Ay=[new P(1,0,0),new P(-1,0,0),new P(0,1,0),new P(0,-1,0),new P(0,0,1),new P(0,0,-1)],Cy=[new P(0,-1,0),new P(0,-1,0),new P(0,0,1),new P(0,0,-1),new P(0,-1,0),new P(0,-1,0)],ju=new Ht,Sr=new P,ol=new P;function Ry(r,t,e){let n=new Yc;const i=new At,s=new At,o=new be,a=new cg,l=new hg,c={},h=e.maxTextureSize,u={[bi]:cn,[cn]:bi,[on]:on},d=new ai({defines:{VSM_SAMPLES:8},uniforms:{shadow_pass:{value:null},resolution:{value:new At},radius:{value:4}},vertexShader:Ey,fragmentShader:Ty}),f=d.clone();f.defines.HORIZONTAL_PASS=1;const m=new De;m.setAttribute("position",new gn(new Float32Array([-1,-1,.5,3,-1,.5,-1,3,.5]),3));const _=new te(m,d),g=this;this.enabled=!1,this.autoUpdate=!0,this.needsUpdate=!1,this.type=zo;let p=this.type;this.render=function(w,A,v){if(g.enabled===!1||g.autoUpdate===!1&&g.needsUpdate===!1||w.length===0)return;this.type===Yd&&(wt("WebGLShadowMap: PCFSoftShadowMap has been deprecated. Using PCFShadowMap instead."),this.type=zo);const T=r.getRenderTarget(),I=r.getActiveCubeFace(),L=r.getActiveMipmapLevel(),U=r.state;U.setBlending(vi),U.buffers.depth.getReversed()===!0?U.buffers.color.setClear(0,0,0,0):U.buffers.color.setClear(1,1,1,1),U.buffers.depth.setTest(!0),U.setScissorTest(!1);const W=p!==this.type;W&&A.traverse(function(K){K.material&&(Array.isArray(K.material)?K.material.forEach(k=>k.needsUpdate=!0):K.material.needsUpdate=!0)});for(let K=0,k=w.length;K<k;K++){const $=w[K],V=$.shadow;if(V===void 0){wt("WebGLShadowMap:",$,"has no shadow.");continue}if(V.autoUpdate===!1&&V.needsUpdate===!1)continue;i.copy(V.mapSize);const Q=V.getFrameExtents();i.multiply(Q),s.copy(V.mapSize),(i.x>h||i.y>h)&&(i.x>h&&(s.x=Math.floor(h/Q.x),i.x=s.x*Q.x,V.mapSize.x=s.x),i.y>h&&(s.y=Math.floor(h/Q.y),i.y=s.y*Q.y,V.mapSize.y=s.y));const it=r.state.buffers.depth.getReversed();if(V.camera._reversedDepth=it,V.map===null||W===!0){if(V.map!==null&&(V.map.depthTexture!==null&&(V.map.depthTexture.dispose(),V.map.depthTexture=null),V.map.dispose()),this.type===Rr){if($.isPointLight){wt("WebGLShadowMap: VSM shadow maps are not supported for PointLights. Use PCF or BasicShadowMap instead.");continue}V.map=new si(i.x,i.y,{format:os,type:Si,minFilter:We,magFilter:We,generateMipmaps:!1}),V.map.texture.name=$.name+".shadowMap",V.map.depthTexture=new tr(i.x,i.y,Nn),V.map.depthTexture.name=$.name+".shadowMapDepth",V.map.depthTexture.format=wi,V.map.depthTexture.compareFunction=null,V.map.depthTexture.minFilter=$e,V.map.depthTexture.magFilter=$e}else $.isPointLight?(V.map=new kf(i.x),V.map.depthTexture=new ig(i.x,oi)):(V.map=new si(i.x,i.y),V.map.depthTexture=new tr(i.x,i.y,oi)),V.map.depthTexture.name=$.name+".shadowMap",V.map.depthTexture.format=wi,this.type===zo?(V.map.depthTexture.compareFunction=it?zc:Bc,V.map.depthTexture.minFilter=We,V.map.depthTexture.magFilter=We):(V.map.depthTexture.compareFunction=null,V.map.depthTexture.minFilter=$e,V.map.depthTexture.magFilter=$e);V.camera.updateProjectionMatrix()}const ft=V.map.isWebGLCubeRenderTarget?6:1;for(let at=0;at<ft;at++){if(V.map.isWebGLCubeRenderTarget)r.setRenderTarget(V.map,at),r.clear();else{at===0&&(r.setRenderTarget(V.map),r.clear());const Y=V.getViewport(at);o.set(s.x*Y.x,s.y*Y.y,s.x*Y.z,s.y*Y.w),U.viewport(o)}if($.isPointLight){const Y=V.camera,Bt=V.matrix,re=$.distance||Y.far;re!==Y.far&&(Y.far=re,Y.updateProjectionMatrix()),Sr.setFromMatrixPosition($.matrixWorld),Y.position.copy(Sr),ol.copy(Y.position),ol.add(Ay[at]),Y.up.copy(Cy[at]),Y.lookAt(ol),Y.updateMatrixWorld(),Bt.makeTranslation(-Sr.x,-Sr.y,-Sr.z),ju.multiplyMatrices(Y.projectionMatrix,Y.matrixWorldInverse),V._frustum.setFromProjectionMatrix(ju,Y.coordinateSystem,Y.reversedDepth)}else V.updateMatrices($);n=V.getFrustum(),y(A,v,V.camera,$,this.type)}V.isPointLightShadow!==!0&&this.type===Rr&&b(V,v),V.needsUpdate=!1}p=this.type,g.needsUpdate=!1,r.setRenderTarget(T,I,L)};function b(w,A){const v=t.update(_);d.defines.VSM_SAMPLES!==w.blurSamples&&(d.defines.VSM_SAMPLES=w.blurSamples,f.defines.VSM_SAMPLES=w.blurSamples,d.needsUpdate=!0,f.needsUpdate=!0),w.mapPass===null&&(w.mapPass=new si(i.x,i.y,{format:os,type:Si})),d.uniforms.shadow_pass.value=w.map.depthTexture,d.uniforms.resolution.value=w.mapSize,d.uniforms.radius.value=w.radius,r.setRenderTarget(w.mapPass),r.clear(),r.renderBufferDirect(A,null,v,d,_,null),f.uniforms.shadow_pass.value=w.mapPass.texture,f.uniforms.resolution.value=w.mapSize,f.uniforms.radius.value=w.radius,r.setRenderTarget(w.map),r.clear(),r.renderBufferDirect(A,null,v,f,_,null)}function E(w,A,v,T){let I=null;const L=v.isPointLight===!0?w.customDistanceMaterial:w.customDepthMaterial;if(L!==void 0)I=L;else if(I=v.isPointLight===!0?l:a,r.localClippingEnabled&&A.clipShadows===!0&&Array.isArray(A.clippingPlanes)&&A.clippingPlanes.length!==0||A.displacementMap&&A.displacementScale!==0||A.alphaMap&&A.alphaTest>0||A.map&&A.alphaTest>0||A.alphaToCoverage===!0){const U=I.uuid,W=A.uuid;let K=c[U];K===void 0&&(K={},c[U]=K);let k=K[W];k===void 0&&(k=I.clone(),K[W]=k,A.addEventListener("dispose",S)),I=k}if(I.visible=A.visible,I.wireframe=A.wireframe,T===Rr?I.side=A.shadowSide!==null?A.shadowSide:A.side:I.side=A.shadowSide!==null?A.shadowSide:u[A.side],I.alphaMap=A.alphaMap,I.alphaTest=A.alphaToCoverage===!0?.5:A.alphaTest,I.map=A.map,I.clipShadows=A.clipShadows,I.clippingPlanes=A.clippingPlanes,I.clipIntersection=A.clipIntersection,I.displacementMap=A.displacementMap,I.displacementScale=A.displacementScale,I.displacementBias=A.displacementBias,I.wireframeLinewidth=A.wireframeLinewidth,I.linewidth=A.linewidth,v.isPointLight===!0&&I.isMeshDistanceMaterial===!0){const U=r.properties.get(I);U.light=v}return I}function y(w,A,v,T,I){if(w.visible===!1)return;if(w.layers.test(A.layers)&&(w.isMesh||w.isLine||w.isPoints)&&(w.castShadow||w.receiveShadow&&I===Rr)&&(!w.frustumCulled||n.intersectsObject(w))){w.modelViewMatrix.multiplyMatrices(v.matrixWorldInverse,w.matrixWorld);const W=t.update(w),K=w.material;if(Array.isArray(K)){const k=W.groups;for(let $=0,V=k.length;$<V;$++){const Q=k[$],it=K[Q.materialIndex];if(it&&it.visible){const ft=E(w,it,T,I);w.onBeforeShadow(r,w,A,v,W,ft,Q),r.renderBufferDirect(v,null,W,ft,w,Q),w.onAfterShadow(r,w,A,v,W,ft,Q)}}}else if(K.visible){const k=E(w,K,T,I);w.onBeforeShadow(r,w,A,v,W,k,null),r.renderBufferDirect(v,null,W,k,w,null),w.onAfterShadow(r,w,A,v,W,k,null)}}const U=w.children;for(let W=0,K=U.length;W<K;W++)y(U[W],A,v,T,I)}function S(w){w.target.removeEventListener("dispose",S);for(const v in c){const T=c[v],I=w.target.uuid;I in T&&(T[I].dispose(),delete T[I])}}}function Py(r,t){function e(){let D=!1;const dt=new be;let J=null;const pt=new be(0,0,0,0);return{setMask:function(xt){J!==xt&&!D&&(r.colorMask(xt,xt,xt,xt),J=xt)},setLocked:function(xt){D=xt},setClear:function(xt,tt,Tt,bt,Ne){Ne===!0&&(xt*=bt,tt*=bt,Tt*=bt),dt.set(xt,tt,Tt,bt),pt.equals(dt)===!1&&(r.clearColor(xt,tt,Tt,bt),pt.copy(dt))},reset:function(){D=!1,J=null,pt.set(-1,0,0,0)}}}function n(){let D=!1,dt=!1,J=null,pt=null,xt=null;return{setReversed:function(tt){if(dt!==tt){const Tt=t.get("EXT_clip_control");tt?Tt.clipControlEXT(Tt.LOWER_LEFT_EXT,Tt.ZERO_TO_ONE_EXT):Tt.clipControlEXT(Tt.LOWER_LEFT_EXT,Tt.NEGATIVE_ONE_TO_ONE_EXT),dt=tt;const bt=xt;xt=null,this.setClear(bt)}},getReversed:function(){return dt},setTest:function(tt){tt?et(r.DEPTH_TEST):Dt(r.DEPTH_TEST)},setMask:function(tt){J!==tt&&!D&&(r.depthMask(tt),J=tt)},setFunc:function(tt){if(dt&&(tt=fm[tt]),pt!==tt){switch(tt){case Tl:r.depthFunc(r.NEVER);break;case Al:r.depthFunc(r.ALWAYS);break;case Cl:r.depthFunc(r.LESS);break;case js:r.depthFunc(r.LEQUAL);break;case Rl:r.depthFunc(r.EQUAL);break;case Pl:r.depthFunc(r.GEQUAL);break;case Il:r.depthFunc(r.GREATER);break;case Ll:r.depthFunc(r.NOTEQUAL);break;default:r.depthFunc(r.LEQUAL)}pt=tt}},setLocked:function(tt){D=tt},setClear:function(tt){xt!==tt&&(xt=tt,dt&&(tt=1-tt),r.clearDepth(tt))},reset:function(){D=!1,J=null,pt=null,xt=null,dt=!1}}}function i(){let D=!1,dt=null,J=null,pt=null,xt=null,tt=null,Tt=null,bt=null,Ne=null;return{setTest:function(Te){D||(Te?et(r.STENCIL_TEST):Dt(r.STENCIL_TEST))},setMask:function(Te){dt!==Te&&!D&&(r.stencilMask(Te),dt=Te)},setFunc:function(Te,Xn,qn){(J!==Te||pt!==Xn||xt!==qn)&&(r.stencilFunc(Te,Xn,qn),J=Te,pt=Xn,xt=qn)},setOp:function(Te,Xn,qn){(tt!==Te||Tt!==Xn||bt!==qn)&&(r.stencilOp(Te,Xn,qn),tt=Te,Tt=Xn,bt=qn)},setLocked:function(Te){D=Te},setClear:function(Te){Ne!==Te&&(r.clearStencil(Te),Ne=Te)},reset:function(){D=!1,dt=null,J=null,pt=null,xt=null,tt=null,Tt=null,bt=null,Ne=null}}}const s=new e,o=new n,a=new i,l=new WeakMap,c=new WeakMap;let h={},u={},d={},f=new WeakMap,m=[],_=null,g=!1,p=null,b=null,E=null,y=null,S=null,w=null,A=null,v=new Et(0,0,0),T=0,I=!1,L=null,U=null,W=null,K=null,k=null;const $=r.getParameter(r.MAX_COMBINED_TEXTURE_IMAGE_UNITS);let V=!1,Q=0;const it=r.getParameter(r.VERSION);it.indexOf("WebGL")!==-1?(Q=parseFloat(/^WebGL (\d)/.exec(it)[1]),V=Q>=1):it.indexOf("OpenGL ES")!==-1&&(Q=parseFloat(/^OpenGL ES (\d)/.exec(it)[1]),V=Q>=2);let ft=null,at={};const Y=r.getParameter(r.SCISSOR_BOX),Bt=r.getParameter(r.VIEWPORT),re=new be().fromArray(Y),Zt=new be().fromArray(Bt);function Z(D,dt,J,pt){const xt=new Uint8Array(4),tt=r.createTexture();r.bindTexture(D,tt),r.texParameteri(D,r.TEXTURE_MIN_FILTER,r.NEAREST),r.texParameteri(D,r.TEXTURE_MAG_FILTER,r.NEAREST);for(let Tt=0;Tt<J;Tt++)D===r.TEXTURE_3D||D===r.TEXTURE_2D_ARRAY?r.texImage3D(dt,0,r.RGBA,1,1,pt,0,r.RGBA,r.UNSIGNED_BYTE,xt):r.texImage2D(dt+Tt,0,r.RGBA,1,1,0,r.RGBA,r.UNSIGNED_BYTE,xt);return tt}const ht={};ht[r.TEXTURE_2D]=Z(r.TEXTURE_2D,r.TEXTURE_2D,1),ht[r.TEXTURE_CUBE_MAP]=Z(r.TEXTURE_CUBE_MAP,r.TEXTURE_CUBE_MAP_POSITIVE_X,6),ht[r.TEXTURE_2D_ARRAY]=Z(r.TEXTURE_2D_ARRAY,r.TEXTURE_2D_ARRAY,1,1),ht[r.TEXTURE_3D]=Z(r.TEXTURE_3D,r.TEXTURE_3D,1,1),s.setClear(0,0,0,1),o.setClear(1),a.setClear(0),et(r.DEPTH_TEST),o.setFunc(js),jt(!1),ae(Lh),et(r.CULL_FACE),oe(vi);function et(D){h[D]!==!0&&(r.enable(D),h[D]=!0)}function Dt(D){h[D]!==!1&&(r.disable(D),h[D]=!1)}function zt(D,dt){return d[D]!==dt?(r.bindFramebuffer(D,dt),d[D]=dt,D===r.DRAW_FRAMEBUFFER&&(d[r.FRAMEBUFFER]=dt),D===r.FRAMEBUFFER&&(d[r.DRAW_FRAMEBUFFER]=dt),!0):!1}function Lt(D,dt){let J=m,pt=!1;if(D){J=f.get(dt),J===void 0&&(J=[],f.set(dt,J));const xt=D.textures;if(J.length!==xt.length||J[0]!==r.COLOR_ATTACHMENT0){for(let tt=0,Tt=xt.length;tt<Tt;tt++)J[tt]=r.COLOR_ATTACHMENT0+tt;J.length=xt.length,pt=!0}}else J[0]!==r.BACK&&(J[0]=r.BACK,pt=!0);pt&&r.drawBuffers(J)}function Ie(D){return _!==D?(r.useProgram(D),_=D,!0):!1}const Gt={[Qi]:r.FUNC_ADD,[Ip]:r.FUNC_SUBTRACT,[Lp]:r.FUNC_REVERSE_SUBTRACT};Gt[Dp]=r.MIN,Gt[Np]=r.MAX;const ue={[Up]:r.ZERO,[Fp]:r.ONE,[Op]:r.SRC_COLOR,[wl]:r.SRC_ALPHA,[Gp]:r.SRC_ALPHA_SATURATE,[Hp]:r.DST_COLOR,[Bp]:r.DST_ALPHA,[kp]:r.ONE_MINUS_SRC_COLOR,[El]:r.ONE_MINUS_SRC_ALPHA,[Vp]:r.ONE_MINUS_DST_COLOR,[zp]:r.ONE_MINUS_DST_ALPHA,[Wp]:r.CONSTANT_COLOR,[Xp]:r.ONE_MINUS_CONSTANT_COLOR,[qp]:r.CONSTANT_ALPHA,[$p]:r.ONE_MINUS_CONSTANT_ALPHA};function oe(D,dt,J,pt,xt,tt,Tt,bt,Ne,Te){if(D===vi){g===!0&&(Dt(r.BLEND),g=!1);return}if(g===!1&&(et(r.BLEND),g=!0),D!==Pp){if(D!==p||Te!==I){if((b!==Qi||S!==Qi)&&(r.blendEquation(r.FUNC_ADD),b=Qi,S=Qi),Te)switch(D){case Gs:r.blendFuncSeparate(r.ONE,r.ONE_MINUS_SRC_ALPHA,r.ONE,r.ONE_MINUS_SRC_ALPHA);break;case Os:r.blendFunc(r.ONE,r.ONE);break;case Dh:r.blendFuncSeparate(r.ZERO,r.ONE_MINUS_SRC_COLOR,r.ZERO,r.ONE);break;case Nh:r.blendFuncSeparate(r.DST_COLOR,r.ONE_MINUS_SRC_ALPHA,r.ZERO,r.ONE);break;default:Ot("WebGLState: Invalid blending: ",D);break}else switch(D){case Gs:r.blendFuncSeparate(r.SRC_ALPHA,r.ONE_MINUS_SRC_ALPHA,r.ONE,r.ONE_MINUS_SRC_ALPHA);break;case Os:r.blendFuncSeparate(r.SRC_ALPHA,r.ONE,r.ONE,r.ONE);break;case Dh:Ot("WebGLState: SubtractiveBlending requires material.premultipliedAlpha = true");break;case Nh:Ot("WebGLState: MultiplyBlending requires material.premultipliedAlpha = true");break;default:Ot("WebGLState: Invalid blending: ",D);break}E=null,y=null,w=null,A=null,v.set(0,0,0),T=0,p=D,I=Te}return}xt=xt||dt,tt=tt||J,Tt=Tt||pt,(dt!==b||xt!==S)&&(r.blendEquationSeparate(Gt[dt],Gt[xt]),b=dt,S=xt),(J!==E||pt!==y||tt!==w||Tt!==A)&&(r.blendFuncSeparate(ue[J],ue[pt],ue[tt],ue[Tt]),E=J,y=pt,w=tt,A=Tt),(bt.equals(v)===!1||Ne!==T)&&(r.blendColor(bt.r,bt.g,bt.b,Ne),v.copy(bt),T=Ne),p=D,I=!1}function ee(D,dt){D.side===on?Dt(r.CULL_FACE):et(r.CULL_FACE);let J=D.side===cn;dt&&(J=!J),jt(J),D.blending===Gs&&D.transparent===!1?oe(vi):oe(D.blending,D.blendEquation,D.blendSrc,D.blendDst,D.blendEquationAlpha,D.blendSrcAlpha,D.blendDstAlpha,D.blendColor,D.blendAlpha,D.premultipliedAlpha),o.setFunc(D.depthFunc),o.setTest(D.depthTest),o.setMask(D.depthWrite),s.setMask(D.colorWrite);const pt=D.stencilWrite;a.setTest(pt),pt&&(a.setMask(D.stencilWriteMask),a.setFunc(D.stencilFunc,D.stencilRef,D.stencilFuncMask),a.setOp(D.stencilFail,D.stencilZFail,D.stencilZPass)),de(D.polygonOffset,D.polygonOffsetFactor,D.polygonOffsetUnits),D.alphaToCoverage===!0?et(r.SAMPLE_ALPHA_TO_COVERAGE):Dt(r.SAMPLE_ALPHA_TO_COVERAGE)}function jt(D){L!==D&&(D?r.frontFace(r.CW):r.frontFace(r.CCW),L=D)}function ae(D){D!==Cp?(et(r.CULL_FACE),D!==U&&(D===Lh?r.cullFace(r.BACK):D===Rp?r.cullFace(r.FRONT):r.cullFace(r.FRONT_AND_BACK))):Dt(r.CULL_FACE),U=D}function ie(D){D!==W&&(V&&r.lineWidth(D),W=D)}function de(D,dt,J){D?(et(r.POLYGON_OFFSET_FILL),(K!==dt||k!==J)&&(K=dt,k=J,o.getReversed()&&(dt=-dt),r.polygonOffset(dt,J))):Dt(r.POLYGON_OFFSET_FILL)}function ce(D){D?et(r.SCISSOR_TEST):Dt(r.SCISSOR_TEST)}function Ee(D){D===void 0&&(D=r.TEXTURE0+$-1),ft!==D&&(r.activeTexture(D),ft=D)}function N(D,dt,J){J===void 0&&(ft===null?J=r.TEXTURE0+$-1:J=ft);let pt=at[J];pt===void 0&&(pt={type:void 0,texture:void 0},at[J]=pt),(pt.type!==D||pt.texture!==dt)&&(ft!==J&&(r.activeTexture(J),ft=J),r.bindTexture(D,dt||ht[D]),pt.type=D,pt.texture=dt)}function qt(){const D=at[ft];D!==void 0&&D.type!==void 0&&(r.bindTexture(D.type,null),D.type=void 0,D.texture=void 0)}function ne(){try{r.compressedTexImage2D(...arguments)}catch(D){Ot("WebGLState:",D)}}function C(){try{r.compressedTexImage3D(...arguments)}catch(D){Ot("WebGLState:",D)}}function x(){try{r.texSubImage2D(...arguments)}catch(D){Ot("WebGLState:",D)}}function O(){try{r.texSubImage3D(...arguments)}catch(D){Ot("WebGLState:",D)}}function B(){try{r.compressedTexSubImage2D(...arguments)}catch(D){Ot("WebGLState:",D)}}function X(){try{r.compressedTexSubImage3D(...arguments)}catch(D){Ot("WebGLState:",D)}}function st(){try{r.texStorage2D(...arguments)}catch(D){Ot("WebGLState:",D)}}function ut(){try{r.texStorage3D(...arguments)}catch(D){Ot("WebGLState:",D)}}function q(){try{r.texImage2D(...arguments)}catch(D){Ot("WebGLState:",D)}}function j(){try{r.texImage3D(...arguments)}catch(D){Ot("WebGLState:",D)}}function rt(D){return u[D]!==void 0?u[D]:r.getParameter(D)}function Mt(D,dt){u[D]!==dt&&(r.pixelStorei(D,dt),u[D]=dt)}function lt(D){re.equals(D)===!1&&(r.scissor(D.x,D.y,D.z,D.w),re.copy(D))}function ct(D){Zt.equals(D)===!1&&(r.viewport(D.x,D.y,D.z,D.w),Zt.copy(D))}function It(D,dt){let J=c.get(dt);J===void 0&&(J=new WeakMap,c.set(dt,J));let pt=J.get(D);pt===void 0&&(pt=r.getUniformBlockIndex(dt,D.name),J.set(D,pt))}function Ft(D,dt){const pt=c.get(dt).get(D);l.get(dt)!==pt&&(r.uniformBlockBinding(dt,pt,D.__bindingPointIndex),l.set(dt,pt))}function Wt(){r.disable(r.BLEND),r.disable(r.CULL_FACE),r.disable(r.DEPTH_TEST),r.disable(r.POLYGON_OFFSET_FILL),r.disable(r.SCISSOR_TEST),r.disable(r.STENCIL_TEST),r.disable(r.SAMPLE_ALPHA_TO_COVERAGE),r.blendEquation(r.FUNC_ADD),r.blendFunc(r.ONE,r.ZERO),r.blendFuncSeparate(r.ONE,r.ZERO,r.ONE,r.ZERO),r.blendColor(0,0,0,0),r.colorMask(!0,!0,!0,!0),r.clearColor(0,0,0,0),r.depthMask(!0),r.depthFunc(r.LESS),o.setReversed(!1),r.clearDepth(1),r.stencilMask(4294967295),r.stencilFunc(r.ALWAYS,0,4294967295),r.stencilOp(r.KEEP,r.KEEP,r.KEEP),r.clearStencil(0),r.cullFace(r.BACK),r.frontFace(r.CCW),r.polygonOffset(0,0),r.activeTexture(r.TEXTURE0),r.bindFramebuffer(r.FRAMEBUFFER,null),r.bindFramebuffer(r.DRAW_FRAMEBUFFER,null),r.bindFramebuffer(r.READ_FRAMEBUFFER,null),r.useProgram(null),r.lineWidth(1),r.scissor(0,0,r.canvas.width,r.canvas.height),r.viewport(0,0,r.canvas.width,r.canvas.height),r.pixelStorei(r.PACK_ALIGNMENT,4),r.pixelStorei(r.UNPACK_ALIGNMENT,4),r.pixelStorei(r.UNPACK_FLIP_Y_WEBGL,!1),r.pixelStorei(r.UNPACK_PREMULTIPLY_ALPHA_WEBGL,!1),r.pixelStorei(r.UNPACK_COLORSPACE_CONVERSION_WEBGL,r.BROWSER_DEFAULT_WEBGL),r.pixelStorei(r.PACK_ROW_LENGTH,0),r.pixelStorei(r.PACK_SKIP_PIXELS,0),r.pixelStorei(r.PACK_SKIP_ROWS,0),r.pixelStorei(r.UNPACK_ROW_LENGTH,0),r.pixelStorei(r.UNPACK_IMAGE_HEIGHT,0),r.pixelStorei(r.UNPACK_SKIP_PIXELS,0),r.pixelStorei(r.UNPACK_SKIP_ROWS,0),r.pixelStorei(r.UNPACK_SKIP_IMAGES,0),h={},u={},ft=null,at={},d={},f=new WeakMap,m=[],_=null,g=!1,p=null,b=null,E=null,y=null,S=null,w=null,A=null,v=new Et(0,0,0),T=0,I=!1,L=null,U=null,W=null,K=null,k=null,re.set(0,0,r.canvas.width,r.canvas.height),Zt.set(0,0,r.canvas.width,r.canvas.height),s.reset(),o.reset(),a.reset()}return{buffers:{color:s,depth:o,stencil:a},enable:et,disable:Dt,bindFramebuffer:zt,drawBuffers:Lt,useProgram:Ie,setBlending:oe,setMaterial:ee,setFlipSided:jt,setCullFace:ae,setLineWidth:ie,setPolygonOffset:de,setScissorTest:ce,activeTexture:Ee,bindTexture:N,unbindTexture:qt,compressedTexImage2D:ne,compressedTexImage3D:C,texImage2D:q,texImage3D:j,pixelStorei:Mt,getParameter:rt,updateUBOMapping:It,uniformBlockBinding:Ft,texStorage2D:st,texStorage3D:ut,texSubImage2D:x,texSubImage3D:O,compressedTexSubImage2D:B,compressedTexSubImage3D:X,scissor:lt,viewport:ct,reset:Wt}}function Iy(r,t,e,n,i,s,o){const a=t.has("WEBGL_multisampled_render_to_texture")?t.get("WEBGL_multisampled_render_to_texture"):null,l=typeof navigator>"u"?!1:/OculusBrowser/g.test(navigator.userAgent),c=new At,h=new WeakMap,u=new Set;let d;const f=new WeakMap;let m=!1;try{m=typeof OffscreenCanvas<"u"&&new OffscreenCanvas(1,1).getContext("2d")!==null}catch{}function _(C,x){return m?new OffscreenCanvas(C,x):Wr("canvas")}function g(C,x,O){let B=1;const X=ne(C);if((X.width>O||X.height>O)&&(B=O/Math.max(X.width,X.height)),B<1)if(typeof HTMLImageElement<"u"&&C instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&C instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&C instanceof ImageBitmap||typeof VideoFrame<"u"&&C instanceof VideoFrame){const st=Math.floor(B*X.width),ut=Math.floor(B*X.height);d===void 0&&(d=_(st,ut));const q=x?_(st,ut):d;return q.width=st,q.height=ut,q.getContext("2d").drawImage(C,0,0,st,ut),wt("WebGLRenderer: Texture has been resized from ("+X.width+"x"+X.height+") to ("+st+"x"+ut+")."),q}else return"data"in C&&wt("WebGLRenderer: Image in DataTexture is too big ("+X.width+"x"+X.height+")."),C;return C}function p(C){return C.generateMipmaps}function b(C){r.generateMipmap(C)}function E(C){return C.isWebGLCubeRenderTarget?r.TEXTURE_CUBE_MAP:C.isWebGL3DRenderTarget?r.TEXTURE_3D:C.isWebGLArrayRenderTarget||C.isCompressedArrayTexture?r.TEXTURE_2D_ARRAY:r.TEXTURE_2D}function y(C,x,O,B,X,st=!1){if(C!==null){if(r[C]!==void 0)return r[C];wt("WebGLRenderer: Attempt to use non-existing WebGL internal format '"+C+"'")}let ut;B&&(ut=t.get("EXT_texture_norm16"),ut||wt("WebGLRenderer: Unable to use normalized textures without EXT_texture_norm16 extension"));let q=x;if(x===r.RED&&(O===r.FLOAT&&(q=r.R32F),O===r.HALF_FLOAT&&(q=r.R16F),O===r.UNSIGNED_BYTE&&(q=r.R8),O===r.UNSIGNED_SHORT&&ut&&(q=ut.R16_EXT),O===r.SHORT&&ut&&(q=ut.R16_SNORM_EXT)),x===r.RED_INTEGER&&(O===r.UNSIGNED_BYTE&&(q=r.R8UI),O===r.UNSIGNED_SHORT&&(q=r.R16UI),O===r.UNSIGNED_INT&&(q=r.R32UI),O===r.BYTE&&(q=r.R8I),O===r.SHORT&&(q=r.R16I),O===r.INT&&(q=r.R32I)),x===r.RG&&(O===r.FLOAT&&(q=r.RG32F),O===r.HALF_FLOAT&&(q=r.RG16F),O===r.UNSIGNED_BYTE&&(q=r.RG8),O===r.UNSIGNED_SHORT&&ut&&(q=ut.RG16_EXT),O===r.SHORT&&ut&&(q=ut.RG16_SNORM_EXT)),x===r.RG_INTEGER&&(O===r.UNSIGNED_BYTE&&(q=r.RG8UI),O===r.UNSIGNED_SHORT&&(q=r.RG16UI),O===r.UNSIGNED_INT&&(q=r.RG32UI),O===r.BYTE&&(q=r.RG8I),O===r.SHORT&&(q=r.RG16I),O===r.INT&&(q=r.RG32I)),x===r.RGB_INTEGER&&(O===r.UNSIGNED_BYTE&&(q=r.RGB8UI),O===r.UNSIGNED_SHORT&&(q=r.RGB16UI),O===r.UNSIGNED_INT&&(q=r.RGB32UI),O===r.BYTE&&(q=r.RGB8I),O===r.SHORT&&(q=r.RGB16I),O===r.INT&&(q=r.RGB32I)),x===r.RGBA_INTEGER&&(O===r.UNSIGNED_BYTE&&(q=r.RGBA8UI),O===r.UNSIGNED_SHORT&&(q=r.RGBA16UI),O===r.UNSIGNED_INT&&(q=r.RGBA32UI),O===r.BYTE&&(q=r.RGBA8I),O===r.SHORT&&(q=r.RGBA16I),O===r.INT&&(q=r.RGBA32I)),x===r.RGB&&(O===r.UNSIGNED_SHORT&&ut&&(q=ut.RGB16_EXT),O===r.SHORT&&ut&&(q=ut.RGB16_SNORM_EXT),O===r.UNSIGNED_INT_5_9_9_9_REV&&(q=r.RGB9_E5),O===r.UNSIGNED_INT_10F_11F_11F_REV&&(q=r.R11F_G11F_B10F)),x===r.RGBA){const j=st?Jo:Qt.getTransfer(X);O===r.FLOAT&&(q=r.RGBA32F),O===r.HALF_FLOAT&&(q=r.RGBA16F),O===r.UNSIGNED_BYTE&&(q=j===me?r.SRGB8_ALPHA8:r.RGBA8),O===r.UNSIGNED_SHORT&&ut&&(q=ut.RGBA16_EXT),O===r.SHORT&&ut&&(q=ut.RGBA16_SNORM_EXT),O===r.UNSIGNED_SHORT_4_4_4_4&&(q=r.RGBA4),O===r.UNSIGNED_SHORT_5_5_5_1&&(q=r.RGB5_A1)}return(q===r.R16F||q===r.R32F||q===r.RG16F||q===r.RG32F||q===r.RGBA16F||q===r.RGBA32F)&&t.get("EXT_color_buffer_float"),q}function S(C,x){let O;return C?x===null||x===oi||x===zr?O=r.DEPTH24_STENCIL8:x===Nn?O=r.DEPTH32F_STENCIL8:x===Br&&(O=r.DEPTH24_STENCIL8,wt("DepthTexture: 16 bit depth attachment is not supported with stencil. Using 24-bit attachment.")):x===null||x===oi||x===zr?O=r.DEPTH_COMPONENT24:x===Nn?O=r.DEPTH_COMPONENT32F:x===Br&&(O=r.DEPTH_COMPONENT16),O}function w(C,x){return p(C)===!0||C.isFramebufferTexture&&C.minFilter!==$e&&C.minFilter!==We?Math.log2(Math.max(x.width,x.height))+1:C.mipmaps!==void 0&&C.mipmaps.length>0?C.mipmaps.length:C.isCompressedTexture&&Array.isArray(C.image)?x.mipmaps.length:1}function A(C){const x=C.target;x.removeEventListener("dispose",A),T(x),x.isVideoTexture&&h.delete(x),x.isHTMLTexture&&u.delete(x)}function v(C){const x=C.target;x.removeEventListener("dispose",v),L(x)}function T(C){const x=n.get(C);if(x.__webglInit===void 0)return;const O=C.source,B=f.get(O);if(B){const X=B[x.__cacheKey];X.usedTimes--,X.usedTimes===0&&I(C),Object.keys(B).length===0&&f.delete(O)}n.remove(C)}function I(C){const x=n.get(C);r.deleteTexture(x.__webglTexture);const O=C.source,B=f.get(O);delete B[x.__cacheKey],o.memory.textures--}function L(C){const x=n.get(C);if(C.depthTexture&&(C.depthTexture.dispose(),n.remove(C.depthTexture)),C.isWebGLCubeRenderTarget)for(let B=0;B<6;B++){if(Array.isArray(x.__webglFramebuffer[B]))for(let X=0;X<x.__webglFramebuffer[B].length;X++)r.deleteFramebuffer(x.__webglFramebuffer[B][X]);else r.deleteFramebuffer(x.__webglFramebuffer[B]);x.__webglDepthbuffer&&r.deleteRenderbuffer(x.__webglDepthbuffer[B])}else{if(Array.isArray(x.__webglFramebuffer))for(let B=0;B<x.__webglFramebuffer.length;B++)r.deleteFramebuffer(x.__webglFramebuffer[B]);else r.deleteFramebuffer(x.__webglFramebuffer);if(x.__webglDepthbuffer&&r.deleteRenderbuffer(x.__webglDepthbuffer),x.__webglMultisampledFramebuffer&&r.deleteFramebuffer(x.__webglMultisampledFramebuffer),x.__webglColorRenderbuffer)for(let B=0;B<x.__webglColorRenderbuffer.length;B++)x.__webglColorRenderbuffer[B]&&r.deleteRenderbuffer(x.__webglColorRenderbuffer[B]);x.__webglDepthRenderbuffer&&r.deleteRenderbuffer(x.__webglDepthRenderbuffer)}const O=C.textures;for(let B=0,X=O.length;B<X;B++){const st=n.get(O[B]);st.__webglTexture&&(r.deleteTexture(st.__webglTexture),o.memory.textures--),n.remove(O[B])}n.remove(C)}let U=0;function W(){U=0}function K(){return U}function k(C){U=C}function $(){const C=U;return C>=i.maxTextures&&wt("WebGLTextures: Trying to use "+C+" texture units while this GPU supports only "+i.maxTextures),U+=1,C}function V(C){const x=[];return x.push(C.wrapS),x.push(C.wrapT),x.push(C.wrapR||0),x.push(C.magFilter),x.push(C.minFilter),x.push(C.anisotropy),x.push(C.internalFormat),x.push(C.format),x.push(C.type),x.push(C.generateMipmaps),x.push(C.premultiplyAlpha),x.push(C.flipY),x.push(C.unpackAlignment),x.push(C.colorSpace),x.join()}function Q(C,x){const O=n.get(C);if(C.isVideoTexture&&N(C),C.isRenderTargetTexture===!1&&C.isExternalTexture!==!0&&C.version>0&&O.__version!==C.version){const B=C.image;if(B===null)wt("WebGLRenderer: Texture marked for update but no image data found.");else if(B.complete===!1)wt("WebGLRenderer: Texture marked for update but image is incomplete");else{Dt(O,C,x);return}}else C.isExternalTexture&&(O.__webglTexture=C.sourceTexture?C.sourceTexture:null);e.bindTexture(r.TEXTURE_2D,O.__webglTexture,r.TEXTURE0+x)}function it(C,x){const O=n.get(C);if(C.isRenderTargetTexture===!1&&C.version>0&&O.__version!==C.version){Dt(O,C,x);return}else C.isExternalTexture&&(O.__webglTexture=C.sourceTexture?C.sourceTexture:null);e.bindTexture(r.TEXTURE_2D_ARRAY,O.__webglTexture,r.TEXTURE0+x)}function ft(C,x){const O=n.get(C);if(C.isRenderTargetTexture===!1&&C.version>0&&O.__version!==C.version){Dt(O,C,x);return}e.bindTexture(r.TEXTURE_3D,O.__webglTexture,r.TEXTURE0+x)}function at(C,x){const O=n.get(C);if(C.isCubeDepthTexture!==!0&&C.version>0&&O.__version!==C.version){zt(O,C,x);return}e.bindTexture(r.TEXTURE_CUBE_MAP,O.__webglTexture,r.TEXTURE0+x)}const Y={[rs]:r.REPEAT,[Dn]:r.CLAMP_TO_EDGE,[kr]:r.MIRRORED_REPEAT},Bt={[$e]:r.NEAREST,[rf]:r.NEAREST_MIPMAP_NEAREST,[Pr]:r.NEAREST_MIPMAP_LINEAR,[We]:r.LINEAR,[Ho]:r.LINEAR_MIPMAP_NEAREST,[ei]:r.LINEAR_MIPMAP_LINEAR},re={[nm]:r.NEVER,[am]:r.ALWAYS,[im]:r.LESS,[Bc]:r.LEQUAL,[sm]:r.EQUAL,[zc]:r.GEQUAL,[rm]:r.GREATER,[om]:r.NOTEQUAL};function Zt(C,x){if(x.type===Nn&&t.has("OES_texture_float_linear")===!1&&(x.magFilter===We||x.magFilter===Ho||x.magFilter===Pr||x.magFilter===ei||x.minFilter===We||x.minFilter===Ho||x.minFilter===Pr||x.minFilter===ei)&&wt("WebGLRenderer: Unable to use linear filtering with floating point textures. OES_texture_float_linear not supported on this device."),r.texParameteri(C,r.TEXTURE_WRAP_S,Y[x.wrapS]),r.texParameteri(C,r.TEXTURE_WRAP_T,Y[x.wrapT]),(C===r.TEXTURE_3D||C===r.TEXTURE_2D_ARRAY)&&r.texParameteri(C,r.TEXTURE_WRAP_R,Y[x.wrapR]),r.texParameteri(C,r.TEXTURE_MAG_FILTER,Bt[x.magFilter]),r.texParameteri(C,r.TEXTURE_MIN_FILTER,Bt[x.minFilter]),x.compareFunction&&(r.texParameteri(C,r.TEXTURE_COMPARE_MODE,r.COMPARE_REF_TO_TEXTURE),r.texParameteri(C,r.TEXTURE_COMPARE_FUNC,re[x.compareFunction])),t.has("EXT_texture_filter_anisotropic")===!0){if(x.magFilter===$e||x.minFilter!==Pr&&x.minFilter!==ei||x.type===Nn&&t.has("OES_texture_float_linear")===!1)return;if(x.anisotropy>1||n.get(x).__currentAnisotropy){const O=t.get("EXT_texture_filter_anisotropic");r.texParameterf(C,O.TEXTURE_MAX_ANISOTROPY_EXT,Math.min(x.anisotropy,i.getMaxAnisotropy())),n.get(x).__currentAnisotropy=x.anisotropy}}}function Z(C,x){let O=!1;C.__webglInit===void 0&&(C.__webglInit=!0,x.addEventListener("dispose",A));const B=x.source;let X=f.get(B);X===void 0&&(X={},f.set(B,X));const st=V(x);if(st!==C.__cacheKey){X[st]===void 0&&(X[st]={texture:r.createTexture(),usedTimes:0},o.memory.textures++,O=!0),X[st].usedTimes++;const ut=X[C.__cacheKey];ut!==void 0&&(X[C.__cacheKey].usedTimes--,ut.usedTimes===0&&I(x)),C.__cacheKey=st,C.__webglTexture=X[st].texture}return O}function ht(C,x,O){return Math.floor(Math.floor(C/O)/x)}function et(C,x,O,B){const st=C.updateRanges;if(st.length===0)e.texSubImage2D(r.TEXTURE_2D,0,0,0,x.width,x.height,O,B,x.data);else{st.sort((Mt,lt)=>Mt.start-lt.start);let ut=0;for(let Mt=1;Mt<st.length;Mt++){const lt=st[ut],ct=st[Mt],It=lt.start+lt.count,Ft=ht(ct.start,x.width,4),Wt=ht(lt.start,x.width,4);ct.start<=It+1&&Ft===Wt&&ht(ct.start+ct.count-1,x.width,4)===Ft?lt.count=Math.max(lt.count,ct.start+ct.count-lt.start):(++ut,st[ut]=ct)}st.length=ut+1;const q=e.getParameter(r.UNPACK_ROW_LENGTH),j=e.getParameter(r.UNPACK_SKIP_PIXELS),rt=e.getParameter(r.UNPACK_SKIP_ROWS);e.pixelStorei(r.UNPACK_ROW_LENGTH,x.width);for(let Mt=0,lt=st.length;Mt<lt;Mt++){const ct=st[Mt],It=Math.floor(ct.start/4),Ft=Math.ceil(ct.count/4),Wt=It%x.width,D=Math.floor(It/x.width),dt=Ft,J=1;e.pixelStorei(r.UNPACK_SKIP_PIXELS,Wt),e.pixelStorei(r.UNPACK_SKIP_ROWS,D),e.texSubImage2D(r.TEXTURE_2D,0,Wt,D,dt,J,O,B,x.data)}C.clearUpdateRanges(),e.pixelStorei(r.UNPACK_ROW_LENGTH,q),e.pixelStorei(r.UNPACK_SKIP_PIXELS,j),e.pixelStorei(r.UNPACK_SKIP_ROWS,rt)}}function Dt(C,x,O){let B=r.TEXTURE_2D;(x.isDataArrayTexture||x.isCompressedArrayTexture)&&(B=r.TEXTURE_2D_ARRAY),x.isData3DTexture&&(B=r.TEXTURE_3D);const X=Z(C,x),st=x.source;e.bindTexture(B,C.__webglTexture,r.TEXTURE0+O);const ut=n.get(st);if(st.version!==ut.__version||X===!0){if(e.activeTexture(r.TEXTURE0+O),(typeof ImageBitmap<"u"&&x.image instanceof ImageBitmap)===!1){const J=Qt.getPrimaries(Qt.workingColorSpace),pt=x.colorSpace===ki?null:Qt.getPrimaries(x.colorSpace),xt=x.colorSpace===ki||J===pt?r.NONE:r.BROWSER_DEFAULT_WEBGL;e.pixelStorei(r.UNPACK_FLIP_Y_WEBGL,x.flipY),e.pixelStorei(r.UNPACK_PREMULTIPLY_ALPHA_WEBGL,x.premultiplyAlpha),e.pixelStorei(r.UNPACK_COLORSPACE_CONVERSION_WEBGL,xt)}e.pixelStorei(r.UNPACK_ALIGNMENT,x.unpackAlignment);let j=g(x.image,!1,i.maxTextureSize);j=qt(x,j);const rt=s.convert(x.format,x.colorSpace),Mt=s.convert(x.type);let lt=y(x.internalFormat,rt,Mt,x.normalized,x.colorSpace,x.isVideoTexture);Zt(B,x);let ct;const It=x.mipmaps,Ft=x.isVideoTexture!==!0,Wt=ut.__version===void 0||X===!0,D=st.dataReady,dt=w(x,j);if(x.isDepthTexture)lt=S(x.format===ns,x.type),Wt&&(Ft?e.texStorage2D(r.TEXTURE_2D,1,lt,j.width,j.height):e.texImage2D(r.TEXTURE_2D,0,lt,j.width,j.height,0,rt,Mt,null));else if(x.isDataTexture)if(It.length>0){Ft&&Wt&&e.texStorage2D(r.TEXTURE_2D,dt,lt,It[0].width,It[0].height);for(let J=0,pt=It.length;J<pt;J++)ct=It[J],Ft?D&&e.texSubImage2D(r.TEXTURE_2D,J,0,0,ct.width,ct.height,rt,Mt,ct.data):e.texImage2D(r.TEXTURE_2D,J,lt,ct.width,ct.height,0,rt,Mt,ct.data);x.generateMipmaps=!1}else Ft?(Wt&&e.texStorage2D(r.TEXTURE_2D,dt,lt,j.width,j.height),D&&et(x,j,rt,Mt)):e.texImage2D(r.TEXTURE_2D,0,lt,j.width,j.height,0,rt,Mt,j.data);else if(x.isCompressedTexture)if(x.isCompressedArrayTexture){Ft&&Wt&&e.texStorage3D(r.TEXTURE_2D_ARRAY,dt,lt,It[0].width,It[0].height,j.depth);for(let J=0,pt=It.length;J<pt;J++)if(ct=It[J],x.format!==Un)if(rt!==null)if(Ft){if(D)if(x.layerUpdates.size>0){const xt=Cu(ct.width,ct.height,x.format,x.type);for(const tt of x.layerUpdates){const Tt=ct.data.subarray(tt*xt/ct.data.BYTES_PER_ELEMENT,(tt+1)*xt/ct.data.BYTES_PER_ELEMENT);e.compressedTexSubImage3D(r.TEXTURE_2D_ARRAY,J,0,0,tt,ct.width,ct.height,1,rt,Tt)}x.clearLayerUpdates()}else e.compressedTexSubImage3D(r.TEXTURE_2D_ARRAY,J,0,0,0,ct.width,ct.height,j.depth,rt,ct.data)}else e.compressedTexImage3D(r.TEXTURE_2D_ARRAY,J,lt,ct.width,ct.height,j.depth,0,ct.data,0,0);else wt("WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()");else Ft?D&&e.texSubImage3D(r.TEXTURE_2D_ARRAY,J,0,0,0,ct.width,ct.height,j.depth,rt,Mt,ct.data):e.texImage3D(r.TEXTURE_2D_ARRAY,J,lt,ct.width,ct.height,j.depth,0,rt,Mt,ct.data)}else{Ft&&Wt&&e.texStorage2D(r.TEXTURE_2D,dt,lt,It[0].width,It[0].height);for(let J=0,pt=It.length;J<pt;J++)ct=It[J],x.format!==Un?rt!==null?Ft?D&&e.compressedTexSubImage2D(r.TEXTURE_2D,J,0,0,ct.width,ct.height,rt,ct.data):e.compressedTexImage2D(r.TEXTURE_2D,J,lt,ct.width,ct.height,0,ct.data):wt("WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()"):Ft?D&&e.texSubImage2D(r.TEXTURE_2D,J,0,0,ct.width,ct.height,rt,Mt,ct.data):e.texImage2D(r.TEXTURE_2D,J,lt,ct.width,ct.height,0,rt,Mt,ct.data)}else if(x.isDataArrayTexture)if(Ft){if(Wt&&e.texStorage3D(r.TEXTURE_2D_ARRAY,dt,lt,j.width,j.height,j.depth),D)if(x.layerUpdates.size>0){const J=Cu(j.width,j.height,x.format,x.type);for(const pt of x.layerUpdates){const xt=j.data.subarray(pt*J/j.data.BYTES_PER_ELEMENT,(pt+1)*J/j.data.BYTES_PER_ELEMENT);e.texSubImage3D(r.TEXTURE_2D_ARRAY,0,0,0,pt,j.width,j.height,1,rt,Mt,xt)}x.clearLayerUpdates()}else e.texSubImage3D(r.TEXTURE_2D_ARRAY,0,0,0,0,j.width,j.height,j.depth,rt,Mt,j.data)}else e.texImage3D(r.TEXTURE_2D_ARRAY,0,lt,j.width,j.height,j.depth,0,rt,Mt,j.data);else if(x.isData3DTexture)Ft?(Wt&&e.texStorage3D(r.TEXTURE_3D,dt,lt,j.width,j.height,j.depth),D&&e.texSubImage3D(r.TEXTURE_3D,0,0,0,0,j.width,j.height,j.depth,rt,Mt,j.data)):e.texImage3D(r.TEXTURE_3D,0,lt,j.width,j.height,j.depth,0,rt,Mt,j.data);else if(x.isFramebufferTexture){if(Wt)if(Ft)e.texStorage2D(r.TEXTURE_2D,dt,lt,j.width,j.height);else{let J=j.width,pt=j.height;for(let xt=0;xt<dt;xt++)e.texImage2D(r.TEXTURE_2D,xt,lt,J,pt,0,rt,Mt,null),J>>=1,pt>>=1}}else if(x.isHTMLTexture){if("texElementImage2D"in r){const J=r.canvas;if(J.hasAttribute("layoutsubtree")||J.setAttribute("layoutsubtree","true"),j.parentNode!==J){J.appendChild(j),u.add(x),J.onpaint=pt=>{const xt=pt.changedElements;for(const tt of u)xt.includes(tt.image)&&(tt.needsUpdate=!0)},J.requestPaint();return}if(r.texElementImage2D.length===3)r.texElementImage2D(r.TEXTURE_2D,r.RGBA8,j);else{const xt=r.RGBA,tt=r.RGBA,Tt=r.UNSIGNED_BYTE;r.texElementImage2D(r.TEXTURE_2D,0,xt,tt,Tt,j)}r.texParameteri(r.TEXTURE_2D,r.TEXTURE_MIN_FILTER,r.LINEAR),r.texParameteri(r.TEXTURE_2D,r.TEXTURE_WRAP_S,r.CLAMP_TO_EDGE),r.texParameteri(r.TEXTURE_2D,r.TEXTURE_WRAP_T,r.CLAMP_TO_EDGE)}}else if(It.length>0){if(Ft&&Wt){const J=ne(It[0]);e.texStorage2D(r.TEXTURE_2D,dt,lt,J.width,J.height)}for(let J=0,pt=It.length;J<pt;J++)ct=It[J],Ft?D&&e.texSubImage2D(r.TEXTURE_2D,J,0,0,rt,Mt,ct):e.texImage2D(r.TEXTURE_2D,J,lt,rt,Mt,ct);x.generateMipmaps=!1}else if(Ft){if(Wt){const J=ne(j);e.texStorage2D(r.TEXTURE_2D,dt,lt,J.width,J.height)}D&&e.texSubImage2D(r.TEXTURE_2D,0,0,0,rt,Mt,j)}else e.texImage2D(r.TEXTURE_2D,0,lt,rt,Mt,j);p(x)&&b(B),ut.__version=st.version,x.onUpdate&&x.onUpdate(x)}C.__version=x.version}function zt(C,x,O){if(x.image.length!==6)return;const B=Z(C,x),X=x.source;e.bindTexture(r.TEXTURE_CUBE_MAP,C.__webglTexture,r.TEXTURE0+O);const st=n.get(X);if(X.version!==st.__version||B===!0){e.activeTexture(r.TEXTURE0+O);const ut=Qt.getPrimaries(Qt.workingColorSpace),q=x.colorSpace===ki?null:Qt.getPrimaries(x.colorSpace),j=x.colorSpace===ki||ut===q?r.NONE:r.BROWSER_DEFAULT_WEBGL;e.pixelStorei(r.UNPACK_FLIP_Y_WEBGL,x.flipY),e.pixelStorei(r.UNPACK_PREMULTIPLY_ALPHA_WEBGL,x.premultiplyAlpha),e.pixelStorei(r.UNPACK_ALIGNMENT,x.unpackAlignment),e.pixelStorei(r.UNPACK_COLORSPACE_CONVERSION_WEBGL,j);const rt=x.isCompressedTexture||x.image[0].isCompressedTexture,Mt=x.image[0]&&x.image[0].isDataTexture,lt=[];for(let tt=0;tt<6;tt++)!rt&&!Mt?lt[tt]=g(x.image[tt],!0,i.maxCubemapSize):lt[tt]=Mt?x.image[tt].image:x.image[tt],lt[tt]=qt(x,lt[tt]);const ct=lt[0],It=s.convert(x.format,x.colorSpace),Ft=s.convert(x.type),Wt=y(x.internalFormat,It,Ft,x.normalized,x.colorSpace),D=x.isVideoTexture!==!0,dt=st.__version===void 0||B===!0,J=X.dataReady;let pt=w(x,ct);Zt(r.TEXTURE_CUBE_MAP,x);let xt;if(rt){D&&dt&&e.texStorage2D(r.TEXTURE_CUBE_MAP,pt,Wt,ct.width,ct.height);for(let tt=0;tt<6;tt++){xt=lt[tt].mipmaps;for(let Tt=0;Tt<xt.length;Tt++){const bt=xt[Tt];x.format!==Un?It!==null?D?J&&e.compressedTexSubImage2D(r.TEXTURE_CUBE_MAP_POSITIVE_X+tt,Tt,0,0,bt.width,bt.height,It,bt.data):e.compressedTexImage2D(r.TEXTURE_CUBE_MAP_POSITIVE_X+tt,Tt,Wt,bt.width,bt.height,0,bt.data):wt("WebGLRenderer: Attempt to load unsupported compressed texture format in .setTextureCube()"):D?J&&e.texSubImage2D(r.TEXTURE_CUBE_MAP_POSITIVE_X+tt,Tt,0,0,bt.width,bt.height,It,Ft,bt.data):e.texImage2D(r.TEXTURE_CUBE_MAP_POSITIVE_X+tt,Tt,Wt,bt.width,bt.height,0,It,Ft,bt.data)}}}else{if(xt=x.mipmaps,D&&dt){xt.length>0&&pt++;const tt=ne(lt[0]);e.texStorage2D(r.TEXTURE_CUBE_MAP,pt,Wt,tt.width,tt.height)}for(let tt=0;tt<6;tt++)if(Mt){D?J&&e.texSubImage2D(r.TEXTURE_CUBE_MAP_POSITIVE_X+tt,0,0,0,lt[tt].width,lt[tt].height,It,Ft,lt[tt].data):e.texImage2D(r.TEXTURE_CUBE_MAP_POSITIVE_X+tt,0,Wt,lt[tt].width,lt[tt].height,0,It,Ft,lt[tt].data);for(let Tt=0;Tt<xt.length;Tt++){const Ne=xt[Tt].image[tt].image;D?J&&e.texSubImage2D(r.TEXTURE_CUBE_MAP_POSITIVE_X+tt,Tt+1,0,0,Ne.width,Ne.height,It,Ft,Ne.data):e.texImage2D(r.TEXTURE_CUBE_MAP_POSITIVE_X+tt,Tt+1,Wt,Ne.width,Ne.height,0,It,Ft,Ne.data)}}else{D?J&&e.texSubImage2D(r.TEXTURE_CUBE_MAP_POSITIVE_X+tt,0,0,0,It,Ft,lt[tt]):e.texImage2D(r.TEXTURE_CUBE_MAP_POSITIVE_X+tt,0,Wt,It,Ft,lt[tt]);for(let Tt=0;Tt<xt.length;Tt++){const bt=xt[Tt];D?J&&e.texSubImage2D(r.TEXTURE_CUBE_MAP_POSITIVE_X+tt,Tt+1,0,0,It,Ft,bt.image[tt]):e.texImage2D(r.TEXTURE_CUBE_MAP_POSITIVE_X+tt,Tt+1,Wt,It,Ft,bt.image[tt])}}}p(x)&&b(r.TEXTURE_CUBE_MAP),st.__version=X.version,x.onUpdate&&x.onUpdate(x)}C.__version=x.version}function Lt(C,x,O,B,X,st){const ut=s.convert(O.format,O.colorSpace),q=s.convert(O.type),j=y(O.internalFormat,ut,q,O.normalized,O.colorSpace),rt=n.get(x),Mt=n.get(O);if(Mt.__renderTarget=x,!rt.__hasExternalTextures){const lt=Math.max(1,x.width>>st),ct=Math.max(1,x.height>>st);X===r.TEXTURE_3D||X===r.TEXTURE_2D_ARRAY?e.texImage3D(X,st,j,lt,ct,x.depth,0,ut,q,null):e.texImage2D(X,st,j,lt,ct,0,ut,q,null)}e.bindFramebuffer(r.FRAMEBUFFER,C),Ee(x)?a.framebufferTexture2DMultisampleEXT(r.FRAMEBUFFER,B,X,Mt.__webglTexture,0,ce(x)):(X===r.TEXTURE_2D||X>=r.TEXTURE_CUBE_MAP_POSITIVE_X&&X<=r.TEXTURE_CUBE_MAP_NEGATIVE_Z)&&r.framebufferTexture2D(r.FRAMEBUFFER,B,X,Mt.__webglTexture,st),e.bindFramebuffer(r.FRAMEBUFFER,null)}function Ie(C,x,O){if(r.bindRenderbuffer(r.RENDERBUFFER,C),x.depthBuffer){const B=x.depthTexture,X=B&&B.isDepthTexture?B.type:null,st=S(x.stencilBuffer,X),ut=x.stencilBuffer?r.DEPTH_STENCIL_ATTACHMENT:r.DEPTH_ATTACHMENT;Ee(x)?a.renderbufferStorageMultisampleEXT(r.RENDERBUFFER,ce(x),st,x.width,x.height):O?r.renderbufferStorageMultisample(r.RENDERBUFFER,ce(x),st,x.width,x.height):r.renderbufferStorage(r.RENDERBUFFER,st,x.width,x.height),r.framebufferRenderbuffer(r.FRAMEBUFFER,ut,r.RENDERBUFFER,C)}else{const B=x.textures;for(let X=0;X<B.length;X++){const st=B[X],ut=s.convert(st.format,st.colorSpace),q=s.convert(st.type),j=y(st.internalFormat,ut,q,st.normalized,st.colorSpace);Ee(x)?a.renderbufferStorageMultisampleEXT(r.RENDERBUFFER,ce(x),j,x.width,x.height):O?r.renderbufferStorageMultisample(r.RENDERBUFFER,ce(x),j,x.width,x.height):r.renderbufferStorage(r.RENDERBUFFER,j,x.width,x.height)}}r.bindRenderbuffer(r.RENDERBUFFER,null)}function Gt(C,x,O){const B=x.isWebGLCubeRenderTarget===!0;if(e.bindFramebuffer(r.FRAMEBUFFER,C),!(x.depthTexture&&x.depthTexture.isDepthTexture))throw new Error("THREE.WebGLTextures: renderTarget.depthTexture must be an instance of THREE.DepthTexture.");const X=n.get(x.depthTexture);if(X.__renderTarget=x,(!X.__webglTexture||x.depthTexture.image.width!==x.width||x.depthTexture.image.height!==x.height)&&(x.depthTexture.image.width=x.width,x.depthTexture.image.height=x.height,x.depthTexture.needsUpdate=!0),B){if(X.__webglInit===void 0&&(X.__webglInit=!0,x.depthTexture.addEventListener("dispose",A)),X.__webglTexture===void 0){X.__webglTexture=r.createTexture(),e.bindTexture(r.TEXTURE_CUBE_MAP,X.__webglTexture),Zt(r.TEXTURE_CUBE_MAP,x.depthTexture);const rt=s.convert(x.depthTexture.format),Mt=s.convert(x.depthTexture.type);let lt;x.depthTexture.format===wi?lt=r.DEPTH_COMPONENT24:x.depthTexture.format===ns&&(lt=r.DEPTH24_STENCIL8);for(let ct=0;ct<6;ct++)r.texImage2D(r.TEXTURE_CUBE_MAP_POSITIVE_X+ct,0,lt,x.width,x.height,0,rt,Mt,null)}}else Q(x.depthTexture,0);const st=X.__webglTexture,ut=ce(x),q=B?r.TEXTURE_CUBE_MAP_POSITIVE_X+O:r.TEXTURE_2D,j=x.depthTexture.format===ns?r.DEPTH_STENCIL_ATTACHMENT:r.DEPTH_ATTACHMENT;if(x.depthTexture.format===wi)Ee(x)?a.framebufferTexture2DMultisampleEXT(r.FRAMEBUFFER,j,q,st,0,ut):r.framebufferTexture2D(r.FRAMEBUFFER,j,q,st,0);else if(x.depthTexture.format===ns)Ee(x)?a.framebufferTexture2DMultisampleEXT(r.FRAMEBUFFER,j,q,st,0,ut):r.framebufferTexture2D(r.FRAMEBUFFER,j,q,st,0);else throw new Error("THREE.WebGLTextures: Unknown depthTexture format.")}function ue(C){const x=n.get(C),O=C.isWebGLCubeRenderTarget===!0;if(x.__boundDepthTexture!==C.depthTexture){const B=C.depthTexture;if(x.__depthDisposeCallback&&x.__depthDisposeCallback(),B){const X=()=>{delete x.__boundDepthTexture,delete x.__depthDisposeCallback,B.removeEventListener("dispose",X)};B.addEventListener("dispose",X),x.__depthDisposeCallback=X}x.__boundDepthTexture=B}if(C.depthTexture&&!x.__autoAllocateDepthBuffer)if(O)for(let B=0;B<6;B++)Gt(x.__webglFramebuffer[B],C,B);else{const B=C.texture.mipmaps;B&&B.length>0?Gt(x.__webglFramebuffer[0],C,0):Gt(x.__webglFramebuffer,C,0)}else if(O){x.__webglDepthbuffer=[];for(let B=0;B<6;B++)if(e.bindFramebuffer(r.FRAMEBUFFER,x.__webglFramebuffer[B]),x.__webglDepthbuffer[B]===void 0)x.__webglDepthbuffer[B]=r.createRenderbuffer(),Ie(x.__webglDepthbuffer[B],C,!1);else{const X=C.stencilBuffer?r.DEPTH_STENCIL_ATTACHMENT:r.DEPTH_ATTACHMENT,st=x.__webglDepthbuffer[B];r.bindRenderbuffer(r.RENDERBUFFER,st),r.framebufferRenderbuffer(r.FRAMEBUFFER,X,r.RENDERBUFFER,st)}}else{const B=C.texture.mipmaps;if(B&&B.length>0?e.bindFramebuffer(r.FRAMEBUFFER,x.__webglFramebuffer[0]):e.bindFramebuffer(r.FRAMEBUFFER,x.__webglFramebuffer),x.__webglDepthbuffer===void 0)x.__webglDepthbuffer=r.createRenderbuffer(),Ie(x.__webglDepthbuffer,C,!1);else{const X=C.stencilBuffer?r.DEPTH_STENCIL_ATTACHMENT:r.DEPTH_ATTACHMENT,st=x.__webglDepthbuffer;r.bindRenderbuffer(r.RENDERBUFFER,st),r.framebufferRenderbuffer(r.FRAMEBUFFER,X,r.RENDERBUFFER,st)}}e.bindFramebuffer(r.FRAMEBUFFER,null)}function oe(C,x,O){const B=n.get(C);x!==void 0&&Lt(B.__webglFramebuffer,C,C.texture,r.COLOR_ATTACHMENT0,r.TEXTURE_2D,0),O!==void 0&&ue(C)}function ee(C){const x=C.texture,O=n.get(C),B=n.get(x);C.addEventListener("dispose",v);const X=C.textures,st=C.isWebGLCubeRenderTarget===!0,ut=X.length>1;if(ut||(B.__webglTexture===void 0&&(B.__webglTexture=r.createTexture()),B.__version=x.version,o.memory.textures++),st){O.__webglFramebuffer=[];for(let q=0;q<6;q++)if(x.mipmaps&&x.mipmaps.length>0){O.__webglFramebuffer[q]=[];for(let j=0;j<x.mipmaps.length;j++)O.__webglFramebuffer[q][j]=r.createFramebuffer()}else O.__webglFramebuffer[q]=r.createFramebuffer()}else{if(x.mipmaps&&x.mipmaps.length>0){O.__webglFramebuffer=[];for(let q=0;q<x.mipmaps.length;q++)O.__webglFramebuffer[q]=r.createFramebuffer()}else O.__webglFramebuffer=r.createFramebuffer();if(ut)for(let q=0,j=X.length;q<j;q++){const rt=n.get(X[q]);rt.__webglTexture===void 0&&(rt.__webglTexture=r.createTexture(),o.memory.textures++)}if(C.samples>0&&Ee(C)===!1){O.__webglMultisampledFramebuffer=r.createFramebuffer(),O.__webglColorRenderbuffer=[],e.bindFramebuffer(r.FRAMEBUFFER,O.__webglMultisampledFramebuffer);for(let q=0;q<X.length;q++){const j=X[q];O.__webglColorRenderbuffer[q]=r.createRenderbuffer(),r.bindRenderbuffer(r.RENDERBUFFER,O.__webglColorRenderbuffer[q]);const rt=s.convert(j.format,j.colorSpace),Mt=s.convert(j.type),lt=y(j.internalFormat,rt,Mt,j.normalized,j.colorSpace,C.isXRRenderTarget===!0),ct=ce(C);r.renderbufferStorageMultisample(r.RENDERBUFFER,ct,lt,C.width,C.height),r.framebufferRenderbuffer(r.FRAMEBUFFER,r.COLOR_ATTACHMENT0+q,r.RENDERBUFFER,O.__webglColorRenderbuffer[q])}r.bindRenderbuffer(r.RENDERBUFFER,null),C.depthBuffer&&(O.__webglDepthRenderbuffer=r.createRenderbuffer(),Ie(O.__webglDepthRenderbuffer,C,!0)),e.bindFramebuffer(r.FRAMEBUFFER,null)}}if(st){e.bindTexture(r.TEXTURE_CUBE_MAP,B.__webglTexture),Zt(r.TEXTURE_CUBE_MAP,x);for(let q=0;q<6;q++)if(x.mipmaps&&x.mipmaps.length>0)for(let j=0;j<x.mipmaps.length;j++)Lt(O.__webglFramebuffer[q][j],C,x,r.COLOR_ATTACHMENT0,r.TEXTURE_CUBE_MAP_POSITIVE_X+q,j);else Lt(O.__webglFramebuffer[q],C,x,r.COLOR_ATTACHMENT0,r.TEXTURE_CUBE_MAP_POSITIVE_X+q,0);p(x)&&b(r.TEXTURE_CUBE_MAP),e.unbindTexture()}else if(ut){for(let q=0,j=X.length;q<j;q++){const rt=X[q],Mt=n.get(rt);let lt=r.TEXTURE_2D;(C.isWebGL3DRenderTarget||C.isWebGLArrayRenderTarget)&&(lt=C.isWebGL3DRenderTarget?r.TEXTURE_3D:r.TEXTURE_2D_ARRAY),e.bindTexture(lt,Mt.__webglTexture),Zt(lt,rt),Lt(O.__webglFramebuffer,C,rt,r.COLOR_ATTACHMENT0+q,lt,0),p(rt)&&b(lt)}e.unbindTexture()}else{let q=r.TEXTURE_2D;if((C.isWebGL3DRenderTarget||C.isWebGLArrayRenderTarget)&&(q=C.isWebGL3DRenderTarget?r.TEXTURE_3D:r.TEXTURE_2D_ARRAY),e.bindTexture(q,B.__webglTexture),Zt(q,x),x.mipmaps&&x.mipmaps.length>0)for(let j=0;j<x.mipmaps.length;j++)Lt(O.__webglFramebuffer[j],C,x,r.COLOR_ATTACHMENT0,q,j);else Lt(O.__webglFramebuffer,C,x,r.COLOR_ATTACHMENT0,q,0);p(x)&&b(q),e.unbindTexture()}C.depthBuffer&&ue(C)}function jt(C){const x=C.textures;for(let O=0,B=x.length;O<B;O++){const X=x[O];if(p(X)){const st=E(C),ut=n.get(X).__webglTexture;e.bindTexture(st,ut),b(st),e.unbindTexture()}}}const ae=[],ie=[];function de(C){if(C.samples>0){if(Ee(C)===!1){const x=C.textures,O=C.width,B=C.height;let X=r.COLOR_BUFFER_BIT;const st=C.stencilBuffer?r.DEPTH_STENCIL_ATTACHMENT:r.DEPTH_ATTACHMENT,ut=n.get(C),q=x.length>1;if(q)for(let rt=0;rt<x.length;rt++)e.bindFramebuffer(r.FRAMEBUFFER,ut.__webglMultisampledFramebuffer),r.framebufferRenderbuffer(r.FRAMEBUFFER,r.COLOR_ATTACHMENT0+rt,r.RENDERBUFFER,null),e.bindFramebuffer(r.FRAMEBUFFER,ut.__webglFramebuffer),r.framebufferTexture2D(r.DRAW_FRAMEBUFFER,r.COLOR_ATTACHMENT0+rt,r.TEXTURE_2D,null,0);e.bindFramebuffer(r.READ_FRAMEBUFFER,ut.__webglMultisampledFramebuffer);const j=C.texture.mipmaps;j&&j.length>0?e.bindFramebuffer(r.DRAW_FRAMEBUFFER,ut.__webglFramebuffer[0]):e.bindFramebuffer(r.DRAW_FRAMEBUFFER,ut.__webglFramebuffer);for(let rt=0;rt<x.length;rt++){if(C.resolveDepthBuffer&&(C.depthBuffer&&(X|=r.DEPTH_BUFFER_BIT),C.stencilBuffer&&C.resolveStencilBuffer&&(X|=r.STENCIL_BUFFER_BIT)),q){r.framebufferRenderbuffer(r.READ_FRAMEBUFFER,r.COLOR_ATTACHMENT0,r.RENDERBUFFER,ut.__webglColorRenderbuffer[rt]);const Mt=n.get(x[rt]).__webglTexture;r.framebufferTexture2D(r.DRAW_FRAMEBUFFER,r.COLOR_ATTACHMENT0,r.TEXTURE_2D,Mt,0)}r.blitFramebuffer(0,0,O,B,0,0,O,B,X,r.NEAREST),l===!0&&(ae.length=0,ie.length=0,ae.push(r.COLOR_ATTACHMENT0+rt),C.depthBuffer&&C.resolveDepthBuffer===!1&&(ae.push(st),ie.push(st),r.invalidateFramebuffer(r.DRAW_FRAMEBUFFER,ie)),r.invalidateFramebuffer(r.READ_FRAMEBUFFER,ae))}if(e.bindFramebuffer(r.READ_FRAMEBUFFER,null),e.bindFramebuffer(r.DRAW_FRAMEBUFFER,null),q)for(let rt=0;rt<x.length;rt++){e.bindFramebuffer(r.FRAMEBUFFER,ut.__webglMultisampledFramebuffer),r.framebufferRenderbuffer(r.FRAMEBUFFER,r.COLOR_ATTACHMENT0+rt,r.RENDERBUFFER,ut.__webglColorRenderbuffer[rt]);const Mt=n.get(x[rt]).__webglTexture;e.bindFramebuffer(r.FRAMEBUFFER,ut.__webglFramebuffer),r.framebufferTexture2D(r.DRAW_FRAMEBUFFER,r.COLOR_ATTACHMENT0+rt,r.TEXTURE_2D,Mt,0)}e.bindFramebuffer(r.DRAW_FRAMEBUFFER,ut.__webglMultisampledFramebuffer)}else if(C.depthBuffer&&C.resolveDepthBuffer===!1&&l){const x=C.stencilBuffer?r.DEPTH_STENCIL_ATTACHMENT:r.DEPTH_ATTACHMENT;r.invalidateFramebuffer(r.DRAW_FRAMEBUFFER,[x])}}}function ce(C){return Math.min(i.maxSamples,C.samples)}function Ee(C){const x=n.get(C);return C.samples>0&&t.has("WEBGL_multisampled_render_to_texture")===!0&&x.__useRenderToTexture!==!1}function N(C){const x=o.render.frame;h.get(C)!==x&&(h.set(C,x),C.update())}function qt(C,x){const O=C.colorSpace,B=C.format,X=C.type;return C.isCompressedTexture===!0||C.isVideoTexture===!0||O!==Tn&&O!==ki&&(Qt.getTransfer(O)===me?(B!==Un||X!==wn)&&wt("WebGLTextures: sRGB encoded textures have to use RGBAFormat and UnsignedByteType."):Ot("WebGLTextures: Unsupported texture color space:",O)),x}function ne(C){return typeof HTMLImageElement<"u"&&C instanceof HTMLImageElement?(c.width=C.naturalWidth||C.width,c.height=C.naturalHeight||C.height):typeof VideoFrame<"u"&&C instanceof VideoFrame?(c.width=C.displayWidth,c.height=C.displayHeight):(c.width=C.width,c.height=C.height),c}this.allocateTextureUnit=$,this.resetTextureUnits=W,this.getTextureUnits=K,this.setTextureUnits=k,this.setTexture2D=Q,this.setTexture2DArray=it,this.setTexture3D=ft,this.setTextureCube=at,this.rebindTextures=oe,this.setupRenderTarget=ee,this.updateRenderTargetMipmap=jt,this.updateMultisampleRenderTarget=de,this.setupDepthRenderbuffer=ue,this.setupFrameBufferTexture=Lt,this.useMultisampledRTT=Ee,this.isReversedDepthBuffer=function(){return e.buffers.depth.getReversed()}}function Ly(r,t){function e(n,i=ki){let s;const o=Qt.getTransfer(i);if(n===wn)return r.UNSIGNED_BYTE;if(n===Lc)return r.UNSIGNED_SHORT_4_4_4_4;if(n===Dc)return r.UNSIGNED_SHORT_5_5_5_1;if(n===lf)return r.UNSIGNED_INT_5_9_9_9_REV;if(n===cf)return r.UNSIGNED_INT_10F_11F_11F_REV;if(n===of)return r.BYTE;if(n===af)return r.SHORT;if(n===Br)return r.UNSIGNED_SHORT;if(n===Ic)return r.INT;if(n===oi)return r.UNSIGNED_INT;if(n===Nn)return r.FLOAT;if(n===Si)return r.HALF_FLOAT;if(n===hf)return r.ALPHA;if(n===uf)return r.RGB;if(n===Un)return r.RGBA;if(n===wi)return r.DEPTH_COMPONENT;if(n===ns)return r.DEPTH_STENCIL;if(n===Nc)return r.RED;if(n===Uc)return r.RED_INTEGER;if(n===os)return r.RG;if(n===Fc)return r.RG_INTEGER;if(n===Oc)return r.RGBA_INTEGER;if(n===Vo||n===Go||n===Wo||n===Xo)if(o===me)if(s=t.get("WEBGL_compressed_texture_s3tc_srgb"),s!==null){if(n===Vo)return s.COMPRESSED_SRGB_S3TC_DXT1_EXT;if(n===Go)return s.COMPRESSED_SRGB_ALPHA_S3TC_DXT1_EXT;if(n===Wo)return s.COMPRESSED_SRGB_ALPHA_S3TC_DXT3_EXT;if(n===Xo)return s.COMPRESSED_SRGB_ALPHA_S3TC_DXT5_EXT}else return null;else if(s=t.get("WEBGL_compressed_texture_s3tc"),s!==null){if(n===Vo)return s.COMPRESSED_RGB_S3TC_DXT1_EXT;if(n===Go)return s.COMPRESSED_RGBA_S3TC_DXT1_EXT;if(n===Wo)return s.COMPRESSED_RGBA_S3TC_DXT3_EXT;if(n===Xo)return s.COMPRESSED_RGBA_S3TC_DXT5_EXT}else return null;if(n===Dl||n===Nl||n===Ul||n===Fl)if(s=t.get("WEBGL_compressed_texture_pvrtc"),s!==null){if(n===Dl)return s.COMPRESSED_RGB_PVRTC_4BPPV1_IMG;if(n===Nl)return s.COMPRESSED_RGB_PVRTC_2BPPV1_IMG;if(n===Ul)return s.COMPRESSED_RGBA_PVRTC_4BPPV1_IMG;if(n===Fl)return s.COMPRESSED_RGBA_PVRTC_2BPPV1_IMG}else return null;if(n===Ol||n===kl||n===Bl||n===zl||n===Hl||n===Ko||n===Vl)if(s=t.get("WEBGL_compressed_texture_etc"),s!==null){if(n===Ol||n===kl)return o===me?s.COMPRESSED_SRGB8_ETC2:s.COMPRESSED_RGB8_ETC2;if(n===Bl)return o===me?s.COMPRESSED_SRGB8_ALPHA8_ETC2_EAC:s.COMPRESSED_RGBA8_ETC2_EAC;if(n===zl)return s.COMPRESSED_R11_EAC;if(n===Hl)return s.COMPRESSED_SIGNED_R11_EAC;if(n===Ko)return s.COMPRESSED_RG11_EAC;if(n===Vl)return s.COMPRESSED_SIGNED_RG11_EAC}else return null;if(n===Gl||n===Wl||n===Xl||n===ql||n===$l||n===Yl||n===Kl||n===Zl||n===jl||n===Jl||n===Ql||n===tc||n===ec||n===nc)if(s=t.get("WEBGL_compressed_texture_astc"),s!==null){if(n===Gl)return o===me?s.COMPRESSED_SRGB8_ALPHA8_ASTC_4x4_KHR:s.COMPRESSED_RGBA_ASTC_4x4_KHR;if(n===Wl)return o===me?s.COMPRESSED_SRGB8_ALPHA8_ASTC_5x4_KHR:s.COMPRESSED_RGBA_ASTC_5x4_KHR;if(n===Xl)return o===me?s.COMPRESSED_SRGB8_ALPHA8_ASTC_5x5_KHR:s.COMPRESSED_RGBA_ASTC_5x5_KHR;if(n===ql)return o===me?s.COMPRESSED_SRGB8_ALPHA8_ASTC_6x5_KHR:s.COMPRESSED_RGBA_ASTC_6x5_KHR;if(n===$l)return o===me?s.COMPRESSED_SRGB8_ALPHA8_ASTC_6x6_KHR:s.COMPRESSED_RGBA_ASTC_6x6_KHR;if(n===Yl)return o===me?s.COMPRESSED_SRGB8_ALPHA8_ASTC_8x5_KHR:s.COMPRESSED_RGBA_ASTC_8x5_KHR;if(n===Kl)return o===me?s.COMPRESSED_SRGB8_ALPHA8_ASTC_8x6_KHR:s.COMPRESSED_RGBA_ASTC_8x6_KHR;if(n===Zl)return o===me?s.COMPRESSED_SRGB8_ALPHA8_ASTC_8x8_KHR:s.COMPRESSED_RGBA_ASTC_8x8_KHR;if(n===jl)return o===me?s.COMPRESSED_SRGB8_ALPHA8_ASTC_10x5_KHR:s.COMPRESSED_RGBA_ASTC_10x5_KHR;if(n===Jl)return o===me?s.COMPRESSED_SRGB8_ALPHA8_ASTC_10x6_KHR:s.COMPRESSED_RGBA_ASTC_10x6_KHR;if(n===Ql)return o===me?s.COMPRESSED_SRGB8_ALPHA8_ASTC_10x8_KHR:s.COMPRESSED_RGBA_ASTC_10x8_KHR;if(n===tc)return o===me?s.COMPRESSED_SRGB8_ALPHA8_ASTC_10x10_KHR:s.COMPRESSED_RGBA_ASTC_10x10_KHR;if(n===ec)return o===me?s.COMPRESSED_SRGB8_ALPHA8_ASTC_12x10_KHR:s.COMPRESSED_RGBA_ASTC_12x10_KHR;if(n===nc)return o===me?s.COMPRESSED_SRGB8_ALPHA8_ASTC_12x12_KHR:s.COMPRESSED_RGBA_ASTC_12x12_KHR}else return null;if(n===ic||n===sc||n===rc)if(s=t.get("EXT_texture_compression_bptc"),s!==null){if(n===ic)return o===me?s.COMPRESSED_SRGB_ALPHA_BPTC_UNORM_EXT:s.COMPRESSED_RGBA_BPTC_UNORM_EXT;if(n===sc)return s.COMPRESSED_RGB_BPTC_SIGNED_FLOAT_EXT;if(n===rc)return s.COMPRESSED_RGB_BPTC_UNSIGNED_FLOAT_EXT}else return null;if(n===oc||n===ac||n===Zo||n===lc)if(s=t.get("EXT_texture_compression_rgtc"),s!==null){if(n===oc)return s.COMPRESSED_RED_RGTC1_EXT;if(n===ac)return s.COMPRESSED_SIGNED_RED_RGTC1_EXT;if(n===Zo)return s.COMPRESSED_RED_GREEN_RGTC2_EXT;if(n===lc)return s.COMPRESSED_SIGNED_RED_GREEN_RGTC2_EXT}else return null;return n===zr?r.UNSIGNED_INT_24_8:r[n]!==void 0?r[n]:null}return{convert:e}}const Dy=`
void main() {

	gl_Position = vec4( position, 1.0 );

}`,Ny=`
uniform sampler2DArray depthColor;
uniform float depthWidth;
uniform float depthHeight;

void main() {

	vec2 coord = vec2( gl_FragCoord.x / depthWidth, gl_FragCoord.y / depthHeight );

	if ( coord.x >= 1.0 ) {

		gl_FragDepth = texture( depthColor, vec3( coord.x - 1.0, coord.y, 1 ) ).r;

	} else {

		gl_FragDepth = texture( depthColor, vec3( coord.x, coord.y, 0 ) ).r;

	}

}`;class Uy{constructor(){this.texture=null,this.mesh=null,this.depthNear=0,this.depthFar=0}init(t,e){if(this.texture===null){const n=new Rf(t.texture);(t.depthNear!==e.depthNear||t.depthFar!==e.depthFar)&&(this.depthNear=t.depthNear,this.depthFar=t.depthFar),this.texture=n}}getMesh(t){if(this.texture!==null&&this.mesh===null){const e=t.cameras[0].viewport,n=new ai({vertexShader:Dy,fragmentShader:Ny,uniforms:{depthColor:{value:this.texture},depthWidth:{value:e.z},depthHeight:{value:e.w}}});this.mesh=new te(new er(20,20),n)}return this.mesh}reset(){this.texture=null,this.mesh=null}getDepthTexture(){return this.texture}}class Fy extends Ei{constructor(t,e){super();const n=this;let i=null,s=1,o=null,a="local-floor",l=1,c=null,h=null,u=null,d=null,f=null,m=null;const _=typeof XRWebGLBinding<"u",g=new Uy,p={},b=e.getContextAttributes();let E=null,y=null;const S=[],w=[],A=new At;let v=null;const T=new tn;T.viewport=new be;const I=new tn;I.viewport=new be;const L=[T,I],U=new Ig;let W=null,K=null;this.cameraAutoUpdate=!0,this.enabled=!1,this.isPresenting=!1,this.getController=function(Z){let ht=S[Z];return ht===void 0&&(ht=new La,S[Z]=ht),ht.getTargetRaySpace()},this.getControllerGrip=function(Z){let ht=S[Z];return ht===void 0&&(ht=new La,S[Z]=ht),ht.getGripSpace()},this.getHand=function(Z){let ht=S[Z];return ht===void 0&&(ht=new La,S[Z]=ht),ht.getHandSpace()};function k(Z){const ht=w.indexOf(Z.inputSource);if(ht===-1)return;const et=S[ht];et!==void 0&&(et.update(Z.inputSource,Z.frame,c||o),et.dispatchEvent({type:Z.type,data:Z.inputSource}))}function $(){i.removeEventListener("select",k),i.removeEventListener("selectstart",k),i.removeEventListener("selectend",k),i.removeEventListener("squeeze",k),i.removeEventListener("squeezestart",k),i.removeEventListener("squeezeend",k),i.removeEventListener("end",$),i.removeEventListener("inputsourceschange",V);for(let Z=0;Z<S.length;Z++){const ht=w[Z];ht!==null&&(w[Z]=null,S[Z].disconnect(ht))}W=null,K=null,g.reset();for(const Z in p)delete p[Z];t.setRenderTarget(E),f=null,d=null,u=null,i=null,y=null,Zt.stop(),n.isPresenting=!1,t.setPixelRatio(v),t.setSize(A.width,A.height,!1),n.dispatchEvent({type:"sessionend"})}this.setFramebufferScaleFactor=function(Z){s=Z,n.isPresenting===!0&&wt("WebXRManager: Cannot change framebuffer scale while presenting.")},this.setReferenceSpaceType=function(Z){a=Z,n.isPresenting===!0&&wt("WebXRManager: Cannot change reference space type while presenting.")},this.getReferenceSpace=function(){return c||o},this.setReferenceSpace=function(Z){c=Z},this.getBaseLayer=function(){return d!==null?d:f},this.getBinding=function(){return u===null&&_&&(u=new XRWebGLBinding(i,e)),u},this.getFrame=function(){return m},this.getSession=function(){return i},this.setSession=async function(Z){if(i=Z,i!==null){if(E=t.getRenderTarget(),i.addEventListener("select",k),i.addEventListener("selectstart",k),i.addEventListener("selectend",k),i.addEventListener("squeeze",k),i.addEventListener("squeezestart",k),i.addEventListener("squeezeend",k),i.addEventListener("end",$),i.addEventListener("inputsourceschange",V),b.xrCompatible!==!0&&await e.makeXRCompatible(),v=t.getPixelRatio(),t.getSize(A),_&&"createProjectionLayer"in XRWebGLBinding.prototype){let et=null,Dt=null,zt=null;b.depth&&(zt=b.stencil?e.DEPTH24_STENCIL8:e.DEPTH_COMPONENT24,et=b.stencil?ns:wi,Dt=b.stencil?zr:oi);const Lt={colorFormat:e.RGBA8,depthFormat:zt,scaleFactor:s};u=this.getBinding(),d=u.createProjectionLayer(Lt),i.updateRenderState({layers:[d]}),t.setPixelRatio(1),t.setSize(d.textureWidth,d.textureHeight,!1),y=new si(d.textureWidth,d.textureHeight,{format:Un,type:wn,depthTexture:new tr(d.textureWidth,d.textureHeight,Dt,void 0,void 0,void 0,void 0,void 0,void 0,et),stencilBuffer:b.stencil,colorSpace:t.outputColorSpace,samples:b.antialias?4:0,resolveDepthBuffer:d.ignoreDepthValues===!1,resolveStencilBuffer:d.ignoreDepthValues===!1})}else{const et={antialias:b.antialias,alpha:!0,depth:b.depth,stencil:b.stencil,framebufferScaleFactor:s};f=new XRWebGLLayer(i,e,et),i.updateRenderState({baseLayer:f}),t.setPixelRatio(1),t.setSize(f.framebufferWidth,f.framebufferHeight,!1),y=new si(f.framebufferWidth,f.framebufferHeight,{format:Un,type:wn,colorSpace:t.outputColorSpace,stencilBuffer:b.stencil,resolveDepthBuffer:f.ignoreDepthValues===!1,resolveStencilBuffer:f.ignoreDepthValues===!1})}y.isXRRenderTarget=!0,this.setFoveation(l),c=null,o=await i.requestReferenceSpace(a),Zt.setContext(i),Zt.start(),n.isPresenting=!0,n.dispatchEvent({type:"sessionstart"})}},this.getEnvironmentBlendMode=function(){if(i!==null)return i.environmentBlendMode},this.getDepthTexture=function(){return g.getDepthTexture()};function V(Z){for(let ht=0;ht<Z.removed.length;ht++){const et=Z.removed[ht],Dt=w.indexOf(et);Dt>=0&&(w[Dt]=null,S[Dt].disconnect(et))}for(let ht=0;ht<Z.added.length;ht++){const et=Z.added[ht];let Dt=w.indexOf(et);if(Dt===-1){for(let Lt=0;Lt<S.length;Lt++)if(Lt>=w.length){w.push(et),Dt=Lt;break}else if(w[Lt]===null){w[Lt]=et,Dt=Lt;break}if(Dt===-1)break}const zt=S[Dt];zt&&zt.connect(et)}}const Q=new P,it=new P;function ft(Z,ht,et){Q.setFromMatrixPosition(ht.matrixWorld),it.setFromMatrixPosition(et.matrixWorld);const Dt=Q.distanceTo(it),zt=ht.projectionMatrix.elements,Lt=et.projectionMatrix.elements,Ie=zt[14]/(zt[10]-1),Gt=zt[14]/(zt[10]+1),ue=(zt[9]+1)/zt[5],oe=(zt[9]-1)/zt[5],ee=(zt[8]-1)/zt[0],jt=(Lt[8]+1)/Lt[0],ae=Ie*ee,ie=Ie*jt,de=Dt/(-ee+jt),ce=de*-ee;if(ht.matrixWorld.decompose(Z.position,Z.quaternion,Z.scale),Z.translateX(ce),Z.translateZ(de),Z.matrixWorld.compose(Z.position,Z.quaternion,Z.scale),Z.matrixWorldInverse.copy(Z.matrixWorld).invert(),zt[10]===-1)Z.projectionMatrix.copy(ht.projectionMatrix),Z.projectionMatrixInverse.copy(ht.projectionMatrixInverse);else{const Ee=Ie+de,N=Gt+de,qt=ae-ce,ne=ie+(Dt-ce),C=ue*Gt/N*Ee,x=oe*Gt/N*Ee;Z.projectionMatrix.makePerspective(qt,ne,C,x,Ee,N),Z.projectionMatrixInverse.copy(Z.projectionMatrix).invert()}}function at(Z,ht){ht===null?Z.matrixWorld.copy(Z.matrix):Z.matrixWorld.multiplyMatrices(ht.matrixWorld,Z.matrix),Z.matrixWorldInverse.copy(Z.matrixWorld).invert()}this.updateCamera=function(Z){if(i===null)return;let ht=Z.near,et=Z.far;g.texture!==null&&(g.depthNear>0&&(ht=g.depthNear),g.depthFar>0&&(et=g.depthFar)),U.near=I.near=T.near=ht,U.far=I.far=T.far=et,(W!==U.near||K!==U.far)&&(i.updateRenderState({depthNear:U.near,depthFar:U.far}),W=U.near,K=U.far),U.layers.mask=Z.layers.mask|6,T.layers.mask=U.layers.mask&-5,I.layers.mask=U.layers.mask&-3;const Dt=Z.parent,zt=U.cameras;at(U,Dt);for(let Lt=0;Lt<zt.length;Lt++)at(zt[Lt],Dt);zt.length===2?ft(U,T,I):U.projectionMatrix.copy(T.projectionMatrix),Y(Z,U,Dt)};function Y(Z,ht,et){et===null?Z.matrix.copy(ht.matrixWorld):(Z.matrix.copy(et.matrixWorld),Z.matrix.invert(),Z.matrix.multiply(ht.matrixWorld)),Z.matrix.decompose(Z.position,Z.quaternion,Z.scale),Z.updateMatrixWorld(!0),Z.projectionMatrix.copy(ht.projectionMatrix),Z.projectionMatrixInverse.copy(ht.projectionMatrixInverse),Z.isPerspectiveCamera&&(Z.fov=Qs*2*Math.atan(1/Z.projectionMatrix.elements[5]),Z.zoom=1)}this.getCamera=function(){return U},this.getFoveation=function(){if(!(d===null&&f===null))return l},this.setFoveation=function(Z){l=Z,d!==null&&(d.fixedFoveation=Z),f!==null&&f.fixedFoveation!==void 0&&(f.fixedFoveation=Z)},this.hasDepthSensing=function(){return g.texture!==null},this.getDepthSensingMesh=function(){return g.getMesh(U)},this.getCameraTexture=function(Z){return p[Z]};let Bt=null;function re(Z,ht){if(h=ht.getViewerPose(c||o),m=ht,h!==null){const et=h.views;f!==null&&(t.setRenderTargetFramebuffer(y,f.framebuffer),t.setRenderTarget(y));let Dt=!1;et.length!==U.cameras.length&&(U.cameras.length=0,Dt=!0);for(let Gt=0;Gt<et.length;Gt++){const ue=et[Gt];let oe=null;if(f!==null)oe=f.getViewport(ue);else{const jt=u.getViewSubImage(d,ue);oe=jt.viewport,Gt===0&&(t.setRenderTargetTextures(y,jt.colorTexture,jt.depthStencilTexture),t.setRenderTarget(y))}let ee=L[Gt];ee===void 0&&(ee=new tn,ee.layers.enable(Gt),ee.viewport=new be,L[Gt]=ee),ee.matrix.fromArray(ue.transform.matrix),ee.matrix.decompose(ee.position,ee.quaternion,ee.scale),ee.projectionMatrix.fromArray(ue.projectionMatrix),ee.projectionMatrixInverse.copy(ee.projectionMatrix).invert(),ee.viewport.set(oe.x,oe.y,oe.width,oe.height),Gt===0&&(U.matrix.copy(ee.matrix),U.matrix.decompose(U.position,U.quaternion,U.scale)),Dt===!0&&U.cameras.push(ee)}const zt=i.enabledFeatures;if(zt&&zt.includes("depth-sensing")&&i.depthUsage=="gpu-optimized"&&_){u=n.getBinding();const Gt=u.getDepthInformation(et[0]);Gt&&Gt.isValid&&Gt.texture&&g.init(Gt,i.renderState)}if(zt&&zt.includes("camera-access")&&_){t.state.unbindTexture(),u=n.getBinding();for(let Gt=0;Gt<et.length;Gt++){const ue=et[Gt].camera;if(ue){let oe=p[ue];oe||(oe=new Rf,p[ue]=oe);const ee=u.getCameraImage(ue);oe.sourceTexture=ee}}}}for(let et=0;et<S.length;et++){const Dt=w[et],zt=S[et];Dt!==null&&zt!==void 0&&zt.update(Dt,ht,c||o)}Bt&&Bt(Z,ht),ht.detectedPlanes&&n.dispatchEvent({type:"planesdetected",data:ht}),m=null}const Zt=new Ff;Zt.setAnimationLoop(re),this.setAnimationLoop=function(Z){Bt=Z},this.dispose=function(){}}}const Oy=new Ht,Gf=new Vt;Gf.set(-1,0,0,0,1,0,0,0,1);function ky(r,t){function e(g,p){g.matrixAutoUpdate===!0&&g.updateMatrix(),p.value.copy(g.matrix)}function n(g,p){p.color.getRGB(g.fogColor.value,Pf(r)),p.isFog?(g.fogNear.value=p.near,g.fogFar.value=p.far):p.isFogExp2&&(g.fogDensity.value=p.density)}function i(g,p,b,E,y){p.isNodeMaterial?p.uniformsNeedUpdate=!1:p.isMeshBasicMaterial?s(g,p):p.isMeshLambertMaterial?(s(g,p),p.envMap&&(g.envMapIntensity.value=p.envMapIntensity)):p.isMeshToonMaterial?(s(g,p),u(g,p)):p.isMeshPhongMaterial?(s(g,p),h(g,p),p.envMap&&(g.envMapIntensity.value=p.envMapIntensity)):p.isMeshStandardMaterial?(s(g,p),d(g,p),p.isMeshPhysicalMaterial&&f(g,p,y)):p.isMeshMatcapMaterial?(s(g,p),m(g,p)):p.isMeshDepthMaterial?s(g,p):p.isMeshDistanceMaterial?(s(g,p),_(g,p)):p.isMeshNormalMaterial?s(g,p):p.isLineBasicMaterial?(o(g,p),p.isLineDashedMaterial&&a(g,p)):p.isPointsMaterial?l(g,p,b,E):p.isSpriteMaterial?c(g,p):p.isShadowMaterial?(g.color.value.copy(p.color),g.opacity.value=p.opacity):p.isShaderMaterial&&(p.uniformsNeedUpdate=!1)}function s(g,p){g.opacity.value=p.opacity,p.color&&g.diffuse.value.copy(p.color),p.emissive&&g.emissive.value.copy(p.emissive).multiplyScalar(p.emissiveIntensity),p.map&&(g.map.value=p.map,e(p.map,g.mapTransform)),p.alphaMap&&(g.alphaMap.value=p.alphaMap,e(p.alphaMap,g.alphaMapTransform)),p.bumpMap&&(g.bumpMap.value=p.bumpMap,e(p.bumpMap,g.bumpMapTransform),g.bumpScale.value=p.bumpScale,p.side===cn&&(g.bumpScale.value*=-1)),p.normalMap&&(g.normalMap.value=p.normalMap,e(p.normalMap,g.normalMapTransform),g.normalScale.value.copy(p.normalScale),p.side===cn&&g.normalScale.value.negate()),p.displacementMap&&(g.displacementMap.value=p.displacementMap,e(p.displacementMap,g.displacementMapTransform),g.displacementScale.value=p.displacementScale,g.displacementBias.value=p.displacementBias),p.emissiveMap&&(g.emissiveMap.value=p.emissiveMap,e(p.emissiveMap,g.emissiveMapTransform)),p.specularMap&&(g.specularMap.value=p.specularMap,e(p.specularMap,g.specularMapTransform)),p.alphaTest>0&&(g.alphaTest.value=p.alphaTest);const b=t.get(p),E=b.envMap,y=b.envMapRotation;E&&(g.envMap.value=E,g.envMapRotation.value.setFromMatrix4(Oy.makeRotationFromEuler(y)).transpose(),E.isCubeTexture&&E.isRenderTargetTexture===!1&&g.envMapRotation.value.premultiply(Gf),g.reflectivity.value=p.reflectivity,g.ior.value=p.ior,g.refractionRatio.value=p.refractionRatio),p.lightMap&&(g.lightMap.value=p.lightMap,g.lightMapIntensity.value=p.lightMapIntensity,e(p.lightMap,g.lightMapTransform)),p.aoMap&&(g.aoMap.value=p.aoMap,g.aoMapIntensity.value=p.aoMapIntensity,e(p.aoMap,g.aoMapTransform))}function o(g,p){g.diffuse.value.copy(p.color),g.opacity.value=p.opacity,p.map&&(g.map.value=p.map,e(p.map,g.mapTransform))}function a(g,p){g.dashSize.value=p.dashSize,g.totalSize.value=p.dashSize+p.gapSize,g.scale.value=p.scale}function l(g,p,b,E){g.diffuse.value.copy(p.color),g.opacity.value=p.opacity,g.size.value=p.size*b,g.scale.value=E*.5,p.map&&(g.map.value=p.map,e(p.map,g.uvTransform)),p.alphaMap&&(g.alphaMap.value=p.alphaMap,e(p.alphaMap,g.alphaMapTransform)),p.alphaTest>0&&(g.alphaTest.value=p.alphaTest)}function c(g,p){g.diffuse.value.copy(p.color),g.opacity.value=p.opacity,g.rotation.value=p.rotation,p.map&&(g.map.value=p.map,e(p.map,g.mapTransform)),p.alphaMap&&(g.alphaMap.value=p.alphaMap,e(p.alphaMap,g.alphaMapTransform)),p.alphaTest>0&&(g.alphaTest.value=p.alphaTest)}function h(g,p){g.specular.value.copy(p.specular),g.shininess.value=Math.max(p.shininess,1e-4)}function u(g,p){p.gradientMap&&(g.gradientMap.value=p.gradientMap)}function d(g,p){g.metalness.value=p.metalness,p.metalnessMap&&(g.metalnessMap.value=p.metalnessMap,e(p.metalnessMap,g.metalnessMapTransform)),g.roughness.value=p.roughness,p.roughnessMap&&(g.roughnessMap.value=p.roughnessMap,e(p.roughnessMap,g.roughnessMapTransform)),p.envMap&&(g.envMapIntensity.value=p.envMapIntensity)}function f(g,p,b){g.ior.value=p.ior,p.sheen>0&&(g.sheenColor.value.copy(p.sheenColor).multiplyScalar(p.sheen),g.sheenRoughness.value=p.sheenRoughness,p.sheenColorMap&&(g.sheenColorMap.value=p.sheenColorMap,e(p.sheenColorMap,g.sheenColorMapTransform)),p.sheenRoughnessMap&&(g.sheenRoughnessMap.value=p.sheenRoughnessMap,e(p.sheenRoughnessMap,g.sheenRoughnessMapTransform))),p.clearcoat>0&&(g.clearcoat.value=p.clearcoat,g.clearcoatRoughness.value=p.clearcoatRoughness,p.clearcoatMap&&(g.clearcoatMap.value=p.clearcoatMap,e(p.clearcoatMap,g.clearcoatMapTransform)),p.clearcoatRoughnessMap&&(g.clearcoatRoughnessMap.value=p.clearcoatRoughnessMap,e(p.clearcoatRoughnessMap,g.clearcoatRoughnessMapTransform)),p.clearcoatNormalMap&&(g.clearcoatNormalMap.value=p.clearcoatNormalMap,e(p.clearcoatNormalMap,g.clearcoatNormalMapTransform),g.clearcoatNormalScale.value.copy(p.clearcoatNormalScale),p.side===cn&&g.clearcoatNormalScale.value.negate())),p.dispersion>0&&(g.dispersion.value=p.dispersion),p.iridescence>0&&(g.iridescence.value=p.iridescence,g.iridescenceIOR.value=p.iridescenceIOR,g.iridescenceThicknessMinimum.value=p.iridescenceThicknessRange[0],g.iridescenceThicknessMaximum.value=p.iridescenceThicknessRange[1],p.iridescenceMap&&(g.iridescenceMap.value=p.iridescenceMap,e(p.iridescenceMap,g.iridescenceMapTransform)),p.iridescenceThicknessMap&&(g.iridescenceThicknessMap.value=p.iridescenceThicknessMap,e(p.iridescenceThicknessMap,g.iridescenceThicknessMapTransform))),p.transmission>0&&(g.transmission.value=p.transmission,g.transmissionSamplerMap.value=b.texture,g.transmissionSamplerSize.value.set(b.width,b.height),p.transmissionMap&&(g.transmissionMap.value=p.transmissionMap,e(p.transmissionMap,g.transmissionMapTransform)),g.thickness.value=p.thickness,p.thicknessMap&&(g.thicknessMap.value=p.thicknessMap,e(p.thicknessMap,g.thicknessMapTransform)),g.attenuationDistance.value=p.attenuationDistance,g.attenuationColor.value.copy(p.attenuationColor)),p.anisotropy>0&&(g.anisotropyVector.value.set(p.anisotropy*Math.cos(p.anisotropyRotation),p.anisotropy*Math.sin(p.anisotropyRotation)),p.anisotropyMap&&(g.anisotropyMap.value=p.anisotropyMap,e(p.anisotropyMap,g.anisotropyMapTransform))),g.specularIntensity.value=p.specularIntensity,g.specularColor.value.copy(p.specularColor),p.specularColorMap&&(g.specularColorMap.value=p.specularColorMap,e(p.specularColorMap,g.specularColorMapTransform)),p.specularIntensityMap&&(g.specularIntensityMap.value=p.specularIntensityMap,e(p.specularIntensityMap,g.specularIntensityMapTransform))}function m(g,p){p.matcap&&(g.matcap.value=p.matcap)}function _(g,p){const b=t.get(p).light;g.referencePosition.value.setFromMatrixPosition(b.matrixWorld),g.nearDistance.value=b.shadow.camera.near,g.farDistance.value=b.shadow.camera.far}return{refreshFogUniforms:n,refreshMaterialUniforms:i}}function By(r,t,e,n){let i={},s={},o=[];const a=r.getParameter(r.MAX_UNIFORM_BUFFER_BINDINGS);function l(y,S){const w=S.program;n.uniformBlockBinding(y,w)}function c(y,S){let w=i[y.id];w===void 0&&(g(y),w=h(y),i[y.id]=w,y.addEventListener("dispose",b));const A=S.program;n.updateUBOMapping(y,A);const v=t.render.frame;s[y.id]!==v&&(d(y),s[y.id]=v)}function h(y){const S=u();y.__bindingPointIndex=S;const w=r.createBuffer(),A=y.__size,v=y.usage;return r.bindBuffer(r.UNIFORM_BUFFER,w),r.bufferData(r.UNIFORM_BUFFER,A,v),r.bindBuffer(r.UNIFORM_BUFFER,null),r.bindBufferBase(r.UNIFORM_BUFFER,S,w),w}function u(){for(let y=0;y<a;y++)if(o.indexOf(y)===-1)return o.push(y),y;return Ot("WebGLRenderer: Maximum number of simultaneously usable uniforms groups reached."),0}function d(y){const S=i[y.id],w=y.uniforms,A=y.__cache;r.bindBuffer(r.UNIFORM_BUFFER,S);for(let v=0,T=w.length;v<T;v++){const I=w[v];if(Array.isArray(I))for(let L=0,U=I.length;L<U;L++)f(I[L],v,L,A);else f(I,v,0,A)}r.bindBuffer(r.UNIFORM_BUFFER,null)}function f(y,S,w,A){if(_(y,S,w,A)===!0){const v=y.__offset,T=y.value;if(Array.isArray(T)){let I=0;for(let L=0;L<T.length;L++){const U=T[L],W=p(U);m(U,y.__data,I),typeof U!="number"&&typeof U!="boolean"&&!U.isMatrix3&&!ArrayBuffer.isView(U)&&(I+=W.storage/Float32Array.BYTES_PER_ELEMENT)}}else m(T,y.__data,0);r.bufferSubData(r.UNIFORM_BUFFER,v,y.__data)}}function m(y,S,w){typeof y=="number"||typeof y=="boolean"?S[0]=y:y.isMatrix3?(S[0]=y.elements[0],S[1]=y.elements[1],S[2]=y.elements[2],S[3]=0,S[4]=y.elements[3],S[5]=y.elements[4],S[6]=y.elements[5],S[7]=0,S[8]=y.elements[6],S[9]=y.elements[7],S[10]=y.elements[8],S[11]=0):ArrayBuffer.isView(y)?S.set(new y.constructor(y.buffer,y.byteOffset,S.length)):y.toArray(S,w)}function _(y,S,w,A){const v=y.value,T=S+"_"+w;if(A[T]===void 0)return typeof v=="number"||typeof v=="boolean"?A[T]=v:ArrayBuffer.isView(v)?A[T]=v.slice():A[T]=v.clone(),!0;{const I=A[T];if(typeof v=="number"||typeof v=="boolean"){if(I!==v)return A[T]=v,!0}else{if(ArrayBuffer.isView(v))return!0;if(I.equals(v)===!1)return I.copy(v),!0}}return!1}function g(y){const S=y.uniforms;let w=0;const A=16;for(let T=0,I=S.length;T<I;T++){const L=Array.isArray(S[T])?S[T]:[S[T]];for(let U=0,W=L.length;U<W;U++){const K=L[U],k=Array.isArray(K.value)?K.value:[K.value];for(let $=0,V=k.length;$<V;$++){const Q=k[$],it=p(Q),ft=w%A,at=ft%it.boundary,Y=ft+at;w+=at,Y!==0&&A-Y<it.storage&&(w+=A-Y),K.__data=new Float32Array(it.storage/Float32Array.BYTES_PER_ELEMENT),K.__offset=w,w+=it.storage}}}const v=w%A;return v>0&&(w+=A-v),y.__size=w,y.__cache={},this}function p(y){const S={boundary:0,storage:0};return typeof y=="number"||typeof y=="boolean"?(S.boundary=4,S.storage=4):y.isVector2?(S.boundary=8,S.storage=8):y.isVector3||y.isColor?(S.boundary=16,S.storage=12):y.isVector4?(S.boundary=16,S.storage=16):y.isMatrix3?(S.boundary=48,S.storage=48):y.isMatrix4?(S.boundary=64,S.storage=64):y.isTexture?wt("WebGLRenderer: Texture samplers can not be part of an uniforms group."):ArrayBuffer.isView(y)?(S.boundary=16,S.storage=y.byteLength):wt("WebGLRenderer: Unsupported uniform value type.",y),S}function b(y){const S=y.target;S.removeEventListener("dispose",b);const w=o.indexOf(S.__bindingPointIndex);o.splice(w,1),r.deleteBuffer(i[S.id]),delete i[S.id],delete s[S.id]}function E(){for(const y in i)r.deleteBuffer(i[y]);o=[],i={},s={}}return{bind:l,update:c,dispose:E}}const zy=new Uint16Array([12469,15057,12620,14925,13266,14620,13807,14376,14323,13990,14545,13625,14713,13328,14840,12882,14931,12528,14996,12233,15039,11829,15066,11525,15080,11295,15085,10976,15082,10705,15073,10495,13880,14564,13898,14542,13977,14430,14158,14124,14393,13732,14556,13410,14702,12996,14814,12596,14891,12291,14937,11834,14957,11489,14958,11194,14943,10803,14921,10506,14893,10278,14858,9960,14484,14039,14487,14025,14499,13941,14524,13740,14574,13468,14654,13106,14743,12678,14818,12344,14867,11893,14889,11509,14893,11180,14881,10751,14852,10428,14812,10128,14765,9754,14712,9466,14764,13480,14764,13475,14766,13440,14766,13347,14769,13070,14786,12713,14816,12387,14844,11957,14860,11549,14868,11215,14855,10751,14825,10403,14782,10044,14729,9651,14666,9352,14599,9029,14967,12835,14966,12831,14963,12804,14954,12723,14936,12564,14917,12347,14900,11958,14886,11569,14878,11247,14859,10765,14828,10401,14784,10011,14727,9600,14660,9289,14586,8893,14508,8533,15111,12234,15110,12234,15104,12216,15092,12156,15067,12010,15028,11776,14981,11500,14942,11205,14902,10752,14861,10393,14812,9991,14752,9570,14682,9252,14603,8808,14519,8445,14431,8145,15209,11449,15208,11451,15202,11451,15190,11438,15163,11384,15117,11274,15055,10979,14994,10648,14932,10343,14871,9936,14803,9532,14729,9218,14645,8742,14556,8381,14461,8020,14365,7603,15273,10603,15272,10607,15267,10619,15256,10631,15231,10614,15182,10535,15118,10389,15042,10167,14963,9787,14883,9447,14800,9115,14710,8665,14615,8318,14514,7911,14411,7507,14279,7198,15314,9675,15313,9683,15309,9712,15298,9759,15277,9797,15229,9773,15166,9668,15084,9487,14995,9274,14898,8910,14800,8539,14697,8234,14590,7790,14479,7409,14367,7067,14178,6621,15337,8619,15337,8631,15333,8677,15325,8769,15305,8871,15264,8940,15202,8909,15119,8775,15022,8565,14916,8328,14804,8009,14688,7614,14569,7287,14448,6888,14321,6483,14088,6171,15350,7402,15350,7419,15347,7480,15340,7613,15322,7804,15287,7973,15229,8057,15148,8012,15046,7846,14933,7611,14810,7357,14682,7069,14552,6656,14421,6316,14251,5948,14007,5528,15356,5942,15356,5977,15353,6119,15348,6294,15332,6551,15302,6824,15249,7044,15171,7122,15070,7050,14949,6861,14818,6611,14679,6349,14538,6067,14398,5651,14189,5311,13935,4958,15359,4123,15359,4153,15356,4296,15353,4646,15338,5160,15311,5508,15263,5829,15188,6042,15088,6094,14966,6001,14826,5796,14678,5543,14527,5287,14377,4985,14133,4586,13869,4257,15360,1563,15360,1642,15358,2076,15354,2636,15341,3350,15317,4019,15273,4429,15203,4732,15105,4911,14981,4932,14836,4818,14679,4621,14517,4386,14359,4156,14083,3795,13808,3437,15360,122,15360,137,15358,285,15355,636,15344,1274,15322,2177,15281,2765,15215,3223,15120,3451,14995,3569,14846,3567,14681,3466,14511,3305,14344,3121,14037,2800,13753,2467,15360,0,15360,1,15359,21,15355,89,15346,253,15325,479,15287,796,15225,1148,15133,1492,15008,1749,14856,1882,14685,1886,14506,1783,14324,1608,13996,1398,13702,1183]);let Kn=null;function Hy(){return Kn===null&&(Kn=new Xc(zy,16,16,os,Si),Kn.name="DFG_LUT",Kn.minFilter=We,Kn.magFilter=We,Kn.wrapS=Dn,Kn.wrapT=Dn,Kn.generateMipmaps=!1,Kn.needsUpdate=!0),Kn}class Wf{constructor(t={}){const{canvas:e=um(),context:n=null,depth:i=!0,stencil:s=!1,alpha:o=!1,antialias:a=!1,premultipliedAlpha:l=!0,preserveDrawingBuffer:c=!1,powerPreference:h="default",failIfMajorPerformanceCaveat:u=!1,reversedDepthBuffer:d=!1,outputBufferType:f=wn}=t;this.isWebGLRenderer=!0;let m;if(n!==null){if(typeof WebGLRenderingContext<"u"&&n instanceof WebGLRenderingContext)throw new Error("THREE.WebGLRenderer: WebGL 1 is not supported since r163.");m=n.getContextAttributes().alpha}else m=o;const _=f,g=new Set([Oc,Fc,Uc]),p=new Set([wn,oi,Br,zr,Lc,Dc]),b=new Uint32Array(4),E=new Int32Array(4),y=new P;let S=null,w=null;const A=[],v=[];let T=null;this.domElement=e,this.debug={checkShaderErrors:!0,onShaderError:null},this.autoClear=!0,this.autoClearColor=!0,this.autoClearDepth=!0,this.autoClearStencil=!0,this.sortObjects=!0,this.clippingPlanes=[],this.localClippingEnabled=!1,this.toneMapping=zn,this.toneMappingExposure=1,this.transmissionResolutionScale=1;const I=this;let L=!1,U=null,W=null,K=null,k=null;this._outputColorSpace=Be;let $=0,V=0,Q=null,it=-1,ft=null;const at=new be,Y=new be;let Bt=null;const re=new Et(0);let Zt=0,Z=e.width,ht=e.height,et=1,Dt=null,zt=null;const Lt=new be(0,0,Z,ht),Ie=new be(0,0,Z,ht);let Gt=!1;const ue=new Yc;let oe=!1,ee=!1;const jt=new Ht,ae=new P,ie=new be,de={background:null,fog:null,environment:null,overrideMaterial:null,isScene:!0};let ce=!1;function Ee(){return Q===null?et:1}let N=n;function qt(M,F){return e.getContext(M,F)}try{const M={alpha:!0,depth:i,stencil:s,antialias:a,premultipliedAlpha:l,preserveDrawingBuffer:c,powerPreference:h,failIfMajorPerformanceCaveat:u};if("setAttribute"in e&&e.setAttribute("data-engine",`three.js r${Pc}`),e.addEventListener("webglcontextlost",Ne,!1),e.addEventListener("webglcontextrestored",Te,!1),e.addEventListener("webglcontextcreationerror",Xn,!1),N===null){const F="webgl2";if(N=qt(F,M),N===null)throw qt(F)?new Error("THREE.WebGLRenderer: Error creating WebGL context with your selected attributes."):new Error("THREE.WebGLRenderer: Error creating WebGL context.")}}catch(M){throw Ot("WebGLRenderer: "+M.message),M}let ne,C,x,O,B,X,st,ut,q,j,rt,Mt,lt,ct,It,Ft,Wt,D,dt,J,pt,xt,tt;function Tt(){ne=new Hx(N),ne.init(),pt=new Ly(N,ne),C=new Dx(N,ne,t,pt),x=new Py(N,ne),C.reversedDepthBuffer&&d&&x.buffers.depth.setReversed(!0),W=N.createFramebuffer(),K=N.createFramebuffer(),k=N.createFramebuffer(),O=new Wx(N),B=new gy,X=new Iy(N,ne,x,B,C,pt,O),st=new zx(I),ut=new Yg(N),xt=new Ix(N,ut),q=new Vx(N,ut,O,xt),j=new qx(N,q,ut,xt,O),D=new Xx(N,C,X),It=new Nx(B),rt=new my(I,st,ne,C,xt,It),Mt=new ky(I,B),lt=new xy,ct=new wy(ne),Wt=new Px(I,st,x,j,m,l),Ft=new Ry(I,j,C),tt=new By(N,O,C,x),dt=new Lx(N,ne,O),J=new Gx(N,ne,O),O.programs=rt.programs,I.capabilities=C,I.extensions=ne,I.properties=B,I.renderLists=lt,I.shadowMap=Ft,I.state=x,I.info=O}Tt(),_!==wn&&(T=new Yx(_,e.width,e.height,a,i,s));const bt=new Fy(I,N);this.xr=bt,this.getContext=function(){return N},this.getContextAttributes=function(){return N.getContextAttributes()},this.forceContextLoss=function(){const M=ne.get("WEBGL_lose_context");M&&M.loseContext()},this.forceContextRestore=function(){const M=ne.get("WEBGL_lose_context");M&&M.restoreContext()},this.getPixelRatio=function(){return et},this.setPixelRatio=function(M){M!==void 0&&(et=M,this.setSize(Z,ht,!1))},this.getSize=function(M){return M.set(Z,ht)},this.setSize=function(M,F,G=!0){if(bt.isPresenting){wt("WebGLRenderer: Can't change size while VR device is presenting.");return}Z=M,ht=F,e.width=Math.floor(M*et),e.height=Math.floor(F*et),G===!0&&(e.style.width=M+"px",e.style.height=F+"px"),T!==null&&T.setSize(e.width,e.height),this.setViewport(0,0,M,F)},this.getDrawingBufferSize=function(M){return M.set(Z*et,ht*et).floor()},this.setDrawingBufferSize=function(M,F,G){Z=M,ht=F,et=G,e.width=Math.floor(M*G),e.height=Math.floor(F*G),this.setViewport(0,0,M,F)},this.setEffects=function(M){if(_===wn){Ot("WebGLRenderer: setEffects() requires outputBufferType set to HalfFloatType or FloatType.");return}if(M){for(let F=0;F<M.length;F++)if(M[F].isOutputPass===!0){wt("WebGLRenderer: OutputPass is not needed in setEffects(). Tone mapping and color space conversion are applied automatically.");break}}T.setEffects(M||[])},this.getCurrentViewport=function(M){return M.copy(at)},this.getViewport=function(M){return M.copy(Lt)},this.setViewport=function(M,F,G,z){M.isVector4?Lt.set(M.x,M.y,M.z,M.w):Lt.set(M,F,G,z),x.viewport(at.copy(Lt).multiplyScalar(et).round())},this.getScissor=function(M){return M.copy(Ie)},this.setScissor=function(M,F,G,z){M.isVector4?Ie.set(M.x,M.y,M.z,M.w):Ie.set(M,F,G,z),x.scissor(Y.copy(Ie).multiplyScalar(et).round())},this.getScissorTest=function(){return Gt},this.setScissorTest=function(M){x.setScissorTest(Gt=M)},this.setOpaqueSort=function(M){Dt=M},this.setTransparentSort=function(M){zt=M},this.getClearColor=function(M){return M.copy(Wt.getClearColor())},this.setClearColor=function(){Wt.setClearColor(...arguments)},this.getClearAlpha=function(){return Wt.getClearAlpha()},this.setClearAlpha=function(){Wt.setClearAlpha(...arguments)},this.clear=function(M=!0,F=!0,G=!0){let z=0;if(M){let H=!1;if(Q!==null){const _t=Q.texture.format;H=g.has(_t)}if(H){const _t=Q.texture.type,yt=p.has(_t),gt=Wt.getClearColor(),St=Wt.getClearAlpha(),Ct=gt.r,Xt=gt.g,Yt=gt.b;yt?(b[0]=Ct,b[1]=Xt,b[2]=Yt,b[3]=St,N.clearBufferuiv(N.COLOR,0,b)):(E[0]=Ct,E[1]=Xt,E[2]=Yt,E[3]=St,N.clearBufferiv(N.COLOR,0,E))}else z|=N.COLOR_BUFFER_BIT}F&&(z|=N.DEPTH_BUFFER_BIT,this.state.buffers.depth.setMask(!0)),G&&(z|=N.STENCIL_BUFFER_BIT,this.state.buffers.stencil.setMask(4294967295)),z!==0&&N.clear(z)},this.clearColor=function(){this.clear(!0,!1,!1)},this.clearDepth=function(){this.clear(!1,!0,!1)},this.clearStencil=function(){this.clear(!1,!1,!0)},this.setNodesHandler=function(M){M.setRenderer(this),U=M},this.dispose=function(){e.removeEventListener("webglcontextlost",Ne,!1),e.removeEventListener("webglcontextrestored",Te,!1),e.removeEventListener("webglcontextcreationerror",Xn,!1),Wt.dispose(),lt.dispose(),ct.dispose(),B.dispose(),st.dispose(),j.dispose(),xt.dispose(),tt.dispose(),rt.dispose(),bt.dispose(),bt.removeEventListener("sessionstart",Sh),bt.removeEventListener("sessionend",wh),qi.stop()};function Ne(M){M.preventDefault(),Qo("WebGLRenderer: Context Lost."),L=!0}function Te(){Qo("WebGLRenderer: Context Restored."),L=!1;const M=O.autoReset,F=Ft.enabled,G=Ft.autoUpdate,z=Ft.needsUpdate,H=Ft.type;Tt(),O.autoReset=M,Ft.enabled=F,Ft.autoUpdate=G,Ft.needsUpdate=z,Ft.type=H}function Xn(M){Ot("WebGLRenderer: A WebGL context could not be created. Reason: ",M.statusMessage)}function qn(M){const F=M.target;F.removeEventListener("dispose",qn),_p(F)}function _p(M){xp(M),B.remove(M)}function xp(M){const F=B.get(M).programs;F!==void 0&&(F.forEach(function(G){rt.releaseProgram(G)}),M.isShaderMaterial&&rt.releaseShaderCache(M))}this.renderBufferDirect=function(M,F,G,z,H,_t){F===null&&(F=de);const yt=H.isMesh&&H.matrixWorld.determinantAffine()<0,gt=Mp(M,F,G,z,H);x.setMaterial(z,yt);let St=G.index,Ct=1;if(z.wireframe===!0){if(St=q.getWireframeAttribute(G),St===void 0)return;Ct=2}const Xt=G.drawRange,Yt=G.attributes.position;let Pt=Xt.start*Ct,xe=(Xt.start+Xt.count)*Ct;_t!==null&&(Pt=Math.max(Pt,_t.start*Ct),xe=Math.min(xe,(_t.start+_t.count)*Ct)),St!==null?(Pt=Math.max(Pt,0),xe=Math.min(xe,St.count)):Yt!=null&&(Pt=Math.max(Pt,0),xe=Math.min(xe,Yt.count));const Oe=xe-Pt;if(Oe<0||Oe===1/0)return;xt.setup(H,z,gt,G,St);let Ue,Se=dt;if(St!==null&&(Ue=ut.get(St),Se=J,Se.setIndex(Ue)),H.isMesh)z.wireframe===!0?(x.setLineWidth(z.wireframeLinewidth*Ee()),Se.setMode(N.LINES)):Se.setMode(N.TRIANGLES);else if(H.isLine){let en=z.linewidth;en===void 0&&(en=1),x.setLineWidth(en*Ee()),H.isLineSegments?Se.setMode(N.LINES):H.isLineLoop?Se.setMode(N.LINE_LOOP):Se.setMode(N.LINE_STRIP)}else H.isPoints?Se.setMode(N.POINTS):H.isSprite&&Se.setMode(N.TRIANGLES);if(H.isBatchedMesh)if(ne.get("WEBGL_multi_draw"))Se.renderMultiDraw(H._multiDrawStarts,H._multiDrawCounts,H._multiDrawCount);else{const en=H._multiDrawStarts,vt=H._multiDrawCounts,vn=H._multiDrawCount,le=St?ut.get(St).bytesPerElement:1,An=B.get(z).currentProgram.getUniforms();for(let $n=0;$n<vn;$n++)An.setValue(N,"_gl_DrawID",$n),Se.render(en[$n]/le,vt[$n])}else if(H.isInstancedMesh)Se.renderInstances(Pt,Oe,H.count);else if(G.isInstancedBufferGeometry){const en=G._maxInstanceCount!==void 0?G._maxInstanceCount:1/0,vt=Math.min(G.instanceCount,en);Se.renderInstances(Pt,Oe,vt)}else Se.render(Pt,Oe)};function bh(M,F,G){M.transparent===!0&&M.side===on&&M.forceSinglePass===!1?(M.side=cn,M.needsUpdate=!0,so(M,F,G),M.side=bi,M.needsUpdate=!0,so(M,F,G),M.side=on):so(M,F,G)}this.compile=function(M,F,G=null){G===null&&(G=M),w=ct.get(G),w.init(F),v.push(w),G.traverseVisible(function(H){H.isLight&&H.layers.test(F.layers)&&(w.pushLight(H),H.castShadow&&w.pushShadow(H))}),M!==G&&M.traverseVisible(function(H){H.isLight&&H.layers.test(F.layers)&&(w.pushLight(H),H.castShadow&&w.pushShadow(H))}),w.setupLights();const z=new Set;return M.traverse(function(H){if(!(H.isMesh||H.isPoints||H.isLine||H.isSprite))return;const _t=H.material;if(_t)if(Array.isArray(_t))for(let yt=0;yt<_t.length;yt++){const gt=_t[yt];bh(gt,G,H),z.add(gt)}else bh(_t,G,H),z.add(_t)}),w=v.pop(),z},this.compileAsync=function(M,F,G=null){const z=this.compile(M,F,G);return new Promise(H=>{function _t(){if(z.forEach(function(yt){B.get(yt).currentProgram.isReady()&&z.delete(yt)}),z.size===0){H(M);return}setTimeout(_t,10)}ne.get("KHR_parallel_shader_compile")!==null?_t():setTimeout(_t,10)})};let ba=null;function vp(M){ba&&ba(M)}function Sh(){qi.stop()}function wh(){qi.start()}const qi=new Ff;qi.setAnimationLoop(vp),typeof self<"u"&&qi.setContext(self),this.setAnimationLoop=function(M){ba=M,bt.setAnimationLoop(M),M===null?qi.stop():qi.start()},bt.addEventListener("sessionstart",Sh),bt.addEventListener("sessionend",wh),this.render=function(M,F){if(F!==void 0&&F.isCamera!==!0){Ot("WebGLRenderer.render: camera is not an instance of THREE.Camera.");return}if(L===!0)return;U!==null&&U.renderStart(M,F);const G=bt.enabled===!0&&bt.isPresenting===!0,z=T!==null&&(Q===null||G)&&T.begin(I,Q);if(M.matrixWorldAutoUpdate===!0&&M.updateMatrixWorld(),F.parent===null&&F.matrixWorldAutoUpdate===!0&&F.updateMatrixWorld(),bt.enabled===!0&&bt.isPresenting===!0&&(T===null||T.isCompositing()===!1)&&(bt.cameraAutoUpdate===!0&&bt.updateCamera(F),F=bt.getCamera()),M.isScene===!0&&M.onBeforeRender(I,M,F,Q),w=ct.get(M,v.length),w.init(F),w.state.textureUnits=X.getTextureUnits(),v.push(w),jt.multiplyMatrices(F.projectionMatrix,F.matrixWorldInverse),ue.setFromProjectionMatrix(jt,ni,F.reversedDepth),ee=this.localClippingEnabled,oe=It.init(this.clippingPlanes,ee),S=lt.get(M,A.length),S.init(),A.push(S),bt.enabled===!0&&bt.isPresenting===!0){const yt=I.xr.getDepthSensingMesh();yt!==null&&Sa(yt,F,-1/0,I.sortObjects)}Sa(M,F,0,I.sortObjects),S.finish(),I.sortObjects===!0&&S.sort(Dt,zt,F.reversedDepth),ce=bt.enabled===!1||bt.isPresenting===!1||bt.hasDepthSensing()===!1,ce&&Wt.addToRenderList(S,M),this.info.render.frame++,this.info.autoReset===!0&&this.info.reset(),oe===!0&&It.beginShadows();const H=w.state.shadowsArray;if(Ft.render(H,M,F),oe===!0&&It.endShadows(),(z&&T.hasRenderPass())===!1){const yt=S.opaque,gt=S.transmissive;if(w.setupLights(),F.isArrayCamera){const St=F.cameras;if(gt.length>0)for(let Ct=0,Xt=St.length;Ct<Xt;Ct++){const Yt=St[Ct];Th(yt,gt,M,Yt)}ce&&Wt.render(M);for(let Ct=0,Xt=St.length;Ct<Xt;Ct++){const Yt=St[Ct];Eh(S,M,Yt,Yt.viewport)}}else gt.length>0&&Th(yt,gt,M,F),ce&&Wt.render(M),Eh(S,M,F)}Q!==null&&V===0&&(X.updateMultisampleRenderTarget(Q),X.updateRenderTargetMipmap(Q)),z&&T.end(I),M.isScene===!0&&M.onAfterRender(I,M,F),xt.resetDefaultState(),it=-1,ft=null,v.pop(),v.length>0?(w=v[v.length-1],X.setTextureUnits(w.state.textureUnits),oe===!0&&It.setGlobalState(I.clippingPlanes,w.state.camera)):w=null,A.pop(),A.length>0?S=A[A.length-1]:S=null,U!==null&&U.renderEnd()};function Sa(M,F,G,z){if(M.visible===!1)return;if(M.layers.test(F.layers)){if(M.isGroup)G=M.renderOrder;else if(M.isLOD)M.autoUpdate===!0&&M.update(F);else if(M.isLightProbeGrid)w.pushLightProbeGrid(M);else if(M.isLight)w.pushLight(M),M.castShadow&&w.pushShadow(M);else if(M.isSprite){if(!M.frustumCulled||ue.intersectsSprite(M)){z&&ie.setFromMatrixPosition(M.matrixWorld).applyMatrix4(jt);const yt=j.update(M),gt=M.material;gt.visible&&S.push(M,yt,gt,G,ie.z,null)}}else if((M.isMesh||M.isLine||M.isPoints)&&(!M.frustumCulled||ue.intersectsObject(M))){const yt=j.update(M),gt=M.material;if(z&&(M.boundingSphere!==void 0?(M.boundingSphere===null&&M.computeBoundingSphere(),ie.copy(M.boundingSphere.center)):(yt.boundingSphere===null&&yt.computeBoundingSphere(),ie.copy(yt.boundingSphere.center)),ie.applyMatrix4(M.matrixWorld).applyMatrix4(jt)),Array.isArray(gt)){const St=yt.groups;for(let Ct=0,Xt=St.length;Ct<Xt;Ct++){const Yt=St[Ct],Pt=gt[Yt.materialIndex];Pt&&Pt.visible&&S.push(M,yt,Pt,G,ie.z,Yt)}}else gt.visible&&S.push(M,yt,gt,G,ie.z,null)}}const _t=M.children;for(let yt=0,gt=_t.length;yt<gt;yt++)Sa(_t[yt],F,G,z)}function Eh(M,F,G,z){const{opaque:H,transmissive:_t,transparent:yt}=M;w.setupLightsView(G),oe===!0&&It.setGlobalState(I.clippingPlanes,G),z&&x.viewport(at.copy(z)),H.length>0&&io(H,F,G),_t.length>0&&io(_t,F,G),yt.length>0&&io(yt,F,G),x.buffers.depth.setTest(!0),x.buffers.depth.setMask(!0),x.buffers.color.setMask(!0),x.setPolygonOffset(!1)}function Th(M,F,G,z){if((G.isScene===!0?G.overrideMaterial:null)!==null)return;if(w.state.transmissionRenderTarget[z.id]===void 0){const Pt=ne.has("EXT_color_buffer_half_float")||ne.has("EXT_color_buffer_float");w.state.transmissionRenderTarget[z.id]=new si(1,1,{generateMipmaps:!0,type:Pt?Si:wn,minFilter:ei,samples:Math.max(4,C.samples),stencilBuffer:s,resolveDepthBuffer:!1,resolveStencilBuffer:!1,colorSpace:Qt.workingColorSpace})}const _t=w.state.transmissionRenderTarget[z.id],yt=z.viewport||at;_t.setSize(yt.z*I.transmissionResolutionScale,yt.w*I.transmissionResolutionScale);const gt=I.getRenderTarget(),St=I.getActiveCubeFace(),Ct=I.getActiveMipmapLevel();I.setRenderTarget(_t),I.getClearColor(re),Zt=I.getClearAlpha(),Zt<1&&I.setClearColor(16777215,.5),I.clear(),ce&&Wt.render(G);const Xt=I.toneMapping;I.toneMapping=zn;const Yt=z.viewport;if(z.viewport!==void 0&&(z.viewport=void 0),w.setupLightsView(z),oe===!0&&It.setGlobalState(I.clippingPlanes,z),io(M,G,z),X.updateMultisampleRenderTarget(_t),X.updateRenderTargetMipmap(_t),ne.has("WEBGL_multisampled_render_to_texture")===!1){let Pt=!1;for(let xe=0,Oe=F.length;xe<Oe;xe++){const Ue=F[xe],{object:Se,geometry:en,material:vt,group:vn}=Ue;if(vt.side===on&&Se.layers.test(z.layers)){const le=vt.side;vt.side=cn,vt.needsUpdate=!0,Ah(Se,G,z,en,vt,vn),vt.side=le,vt.needsUpdate=!0,Pt=!0}}Pt===!0&&(X.updateMultisampleRenderTarget(_t),X.updateRenderTargetMipmap(_t))}I.setRenderTarget(gt,St,Ct),I.setClearColor(re,Zt),Yt!==void 0&&(z.viewport=Yt),I.toneMapping=Xt}function io(M,F,G){const z=F.isScene===!0?F.overrideMaterial:null;for(let H=0,_t=M.length;H<_t;H++){const yt=M[H],{object:gt,geometry:St,group:Ct}=yt;let Xt=yt.material;Xt.allowOverride===!0&&z!==null&&(Xt=z),gt.layers.test(G.layers)&&Ah(gt,F,G,St,Xt,Ct)}}function Ah(M,F,G,z,H,_t){M.onBeforeRender(I,F,G,z,H,_t),M.modelViewMatrix.multiplyMatrices(G.matrixWorldInverse,M.matrixWorld),M.normalMatrix.getNormalMatrix(M.modelViewMatrix),H.onBeforeRender(I,F,G,z,M,_t),H.transparent===!0&&H.side===on&&H.forceSinglePass===!1?(H.side=cn,H.needsUpdate=!0,I.renderBufferDirect(G,F,z,H,M,_t),H.side=bi,H.needsUpdate=!0,I.renderBufferDirect(G,F,z,H,M,_t),H.side=on):I.renderBufferDirect(G,F,z,H,M,_t),M.onAfterRender(I,F,G,z,H,_t)}function so(M,F,G){F.isScene!==!0&&(F=de);const z=B.get(M),H=w.state.lights,_t=w.state.shadowsArray,yt=H.state.version,gt=rt.getParameters(M,H.state,_t,F,G,w.state.lightProbeGridArray),St=rt.getProgramCacheKey(gt);let Ct=z.programs;z.environment=M.isMeshStandardMaterial||M.isMeshLambertMaterial||M.isMeshPhongMaterial?F.environment:null,z.fog=F.fog;const Xt=M.isMeshStandardMaterial||M.isMeshLambertMaterial&&!M.envMap||M.isMeshPhongMaterial&&!M.envMap;z.envMap=st.get(M.envMap||z.environment,Xt),z.envMapRotation=z.environment!==null&&M.envMap===null?F.environmentRotation:M.envMapRotation,Ct===void 0&&(M.addEventListener("dispose",qn),Ct=new Map,z.programs=Ct);let Yt=Ct.get(St);if(Yt!==void 0){if(z.currentProgram===Yt&&z.lightsStateVersion===yt)return Rh(M,gt),Yt}else gt.uniforms=rt.getUniforms(M),U!==null&&M.isNodeMaterial&&U.build(M,G,gt),M.onBeforeCompile(gt,I),Yt=rt.acquireProgram(gt,St),Ct.set(St,Yt),z.uniforms=gt.uniforms;const Pt=z.uniforms;return(!M.isShaderMaterial&&!M.isRawShaderMaterial||M.clipping===!0)&&(Pt.clippingPlanes=It.uniform),Rh(M,gt),z.needsLights=Sp(M),z.lightsStateVersion=yt,z.needsLights&&(Pt.ambientLightColor.value=H.state.ambient,Pt.lightProbe.value=H.state.probe,Pt.directionalLights.value=H.state.directional,Pt.directionalLightShadows.value=H.state.directionalShadow,Pt.spotLights.value=H.state.spot,Pt.spotLightShadows.value=H.state.spotShadow,Pt.rectAreaLights.value=H.state.rectArea,Pt.ltc_1.value=H.state.rectAreaLTC1,Pt.ltc_2.value=H.state.rectAreaLTC2,Pt.pointLights.value=H.state.point,Pt.pointLightShadows.value=H.state.pointShadow,Pt.hemisphereLights.value=H.state.hemi,Pt.directionalShadowMatrix.value=H.state.directionalShadowMatrix,Pt.spotLightMatrix.value=H.state.spotLightMatrix,Pt.spotLightMap.value=H.state.spotLightMap,Pt.pointShadowMatrix.value=H.state.pointShadowMatrix),z.lightProbeGrid=w.state.lightProbeGridArray.length>0,z.currentProgram=Yt,z.uniformsList=null,Yt}function Ch(M){if(M.uniformsList===null){const F=M.currentProgram.getUniforms();M.uniformsList=qo.seqWithValue(F.seq,M.uniforms)}return M.uniformsList}function Rh(M,F){const G=B.get(M);G.outputColorSpace=F.outputColorSpace,G.batching=F.batching,G.batchingColor=F.batchingColor,G.instancing=F.instancing,G.instancingColor=F.instancingColor,G.instancingMorph=F.instancingMorph,G.skinning=F.skinning,G.morphTargets=F.morphTargets,G.morphNormals=F.morphNormals,G.morphColors=F.morphColors,G.morphTargetsCount=F.morphTargetsCount,G.numClippingPlanes=F.numClippingPlanes,G.numIntersection=F.numClipIntersection,G.vertexAlphas=F.vertexAlphas,G.vertexTangents=F.vertexTangents,G.toneMapping=F.toneMapping}function yp(M,F){if(M.length===0)return null;if(M.length===1)return M[0].texture!==null?M[0]:null;y.setFromMatrixPosition(F.matrixWorld);for(let G=0,z=M.length;G<z;G++){const H=M[G];if(H.texture!==null&&H.boundingBox.containsPoint(y))return H}return null}function Mp(M,F,G,z,H){F.isScene!==!0&&(F=de),X.resetTextureUnits();const _t=F.fog,yt=z.isMeshStandardMaterial||z.isMeshLambertMaterial||z.isMeshPhongMaterial?F.environment:null,gt=Q===null?I.outputColorSpace:Q.isXRRenderTarget===!0?Q.texture.colorSpace:Qt.workingColorSpace,St=z.isMeshStandardMaterial||z.isMeshLambertMaterial&&!z.envMap||z.isMeshPhongMaterial&&!z.envMap,Ct=st.get(z.envMap||yt,St),Xt=z.vertexColors===!0&&!!G.attributes.color&&G.attributes.color.itemSize===4,Yt=!!G.attributes.tangent&&(!!z.normalMap||z.anisotropy>0),Pt=!!G.morphAttributes.position,xe=!!G.morphAttributes.normal,Oe=!!G.morphAttributes.color;let Ue=zn;z.toneMapped&&(Q===null||Q.isXRRenderTarget===!0)&&(Ue=I.toneMapping);const Se=G.morphAttributes.position||G.morphAttributes.normal||G.morphAttributes.color,en=Se!==void 0?Se.length:0,vt=B.get(z),vn=w.state.lights;if(oe===!0&&(ee===!0||M!==ft)){const Ae=M===ft&&z.id===it;It.setState(z,M,Ae)}let le=!1;z.version===vt.__version?(vt.needsLights&&vt.lightsStateVersion!==vn.state.version||vt.outputColorSpace!==gt||H.isBatchedMesh&&vt.batching===!1||!H.isBatchedMesh&&vt.batching===!0||H.isBatchedMesh&&vt.batchingColor===!0&&H.colorTexture===null||H.isBatchedMesh&&vt.batchingColor===!1&&H.colorTexture!==null||H.isInstancedMesh&&vt.instancing===!1||!H.isInstancedMesh&&vt.instancing===!0||H.isSkinnedMesh&&vt.skinning===!1||!H.isSkinnedMesh&&vt.skinning===!0||H.isInstancedMesh&&vt.instancingColor===!0&&H.instanceColor===null||H.isInstancedMesh&&vt.instancingColor===!1&&H.instanceColor!==null||H.isInstancedMesh&&vt.instancingMorph===!0&&H.morphTexture===null||H.isInstancedMesh&&vt.instancingMorph===!1&&H.morphTexture!==null||vt.envMap!==Ct||z.fog===!0&&vt.fog!==_t||vt.numClippingPlanes!==void 0&&(vt.numClippingPlanes!==It.numPlanes||vt.numIntersection!==It.numIntersection)||vt.vertexAlphas!==Xt||vt.vertexTangents!==Yt||vt.morphTargets!==Pt||vt.morphNormals!==xe||vt.morphColors!==Oe||vt.toneMapping!==Ue||vt.morphTargetsCount!==en||!!vt.lightProbeGrid!=w.state.lightProbeGridArray.length>0)&&(le=!0):(le=!0,vt.__version=z.version);let An=vt.currentProgram;le===!0&&(An=so(z,F,H),U&&z.isNodeMaterial&&U.onUpdateProgram(z,An,vt));let $n=!1,Ti=!1,hs=!1;const we=An.getUniforms(),ke=vt.uniforms;if(x.useProgram(An.program)&&($n=!0,Ti=!0,hs=!0),z.id!==it&&(it=z.id,Ti=!0),vt.needsLights){const Ae=yp(w.state.lightProbeGridArray,H);vt.lightProbeGrid!==Ae&&(vt.lightProbeGrid=Ae,Ti=!0)}if($n||ft!==M){x.buffers.depth.getReversed()&&M.reversedDepth!==!0&&(M._reversedDepth=!0,M.updateProjectionMatrix()),we.setValue(N,"projectionMatrix",M.projectionMatrix),we.setValue(N,"viewMatrix",M.matrixWorldInverse);const Ci=we.map.cameraPosition;Ci!==void 0&&Ci.setValue(N,ae.setFromMatrixPosition(M.matrixWorld)),C.logarithmicDepthBuffer&&we.setValue(N,"logDepthBufFC",2/(Math.log(M.far+1)/Math.LN2)),(z.isMeshPhongMaterial||z.isMeshToonMaterial||z.isMeshLambertMaterial||z.isMeshBasicMaterial||z.isMeshStandardMaterial||z.isShaderMaterial)&&we.setValue(N,"isOrthographic",M.isOrthographicCamera===!0),ft!==M&&(ft=M,Ti=!0,hs=!0)}if(vt.needsLights&&(vn.state.directionalShadowMap.length>0&&we.setValue(N,"directionalShadowMap",vn.state.directionalShadowMap,X),vn.state.spotShadowMap.length>0&&we.setValue(N,"spotShadowMap",vn.state.spotShadowMap,X),vn.state.pointShadowMap.length>0&&we.setValue(N,"pointShadowMap",vn.state.pointShadowMap,X)),H.isSkinnedMesh){we.setOptional(N,H,"bindMatrix"),we.setOptional(N,H,"bindMatrixInverse");const Ae=H.skeleton;Ae&&(Ae.boneTexture===null&&Ae.computeBoneTexture(),we.setValue(N,"boneTexture",Ae.boneTexture,X))}H.isBatchedMesh&&(we.setOptional(N,H,"batchingTexture"),we.setValue(N,"batchingTexture",H._matricesTexture,X),we.setOptional(N,H,"batchingIdTexture"),we.setValue(N,"batchingIdTexture",H._indirectTexture,X),we.setOptional(N,H,"batchingColorTexture"),H._colorsTexture!==null&&we.setValue(N,"batchingColorTexture",H._colorsTexture,X));const Ai=G.morphAttributes;if((Ai.position!==void 0||Ai.normal!==void 0||Ai.color!==void 0)&&D.update(H,G,An),(Ti||vt.receiveShadow!==H.receiveShadow)&&(vt.receiveShadow=H.receiveShadow,we.setValue(N,"receiveShadow",H.receiveShadow)),(z.isMeshStandardMaterial||z.isMeshLambertMaterial||z.isMeshPhongMaterial)&&z.envMap===null&&F.environment!==null&&(ke.envMapIntensity.value=F.environmentIntensity),ke.dfgLUT!==void 0&&(ke.dfgLUT.value=Hy()),Ti){if(we.setValue(N,"toneMappingExposure",I.toneMappingExposure),vt.needsLights&&bp(ke,hs),_t&&z.fog===!0&&Mt.refreshFogUniforms(ke,_t),Mt.refreshMaterialUniforms(ke,z,et,ht,w.state.transmissionRenderTarget[M.id]),vt.needsLights&&vt.lightProbeGrid){const Ae=vt.lightProbeGrid;ke.probesSH.value=Ae.texture,ke.probesMin.value.copy(Ae.boundingBox.min),ke.probesMax.value.copy(Ae.boundingBox.max),ke.probesResolution.value.copy(Ae.resolution)}qo.upload(N,Ch(vt),ke,X)}if(z.isShaderMaterial&&z.uniformsNeedUpdate===!0&&(qo.upload(N,Ch(vt),ke,X),z.uniformsNeedUpdate=!1),z.isSpriteMaterial&&we.setValue(N,"center",H.center),we.setValue(N,"modelViewMatrix",H.modelViewMatrix),we.setValue(N,"normalMatrix",H.normalMatrix),we.setValue(N,"modelMatrix",H.matrixWorld),z.uniformsGroups!==void 0){const Ae=z.uniformsGroups;for(let Ci=0,us=Ae.length;Ci<us;Ci++){const Ph=Ae[Ci];tt.update(Ph,An),tt.bind(Ph,An)}}return An}function bp(M,F){M.ambientLightColor.needsUpdate=F,M.lightProbe.needsUpdate=F,M.directionalLights.needsUpdate=F,M.directionalLightShadows.needsUpdate=F,M.pointLights.needsUpdate=F,M.pointLightShadows.needsUpdate=F,M.spotLights.needsUpdate=F,M.spotLightShadows.needsUpdate=F,M.rectAreaLights.needsUpdate=F,M.hemisphereLights.needsUpdate=F}function Sp(M){return M.isMeshLambertMaterial||M.isMeshToonMaterial||M.isMeshPhongMaterial||M.isMeshStandardMaterial||M.isShadowMaterial||M.isShaderMaterial&&M.lights===!0}this.getActiveCubeFace=function(){return $},this.getActiveMipmapLevel=function(){return V},this.getRenderTarget=function(){return Q},this.setRenderTargetTextures=function(M,F,G){const z=B.get(M);z.__autoAllocateDepthBuffer=M.resolveDepthBuffer===!1,z.__autoAllocateDepthBuffer===!1&&(z.__useRenderToTexture=!1),B.get(M.texture).__webglTexture=F,B.get(M.depthTexture).__webglTexture=z.__autoAllocateDepthBuffer?void 0:G,z.__hasExternalTextures=!0},this.setRenderTargetFramebuffer=function(M,F){const G=B.get(M);G.__webglFramebuffer=F,G.__useDefaultFramebuffer=F===void 0},this.setRenderTarget=function(M,F=0,G=0){Q=M,$=F,V=G;let z=null,H=!1,_t=!1;if(M){const gt=B.get(M);if(gt.__useDefaultFramebuffer!==void 0){x.bindFramebuffer(N.FRAMEBUFFER,gt.__webglFramebuffer),at.copy(M.viewport),Y.copy(M.scissor),Bt=M.scissorTest,x.viewport(at),x.scissor(Y),x.setScissorTest(Bt),it=-1;return}else if(gt.__webglFramebuffer===void 0)X.setupRenderTarget(M);else if(gt.__hasExternalTextures)X.rebindTextures(M,B.get(M.texture).__webglTexture,B.get(M.depthTexture).__webglTexture);else if(M.depthBuffer){const Xt=M.depthTexture;if(gt.__boundDepthTexture!==Xt){if(Xt!==null&&B.has(Xt)&&(M.width!==Xt.image.width||M.height!==Xt.image.height))throw new Error("THREE.WebGLRenderer: Attached DepthTexture is initialized to the incorrect size.");X.setupDepthRenderbuffer(M)}}const St=M.texture;(St.isData3DTexture||St.isDataArrayTexture||St.isCompressedArrayTexture)&&(_t=!0);const Ct=B.get(M).__webglFramebuffer;M.isWebGLCubeRenderTarget?(Array.isArray(Ct[F])?z=Ct[F][G]:z=Ct[F],H=!0):M.samples>0&&X.useMultisampledRTT(M)===!1?z=B.get(M).__webglMultisampledFramebuffer:Array.isArray(Ct)?z=Ct[G]:z=Ct,at.copy(M.viewport),Y.copy(M.scissor),Bt=M.scissorTest}else at.copy(Lt).multiplyScalar(et).floor(),Y.copy(Ie).multiplyScalar(et).floor(),Bt=Gt;if(G!==0&&(z=W),x.bindFramebuffer(N.FRAMEBUFFER,z)&&x.drawBuffers(M,z),x.viewport(at),x.scissor(Y),x.setScissorTest(Bt),H){const gt=B.get(M.texture);N.framebufferTexture2D(N.FRAMEBUFFER,N.COLOR_ATTACHMENT0,N.TEXTURE_CUBE_MAP_POSITIVE_X+F,gt.__webglTexture,G)}else if(_t){const gt=F;for(let St=0;St<M.textures.length;St++){const Ct=B.get(M.textures[St]);N.framebufferTextureLayer(N.FRAMEBUFFER,N.COLOR_ATTACHMENT0+St,Ct.__webglTexture,G,gt)}}else if(M!==null&&G!==0){const gt=B.get(M.texture);N.framebufferTexture2D(N.FRAMEBUFFER,N.COLOR_ATTACHMENT0,N.TEXTURE_2D,gt.__webglTexture,G)}it=-1},this.readRenderTargetPixels=function(M,F,G,z,H,_t,yt,gt=0){if(!(M&&M.isWebGLRenderTarget)){Ot("WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");return}let St=B.get(M).__webglFramebuffer;if(M.isWebGLCubeRenderTarget&&yt!==void 0&&(St=St[yt]),St){x.bindFramebuffer(N.FRAMEBUFFER,St);try{const Ct=M.textures[gt],Xt=Ct.format,Yt=Ct.type;if(M.textures.length>1&&N.readBuffer(N.COLOR_ATTACHMENT0+gt),!C.textureFormatReadable(Xt)){Ot("WebGLRenderer.readRenderTargetPixels: renderTarget is not in RGBA or implementation defined format.");return}if(!C.textureTypeReadable(Yt)){Ot("WebGLRenderer.readRenderTargetPixels: renderTarget is not in UnsignedByteType or implementation defined type.");return}F>=0&&F<=M.width-z&&G>=0&&G<=M.height-H&&N.readPixels(F,G,z,H,pt.convert(Xt),pt.convert(Yt),_t)}finally{const Ct=Q!==null?B.get(Q).__webglFramebuffer:null;x.bindFramebuffer(N.FRAMEBUFFER,Ct)}}},this.readRenderTargetPixelsAsync=async function(M,F,G,z,H,_t,yt,gt=0){if(!(M&&M.isWebGLRenderTarget))throw new Error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");let St=B.get(M).__webglFramebuffer;if(M.isWebGLCubeRenderTarget&&yt!==void 0&&(St=St[yt]),St)if(F>=0&&F<=M.width-z&&G>=0&&G<=M.height-H){x.bindFramebuffer(N.FRAMEBUFFER,St);const Ct=M.textures[gt],Xt=Ct.format,Yt=Ct.type;if(M.textures.length>1&&N.readBuffer(N.COLOR_ATTACHMENT0+gt),!C.textureFormatReadable(Xt))throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in RGBA or implementation defined format.");if(!C.textureTypeReadable(Yt))throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in UnsignedByteType or implementation defined type.");const Pt=N.createBuffer();N.bindBuffer(N.PIXEL_PACK_BUFFER,Pt),N.bufferData(N.PIXEL_PACK_BUFFER,_t.byteLength,N.STREAM_READ),N.readPixels(F,G,z,H,pt.convert(Xt),pt.convert(Yt),0);const xe=Q!==null?B.get(Q).__webglFramebuffer:null;x.bindFramebuffer(N.FRAMEBUFFER,xe);const Oe=N.fenceSync(N.SYNC_GPU_COMMANDS_COMPLETE,0);return N.flush(),await dm(N,Oe,4),N.bindBuffer(N.PIXEL_PACK_BUFFER,Pt),N.getBufferSubData(N.PIXEL_PACK_BUFFER,0,_t),N.deleteBuffer(Pt),N.deleteSync(Oe),_t}else throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: requested read bounds are out of range.")},this.copyFramebufferToTexture=function(M,F=null,G=0){const z=Math.pow(2,-G),H=Math.floor(M.image.width*z),_t=Math.floor(M.image.height*z),yt=F!==null?F.x:0,gt=F!==null?F.y:0;X.setTexture2D(M,0),N.copyTexSubImage2D(N.TEXTURE_2D,G,0,0,yt,gt,H,_t),x.unbindTexture()},this.copyTextureToTexture=function(M,F,G=null,z=null,H=0,_t=0){let yt,gt,St,Ct,Xt,Yt,Pt,xe,Oe;const Ue=M.isCompressedTexture?M.mipmaps[_t]:M.image;if(G!==null)yt=G.max.x-G.min.x,gt=G.max.y-G.min.y,St=G.isBox3?G.max.z-G.min.z:1,Ct=G.min.x,Xt=G.min.y,Yt=G.isBox3?G.min.z:0;else{const ke=Math.pow(2,-H);yt=Math.floor(Ue.width*ke),gt=Math.floor(Ue.height*ke),M.isDataArrayTexture?St=Ue.depth:M.isData3DTexture?St=Math.floor(Ue.depth*ke):St=1,Ct=0,Xt=0,Yt=0}z!==null?(Pt=z.x,xe=z.y,Oe=z.z):(Pt=0,xe=0,Oe=0);const Se=pt.convert(F.format),en=pt.convert(F.type);let vt;F.isData3DTexture?(X.setTexture3D(F,0),vt=N.TEXTURE_3D):F.isDataArrayTexture||F.isCompressedArrayTexture?(X.setTexture2DArray(F,0),vt=N.TEXTURE_2D_ARRAY):(X.setTexture2D(F,0),vt=N.TEXTURE_2D),x.activeTexture(N.TEXTURE0),x.pixelStorei(N.UNPACK_FLIP_Y_WEBGL,F.flipY),x.pixelStorei(N.UNPACK_PREMULTIPLY_ALPHA_WEBGL,F.premultiplyAlpha),x.pixelStorei(N.UNPACK_ALIGNMENT,F.unpackAlignment);const vn=x.getParameter(N.UNPACK_ROW_LENGTH),le=x.getParameter(N.UNPACK_IMAGE_HEIGHT),An=x.getParameter(N.UNPACK_SKIP_PIXELS),$n=x.getParameter(N.UNPACK_SKIP_ROWS),Ti=x.getParameter(N.UNPACK_SKIP_IMAGES);x.pixelStorei(N.UNPACK_ROW_LENGTH,Ue.width),x.pixelStorei(N.UNPACK_IMAGE_HEIGHT,Ue.height),x.pixelStorei(N.UNPACK_SKIP_PIXELS,Ct),x.pixelStorei(N.UNPACK_SKIP_ROWS,Xt),x.pixelStorei(N.UNPACK_SKIP_IMAGES,Yt);const hs=M.isDataArrayTexture||M.isData3DTexture,we=F.isDataArrayTexture||F.isData3DTexture;if(M.isDepthTexture){const ke=B.get(M),Ai=B.get(F),Ae=B.get(ke.__renderTarget),Ci=B.get(Ai.__renderTarget);x.bindFramebuffer(N.READ_FRAMEBUFFER,Ae.__webglFramebuffer),x.bindFramebuffer(N.DRAW_FRAMEBUFFER,Ci.__webglFramebuffer);for(let us=0;us<St;us++)hs&&(N.framebufferTextureLayer(N.READ_FRAMEBUFFER,N.COLOR_ATTACHMENT0,B.get(M).__webglTexture,H,Yt+us),N.framebufferTextureLayer(N.DRAW_FRAMEBUFFER,N.COLOR_ATTACHMENT0,B.get(F).__webglTexture,_t,Oe+us)),N.blitFramebuffer(Ct,Xt,yt,gt,Pt,xe,yt,gt,N.DEPTH_BUFFER_BIT,N.NEAREST);x.bindFramebuffer(N.READ_FRAMEBUFFER,null),x.bindFramebuffer(N.DRAW_FRAMEBUFFER,null)}else if(H!==0||M.isRenderTargetTexture||B.has(M)){const ke=B.get(M),Ai=B.get(F);x.bindFramebuffer(N.READ_FRAMEBUFFER,K),x.bindFramebuffer(N.DRAW_FRAMEBUFFER,k);for(let Ae=0;Ae<St;Ae++)hs?N.framebufferTextureLayer(N.READ_FRAMEBUFFER,N.COLOR_ATTACHMENT0,ke.__webglTexture,H,Yt+Ae):N.framebufferTexture2D(N.READ_FRAMEBUFFER,N.COLOR_ATTACHMENT0,N.TEXTURE_2D,ke.__webglTexture,H),we?N.framebufferTextureLayer(N.DRAW_FRAMEBUFFER,N.COLOR_ATTACHMENT0,Ai.__webglTexture,_t,Oe+Ae):N.framebufferTexture2D(N.DRAW_FRAMEBUFFER,N.COLOR_ATTACHMENT0,N.TEXTURE_2D,Ai.__webglTexture,_t),H!==0?N.blitFramebuffer(Ct,Xt,yt,gt,Pt,xe,yt,gt,N.COLOR_BUFFER_BIT,N.NEAREST):we?N.copyTexSubImage3D(vt,_t,Pt,xe,Oe+Ae,Ct,Xt,yt,gt):N.copyTexSubImage2D(vt,_t,Pt,xe,Ct,Xt,yt,gt);x.bindFramebuffer(N.READ_FRAMEBUFFER,null),x.bindFramebuffer(N.DRAW_FRAMEBUFFER,null)}else we?M.isDataTexture||M.isData3DTexture?N.texSubImage3D(vt,_t,Pt,xe,Oe,yt,gt,St,Se,en,Ue.data):F.isCompressedArrayTexture?N.compressedTexSubImage3D(vt,_t,Pt,xe,Oe,yt,gt,St,Se,Ue.data):N.texSubImage3D(vt,_t,Pt,xe,Oe,yt,gt,St,Se,en,Ue):M.isDataTexture?N.texSubImage2D(N.TEXTURE_2D,_t,Pt,xe,yt,gt,Se,en,Ue.data):M.isCompressedTexture?N.compressedTexSubImage2D(N.TEXTURE_2D,_t,Pt,xe,Ue.width,Ue.height,Se,Ue.data):N.texSubImage2D(N.TEXTURE_2D,_t,Pt,xe,yt,gt,Se,en,Ue);x.pixelStorei(N.UNPACK_ROW_LENGTH,vn),x.pixelStorei(N.UNPACK_IMAGE_HEIGHT,le),x.pixelStorei(N.UNPACK_SKIP_PIXELS,An),x.pixelStorei(N.UNPACK_SKIP_ROWS,$n),x.pixelStorei(N.UNPACK_SKIP_IMAGES,Ti),_t===0&&F.generateMipmaps&&N.generateMipmap(vt),x.unbindTexture()},this.initRenderTarget=function(M){B.get(M).__webglFramebuffer===void 0&&X.setupRenderTarget(M)},this.initTexture=function(M){M.isCubeTexture?X.setTextureCube(M,0):M.isData3DTexture?X.setTexture3D(M,0):M.isDataArrayTexture||M.isCompressedArrayTexture?X.setTexture2DArray(M,0):X.setTexture2D(M,0),x.unbindTexture()},this.resetState=function(){$=0,V=0,Q=null,x.reset(),xt.reset()},typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}get coordinateSystem(){return ni}get outputColorSpace(){return this._outputColorSpace}set outputColorSpace(t){this._outputColorSpace=t;const e=this.getContext();e.drawingBufferColorSpace=Qt._getDrawingBufferColorSpace(t),e.unpackColorSpace=Qt._getUnpackColorSpace()}}class th{constructor(t,e,n){R(this,"mesh");this.texture=t;const i=new Le({map:t,color:n,side:cn,depthWrite:!1,depthTest:!1,fog:!1,toneMapped:!1});i.onBeforeCompile=o=>{o.uniforms.horizonRadius={value:e.radius},o.uniforms.horizonHeight={value:e.height},o.uniforms.horizonTop={value:e.footY},o.uniforms.horizonRepeat={value:e.repeat??6},o.vertexShader=`varying vec3 skyDirection;
`+o.vertexShader,o.vertexShader=o.vertexShader.replace("#include <begin_vertex>",`#include <begin_vertex>
skyDirection = position;`),o.fragmentShader=`
varying vec3 skyDirection;
uniform float horizonRadius;
uniform float horizonHeight;
uniform float horizonTop;
uniform float horizonRepeat;
float mirrorTile(float v) { return 1.0 - abs(mod(v, 2.0) - 1.0); }
`+o.fragmentShader,o.fragmentShader=o.fragmentShader.replace("#include <map_fragment>",`
vec3 direction = normalize(skyDirection);
float azimuth = fract(atan(direction.x, direction.z) / 6.28318530718 + 1.0);
float horizontal = max(length(direction.xz), 0.0001);
float hitY = cameraPosition.y + horizonRadius * direction.y / horizontal;
float horizonV = (hitY - horizonTop + horizonHeight) / horizonHeight;
float tile = mirrorTile(azimuth * horizonRepeat);
vec3 horizonColor = texture2D(map, vec2(tile, clamp(horizonV, 0.001, 0.999))).rgb;
// Reuse only the cloud-filled upper middle of the same painting. No new PNG,
// no solid-colour ceiling, and no tower silhouettes stretched over the zenith.
// Planar direction sampling is continuous at the azimuth seam AND the zenith.
vec2 cloudUV = vec2(0.40, 0.89) + direction.xz * vec2(0.10, 0.085);
vec3 cloudColor = texture2D(map, cloudUV).rgb;
float skyBlend = smoothstep(0.80, 1.0, horizonV);
diffuseColor.rgb *= mix(horizonColor, cloudColor, skyBlend);
`)},i.customProgramCacheKey=()=>"forest-continuous-sky-v1",this.mesh=new te(new nr(1,48,24),i),this.mesh.name="forest_sky",this.mesh.frustumCulled=!1,this.mesh.renderOrder=-100;const s=new P;this.mesh.onBeforeRender=(o,a,l)=>{l.getWorldPosition(s),this.mesh.position.copy(s);const c=l.far;this.mesh.scale.setScalar(Math.min(500,c*.8)),this.mesh.updateMatrixWorld(!0)}}static async load(t,e="#ffffff"){const n=await new Zc().loadAsync(t.url);return n.colorSpace=Be,n.wrapS=n.wrapT=Dn,new th(n,t,e)}dispose(){this.mesh.removeFromParent(),this.mesh.geometry.dispose(),this.mesh.material.dispose(),this.texture.dispose()}}function Ju(r,t){if(t===Qp)return console.warn("THREE.BufferGeometryUtils.toTrianglesDrawMode(): Geometry already defined as triangles."),r;if(t===cc||t===ff){let e=r.getIndex();if(e===null){const o=[],a=r.getAttribute("position");if(a!==void 0){for(let l=0;l<a.count;l++)o.push(l);r.setIndex(o),e=r.getIndex()}else return console.error("THREE.BufferGeometryUtils.toTrianglesDrawMode(): Undefined position attribute. Processing not possible."),r}const n=e.count-2,i=[];if(t===cc)for(let o=1;o<=n;o++)i.push(e.getX(0)),i.push(e.getX(o)),i.push(e.getX(o+1));else for(let o=0;o<n;o++)o%2===0?(i.push(e.getX(o)),i.push(e.getX(o+1)),i.push(e.getX(o+2))):(i.push(e.getX(o+2)),i.push(e.getX(o+1)),i.push(e.getX(o)));i.length/3!==n&&console.error("THREE.BufferGeometryUtils.toTrianglesDrawMode(): Unable to generate correct amount of triangles.");const s=r.clone();return s.setIndex(i),s.clearGroups(),s}else return console.error("THREE.BufferGeometryUtils.toTrianglesDrawMode(): Unknown draw mode:",t),r}function sr(r){const t=new Map,e=new Map,n=r.clone();return Xf(r,n,function(i,s){t.set(s,i),e.set(i,s)}),n.traverse(function(i){if(!i.isSkinnedMesh)return;const s=i,o=t.get(i),a=o.skeleton.bones;s.skeleton=o.skeleton.clone(),s.bindMatrix.copy(o.bindMatrix),s.skeleton.bones=a.map(function(l){return e.get(l)}),s.bind(s.skeleton,s.bindMatrix)}),n}function Xf(r,t,e){e(r,t);for(let n=0;n<r.children.length;n++)Xf(r.children[n],t.children[n],e)}class Gn extends cr{constructor(t){super(t),this.dracoLoader=null,this.ktx2Loader=null,this.meshoptDecoder=null,this.pluginCallbacks=[],this.register(function(e){return new qy(e)}),this.register(function(e){return new $y(e)}),this.register(function(e){return new nM(e)}),this.register(function(e){return new iM(e)}),this.register(function(e){return new sM(e)}),this.register(function(e){return new Ky(e)}),this.register(function(e){return new Zy(e)}),this.register(function(e){return new jy(e)}),this.register(function(e){return new Jy(e)}),this.register(function(e){return new Xy(e)}),this.register(function(e){return new Qy(e)}),this.register(function(e){return new Yy(e)}),this.register(function(e){return new eM(e)}),this.register(function(e){return new tM(e)}),this.register(function(e){return new Gy(e)}),this.register(function(e){return new Qu(e,Jt.EXT_MESHOPT_COMPRESSION)}),this.register(function(e){return new Qu(e,Jt.KHR_MESHOPT_COMPRESSION)}),this.register(function(e){return new rM(e)})}load(t,e,n,i){const s=this;let o;if(this.resourcePath!=="")o=this.resourcePath;else if(this.path!==""){const c=Nr.extractUrlBase(t);o=Nr.resolveURL(c,this.path)}else o=Nr.extractUrlBase(t);this.manager.itemStart(t);const a=function(c){i?i(c):console.error(c),s.manager.itemError(t),s.manager.itemEnd(t)},l=new Df(this.manager);l.setPath(this.path),l.setResponseType("arraybuffer"),l.setRequestHeader(this.requestHeader),l.setWithCredentials(this.withCredentials),l.load(t,function(c){try{s.parse(c,o,function(h){e(h),s.manager.itemEnd(t)},a)}catch(h){a(h)}},n,a)}setDRACOLoader(t){return this.dracoLoader=t,this}setKTX2Loader(t){return this.ktx2Loader=t,this}setMeshoptDecoder(t){return this.meshoptDecoder=t,this}register(t){return this.pluginCallbacks.indexOf(t)===-1&&this.pluginCallbacks.push(t),this}unregister(t){return this.pluginCallbacks.indexOf(t)!==-1&&this.pluginCallbacks.splice(this.pluginCallbacks.indexOf(t),1),this}parse(t,e,n,i){let s;const o={},a={},l=new TextDecoder;if(typeof t=="string")s=JSON.parse(t);else if(t instanceof ArrayBuffer)if(l.decode(new Uint8Array(t,0,4))===qf){try{o[Jt.KHR_BINARY_GLTF]=new oM(t)}catch(u){i&&i(u);return}s=JSON.parse(o[Jt.KHR_BINARY_GLTF].content)}else s=JSON.parse(l.decode(t));else s=t;if(s.asset===void 0||s.asset.version[0]<2){i&&i(new Error("THREE.GLTFLoader: Unsupported asset. glTF versions >=2.0 are supported."));return}const c=new vM(s,{path:e||this.resourcePath||"",crossOrigin:this.crossOrigin,requestHeader:this.requestHeader,manager:this.manager,ktx2Loader:this.ktx2Loader,meshoptDecoder:this.meshoptDecoder});c.fileLoader.setRequestHeader(this.requestHeader);for(let h=0;h<this.pluginCallbacks.length;h++){const u=this.pluginCallbacks[h](c);u.name||console.error("THREE.GLTFLoader: Invalid plugin found: missing name"),a[u.name]=u,o[u.name]=!0}if(s.extensionsUsed)for(let h=0;h<s.extensionsUsed.length;++h){const u=s.extensionsUsed[h],d=s.extensionsRequired||[];switch(u){case Jt.KHR_MATERIALS_UNLIT:o[u]=new Wy;break;case Jt.KHR_DRACO_MESH_COMPRESSION:o[u]=new aM(s,this.dracoLoader);break;case Jt.KHR_TEXTURE_TRANSFORM:o[u]=new lM;break;case Jt.KHR_MESH_QUANTIZATION:o[u]=new cM;break;default:d.indexOf(u)>=0&&a[u]===void 0&&console.warn('THREE.GLTFLoader: Unknown extension "'+u+'".')}}c.setExtensions(o),c.setPlugins(a),c.parse(n,i)}parseAsync(t,e){const n=this;return new Promise(function(i,s){n.parse(t,e,i,s)})}}function Vy(){let r={};return{get:function(t){return r[t]},add:function(t,e){r[t]=e},remove:function(t){delete r[t]},removeAll:function(){r={}}}}function He(r,t,e){const n=r.json.materials[t];return n.extensions&&n.extensions[e]?n.extensions[e]:null}const Jt={KHR_BINARY_GLTF:"KHR_binary_glTF",KHR_DRACO_MESH_COMPRESSION:"KHR_draco_mesh_compression",KHR_LIGHTS_PUNCTUAL:"KHR_lights_punctual",KHR_MATERIALS_CLEARCOAT:"KHR_materials_clearcoat",KHR_MATERIALS_DISPERSION:"KHR_materials_dispersion",KHR_MATERIALS_IOR:"KHR_materials_ior",KHR_MATERIALS_SHEEN:"KHR_materials_sheen",KHR_MATERIALS_SPECULAR:"KHR_materials_specular",KHR_MATERIALS_TRANSMISSION:"KHR_materials_transmission",KHR_MATERIALS_IRIDESCENCE:"KHR_materials_iridescence",KHR_MATERIALS_ANISOTROPY:"KHR_materials_anisotropy",KHR_MATERIALS_UNLIT:"KHR_materials_unlit",KHR_MATERIALS_VOLUME:"KHR_materials_volume",KHR_TEXTURE_BASISU:"KHR_texture_basisu",KHR_TEXTURE_TRANSFORM:"KHR_texture_transform",KHR_MESH_QUANTIZATION:"KHR_mesh_quantization",KHR_MATERIALS_EMISSIVE_STRENGTH:"KHR_materials_emissive_strength",EXT_MATERIALS_BUMP:"EXT_materials_bump",EXT_TEXTURE_WEBP:"EXT_texture_webp",EXT_TEXTURE_AVIF:"EXT_texture_avif",EXT_MESHOPT_COMPRESSION:"EXT_meshopt_compression",KHR_MESHOPT_COMPRESSION:"KHR_meshopt_compression",EXT_MESH_GPU_INSTANCING:"EXT_mesh_gpu_instancing"};class Gy{constructor(t){this.parser=t,this.name=Jt.KHR_LIGHTS_PUNCTUAL,this.cache={refs:{},uses:{}}}_markDefs(){const t=this.parser,e=this.parser.json.nodes||[];for(let n=0,i=e.length;n<i;n++){const s=e[n];s.extensions&&s.extensions[this.name]&&s.extensions[this.name].light!==void 0&&t._addNodeRef(this.cache,s.extensions[this.name].light)}}_loadLight(t){const e=this.parser,n="light:"+t;let i=e.cache.get(n);if(i)return i;const s=e.json,l=((s.extensions&&s.extensions[this.name]||{}).lights||[])[t];let c;const h=new Et(16777215);l.color!==void 0&&h.setRGB(l.color[0],l.color[1],l.color[2],Tn);const u=l.range!==void 0?l.range:0;switch(l.type){case"directional":c=new ia(h),c.target.position.set(0,0,-1),c.add(c.target);break;case"point":c=new Ag(h),c.distance=u;break;case"spot":c=new Eg(h),c.distance=u,l.spot=l.spot||{},l.spot.innerConeAngle=l.spot.innerConeAngle!==void 0?l.spot.innerConeAngle:0,l.spot.outerConeAngle=l.spot.outerConeAngle!==void 0?l.spot.outerConeAngle:Math.PI/4,c.angle=l.spot.outerConeAngle,c.penumbra=1-l.spot.innerConeAngle/l.spot.outerConeAngle,c.target.position.set(0,0,-1),c.add(c.target);break;default:throw new Error("THREE.GLTFLoader: Unexpected light type: "+l.type)}return c.position.set(0,0,0),Zn(c,l),l.intensity!==void 0&&(c.intensity=l.intensity),c.name=e.createUniqueName(l.name||"light_"+t),i=Promise.resolve(c),e.cache.add(n,i),i}getDependency(t,e){if(t==="light")return this._loadLight(e)}createNodeAttachment(t){const e=this,n=this.parser,s=n.json.nodes[t],a=(s.extensions&&s.extensions[this.name]||{}).light;return a===void 0?null:this._loadLight(a).then(function(l){return n._getNodeRef(e.cache,a,l)})}}class Wy{constructor(){this.name=Jt.KHR_MATERIALS_UNLIT}getMaterialType(){return Le}extendParams(t,e,n){const i=[];t.color=new Et(1,1,1),t.opacity=1;const s=e.pbrMetallicRoughness;if(s){if(Array.isArray(s.baseColorFactor)){const o=s.baseColorFactor;t.color.setRGB(o[0],o[1],o[2],Tn),t.opacity=o[3]}s.baseColorTexture!==void 0&&i.push(n.assignTexture(t,"map",s.baseColorTexture,Be))}return Promise.all(i)}}class Xy{constructor(t){this.parser=t,this.name=Jt.KHR_MATERIALS_EMISSIVE_STRENGTH}extendMaterialParams(t,e){const n=He(this.parser,t,this.name);return n===null||n.emissiveStrength!==void 0&&(e.emissiveIntensity=n.emissiveStrength),Promise.resolve()}}class qy{constructor(t){this.parser=t,this.name=Jt.KHR_MATERIALS_CLEARCOAT}getMaterialType(t){return He(this.parser,t,this.name)!==null?hi:null}extendMaterialParams(t,e){const n=He(this.parser,t,this.name);if(n===null)return Promise.resolve();const i=[];if(n.clearcoatFactor!==void 0&&(e.clearcoat=n.clearcoatFactor),n.clearcoatTexture!==void 0&&i.push(this.parser.assignTexture(e,"clearcoatMap",n.clearcoatTexture)),n.clearcoatRoughnessFactor!==void 0&&(e.clearcoatRoughness=n.clearcoatRoughnessFactor),n.clearcoatRoughnessTexture!==void 0&&i.push(this.parser.assignTexture(e,"clearcoatRoughnessMap",n.clearcoatRoughnessTexture)),n.clearcoatNormalTexture!==void 0&&(i.push(this.parser.assignTexture(e,"clearcoatNormalMap",n.clearcoatNormalTexture)),n.clearcoatNormalTexture.scale!==void 0)){const s=n.clearcoatNormalTexture.scale;e.clearcoatNormalScale=new At(s,s)}return Promise.all(i)}}class $y{constructor(t){this.parser=t,this.name=Jt.KHR_MATERIALS_DISPERSION}getMaterialType(t){return He(this.parser,t,this.name)!==null?hi:null}extendMaterialParams(t,e){const n=He(this.parser,t,this.name);return n===null||(e.dispersion=n.dispersion!==void 0?n.dispersion:0),Promise.resolve()}}class Yy{constructor(t){this.parser=t,this.name=Jt.KHR_MATERIALS_IRIDESCENCE}getMaterialType(t){return He(this.parser,t,this.name)!==null?hi:null}extendMaterialParams(t,e){const n=He(this.parser,t,this.name);if(n===null)return Promise.resolve();const i=[];return n.iridescenceFactor!==void 0&&(e.iridescence=n.iridescenceFactor),n.iridescenceTexture!==void 0&&i.push(this.parser.assignTexture(e,"iridescenceMap",n.iridescenceTexture)),n.iridescenceIor!==void 0&&(e.iridescenceIOR=n.iridescenceIor),e.iridescenceThicknessRange===void 0&&(e.iridescenceThicknessRange=[100,400]),n.iridescenceThicknessMinimum!==void 0&&(e.iridescenceThicknessRange[0]=n.iridescenceThicknessMinimum),n.iridescenceThicknessMaximum!==void 0&&(e.iridescenceThicknessRange[1]=n.iridescenceThicknessMaximum),n.iridescenceThicknessTexture!==void 0&&i.push(this.parser.assignTexture(e,"iridescenceThicknessMap",n.iridescenceThicknessTexture)),Promise.all(i)}}class Ky{constructor(t){this.parser=t,this.name=Jt.KHR_MATERIALS_SHEEN}getMaterialType(t){return He(this.parser,t,this.name)!==null?hi:null}extendMaterialParams(t,e){const n=He(this.parser,t,this.name);if(n===null)return Promise.resolve();const i=[];if(e.sheenColor=new Et(0,0,0),e.sheenRoughness=0,e.sheen=1,n.sheenColorFactor!==void 0){const s=n.sheenColorFactor;e.sheenColor.setRGB(s[0],s[1],s[2],Tn)}return n.sheenRoughnessFactor!==void 0&&(e.sheenRoughness=n.sheenRoughnessFactor),n.sheenColorTexture!==void 0&&i.push(this.parser.assignTexture(e,"sheenColorMap",n.sheenColorTexture,Be)),n.sheenRoughnessTexture!==void 0&&i.push(this.parser.assignTexture(e,"sheenRoughnessMap",n.sheenRoughnessTexture)),Promise.all(i)}}class Zy{constructor(t){this.parser=t,this.name=Jt.KHR_MATERIALS_TRANSMISSION}getMaterialType(t){return He(this.parser,t,this.name)!==null?hi:null}extendMaterialParams(t,e){const n=He(this.parser,t,this.name);if(n===null)return Promise.resolve();const i=[];return n.transmissionFactor!==void 0&&(e.transmission=n.transmissionFactor),n.transmissionTexture!==void 0&&i.push(this.parser.assignTexture(e,"transmissionMap",n.transmissionTexture)),Promise.all(i)}}class jy{constructor(t){this.parser=t,this.name=Jt.KHR_MATERIALS_VOLUME}getMaterialType(t){return He(this.parser,t,this.name)!==null?hi:null}extendMaterialParams(t,e){const n=He(this.parser,t,this.name);if(n===null)return Promise.resolve();const i=[];e.thickness=n.thicknessFactor!==void 0?n.thicknessFactor:0,n.thicknessTexture!==void 0&&i.push(this.parser.assignTexture(e,"thicknessMap",n.thicknessTexture)),e.attenuationDistance=n.attenuationDistance||1/0;const s=n.attenuationColor||[1,1,1];return e.attenuationColor=new Et().setRGB(s[0],s[1],s[2],Tn),Promise.all(i)}}class Jy{constructor(t){this.parser=t,this.name=Jt.KHR_MATERIALS_IOR}getMaterialType(t){return He(this.parser,t,this.name)!==null?hi:null}extendMaterialParams(t,e){const n=He(this.parser,t,this.name);return n===null||(e.ior=n.ior!==void 0?n.ior:1.5,e.ior===0&&(e.ior=1e3)),Promise.resolve()}}class Qy{constructor(t){this.parser=t,this.name=Jt.KHR_MATERIALS_SPECULAR}getMaterialType(t){return He(this.parser,t,this.name)!==null?hi:null}extendMaterialParams(t,e){const n=He(this.parser,t,this.name);if(n===null)return Promise.resolve();const i=[];e.specularIntensity=n.specularFactor!==void 0?n.specularFactor:1,n.specularTexture!==void 0&&i.push(this.parser.assignTexture(e,"specularIntensityMap",n.specularTexture));const s=n.specularColorFactor||[1,1,1];return e.specularColor=new Et().setRGB(s[0],s[1],s[2],Tn),n.specularColorTexture!==void 0&&i.push(this.parser.assignTexture(e,"specularColorMap",n.specularColorTexture,Be)),Promise.all(i)}}class tM{constructor(t){this.parser=t,this.name=Jt.EXT_MATERIALS_BUMP}getMaterialType(t){return He(this.parser,t,this.name)!==null?hi:null}extendMaterialParams(t,e){const n=He(this.parser,t,this.name);if(n===null)return Promise.resolve();const i=[];return e.bumpScale=n.bumpFactor!==void 0?n.bumpFactor:1,n.bumpTexture!==void 0&&i.push(this.parser.assignTexture(e,"bumpMap",n.bumpTexture)),Promise.all(i)}}class eM{constructor(t){this.parser=t,this.name=Jt.KHR_MATERIALS_ANISOTROPY}getMaterialType(t){return He(this.parser,t,this.name)!==null?hi:null}extendMaterialParams(t,e){const n=He(this.parser,t,this.name);if(n===null)return Promise.resolve();const i=[];return n.anisotropyStrength!==void 0&&(e.anisotropy=n.anisotropyStrength),n.anisotropyRotation!==void 0&&(e.anisotropyRotation=n.anisotropyRotation),n.anisotropyTexture!==void 0&&i.push(this.parser.assignTexture(e,"anisotropyMap",n.anisotropyTexture)),Promise.all(i)}}class nM{constructor(t){this.parser=t,this.name=Jt.KHR_TEXTURE_BASISU}loadTexture(t){const e=this.parser,n=e.json,i=n.textures[t];if(!i.extensions||!i.extensions[this.name])return null;const s=i.extensions[this.name],o=e.options.ktx2Loader;if(!o){if(n.extensionsRequired&&n.extensionsRequired.indexOf(this.name)>=0)throw new Error("THREE.GLTFLoader: setKTX2Loader must be called before loading KTX2 textures");return null}return e.loadTextureImage(t,s.source,o)}}class iM{constructor(t){this.parser=t,this.name=Jt.EXT_TEXTURE_WEBP}loadTexture(t){const e=this.name,n=this.parser,i=n.json,s=i.textures[t];if(!s.extensions||!s.extensions[e])return null;const o=s.extensions[e],a=i.images[o.source];let l=n.textureLoader;if(a.uri){const c=n.options.manager.getHandler(a.uri);c!==null&&(l=c)}return n.loadTextureImage(t,o.source,l)}}class sM{constructor(t){this.parser=t,this.name=Jt.EXT_TEXTURE_AVIF}loadTexture(t){const e=this.name,n=this.parser,i=n.json,s=i.textures[t];if(!s.extensions||!s.extensions[e])return null;const o=s.extensions[e],a=i.images[o.source];let l=n.textureLoader;if(a.uri){const c=n.options.manager.getHandler(a.uri);c!==null&&(l=c)}return n.loadTextureImage(t,o.source,l)}}class Qu{constructor(t,e){this.name=e,this.parser=t}loadBufferView(t){const e=this.parser.json,n=e.bufferViews[t];if(n.extensions&&n.extensions[this.name]){const i=n.extensions[this.name],s=this.parser.getDependency("buffer",i.buffer),o=this.parser.options.meshoptDecoder;if(!o||!o.supported){if(e.extensionsRequired&&e.extensionsRequired.indexOf(this.name)>=0)throw new Error("THREE.GLTFLoader: setMeshoptDecoder must be called before loading compressed files");return null}return s.then(function(a){const l=i.byteOffset||0,c=i.byteLength||0,h=i.count,u=i.byteStride,d=new Uint8Array(a,l,c);return o.decodeGltfBufferAsync?o.decodeGltfBufferAsync(h,u,d,i.mode,i.filter).then(function(f){return f.buffer}):o.ready.then(function(){const f=new ArrayBuffer(h*u);return o.decodeGltfBuffer(new Uint8Array(f),h,u,d,i.mode,i.filter),f})})}else return null}}class rM{constructor(t){this.name=Jt.EXT_MESH_GPU_INSTANCING,this.parser=t}createNodeMesh(t){const e=this.parser.json,n=e.nodes[t];if(!n.extensions||!n.extensions[this.name]||n.mesh===void 0)return null;const i=e.meshes[n.mesh];for(const c of i.primitives)if(c.mode!==Rn.TRIANGLES&&c.mode!==Rn.TRIANGLE_STRIP&&c.mode!==Rn.TRIANGLE_FAN&&c.mode!==void 0)return null;const o=n.extensions[this.name].attributes,a=[],l={};for(const c in o)a.push(this.parser.getDependency("accessor",o[c]).then(h=>(l[c]=h,l[c])));return a.length<1?null:(a.push(this.parser.createNodeMesh(t)),Promise.all(a).then(c=>{const h=c.pop(),u=h.isGroup?h.children:[h],d=c[0].count,f=[];for(const m of u){const _=new Ht,g=new P,p=new mn,b=new P(1,1,1),E=new $c(m.geometry,m.material,d);for(let y=0;y<d;y++)l.TRANSLATION&&g.fromBufferAttribute(l.TRANSLATION,y),l.ROTATION&&p.fromBufferAttribute(l.ROTATION,y),l.SCALE&&b.fromBufferAttribute(l.SCALE,y),E.setMatrixAt(y,_.compose(g,p,b));for(const y in l)if(y==="_COLOR_0"){const S=l[y];E.instanceColor=new dc(S.array,S.itemSize,S.normalized)}else y!=="TRANSLATION"&&y!=="ROTATION"&&y!=="SCALE"&&m.geometry.setAttribute(y,l[y]);Re.prototype.copy.call(E,m),this.parser.assignFinalMaterial(E),f.push(E)}return h.isGroup?(h.clear(),h.add(...f),h):f[0]}))}}const qf="glTF",wr=12,td={JSON:1313821514,BIN:5130562};class oM{constructor(t){this.name=Jt.KHR_BINARY_GLTF,this.content=null,this.body=null;const e=new DataView(t,0,wr),n=new TextDecoder;if(this.header={magic:n.decode(new Uint8Array(t.slice(0,4))),version:e.getUint32(4,!0),length:e.getUint32(8,!0)},this.header.magic!==qf)throw new Error("THREE.GLTFLoader: Unsupported glTF-Binary header.");if(this.header.version<2)throw new Error("THREE.GLTFLoader: Legacy binary file detected.");const i=this.header.length-wr,s=new DataView(t,wr);let o=0;for(;o<i;){const a=s.getUint32(o,!0);o+=4;const l=s.getUint32(o,!0);if(o+=4,l===td.JSON){const c=new Uint8Array(t,wr+o,a);this.content=n.decode(c)}else if(l===td.BIN){const c=wr+o;this.body=t.slice(c,c+a)}o+=a}if(this.content===null)throw new Error("THREE.GLTFLoader: JSON content not found.")}}class aM{constructor(t,e){if(!e)throw new Error("THREE.GLTFLoader: No DRACOLoader instance provided.");this.name=Jt.KHR_DRACO_MESH_COMPRESSION,this.json=t,this.dracoLoader=e,this.dracoLoader.preload()}decodePrimitive(t,e){const n=this.json,i=this.dracoLoader,s=t.extensions[this.name].bufferView,o=t.extensions[this.name].attributes,a={},l={},c={};for(const h in o){const u=xc[h]||h.toLowerCase();a[u]=o[h]}for(const h in t.attributes){const u=xc[h]||h.toLowerCase();if(o[h]!==void 0){const d=n.accessors[t.attributes[h]],f=qs[d.componentType];c[u]=f.name,l[u]=d.normalized===!0}}return e.getDependency("bufferView",s).then(function(h){return new Promise(function(u,d){i.decodeDracoFile(h,function(f){for(const m in f.attributes){const _=f.attributes[m],g=l[m];g!==void 0&&(_.normalized=g)}u(f)},a,c,Tn,d)})})}}class lM{constructor(){this.name=Jt.KHR_TEXTURE_TRANSFORM}extendTexture(t,e){return(e.texCoord===void 0||e.texCoord===t.channel)&&e.offset===void 0&&e.rotation===void 0&&e.scale===void 0||(t=t.clone(),e.texCoord!==void 0&&(t.channel=e.texCoord),e.offset!==void 0&&t.offset.fromArray(e.offset),e.rotation!==void 0&&(t.rotation=e.rotation),e.scale!==void 0&&t.repeat.fromArray(e.scale),t.needsUpdate=!0),t}}class cM{constructor(){this.name=Jt.KHR_MESH_QUANTIZATION}}class $f extends or{constructor(t,e,n,i){super(t,e,n,i)}copySampleValue_(t){const e=this.resultBuffer,n=this.sampleValues,i=this.valueSize,s=t*i*3+i;for(let o=0;o!==i;o++)e[o]=n[s+o];return e}interpolate_(t,e,n,i){const s=this.resultBuffer,o=this.sampleValues,a=this.valueSize,l=a*2,c=a*3,h=i-e,u=(n-e)/h,d=u*u,f=d*u,m=t*c,_=m-c,g=-2*f+3*d,p=f-d,b=1-g,E=p-d+u;for(let y=0;y!==a;y++){const S=o[_+y+a],w=o[_+y+l]*h,A=o[m+y+a],v=o[m+y]*h;s[y]=b*S+E*w+g*A+p*v}return s}}const hM=new mn;class uM extends $f{interpolate_(t,e,n,i){const s=super.interpolate_(t,e,n,i);return hM.fromArray(s).normalize().toArray(s),s}}const Rn={POINTS:0,LINES:1,LINE_LOOP:2,LINE_STRIP:3,TRIANGLES:4,TRIANGLE_STRIP:5,TRIANGLE_FAN:6},qs={5120:Int8Array,5121:Uint8Array,5122:Int16Array,5123:Uint16Array,5125:Uint32Array,5126:Float32Array},ed={9728:$e,9729:We,9984:rf,9985:Ho,9986:Pr,9987:ei},nd={33071:Dn,33648:kr,10497:rs},al={SCALAR:1,VEC2:2,VEC3:3,VEC4:4,MAT2:4,MAT3:9,MAT4:16},xc={POSITION:"position",NORMAL:"normal",TANGENT:"tangent",TEXCOORD_0:"uv",TEXCOORD_1:"uv1",TEXCOORD_2:"uv2",TEXCOORD_3:"uv3",COLOR_0:"color",WEIGHTS_0:"skinWeight",JOINTS_0:"skinIndex"},Ui={scale:"scale",translation:"position",rotation:"quaternion",weights:"morphTargetInfluences"},dM={CUBICSPLINE:void 0,LINEAR:Vr,STEP:Hr},ll={OPAQUE:"OPAQUE",MASK:"MASK",BLEND:"BLEND"};function fM(r){return r.DefaultMaterial===void 0&&(r.DefaultMaterial=new hn({color:16777215,emissive:0,metalness:1,roughness:1,transparent:!1,depthTest:!0,side:bi})),r.DefaultMaterial}function ji(r,t,e){for(const n in e.extensions)r[n]===void 0&&(t.userData.gltfExtensions=t.userData.gltfExtensions||{},t.userData.gltfExtensions[n]=e.extensions[n])}function Zn(r,t){t.extras!==void 0&&(typeof t.extras=="object"?Object.assign(r.userData,t.extras):console.warn("THREE.GLTFLoader: Ignoring primitive type .extras, "+t.extras))}function pM(r,t,e){let n=!1,i=!1,s=!1;for(let c=0,h=t.length;c<h;c++){const u=t[c];if(u.POSITION!==void 0&&(n=!0),u.NORMAL!==void 0&&(i=!0),u.COLOR_0!==void 0&&(s=!0),n&&i&&s)break}if(!n&&!i&&!s)return Promise.resolve(r);const o=[],a=[],l=[];for(let c=0,h=t.length;c<h;c++){const u=t[c];if(n){const d=u.POSITION!==void 0?e.getDependency("accessor",u.POSITION):r.attributes.position;o.push(d)}if(i){const d=u.NORMAL!==void 0?e.getDependency("accessor",u.NORMAL):r.attributes.normal;a.push(d)}if(s){const d=u.COLOR_0!==void 0?e.getDependency("accessor",u.COLOR_0):r.attributes.color;l.push(d)}}return Promise.all([Promise.all(o),Promise.all(a),Promise.all(l)]).then(function(c){const h=c[0],u=c[1],d=c[2];return n&&(r.morphAttributes.position=h),i&&(r.morphAttributes.normal=u),s&&(r.morphAttributes.color=d),r.morphTargetsRelative=!0,r})}function mM(r,t){if(r.updateMorphTargets(),t.weights!==void 0)for(let e=0,n=t.weights.length;e<n;e++)r.morphTargetInfluences[e]=t.weights[e];if(t.extras&&Array.isArray(t.extras.targetNames)){const e=t.extras.targetNames;if(r.morphTargetInfluences.length===e.length){r.morphTargetDictionary={};for(let n=0,i=e.length;n<i;n++)r.morphTargetDictionary[e[n]]=n}else console.warn("THREE.GLTFLoader: Invalid extras.targetNames length. Ignoring names.")}}function gM(r){let t;const e=r.extensions&&r.extensions[Jt.KHR_DRACO_MESH_COMPRESSION];if(e?t="draco:"+e.bufferView+":"+e.indices+":"+cl(e.attributes):t=r.indices+":"+cl(r.attributes)+":"+r.mode,r.targets!==void 0)for(let n=0,i=r.targets.length;n<i;n++)t+=":"+cl(r.targets[n]);return t}function cl(r){let t="";const e=Object.keys(r).sort();for(let n=0,i=e.length;n<i;n++)t+=e[n]+":"+r[e[n]]+";";return t}function vc(r){switch(r){case Int8Array:return 1/127;case Uint8Array:return 1/255;case Int16Array:return 1/32767;case Uint16Array:return 1/65535;default:throw new Error("THREE.GLTFLoader: Unsupported normalized accessor component type.")}}function _M(r){return r.search(/\.jpe?g($|\?)/i)>0||r.search(/^data\:image\/jpeg/)===0?"image/jpeg":r.search(/\.webp($|\?)/i)>0||r.search(/^data\:image\/webp/)===0?"image/webp":r.search(/\.ktx2($|\?)/i)>0||r.search(/^data\:image\/ktx2/)===0?"image/ktx2":"image/png"}const xM=new Ht;class vM{constructor(t={},e={}){this.json=t,this.extensions={},this.plugins={},this.options=e,this.cache=new Vy,this.associations=new Map,this.primitiveCache={},this.nodeCache={},this.meshCache={refs:{},uses:{}},this.cameraCache={refs:{},uses:{}},this.lightCache={refs:{},uses:{}},this.sourceCache={},this.textureCache={},this.nodeNamesUsed={};let n=!1,i=-1,s=!1,o=-1;if(typeof navigator<"u"&&typeof navigator.userAgent<"u"){const a=navigator.userAgent;n=/^((?!chrome|android).)*safari/i.test(a)===!0;const l=a.match(/Version\/(\d+)/);i=n&&l?parseInt(l[1],10):-1,s=a.indexOf("Firefox")>-1,o=s?a.match(/Firefox\/([0-9]+)\./)[1]:-1}typeof createImageBitmap>"u"||n&&i<17||s&&o<98?this.textureLoader=new Zc(this.options.manager):this.textureLoader=new Rg(this.options.manager),this.textureLoader.setCrossOrigin(this.options.crossOrigin),this.textureLoader.setRequestHeader(this.options.requestHeader),this.fileLoader=new Df(this.options.manager),this.fileLoader.setResponseType("arraybuffer"),this.options.crossOrigin==="use-credentials"&&this.fileLoader.setWithCredentials(!0)}setExtensions(t){this.extensions=t}setPlugins(t){this.plugins=t}parse(t,e){const n=this,i=this.json,s=this.extensions;this.cache.removeAll(),this.nodeCache={},this._invokeAll(function(o){return o._markDefs&&o._markDefs()}),Promise.all(this._invokeAll(function(o){return o.beforeRoot&&o.beforeRoot()})).then(function(){return Promise.all([n.getDependencies("scene"),n.getDependencies("animation"),n.getDependencies("camera")])}).then(function(o){const a={scene:o[0][i.scene||0],scenes:o[0],animations:o[1],cameras:o[2],asset:i.asset,parser:n,userData:{}};return ji(s,a,i),Zn(a,i),Promise.all(n._invokeAll(function(l){return l.afterRoot&&l.afterRoot(a)})).then(function(){for(const l of a.scenes)l.updateMatrixWorld();t(a)})}).catch(e)}_markDefs(){const t=this.json.nodes||[],e=this.json.skins||[],n=this.json.meshes||[];for(let i=0,s=e.length;i<s;i++){const o=e[i].joints;for(let a=0,l=o.length;a<l;a++)t[o[a]].isBone=!0}for(let i=0,s=t.length;i<s;i++){const o=t[i];o.mesh!==void 0&&(this._addNodeRef(this.meshCache,o.mesh),o.skin!==void 0&&(n[o.mesh].isSkinnedMesh=!0)),o.camera!==void 0&&this._addNodeRef(this.cameraCache,o.camera)}}_addNodeRef(t,e){e!==void 0&&(t.refs[e]===void 0&&(t.refs[e]=t.uses[e]=0),t.refs[e]++)}_getNodeRef(t,e,n){if(t.refs[e]<=1)return n;const i=n.clone(),s=(o,a)=>{const l=this.associations.get(o);l!=null&&this.associations.set(a,l);for(const[c,h]of o.children.entries())s(h,a.children[c])};return s(n,i),i.name+="_instance_"+t.uses[e]++,i}_invokeOne(t){const e=Object.values(this.plugins);e.push(this);for(let n=0;n<e.length;n++){const i=t(e[n]);if(i)return i}return null}_invokeAll(t){const e=Object.values(this.plugins);e.unshift(this);const n=[];for(let i=0;i<e.length;i++){const s=t(e[i]);s&&n.push(s)}return n}getDependency(t,e){const n=t+":"+e;let i=this.cache.get(n);if(!i){switch(t){case"scene":i=this.loadScene(e);break;case"node":i=this._invokeOne(function(s){return s.loadNode&&s.loadNode(e)});break;case"mesh":i=this._invokeOne(function(s){return s.loadMesh&&s.loadMesh(e)});break;case"accessor":i=this.loadAccessor(e);break;case"bufferView":i=this._invokeOne(function(s){return s.loadBufferView&&s.loadBufferView(e)});break;case"buffer":i=this.loadBuffer(e);break;case"material":i=this._invokeOne(function(s){return s.loadMaterial&&s.loadMaterial(e)});break;case"texture":i=this._invokeOne(function(s){return s.loadTexture&&s.loadTexture(e)});break;case"skin":i=this.loadSkin(e);break;case"animation":i=this._invokeOne(function(s){return s.loadAnimation&&s.loadAnimation(e)});break;case"camera":i=this.loadCamera(e);break;default:if(i=this._invokeOne(function(s){return s!=this&&s.getDependency&&s.getDependency(t,e)}),!i)throw new Error("Unknown type: "+t);break}this.cache.add(n,i)}return i}getDependencies(t){let e=this.cache.get(t);if(!e){const n=this,i=this.json[t+(t==="mesh"?"es":"s")]||[];e=Promise.all(i.map(function(s,o){return n.getDependency(t,o)})),this.cache.add(t,e)}return e}loadBuffer(t){const e=this.json.buffers[t],n=this.fileLoader;if(e.type&&e.type!=="arraybuffer")throw new Error("THREE.GLTFLoader: "+e.type+" buffer type is not supported.");if(e.uri===void 0&&t===0)return Promise.resolve(this.extensions[Jt.KHR_BINARY_GLTF].body);const i=this.options;return new Promise(function(s,o){n.load(Nr.resolveURL(e.uri,i.path),s,void 0,function(){o(new Error('THREE.GLTFLoader: Failed to load buffer "'+e.uri+'".'))})})}loadBufferView(t){const e=this.json.bufferViews[t];return this.getDependency("buffer",e.buffer).then(function(n){const i=e.byteLength||0,s=e.byteOffset||0;return n.slice(s,s+i)})}loadAccessor(t){const e=this,n=this.json,i=this.json.accessors[t];if(i.bufferView===void 0&&i.sparse===void 0){const o=al[i.type],a=qs[i.componentType],l=i.normalized===!0,c=new a(i.count*o);return Promise.resolve(new gn(c,o,l))}const s=[];return i.bufferView!==void 0?s.push(this.getDependency("bufferView",i.bufferView)):s.push(null),i.sparse!==void 0&&(s.push(this.getDependency("bufferView",i.sparse.indices.bufferView)),s.push(this.getDependency("bufferView",i.sparse.values.bufferView))),Promise.all(s).then(function(o){const a=o[0],l=al[i.type],c=qs[i.componentType],h=c.BYTES_PER_ELEMENT,u=h*l,d=i.byteOffset||0,f=i.bufferView!==void 0?n.bufferViews[i.bufferView].byteStride:void 0,m=i.normalized===!0;let _,g;if(f&&f!==u){const p=Math.floor(d/f),b="InterleavedBuffer:"+i.bufferView+":"+i.componentType+":"+p+":"+i.count;let E=e.cache.get(b);E||(_=new c(a,p*f,i.count*f/h),E=new yf(_,f/h),e.cache.add(b,E)),g=new Xr(E,l,d%f/h,m)}else a===null?_=new c(i.count*l):_=new c(a,d,i.count*l),g=new gn(_,l,m);if(i.sparse!==void 0){const p=al.SCALAR,b=qs[i.sparse.indices.componentType],E=i.sparse.indices.byteOffset||0,y=i.sparse.values.byteOffset||0,S=new b(o[1],E,i.sparse.count*p),w=new c(o[2],y,i.sparse.count*l);a!==null&&(g=new gn(g.array.slice(),g.itemSize,g.normalized)),g.normalized=!1;for(let A=0,v=S.length;A<v;A++){const T=S[A];if(g.setX(T,w[A*l]),l>=2&&g.setY(T,w[A*l+1]),l>=3&&g.setZ(T,w[A*l+2]),l>=4&&g.setW(T,w[A*l+3]),l>=5)throw new Error("THREE.GLTFLoader: Unsupported itemSize in sparse BufferAttribute.")}g.normalized=m}return g})}loadTexture(t){const e=this.json,n=this.options,s=e.textures[t].source,o=e.images[s];let a=this.textureLoader;if(o.uri){const l=n.manager.getHandler(o.uri);l!==null&&(a=l)}return this.loadTextureImage(t,s,a)}loadTextureImage(t,e,n){const i=this,s=this.json,o=s.textures[t],a=s.images[e],l=(a.uri||a.bufferView)+":"+o.sampler;if(this.textureCache[l])return this.textureCache[l];const c=this.loadImageSource(e,n).then(function(h){h.flipY=!1,h.name=o.name||a.name||"",h.name===""&&typeof a.uri=="string"&&a.uri.startsWith("data:image/")===!1&&(h.name=a.uri);const d=(s.samplers||{})[o.sampler]||{};return h.magFilter=ed[d.magFilter]||We,h.minFilter=ed[d.minFilter]||ei,h.wrapS=nd[d.wrapS]||rs,h.wrapT=nd[d.wrapT]||rs,h.generateMipmaps=!h.isCompressedTexture&&h.minFilter!==$e&&h.minFilter!==We,i.associations.set(h,{textures:t}),h}).catch(function(){return null});return this.textureCache[l]=c,c}loadImageSource(t,e){const n=this,i=this.json,s=this.options;if(this.sourceCache[t]!==void 0)return this.sourceCache[t].then(u=>u.clone());const o=i.images[t],a=self.URL||self.webkitURL;let l=o.uri||"",c=!1;if(o.bufferView!==void 0)l=n.getDependency("bufferView",o.bufferView).then(function(u){c=!0;const d=new Blob([u],{type:o.mimeType});return l=a.createObjectURL(d),l});else if(o.uri===void 0)throw new Error("THREE.GLTFLoader: Image "+t+" is missing URI and bufferView");const h=Promise.resolve(l).then(function(u){return new Promise(function(d,f){let m=d;e.isImageBitmapLoader===!0&&(m=function(_){const g=new Xe(_);g.needsUpdate=!0,d(g)}),e.load(Nr.resolveURL(u,s.path),m,void 0,f)})}).then(function(u){return c===!0&&a.revokeObjectURL(l),Zn(u,o),u.userData.mimeType=o.mimeType||_M(o.uri),u}).catch(function(u){throw console.error("THREE.GLTFLoader: Couldn't load texture",l),u});return this.sourceCache[t]=h,h}assignTexture(t,e,n,i){const s=this;return this.getDependency("texture",n.index).then(function(o){if(!o)return null;if(n.texCoord!==void 0&&n.texCoord>0&&(o=o.clone(),o.channel=n.texCoord),s.extensions[Jt.KHR_TEXTURE_TRANSFORM]){const a=n.extensions!==void 0?n.extensions[Jt.KHR_TEXTURE_TRANSFORM]:void 0;if(a){const l=s.associations.get(o);o=s.extensions[Jt.KHR_TEXTURE_TRANSFORM].extendTexture(o,a),s.associations.set(o,l)}}return i!==void 0&&(o.colorSpace=i),t[e]=o,o})}assignFinalMaterial(t){const e=t.geometry;let n=t.material;const i=e.attributes.tangent===void 0,s=e.attributes.color!==void 0,o=e.attributes.normal===void 0;if(t.isPoints){const a="PointsMaterial:"+n.uuid;let l=this.cache.get(a);l||(l=new Tf,Vn.prototype.copy.call(l,n),l.color.copy(n.color),l.map=n.map,l.sizeAttenuation=!1,this.cache.add(a,l)),n=l}else if(t.isLine){const a="LineBasicMaterial:"+n.uuid;let l=this.cache.get(a);l||(l=new as,Vn.prototype.copy.call(l,n),l.color.copy(n.color),l.map=n.map,this.cache.add(a,l)),n=l}if(i||s||o){let a="ClonedMaterial:"+n.uuid+":";i&&(a+="derivative-tangents:"),s&&(a+="vertex-colors:"),o&&(a+="flat-shading:");let l=this.cache.get(a);l||(l=n.clone(),s&&(l.vertexColors=!0),o&&(l.flatShading=!0),i&&(l.normalScale&&(l.normalScale.y*=-1),l.clearcoatNormalScale&&(l.clearcoatNormalScale.y*=-1)),this.cache.add(a,l),this.associations.set(l,this.associations.get(n))),n=l}t.material=n}getMaterialType(){return hn}loadMaterial(t){const e=this,n=this.json,i=this.extensions,s=n.materials[t];let o;const a={},l=s.extensions||{},c=[];if(l[Jt.KHR_MATERIALS_UNLIT]){const u=i[Jt.KHR_MATERIALS_UNLIT];o=u.getMaterialType(),c.push(u.extendParams(a,s,e))}else{const u=s.pbrMetallicRoughness||{};if(a.color=new Et(1,1,1),a.opacity=1,Array.isArray(u.baseColorFactor)){const d=u.baseColorFactor;a.color.setRGB(d[0],d[1],d[2],Tn),a.opacity=d[3]}u.baseColorTexture!==void 0&&c.push(e.assignTexture(a,"map",u.baseColorTexture,Be)),a.metalness=u.metallicFactor!==void 0?u.metallicFactor:1,a.roughness=u.roughnessFactor!==void 0?u.roughnessFactor:1,u.metallicRoughnessTexture!==void 0&&(c.push(e.assignTexture(a,"metalnessMap",u.metallicRoughnessTexture)),c.push(e.assignTexture(a,"roughnessMap",u.metallicRoughnessTexture))),o=this._invokeOne(function(d){return d.getMaterialType&&d.getMaterialType(t)}),c.push(Promise.all(this._invokeAll(function(d){return d.extendMaterialParams&&d.extendMaterialParams(t,a)})))}s.doubleSided===!0&&(a.side=on);const h=s.alphaMode||ll.OPAQUE;if(h===ll.BLEND?(a.transparent=!0,a.depthWrite=!1):(a.transparent=!1,h===ll.MASK&&(a.alphaTest=s.alphaCutoff!==void 0?s.alphaCutoff:.5)),s.normalTexture!==void 0&&o!==Le&&(c.push(e.assignTexture(a,"normalMap",s.normalTexture)),a.normalScale=new At(1,1),s.normalTexture.scale!==void 0)){const u=s.normalTexture.scale;a.normalScale.set(u,u)}if(s.occlusionTexture!==void 0&&o!==Le&&(c.push(e.assignTexture(a,"aoMap",s.occlusionTexture)),s.occlusionTexture.strength!==void 0&&(a.aoMapIntensity=s.occlusionTexture.strength)),s.emissiveFactor!==void 0&&o!==Le){const u=s.emissiveFactor;a.emissive=new Et().setRGB(u[0],u[1],u[2],Tn)}return s.emissiveTexture!==void 0&&o!==Le&&c.push(e.assignTexture(a,"emissiveMap",s.emissiveTexture,Be)),Promise.all(c).then(function(){const u=new o(a);return s.name&&(u.name=s.name),Zn(u,s),e.associations.set(u,{materials:t}),s.extensions&&ji(i,u,s),u})}createUniqueName(t){const e=pe.sanitizeNodeName(t||"");return e in this.nodeNamesUsed?e+"_"+ ++this.nodeNamesUsed[e]:(this.nodeNamesUsed[e]=0,e)}loadGeometries(t){const e=this,n=this.extensions,i=this.primitiveCache;function s(a){return n[Jt.KHR_DRACO_MESH_COMPRESSION].decodePrimitive(a,e).then(function(l){return id(l,a,e)})}const o=[];for(let a=0,l=t.length;a<l;a++){const c=t[a],h=gM(c),u=i[h];if(u)o.push(u.promise);else{let d;c.extensions&&c.extensions[Jt.KHR_DRACO_MESH_COMPRESSION]?d=s(c):d=id(new De,c,e),i[h]={primitive:c,promise:d},o.push(d)}}return Promise.all(o)}loadMesh(t){const e=this,n=this.json,i=this.extensions,s=n.meshes[t],o=s.primitives,a=[];for(let l=0,c=o.length;l<c;l++){const h=o[l].material===void 0?fM(this.cache):this.getDependency("material",o[l].material);a.push(h)}return a.push(e.loadGeometries(o)),Promise.all(a).then(function(l){const c=l.slice(0,l.length-1),h=l[l.length-1],u=[];for(let f=0,m=h.length;f<m;f++){const _=h[f],g=o[f];let p;const b=c[f];if(g.mode===Rn.TRIANGLES||g.mode===Rn.TRIANGLE_STRIP||g.mode===Rn.TRIANGLE_FAN||g.mode===void 0)p=s.isSkinnedMesh===!0?new Zm(_,b):new te(_,b),p.isSkinnedMesh===!0&&p.normalizeSkinWeights(),g.mode===Rn.TRIANGLE_STRIP?p.geometry=Ju(p.geometry,ff):g.mode===Rn.TRIANGLE_FAN&&(p.geometry=Ju(p.geometry,cc));else if(g.mode===Rn.LINES)p=new wf(_,b);else if(g.mode===Rn.LINE_STRIP)p=new is(_,b);else if(g.mode===Rn.LINE_LOOP)p=new Ef(_,b);else if(g.mode===Rn.POINTS)p=new ng(_,b);else throw new Error("THREE.GLTFLoader: Primitive mode unsupported: "+g.mode);Object.keys(p.geometry.morphAttributes).length>0&&mM(p,s),p.name=e.createUniqueName(s.name||"mesh_"+t),Zn(p,s),g.extensions&&ji(i,p,g),e.assignFinalMaterial(p),u.push(p)}for(let f=0,m=u.length;f<m;f++)e.associations.set(u[f],{meshes:t,primitives:f});if(u.length===1)return s.extensions&&ji(i,u[0],s),u[0];const d=new _e;s.extensions&&ji(i,d,s),e.associations.set(d,{meshes:t});for(let f=0,m=u.length;f<m;f++)d.add(u[f]);return d})}loadCamera(t){let e;const n=this.json.cameras[t],i=n[n.type];if(!i){console.warn("THREE.GLTFLoader: Missing camera parameters.");return}return n.type==="perspective"?e=new tn(Qe.radToDeg(i.yfov),i.aspectRatio||1,i.znear||1,i.zfar||2e6):n.type==="orthographic"&&(e=new ga(-i.xmag,i.xmag,i.ymag,-i.ymag,i.znear,i.zfar)),n.name&&(e.name=this.createUniqueName(n.name)),Zn(e,n),Promise.resolve(e)}loadSkin(t){const e=this.json.skins[t],n=[];for(let i=0,s=e.joints.length;i<s;i++)n.push(this._loadNodeShallow(e.joints[i]));return e.inverseBindMatrices!==void 0?n.push(this.getDependency("accessor",e.inverseBindMatrices)):n.push(null),Promise.all(n).then(function(i){const s=i.pop(),o=i,a=[],l=[];for(let c=0,h=o.length;c<h;c++){const u=o[c];if(u){a.push(u);const d=new Ht;s!==null&&d.fromArray(s.array,c*16),l.push(d)}else console.warn('THREE.GLTFLoader: Joint "%s" could not be found.',e.joints[c])}return new qc(a,l)})}loadAnimation(t){const e=this.json,n=this,i=e.animations[t],s=i.name?i.name:"animation_"+t,o=[],a=[],l=[],c=[],h=[];for(let u=0,d=i.channels.length;u<d;u++){const f=i.channels[u],m=i.samplers[f.sampler],_=f.target,g=_.node,p=i.parameters!==void 0?i.parameters[m.input]:m.input,b=i.parameters!==void 0?i.parameters[m.output]:m.output;_.node!==void 0&&(o.push(this.getDependency("node",g)),a.push(this.getDependency("accessor",p)),l.push(this.getDependency("accessor",b)),c.push(m),h.push(_))}return Promise.all([Promise.all(o),Promise.all(a),Promise.all(l),Promise.all(c),Promise.all(h)]).then(function(u){const d=u[0],f=u[1],m=u[2],_=u[3],g=u[4],p=[];for(let E=0,y=d.length;E<y;E++){const S=d[E],w=f[E],A=m[E],v=_[E],T=g[E];if(S===void 0)continue;S.updateMatrix&&S.updateMatrix();const I=n._createAnimationTracks(S,w,A,v,T);if(I)for(let L=0;L<I.length;L++)p.push(I[L])}const b=new pc(s,void 0,p);return Zn(b,i),b})}createNodeMesh(t){const e=this.json,n=this,i=e.nodes[t];return i.mesh===void 0?null:n.getDependency("mesh",i.mesh).then(function(s){const o=n._getNodeRef(n.meshCache,i.mesh,s);return i.weights!==void 0&&o.traverse(function(a){if(a.isMesh)for(let l=0,c=i.weights.length;l<c;l++)a.morphTargetInfluences[l]=i.weights[l]}),o})}loadNode(t){const e=this.json,n=this,i=e.nodes[t],s=n._loadNodeShallow(t),o=[],a=i.children||[];for(let c=0,h=a.length;c<h;c++)o.push(n.getDependency("node",a[c]));const l=i.skin===void 0?Promise.resolve(null):n.getDependency("skin",i.skin);return Promise.all([s,Promise.all(o),l]).then(function(c){const h=c[0],u=c[1],d=c[2];d!==null&&h.traverse(function(f){f.isSkinnedMesh&&f.bind(d,xM)});for(let f=0,m=u.length;f<m;f++)h.add(u[f]);if(h.userData.pivot!==void 0&&u.length>0){const f=h.userData.pivot,m=u[0];h.pivot=new P().fromArray(f),h.position.x-=f[0],h.position.y-=f[1],h.position.z-=f[2],m.position.set(0,0,0),delete h.userData.pivot}return h})}_loadNodeShallow(t){const e=this.json,n=this.extensions,i=this;if(this.nodeCache[t]!==void 0)return this.nodeCache[t];const s=e.nodes[t],o=s.name?i.createUniqueName(s.name):"",a=[],l=i._invokeOne(function(c){return c.createNodeMesh&&c.createNodeMesh(t)});return l&&a.push(l),s.camera!==void 0&&a.push(i.getDependency("camera",s.camera).then(function(c){return i._getNodeRef(i.cameraCache,s.camera,c)})),i._invokeAll(function(c){return c.createNodeAttachment&&c.createNodeAttachment(t)}).forEach(function(c){a.push(c)}),this.nodeCache[t]=Promise.all(a).then(function(c){let h;if(s.isBone===!0?h=new Sf:c.length>1?h=new _e:c.length===1?h=c[0]:h=new Re,h!==c[0])for(let u=0,d=c.length;u<d;u++)h.add(c[u]);if(s.name&&(h.userData.name=s.name,h.name=o),Zn(h,s),s.extensions&&ji(n,h,s),s.matrix!==void 0){const u=new Ht;u.fromArray(s.matrix),h.applyMatrix4(u)}else s.translation!==void 0&&h.position.fromArray(s.translation),s.rotation!==void 0&&h.quaternion.fromArray(s.rotation),s.scale!==void 0&&h.scale.fromArray(s.scale);if(!i.associations.has(h))i.associations.set(h,{});else if(s.mesh!==void 0&&i.meshCache.refs[s.mesh]>1){const u=i.associations.get(h);i.associations.set(h,{...u})}return i.associations.get(h).nodes=t,h}),this.nodeCache[t]}loadScene(t){const e=this.extensions,n=this.json.scenes[t],i=this,s=new _e;n.name&&(s.name=i.createUniqueName(n.name)),Zn(s,n),n.extensions&&ji(e,s,n);const o=n.nodes||[],a=[];for(let l=0,c=o.length;l<c;l++)a.push(i.getDependency("node",o[l]));return Promise.all(a).then(function(l){for(let h=0,u=l.length;h<u;h++){const d=l[h];d.parent!==null?s.add(sr(d)):s.add(d)}const c=h=>{const u=new Map;for(const[d,f]of i.associations)(d instanceof Vn||d instanceof Xe)&&u.set(d,f);return h.traverse(d=>{const f=i.associations.get(d);f!=null&&u.set(d,f)}),u};return i.associations=c(s),s})}_createAnimationTracks(t,e,n,i,s){const o=[],a=t.name?t.name:t.uuid,l=[];function c(f){f.morphTargetInfluences&&l.push(f.name?f.name:f.uuid)}Ui[s.path]===Ui.weights?(c(t),t.isGroup&&t.children.forEach(c)):l.push(a);let h;switch(Ui[s.path]){case Ui.weights:h=qr;break;case Ui.rotation:h=$r;break;case Ui.translation:case Ui.scale:h=na;break;default:switch(n.itemSize){case 1:h=qr;break;case 2:case 3:default:h=na;break}break}const u=i.interpolation!==void 0?dM[i.interpolation]:Vr,d=this._getArrayFromAccessor(n);for(let f=0,m=l.length;f<m;f++){const _=new h(l[f]+"."+Ui[s.path],e.array,d,u);i.interpolation==="CUBICSPLINE"&&this._createCubicSplineTrackInterpolant(_),o.push(_)}return o}_getArrayFromAccessor(t){let e=t.array;if(t.normalized){const n=vc(e.constructor),i=new Float32Array(e.length);for(let s=0,o=e.length;s<o;s++)i[s]=e[s]*n;e=i}return e}_createCubicSplineTrackInterpolant(t){t.createInterpolant=function(n){const i=this instanceof $r?uM:$f;return new i(this.times,this.values,this.getValueSize()/3,n)},t.createInterpolant.isInterpolantFactoryMethodGLTFCubicSpline=!0}}function yM(r,t,e){const n=t.attributes,i=new Pe;if(n.POSITION!==void 0){const a=e.json.accessors[n.POSITION],l=a.min,c=a.max;if(l!==void 0&&c!==void 0){if(i.set(new P(l[0],l[1],l[2]),new P(c[0],c[1],c[2])),a.normalized){const h=vc(qs[a.componentType]);i.min.multiplyScalar(h),i.max.multiplyScalar(h)}}else{console.warn("THREE.GLTFLoader: Missing min/max properties for accessor POSITION.");return}}else return;const s=t.targets;if(s!==void 0){const a=new P,l=new P;for(let c=0,h=s.length;c<h;c++){const u=s[c];if(u.POSITION!==void 0){const d=e.json.accessors[u.POSITION],f=d.min,m=d.max;if(f!==void 0&&m!==void 0){if(l.setX(Math.max(Math.abs(f[0]),Math.abs(m[0]))),l.setY(Math.max(Math.abs(f[1]),Math.abs(m[1]))),l.setZ(Math.max(Math.abs(f[2]),Math.abs(m[2]))),d.normalized){const _=vc(qs[d.componentType]);l.multiplyScalar(_)}a.max(l)}else console.warn("THREE.GLTFLoader: Missing min/max properties for accessor POSITION.")}}i.expandByVector(a)}r.boundingBox=i;const o=new li;i.getCenter(o.center),o.radius=i.min.distanceTo(i.max)/2,r.boundingSphere=o}function id(r,t,e){const n=t.attributes,i=[];function s(o,a){return e.getDependency("accessor",o).then(function(l){r.setAttribute(a,l)})}for(const o in n){const a=xc[o]||o.toLowerCase();a in r.attributes||i.push(s(n[o],a))}if(t.indices!==void 0&&!r.index){const o=e.getDependency("accessor",t.indices).then(function(a){r.setIndex(a)});i.push(o)}return Qt.workingColorSpace!==Tn&&"COLOR_0"in n&&console.warn(`THREE.GLTFLoader: Converting vertex colors from "srgb-linear" to "${Qt.workingColorSpace}" not supported.`),Zn(r,t),yM(r,t,e),Promise.all(i).then(function(){return t.targets!==void 0?pM(r,t.targets,e):r})}const Yf=Object.freeze(Object.defineProperty({__proto__:null,GLTFLoader:Gn},Symbol.toStringTag,{value:"Module"})),MM=1.5,bM=.3;function Fe(r,t,e){return new P(r,e,-t)}function SM(r){const t=new hn({vertexColors:!0,roughness:.95,metalness:0});return t.onBeforeCompile=e=>{e.uniforms.uBlock={value:r},e.vertexShader=e.vertexShader.replace("#include <common>",`#include <common>
varying vec3 vWPos;
varying vec3 vWNrm;`).replace("#include <worldpos_vertex>",`#include <worldpos_vertex>
vWPos = (modelMatrix * vec4(transformed, 1.0)).xyz;
vWNrm = normalize(mat3(modelMatrix) * objectNormal);`),e.fragmentShader=e.fragmentShader.replace("#include <common>",`#include <common>
uniform float uBlock;
varying vec3 vWPos;
varying vec3 vWNrm;
float h13(vec3 p) { p = fract(p * 0.1031); p += dot(p, p.zyx + 31.32); return fract((p.x + p.y) * p.z); }
float vn(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  float a = h13(vec3(i, 0.0)), b = h13(vec3(i + vec2(1, 0), 0.0)), c = h13(vec3(i + vec2(0, 1), 0.0)), d = h13(vec3(i + vec2(1, 1), 0.0));
  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y); }`).replace("#include <color_fragment>",`#include <color_fragment>
{
  // Blender block_material 과 같은 식: 칸 가운데로 법선 반 칸 뒤 → 칸 번호
  vec3 p = (vWPos - vWNrm * uBlock * 0.5) / uBlock;
  vec3 cell = floor(p);
  float jit = mix(0.925, 1.075, h13(cell));
  float big = mix(0.94, 1.06, clamp((vn(vWPos.xz * 0.035) - 0.35) / 0.3, 0.0, 1.0));
  vec3 a = abs(fract(p) - 0.5) * 2.0;
  // 면 방향 축은 빼고 나머지 두 축 모서리만
  vec3 an = abs(vWNrm);
  float e = an.y > 0.5 ? max(a.x, a.z) : (an.x > 0.5 ? max(a.y, a.z) : max(a.x, a.y));
  float edge = 1.0 - 0.035 * smoothstep(0.84, 0.98, e);
  diffuseColor.rgb *= jit * big * edge;
}`)},t.customProgramCacheKey=()=>`map-terrain-block-${r}`,t}class eh{constructor(){R(this,"root",new _e);R(this,"backdrop",null);R(this,"person",null);R(this,"mixer",null);R(this,"monsterMixers",[]);R(this,"monsters",0);R(this,"triangles",0);R(this,"instances",0);R(this,"chunks",[]);R(this,"grassFar",42);R(this,"camLocal",new P);R(this,"chunkBounds",new Pe)}static async load(t,e,n,i,s){const o=(s==null?void 0:s.blockM)??bM,a=(s==null?void 0:s.personM)??MM,l=(s==null?void 0:s.stand)??{x:55,y:55,z:0,yaw:Math.PI*.9},c=(s==null?void 0:s.backdrop)??{radius:420,height:360,footY:255},h=new eh,u=await new Gn().loadAsync(t),d=SM(o),f=new Map;if(u.scene.traverse(m=>{const _=m;if(!_.isMesh)return;const g=_.name.toLowerCase(),p=!!_.geometry.getAttribute("color");if(g.startsWith("terrain")||g.startsWith("seabed"))_.material=d;else if(g.startsWith("sea")||g.startsWith("pond"))_.material=new hn({vertexColors:!0,roughness:.15,metalness:0,emissive:2775654,emissiveIntensity:.35});else if(g.startsWith("spark"))_.material=new Le({color:1031879});else if(p){const y=_.material;let S=f.get(y);S||(S=new hn({vertexColors:!0,roughness:.85,metalness:0}),f.set(y,S)),_.material=S}else{const y=_.material;_.material=new Le({color:y.color??16777215})}_.castShadow=!1,_.receiveShadow=!1;const b=(_.geometry.index?_.geometry.index.count:_.geometry.getAttribute("position").count)/3,E=_.isInstancedMesh?_.count:1;h.triangles+=b*E,E>1&&(h.instances+=E)}),h.root.add(u.scene),h.instanceShared(u.scene),i){const m=await wM(i);m.repeat.x=c.repeat??1,m.repeat.x>1&&(m.wrapS=kr);const _=new Vi(1,1,1,48,1,!0),g=new Le({map:m,side:cn,fog:!1,depthWrite:!1,toneMapped:!1});c.sky&&(g.onBeforeCompile=y=>{y.uniforms.horizonSky={value:new Et(c.sky)},y.fragmentShader=`uniform vec3 horizonSky;
`+y.fragmentShader,y.fragmentShader=y.fragmentShader.replace("#include <map_fragment>",`#include <map_fragment>
#ifdef USE_MAP
diffuseColor.rgb = mix(diffuseColor.rgb, horizonSky, smoothstep(0.70, 1.0, vMapUv.y));
#endif`)},g.customProgramCacheKey=()=>"forest-horizon-fade-v1");const p=new te(_,g),b=c.radius,E=c.height;p.scale.set(b,E,b),p.position.y=c.footY-E*.5,p.renderOrder=-1,p.frustumCulled=!1,h.backdrop=p,h.root.add(p)}if(e){const m=await new Gn().loadAsync(e),_=new Pe().setFromObject(m.scene),g=Math.max(.1,_.max.y-_.min.y);if(m.scene.scale.setScalar(a/g),m.scene.position.copy(Fe(l.x,l.y,l.z)),m.scene.rotation.y=l.yaw,m.scene.traverse(p=>{(/^(mg_|rf_|bomb)/.test(p.name)||/^face_/.test(p.name)&&!/^face_default/.test(p.name))&&(p.visible=!1)}),h.person=m.scene,h.root.add(m.scene),m.animations.length){h.mixer=new Gi(m.scene);const p=m.animations.find(b=>b.name==="idle")??m.animations[0];h.mixer.clipAction(p).play()}}if(n){const m=await new Gn().loadAsync(n),_=new Pe().setFromObject(m.scene),p=.9/Math.max(.1,_.max.y-_.min.y);for(let b=0;b<12;b++){const E=sr(m.scene);if(E.scale.setScalar(p),E.position.copy(Fe(44+b%4*5,62+Math.floor(b/4)*4,0)),E.rotation.y=b*1.7,h.root.add(E),m.animations.length){const y=new Gi(E),S=m.animations.find(w=>/idle/i.test(w.name))??m.animations[0];y.clipAction(S).play(),h.monsterMixers.push(y)}}h.monsters=12}return h}instanceShared(t){t.updateMatrixWorld(!0);const e=new Map;let n=0,i=0;t.traverse(a=>{const l=a;if(!l.isMesh)return;if(l.isInstancedMesh){const h=l;h.computeBoundingBox(),h.computeBoundingSphere();const u=(h.geometry.index?h.geometry.index.count:h.geometry.getAttribute("position").count)/3;n+=u*h.count,i+=h.count,(h.name.startsWith("inst_tuft")||h.name.startsWith("inst_flower"))&&(h.computeBoundingSphere(),h.computeBoundingBox(),this.chunks.push({mesh:h,center:h.boundingSphere.center.clone(),bounds:h.boundingBox.clone()}));return}const c=e.get(l.geometry)??[];c.push(l),e.set(l.geometry,c)});const s=new Ht().copy(t.matrixWorld).invert(),o=new Ht;for(const[a,l]of e){const c=(a.index?a.index.count:a.getAttribute("position").count)/3;if(l.length<4){n+=c*l.length;continue}const h=20,u=new Map,d=new P;for(const f of l){o.multiplyMatrices(s,f.matrixWorld),d.setFromMatrixPosition(o);const m=l.length>200?`${Math.floor(d.x/h)},${Math.floor(d.z/h)}`:"all",_=u.get(m)??[];_.push(o.clone()),u.set(m,_),f.removeFromParent()}for(const[f,m]of u){const _=new $c(a,l[0].material,m.length);m.forEach((g,p)=>_.setMatrixAt(p,g)),_.instanceMatrix.needsUpdate=!0,_.computeBoundingSphere(),_.frustumCulled=!0,t.add(_),f!=="all"&&(_.computeBoundingBox(),this.chunks.push({mesh:_,center:_.boundingSphere.center.clone(),bounds:_.boundingBox.clone()}))}n+=c*l.length,i+=l.length}this.triangles=n,this.instances=i}tick(t,e){var n;(n=this.mixer)==null||n.update(t);for(const i of this.monsterMixers)i.update(t);e&&this.updateVisibility(e)}updateVisibility(t){this.root.updateWorldMatrix(!0,!0),this.backdrop&&(this.camLocal.copy(t),this.root.worldToLocal(this.camLocal),this.backdrop.position.x=this.camLocal.x,this.backdrop.position.z=this.camLocal.z);const e=this.grassFar*this.grassFar;for(const n of this.chunks){this.chunkBounds.copy(n.bounds).applyMatrix4(n.mesh.matrixWorld);const i=Math.max(this.chunkBounds.min.x-t.x,0,t.x-this.chunkBounds.max.x),s=Math.max(this.chunkBounds.min.z-t.z,0,t.z-this.chunkBounds.max.z);n.mesh.visible=i*i+s*s<=e}}dispose(){var i;this.root.removeFromParent(),(i=this.mixer)==null||i.stopAllAction();for(const s of this.monsterMixers)s.stopAllAction();const t=new Set,e=new Set,n=new Set;this.root.traverse(s=>{const o=s;if(o.isMesh){t.add(o.geometry);for(const a of Array.isArray(o.material)?o.material:[o.material]){e.add(a);for(const l of Object.values(a))l instanceof Xe&&n.add(l)}o.isInstancedMesh&&o.dispose()}}),t.forEach(s=>s.dispose()),e.forEach(s=>s.dispose()),n.forEach(s=>s.dispose()),this.root.clear(),this.chunks=[],this.monsterMixers=[],this.backdrop=null}}async function wM(r){const t=await new Zc().loadAsync(r),e=t.image,n=document.createElement("canvas");n.width=e.width,n.height=e.height;const i=n.getContext("2d");i.drawImage(e,0,0);const s=i.getImageData(0,0,n.width,n.height),o=s.data,a=Math.floor(n.width*.045);for(let c=0;c<n.height;c++)for(let h=0;h<a;h++){const u=(c*n.width+h)*4,d=(c*n.width+n.width-1-h)*4,f=h/a,m=.5*(1-f*f*(3-2*f));for(let _=0;_<3;_++){const g=o[u+_],p=o[d+_];o[u+_]=g*(1-m)+p*m,o[d+_]=p*(1-m)+g*m}}i.putImageData(s,0,0),t.dispose();const l=new Cf(n);return l.colorSpace=Be,l.wrapS=rs,l.wrapT=Dn,l.minFilter=ei,l.magFilter=We,l.anisotropy=2,l.generateMipmaps=!0,l}class zi{constructor(t){R(this,"data");if(t.schemaVersion!==1||t.cellMeters<=0||t.width*t.height!==t.walkable.length||t.clearanceMeters.length!==t.walkable.length)throw new Error("Invalid forest navigation mask");this.data=t}index(t){const e=this.data,n=Math.floor(t.x/e.cellMeters),i=Math.floor(t.y/e.cellMeters);return Number.isFinite(n+i)&&n>=0&&i>=0&&n<e.width&&i<e.height?i*e.width+n:-1}point(t){const e=this.data;return{x:(t%e.width+.5)*e.cellMeters,y:(Math.floor(t/e.width)+.5)*e.cellMeters}}canStand(t,e=.6){const n=this.data,i=n.cellMeters;if(!Number.isFinite(t.x+t.y+e)||e<0||t.x-e<0||t.y-e<0||t.x+e>=n.width*i||t.y+e>=n.height*i)return!1;for(let s=Math.floor((t.y-e)/i);s<=Math.floor((t.y+e)/i);s++)for(let o=Math.floor((t.x-e)/i);o<=Math.floor((t.x+e)/i);o++){if(n.walkable[s*n.width+o])continue;const a=Math.max(o*i-t.x,0,t.x-(o+1)*i),l=Math.max(s*i-t.y,0,t.y-(s+1)*i);if(a*a+l*l<=e*e+1e-9)return!1}return!0}segmentClear(t,e,n=.6){const i=Math.hypot(e.x-t.x,e.y-t.y),s=Math.max(1,Math.ceil(i/(this.data.cellMeters*.25)));if(!this.canStand(t,n)||!this.canStand(e,n))return!1;for(let o=0;o<s;o++){const a=(o+.5)/s;if(!this.canStand({x:t.x+(e.x-t.x)*a,y:t.y+(e.y-t.y)*a},n+i/s/2))return!1}return!0}move(t,e,n=.6){if(!this.canStand(t,n))return{...t};const i=Math.hypot(e.x-t.x,e.y-t.y),s=Math.max(1,Math.ceil(i/.12));let o={...t};const a=(e.x-t.x)/s,l=(e.y-t.y)/s;for(let c=0;c<s;c++){let h={x:o.x+a,y:o.y+l};if(this.segmentClear(o,h,n)){o=h;continue}h={x:o.x+a,y:o.y},this.segmentClear(o,h,n)&&(o=h),h={x:o.x,y:o.y+l},this.segmentClear(o,h,n)&&(o=h)}return o}findPath(t,e,n=.6){if(!this.canStand(t,n)||!this.canStand(e,n))return[];if(this.segmentClear(t,e,n))return[{...t},{...e}];const i=this.data,s=this.index(t),o=this.index(e),a=i.walkable.length,l=new Float64Array(a);l.fill(1/0),l[s]=0;const c=new Int32Array(a);c.fill(-1);const h=new Uint8Array(a),u=[],d=(S,w)=>{let A=u.length;for(u.push({i:S,f:w});A;){const v=A-1>>1;if(u[v].f<=w)break;u[A]=u[v],A=v}u[A]={i:S,f:w}},f=()=>{const S=u[0],w=u.pop();if(u.length){let A=0;for(;A*2+1<u.length;){let v=A*2+1;if(v+1<u.length&&u[v+1].f<u[v].f&&v++,u[v].f>=w.f)break;u[A]=u[v],A=v}u[A]=w}return S.i},m=S=>Math.abs(S%i.width-o%i.width)+Math.abs(Math.floor(S/i.width)-Math.floor(o/i.width)),_=this.point(s),g=this.point(o);if(!this.segmentClear(t,_,n)||!this.segmentClear(g,e,n))return[];for(d(s,m(s));u.length;){const S=f();if(!h[S]){if(h[S]=1,S===o)break;for(const w of[S-1,S+1,S-i.width,S+i.width]){if(w<0||w>=a||h[w]||!i.walkable[w]||Math.abs(w%i.width-S%i.width)+Math.abs(Math.floor(w/i.width)-Math.floor(S/i.width))!==1)continue;const A=l[S]+1;A>=l[w]||Math.min(i.clearanceMeters[S],i.clearanceMeters[w])<n+i.cellMeters&&!this.segmentClear(this.point(S),this.point(w),n)||(l[w]=A,c[w]=S,d(w,A+m(w)))}}}if(!h[o])return[];const p=[{...e}];let b=o;for(;b!==s;)if(p.push(this.point(b)),b=c[b],b<0)return[];p.push(_,{...t}),p.reverse();const E=[p[0]];let y=0;for(;y<p.length-1;){let S=y+1;for(;S+1<p.length&&this.segmentClear(p[y],p[S+1],n);)S++;E.push(p[S]),y=S}return E}spawnPoints(t,e={}){const n=e.radius??.65,i=e.random??Math.random,s=[];for(let o=0;o<t*1e3&&s.length<t;o++){const a=this.point(Math.min(this.data.walkable.length-1,Math.floor(i()*this.data.walkable.length)));!this.canStand(a,n+1)||e.awayFrom&&Math.hypot(a.x-e.awayFrom.x,a.y-e.awayFrom.y)<(e.minDistance??12)||s.some(l=>Math.hypot(a.x-l.x,a.y-l.y)<(e.spacing??3))||s.push(a)}return s}}const EM="/ui/layout/journey3d_layout.json",yc={version:1,world_m:70,fov_deg:70,char_height_m:1.7,fog_vision_m:30,fog_far_mul:1,fog_color:"#6a7f88",fog_color_polluted:"#6a7f88",fog_zenith_polluted:"#2e3d48",fog_color_purified:"#8eb0bc",fog_zenith_purified:"#5a98ac",move_speed_mps:4.6,walk_speed_mul:2/3,turn_speed_deg:115,turn_mode:"turn",view_mode:"tps",tps_distance_mul:2.6,tps_height_mul:1.55,tps_look_ahead_mul:2.2,bob_amp_m:.06,bob_hz:2.1,resolution_scale:1,approach_radius_m:3.4,detail_tile_m:2.5,detail_strength:.7,node_height_mul:1.05,prop_density:120};function Ge(r,t){const e=typeof r=="string"?Number(r):r;return typeof e=="number"&&Number.isFinite(e)?e:t}function TM(r){const t=r??{},e=yc;return{version:Ge(t.version,e.version),world_m:Ge(t.world_m,e.world_m),fov_deg:Ge(t.fov_deg,e.fov_deg),char_height_m:Ge(t.char_height_m,e.char_height_m),fog_vision_m:Ge(t.fog_vision_m,e.fog_vision_m),fog_far_mul:Ge(t.fog_far_mul,e.fog_far_mul),fog_color:typeof t.fog_color=="string"?t.fog_color:e.fog_color,fog_color_polluted:typeof t.fog_color_polluted=="string"?t.fog_color_polluted:e.fog_color_polluted,fog_zenith_polluted:typeof t.fog_zenith_polluted=="string"?t.fog_zenith_polluted:e.fog_zenith_polluted,fog_color_purified:typeof t.fog_color_purified=="string"?t.fog_color_purified:e.fog_color_purified,fog_zenith_purified:typeof t.fog_zenith_purified=="string"?t.fog_zenith_purified:e.fog_zenith_purified,move_speed_mps:Ge(t.move_speed_mps,e.move_speed_mps),walk_speed_mul:Ge(t.walk_speed_mul,e.walk_speed_mul),turn_speed_deg:Ge(t.turn_speed_deg,e.turn_speed_deg),turn_mode:t.turn_mode==="turn"?"turn":"strafe",view_mode:t.view_mode==="fps"?"fps":"tps",tps_distance_mul:Ge(t.tps_distance_mul,e.tps_distance_mul),tps_height_mul:Ge(t.tps_height_mul,e.tps_height_mul),tps_look_ahead_mul:Ge(t.tps_look_ahead_mul,e.tps_look_ahead_mul),bob_amp_m:Ge(t.bob_amp_m,e.bob_amp_m),bob_hz:Ge(t.bob_hz,e.bob_hz),resolution_scale:Ge(t.resolution_scale,e.resolution_scale),approach_radius_m:Ge(t.approach_radius_m,e.approach_radius_m),detail_tile_m:Ge(t.detail_tile_m,e.detail_tile_m),detail_strength:Ge(t.detail_strength,e.detail_strength),node_height_mul:Ge(t.node_height_mul,e.node_height_mul),prop_density:Ge(t.prop_density,e.prop_density),note:typeof t.note=="string"?t.note:void 0}}async function Kf(){try{const r=await fetch(`${EM}?t=${Date.now()}`);return r.ok?TM(await r.json()):{...yc}}catch{return{...yc}}}const AM="forestPlay.camMode",sd=-40,rd=28;function od(r){try{localStorage.setItem(AM,r)}catch{}}class CM{constructor(t){R(this,"camera",new tn(72,16/9,.05,700));R(this,"facing",Math.PI);R(this,"modeName","quarter");R(this,"charH",1.95);R(this,"ahead",5.265);R(this,"initialized",!1);R(this,"defaults",{distance:6.24,height:3.705,fov:72});R(this,"yaw",0);R(this,"pitch",0);R(this,"distance",6.24);R(this,"height",3.705);R(this,"followOrbit",{yaw:0,pitch:0});R(this,"quarterOrbit",{yaw:sd,pitch:rd});R(this,"drag",null);R(this,"target",new P);R(this,"wanted",new P);this.host=t,Kf().then(e=>{this.charH=e.char_height_m,this.ahead=e.char_height_m*e.tps_look_ahead_mul,this.defaults={distance:e.char_height_m*e.tps_distance_mul,height:e.char_height_m*e.tps_height_mul,fov:e.fov_deg},this.reset()}).catch(()=>this.reset()),this.reset(),this.wire(),od(this.modeName)}get mode(){return this.modeName}setMode(t){t!=="follow"&&t!=="quarter"||(t!==this.modeName&&(this.stashOrbit(),this.modeName=t,this.applyModeOrbit(),this.syncUi()),od(this.modeName))}wire(){this.host.onpointerdown=t=>{t.button===0&&(this.host.setPointerCapture(t.pointerId),this.drag={x:t.clientX,y:t.clientY,yaw:this.yaw,pitch:this.pitch,facing:this.facing})},this.host.onpointermove=t=>{if(!this.drag)return;const e=t.clientX-this.drag.x,n=t.clientY-this.drag.y;this.modeName==="follow"?(this.facing=this.drag.facing+Qe.degToRad(e*.35),this.pitch=Qe.clamp(this.drag.pitch+n*.2,-35,60),this.followOrbit.pitch=this.pitch):(this.yaw=Qe.clamp(this.drag.yaw+e*.35,-180,180),this.pitch=Qe.clamp(this.drag.pitch+n*.2,-35,60),this.quarterOrbit.yaw=this.yaw,this.quarterOrbit.pitch=this.pitch),this.syncUi()},this.host.onpointerup=this.host.onpointercancel=()=>{this.drag=null},this.host.addEventListener("wheel",t=>{t.preventDefault(),this.distance=Qe.clamp(this.distance+t.deltaY*.01,0,20),this.syncUi()},{passive:!1})}bindUi(){const t=e=>document.getElementById(e);for(const e of["camYaw","camPitch","camDistance","camHeight","camFov"])t(e).oninput=()=>{this.yaw=+t("camYaw").value,this.pitch=+t("camPitch").value,this.distance=+t("camDistance").value,this.height=+t("camHeight").value,this.camera.fov=+t("camFov").value,this.stashOrbit(),this.syncUi()};document.getElementById("camReset").onclick=()=>this.reset(),this.syncUi()}stashOrbit(){this.modeName==="quarter"?(this.quarterOrbit.yaw=this.yaw,this.quarterOrbit.pitch=this.pitch):(this.followOrbit.yaw=this.yaw,this.followOrbit.pitch=this.pitch)}applyModeOrbit(){this.modeName==="quarter"?(this.yaw=this.quarterOrbit.yaw,this.pitch=this.quarterOrbit.pitch):(this.yaw=this.followOrbit.yaw,this.pitch=this.followOrbit.pitch)}syncUi(){const t=(e,n,i=0)=>{const s=document.getElementById(e),o=document.getElementById(e+"Value");s&&(s.value=String(n)),o&&(o.textContent=n.toFixed(i))};t("camYaw",this.yaw),t("camPitch",this.pitch),t("camDistance",this.distance,1),t("camHeight",this.height,1),t("camFov",this.camera.fov)}reset(){this.distance=this.defaults.distance,this.height=this.defaults.height,this.camera.fov=this.defaults.fov,this.modeName==="quarter"?(this.quarterOrbit.yaw=sd,this.quarterOrbit.pitch=rd):(this.followOrbit.yaw=0,this.followOrbit.pitch=0),this.applyModeOrbit(),this.initialized=!1,this.syncUi()}groundForward(){const t=this.lookBearing();return{x:Math.sin(t),y:Math.cos(t)}}viewForward(){return this.groundForward()}bearingFromFacing(t){return Math.atan2(Math.sin(t),-Math.cos(t))}lookBearing(){return this.modeName==="quarter"?Qe.degToRad(this.yaw):this.bearingFromFacing(this.facing)+Qe.degToRad(this.yaw)}update(t,e,n,i){const s=this.lookBearing(),o=new P(Math.sin(s),0,-Math.cos(s));this.wanted.set(t-o.x*this.distance,this.height,-e-o.z*this.distance),!this.initialized||this.camera.position.distanceTo(this.wanted)>35?(this.camera.position.copy(this.wanted),this.initialized=!0):this.camera.position.lerp(this.wanted,Math.min(1,n*9));const a=this.modeName==="follow"?this.charH*.7:this.charH*1.85;this.target.set(t+o.x*this.ahead,a,-e+o.z*this.ahead),this.target.x+=this.camera.position.x-this.wanted.x,this.target.z+=this.camera.position.z-this.wanted.z,this.camera.lookAt(this.target),this.camera.rotateX(-Qe.degToRad(this.pitch)),this.camera.aspect=i,this.camera.updateProjectionMatrix()}}class Mc{constructor(){R(this,"camera",new tn(72,16/9,.05,700));R(this,"element",document.getElementById("previewFrame"));R(this,"charH",1.95);R(this,"ahead",5.265);R(this,"bearing",0);R(this,"initialized",!1);R(this,"defaults",{distance:6.24,height:3.705,fov:72});R(this,"drag",null);R(this,"target",new P);R(this,"wanted",new P);for(const t of["previewYaw","previewPitch","previewDistance","previewHeight","previewFov"])this.input(t).oninput=()=>this.labels();document.getElementById("previewReset").onclick=()=>this.reset(),this.element.onpointerdown=t=>{t.button===0&&(t.stopPropagation(),this.element.setPointerCapture(t.pointerId),this.drag={x:t.clientX,y:t.clientY,yaw:+this.input("previewYaw").value,pitch:+this.input("previewPitch").value})},this.element.onpointermove=t=>{this.drag&&(t.stopPropagation(),this.input("previewYaw").value=String(Qe.clamp(this.drag.yaw+(t.clientX-this.drag.x)*.35,-180,180)),this.input("previewPitch").value=String(Qe.clamp(this.drag.pitch+(t.clientY-this.drag.y)*.2,-35,60)),this.labels())},this.element.onpointerup=this.element.onpointercancel=t=>{t.stopPropagation(),this.drag=null},this.element.addEventListener("wheel",t=>{t.preventDefault(),t.stopPropagation(),this.input("previewDistance").value=String(Qe.clamp(+this.input("previewDistance").value+t.deltaY*.01,0,20)),this.labels()},{passive:!1}),document.getElementById("gamePreview").addEventListener("pointerdown",t=>t.stopPropagation()),document.getElementById("gamePreview").addEventListener("wheel",t=>t.stopPropagation(),{passive:!0}),Kf().then(t=>{this.charH=t.char_height_m,this.ahead=t.char_height_m*t.tps_look_ahead_mul,this.defaults={distance:t.char_height_m*t.tps_distance_mul,height:t.char_height_m*t.tps_height_mul,fov:t.fov_deg},this.reset()}).catch(()=>this.reset()),this.reset()}input(t){return document.getElementById(t)}labels(){for(const t of["previewYaw","previewPitch","previewDistance","previewHeight","previewFov"])document.getElementById(t+"Value").textContent=Number(this.input(t).value).toFixed(t==="previewDistance"||t==="previewHeight"?1:0)}reset(){this.input("previewYaw").value="0",this.input("previewPitch").value="0",this.input("previewDistance").value=String(this.defaults.distance),this.input("previewHeight").value=String(this.defaults.height),this.input("previewFov").value=String(this.defaults.fov),this.initialized=!1,this.labels()}update(t,e,n,i,s){Math.hypot(n,i)>1e-4&&(this.bearing=Math.atan2(n,i));const o=this.bearing+Qe.degToRad(+this.input("previewYaw").value),a=+this.input("previewDistance").value,l=+this.input("previewHeight").value,c=new P(Math.sin(o),0,-Math.cos(o));this.wanted.set(t-c.x*a,l,-e-c.z*a),!this.initialized||this.camera.position.distanceTo(this.wanted)>35?(this.camera.position.copy(this.wanted),this.initialized=!0):this.camera.position.lerp(this.wanted,Math.min(1,s*9)),this.target.set(t+c.x*this.ahead,this.charH*1.85,-e+c.z*this.ahead),this.camera.lookAt(this.target),this.camera.rotateX(-Qe.degToRad(+this.input("previewPitch").value));const h=this.element.getBoundingClientRect();this.camera.aspect=h.width/Math.max(1,h.height),this.camera.fov=+this.input("previewFov").value,this.camera.updateProjectionMatrix()}render(t,e,n=[]){const i=this.element.getBoundingClientRect();if(i.width<1||i.height<1)return;const s=t.domElement.getBoundingClientRect(),o=i.left-s.left,a=s.bottom-i.bottom,l=i.width,c=i.height;if(l<1||c<1)return;const h=n.map(f=>f.visible);for(const f of n)f.visible=!1;const u=t.domElement.width/Math.max(1,t.getPixelRatio()),d=t.domElement.height/Math.max(1,t.getPixelRatio());t.setScissorTest(!0),t.setViewport(o,a,l,c),t.setScissor(o,a,l,c);try{t.render(e,this.camera)}finally{n.forEach((f,m)=>{f.visible=h[m]}),t.setScissorTest(!1),t.setViewport(0,0,u,d)}}}R(Mc,"ASPECT",16/9),R(Mc,"FRAME_WIDTH_CSS","min(420px, calc(100% - 24px))");const sa=[{key:"RUON",name:"루온",gender:"남자",body:"기존 비율",file:"A/wanderer_A.glb?v=A02-crown",portrait:"A/reference_face.png"},{key:"RUON_35",name:"루온",gender:"남자",body:"3.5등신",file:"Ruon_35/ruon_35.glb?v=RUON35-03-crown",portrait:"A/reference_face.png"},{key:"RIA",name:"리아",gender:"여자",body:"기존 비율",file:"D/wanderer_D.glb?v=D08",portrait:"D/reference_face.png"},{key:"RIA_35",name:"리아",gender:"여자",body:"3.5등신",file:"D_35/wanderer_D_35.glb?v=D35-01",portrait:"D/reference_face.png"}];function Yr(r){const t=sa.find(e=>e.key===r);return t?`${t.name} · ${t.body}`:r}const ad="/tools/unit_lab/character",hl=1.5;class Zf{constructor(){R(this,"root",new _e);R(this,"clips",[]);R(this,"key",null);R(this,"current","");R(this,"height",hl);R(this,"mixer",null);R(this,"actions",new Map);R(this,"lockT",0);R(this,"token",0)}static catalogEntries(){return sa.map(t=>({key:t.key,label:`${t.name} · ${t.body}`,gender:t.gender,body:t.body,file:t.file,url:`${ad}/${t.file}`}))}async load(t){const e=sa.find(d=>d.key===t);if(!e)throw new Error("unknown character "+t);const n=++this.token,i=`${ad}/${e.file}`,s=await new Gn().loadAsync(i);if(n!==this.token){ld(s.scene);return}this.clear();const o=s.scene;o.traverse(d=>{(/^(mg_|rf_|bomb)/.test(d.name)||/^face_/.test(d.name)&&!/^face_default/.test(d.name))&&(d.visible=!1);const f=d;f.isMesh&&(f.castShadow=!0,f.receiveShadow=!0)}),o.updateMatrixWorld(!0);const a=new Pe;o.traverse(d=>{d.isMesh&&!/^[AD]_prop_/.test(d.name)&&a.expandByObject(d)}),a.isEmpty()&&a.setFromObject(o);const l=a.getSize(new P),c=Math.max(.1,l.y),h=hl/c;o.scale.setScalar(h),o.position.y=-a.min.y*h,this.height=hl,this.root.add(o),this.clips.length=0,this.clips.push(...s.animations),this.mixer=new Gi(o),this.actions.clear();for(const d of s.animations)this.actions.set(d.name,this.mixer.clipAction(d));this.key=t;const u=s.animations.find(d=>d.name==="idle")??s.animations[0];u&&this.play(u.name)}play(t,e=!1){if(!this.mixer||!this.actions.size)return;let n=this.actions.get(t);if(!n){const l=[...this.actions.keys()].find(c=>c.toLowerCase()===t.toLowerCase());n=l?this.actions.get(l):void 0}if(!n){if(n=this.actions.get("idle")??[...this.actions.values()][0],!n)return;t=n.getClip().name}const i=n.getClip().name;if(!e&&this.current===i&&n.isRunning()&&n.enabled&&n.getEffectiveWeight()>.85&&n.loop===yi)return;const o=/^(draw|holster)/i.test(i),a=/^(shoot|shoot2|throw)$/i.test(i);this.lockT=o?n.getClip().duration+.02:e&&a?Math.min(.32,Math.max(.16,n.getClip().duration*.4)):0,this.current=i,n.reset(),n.setLoop(e?df:yi,e?1:1/0),n.clampWhenFinished=e,n.enabled=!0,n.setEffectiveWeight(1),n.play();for(const[l,c]of this.actions)l!==i&&c.isRunning()&&c.fadeOut(.12)}get pose(){const t=this.actions.get(this.current);return{name:this.current,time:(t==null?void 0:t.time)??0,weight:t?t.getEffectiveWeight():0}}has(t){if(this.actions.has(t))return!0;const e=t.toLowerCase();return[...this.actions.keys()].some(n=>n.toLowerCase()===e)}duration(t){const e=this.clips.find(n=>n.name.toLowerCase()===t.toLowerCase());return(e==null?void 0:e.duration)??.8}findNamed(t){if(this.actions.has(t))return t;const e=t.toLowerCase();return[...this.actions.keys()].find(n=>n.toLowerCase()===e)}syncBody(t,e="walk_shoot"){if(this.lockT>0)return;let n;t==="run"?n=this.findNamed("run")??this.findNamed("move"):t==="attack"?n=this.findNamed(e):n=this.findNamed("idle")??this.findNamed("stand")??this.findNamed("ingame_idle"),n&&n!==this.current&&this.play(n)}syncLocomotion(t){this.syncBody(t?"run":"still")}tick(t){var e;this.lockT=Math.max(0,this.lockT-t),(e=this.mixer)==null||e.update(t)}clear(){var t;for(;this.root.children.length;){const e=this.root.children[0];this.root.remove(e),ld(e)}(t=this.mixer)==null||t.stopAllAction(),this.mixer=null,this.actions.clear(),this.clips.length=0,this.current="",this.key=null}dispose(){this.clear(),this.root.removeFromParent()}}function ld(r){const t=new Set,e=new Set;r.traverse(n=>{const i=n;if(i.isMesh){t.add(i.geometry);for(const s of Array.isArray(i.material)?i.material:[i.material])e.add(s)}}),t.forEach(n=>n.dispose()),e.forEach(n=>n.dispose())}const cd=.1;class RM{constructor(t,e,n,i,s,o){R(this,"root",new _e);R(this,"mobs",[]);R(this,"playing",!1);R(this,"autoHunt",!0);R(this,"weapon","pistol");R(this,"missileKind","pistol");R(this,"stepping",!1);R(this,"clipHeld",!1);R(this,"rangeM",9);R(this,"regenDelay",.85);R(this,"packMin",10);R(this,"packMax",15);R(this,"packRanks",2);R(this,"fileLat",1.7);R(this,"fileDep",2);R(this,"frontHold",8.2);R(this,"serial",0);R(this,"proto",null);R(this,"protoClips",[]);R(this,"pool",[]);R(this,"aimMob",null);R(this,"shotT",0);R(this,"shotLanded",!1);R(this,"packT",0);R(this,"fireCd",0);R(this,"shots",[]);R(this,"missiles",[]);R(this,"volleySerial",0);R(this,"hitVolleys",new Set);R(this,"pending",null);R(this,"drawn","none");R(this,"gear","idle");R(this,"gearLeft",0);R(this,"gearTarget","pistol");R(this,"wantWeapon","pistol");R(this,"manualThrow",!1);R(this,"holdWeapon",!1);R(this,"huntPhase","shoot");R(this,"sidestepUsed",!1);R(this,"rangeRing",null);R(this,"walkMps",2.6);R(this,"runMps",6);R(this,"viewForward",()=>null);R(this,"status","전투 대기");R(this,"loaded",!1);R(this,"pistolFireCd",.55);R(this,"bazookaFireCd",1.05);this.scene=t,this.getNav=e,this.getPlayer=n,this.setPlayer=i,this.playChar=s,this.monsterUrl=o,this.scene.add(this.root)}get shotBusy(){return this.pending!==null||this.missiles.some(t=>t.damage&&!t.spent)}get gearBusy(){return this.gear!=="idle"}get attacking(){return this.playing?this.fireCd>0||this.missiles.length>0?!0:/^(shoot|shoot2|throw|walk_shoot|walk_throw)$/i.test(this.playChar.current):!1}get footMps(){return this.attacking||this.gearBusy?this.walkMps:this.runMps}aimYaw(){if(!this.autoHunt||!this.playing)return null;const t=this.getPlayer(),e=this.nearestAlive(t);return e?Math.atan2(e.mob.pos.x-t.x,-(e.mob.pos.y-t.y)):null}nearestAlive(t){let e=null,n=1/0;for(const i of this.mobs){if(!i.alive)continue;const s=Math.hypot(i.pos.x-t.x,i.pos.y-t.y);s<n&&(n=s,e=i)}return e?{mob:e,dist:n}:null}onCharacterReady(){this.drawn="none",this.gear="idle",this.gearLeft=0,this.holdWeapon=!1,this.applyProps()}setWeapon(t,e=!0){this.holdWeapon=e,this.weapon=t,this.wantWeapon=t,this.missileKind=t,this.manualThrow=!1,this.shotT=0,this.shotLanded=!1,this.fireCd=0,this.gear!=="idle"&&(this.gear="idle",this.gearLeft=0),this.kickGear(),this.status=`무기: ${t==="pistol"?"dual pistol":"bazooka"}`}setMissile(t){if(this.missileKind=t,t==="throw"){this.manualThrow=!0,this.fireCd=0,this.kickGear(),this.status="미사일: 투척 포물선";return}this.setWeapon(t)}releaseWeaponHold(){this.holdWeapon=!1}moveAttackClip(){return this.missileKind==="throw"?"walk_throw":this.weapon==="bazooka"?"walk_gun":"walk_shoot"}get infoText(){var e;const t=this.mobs.filter(n=>n.alive).length;return[this.status,`weapon: ${this.weapon==="pistol"?"dual pistol":"bazooka"} · ${this.drawn==="none"?"납도":"발도"} ${this.gear==="idle"?"":this.gear}`.trim(),`missile: ${this.missileKind}`,`애니: ${this.playChar.current||"-"}`,this.playing?"사냥: PLAY":"사냥: STOP",`자동 사냥: ${this.autoHunt?"ON":"OFF"}`,`생존 몹: ${t} / ${this.mobs.length}`,this.protoClips.length?`몹 클립: ${this.protoClips.map(n=>n.name).join(", ")}`:"몹 클립: (없음)",(e=this.aimMob)!=null&&e.alive?`조준 #${this.aimMob.id} hp ${this.aimMob.hp}${this.aimMob.currentClip?` · ${this.aimMob.currentClip}`:""}`:"조준 없음",`사거리 ${this.rangeM.toFixed(1)} m · 전방 직선샷 · ${this.packRanks}열 종대`].join(`
`)}preferClip(t){const e=this.protoClips;return e.length?t?e.find(n=>/^walk$/i.test(n.name))||e.find(n=>/walk/i.test(n.name))||e.find(n=>/^run$/i.test(n.name))||e.find(n=>/run/i.test(n.name))||e.find(n=>/idle|stand/i.test(n.name))||e[0]||null:e.find(n=>/^(idle|stand)$/i.test(n.name))||e.find(n=>/idle|stand/i.test(n.name))||e[0]||null:null}bindMobMixer(t,e){if(!t.clips.length)return;t.mixer||(t.mixer=new Gi(t.mesh));const n=this.preferClip(e);if(!n||t.currentClip===n.name)return;const i=t.clips.find(a=>a.name===t.currentClip),s=i?t.mixer.existingAction(i):null,o=t.mixer.clipAction(n);o.reset().setLoop(yi,1/0),s&&s!==o&&s.isRunning()&&s.crossFadeTo(o,.12,!1),o.play(),t.currentClip=n.name}stopMobMixer(t){var e;(e=t.mixer)==null||e.stopAllAction(),t.mixer=null,t.currentClip=""}emptyMob(t,e){return{id:0,mesh:t,pos:{x:0,y:0},hp:0,maxHp:2,alive:!1,dying:!1,dieT:0,flinch:0,mixer:null,clips:e,currentClip:"",route:[],pathT:0,stuckT:0,lastPos:{x:0,y:0},rank:0,lat:0,fadeMats:null}}async load(){if(this.loaded)return;const t=this.monsterUrl||"/tools/unit_lab/monsters_anim/mushnub.glb";try{const i=await new Gn().loadAsync(t);this.proto=i.scene,this.protoClips=i.animations??[],this.proto.traverse(c=>{const h=c;h.isMesh&&(h.castShadow=!0,h.receiveShadow=!0)}),this.proto.updateMatrixWorld(!0);const s=new Pe().setFromObject(this.proto),o=s.getSize(new P),l=1.15/Math.max(.2,o.y);this.proto.scale.setScalar(l),this.proto.position.y=-s.min.y*l}catch(i){console.warn("monster glb failed, using placeholder",i);const s=new te(new Kc(.35,.55,4,8),new hn({color:8310634}));s.position.y=.625,s.castShadow=!0,this.proto=s,this.protoClips=[]}const e=Math.max(18,this.packMax+3);for(let i=0;i<e;i++){let s;if(this.protoClips.length)try{s=sr(this.proto)}catch{s=this.proto.clone(!0)}else s=this.proto.clone(!0);s.visible=!1,this.root.add(s),this.pool.push(s);const o=this.protoClips.slice(),a=this.emptyMob(s,o);if(o.length){a.mixer=new Gi(s);const l=this.preferClip(!1);l&&(a.mixer.clipAction(l).setLoop(yi,1/0).play(),a.currentClip=l.name)}this.mobs.push(a)}this.loaded=!0;const n=this.protoClips.map(i=>i.name).join(", ")||"(없음)";this.status=`몹 모델 준비 · 클립 ${n}`}play(){this.playing=!0,this.packT=0,this.status="사냥 PLAY",this.mobs.some(t=>t.alive)||this.spawnWave()}stop(){this.playing=!1,this.aimMob=null,this.shotT=0,this.status="사냥 STOP";for(const t of this.mobs)t.alive&&(t.route=[],this.bindMobMixer(t,!1))}clearWave(){for(const t of this.mobs)if(t.alive=!1,t.dying=!1,t.mesh.visible=!1,t.route=[],t.pathT=0,t.stuckT=0,t.mixer&&t.clips.length){const e=this.preferClip(!1);e&&t.currentClip!==e.name&&(t.mixer.stopAllAction(),t.mixer.clipAction(e).setLoop(yi,1/0).play(),t.currentClip=e.name)}this.aimMob=null,this.shotT=0,this.pending=null;for(const t of this.missiles)this.root.remove(t.mesh),t.mesh.geometry.dispose(),t.mesh.material.dispose();this.missiles.length=0}spawnWave(t){const e=this.getNav();if(!e)return this.status="내비 없음 — 스폰 불가",0;const n=this.getPlayer();this.clearWave(),this.faceView();const i=this.playChar.root.rotation.y,s=Math.sin(i),o=-Math.cos(i),a=Math.cos(i),l=Math.sin(i),c=t??this.packMin+Math.floor(Math.random()*(this.packMax-this.packMin+1)),h=this.packRanks,u=Math.ceil(c/h);let d=0;for(let f=0;f<h&&d<c;f++){const m=Math.min(u,c-d);for(let _=0;_<m&&d<c;_++){const g=(_-(m-1)/2)*this.fileLat,p=this.frontHold+f*this.fileDep;let b={x:n.x+s*p+a*g,y:n.y+o*p+l*g};if(!e.canStand(b,.7)){const y=this.nudgeStand(e,b,n,.7);if(!y)continue;b=y}if(this.mobs.some(y=>y.alive&&Math.hypot(y.pos.x-b.x,y.pos.y-b.y)<1.2)){const y=this.nudgeStand(e,b,n,.7,1.2);if(!y)continue;b=y}const E=this.mobs[d];if(!E)break;this.activateMob(E,b,f,g),d++}}if(d<Math.min(this.packMin,c))for(let f=0;f<120&&d<c;f++){const m=i+(Math.random()-.5)*1.1,_=this.frontHold+Math.random()*this.fileDep*h,g=(Math.random()-.5)*this.fileLat*u,p={x:n.x+Math.sin(m)*_+Math.cos(i)*g,y:n.y-Math.cos(m)*_+Math.sin(i)*g};if(!e.canStand(p,.7)||this.mobs.some(E=>E.alive&&Math.hypot(E.pos.x-p.x,E.pos.y-p.y)<1.4))continue;const b=this.mobs[d];if(!b)break;this.activateMob(b,p,d<u?0:1,g),d++}return this.aimMob=null,this.shotT=0,this.pending=null,this.packT=0,this.status=`종대 스폰 ${d}마리 · ${h}열`,d}clipForGear(t,e){return t==="draw"?e==="pistol"?"draw":"draw_launcher":e==="pistol"?"holster":"holster_launcher"}applyProps(){const t=i=>this.gear==="idle"?this.drawn===i:this.gearTarget===i,e=t("pistol"),n=t("bazooka");this.playChar.root.traverse(i=>{/^[AD]_prop_gunL?$/.test(i.name)&&(i.visible=e),/^[AD]_prop_rifle$/.test(i.name)&&(i.visible=n)})}beginGear(t,e){const n=this.clipForGear(t,e);if(this.gearTarget=e,!this.playChar.has(n)){this.drawn=t==="draw"?e:"none",this.gear="idle",this.gearLeft=0,this.applyProps();return}this.gear=t,this.gearLeft=this.playChar.duration(n),this.playChar.play(n,!0),this.applyProps(),this.status=t==="draw"?`발도 ${e}`:`납도 ${e}`}kickGear(){if(this.gear!=="idle"||!this.playChar.key)return;if(this.manualThrow||this.missileKind==="throw"){this.drawn!=="none"&&this.beginGear("holster",this.drawn);return}const t=this.wantWeapon==="bazooka"?"bazooka":"pistol";if(this.drawn===t){this.applyProps();return}this.drawn!=="none"?this.beginGear("holster",this.drawn):this.beginGear("draw",t)}tickGear(t){this.gear!=="idle"&&(this.gearLeft-=t,!(this.gearLeft>0)&&(this.drawn=this.gear==="draw"?this.gearTarget:"none",this.gear="idle",this.gearLeft=0,this.applyProps(),this.kickGear()))}faceView(){const t=this.viewForward();if(!t)return;const e=Math.hypot(t.x,t.y);e<.2||(this.playChar.root.rotation.y=Math.atan2(t.x/e,-t.y/e))}nudgeStand(t,e,n,i,s=0){const o=[0,.6,1.2,1.8,2.4,3],a=12;for(const l of o)for(let c=0;c<a;c++){const h=c/a*Math.PI*2,u={x:e.x+Math.cos(h)*l,y:e.y+Math.sin(h)*l};if(!t.canStand(u,i))continue;const d=Math.hypot(u.x-n.x,u.y-n.y);if(!(d<4||d>28)&&!(s>0&&this.mobs.some(f=>f.alive&&Math.hypot(f.pos.x-u.x,f.pos.y-u.y)<s)))return u}return null}activateMob(t,e,n,i){if(t.id=++this.serial,t.pos={...e},t.hp=t.maxHp=2,t.alive=!0,t.dying=!1,t.dieT=0,t.flinch=0,t.route=[],t.pathT=0,t.stuckT=0,t.lastPos={...e},t.rank=n,t.lat=i,t.mesh.visible=!0,t.mesh.scale.setScalar(cd),t.mesh.position.copy(Fe(e.x,e.y,0)),t.fadeMats)for(const s of t.fadeMats)s.opacity=1}spawnNearPlayer(t=1){const e=this.getNav();if(!e)return this.status="내비 없음 — 스폰 불가",0;const n=this.getPlayer();let i=0;for(let s=0;s<120&&i<t;s++){const o=Math.random()*Math.PI*2,a=4+Math.random()*6,l={x:n.x+Math.cos(o)*a,y:n.y+Math.sin(o)*a};if(!e.canStand(l,.7)||this.mobs.some(h=>h.alive&&Math.hypot(h.pos.x-l.x,h.pos.y-l.y)<1.6))continue;const c=this.mobs.find(h=>!h.alive&&!h.dying);if(!c)break;this.activateMob(c,l,0,0),i++}return this.status=`근처 스폰 ${i}마리`,i}manualFire(){this.playing||this.play(),this.fireCd=0,this.tryFire(!0)}tick(t){var o,a;if(this.tickGear(t),!this.loaded||!this.playing){this.syncRangeRing(null);return}this.updateMissiles(t),this.updateShots(t),this.advanceShot(t);const e=this.getNav(),n=this.getPlayer();this.syncRangeRing(n);let i=0,s=99;for(const l of this.mobs)l.alive&&l.rank<s&&(s=l.rank);for(const l of this.mobs){if(l.dying){l.dieT-=t;const u=Math.max(0,l.dieT/.55);l.mesh.scale.setScalar(cd*(.4+.6*u)),this.fadeMob(l,u),(o=l.mixer)==null||o.update(t),l.dieT<=0&&(l.dying=!1,l.mesh.visible=!1);continue}if(!l.alive){l.mesh.visible=!1;continue}i++;let c=!1;l.flinch>0?l.flinch-=t:e&&(c=this.chaseSlot(l,n,e,t,s)),l.mesh.position.copy(Fe(l.pos.x,l.pos.y,0));const h=Math.atan2(n.x-l.pos.x,-(n.y-l.pos.y));l.mesh.rotation.y=h,this.bindMobMixer(l,c),(a=l.mixer)==null||a.update(t)}if(i===0&&!this.mobs.some(l=>l.dying)){if(this.packT+=t,this.packT>=this.regenDelay){this.spawnWave();return}}else this.packT=0;this.pickAim(n,e),this.applyFormationWeapon(),this.autoHunt&&this.autoApproach(t,n,e),this.tryFire(!1),this.shotT+=t,this.fireCd=Math.max(0,this.fireCd-t)}chaseSlot(t,e,n,i,s){const a=this.slotGoal(t,e,n,s);if(Math.hypot(a.x-t.pos.x,a.y-t.pos.y)<.35)return t.route=[],!1;if(t.pathT+=i,t.route.length===0||t.pathT>=1||t.stuckT>.45){t.pathT=0,t.stuckT=0;const _=n.findPath(t.pos,a,.65);t.route=_.length>=2?_.slice(1):[]}const h=t.route[0]??a,u=Math.hypot(h.x-t.pos.x,h.y-t.pos.y);if(u<.2)return t.route.shift(),!1;const d=Math.min(3*i,u),f={...t.pos};t.pos=n.move(t.pos,{x:t.pos.x+(h.x-t.pos.x)/u*d,y:t.pos.y+(h.y-t.pos.y)/u*d},.65);const m=Math.hypot(t.pos.x-f.x,t.pos.y-f.y);return m<4e-4?(t.stuckT+=i,t.stuckT>.45&&(t.route=[])):t.stuckT=0,t.lastPos={...t.pos},m>5e-4}slotGoal(t,e,n,i){const s=this.mobs.filter(m=>m.alive);let o=Math.sin(this.playChar.root.rotation.y),a=-Math.cos(this.playChar.root.rotation.y);if(s.length){let m=0,_=0;for(const E of s)m+=E.pos.x,_+=E.pos.y;const g=m/s.length-e.x,p=_/s.length-e.y,b=Math.hypot(g,p);b>.4&&(o=g/b,a=p/b)}const l=-a,c=o,h=s.length<=1,u=h?this.frontHold:this.frontHold+(t.rank-i)*this.fileDep,d=h?0:t.lat;let f={x:e.x+o*u+l*d,y:e.y+a*u+c*d};return n.canStand(f,.65)||(f=this.nudgeStand(n,f,e,.65)??t.pos),f}applyFormationWeapon(){if(!this.autoHunt||this.shotBusy||this.gearBusy||this.manualThrow||this.holdWeapon)return;const t=this.mobs.filter(i=>i.alive);if(!t.length)return;const e=Math.ceil(this.packRanks/2),n=t.some(i=>i.rank<e)?"pistol":"bazooka";n!==this.weapon&&this.setWeapon(n,!1)}sideStep(t,e,n,i){const s=this.aimMob,o=Math.cos(e),a=Math.sin(e),l=1.6*i*3,c=n.move(t,{x:t.x+o*l,y:t.y+a*l},.6),h=n.move(t,{x:t.x-o*l,y:t.y-a*l},.6),u=f=>{const m=Math.hypot(f.x-t.x,f.y-t.y);return(s!=null&&s.alive&&n.segmentClear(f,s.pos,.15)?2:0)+m},d=u(c)>=u(h)?c:h;return Math.hypot(d.x-t.x,d.y-t.y)>.002?d:null}pickAim(t,e){var l;const n=this.mobs.filter(c=>c.alive);if(!n.length){this.aimMob=null;return}const i=Math.min(...n.map(c=>c.rank)),s=n.filter(c=>c.rank===i),o=e?s.filter(c=>e.segmentClear(t,c.pos,.15)):s,a=o.length?o:s.length?s:n;if(!((l=this.aimMob)!=null&&l.alive)||!a.includes(this.aimMob)){let c=1/0,h=null;for(const u of a){const d=Math.hypot(u.pos.x-t.x,u.pos.y-t.y);d<c&&(c=d,h=u)}this.aimMob=h,this.shotT=0,this.shotLanded=!1}}autoApproach(t,e,n){var h;if(!n)return;const i=this.nearestAlive(e);if(!i)return;const{dist:s}=i,o=this.rangeM*.5;if(this.huntPhase==="chase"?s<=o&&(this.huntPhase="shoot",this.sidestepUsed=!1):s>this.rangeM&&(this.huntPhase="chase",this.sidestepUsed=!1),this.gearBusy||this.stepping)return;const a=Math.atan2(i.mob.pos.x-e.x,-(i.mob.pos.y-e.y)),l=this.attacking?this.walkMps:4.2;let c=e;if(this.huntPhase==="chase"){const u=Math.min(l*t,Math.max(0,s-o));if(u>0){const d={x:e.x+Math.sin(a)*u,y:e.y-Math.cos(a)*u};c=n.move(e,d,.6),Math.hypot(c.x-e.x,c.y-e.y)<u*.25?this.sidestepUsed||(c=this.sideStep(e,a,n,t)??c,this.sidestepUsed=!0):this.sidestepUsed=!1}}else(h=this.aimMob)!=null&&h.alive&&!n.segmentClear(e,this.aimMob.pos,.15)?this.sidestepUsed||(c=this.sideStep(e,a,n,t)??e,this.sidestepUsed=!0):this.sidestepUsed=!1;c!==e&&(this.stepping=!0,this.setPlayer(c))}syncRangeRing(t){const e=t!=null&&this.autoHunt&&this.playing;if(!this.rangeRing){const n=new pa(.985,1,72),i=new Le({color:8376575,transparent:!0,opacity:.55,side:on,depthWrite:!1});this.rangeRing=new te(n,i),this.rangeRing.rotation.x=-Math.PI/2,this.rangeRing.renderOrder=2,this.root.add(this.rangeRing)}this.rangeRing.visible=e,!(!e||!t)&&(this.rangeRing.scale.set(this.rangeM,this.rangeM,1),this.rangeRing.position.copy(Fe(t.x,t.y,.04)))}holeOf(t,e){const n=this.playChar.root;n.updateMatrixWorld(!0);let i=!1;return n.traverse(s=>{var c;if(i)return;const o=s;if(!o.isSkinnedMesh||!s.visible||!t.includes(s.name))return;const a=o.userData.muzzleLocal;if(!Array.isArray(a)||a.length<3)return;const l=(c=o.skeleton)==null?void 0:c.bones.find(h=>h.name===String(o.userData.prop||""));l&&(e.set(-Number(a[0]),Number(a[1]),-Number(a[2])),l.localToWorld(e),i=!0)}),i||this.findMuzzle(t,e)}findMuzzle(t,e){const n=this.playChar.root;n.updateMatrixWorld(!0);const i=n.rotation.y,s=new P(Math.sin(i),0,-Math.cos(i)),o=new Pe;if(n.traverse(h=>{const u=h;!u.isMesh||!h.visible||!t.includes(h.name)||o.expandByObject(u)}),o.isEmpty())return!1;const a=[new P(o.min.x,o.min.y,o.min.z),new P(o.min.x,o.min.y,o.max.z),new P(o.min.x,o.max.y,o.min.z),new P(o.min.x,o.max.y,o.max.z),new P(o.max.x,o.min.y,o.min.z),new P(o.max.x,o.min.y,o.max.z),new P(o.max.x,o.max.y,o.min.z),new P(o.max.x,o.max.y,o.max.z)],l=n.getWorldPosition(new P);let c=-1/0;for(const h of a){const u=h.clone().sub(l).dot(s);u>c&&(c=u,e.copy(h))}return c>.05}muzzlePoints(){const t=this.playChar.root,e=t.rotation.y,n=t.getWorldPosition(new P),i=new P(Math.sin(e),0,-Math.cos(e)),s=new P(Math.cos(e),0,Math.sin(e)),o=h=>n.clone().addScaledVector(i,.85).addScaledVector(s,h*.22).setY(n.y+1),a=new P;if(this.weapon==="bazooka")return this.holeOf(["D_prop_rifle","A_prop_rifle"],a)||a.copy(o(0)),[a];const l=new P,c=new P;return this.holeOf(["D_prop_gun","A_prop_gun"],l)||l.copy(o(1)),this.holeOf(["D_prop_gunL","A_prop_gunL"],c)||c.copy(o(-1)),[l,c]}throwOrigin(){const t=this.playChar.root,e=t.rotation.y,n=t.getWorldPosition(new P),i=new P(Math.sin(e),0,-Math.cos(e));return n.clone().addScaledVector(i,.45).setY(n.y+this.playChar.height*.62)}tryFire(t){if(this.gearBusy||!this.playChar.key||this.fireCd>0&&!t)return;if(this.missileKind==="throw"){if(this.drawn!=="none"){this.kickGear();return}}else if(this.drawn!==this.weapon){this.kickGear();return}const e=this.getPlayer(),n=this.playChar.root.rotation.y,i=Math.sin(n),s=-Math.cos(n),o=this.rangeM,a=this.getNav();let l=o;if(a){let y=0,S=o;for(let w=0;w<12;w++){const A=(y+S)/2,v={x:e.x+i*A,y:e.y+s*A};a.segmentClear(e,v,.15)?y=A:S=A}if(l=y,l<.55&&!t)return}if(!this.rayHit(e,i,s,l)&&!t)return;const h=this.stepping;let u="shoot",d=!0;this.missileKind==="throw"?(u=h&&this.playChar.has("walk_throw")?"walk_throw":"throw",d=u==="throw"):this.weapon==="bazooka"?u="shoot2":h&&this.playChar.has("walk_shoot")&&(u="walk_shoot",d=!1),!this.clipHeld&&this.playChar.has(u)&&this.playChar.play(u,d);const f=this.missileKind==="throw"?[this.throwOrigin()]:this.muzzlePoints(),m=++this.volleySerial,_=this.missileKind==="bazooka"?14:this.missileKind==="throw"?9:22,g=this.missileKind==="throw"?2.4:0,p=this.missileKind==="bazooka"?16761162:this.missileKind==="throw"?13747485:8257518,b=this.missileKind==="bazooka"?.16:.07,E=new P(i,0,-s);E.lengthSq()<1e-8&&E.set(0,0,-1),E.normalize(),f.forEach((y,S)=>{this.launchMissile({from:y,dir:E,speed:_,arc:g,color:p,radius:b,volley:m,damage:S===0,mapOrigin:{...e},mapFx:i,mapFy:s,clearDist:l})}),this.fireCd=this.missileKind==="bazooka"?this.bazookaFireCd:this.missileKind==="throw"?.9:this.pistolFireCd,this.shotLanded=!1,this.status=`미사일 ${this.missileKind} ${f.length}발 · clear ${l.toFixed(1)}m`}launchMissile(t){const e=new te(new nr(t.radius,8,6),new Le({color:t.color}));e.position.copy(t.from),this.root.add(e),this.missiles.push({mesh:e,origin:t.from.clone(),dir:t.dir.clone(),speed:t.speed,traveled:0,maxDist:Math.max(.6,t.clearDist),arc:t.arc,volley:t.volley,damage:t.damage,mapOrigin:t.mapOrigin,mapFx:t.mapFx,mapFy:t.mapFy,clearDist:t.clearDist,spent:!1})}updateMissiles(t){for(let e=this.missiles.length-1;e>=0;e--){const n=this.missiles[e];n.traveled+=n.speed*t;const i=Math.min(n.traveled,n.maxDist),s=i/Math.max(.01,n.maxDist),o=n.origin.clone().addScaledVector(n.dir,i);if(n.arc>0&&(o.y+=Math.sin(Math.PI*s)*n.arc),n.mesh.position.copy(o),n.damage&&!n.spent&&!this.hitVolleys.has(n.volley)){const a=this.rayHit(n.mapOrigin,n.mapFx,n.mapFy,Math.min(i,n.clearDist));if(a){const l=(a.pos.x-n.mapOrigin.x)*n.mapFx+(a.pos.y-n.mapOrigin.y)*n.mapFy;i+.35>=l&&(this.hitVolleys.add(n.volley),n.spent=!0,this.landHit(a),this.aimMob=a.alive?a:null,this.status=`착탄 #${a.id} · hp ${a.hp}`)}}n.traveled<n.maxDist||(this.root.remove(n.mesh),n.mesh.geometry.dispose(),n.mesh.material.dispose(),this.missiles.splice(e,1))}if(this.hitVolleys.size>24){const e=[...this.hitVolleys].slice(-8);this.hitVolleys.clear();for(const n of e)this.hitVolleys.add(n)}}rayHit(t,e,n,i){let s=null,o=1/0;const a=.85;for(const l of this.mobs){if(!l.alive)continue;const c=(l.pos.x-t.x)*e+(l.pos.y-t.y)*n;if(c<.4||c>i+.2)continue;const h=t.x+e*c,u=t.y+n*c;Math.hypot(l.pos.x-h,l.pos.y-u)>a||c<o&&(o=c,s=l)}return s}advanceShot(t){if(!this.pending||(this.pending.t-=t,this.pending.t>0))return;const e=this.pending;this.pending=null;const n=this.rayHit(e.origin,e.fx,e.fy,e.clearDist);if(this.shotLanded=!!n,!n){this.status="직선샷 착탄 없음";return}this.landHit(n),this.aimMob=n.alive?n:null,this.status=`착탄 #${n.id} · hp ${n.hp}`}fadeMob(t,e){if(!t.fadeMats){const n=[];t.mesh.traverse(i=>{const s=i;if(!s.isMesh)return;const a=(Array.isArray(s.material)?s.material:[s.material]).map(l=>{const c=l.clone();return c.transparent=!0,n.push(c),c});s.material=a.length===1?a[0]:a}),t.fadeMats=n}for(const n of t.fadeMats)n.opacity=e,n.depthWrite=e>.45}landHit(t){t.flinch=.22,t.hp>1?t.hp-=1:(t.hp=0,t.alive=!1,t.dying=!0,t.dieT=.55,t.route=[],this.aimMob===t&&(this.aimMob=null))}spawnShotFx(t,e){const n=new te(new nr(.12,8,6),new Le({color:8257518})),i=new te(new Vi(.1,.055,1,8),new Le({color:8257518}));this.root.add(n,i),this.shots.push({ball:n,beam:i,life:.14,from:t.clone(),to:e.clone()}),this.placeBolt(n,i,t,e,0)}placeBolt(t,e,n,i,s){const o=n.clone().lerp(i,Math.max(0,Math.min(1,s))),a=n.clone().lerp(o,.5),l=n.distanceTo(o);t.position.copy(o),e.position.copy(a),e.scale.set(1,Math.max(.05,l),1);const c=o.clone().sub(n);c.lengthSq()<1e-8||e.quaternion.setFromUnitVectors(new P(0,1,0),c.normalize())}updateShots(t){for(let e=this.shots.length-1;e>=0;e--){const n=this.shots[e];n.life-=t,this.placeBolt(n.ball,n.beam,n.from,n.to,1-Math.max(0,n.life)/.14),n.life<=0&&(this.root.remove(n.ball,n.beam),n.ball.geometry.dispose(),n.ball.material.dispose(),n.beam.geometry.dispose(),n.beam.material.dispose(),this.shots.splice(e,1))}}dispose(){this.clearWave();for(const t of this.mobs)this.stopMobMixer(t);this.root.removeFromParent()}}class PM{constructor(t,e){R(this,"base");R(this,"layout");R(this,"buildings");R(this,"nav");R(this,"enemies",[]);R(this,"events",[]);R(this,"serial",0);this.base=t,this.layout=e,this.nav=new zi(t),this.buildings=e.slots.map(n=>({slot:n,hp:0,built:!1,cooldown:0}))}building(t){return this.buildings.find(e=>e.slot.id===t)}bounds(t){const e=this.base.cellMeters;return{l:Math.floor((t.x-t.width/2)/e)*e,r:Math.ceil((t.x+t.width/2)/e)*e,b:Math.floor((t.y-t.depth/2)/e)*e,t:Math.ceil((t.y+t.depth/2)/e)*e}}distance(t,e){const n=this.bounds(e);return Math.hypot(Math.max(n.l-t.x,0,t.x-n.r),Math.max(n.b-t.y,0,t.y-n.t))}build(t,e=[]){const n=this.building(t);return!n||n.built||e.some(i=>this.distance(i,n.slot)<1)?!1:(n.built=!0,n.hp=n.slot.maxHp,n.cooldown=0,this.rebuild(),this.events.push({type:"built",id:t}),!0)}damage(t,e){const n=this.building(t);!(n!=null&&n.built)||e<=0||(n.hp=Math.max(0,n.hp-e),this.events.push({type:"hit",id:t}),n.hp||(n.built=!1,this.events.push({type:"destroyed",id:t}),this.rebuild()))}buildMany(t,e=[]){const n=[];for(const i of t){const s=this.building(i);!s||s.built||e.some(o=>this.distance(o,s.slot)<1)||(s.built=!0,s.hp=s.slot.maxHp,s.cooldown=0,n.push(i),this.events.push({type:"built",id:i}))}return n.length&&this.rebuild(),n}clear(){for(const t of this.buildings)t.built=!1,t.hp=0;this.enemies=[],this.events=[],this.rebuild()}rebuild(){const t={...this.base,walkable:[...this.base.walkable],clearanceMeters:[...this.base.clearanceMeters]},e=t.cellMeters,n=this.buildings.filter(i=>i.built).map(i=>this.bounds(i.slot));for(const i of n)for(let s=Math.floor(i.b/e);s<Math.ceil(i.t/e);s++)for(let o=Math.floor(i.l/e);o<Math.ceil(i.r/e);o++)o>=0&&s>=0&&o<t.width&&s<t.height&&(t.walkable[s*t.width+o]=0);for(let i=0;i<t.walkable.length;i++){if(!t.walkable[i]){t.clearanceMeters[i]=0;continue}const s=(i%t.width+.5)*e,o=(Math.floor(i/t.width)+.5)*e;for(const a of n)t.clearanceMeters[i]=Math.min(t.clearanceMeters[i],Math.hypot(Math.max(a.l-s,0,s-a.r),Math.max(a.b-o,0,o-a.t)))}this.nav=new zi(t);for(const i of this.enemies)i.target=null,i.route=[],i.waiting=!0}spawnAhead(t,e=3,n=Math.random){const i=this.building(t);if(!(i!=null&&i.built))return 0;let s=0;for(let o=0;o<400&&s<e&&this.enemies.length<36;o++){const a=Math.min(282,i.slot.y+23+n()*14),l=Math.floor(a/this.base.cellMeters),c=[];for(let d=0;d<this.base.width;d++)this.base.walkable[l*this.base.width+d]&&c.push(d);if(!c.length)continue;const h=(c[Math.min(c.length-1,Math.floor(n()*c.length))]+.5)*this.base.cellMeters,u={x:h,y:a};!this.nav.canStand(u,1.2)||this.enemies.some(d=>Math.hypot(d.pos.x-h,d.pos.y-a)<2)||(this.enemies.push({id:++this.serial,pos:u,hp:42,target:null,route:[],cooldown:0,waiting:!0}),s++)}return s}assign(t){const e=this.buildings.filter(n=>n.built).sort((n,i)=>this.distance(t.pos,n.slot)-this.distance(t.pos,i.slot));for(const n of e){const i=n.slot,s=this.bounds(i),o=[{x:i.x,y:s.t+1.3},{x:s.l-1.3,y:i.y},{x:s.r+1.3,y:i.y},{x:i.x,y:s.b-1.3}].sort((a,l)=>Math.hypot(a.x-t.pos.x,a.y-t.pos.y)-Math.hypot(l.x-t.pos.x,l.y-t.pos.y));for(const a of o){if(!this.nav.canStand(a,.65))continue;const l=this.nav.findPath(t.pos,a,.65);if(l.length){t.target=i.id,t.route=l.slice(1),t.waiting=!1;return}}}t.waiting=!1,t.target=null,t.route=[]}tick(t){let e=0;for(const i of this.enemies){i.waiting&&e<1&&(this.assign(i),e++);const s=i.target?this.building(i.target):void 0;if(!(s!=null&&s.built))continue;if(i.cooldown=Math.max(0,i.cooldown-t),this.distance(i.pos,s.slot)<=1.65){i.route=[],i.cooldown||(this.damage(s.slot.id,8),i.cooldown=1);continue}if(!i.route.length){i.waiting=!0;continue}const o=i.route[0],a=Math.hypot(o.x-i.pos.x,o.y-i.pos.y);if(a<.1){i.route.shift();continue}const l=Math.min(a,3.6*t),c=this.nav.move(i.pos,{x:i.pos.x+(o.x-i.pos.x)*l/a,y:i.pos.y+(o.y-i.pos.y)*l/a},.65);Math.hypot(c.x-i.pos.x,c.y-i.pos.y)<1e-5&&(i.waiting=!0),i.pos=c}for(const i of this.buildings){if(!i.built||i.slot.kind!=="tower"||(i.cooldown-=t,i.cooldown>0))continue;const s=this.enemies.filter(o=>o.hp>0&&Math.hypot(o.pos.x-i.slot.x,o.pos.y-i.slot.y)<i.slot.range).sort((o,a)=>this.distance(o.pos,i.slot)-this.distance(a.pos,i.slot)).find(o=>this.baseLineClear(i.slot,o.pos));s&&(s.hp-=9,i.cooldown=.85,this.events.push({type:"shot",id:i.slot.id,from:{x:i.slot.x,y:i.slot.y},to:{...s.pos}}))}const n=[];for(const i of this.enemies)i.hp>0?n.push(i):this.events.push({type:"enemyDown",id:String(i.id)});this.enemies=n}baseLineClear(t,e){return new zi(this.base).segmentClear(t,e,.1)}drainEvents(){const t=this.events;return this.events=[],t}}const Pn=[{id:"tower_gun",label:"총 탑",url:"/tools/unit_lab/units_free/tower_gun.glb"},{id:"tower_throw",label:"던지기 탑",url:"/tools/unit_lab/units_free/tower_throw.glb"},{id:"tower_cannon",label:"대포 탑",url:"/tools/unit_lab/units_free/tower_cannon.glb"},{id:"tower_ballista",label:"발리스타 탑",url:"/tools/unit_lab/units_free/tower_ballista.glb"},{id:"tower_catapult",label:"투석기 탑",url:"/tools/unit_lab/units_free/tower_catapult.glb"}],Jn=[{id:"unit_map",label:"맵 유닛 시설",group:"map_unit",urlPurified:"/maps/forest150/releases/v7/catalog/unit_purified.glb",urlPolluted:"/maps/forest150/releases/v7/catalog/unit_polluted.glb",targetHeightM:3.6},{id:"k_tent",label:"텐트 (캠프)",group:"building_camp",url:"/tools/unit_lab/units_free/k_tent.glb",targetHeightM:2.6},{id:"k_structure",label:"나무 구조 (캠프)",group:"building_camp",url:"/tools/unit_lab/units_free/k_structure.glb",targetHeightM:2.8},{id:"k_machine",label:"기계 (머신)",group:"building_machine",url:"/tools/unit_lab/units_free/k_machine.glb",targetHeightM:2.4},{id:"k_crane",label:"크레인 (머신)",group:"building_machine",url:"/tools/unit_lab/units_free/k_crane.glb",targetHeightM:3.2}],IM=2.4;function jf(r){return r.length&&(r.find(t=>/^(idle|stand)$/i.test(t.name))||r.find(t=>/idle|stand/i.test(t.name))||r[0])||null}function LM(r,t){return r.length?r.find(e=>/^walk$/i.test(e.name))||r.find(e=>/walk/i.test(e.name))||r.find(e=>/^run$/i.test(e.name))||r.find(e=>/run/i.test(e.name))||jf(r):null}class nh{constructor(t){R(this,"root",new _e);R(this,"defense",null);R(this,"layout",null);R(this,"selectedSlotId",null);R(this,"dropHighlightId",null);R(this,"dropHighlightOk",!0);R(this,"mapState","purified");R(this,"visuals",new Map);R(this,"turretProtos",new Map);R(this,"unitProtos",new Map);R(this,"status","건설 대기");R(this,"shotLines",[]);R(this,"loader",new Gn);R(this,"showcaseRoot",null);R(this,"protoClips",new Map);R(this,"freeMixers",new Map);R(this,"freeClips",new Map);R(this,"onSpawnFx",null);R(this,"onNavDirty",null);this.scene=t,this.scene.add(this.root)}get infoText(){var a,l,c;const t=((a=this.defense)==null?void 0:a.buildings.filter(h=>h.built).length)??0,e=((l=this.layout)==null?void 0:l.slots.filter(h=>h.kind==="tower").length)??0,n=((c=this.layout)==null?void 0:c.slots.filter(h=>h.kind==="unit").length)??0,i=this.towerSlotIds().filter(h=>this.kindOn(h)).length,s=this.unitSlotIds().filter(h=>this.kindOn(h)).length,o=this.selectedSlotId?`선택 슬롯: ${this.selectedSlotId}${this.kindOn(this.selectedSlotId)?` · ${this.kindOn(this.selectedSlotId)}`:""}`:"선택 슬롯: (맵에서 타워/유닛 슬롯 클릭)";return[this.status,o,`타워 ${e} · 메시 ${i} · 유닛 ${n} · 시설 ${s} · 설치 ${t}`,this.layout?`레이아웃 rev ${this.layout.revision}`:"레이아웃 없음",`터렛 5종: ${Pn.map(h=>h.id).join(", ")}`,`유닛 시설 5종: ${Jn.map(h=>h.id).join(", ")}`].join(`
`)}get slotIds(){var t;return((t=this.layout)==null?void 0:t.slots.map(e=>e.id))??[]}towerSlotIds(){var t;return((t=this.layout)==null?void 0:t.slots.filter(e=>e.kind==="tower").map(e=>e.id))??[]}unitSlotIds(){var t;return((t=this.layout)==null?void 0:t.slots.filter(e=>e.kind==="unit").map(e=>e.id))??[]}kindOn(t){var e;return((e=this.visuals.get(t))==null?void 0:e.kindId)??null}slotKindOf(t){var n;const e=(n=this.layout)==null?void 0:n.slots.find(i=>i.id===t);return(e==null?void 0:e.kind)==="tower"||(e==null?void 0:e.kind)==="unit"?e.kind:null}static isTurretKindId(t){return Pn.some(e=>e.id===t)}static isUnitFacilityKindId(t){return Jn.some(e=>e.id===t)}setDropHighlight(t,e=!0){this.dropHighlightId=t,this.dropHighlightOk=e,this.refreshPadHighlights()}slotWorldPosition(t,e=new P){const n=this.visuals.get(t);return n?(n.root.getWorldPosition(e),e):null}async load(t,e){const n=await fetch(e,{cache:"no-store"});if(!n.ok)throw new Error(e+" "+n.status);this.layout=await n.json(),this.defense=new PM(t,this.layout),await this.ensureProtos(),this.rebuildMarkers(),this.status=`건설 로드 · 타워 ${this.towerSlotIds().length} · 유닛 ${this.unitSlotIds().length}`,this.notifyNavDirty()}async setMapState(t){var e;if(this.mapState!==t){this.mapState=t,this.unitProtos.delete("unit_map"),this.unitProtos.delete("unit_map_pad"),await this.ensureUnitProtos();for(const[n,i]of this.visuals){const s=(e=this.layout)==null?void 0:e.slots.find(o=>o.id===n);if(!(!s||s.kind!=="unit")){if(i.basePad&&(i.root.remove(i.basePad),i.basePad=null),!i.kindId)i.basePad=this.makeUnitBasePad(s.id),i.basePad&&i.root.add(i.basePad);else if(i.kindId==="unit_map"){this.clearVisualAnim(i),i.placed&&(i.root.remove(i.placed),i.placed=null);const o=this.unitProtos.get("unit_map");if(o){const a=this.protoClips.get("unit_map")??[],l=this.cloneProto(o,a);this.tagSlot(l,s.id),i.root.add(l),i.placed=l;const c=this.bindMixer(l,a);i.mixer=c.mixer,i.clips=a,i.currentClip=c.currentClip}}}}this.refreshPadHighlights()}}async ensureProtos(){await Promise.all([this.ensureTurretProtos(),this.ensureUnitProtos()])}async ensureTurretProtos(){await Promise.all(Pn.map(async t=>{if(!this.turretProtos.has(t.id))try{const{scene:e,clips:n}=await this.loadScaledGlb(t.url,IM);this.turretProtos.set(t.id,e),this.protoClips.set(t.id,n)}catch(e){console.warn("turret kind load failed",t.url,e),this.turretProtos.set(t.id,this.fallbackMesh(t.id,9085802)),this.protoClips.set(t.id,[])}}))}async ensureUnitProtos(){if(await Promise.all(Jn.map(async t=>{if(this.unitProtos.has(t.id))return;const e=t.id==="unit_map"?this.mapState==="polluted"?t.urlPolluted:t.urlPurified:t.url;try{const{scene:n,clips:i}=await this.loadScaledGlb(e,t.targetHeightM);this.unitProtos.set(t.id,n),this.protoClips.set(t.id,i)}catch(n){console.warn("unit facility load failed",e,n);const i=t.group==="building_machine"?6982298:t.group==="building_camp"?11569754:5935002;this.unitProtos.set(t.id,this.fallbackMesh(t.id,i)),this.protoClips.set(t.id,[])}})),!this.unitProtos.has("unit_map_pad")){const t=this.unitProtos.get("unit_map");if(t){const e=t.clone(!0);e.traverse(n=>{const i=n;if(!i.isMesh)return;const o=(Array.isArray(i.material)?i.material:[i.material]).map(a=>{const l=a.clone();l.transparent=!0;const c=l;return"opacity"in c&&(c.opacity=.35),l.depthWrite=!1,l});i.material=o.length===1?o[0]:o}),this.unitProtos.set("unit_map_pad",e)}}}async loadScaledGlb(t,e){const n=await this.loader.loadAsync(t),i=n.scene;i.traverse(u=>{const d=u;d.isMesh&&(d.castShadow=!0,d.receiveShadow=!0)}),i.updateMatrixWorld(!0);const s=new Pe().setFromObject(i),o=s.getSize(new P),a=Math.max(.3,o.y),l=e/a,c=Math.max(o.x,o.z)*l,h=c>7.5?7.5/c*l:l;return i.scale.setScalar(h),i.position.y=-s.min.y*h,{scene:i,clips:n.animations??[]}}cloneProto(t,e){if(e.length)try{return sr(t)}catch{return t.clone(!0)}return t.clone(!0)}stopMixer(t){t&&(t.stopAllAction(),t._root=null)}bindMixer(t,e,n=!1){if(!e.length)return{mixer:null,currentClip:""};const i=new Gi(t),s=n?LM(e):jf(e);if(s){const o=i.clipAction(s);return o.setLoop(yi,1/0),o.play(),{mixer:i,currentClip:s.name}}return{mixer:i,currentClip:""}}playSlotClip(t,e){const n=t??this.selectedSlotId;if(!n)return!1;const i=this.visuals.get(n);if(!(i!=null&&i.mixer)||!i.placed||!i.clips.length)return!1;const s=i.clips.find(a=>a.name===e)||i.clips.find(a=>a.name.toLowerCase()===e.toLowerCase());return s?(i.mixer.stopAllAction(),i.mixer.clipAction(s).reset().setLoop(yi,1/0).play(),i.currentClip=s.name,this.status=`애니: ${s.name} @ ${n}`,!0):!1}clipsOn(t=this.selectedSlotId){var e;return t?((e=this.visuals.get(t))==null?void 0:e.clips)??[]:[]}currentClipOn(t=this.selectedSlotId){var e;return t?((e=this.visuals.get(t))==null?void 0:e.currentClip)??"":""}registerFreePropAnim(t,e){if(this.unregisterFreePropAnim(t),!e.length)return;const{mixer:n,currentClip:i}=this.bindMixer(t,e,!1);n&&(this.freeMixers.set(t,n),this.freeClips.set(t,e),t.userData.animClip=i)}unregisterFreePropAnim(t){const e=this.freeMixers.get(t);e&&(this.stopMixer(e),this.freeMixers.delete(t)),this.freeClips.delete(t)}clearFreePropAnims(){for(const t of this.freeMixers.values())this.stopMixer(t);this.freeMixers.clear(),this.freeClips.clear()}update(t){var e;for(const n of this.visuals.values())(e=n.mixer)==null||e.update(t);for(const n of this.freeMixers.values())n.update(t)}fallbackMesh(t,e){const n=new te(new Vi(.55,.7,2.2,10),new hn({color:e,metalness:.25,roughness:.55}));n.position.y=1.1,n.castShadow=!0;const i=new te(new ci(1.1,.35,.45),new hn({color:13218906}));i.position.set(0,2,.3);const s=new _e;return s.name=`fallback_${t}`,s.add(n,i),s}tagSlot(t,e){t.userData.slotId=e,t.traverse(n=>{n.userData.slotId=e})}makeUnitBasePad(t){const e=this.unitProtos.get("unit_map_pad")||this.unitProtos.get("unit_map");if(!e)return null;const n=e.clone(!0);return this.tagSlot(n,t),n.name=`unit_pad_${t}`,n.traverse(i=>{const s=i;if(!s.isMesh)return;const o=a=>{a.transparent=!0,a.opacity=Math.min(.4,a.opacity||.4),a.depthWrite=!1};Array.isArray(s.material)?s.material.forEach(o):o(s.material)}),n}selectSlot(t){var i;if(this.selectedSlotId=t,this.refreshPadHighlights(),!t){this.status="슬롯 선택 해제";return}const e=(i=this.layout)==null?void 0:i.slots.find(s=>s.id===t);if(!e){this.status=`알 수 없는 슬롯 ${t}`;return}const n=this.kindOn(t);if(e.kind==="unit"){this.status=n?`유닛 슬롯 ${t} · 설치됨 ${n} · 다른 시설로 교체 가능`:`유닛 슬롯 ${t} 선택 · 시설 5종 중 하나 설치`;return}this.status=n?`타워 슬롯 ${t} · 설치됨 ${n} · 다른 종류로 교체 가능`:`타워 슬롯 ${t} 선택 · 터렛 5종 중 하나 설치`}pickSlot(t){var s;const e=[];for(const o of this.visuals.values())e.push(o.pad),o.basePad&&e.push(o.basePad),o.placed&&e.push(o.placed);const n=t.intersectObjects(e,!0);if(!n.length)return null;let i=n[0].object;for(;i;){const o=(s=i.userData)==null?void 0:s.slotId;if(o)return o;i=i.parent}return null}pickNearestSlot(t,e=8,n){if(!this.layout)return null;let i=null,s=e;const o=new P;for(const a of this.layout.slots){if(n&&a.kind!==n)continue;const l=this.slotWorldPosition(a.id,o);if(!l)continue;const c=l.distanceTo(t);c<s&&(s=c,i=a.id)}return i}installKind(t,e,n=[]){if(!this.defense||!this.layout)return!1;const i=this.layout.slots.find(o=>o.id===t);if(!i||i.kind!=="tower")return this.status=`타워 슬롯만 터렛 설치 가능 (${t})`,!1;const s=this.turretProtos.get(e);return s?this.ensureBuilt(t,n)?this.attachPlaced(t,e,s):!1:(this.status=`프로토 없음: ${e}`,!1)}installUnitKind(t,e,n=[]){if(!this.defense||!this.layout)return!1;const i=this.layout.slots.find(a=>a.id===t);if(!i||i.kind!=="unit")return this.status=`유닛 슬롯만 시설 설치 가능 (${t})`,!1;const s=this.unitProtos.get(e);if(!s)return this.status=`프로토 없음: ${e}`,!1;if(!this.ensureBuilt(t,n))return!1;const o=this.visuals.get(t);return o!=null&&o.basePad&&(o.root.remove(o.basePad),o.basePad=null),this.attachPlaced(t,e,s)}ensureBuilt(t,e){const n=this.defense.building(t);return n?n.built?!0:!this.defense.build(t,e)&&!this.defense.build(t,[])?(this.status=`설치 실패: ${t}`,!1):!0:!1}clearVisualAnim(t){this.stopMixer(t.mixer),t.mixer=null,t.clips=[],t.currentClip=""}attachPlaced(t,e,n){const i=this.visuals.get(t);if(!i)return!1;this.clearVisualAnim(i),i.placed&&(i.root.remove(i.placed),i.placed=null);const s=this.protoClips.get(e)??[],o=this.cloneProto(n,s);this.tagSlot(o,t),i.root.add(o),i.placed=o,i.kindId=e;const a=this.bindMixer(o,s);i.mixer=a.mixer,i.clips=s,i.currentClip=a.currentClip,this.selectedSlotId=t,this.refreshPadHighlights();const l=a.currentClip?` · 애니 ${a.currentClip}`:"";if(this.status=`설치: ${e} @ ${t}${l}`,this.onSpawnFx){const c=new P;i.root.getWorldPosition(c),this.onSpawnFx(c)}return this.notifyNavDirty(),!0}clearSlot(t){var s,o;const e=(s=this.defense)==null?void 0:s.building(t);if(e!=null&&e.built){const a=Number(e.hp)||Number(e.slot.maxHp)||9999;this.defense.damage(t,a)}const n=this.visuals.get(t);n!=null&&n.placed&&(this.clearVisualAnim(n),n.root.remove(n.placed),n.placed=null,n.kindId=null);const i=(o=this.layout)==null?void 0:o.slots.find(a=>a.id===t);n&&(i==null?void 0:i.kind)==="unit"&&!n.basePad&&(n.basePad=this.makeUnitBasePad(t),n.basePad&&n.root.add(n.basePad)),this.refreshPadHighlights(),this.notifyNavDirty(),this.status=`철거: ${t}`}clearAll(){var t,e;(t=this.defense)==null||t.clear();for(const[n,i]of this.visuals){i.placed&&(this.clearVisualAnim(i),i.root.remove(i.placed),i.placed=null,i.kindId=null);const s=(e=this.layout)==null?void 0:e.slots.find(o=>o.id===n);(s==null?void 0:s.kind)==="unit"&&!i.basePad&&(i.basePad=this.makeUnitBasePad(n),i.basePad&&i.root.add(i.basePad))}this.refreshPadHighlights(),this.notifyNavDirty(),this.status="건설 전부 철거"}installDemoFive(t=[]){const e=this.towerSlotIds(),n=[];for(let i=0;i<Math.min(e.length,Pn.length);i++){const s=e[i],o=Pn[i].id;this.installKind(s,o,t)&&n.push(`${s}:${o}`)}return this.status=`데모 타워 5종 배치 ${n.length}/${Pn.length}`,n}installDemoUnits(t=[]){const e=this.unitSlotIds(),n=[];for(let i=0;i<Math.min(e.length,Jn.length);i++){const s=e[i],o=Jn[i].id;this.installUnitKind(s,o,t)&&n.push(`${s}:${o}`)}return this.status=`데모 유닛 시설 5종 배치 ${n.length}/${Jn.length}`,n}notifyNavDirty(){var t;(t=this.onNavDirty)==null||t.call(this)}rebuildMarkers(){for(const t of this.visuals.values())this.clearVisualAnim(t),this.root.remove(t.root);if(this.visuals.clear(),!!this.layout){for(const t of this.layout.slots){const e=this.makeVisual(t);this.root.add(e.root),this.visuals.set(t.id,e)}this.refreshPadHighlights()}}makeVisual(t){const e=new _e;e.name=`build_${t.id}`,e.userData.slotId=t.id;const n=t.kind==="tower",i=n?1.6:2.4,s=new te(new Vi(i,i,.12,20),new hn({color:n?7180110:5140367,transparent:!0,opacity:.55,depthWrite:!1}));s.position.y=.06,s.receiveShadow=!0,s.userData.slotId=t.id,s.name=`pad_${t.id}`,e.add(s);let o=null;return n||(o=this.makeUnitBasePad(t.id),o&&e.add(o)),e.position.copy(Fe(t.x,t.y,0)),{root:e,pad:s,basePad:o,placed:null,kindId:null,mixer:null,clips:[],currentClip:""}}refreshPadHighlights(){var t;for(const[e,n]of this.visuals){const i=n.pad.material,s=(t=this.layout)==null?void 0:t.slots.find(c=>c.id===e),o=(s==null?void 0:s.kind)==="tower",a=e===this.selectedSlotId;e===this.dropHighlightId?(i.color.setHex(this.dropHighlightOk?7001226:13920858),i.opacity=.92):a?(i.color.setHex(13942874),i.opacity=.85):n.kindId?(i.color.setHex(o?5934954:5930906),i.opacity=.5):(i.color.setHex(o?7180110:5140367),i.opacity=.45)}}tick(t){var n;if(this.update(t),!this.defense)return;this.defense.tick(t);const e=this.defense.drainEvents();for(const i of e){if(i.type==="shot"&&i.from&&i.to&&this.flashShot(i.from,i.to),i.type==="destroyed"){const s=this.visuals.get(i.id);s!=null&&s.placed&&(this.clearVisualAnim(s),s.root.remove(s.placed),s.placed=null,s.kindId=null);const o=(n=this.layout)==null?void 0:n.slots.find(a=>a.id===i.id);s&&(o==null?void 0:o.kind)==="unit"&&!s.basePad&&(s.basePad=this.makeUnitBasePad(i.id),s.basePad&&s.root.add(s.basePad)),this.refreshPadHighlights()}i.type==="enemyDown"&&(this.status=`방어: 적 격추 #${i.id}`)}for(let i=this.shotLines.length-1;i>=0;i--){const s=this.shotLines[i],o=s.material;o.opacity-=t*3,o.opacity<=0&&(this.root.remove(s),s.geometry.dispose(),o.dispose(),this.shotLines.splice(i,1))}}flashShot(t,e){const n=new De().setFromPoints([Fe(t.x,t.y,1.6),Fe(e.x,e.y,.8)]),i=new as({color:16769162,transparent:!0,opacity:.95}),s=new is(n,i);this.root.add(s),this.shotLines.push(s)}showcaseAt(t,e=3.2){this.showcaseRoot&&(this.root.remove(this.showcaseRoot),this.showcaseRoot=null);const n=new _e;n.name="turret_showcase";const i=Pn.length;for(let s=0;s<i;s++){const o=Pn[s],a=this.turretProtos.get(o.id);if(!a)continue;const l=a.clone(!0),c=t.x+(s-(i-1)/2)*e,h=t.y;l.position.copy(Fe(c,h,0)),n.add(l)}this.root.add(n),this.showcaseRoot=n,this.status=`5종 미리보기 @ ${t.x.toFixed(0)},${t.y.toFixed(0)}`}clearShowcase(){this.showcaseRoot&&(this.root.remove(this.showcaseRoot),this.showcaseRoot=null,this.status="미리보기 해제")}spawnDefenseWave(t,e=3){var s;if(!this.defense)return 0;const n=t||this.selectedSlotId||((s=this.defense.buildings.find(o=>o.built&&o.slot.kind==="tower"))==null?void 0:s.slot.id);if(!n)return 0;const i=this.defense.spawnAhead(n,e);return this.status=`방어 웨이브 ${i} @ ${n}`,i}dispose(){for(const t of this.visuals.values())this.clearVisualAnim(t);this.clearFreePropAnims(),this.root.removeFromParent()}}const hd="/tools/unit_lab/pets/block_cat/block_cat.glb?v=BCAT02",DM=.72,ud=1.55;class NM{constructor(t){R(this,"root",new _e);R(this,"enabled",!1);R(this,"mixer",null);R(this,"actions",new Map);R(this,"current","");R(this,"pos",{x:0,y:0});R(this,"ready",!1);R(this,"status","펫 미소환");R(this,"token",0);this.scene=t,this.scene.add(this.root),this.root.visible=!1}get infoText(){return[this.status,this.enabled?"따라가기 ON":"OFF",`클립: ${this.current||"-"}`,`위치 ${this.pos.x.toFixed(1)}, ${this.pos.y.toFixed(1)} m`,`에셋: BCAT02 · ${hd.split("?")[0]}`].join(`
`)}async spawn(t){const e=++this.token;this.status="BCAT02 로딩…";const n=await new Gn().loadAsync(hd);if(e!==this.token){dd(n.scene);return}this.clearModel();const i=n.scene;i.traverse(c=>{const h=c;h.isMesh&&(h.castShadow=!0,h.receiveShadow=!0)}),i.updateMatrixWorld(!0);const s=new Pe().setFromObject(i),o=s.getSize(new P),a=Math.max(.1,o.y),l=DM/a;i.scale.setScalar(l),i.position.y=-s.min.y*l,this.root.add(i),this.mixer=new Gi(i),this.actions.clear();for(const c of n.animations)this.actions.set(c.name,this.mixer.clipAction(c));this.pos={...t},this.root.position.copy(Fe(t.x,t.y,0)),this.root.visible=!0,this.enabled=!0,this.ready=!0,this.play("idle_sit"),this.status=`BCAT02 스폰 · 클립 ${n.animations.map(c=>c.name).join(", ")}`}despawn(){this.enabled=!1,this.root.visible=!1,this.clearModel(),this.status="펫 해제"}tick(t,e,n,i){var c;if(!this.ready||!this.enabled)return;const s=e.x-this.pos.x,o=e.y-this.pos.y,a=Math.hypot(s,o);let l=!1;if(a>ud){const h=ud*.92,u=Math.min(4.8*t,a-h),d=this.pos.x+s/a*u,f=this.pos.y+o/a*u,m=n?n.move(this.pos,{x:d,y:f},.35):{x:d,y:f};Math.hypot(m.x-this.pos.x,m.y-this.pos.y)>5e-4&&(this.pos=m,l=!0,this.root.rotation.y=Math.atan2(s,-o))}else i&&(this.root.rotation.y=Math.atan2(s,-o));this.root.position.copy(Fe(this.pos.x,this.pos.y,0)),l?this.play("walk"):this.actions.has("idle_sit")?this.play("idle_sit"):this.actions.has("idle_look")&&this.play("idle_look"),(c=this.mixer)==null||c.update(t)}play(t){if(!this.mixer||this.current===t)return;let e=this.actions.get(t);if(!e){const n=[...this.actions.keys()].find(i=>i.toLowerCase()===t.toLowerCase());e=n?this.actions.get(n):void 0}if(e){this.current=t;for(const[n,i]of this.actions)n===t?(i.reset().fadeIn(.15),i.setLoop(yi,1/0),i.play()):i.fadeOut(.15)}}clearModel(){var t;for(;this.root.children.length;){const e=this.root.children[0];this.root.remove(e),dd(e)}(t=this.mixer)==null||t.stopAllAction(),this.mixer=null,this.actions.clear(),this.current="",this.ready=!1}dispose(){this.despawn(),this.root.removeFromParent()}}function dd(r){const t=new Set,e=new Set;r.traverse(n=>{const i=n;if(i.isMesh){t.add(i.geometry);for(const s of Array.isArray(i.material)?i.material:[i.material])e.add(s)}}),t.forEach(n=>n.dispose()),e.forEach(n=>n.dispose())}const fd={type:"change"},ih={type:"start"},Jf={type:"end"},Oo=new rr,pd=new Oi,UM=Math.cos(70*Qe.DEG2RAD),qe=new P,_n=2*Math.PI,Me={NONE:-1,ROTATE:0,DOLLY:1,PAN:2,TOUCH_ROTATE:3,TOUCH_PAN:4,TOUCH_DOLLY_PAN:5,TOUCH_DOLLY_ROTATE:6},ul=1e-6;class Qf extends qg{constructor(t,e=null){super(t,e),this.state=Me.NONE,this.target=new P,this.cursor=new P,this.minDistance=0,this.maxDistance=1/0,this.minZoom=0,this.maxZoom=1/0,this.minTargetRadius=0,this.maxTargetRadius=1/0,this.minPolarAngle=0,this.maxPolarAngle=Math.PI,this.minAzimuthAngle=-1/0,this.maxAzimuthAngle=1/0,this.enableDamping=!1,this.dampingFactor=.05,this.enableZoom=!0,this.zoomSpeed=1,this.enableRotate=!0,this.rotateSpeed=1,this.keyRotateSpeed=1,this.enablePan=!0,this.panSpeed=1,this.screenSpacePanning=!0,this.keyPanSpeed=7,this.zoomToCursor=!1,this.autoRotate=!1,this.autoRotateSpeed=2,this.keys={LEFT:"ArrowLeft",UP:"ArrowUp",RIGHT:"ArrowRight",BOTTOM:"ArrowDown"},this.mouseButtons={LEFT:Vs.ROTATE,MIDDLE:Vs.DOLLY,RIGHT:Vs.PAN},this.touches={ONE:Fs.ROTATE,TWO:Fs.DOLLY_PAN},this.target0=this.target.clone(),this.position0=this.object.position.clone(),this.zoom0=this.object.zoom,this._cursorStyle="auto",this._domElementKeyEvents=null,this._lastPosition=new P,this._lastQuaternion=new mn,this._lastTargetPosition=new P,this._quat=new mn().setFromUnitVectors(t.up,new P(0,1,0)),this._quatInverse=this._quat.clone().invert(),this._spherical=new Eu,this._sphericalDelta=new Eu,this._scale=1,this._panOffset=new P,this._rotateStart=new At,this._rotateEnd=new At,this._rotateDelta=new At,this._panStart=new At,this._panEnd=new At,this._panDelta=new At,this._dollyStart=new At,this._dollyEnd=new At,this._dollyDelta=new At,this._dollyDirection=new P,this._mouse=new At,this._performCursorZoom=!1,this._pointers=[],this._pointerPositions={},this._controlActive=!1,this._onPointerMove=OM.bind(this),this._onPointerDown=FM.bind(this),this._onPointerUp=kM.bind(this),this._onContextMenu=XM.bind(this),this._onMouseWheel=HM.bind(this),this._onKeyDown=VM.bind(this),this._onTouchStart=GM.bind(this),this._onTouchMove=WM.bind(this),this._onMouseDown=BM.bind(this),this._onMouseMove=zM.bind(this),this._interceptControlDown=qM.bind(this),this._interceptControlUp=$M.bind(this),this.domElement!==null&&this.connect(this.domElement),this.update()}set cursorStyle(t){this._cursorStyle=t,t==="grab"?this.domElement.style.cursor="grab":this.domElement.style.cursor="auto"}get cursorStyle(){return this._cursorStyle}connect(t){super.connect(t),this.domElement.addEventListener("pointerdown",this._onPointerDown),this.domElement.addEventListener("pointercancel",this._onPointerUp),this.domElement.addEventListener("contextmenu",this._onContextMenu),this.domElement.addEventListener("wheel",this._onMouseWheel,{passive:!1}),this.domElement.getRootNode().addEventListener("keydown",this._interceptControlDown,{passive:!0,capture:!0}),this.domElement.style.touchAction="none"}disconnect(){this.domElement.removeEventListener("pointerdown",this._onPointerDown),this.domElement.ownerDocument.removeEventListener("pointermove",this._onPointerMove),this.domElement.ownerDocument.removeEventListener("pointerup",this._onPointerUp),this.domElement.removeEventListener("pointercancel",this._onPointerUp),this.domElement.removeEventListener("wheel",this._onMouseWheel),this.domElement.removeEventListener("contextmenu",this._onContextMenu),this.stopListenToKeyEvents(),this.domElement.getRootNode().removeEventListener("keydown",this._interceptControlDown,{capture:!0}),this.domElement.style.touchAction=""}dispose(){this.disconnect()}getPolarAngle(){return this._spherical.phi}getAzimuthalAngle(){return this._spherical.theta}getDistance(){return this.object.position.distanceTo(this.target)}listenToKeyEvents(t){t.addEventListener("keydown",this._onKeyDown),this._domElementKeyEvents=t}stopListenToKeyEvents(){this._domElementKeyEvents!==null&&(this._domElementKeyEvents.removeEventListener("keydown",this._onKeyDown),this._domElementKeyEvents=null)}saveState(){this.target0.copy(this.target),this.position0.copy(this.object.position),this.zoom0=this.object.zoom}reset(){this.target.copy(this.target0),this.object.position.copy(this.position0),this.object.zoom=this.zoom0,this.object.updateProjectionMatrix(),this.dispatchEvent(fd),this.update(),this.state=Me.NONE}pan(t,e){this._pan(t,e),this.update()}dollyIn(t){this._dollyIn(t),this.update()}dollyOut(t){this._dollyOut(t),this.update()}rotateLeft(t){this._rotateLeft(t),this.update()}rotateUp(t){this._rotateUp(t),this.update()}update(t=null){const e=this.object.position;qe.copy(e).sub(this.target),qe.applyQuaternion(this._quat),this._spherical.setFromVector3(qe),this.autoRotate&&this.state===Me.NONE&&this._rotateLeft(this._getAutoRotationAngle(t)),this.enableDamping?(this._spherical.theta+=this._sphericalDelta.theta*this.dampingFactor,this._spherical.phi+=this._sphericalDelta.phi*this.dampingFactor):(this._spherical.theta+=this._sphericalDelta.theta,this._spherical.phi+=this._sphericalDelta.phi);let n=this.minAzimuthAngle,i=this.maxAzimuthAngle;isFinite(n)&&isFinite(i)&&(n<-Math.PI?n+=_n:n>Math.PI&&(n-=_n),i<-Math.PI?i+=_n:i>Math.PI&&(i-=_n),n<=i?this._spherical.theta=Math.max(n,Math.min(i,this._spherical.theta)):this._spherical.theta=this._spherical.theta>(n+i)/2?Math.max(n,this._spherical.theta):Math.min(i,this._spherical.theta)),this._spherical.phi=Math.max(this.minPolarAngle,Math.min(this.maxPolarAngle,this._spherical.phi)),this._spherical.makeSafe(),this.enableDamping===!0?this.target.addScaledVector(this._panOffset,this.dampingFactor):this.target.add(this._panOffset),this.target.sub(this.cursor),this.target.clampLength(this.minTargetRadius,this.maxTargetRadius),this.target.add(this.cursor);let s=!1;if(this.zoomToCursor&&this._performCursorZoom||this.object.isOrthographicCamera)this._spherical.radius=this._clampDistance(this._spherical.radius);else{const o=this._spherical.radius;this._spherical.radius=this._clampDistance(this._spherical.radius*this._scale),s=o!=this._spherical.radius}if(qe.setFromSpherical(this._spherical),qe.applyQuaternion(this._quatInverse),e.copy(this.target).add(qe),this.object.lookAt(this.target),this.enableDamping===!0?(this._sphericalDelta.theta*=1-this.dampingFactor,this._sphericalDelta.phi*=1-this.dampingFactor,this._panOffset.multiplyScalar(1-this.dampingFactor)):(this._sphericalDelta.set(0,0,0),this._panOffset.set(0,0,0)),this.zoomToCursor&&this._performCursorZoom){let o=null;if(this.object.isPerspectiveCamera){const a=qe.length();o=this._clampDistance(a*this._scale);const l=a-o;this.object.position.addScaledVector(this._dollyDirection,l),this.object.updateMatrixWorld(),s=!!l}else if(this.object.isOrthographicCamera){const a=new P(this._mouse.x,this._mouse.y,0);a.unproject(this.object);const l=this.object.zoom;this.object.zoom=Math.max(this.minZoom,Math.min(this.maxZoom,this.object.zoom/this._scale)),this.object.updateProjectionMatrix(),s=l!==this.object.zoom;const c=new P(this._mouse.x,this._mouse.y,0);c.unproject(this.object),this.object.position.sub(c).add(a),this.object.updateMatrixWorld(),o=qe.length()}else console.warn("WARNING: OrbitControls.js encountered an unknown camera type - zoom to cursor disabled."),this.zoomToCursor=!1;o!==null&&(this.screenSpacePanning?this.target.set(0,0,-1).transformDirection(this.object.matrix).multiplyScalar(o).add(this.object.position):(Oo.origin.copy(this.object.position),Oo.direction.set(0,0,-1).transformDirection(this.object.matrix),Math.abs(this.object.up.dot(Oo.direction))<UM?this.object.lookAt(this.target):(pd.setFromNormalAndCoplanarPoint(this.object.up,this.target),Oo.intersectPlane(pd,this.target))))}else if(this.object.isOrthographicCamera){const o=this.object.zoom;this.object.zoom=Math.max(this.minZoom,Math.min(this.maxZoom,this.object.zoom/this._scale)),o!==this.object.zoom&&(this.object.updateProjectionMatrix(),s=!0)}return this._scale=1,this._performCursorZoom=!1,s||this._lastPosition.distanceToSquared(this.object.position)>ul||8*(1-this._lastQuaternion.dot(this.object.quaternion))>ul||this._lastTargetPosition.distanceToSquared(this.target)>ul?(this.dispatchEvent(fd),this._lastPosition.copy(this.object.position),this._lastQuaternion.copy(this.object.quaternion),this._lastTargetPosition.copy(this.target),!0):!1}_getAutoRotationAngle(t){return t!==null?_n/60*this.autoRotateSpeed*t:_n/60/60*this.autoRotateSpeed}_getZoomScale(t){const e=Math.abs(t*.01);return Math.pow(.95,this.zoomSpeed*e)}_rotateLeft(t){this._sphericalDelta.theta-=t}_rotateUp(t){this._sphericalDelta.phi-=t}_panLeft(t,e){qe.setFromMatrixColumn(e,0),qe.multiplyScalar(-t),this._panOffset.add(qe)}_panUp(t,e){this.screenSpacePanning===!0?qe.setFromMatrixColumn(e,1):(qe.setFromMatrixColumn(e,0),qe.crossVectors(this.object.up,qe)),qe.multiplyScalar(t),this._panOffset.add(qe)}_pan(t,e){const n=this.domElement;if(this.object.isPerspectiveCamera){const i=this.object.position;qe.copy(i).sub(this.target);let s=qe.length();s*=Math.tan(this.object.fov/2*Math.PI/180),this._panLeft(2*t*s/n.clientHeight,this.object.matrix),this._panUp(2*e*s/n.clientHeight,this.object.matrix)}else this.object.isOrthographicCamera?(this._panLeft(t*(this.object.right-this.object.left)/this.object.zoom/n.clientWidth,this.object.matrix),this._panUp(e*(this.object.top-this.object.bottom)/this.object.zoom/n.clientHeight,this.object.matrix)):(console.warn("WARNING: OrbitControls.js encountered an unknown camera type - pan disabled."),this.enablePan=!1)}_dollyOut(t){this.object.isPerspectiveCamera||this.object.isOrthographicCamera?this._scale/=t:(console.warn("WARNING: OrbitControls.js encountered an unknown camera type - dolly/zoom disabled."),this.enableZoom=!1)}_dollyIn(t){this.object.isPerspectiveCamera||this.object.isOrthographicCamera?this._scale*=t:(console.warn("WARNING: OrbitControls.js encountered an unknown camera type - dolly/zoom disabled."),this.enableZoom=!1)}_updateZoomParameters(t,e){if(!this.zoomToCursor)return;this._performCursorZoom=!0;const n=this.domElement.getBoundingClientRect(),i=t-n.left,s=e-n.top,o=n.width,a=n.height;this._mouse.x=i/o*2-1,this._mouse.y=-(s/a)*2+1,this._dollyDirection.set(this._mouse.x,this._mouse.y,1).unproject(this.object).sub(this.object.position).normalize()}_clampDistance(t){return Math.max(this.minDistance,Math.min(this.maxDistance,t))}_handleMouseDownRotate(t){this._rotateStart.set(t.clientX,t.clientY)}_handleMouseDownDolly(t){this._updateZoomParameters(t.clientX,t.clientX),this._dollyStart.set(t.clientX,t.clientY)}_handleMouseDownPan(t){this._panStart.set(t.clientX,t.clientY)}_handleMouseMoveRotate(t){this._rotateEnd.set(t.clientX,t.clientY),this._rotateDelta.subVectors(this._rotateEnd,this._rotateStart).multiplyScalar(this.rotateSpeed);const e=this.domElement;this._rotateLeft(_n*this._rotateDelta.x/e.clientHeight),this._rotateUp(_n*this._rotateDelta.y/e.clientHeight),this._rotateStart.copy(this._rotateEnd),this.update()}_handleMouseMoveDolly(t){this._dollyEnd.set(t.clientX,t.clientY),this._dollyDelta.subVectors(this._dollyEnd,this._dollyStart),this._dollyDelta.y>0?this._dollyOut(this._getZoomScale(this._dollyDelta.y)):this._dollyDelta.y<0&&this._dollyIn(this._getZoomScale(this._dollyDelta.y)),this._dollyStart.copy(this._dollyEnd),this.update()}_handleMouseMovePan(t){this._panEnd.set(t.clientX,t.clientY),this._panDelta.subVectors(this._panEnd,this._panStart).multiplyScalar(this.panSpeed),this._pan(this._panDelta.x,this._panDelta.y),this._panStart.copy(this._panEnd),this.update()}_handleMouseWheel(t){this._updateZoomParameters(t.clientX,t.clientY),t.deltaY<0?this._dollyIn(this._getZoomScale(t.deltaY)):t.deltaY>0&&this._dollyOut(this._getZoomScale(t.deltaY)),this.update()}_handleKeyDown(t){let e=!1;switch(t.code){case this.keys.UP:t.ctrlKey||t.metaKey||t.shiftKey?this.enableRotate&&this._rotateUp(_n*this.keyRotateSpeed/this.domElement.clientHeight):this.enablePan&&this._pan(0,this.keyPanSpeed),e=!0;break;case this.keys.BOTTOM:t.ctrlKey||t.metaKey||t.shiftKey?this.enableRotate&&this._rotateUp(-_n*this.keyRotateSpeed/this.domElement.clientHeight):this.enablePan&&this._pan(0,-this.keyPanSpeed),e=!0;break;case this.keys.LEFT:t.ctrlKey||t.metaKey||t.shiftKey?this.enableRotate&&this._rotateLeft(_n*this.keyRotateSpeed/this.domElement.clientHeight):this.enablePan&&this._pan(this.keyPanSpeed,0),e=!0;break;case this.keys.RIGHT:t.ctrlKey||t.metaKey||t.shiftKey?this.enableRotate&&this._rotateLeft(-_n*this.keyRotateSpeed/this.domElement.clientHeight):this.enablePan&&this._pan(-this.keyPanSpeed,0),e=!0;break}e&&(t.preventDefault(),this.update())}_handleTouchStartRotate(t){if(this._pointers.length===1)this._rotateStart.set(t.pageX,t.pageY);else{const e=this._getSecondPointerPosition(t),n=.5*(t.pageX+e.x),i=.5*(t.pageY+e.y);this._rotateStart.set(n,i)}}_handleTouchStartPan(t){if(this._pointers.length===1)this._panStart.set(t.pageX,t.pageY);else{const e=this._getSecondPointerPosition(t),n=.5*(t.pageX+e.x),i=.5*(t.pageY+e.y);this._panStart.set(n,i)}}_handleTouchStartDolly(t){const e=this._getSecondPointerPosition(t),n=t.pageX-e.x,i=t.pageY-e.y,s=Math.sqrt(n*n+i*i);this._dollyStart.set(0,s)}_handleTouchStartDollyPan(t){this.enableZoom&&this._handleTouchStartDolly(t),this.enablePan&&this._handleTouchStartPan(t)}_handleTouchStartDollyRotate(t){this.enableZoom&&this._handleTouchStartDolly(t),this.enableRotate&&this._handleTouchStartRotate(t)}_handleTouchMoveRotate(t){if(this._pointers.length==1)this._rotateEnd.set(t.pageX,t.pageY);else{const n=this._getSecondPointerPosition(t),i=.5*(t.pageX+n.x),s=.5*(t.pageY+n.y);this._rotateEnd.set(i,s)}this._rotateDelta.subVectors(this._rotateEnd,this._rotateStart).multiplyScalar(this.rotateSpeed);const e=this.domElement;this._rotateLeft(_n*this._rotateDelta.x/e.clientHeight),this._rotateUp(_n*this._rotateDelta.y/e.clientHeight),this._rotateStart.copy(this._rotateEnd)}_handleTouchMovePan(t){if(this._pointers.length===1)this._panEnd.set(t.pageX,t.pageY);else{const e=this._getSecondPointerPosition(t),n=.5*(t.pageX+e.x),i=.5*(t.pageY+e.y);this._panEnd.set(n,i)}this._panDelta.subVectors(this._panEnd,this._panStart).multiplyScalar(this.panSpeed),this._pan(this._panDelta.x,this._panDelta.y),this._panStart.copy(this._panEnd)}_handleTouchMoveDolly(t){const e=this._getSecondPointerPosition(t),n=t.pageX-e.x,i=t.pageY-e.y,s=Math.sqrt(n*n+i*i);this._dollyEnd.set(0,s),this._dollyDelta.set(0,Math.pow(this._dollyEnd.y/this._dollyStart.y,this.zoomSpeed)),this._dollyOut(this._dollyDelta.y),this._dollyStart.copy(this._dollyEnd);const o=(t.pageX+e.x)*.5,a=(t.pageY+e.y)*.5;this._updateZoomParameters(o,a)}_handleTouchMoveDollyPan(t){this.enableZoom&&this._handleTouchMoveDolly(t),this.enablePan&&this._handleTouchMovePan(t)}_handleTouchMoveDollyRotate(t){this.enableZoom&&this._handleTouchMoveDolly(t),this.enableRotate&&this._handleTouchMoveRotate(t)}_addPointer(t){this._pointers.push(t.pointerId)}_removePointer(t){delete this._pointerPositions[t.pointerId];for(let e=0;e<this._pointers.length;e++)if(this._pointers[e]==t.pointerId){this._pointers.splice(e,1);return}}_isTrackingPointer(t){for(let e=0;e<this._pointers.length;e++)if(this._pointers[e]==t.pointerId)return!0;return!1}_trackPointer(t){let e=this._pointerPositions[t.pointerId];e===void 0&&(e=new At,this._pointerPositions[t.pointerId]=e),e.set(t.pageX,t.pageY)}_getSecondPointerPosition(t){const e=t.pointerId===this._pointers[0]?this._pointers[1]:this._pointers[0];return this._pointerPositions[e]}_customWheelEvent(t){const e=t.deltaMode,n={clientX:t.clientX,clientY:t.clientY,deltaY:t.deltaY};switch(e){case 1:n.deltaY*=16;break;case 2:n.deltaY*=100;break}return t.ctrlKey&&!this._controlActive&&(n.deltaY*=10),n}}function FM(r){this.enabled!==!1&&(this._pointers.length===0&&(this.domElement.setPointerCapture(r.pointerId),this.domElement.ownerDocument.addEventListener("pointermove",this._onPointerMove),this.domElement.ownerDocument.addEventListener("pointerup",this._onPointerUp)),!this._isTrackingPointer(r)&&(this._addPointer(r),r.pointerType==="touch"?this._onTouchStart(r):this._onMouseDown(r),this._cursorStyle==="grab"&&(this.domElement.style.cursor="grabbing")))}function OM(r){this.enabled!==!1&&(r.pointerType==="touch"?this._onTouchMove(r):this._onMouseMove(r))}function kM(r){switch(this._removePointer(r),this._pointers.length){case 0:this.domElement.releasePointerCapture(r.pointerId),this.domElement.ownerDocument.removeEventListener("pointermove",this._onPointerMove),this.domElement.ownerDocument.removeEventListener("pointerup",this._onPointerUp),this.dispatchEvent(Jf),this.state=Me.NONE,this._cursorStyle==="grab"&&(this.domElement.style.cursor="grab");break;case 1:const t=this._pointers[0],e=this._pointerPositions[t];this._onTouchStart({pointerId:t,pageX:e.x,pageY:e.y});break}}function BM(r){let t;switch(r.button){case 0:t=this.mouseButtons.LEFT;break;case 1:t=this.mouseButtons.MIDDLE;break;case 2:t=this.mouseButtons.RIGHT;break;default:t=-1}switch(t){case Vs.DOLLY:if(this.enableZoom===!1)return;this._handleMouseDownDolly(r),this.state=Me.DOLLY;break;case Vs.ROTATE:if(r.ctrlKey||r.metaKey||r.shiftKey){if(this.enablePan===!1)return;this._handleMouseDownPan(r),this.state=Me.PAN}else{if(this.enableRotate===!1)return;this._handleMouseDownRotate(r),this.state=Me.ROTATE}break;case Vs.PAN:if(r.ctrlKey||r.metaKey||r.shiftKey){if(this.enableRotate===!1)return;this._handleMouseDownRotate(r),this.state=Me.ROTATE}else{if(this.enablePan===!1)return;this._handleMouseDownPan(r),this.state=Me.PAN}break;default:this.state=Me.NONE}this.state!==Me.NONE&&this.dispatchEvent(ih)}function zM(r){switch(this.state){case Me.ROTATE:if(this.enableRotate===!1)return;this._handleMouseMoveRotate(r);break;case Me.DOLLY:if(this.enableZoom===!1)return;this._handleMouseMoveDolly(r);break;case Me.PAN:if(this.enablePan===!1)return;this._handleMouseMovePan(r);break}}function HM(r){this.enabled===!1||this.enableZoom===!1||this.state!==Me.NONE||(r.preventDefault(),this.dispatchEvent(ih),this._handleMouseWheel(this._customWheelEvent(r)),this.dispatchEvent(Jf))}function VM(r){this.enabled!==!1&&this._handleKeyDown(r)}function GM(r){switch(this._trackPointer(r),this._pointers.length){case 1:switch(this.touches.ONE){case Fs.ROTATE:if(this.enableRotate===!1)return;this._handleTouchStartRotate(r),this.state=Me.TOUCH_ROTATE;break;case Fs.PAN:if(this.enablePan===!1)return;this._handleTouchStartPan(r),this.state=Me.TOUCH_PAN;break;default:this.state=Me.NONE}break;case 2:switch(this.touches.TWO){case Fs.DOLLY_PAN:if(this.enableZoom===!1&&this.enablePan===!1)return;this._handleTouchStartDollyPan(r),this.state=Me.TOUCH_DOLLY_PAN;break;case Fs.DOLLY_ROTATE:if(this.enableZoom===!1&&this.enableRotate===!1)return;this._handleTouchStartDollyRotate(r),this.state=Me.TOUCH_DOLLY_ROTATE;break;default:this.state=Me.NONE}break;default:this.state=Me.NONE}this.state!==Me.NONE&&this.dispatchEvent(ih)}function WM(r){switch(this._trackPointer(r),this.state){case Me.TOUCH_ROTATE:if(this.enableRotate===!1)return;this._handleTouchMoveRotate(r),this.update();break;case Me.TOUCH_PAN:if(this.enablePan===!1)return;this._handleTouchMovePan(r),this.update();break;case Me.TOUCH_DOLLY_PAN:if(this.enableZoom===!1&&this.enablePan===!1)return;this._handleTouchMoveDollyPan(r),this.update();break;case Me.TOUCH_DOLLY_ROTATE:if(this.enableZoom===!1&&this.enableRotate===!1)return;this._handleTouchMoveDollyRotate(r),this.update();break;default:this.state=Me.NONE}}function XM(r){this.enabled!==!1&&r.preventDefault()}function qM(r){r.key==="Control"&&(this._controlActive=!0,this.domElement.getRootNode().addEventListener("keyup",this._interceptControlUp,{passive:!0,capture:!0}))}function $M(r){r.key==="Control"&&(this._controlActive=!1,this.domElement.getRootNode().removeEventListener("keyup",this._interceptControlUp,{passive:!0,capture:!0}))}const Er="/tools/unit_lab",YM=[{id:"cactoro",name:"Cactoro"},{id:"green_blob",name:"Green Blob"},{id:"green_spiky_blob",name:"Green Spiky Blob"},{id:"mushnub",name:"Mushnub"},{id:"pink_slime",name:"Pink Slime"}];class KM{constructor(){R(this,"entries",[]);R(this,"selectedId","");R(this,"onDragStart",null);R(this,"onDragEnd",null);R(this,"loader",new Gn);R(this,"renderer",null);R(this,"scene",new _f);R(this,"camera",new tn(40,1,.05,80));R(this,"controls",null);R(this,"hemi",new Nf("#dfe9ff","#3a4a32",.95));R(this,"key",new ia("#fff4d8",1.35));R(this,"fill",new ia("#a8c4ff",.35));R(this,"root",new _e);R(this,"current",null);R(this,"mixer",null);R(this,"loadToken",0);R(this,"bound",!1);R(this,"grid");this.scene.background=new Et("#152015"),this.key.position.set(2.4,4.2,2.8),this.fill.position.set(-2.2,1.6,-1.8),this.grid=new Au(4,8,"#4a6040","#2a3828"),this.grid.position.y=0,this.scene.add(this.hemi,this.key,this.fill,this.grid,this.root),this.camera.position.set(1.6,1.2,2.2)}async load(){const e=((await fetch(`${Er}/units_free.json`,{cache:"no-store"}).then(async o=>{if(!o.ok)throw new Error(`units_free.json ${o.status}`);return await o.json()})).units??[]).map(o=>({id:o.id,name:o.name||o.id,group:o.group||"units_free",source:"units_free",url:`${Er}/${o.base||"units_free"}/${o.id}.glb`,height_m:o.height_m})),n=sa.map(o=>({id:`char_${o.key}`,name:`${o.name} · ${o.body}`,group:"character",source:"character",url:`${Er}/character/${o.file}`})),i=[{id:"pet_block_cat",name:"BCAT02 Block Cat",group:"pet",source:"pet",url:`${Er}/pets/block_cat/block_cat.glb?v=BCAT02`}],s=YM.map(o=>({id:`monster_${o.id}`,name:o.name,group:"monster_anim",source:"monster",url:`${Er}/monsters_anim/${o.id}.glb`}));this.entries=[...e,...n,...i,...s],this.fillGroups(),this.renderList(),this.setInfo(`카탈로그 ${this.entries.length}개 (units_free ${e.length} · 캐릭터 ${n.length} · 펫 ${i.length} · 몬스터 ${s.length})
클릭=미리보기 · 목록에서 맵으로 드래그앤드롭=슬롯 설치(tower_*/시설) 또는 자유 프롭.`)}bindUi(){if(this.bound)return;this.bound=!0;const t=document.getElementById("unitCatalogPreview");t&&(this.renderer=new Wf({canvas:t,antialias:!0,alpha:!1,preserveDrawingBuffer:!0}),this.renderer.setPixelRatio(Math.min(devicePixelRatio,1.5)),this.renderer.outputColorSpace=Be,this.controls=new Qf(this.camera,t),this.controls.enableDamping=!0,this.controls.dampingFactor=.08,this.controls.target.set(0,.4,0),this.controls.minDistance=.4,this.controls.maxDistance=18,this.resize());const e=document.getElementById("unitCatalogGroup"),n=document.getElementById("unitCatalogSearch"),i=document.getElementById("unitCatalogOrbit");e&&(e.onchange=()=>this.renderList()),n&&(n.oninput=()=>this.renderList()),i&&(i.onchange=()=>{}),addEventListener("resize",()=>this.resize())}fillGroups(){const t=document.getElementById("unitCatalogGroup");if(!t)return;const e=t.value;for(;t.options.length>1;)t.remove(1);const n=[...new Set(this.entries.map(i=>i.group))].sort();for(const i of n){const s=document.createElement("option");s.value=s.textContent=i,t.append(s)}[...t.options].some(i=>i.value===e)&&(t.value=e)}renderList(){var o,a;const t=document.getElementById("unitCatalogList");if(!t)return;const e=(((o=document.getElementById("unitCatalogSearch"))==null?void 0:o.value)||"").toLowerCase().trim(),n=((a=document.getElementById("unitCatalogGroup"))==null?void 0:a.value)||"",i=this.entries.filter(l=>(!n||l.group===n)&&`${l.name} ${l.id} ${l.source}`.toLowerCase().includes(e));t.replaceChildren();const s=document.getElementById("unitCatalogCount");s&&(s.textContent=`${i.length} / ${this.entries.length}`);for(const l of i){const c=document.createElement("button");c.type="button",c.draggable=!0,c.textContent=`${l.name} · ${l.id}`,c.title=`${l.source} / ${l.group}
${l.url}
맵으로 드래그하여 설치/배치`,c.setAttribute("aria-current",String(this.selectedId===l.id)),c.dataset.unitId=l.id;let h=!1;c.addEventListener("dragstart",u=>{var f;h=!0;const d=u.dataTransfer;d&&(d.effectAllowed="copy",d.setData("application/x-forest-unit",JSON.stringify(l)),d.setData("text/plain",l.id)),c.classList.add("dragging"),(f=this.onDragStart)==null||f.call(this,l,u)}),c.addEventListener("dragend",()=>{var u;c.classList.remove("dragging"),(u=this.onDragEnd)==null||u.call(this),setTimeout(()=>{h=!1},0)}),c.onclick=()=>{h||this.select(l.id)},t.append(c)}}async select(t){var s;this.selectedId=t,this.renderList();const e=this.entries.find(o=>o.id===t);if(!e){this.setInfo("항목 없음");return}this.setInfo([`${e.name} (${e.id})`,`출처: ${e.source} / 그룹: ${e.group}`,e.height_m!=null?`높이: ${e.height_m.toFixed(3)} m`:"",e.url,"클릭=미리보기 · 드래그→맵 = 슬롯 설치 또는 자유 프롭"].filter(Boolean).join(`
`));const n=++this.loadToken;this.clearModel();const i=document.getElementById("unitCatalogStatus");i&&(i.textContent=`로딩… ${e.id}`);try{const o=await this.loader.loadAsync(e.url);if(n!==this.loadToken)return;const a=o.scene;if(a.traverse(l=>{const c=l;c.isMesh&&(c.castShadow=!1,c.receiveShadow=!1)}),this.fitModel(a),this.root.add(a),this.current=a,(s=o.animations)!=null&&s.length){this.mixer=new Gi(a);const l=o.animations.find(c=>/idle|Idle|stand/i.test(c.name))??o.animations[0];this.mixer.clipAction(l).play()}i&&(i.textContent=`미리보기: ${e.id}`)}catch(o){if(n!==this.loadToken)return;const a=o.message||String(o);this.setInfo(`${e.name} (${e.id})
미리보기 실패: ${a}
${e.url}`),i&&(i.textContent=`실패: ${e.id}`)}}fitModel(t){const e=new Pe().setFromObject(t),n=e.getSize(new P),i=e.getCenter(new P);t.position.sub(i);const s=new Pe().setFromObject(t);t.position.y-=s.min.y;const o=Math.max(n.x,n.y,n.z,.2),a=o*2.15;this.camera.position.set(a*.75,a*.55,a*.95),this.camera.near=Math.max(.02,o/100),this.camera.far=Math.max(40,o*40),this.camera.updateProjectionMatrix(),this.controls&&(this.controls.target.set(0,n.y*.35,0),this.controls.update());const l=Math.max(2,Math.ceil(o*2));this.scene.remove(this.grid),this.grid.dispose(),this.grid=new Au(l,Math.min(16,l*2),"#4a6040","#2a3828"),this.scene.add(this.grid)}clearModel(){this.mixer&&(this.mixer.stopAllAction(),this.mixer=null),this.current&&(this.root.remove(this.current),this.current.traverse(t=>{var n;const e=t;if(e.isMesh){(n=e.geometry)==null||n.dispose();const i=Array.isArray(e.material)?e.material:e.material?[e.material]:[];for(const s of i)s.dispose()}}),this.current=null)}setInfo(t){const e=document.getElementById("unitCatalogInfo");e&&(e.textContent=t)}resize(){if(!this.renderer)return;const t=this.renderer.domElement,e=t.parentElement,n=Math.max(1,Math.floor((e==null?void 0:e.clientWidth)||t.clientWidth||260)),i=Math.max(1,Math.floor((e==null?void 0:e.clientHeight)||180));this.renderer.setSize(n,i,!1),this.camera.aspect=n/i,this.camera.updateProjectionMatrix()}tick(t){var i,s;const e=document.querySelector('.panel-body[data-panel="place"]')||document.querySelector('.panel-body[data-panel="units"]');if(!e||e.hidden||!this.renderer)return;this.resize(),(i=this.mixer)==null||i.update(t);const n=document.getElementById("unitCatalogOrbit");n!=null&&n.checked&&this.controls&&this.current?(this.controls.autoRotate=!0,this.controls.autoRotateSpeed=1.6):this.controls&&(this.controls.autoRotate=!1),(s=this.controls)==null||s.update(),this.renderer.render(this.scene,this.camera)}}const dl=new Et("#3ef0ff"),ZM=new Et("#7af6ff"),md=new Et("#e8ffff");class jM{constructor(t){R(this,"root",new _e);R(this,"active",[]);R(this,"pixelGeo",new ci(1,1,1));R(this,"tmp",new Re);R(this,"color",new Et);this.scene=t,this.root.name="playSpawnFx",this.scene.add(this.root)}burst(t,e){const n=(e==null?void 0:e.height)??7.5,i=(e==null?void 0:e.radius)??1.35,s=new _e;s.position.copy(t),s.position.y=t.y;const o=new Le({color:ZM,transparent:!0,opacity:.28,depthWrite:!1,blending:Os,side:on}),a=new te(new Vi(i*.85,i*1.05,n,16,1,!0),o);a.position.y=n*.5,a.renderOrder=9;const l=new Le({color:md,transparent:!0,opacity:.55,depthWrite:!1,blending:Os,side:on}),c=new te(new Vi(i*.18,i*.22,n*1.05,12,1,!0),l);c.position.y=n*.52,c.renderOrder=10;const h=new Le({color:dl,transparent:!0,opacity:.55,depthWrite:!1,blending:Os,side:on}),u=new te(new pa(.15,i*1.4,32),h);u.rotation.x=-Math.PI/2,u.position.y=.04,u.renderOrder=8;const d=72,f=new Le({color:dl,transparent:!0,opacity:.9,depthWrite:!1,blending:Os}),m=new $c(this.pixelGeo,f,d);m.instanceMatrix.setUsage(lm),m.frustumCulled=!1,m.renderOrder=11;const _=new Float32Array(d),g=new Float32Array(d),p=new Float32Array(d);for(let b=0;b<d;b++){const E=Math.random()*Math.PI*2,y=Math.random()*i*1.15,S=Math.random()*n*.95,w=.08+Math.random()*.22,A=.18+Math.random()*.85,v=.04+Math.random()*.08;this.tmp.position.set(Math.cos(E)*y,S,Math.sin(E)*y),this.tmp.scale.set(w,A,v),this.tmp.rotation.set(0,E+Math.random()*.4,(Math.random()-.5)*.25),this.tmp.updateMatrix(),m.setMatrixAt(b,this.tmp.matrix);const T=.55+Math.random()*.45;this.color.copy(dl).lerp(md,Math.random()*.55).multiplyScalar(T),m.setColorAt&&m.setColorAt(b,this.color),_[b]=1.2+Math.random()*3.8,g[b]=(Math.random()-.5)*2.5,p[b]=S}m.instanceMatrix.needsUpdate=!0,m.instanceColor&&(m.instanceColor.needsUpdate=!0),s.add(a,c,u,m),this.root.add(s),this.active.push({root:s,age:0,life:1.45,pillar:c,glow:a,ring:u,pixels:m,velocities:_,spins:g,baseY:p})}tick(t){for(let e=this.active.length-1;e>=0;e--){const n=this.active[e];n.age+=t;const i=n.age/n.life,s=Math.min(1,n.age/.12),o=i>.55?1-(i-.55)/.45:1,a=Math.max(0,s*o),l=n.pillar.material,c=n.glow.material,h=n.ring.material,u=n.pixels.material;l.opacity=.65*a,c.opacity=.32*a,h.opacity=.6*a*(1-i*.35),u.opacity=.95*a;const d=1+i*.18;n.pillar.scale.set(1-i*.15,d,1-i*.15),n.glow.scale.set(1+i*.35,d,1+i*.35),n.ring.scale.setScalar(1+i*1.1);const f=n.velocities.length;for(let m=0;m<f;m++)n.pixels.getMatrixAt(m,this.tmp.matrix),this.tmp.matrix.decompose(this.tmp.position,this.tmp.quaternion,this.tmp.scale),this.tmp.position.y+=n.velocities[m]*t,this.tmp.position.x*=1+t*.15,this.tmp.position.z*=1+t*.15,this.tmp.rotateY(n.spins[m]*t),i>.5&&this.tmp.scale.multiplyScalar(1-t*1.2),this.tmp.updateMatrix(),n.pixels.setMatrixAt(m,this.tmp.matrix);n.pixels.instanceMatrix.needsUpdate=!0,n.age>=n.life&&(this.disposeFx(n),this.root.remove(n.root),this.active.splice(e,1))}}disposeFx(t){t.pillar.geometry.dispose(),t.pillar.material.dispose(),t.glow.geometry.dispose(),t.glow.material.dispose(),t.ring.geometry.dispose(),t.ring.material.dispose(),t.pixels.material.dispose(),t.pixels.dispose()}clear(){for(const t of this.active)this.disposeFx(t),this.root.remove(t.root);this.active.length=0}}class JM{constructor(t){R(this,"base");R(this,"disks",[]);R(this,"nav");this.base=t,this.nav=new zi(t)}clearDynamic(){this.disks=[],this.nav=new zi(this.base)}blockDisk(t,e,n){!(n>0)||!Number.isFinite(t+e+n)||this.disks.push({x:t,y:e,r:n})}rebuildFromSlots(t){const e={...this.base,walkable:this.base.walkable.slice(),clearanceMeters:this.base.clearanceMeters.slice()},n=e.cellMeters,i=[];for(const s of t){const o=(s.width>0?s.width:6)/2,a=(s.depth>0?s.depth:6)/2,l=Math.floor((s.x-o)/n),c=Math.ceil((s.x+o)/n),h=Math.floor((s.y-a)/n),u=Math.ceil((s.y+a)/n);i.push({l:l*n,r:c*n,b:h*n,t:u*n});for(let d=h;d<u;d++)for(let f=l;f<c;f++)f<0||d<0||f>=e.width||d>=e.height||(e.walkable[d*e.width+f]=0)}for(const s of this.disks){const o=Math.floor((s.x-s.r)/n),a=Math.ceil((s.x+s.r)/n),l=Math.floor((s.y-s.r)/n),c=Math.ceil((s.y+s.r)/n),h=s.r*s.r;for(let u=l;u<c;u++)for(let d=o;d<a;d++){if(d<0||u<0||d>=e.width||u>=e.height)continue;const f=(d+.5)*n,m=(u+.5)*n,_=f-s.x,g=m-s.y;_*_+g*g<=h+1e-9&&(e.walkable[u*e.width+d]=0)}}for(let s=0;s<e.walkable.length;s++){if(!e.walkable[s]){e.clearanceMeters[s]=0;continue}const o=(s%e.width+.5)*n,a=(Math.floor(s/e.width)+.5)*n;let l=e.clearanceMeters[s];for(const c of i){const h=Math.max(c.l-o,0,o-c.r),u=Math.max(c.b-a,0,a-c.t);l=Math.min(l,Math.hypot(h,u))}for(const c of this.disks)l=Math.min(l,Math.max(0,Math.hypot(o-c.x,a-c.y)-c.r));e.clearanceMeters[s]=l}this.nav=new zi(e)}rebuild(t){this.disks=[],this.rebuildFromSlots(t)}canStand(t,e=.6){return this.nav.canStand(t,e)}move(t,e,n=.6){return this.nav.move(t,e,n)}findPath(t,e,n=.6){return this.nav.findPath(t,e,n)}segmentClear(t,e,n=.6){return this.nav.segmentClear(t,e,n)}spawnPoints(t,e={}){return this.nav.spawnPoints(t,e)}}const QM=180,tb=10,eb=72,nb=3,ib={tower:2500,obstacle:3e3,base:1e4},sb={tower_gun:{attack:"direct",damage:600,interval:.45,burst:3,spacing:.08,range:40,velocity:120,splash:0,pierce:0,windup:0,falloff:1},tower_throw:{attack:"area",damage:600,interval:2.6,burst:1,spacing:.2,range:44,velocity:36,splash:6,pierce:0,windup:.22,falloff:.55},tower_cannon:{attack:"area",damage:650,interval:3,burst:1,spacing:.2,range:65,velocity:48,splash:7,pierce:0,windup:.18,falloff:.55},tower_ballista:{attack:"direct",damage:760,interval:.5,burst:1,spacing:.1,range:70,velocity:140,splash:0,pierce:2,windup:0,falloff:1},tower_catapult:{attack:"area",damage:720,interval:4.2,burst:1,spacing:.2,range:80,velocity:48,splash:9,pierce:0,windup:.55,falloff:.55}},rb=[{name:"소형 무리 · 포탑 우세",hp:30,speed:3.2,damage:2,attackInterval:1.8,spawnInterval:1.5,monsters:["q_pink_slime","q_green_blob","q_mushnub","q_pigeon","q_chicken","q_cat","q_fish","q_bunny","q_birb"]},{name:"가시·유령 · 연속 타격",hp:65,speed:3.5,damage:3,attackInterval:1.65,spawnInterval:1.1,monsters:["q_cactoro","q_green_spiky_blob","q_ghost","q_alien","q_fish_2","q_cactoro_2","q_glub","q_frog","q_armabee"]},{name:"전사·장갑 · 관통 방어",hp:110,speed:3.8,damage:5,attackInterval:1.55,spawnInterval:.85,monsters:["q_orc_enemy","q_ninja","q_wizard","q_tribal","q_squidle","q_hywirl","q_monkroose","q_ninja_2","q_orc"]},{name:"대형 무리 · 전선 압박",hp:165,speed:4,damage:7,attackInterval:1.5,spawnInterval:.7,monsters:["q_dino","q_goleling","q_ghost_skull","q_blue_demon","q_alien_2","q_yeti","q_alpaking","q_armabee_evolved","q_glub_evolved"]},{name:"최종 진화종 · 본진 방어",hp:230,speed:4.2,damage:9,attackInterval:1.45,spawnInterval:.6,monsters:["q_mushnub_evolved","q_goleling_evolved","q_dragon","q_alpaking_evolved","q_dragon_evolved","q_mushroom_king","q_yeti_2","q_demon_2","q_demon"]}],tp={stageSeconds:QM,waveGapSeconds:tb,maxEnemies:eb,bodySpacing:nb,facilityHp:ib,weapons:sb,stages:rb},ob={q_pink_slime:{role:"소형",hpMultiplier:.85,speedMultiplier:.82,damageMultiplier:.7,attackIntervalMultiplier:1.12,armor:0,sector:1},q_green_blob:{role:"소형",hpMultiplier:1.1,speedMultiplier:.9,damageMultiplier:.86,attackIntervalMultiplier:1.08,armor:.04,sector:0},q_mushnub:{role:"소형",hpMultiplier:.96,speedMultiplier:.83,damageMultiplier:.8,attackIntervalMultiplier:1.16,armor:.03,sector:2},q_pigeon:{role:"기동",hpMultiplier:.8,speedMultiplier:1.28,damageMultiplier:.72,attackIntervalMultiplier:.9,armor:0,sector:0},q_chicken:{role:"기동",hpMultiplier:.88,speedMultiplier:1.16,damageMultiplier:.78,attackIntervalMultiplier:.96,armor:.02,sector:2},q_cat:{role:"기동",hpMultiplier:1.02,speedMultiplier:1.2,damageMultiplier:.9,attackIntervalMultiplier:.92,armor:.03,sector:1},q_fish:{role:"소형",hpMultiplier:.92,speedMultiplier:1.08,damageMultiplier:.84,attackIntervalMultiplier:1.02,armor:.01,sector:0},q_bunny:{role:"기동",hpMultiplier:1,speedMultiplier:1.34,damageMultiplier:.82,attackIntervalMultiplier:.94,armor:0,sector:2},q_birb:{role:"비행",hpMultiplier:.84,speedMultiplier:1.24,damageMultiplier:.76,attackIntervalMultiplier:.88,armor:.02,sector:1},q_cactoro:{role:"가시",hpMultiplier:1.16,speedMultiplier:.86,damageMultiplier:1.02,attackIntervalMultiplier:1.1,armor:.12,sector:0},q_green_spiky_blob:{role:"가시",hpMultiplier:1.24,speedMultiplier:.8,damageMultiplier:1.16,attackIntervalMultiplier:1.12,armor:.16,sector:2},q_ghost:{role:"기동",hpMultiplier:.86,speedMultiplier:1.13,damageMultiplier:.92,attackIntervalMultiplier:.95,armor:.04,sector:1},q_alien:{role:"전사",hpMultiplier:1.04,speedMultiplier:1.09,damageMultiplier:1.05,attackIntervalMultiplier:.96,armor:.07,sector:2},q_fish_2:{role:"기동",hpMultiplier:1.1,speedMultiplier:1.18,damageMultiplier:.94,attackIntervalMultiplier:.93,armor:.05,sector:0},q_cactoro_2:{role:"가시",hpMultiplier:1.3,speedMultiplier:.78,damageMultiplier:1.22,attackIntervalMultiplier:1.14,armor:.18,sector:1},q_glub:{role:"비행",hpMultiplier:.9,speedMultiplier:1.27,damageMultiplier:.86,attackIntervalMultiplier:.9,armor:.03,sector:0},q_frog:{role:"기동",hpMultiplier:1.08,speedMultiplier:1.22,damageMultiplier:1.08,attackIntervalMultiplier:.98,armor:.06,sector:2},q_armabee:{role:"비행",hpMultiplier:1,speedMultiplier:1.31,damageMultiplier:.98,attackIntervalMultiplier:.86,armor:.08,sector:1},q_orc_enemy:{role:"전사",hpMultiplier:1.2,speedMultiplier:.96,damageMultiplier:1.18,attackIntervalMultiplier:1.05,armor:.14,sector:0},q_ninja:{role:"기동",hpMultiplier:.88,speedMultiplier:1.38,damageMultiplier:.96,attackIntervalMultiplier:.82,armor:.04,sector:2},q_wizard:{role:"전사",hpMultiplier:.98,speedMultiplier:1.03,damageMultiplier:1.24,attackIntervalMultiplier:1.13,armor:.06,sector:1},q_tribal:{role:"전사",hpMultiplier:1.14,speedMultiplier:1.07,damageMultiplier:1.12,attackIntervalMultiplier:.94,armor:.11,sector:0},q_squidle:{role:"비행",hpMultiplier:1.03,speedMultiplier:1.16,damageMultiplier:1.04,attackIntervalMultiplier:.97,armor:.09,sector:2},q_hywirl:{role:"비행",hpMultiplier:.94,speedMultiplier:1.29,damageMultiplier:1.1,attackIntervalMultiplier:.88,armor:.05,sector:1},q_monkroose:{role:"전사",hpMultiplier:1.12,speedMultiplier:1.1,damageMultiplier:1.15,attackIntervalMultiplier:.92,armor:.1,sector:0},q_ninja_2:{role:"기동",hpMultiplier:1.02,speedMultiplier:1.42,damageMultiplier:1.08,attackIntervalMultiplier:.8,armor:.08,sector:2},q_orc:{role:"장갑",hpMultiplier:1.32,speedMultiplier:.91,damageMultiplier:1.28,attackIntervalMultiplier:1.08,armor:.2,sector:1},q_dino:{role:"대형",hpMultiplier:1.28,speedMultiplier:.94,damageMultiplier:1.2,attackIntervalMultiplier:1.1,armor:.17,sector:0},q_goleling:{role:"장갑",hpMultiplier:1.4,speedMultiplier:.73,damageMultiplier:1.26,attackIntervalMultiplier:1.18,armor:.26,sector:2},q_ghost_skull:{role:"전사",hpMultiplier:1.08,speedMultiplier:1.12,damageMultiplier:1.14,attackIntervalMultiplier:.98,armor:.13,sector:1},q_blue_demon:{role:"대형",hpMultiplier:1.24,speedMultiplier:1.05,damageMultiplier:1.3,attackIntervalMultiplier:.93,armor:.16,sector:0},q_alien_2:{role:"전사",hpMultiplier:1.18,speedMultiplier:1.15,damageMultiplier:1.22,attackIntervalMultiplier:.9,armor:.12,sector:2},q_yeti:{role:"대형",hpMultiplier:1.44,speedMultiplier:.82,damageMultiplier:1.34,attackIntervalMultiplier:1.16,armor:.22,sector:1},q_alpaking:{role:"비행",hpMultiplier:1.06,speedMultiplier:1.26,damageMultiplier:1.1,attackIntervalMultiplier:.91,armor:.1,sector:0},q_armabee_evolved:{role:"비행",hpMultiplier:1.22,speedMultiplier:1.36,damageMultiplier:1.24,attackIntervalMultiplier:.84,armor:.16,sector:2},q_glub_evolved:{role:"비행",hpMultiplier:1.16,speedMultiplier:1.33,damageMultiplier:1.16,attackIntervalMultiplier:.87,armor:.12,sector:1},q_mushnub_evolved:{role:"최종",hpMultiplier:1.5,speedMultiplier:.78,damageMultiplier:1.34,attackIntervalMultiplier:1.14,armor:.24,sector:0},q_goleling_evolved:{role:"최종",hpMultiplier:1.65,speedMultiplier:.69,damageMultiplier:1.42,attackIntervalMultiplier:1.22,armor:.32,sector:2},q_dragon:{role:"최종",hpMultiplier:1.36,speedMultiplier:1.04,damageMultiplier:1.32,attackIntervalMultiplier:1,armor:.2,sector:1},q_alpaking_evolved:{role:"최종",hpMultiplier:1.28,speedMultiplier:1.3,damageMultiplier:1.2,attackIntervalMultiplier:.89,armor:.18,sector:0},q_dragon_evolved:{role:"최종",hpMultiplier:1.56,speedMultiplier:.98,damageMultiplier:1.46,attackIntervalMultiplier:1.06,armor:.28,sector:2},q_mushroom_king:{role:"최종",hpMultiplier:1.7,speedMultiplier:.71,damageMultiplier:1.4,attackIntervalMultiplier:1.2,armor:.3,sector:1},q_yeti_2:{role:"최종",hpMultiplier:1.58,speedMultiplier:.8,damageMultiplier:1.38,attackIntervalMultiplier:1.17,armor:.27,sector:0},q_demon_2:{role:"최종",hpMultiplier:1.46,speedMultiplier:1.11,damageMultiplier:1.48,attackIntervalMultiplier:.88,armor:.23,sector:2},q_demon:{role:"최종",hpMultiplier:1.3,speedMultiplier:1.08,damageMultiplier:1.26,attackIntervalMultiplier:.95,armor:.19,sector:1}},ab={monsters:ob},lb={name:"감속 장판",description:"범위 안의 적 이동 속도를 45%로 낮춘다",radius:4.5,cooldown:1.2,duration:3.2,damage:0,slowMultiplier:.45,maxTargets:12},cb={name:"속박 트랩",description:"최대 3마리의 이동을 1.2초 멈춘다",radius:4,cooldown:3,duration:1.2,damage:0,slowMultiplier:1,maxTargets:3},hb={name:"가시 트랩",description:"범위 안의 적에게 0.55초마다 지속 피해",radius:4.5,cooldown:.55,duration:.55,damage:110,slowMultiplier:1,maxTargets:12},ub={name:"폭발 지뢰",description:"7m 범위 폭발 후 8초 재장전",radius:7,cooldown:8,duration:.7,damage:650,slowMultiplier:1,maxTargets:16},db={slow:lb,bind:cb,spikes:hb,mine:ub},je=tp;function ep(r){const t=ab.monsters[r];if(!t)throw new Error(`몬스터 개별 설정 누락: ${r}`);return t}function ra(){return structuredClone({weapons:tp.weapons,traps:db})}function fb(r){let t=2166136261;for(const e of r)t=Math.imul(t^e.charCodeAt(0),16777619);return t>>>0}function np(r){const t=fb(r),e=ep(r);return{speed:e.speedMultiplier,sector:e.sector,seed:t}}function pb(r,t,e){const{sector:n,seed:i}=np(t),s=[-15,0,15][n]+((i>>>4)%7-3)*1.05,o=2.2+(i>>>9)%5*.45,a=(i>>>14)%13/13*Math.PI*2,l=Array.from({length:9},(m,_)=>s*(1-_/8*.55)+Math.sin(_*1.8+a)*o*(_?1:.2)),c=m=>{const _=m*8,g=Math.min(7,Math.floor(_)),p=_-g,b=l[Math.max(0,g-1)],E=l[g],y=l[g+1],S=l[Math.min(8,g+2)];return .5*(2*E+(-b+y)*p+(2*b-5*E+4*y-S)*p*p+(-b+3*E-3*y+S)*p*p*p)},h=r.slice(1).reduce((m,_,g)=>m+Math.hypot(_.x-r[g].x,_.y-r[g].y),0);function u(m){for(let _=1;_<r.length;_++){const g=r[_-1],p=r[_],b=Math.hypot(p.x-g.x,p.y-g.y);if(m<=b){const E=b?Math.max(0,m/b):0;return{x:g.x+(p.x-g.x)*E,y:g.y+(p.y-g.y)*E}}m-=b}return{...r[r.length-1]}}const d=[],f=Math.max(32,Math.ceil(h/4));for(let m=0;m<=f;m++){const _=m/f,g=u(_*h),p=u(Math.max(0,_*h-.5)),b=u(Math.min(h,_*h+.5)),E=Math.max(.001,Math.hypot(b.x-p.x,b.y-p.y));let y=c(_),S={x:g.x-(b.y-p.y)/E*y,y:g.y+(b.x-p.x)/E*y};const w=d[d.length-1];if(e){let A=[];for(let v=0;v<18&&(e.canStand(S,.65)&&(A=e.findPath(w??g,S,.65)),!A.length);v++)y=v>15?0:y*.6,S={x:g.x-(b.y-p.y)/E*y,y:g.y+(b.x-p.x)/E*y};if(!A.length)throw new Error(`몬스터 진입 경로 연결 실패: ${t}`);w?d.push(...A.slice(1)):d.push(S)}else d.push(S)}return d}const mb={tower:900,wave:940,base:900},gd={tower:"타워 디펜스",wave:"웨이브 디펜스",base:"기지 방어"},fe=(r,t)=>Math.hypot(r.x-t.x,r.y-t.y);function ip(r){let t=0;for(let e=1;e<r.length;e++)t+=fe(r[e],r[e-1]);return t}function Ls(r,t){if(!r.length)return{x:75,y:26};for(let e=1;e<r.length;e++){const n=r[e-1],i=r[e],s=fe(n,i);if(t<=s){const o=s?Math.max(0,t/s):0;return{x:n.x+(i.x-n.x)*o,y:n.y+(i.y-n.y)*o}}t-=s}return{...r[r.length-1]}}function Ji(r,t){let e=0,n={s:0,point:{...r[0]},distance:1/0};for(let i=1;i<r.length;i++){const s=r[i-1],o=r[i],a=o.x-s.x,l=o.y-s.y,c=fe(s,o),h=c?Math.max(0,Math.min(1,((t.x-s.x)*a+(t.y-s.y)*l)/(c*c))):0,u={x:s.x+a*h,y:s.y+l*h},d=fe(t,u);d<n.distance&&(n={s:e+c*h,point:u,distance:d}),e+=c}return n}class gb{constructor(t,e,n,i=!0,s,o=ra(),a=[]){R(this,"facilities");R(this,"enemies",[]);R(this,"seen",new Set);R(this,"entryRoutes",new Map);R(this,"stageSpawned",[0,0,0,0,0]);R(this,"stageKilled",[0,0,0,0,0]);R(this,"elapsed",0);R(this,"finished",!1);R(this,"paused",!1);R(this,"killed",0);R(this,"spawned",0);R(this,"biteCount",0);R(this,"shotCount",0);R(this,"hitCount",0);R(this,"splashHits",0);R(this,"pierceHits",0);R(this,"peakAlive",0);R(this,"areaShots",0);R(this,"areaHits",0);R(this,"areaMisses",0);R(this,"directKills",0);R(this,"trapHits",0);R(this,"traps");R(this,"events",[]);R(this,"flights",[]);R(this,"nextSpawn",0);R(this,"serial",0);R(this,"groupSerial",0);R(this,"accumulator",0);R(this,"stageTag",-1);R(this,"routeLength");R(this,"stations",new Map);R(this,"bursts",new Map);R(this,"preparations",[]);if(this.mode=t,this.route=e,this.spawnEnabled=i,this.nav=s,this.settings=o,e.length<2)throw new Error("Defense route requires two points");this.routeLength=ip(e),this.traps=a.map(l=>({...l,pos:{...l.pos},cooldown:0,activations:0}));for(const l of je.stages.flatMap(c=>c.monsters))this.entryRoutes.set(l,pb(e,l,s));this.facilities=n.map(l=>({...l,pos:{...l.pos},approach:l.approach.map(c=>({...c})),hp:l.maxHp,cooldown:0})).sort((l,c)=>l.routeS-c.routeS);for(const l of this.facilities){const c=[];for(const[h,u,d]of[[5.7,6,!0],[10.2,12,!1],[14.8,24,!1]])for(let f=0;f<u;f++){const m=Math.PI/2+f*Math.PI*2/u,_={x:l.pos.x+Math.cos(m)*h,y:l.pos.y+Math.sin(m)*h};(!this.nav||this.nav.canStand(_,.65))&&c.every(g=>fe(g.pos,_)>=je.bodySpacing)&&c.push({pos:_,attack:d,owner:null})}this.stations.set(l.id,c)}}get duration(){return mb[this.mode]}get remaining(){return Math.max(0,this.duration-this.elapsed)}get alive(){return this.enemies.filter(t=>t.alive).length}get destroyed(){return this.facilities.filter(t=>t.hp<=0).length}get stage(){return Math.min(4,Math.floor((this.elapsed+1e-7)/(je.stageSeconds+(this.mode==="wave"?je.waveGapSeconds:0))))}get inGap(){return this.mode==="wave"&&this.stage<4&&(this.elapsed+1e-7)%(je.stageSeconds+je.waveGapSeconds)>=je.stageSeconds}get phaseLabel(){return this.finished?"관찰 완료":`${this.mode==="wave"?"웨이브":"단계"} ${this.stage+1} / 5 · ${this.inGap?"다음 웨이브 준비":je.stages[this.stage].name}`}get focus(){const t=this.facilities.find(e=>e.hp>0);return t?{x:75,y:Math.min(this.route[0].y-12,t.pos.y+8)}:Ls(this.route,this.routeLength)}aimPoint(t){var i;const e=this.preparations.find(s=>s.facility===t);if(e)return e.to;const n=this.facilities.find(s=>s.id===t);return n?((i=this.chooseTarget(n))==null?void 0:i.pos)??null:null}drainEvents(){const t=this.events;return this.events=[],t}advance(t){if(!(!Number.isFinite(t)||t<=0||this.paused||this.finished))for(this.accumulator+=t;this.accumulator>=.05-1e-9&&!this.finished;)this.step(.05),this.accumulator-=.05}release(t){var e;if(t.target){const n=(e=this.stations.get(t.target))==null?void 0:e[t.slot];(n==null?void 0:n.owner)===t.id&&(n.owner=null)}t.slot=-1}takeStation(t,e,n=!1){const s=this.stations.get(e.id).map((o,a)=>({s:o,i:a})).filter(({s:o})=>o.owner===null&&(!n||o.attack)).sort((o,a)=>Number(a.s.attack)-Number(o.s.attack)||fe(t.pos,o.s.pos)-fe(t.pos,a.s.pos));for(const{s:o,i:a}of s){const l=this.nav?this.nav.findPath(t.pos,o.pos,.65):[{...t.pos},{...o.pos}];if(l.length)return this.release(t),o.owner=t.id,t.slot=a,t.target=e.id,t.path=l,t.waypoint=l.length>1?1:0,t.phase="approach",!0}return!1}move(t,e,n){const i=fe(t.pos,e);if(i<.001)return;const s=Math.min(i,t.speed*n),o=(e.x-t.pos.x)/i*s,a=(e.y-t.pos.y)/i*s,l=t.pos,c=t.id%2?1:-1;for(const h of[0,c*Math.PI/3,-c*Math.PI/3,c*Math.PI/2,-c*Math.PI/2]){const u={x:l.x+o*Math.cos(h)-a*Math.sin(h),y:l.y+o*Math.sin(h)+a*Math.cos(h)},d=this.safePosition(t,u);if(fe(l,d)>.003){t.pos=d;break}}fe(l,t.pos)>.005&&(t.facing={x:t.pos.x-l.x,y:t.pos.y-l.y})}safePosition(t,e){const n=this.nav?this.nav.move(t.pos,e,.65):e;return this.enemies.some(i=>i.alive&&i!==t&&fe(n,i.pos)<2.6)?t.pos:n}moveEnemy(t,e){var i,s,o;let n=t.target?this.facilities.find(a=>a.id===t.target):void 0;if(n&&n.hp<=0&&(this.release(t),t.target=null,t.phase="road",t.s=Math.max(t.s,n.routeS+.1),n=void 0),t.phase==="road"){const a=this.facilities.filter(h=>h.hp>0&&h.routeS>=t.s-12),l=((i=a[0])==null?void 0:i.routeS)??1/0,c=a.filter(h=>h.routeS<=l+16).sort((h,u)=>fe(t.pos,h.pos)-fe(t.pos,u.pos))[0];if(c&&t.s>=c.routeS-12&&this.takeStation(t,c))n=c;else{const h=c?c.routeS-4:this.routeLength,u=this.entryRoutes.get(t.archetype),d=Ji(u,Ls(this.route,h)).s;t.roadS=Math.max(t.roadS,Ji(u,t.pos).s),this.move(t,Ls(u,Math.min(d,t.roadS+t.speed*e+.5)),e),t.roadS=Math.max(t.roadS,Ji(u,t.pos).s),t.s=Math.max(t.s,Ji(this.route,t.pos).s);return}}if(t.phase==="wait"&&n&&this.takeStation(t,n,!0),(t.phase==="approach"||t.phase==="wait")&&n){const a=(s=this.stations.get(n.id))==null?void 0:s[t.slot];if(!a)return;const l=t.path[t.waypoint]??a.pos;this.move(t,l,e),fe(t.pos,l)<.18&&t.waypoint<t.path.length-1&&t.waypoint++,fe(t.pos,a.pos)<.35&&(t.phase=a.attack?"attack":"wait")}if(t.phase==="attack"&&n){const a=(o=this.stations.get(n.id))==null?void 0:o[t.slot];a&&this.move(t,a.pos,e),t.facing={x:n.pos.x-t.pos.x,y:n.pos.y-t.pos.y}}}separate(){const t=this.enemies.filter(n=>n.alive),e=je.bodySpacing;for(let n=0;n<4;n++){let i=!1;const s=new Map;for(const o of t){const a=`${Math.floor(o.pos.x/e)},${Math.floor(o.pos.y/e)}`,l=s.get(a);l?l.push(o):s.set(a,[o])}for(const o of t){const a=Math.floor(o.pos.x/e),l=Math.floor(o.pos.y/e);for(let c=-1;c<=1;c++)for(let h=-1;h<=1;h++)for(const u of s.get(`${a+c},${l+h}`)??[]){if(u.id<=o.id)continue;const d=fe(o.pos,u.pos);if(d>=e)continue;d<2.7&&(i=!0);const f=(o.id*13+u.id*7)*2.399,m=d>.001?(u.pos.x-o.pos.x)/d:Math.cos(f),_=d>.001?(u.pos.y-o.pos.y)/d:Math.sin(f),g=(e-d+.01)/2,p={x:o.pos.x-m*g,y:o.pos.y-_*g},b={x:u.pos.x+m*g,y:u.pos.y+_*g};o.pos=this.safePosition(o,p),u.pos=this.safePosition(u,b)}}if(!i)break}}damage(t,e,n="tower_shot"){if(!t.alive)return;const i=e*(1-t.armor),s=Math.min(t.hp,i);t.hp=Math.max(0,t.hp-i),this.hitCount++,this.events.push({type:"hit",id:t.id,damage:s,source:n,to:{...t.pos}}),t.hp||(t.alive=!1,t.deadAt=this.elapsed,this.release(t),this.killed++,this.stageKilled[t.stage]++,this.events.push({type:"down",id:t.id,to:{...t.pos}}))}impact(t){if(t.attack==="area"){let s=0;for(const o of this.enemies)if(o.alive){const a=fe(o.pos,t.to);a<=t.splash&&(this.damage(o,t.damage*(1-(1-t.falloff)*a/Math.max(.01,t.splash))),this.areaHits++,this.splashHits++,s++)}s||this.areaMisses++,this.events.push({type:"impact",id:t.target,to:{...t.to},splash:t.splash,attack:"area"});return}const e=this.enemies.find(s=>s.id===t.target&&s.alive),n=e?{...e.pos}:t.to,i=this.enemies.filter(s=>s.alive&&s!==e);if(e&&(this.damage(e,t.damage),e.alive||this.directKills++),t.splash>0)for(const s of i)fe(s.pos,n)<=t.splash&&(this.damage(s,t.damage*.75),this.splashHits++);if(t.pierce>0){const s=n.x-t.from.x,o=n.y-t.from.y,a=Math.max(.01,Math.hypot(s,o)),l=i.filter(c=>{const h=c.pos.x-t.from.x,u=c.pos.y-t.from.y,d=(h*s+u*o)/a;return d>0&&d<=a+8&&Math.abs(h*o-u*s)/a<1.7}).sort((c,h)=>fe(c.pos,n)-fe(h.pos,n)).slice(0,t.pierce);for(const c of l)this.damage(c,t.damage*.85),this.pierceHits++}this.events.push({type:"impact",id:t.target,to:n,splash:t.splash,attack:"direct"})}chooseTarget(t){const e=this.settings.weapons[t.kind];if(!e)return;const n=new Map;for(const s of this.flights)if(s.attack==="direct"){const o=this.enemies.find(a=>a.id===s.target);n.set(s.target,(n.get(s.target)??0)+s.damage*(1-((o==null?void 0:o.armor)??0)))}return this.enemies.filter(s=>s.alive&&s.hp-(n.get(s.id)??0)>0&&fe(s.pos,t.pos)<=e.range).sort((s,o)=>+(o.phase==="attack")-+(s.phase==="attack")||o.s-s.s||s.id-o.id)[0]}predict(t,e){return t.phase==="road"?Ls(this.entryRoutes.get(t.archetype),t.roadS+t.speed*e):t.phase==="approach"&&t.path.length>1?Ls(t.path,Ji(t.path,t.pos).s+t.speed*e):{...t.pos}}launch(t,e,n,i){const s=Math.max(.08,fe(n,t.pos)/i.velocity);this.flights.push({target:e,time:s,damage:i.damage,splash:i.splash,pierce:i.pierce,from:{...t.pos},to:{...n},attack:i.attack,falloff:i.falloff}),this.shotCount++,i.attack==="area"&&this.areaShots++,this.events.push({type:"shot",id:t.id,target:e,from:{...t.pos},to:{...n},kind:t.kind,flightSeconds:s,splash:i.splash,attack:i.attack})}fire(t){const e=this.settings.weapons[t.kind],n=this.chooseTarget(t);if(!e||!n)return!1;if(e.attack==="area"){const i=e.windup+fe(n.pos,t.pos)/e.velocity,s=this.predict(n,i);e.windup>0?(this.preparations.push({facility:t.id,target:n.id,to:s,remaining:e.windup,gun:{...e}}),this.events.push({type:"windup",id:t.id,target:n.id,to:{...s},duration:e.windup,kind:t.kind,attack:"area"})):this.launch(t,n.id,s,e)}else this.launch(t,n.id,n.pos,e);return!0}tickTraps(t){for(const e of this.traps){if(e.cooldown=Math.max(0,e.cooldown-t),e.cooldown>0)continue;const n=this.settings.traps[e.kind],i=this.enemies.filter(s=>s.alive&&fe(s.pos,e.pos)<=n.radius).sort((s,o)=>fe(s.pos,e.pos)-fe(o.pos,e.pos)).slice(0,n.maxTargets);if(i.length){e.cooldown=n.cooldown,e.activations++;for(const s of i)if(e.kind==="slow"&&(s.slowUntil=Math.max(s.slowUntil,this.elapsed+n.duration),s.slowMultiplier=n.slowMultiplier),e.kind==="bind"&&(s.stunUntil=Math.max(s.stunUntil,this.elapsed+n.duration)),n.damage>0){const o=e.kind==="mine"?1-.45*fe(s.pos,e.pos)/n.radius:1;this.damage(s,n.damage*o,"trap"),this.trapHits++}this.events.push({type:"trap",id:e.id,trapKind:e.kind,to:{...e.pos},splash:n.radius,duration:n.duration,affected:i.map(s=>s.id),source:"trap"})}}}step(t){var o;this.elapsed=Math.min(this.duration,this.elapsed+t);const e=this.stage,n=je.stages[e];e!==this.stageTag&&(this.stageTag=e,this.nextSpawn=0),this.spawnEnabled&&!this.inGap&&(this.nextSpawn-=t,this.nextSpawn<=0&&this.alive<je.maxEnemies&&this.spawnGroup(e)&&(this.nextSpawn=n.spawnInterval*2.4*(this.mode==="base"?.95:1)));const i=[];for(const a of this.flights)a.time-=t,a.time>0?i.push(a):this.impact(a);this.flights=i;const s=[];for(const a of this.preparations){a.remaining-=t;const l=this.facilities.find(c=>c.id===a.facility);!l||l.hp<=0||(a.remaining>0?s.push(a):this.launch(l,a.target,a.to,a.gun))}this.preparations=s,this.tickTraps(t);for(const a of this.enemies)a.alive&&(a.speed=a.stunUntil>this.elapsed?0:a.baseSpeed*(a.slowUntil>this.elapsed?a.slowMultiplier:1),a.cooldown-=t,this.moveEnemy(a,t));this.separate();for(const a of this.enemies){if(!a.alive||a.phase!=="attack"||a.cooldown>0||a.stunUntil>this.elapsed)continue;const l=this.facilities.find(h=>h.id===a.target),c=l&&((o=this.stations.get(l.id))==null?void 0:o[a.slot]);!l||l.hp<=0||!c||!c.attack||fe(a.pos,c.pos)>1.1||fe(a.pos,l.pos)>7||(a.cooldown=a.attackInterval,l.hp=Math.max(0,l.hp-a.damage),this.biteCount++,this.events.push({type:"bite",id:a.id,target:l.id,from:{...a.pos},to:{...l.pos},damage:a.damage,source:"enemy_attack"}),l.hp||this.events.push({type:"destroy",id:l.id,to:{...l.pos},source:"enemy_attack"}))}for(const a of this.facilities){const l=this.settings.weapons[a.kind];if(!l||a.hp<=0||(a.cooldown-=t,this.preparations.some(h=>h.facility===a.id)))continue;const c=this.bursts.get(a.id);c?(c.next-=t,c.next<=0&&(this.fire(a)?c.remaining--:c.remaining=0,c.next+=l.spacing,c.remaining||this.bursts.delete(a.id))):a.cooldown<=0&&this.fire(a)&&(a.cooldown=l.interval,l.burst>1&&this.bursts.set(a.id,{remaining:l.burst-1,next:l.spacing}))}for(let a=this.enemies.length-1;a>=0;a--)!this.enemies[a].alive&&this.elapsed-this.enemies[a].deadAt>2.5&&this.enemies.splice(a,1);this.peakAlive=Math.max(this.peakAlive,this.alive),this.elapsed>=this.duration-1e-8&&(this.elapsed=this.duration,this.finished=!0)}spawnGroup(t){const e=++this.groupSerial,n=2+e%2;let i=!1;for(let s=0;s<n&&this.alive<je.maxEnemies;s++)i=this.spawn(t,e)||i;return i}spawn(t,e){const n=this.serial+1,i=je.stages[t],s=i.monsters[this.stageSpawned[t]%i.monsters.length],o=np(s),a=this.entryRoutes.get(s);for(let l=0;l<7;l++){const c=o.sector,h=l*3.4,u=Ls(a,h);if(this.enemies.some(_=>_.alive&&fe(_.pos,u)<je.bodySpacing+.2))continue;const d=ep(s),f=Math.round(i.hp*d.hpMultiplier);this.serial=n;const m={id:n,archetype:s,stage:t,maxHp:f,hp:f,s:Ji(this.route,u).s,target:null,phase:"road",cooldown:.6,speed:i.speed*o.speed,baseSpeed:i.speed*o.speed,slowUntil:0,slowMultiplier:1,stunUntil:0,lane:c,roadS:h,groupId:e,pos:u,facing:{x:0,y:-1},alive:!0,deadAt:-1,damage:Math.max(1,Math.round(i.damage*d.damageMultiplier)),armor:d.armor,attackInterval:i.attackInterval*d.attackIntervalMultiplier,slot:-1,path:[],waypoint:0};return this.enemies.push(m),this.spawned++,this.stageSpawned[t]++,this.seen.add(s),this.events.push({type:"spawn",id:n,to:{...u}}),!0}return!1}}const _b="DEF15-03",xb=[{id:"front-gun",kind:"tower_gun",name:"좌측 연사 포탑",x:59,y:230,width:3.2,depth:3.2},{id:"front-bomb",kind:"tower_throw",name:"우측 폭탄 투척",x:90,y:228,width:3.2,depth:3.2},{id:"rear-cannon",kind:"tower_cannon",name:"후방 범위 대포",x:88,y:203,width:3.2,depth:3.2},{id:"rear-catapult",kind:"tower_catapult",name:"후방 곡사 투석기",x:66,y:207,width:3.2,depth:3.2},{id:"reserve-ballista",kind:"tower_ballista",name:"예비 관통 포탑",x:75,y:184,width:3.2,depth:3.2},{id:"wall-left",kind:"k_fence_fortified",name:"좌측 방책",x:58,y:242,width:14,depth:1.8},{id:"wall-right",kind:"k_fence_fortified",name:"우측 방책",x:94,y:242,width:14,depth:1.8},{id:"supply-tent",kind:"k_tent",name:"보급 천막",x:57,y:194,width:5.5,depth:5.5},{id:"ammo-depot",kind:"k_structure",name:"탄약 창고",x:89,y:181,width:5.5,depth:5.5}],vb=[{id:"slow-left",kind:"slow",x:56,y:270},{id:"bind-center",kind:"bind",x:75,y:269},{id:"spikes-right",kind:"spikes",x:94,y:270},{id:"mine-right",kind:"mine",x:92,y:263}],va={revision:_b,facilities:xb,traps:vb},yb=va;function Mb(r){const t=structuredClone(r),e=t.cellMeters;for(const n of va.facilities)for(let i=Math.floor((n.y-n.depth/2)/e);i<=Math.floor((n.y+n.depth/2)/e);i++)for(let s=Math.floor((n.x-n.width/2)/e);s<=Math.floor((n.x+n.width/2)/e);s++)s>=0&&i>=0&&s<t.width&&i<t.height&&(t.walkable[i*t.width+s]=0);return t.clearanceMeters.fill(0),new zi(t)}function bb(r,t){return[...va.facilities,{id:"south-base",kind:"base",name:"남쪽 본진",x:t.x,y:t.y-6,width:4,depth:4}].map(n=>{const i={x:n.x,y:n.y},s=n.kind.startsWith("tower_")?je.facilityHp.tower:n.kind==="base"?je.facilityHp.base:je.facilityHp.obstacle;return{id:n.id,kind:n.kind,name:n.name,pos:i,maxHp:s,hp:s,routeS:n.kind==="base"?ip(r):Ji(r,i).s,approach:[],cooldown:0}})}function Sb(){return va.traps.map(r=>({id:r.id,kind:r.kind,pos:{x:r.x,y:r.y},cooldown:0,activations:0}))}const sp={tower_gun:{weapon:"weapon-turret",round:!1},tower_throw:{weapon:"weapon-catapult",round:!0},tower_cannon:{weapon:"weapon-cannon",round:!1},tower_ballista:{weapon:"weapon-ballista",round:!0},tower_catapult:{weapon:"weapon-catapult",round:!0}},wb=new Gn,_d=new Map;function Eb(r){let t=_d.get(r);return t||(t=wb.loadAsync(`/tools/unit_lab/kenney_parts/${r}.glb`).then(e=>e.scene),_d.set(r,t)),t}function xd(r){const t=sp[r];return t?[...t.round?["tower-round-bottom-b","tower-round-middle-b","tower-round-top-a"]:["tower-square-bottom-a","tower-square-middle-a","tower-square-top-a"],t.weapon]:[]}class oa{constructor(t){R(this,"root",new _e);R(this,"yaw");R(this,"barrel");R(this,"muzzleLocal",new P);R(this,"payload",null);R(this,"restZ",0);R(this,"restX",0);R(this,"recoil",0);R(this,"release",0);R(this,"recovery",0);R(this,"winding",0);R(this,"windingDuration",.55);R(this,"yawNow",Math.PI);R(this,"phase","대기");this.kind=t}static async build(t){const e={};return await Promise.all(xd(t).map(async n=>{e[n]=await Eb(n)})),oa.fromParts(t,e)}static fromParts(t,e){const n=new oa(t),i=sp[t];let s=0;for(const u of xd(t).slice(0,-1)){const d=e[u].clone(!0);d.updateMatrixWorld(!0);const f=new Pe().setFromObject(d);d.position.y+=s-f.min.y,s+=f.max.y-f.min.y,n.root.add(d)}const o=e[i.weapon].clone(!0);if(o.position.y=s,n.root.add(o),n.yaw=o.getObjectByName(i.weapon)??o.children[0],n.barrel=n.yaw.getObjectByName(i.weapon==="weapon-catapult"?"catapult":i.weapon==="weapon-ballista"?"arrow":"barrel"),!n.yaw||!n.barrel)throw new Error(`움직일 포탑 부품 누락: ${t}`);n.restZ=n.barrel.position.z,n.restX=n.barrel.rotation.x;const a=n.barrel;a.geometry.computeBoundingBox();const l=a.geometry.boundingBox,c=i.weapon==="weapon-catapult";n.muzzleLocal.set(0,c?l.max.y:(l.min.y+l.max.y)/2,c?l.min.z+.09:l.max.z),c&&(n.payload=new te(new ci(.13,.13,.13),new hn({color:t==="tower_throw"?15243320:12239806,roughness:.85})),n.payload.position.copy(n.muzzleLocal).add(new P(0,.07,0)),n.barrel.add(n.payload)),n.root.updateMatrixWorld(!0);const h=new Pe().setFromObject(n.root);return n.root.scale.setScalar(4.2/Math.max(.01,h.max.y-h.min.y)),n.root.name=`Articulated:${t}`,n.root.traverse(u=>{u.isMesh&&(u.castShadow=!0,u.receiveShadow=!0)}),n.yaw.rotation.y=n.yawNow,n}aim(t,e,n=!1){if(!t)return;const i=this.root.getWorldPosition(new P),s=Math.atan2(t.x-i.x,t.z-i.z),o=Math.atan2(Math.sin(s-this.yawNow),Math.cos(s-this.yawNow));this.yawNow+=n?o:Qe.clamp(o,-e*5.5,e*5.5),this.yaw.rotation.y=this.yawNow}prepare(t){this.winding=this.windingDuration=Math.max(.05,t),this.phase="준비",this.payload&&(this.payload.visible=!0)}fire(){this.winding=0,this.recoil=1,this.release=.22,this.recovery=.8,this.phase="발사",this.payload&&(this.payload.visible=!1,this.barrel.rotation.x=this.restX+1.22)}muzzleWorld(t=new P){return this.root.updateWorldMatrix(!0,!0),t.copy(this.muzzleLocal).applyMatrix4(this.barrel.matrixWorld)}tick(t){if(this.winding>0){this.winding=Math.max(0,this.winding-t);const e=1-this.winding/this.windingDuration;this.payload&&(this.barrel.rotation.x=this.restX-.16*Math.sin(e*Math.PI/2)),this.phase="준비";return}this.recoil=Math.max(0,this.recoil-t*8),this.release=Math.max(0,this.release-t),this.recovery=Math.max(0,this.recovery-t),this.payload?(this.barrel.rotation.x=this.restX+(this.release>0?1.22:1.22*Qe.clamp(this.recovery/.58,0,1)),this.payload.visible=this.recovery===0):this.barrel.position.z=this.restZ-.14*this.recoil*this.recoil,this.phase=this.release>0?"발사":this.recovery>0?"복귀":"대기"}dispose(){this.root.removeFromParent(),this.payload&&(this.payload.geometry.dispose(),this.payload.material.dispose())}}class Tb{constructor(t){R(this,"root",new _e);R(this,"moving",new _e);R(this,"box",new ci(1,1,1));R(this,"materials",[]);R(this,"lamps",[]);R(this,"remaining",0);R(this,"duration",.6);this.kind=t;const e=this.material(5663591),n=this.material(14470566),i=this.material(t==="mine"?16753215:t==="spikes"?11650749:7461572);this.lamps.push(i),this.block(this.root,[0,.12,0],[4.4,.24,4.4],e);for(const s of[-1.9,1.9])for(const o of[-1.9,1.9])this.block(this.root,[s,.32,o],[.35,.45,.35],n);if(this.root.add(this.moving),t==="slow")for(let s=-1;s<=1;s++)for(let o=-1;o<=1;o++)this.block(this.moving,[s*1.15,.26,o*1.15],[.6,.12,.6],i);if(t==="bind")for(let s=-2;s<=2;s++)this.block(this.moving,[s*.7,.3,0],[.13,.14,3.2],i),this.block(this.moving,[0,.3,s*.7],[3.2,.14,.13],i);if(t==="spikes")for(let s=-1;s<=1;s++)for(let o=-1;o<=1;o++)this.block(this.moving,[s*1.1,.35,o*1.1],[.38,.36,.38],n),this.block(this.moving,[s*1.1,.59,o*1.1],[.2,.15,.2],i);if(t==="mine"){this.block(this.moving,[0,.35,0],[1.65,.45,1.65],n);for(const s of[-.5,.5])this.block(this.moving,[s,.62,0],[.3,.12,.9],i)}this.root.name=`Trap:${t}`}material(t){const e=new hn({color:t,roughness:.7});return this.materials.push(e),e}block(t,e,n,i){const s=new te(this.box,i);s.position.set(e[0],e[1],e[2]),s.scale.set(n[0],n[1],n[2]),s.castShadow=!0,s.receiveShadow=!0,t.add(s)}activate(t){this.remaining=this.duration=Math.max(.35,Math.min(2,t))}tick(t,e){this.remaining=Math.max(0,this.remaining-t);const n=this.remaining?Math.sin((1-this.remaining/this.duration)*Math.PI):0;this.moving.position.y=this.kind==="spikes"?n*.65:this.kind==="bind"?n*.8:this.kind==="slow"?n*.1:0;for(const i of this.lamps)i.emissive.copy(i.color),i.emissiveIntensity=this.remaining?.3+n*1.3:e>0&&this.kind==="mine"?.02:.15}dispose(){this.root.removeFromParent(),this.box.dispose();for(const t of this.materials)t.dispose()}}const Ab={tower_gun:"연사 포탑",tower_ballista:"관통 포탑",tower_throw:"폭탄 투척",tower_cannon:"범위 대포",tower_catapult:"곡사 투석기"};class Cb{constructor(t,e){R(this,"root",document.createElement("details"));R(this,"draft",ra());R(this,"selected","weapon:tower_gun");R(this,"select");R(this,"fields");R(this,"description");R(this,"error");this.apply=e,this.root.style.cssText="margin:15px 0;border:1px solid #64784c;padding:10px;border-radius:8px",this.root.innerHTML='<summary style="cursor:pointer;font-weight:700">공격·트랩 밸런스 설정</summary><p style="font-size:11px;line-height:1.6">수치를 바꾸고 적용하면 방어를 처음부터 다시 시작합니다.</p><select style="width:100%;padding:7px" aria-label="방어 능력 선택"></select><p class="ability" style="font-size:11px;line-height:1.7"></p><div class="fields"></div><p class="error" style="color:#ffc49e;font-size:11px"></p><div class="def-row"><button class="apply">변경 적용</button><button class="reset">기본값</button></div>',this.select=this.root.querySelector("select"),this.fields=this.root.querySelector(".fields"),this.description=this.root.querySelector(".ability"),this.error=this.root.querySelector(".error");for(const[n,i]of Object.entries(Ab))this.select.add(new Option(i,"weapon:"+n));for(const[n,i]of Object.entries(this.draft.traps))this.select.add(new Option(i.name,"trap:"+n));this.select.onchange=()=>{if(!this.save()){this.select.value=this.selected;return}this.selected=this.select.value,this.render()},this.root.querySelector(".apply").onclick=()=>{this.save()&&this.apply(structuredClone(this.draft))},this.root.querySelector(".reset").onclick=()=>{this.draft=ra(),this.render(),this.apply(structuredClone(this.draft))},t.append(this.root),this.render()}spec(){const[t,e]=this.selected.split(":");return t==="weapon"?this.draft.weapons[e]:this.draft.traps[e]}save(){const t=[];for(const n of this.fields.querySelectorAll("input")){if(!n.checkValidity()||!Number.isFinite(n.valueAsNumber))return this.error.textContent="표시된 범위 안의 숫자를 입력해 주세요.",!1;t.push([n.dataset.key,n.valueAsNumber])}const e=this.spec();for(const[n,i]of t)e[n]=i;return this.error.textContent="",!0}render(){const[t,e]=this.selected.split(":"),n=this.spec();this.fields.replaceChildren(),this.error.textContent="";const i=[{key:"damage",title:"피해",min:0,max:3e3,step:1}];if(t==="weapon"){const s=n;this.description.textContent=s.attack==="direct"?`직격 · 빠른 발사 · ${s.burst}발 연사. 기본 피해는 45종 첫 명중 처치 기준입니다.`:"범위 · 느린 발사. 지정 지점에서 폭발하며 중심에서 가장자리로 피해가 감소합니다.",i.push({key:"interval",title:"공격 간격(초)",min:.1,max:15,step:.01},{key:"range",title:"사거리(m)",min:5,max:150,step:1},{key:"velocity",title:"탄속(m/s)",min:5,max:250,step:1}),s.attack==="direct"&&i.push({key:"burst",title:"연사 수",min:1,max:8,step:1},{key:"spacing",title:"연사 탄 간격(초)",min:.05,max:.5,step:.01},{key:"pierce",title:"추가 관통 대상",min:0,max:6,step:1}),s.attack==="area"&&i.push({key:"splash",title:"폭발 반경(m)",min:1,max:20,step:.1},{key:"windup",title:"발사 준비(초)",min:.05,max:2,step:.01},{key:"falloff",title:"가장자리 피해 비율",min:.1,max:1,step:.01})}else this.description.textContent=e==="slow"?"감속 · 피해 없이 이동 속도를 낮춥니다.":e==="bind"?"속박 · 최대 3마리의 이동과 공격을 잠깐 멈춥니다.":e==="spikes"?"가시 · 범위 안에서 반복 피해를 줍니다.":"지뢰 · 주변 폭발 후 긴 재사용 시간을 가집니다.",(e==="slow"||e==="bind")&&i.splice(0,1),i.push({key:"radius",title:"작동 반경(m)",min:1,max:20,step:.1},{key:"cooldown",title:"재사용(초)",min:.1,max:30,step:.01}),i.push({key:"maxTargets",title:"최대 대상 수",min:1,max:30,step:1}),(e==="slow"||e==="bind")&&i.push({key:"duration",title:"지속 시간(초)",min:.1,max:10,step:.1}),e==="slow"&&i.push({key:"slowMultiplier",title:"남는 이동 속도 비율",min:.05,max:1,step:.01});for(const s of i){const o=document.createElement("label");o.style.cssText="display:flex;justify-content:space-between;align-items:center;gap:6px;margin:7px 0;font-size:11px",o.textContent=s.title;const a=document.createElement("input");a.type="number",a.required=!0,a.dataset.key=s.key,a.min=String(s.min),a.max=String(s.max),a.step=String(s.step),a.value=String(n[s.key]),a.style.cssText="width:80px;padding:5px;background:#1d301f;border:1px solid #60784c;color:#f2edcf;border-radius:4px",o.append(a),this.fields.append(o)}}}async function Rb(r,t,e,n){const i=await(await fetch(r)).arrayBuffer(),s=new Int16Array(i,0,n*3),o=new Uint8Array(i,n*6,n*3),a=new Float32Array(n*3);for(let l=0;l<n;l++)a[l*3]=t[0]+s[l*3]*e,a[l*3+1]=t[1]+s[l*3+1]*e,a[l*3+2]=t[2]+s[l*3+2]*e;return{n,pos:a,col:o}}function Pb(r,t,e){const n=Math.max(.005,t),i=2048,s=new Map;for(let h=0;h<r.n;h++){const u=Math.floor(r.pos[h*3]/n),d=Math.floor(r.pos[h*3+1]/n),f=Math.floor(r.pos[h*3+2]/n),m=((u+1024)*i+(d+1024))*i+(f+1024);let _=s.get(m);_||(_={ix:u,iy:d,iz:f,votes:new Map},s.set(m,_));const g=r.col[h*3]>>4<<8|r.col[h*3+1]>>4<<4|r.col[h*3+2]>>4;_.votes.set(g,(_.votes.get(g)??0)+1)}const o=s.size,a=new Float32Array(o*3),l=new Float32Array(o*3);let c=0;for(const h of s.values()){let u=0,d=-1;for(const[f,m]of h.votes)m>d&&(u=f,d=m);a[c*3]=(h.ix+.5)*n,a[c*3+1]=(h.iy+.5)*n,a[c*3+2]=(h.iz+.5)*n,l[c*3]=(u>>8&15)*17/255,l[c*3+1]=(u>>4&15)*17/255,l[c*3+2]=(u&15)*17/255,c++}return{size:n,count:o,center:a,color:l}}function fl(r){return r<=.04045?r/12.92:Math.pow((r+.055)/1.055,2.4)}const Fi=-1,Ib=-2,_i=-3;function Lb(r){const t=r.size,e=r.count,n=new Int32Array(e),i=new Int32Array(e),s=new Int32Array(e);let o=1e9,a=1e9,l=1e9,c=-1e9,h=-1e9,u=-1e9;for(let Y=0;Y<e;Y++)n[Y]=Math.floor(r.center[Y*3]/t),i[Y]=Math.floor(r.center[Y*3+1]/t),s[Y]=Math.floor(r.center[Y*3+2]/t),o=Math.min(o,n[Y]),c=Math.max(c,n[Y]),a=Math.min(a,i[Y]),h=Math.max(h,i[Y]),l=Math.min(l,s[Y]),u=Math.max(u,s[Y]);const d=o-1,f=a-1,m=l-1,_=[c-o+3,h-a+3,u-l+3],g=(Y,Bt,re)=>(Y*_[1]+Bt)*_[2]+re,p=new Int32Array(_[0]*_[1]*_[2]).fill(Fi),b=Y=>Math.max(0,Math.min(31,Math.round(Y*31)));for(let Y=0;Y<e;Y++){const Bt=b(r.color[Y*3])<<10|b(r.color[Y*3+1])<<5|b(r.color[Y*3+2]);p[g(n[Y]-d,i[Y]-f,s[Y]-m)]=Bt}const E=_[0],y=_[1],S=_[2],w=S,A=y*S,v=new Int32Array(p.length);let T=0;for(v[T++]=0,p[0]=_i;T>0;){const Y=v[--T],Bt=Y%S,re=(Y/w|0)%y,Zt=Y/A|0;Zt+1<E&&p[Y+A]===Fi&&(p[Y+A]=_i,v[T++]=Y+A),Zt>0&&p[Y-A]===Fi&&(p[Y-A]=_i,v[T++]=Y-A),re+1<y&&p[Y+w]===Fi&&(p[Y+w]=_i,v[T++]=Y+w),re>0&&p[Y-w]===Fi&&(p[Y-w]=_i,v[T++]=Y-w),Bt+1<S&&p[Y+1]===Fi&&(p[Y+1]=_i,v[T++]=Y+1),Bt>0&&p[Y-1]===Fi&&(p[Y-1]=_i,v[T++]=Y-1)}for(let Y=0;Y<p.length;Y++)p[Y]===Fi&&(p[Y]=Ib);const I=[],L=[],U=[],W=[],K=[],k=[],$=[];let V=0,Q=13579;const it=()=>(Q=Q*16807%2147483647)/2147483647,ft=[A,w,1];for(let Y=0;Y<3;Y++){const Bt=(Y+1)%3,re=(Y+2)%3,Zt=ft[Y],Z=ft[Bt],ht=ft[re];for(const et of[1,-1]){const Dt=new Int32Array(_[Bt]*_[re]),zt=_[Bt],Lt=_[re],Ie=_[Y];for(let Gt=0;Gt<Ie;Gt++){let ue=!1;const oe=Gt+et,ee=oe<0||oe>=Ie;for(let jt=0;jt<Lt;jt++){const ae=Gt*Zt+jt*ht;for(let ie=0;ie<zt;ie++){const de=ae+ie*Z,ce=p[de];let Ee=-1;if(ce>=0&&(ee||p[de+et*Zt]===_i)){let N=0;if(ee)N=255;else{const qt=de+et*Zt,ne=(x,O)=>{const B=ie+x,X=jt+O;return B<0||X<0||B>=zt||X>=Lt?0:p[qt+x*Z+O*ht]!==_i?1:0},C=(x,O)=>{const B=ne(x,0),X=ne(0,O),st=ne(x,O);return B&&X?0:3-(B+X+st)};N=C(-1,-1)|C(1,-1)<<2|C(1,1)<<4|C(-1,1)<<6}Ee=ce|N<<15}Dt[jt*zt+ie]=Ee,Ee>=0&&(ue=!0)}}if(ue)for(let jt=0;jt<_[re];jt++)for(let ae=0;ae<_[Bt];){const ie=Dt[jt*_[Bt]+ae];if(ie<0){ae++;continue}let de=1;for(;ae+de<_[Bt]&&Dt[jt*_[Bt]+ae+de]===ie;)de++;let ce=1;t:for(;jt+ce<_[re];){for(let rt=0;rt<de;rt++)if(Dt[(jt+ce)*_[Bt]+ae+rt]!==ie)break t;ce++}for(let rt=0;rt<ce;rt++)for(let Mt=0;Mt<de;Mt++)Dt[(jt+rt)*_[Bt]+ae+Mt]=-1;const Ee=Gt+(et>0?1:0),N=[[ae,jt],[ae+de,jt],[ae+de,jt+ce],[ae,jt+ce]],qt=I.length/3,ne=(ie>>10&31)/31,C=(ie>>5&31)/31,x=(ie&31)/31,O=fl(ne),B=fl(C),X=fl(x),st=[ie>>15&3,ie>>17&3,ie>>19&3,ie>>21&3],ut=it();let q=0;for(const[rt,Mt]of N){const lt=[0,0,0];lt[Y]=Ee,lt[Bt]=rt,lt[re]=Mt,I.push((lt[0]+d)*t,(lt[1]+f)*t,(lt[2]+m)*t);const ct=[0,0,0];ct[Y]=et,L.push(ct[0],ct[1],ct[2]),U.push(ne,C,x),k.push(O,B,X),$.push(st[q++]/3),W.push(ut)}st[0]+st[2]<st[1]+st[3]?et>0?K.push(qt,qt+1,qt+3,qt+1,qt+2,qt+3):K.push(qt,qt+3,qt+1,qt+1,qt+3,qt+2):et>0?K.push(qt,qt+1,qt+2,qt,qt+2,qt+3):K.push(qt,qt+2,qt+1,qt,qt+3,qt+2),V++,ae+=de}}}}const at=new De;return at.setAttribute("position",new he(I,3)),at.setAttribute("normal",new he(L,3)),at.setAttribute("aCol",new he(U,3)),at.setAttribute("aSeed",new he(W,1)),at.setAttribute("color",new he(k,3)),at.setAttribute("aAO",new he($,1)),at.userData.blockSize=t,at.setIndex(K),at.computeBoundingSphere(),{geometry:at,stats:{quads:V,tris:V*2,blocks:e}}}function Db(r,t="#f4f4f4",e=.05){const n={uPurify:{value:0},uHit:{value:0},uMode:{value:r},uPureTint:{value:new Et(t)},uBlock:{value:e},uEdge:{value:.12}},i=new hn({vertexColors:!0,roughness:.62,metalness:0});return i.userData.u=n,i.onBeforeCompile=s=>{Object.assign(s.uniforms,n),s.vertexShader=s.vertexShader.replace("#include <common>",`#include <common>
attribute float aAO;
attribute float aSeed;
uniform float uPurify;
varying float vAO;
varying float vPu;
varying vec3 vObjPos;
varying vec3 vObjN;`).replace("#include <begin_vertex>",`#include <begin_vertex>
vAO = aAO;
vObjPos = position;
vObjN = normal;
float hh = clamp(position.y * 0.5, 0.0, 1.0);
vPu = smoothstep(hh * 0.5 + aSeed * 0.3, hh * 0.5 + aSeed * 0.3 + 0.2, uPurify * 1.1);`),s.fragmentShader=s.fragmentShader.replace("#include <common>",`#include <common>
uniform float uHit;
uniform float uMode;
uniform vec3 uPureTint;
uniform float uBlock;
uniform float uEdge;
varying float vAO;
varying float vPu;
varying vec3 vObjPos;
varying vec3 vObjN;`).replace("#include <color_fragment>",`vec3 orig = vColor.rgb;
float lum = dot(orig, vec3(0.2126, 0.7152, 0.0722));
vec3 cb = uMode < 1.5 ? orig : vec3(lum) * 0.35 + 0.02;
vec3 cp = uMode < 1.5 ? mix(orig, uPureTint, 0.72) + 0.02 : orig;
diffuseColor.rgb *= mix(cb, cp, vPu);
// 블록 AO: 맞닿은 안쪽 모서리를 어둡게
diffuseColor.rgb *= mix(0.38, 1.0, vAO * vAO);
// 블록 테두리: 면 위 좌표를 블록 크기로 나눠 칸 경계를 살짝 새긴다
vec3 an = abs(vObjN);
vec2 q = an.x > 0.5 ? vObjPos.yz : (an.y > 0.5 ? vObjPos.xz : vObjPos.xy);
vec2 fq = fract(q / uBlock + 0.0001);
vec2 ed = min(fq, 1.0 - fq);
float edge = 1.0 - smoothstep(0.0, uEdge, min(ed.x, ed.y));
diffuseColor.rgb *= 1.0 - edge * 0.22;`).replace("#include <emissivemap_fragment>",`#include <emissivemap_fragment>
totalEmissiveRadiance += uHit * vec3(1.0, 0.95, 0.85) * 0.9;`)},i}function Nb(r,t,e){const n=Math.max(.015,r.span/30),{geometry:i,stats:s}=Lb(Pb(t,n));i.computeBoundingBox();const o=i.boundingBox,a=o.getSize(new P),l=o.getCenter(new P),c=Math.min((1.7+e*.15)/Math.max(.01,a.y),2.4/Math.max(.01,Math.hypot(a.x,a.z)));return i.translate(-l.x,-o.min.y,-l.z),i.scale(c,c,c),i.computeBoundingBox(),i.computeBoundingSphere(),{geometry:i,blockSize:n*c,triangles:s.tris}}class Ub{constructor(){R(this,"cache",new Map)}get count(){return this.cache.size}async prepare(t){const e=await fetch("/tools/unit_lab/units_free.json");if(!e.ok)throw new Error("기존 유닛 카탈로그 읽기 실패");const n=(await e.json()).units,i=je.stages.flatMap(s=>s.monsters);if(new Set(i).size!==45||n.filter(s=>s.group==="enemy_monster").some(s=>!i.includes(s.id)))throw new Error("몬스터 45종 단계 배치 오류");for(let s=0;s<i.length;s++){const o=i[s];if(!this.cache.has(o)){const a=n.find(c=>c.id===o&&c.group==="enemy_monster");if(!a)throw new Error(`복셀 몬스터 누락: ${o}`);const l=await Rb(`/tools/unit_lab/${a.base}/${o}.dense.bin`,a.dense_lo,a.dense_q,a.dense);if(l.n!==a.dense||l.pos.some(c=>!Number.isFinite(c)))throw new Error(`복셀 샘플 오류: ${o}`);this.cache.set(o,Nb(a,l,Math.floor(s/9)))}t(s+1,i.length),await new Promise(a=>setTimeout(a,0))}}create(t){const e=this.cache.get(t);if(!e)throw new Error(`복셀 모델 준비 안 됨: ${t}`);const n=new te(e.geometry,Db(1,"#fff3ce",e.blockSize));n.castShadow=!0,n.receiveShadow=!0;const i=new _e;return i.name=`DefenseVoxel:${t}`,i.add(n),{root:i,mesh:n,hit:0,attack:0,dying:-1}}release(t){t.root.removeFromParent(),t.mesh.material.dispose()}}const Fb=["k_tent","k_structure","k_fence_fortified","base"],Ce=(r,t=0)=>new P(r.x,t,-r.y),Ob=r=>{const t=Math.ceil(r);return`${Math.floor(t/60).toString().padStart(2,"0")}:${(t%60).toString().padStart(2,"0")}`};class kb{constructor(t,e,n,i,s,o,a){R(this,"root",new _e);R(this,"active",!1);R(this,"session",null);R(this,"nav");R(this,"route",[]);R(this,"templates",[]);R(this,"settings",ra());R(this,"protos",new Map);R(this,"monsters",new Ub);R(this,"buildings",new Map);R(this,"trapVisuals",new Map);R(this,"enemies",new Map);R(this,"shots",[]);R(this,"hidden",new Map);R(this,"panel");R(this,"info");R(this,"list");R(this,"meter");R(this,"timer");R(this,"enterButton");R(this,"speed",1);R(this,"follow",!0);R(this,"controls");R(this,"prepared",!1);R(this,"busy",!1);R(this,"token",0);R(this,"mode","tower");R(this,"cube",new ci(1,1,1));R(this,"lightMat",new Le({color:16765050}));R(this,"bitMat",new Le({color:16749667}));R(this,"stoneMat",new hn({color:12962744,roughness:.9}));R(this,"foundationMat",new hn({color:8419163,roughness:1}));R(this,"trailMat",new Le({color:16755778,transparent:!0,opacity:.55,depthWrite:!1}));R(this,"bits",[]);R(this,"refreshAt",0);this.scene=t,this.camera=e,this.renderer=n,this.hideObjects=o,this.onToggle=a,this.nav=Mb(i),this.root.visible=!1,this.root.name="CodexDefensePreview",t.add(this.root),this.controls=new Qf(e,n.domElement),this.controls.enabled=!1,this.controls.enableDamping=!0,this.controls.maxDistance=480,this.controls.minDistance=6,this.controls.addEventListener("start",()=>{this.follow=!1});const l=document.createElement("style");l.textContent="#defensePanel{position:absolute;right:0;top:0;bottom:0;width:320px;background:#162216;overflow:auto;padding:18px 16px;border-left:1px solid #6a7b48;z-index:12;color:#ebedd6}#defensePanel[hidden]{display:none}#defensePanel h2{margin:0 0 5px;font-size:19px;color:#ece0ac}.def-sub{font-size:11px;line-height:1.6;color:#b5c09a}.def-modes{display:grid;gap:5px;margin:16px 0}.def-modes button,.def-row button{background:#293e27;color:#ecedd4;border:1px solid #687c48;border-radius:7px;padding:10px;cursor:pointer;font:inherit}.def-modes button.on{background:#8e8243;color:#10190d;border-color:#dacf88;font-weight:700}#defTimer{font-size:38px;font-weight:750;color:#f4eabe;margin:10px 0 2px}#defMeter{height:5px;background:#9ab467;transform-origin:left;margin:8px 0 12px}.def-row{display:flex;gap:5px;margin:12px 0}.def-row button{flex:1;font-size:11px;padding:8px}#defInfo{white-space:pre-line;padding:12px;background:#101b11;border:1px solid #475b35;border-radius:8px;font-size:12px;line-height:1.8}#defFacilityList{font-size:11px;margin-top:14px}.def-fac{padding:7px 0;border-bottom:1px solid #34452b}.def-fac>div{display:flex;justify-content:space-between;gap:6px}.def-fac small{color:#b5c09a;line-height:1.7}.def-fac.down{opacity:.45}.def-speed{font-size:11px;color:#b5c09a}.def-speed select{width:100px;margin-left:10px}@media(max-width:860px){#defensePanel{width:100%;top:auto;height:42vh}.def-modes{grid-template-columns:repeat(3,1fr);margin:8px 0}#defTimer{font-size:25px}}",document.head.append(l),this.panel=document.createElement("section"),this.panel.id="defensePanel",this.panel.hidden=!0,this.panel.innerHTML='<h2>숲 방어 진지</h2><p class="def-sub">전방 트랩 → 방책 통로 → 좌우 포탑 → 후방 화력<br>직격은 빠른 연사 · 폭탄과 투석기는 느린 범위 공격<br>포탑 5 · 방책 2 · 보급 시설 2 · 트랩 4 · 본진 1</p><div class="def-modes"><button data-defense="tower">타워 디펜스 · 15분</button><button data-defense="wave">웨이브 디펜스 · 5회</button><button data-defense="base">기지 방어 · 15분</button></div><div id="defTimer">15:00</div><div class="def-sub">남은 관찰 시간 · 캐릭터 없는 장면</div><div id="defMeter"></div><div id="defInfo" aria-live="polite">모델 준비 중</div><div class="def-row"><button id="defPause">일시정지</button><button id="defReplay">다시 보기</button></div><div class="def-row"><button id="defFocus">전선 따라보기</button><button id="defOverview">진지 전체</button></div><label class="def-speed">재생 속도<select id="defSpeed"><option value="1">1×</option><option value="2">2×</option><option value="4">4×</option><option value="8">8×</option><option value="16">16×</option></select></label><div id="defSettings"></div><div id="defFacilityList"></div><p class="def-sub">시설은 적 공격으로 무너집니다.<br>시간 종료는 승리·패배 판정이 아닙니다.</p><button class="action" id="defExit">숲 플레이로 돌아가기</button>',document.getElementById("layout").append(this.panel),this.info=this.panel.querySelector("#defInfo"),this.list=this.panel.querySelector("#defFacilityList"),this.timer=this.panel.querySelector("#defTimer"),this.meter=this.panel.querySelector("#defMeter"),new Cb(this.panel.querySelector("#defSettings"),c=>{if(this.busy){this.info.textContent="모델 준비가 끝난 뒤 적용해 주세요.";return}this.settings=c,this.start(this.mode)}),this.enterButton=document.createElement("button"),this.enterButton.textContent="디펜스",this.enterButton.className="link",this.enterButton.style.cssText="padding:4px 12px;border-radius:99px;border:1px solid #8da966;background:#344b27;color:#eaf0c9;cursor:pointer",document.querySelector("#topMenu nav").append(this.enterButton),this.enterButton.onclick=()=>{this.enter()},this.panel.querySelectorAll("[data-defense]").forEach(c=>c.onclick=()=>{this.start(c.dataset.defense)}),this.panel.querySelector("#defPause").onclick=()=>{this.session&&(this.session.paused=!this.session.paused,this.refresh())},this.panel.querySelector("#defReplay").onclick=()=>{this.start(this.mode)},this.panel.querySelector("#defFocus").onclick=()=>{this.follow=!0},this.panel.querySelector("#defOverview").onclick=()=>{this.follow=!1,this.controls.target.copy(Ce({x:75,y:237},1)),this.camera.position.copy(this.controls.target).add(new P(43,65,74)),this.camera.lookAt(this.controls.target),this.controls.update()},this.panel.querySelector("#defSpeed").onchange=c=>{this.speed=Number(c.target.value)},this.panel.querySelector("#defExit").onclick=()=>this.exit(),this.prepareRoute(i)}get focus(){var t;return((t=this.session)==null?void 0:t.focus)??this.route[0]??{x:75,y:26}}prepareRoute(t){const e=Math.min(t.height-3,Math.floor(284/t.cellMeters)),n=[];for(let i=0;i<t.width;i++){const s={x:(i+.5)*t.cellMeters,y:(e+.5)*t.cellMeters};this.nav.canStand(s,.65)&&n.push(s)}n.sort((i,s)=>Math.abs(i.x-75)-Math.abs(s.x-75));for(const i of n)if(this.route=this.nav.findPath(i,t.spawn,.65),this.route.length>1)break;if(this.route.length<2)throw new Error("북쪽과 남쪽을 잇는 길이 없습니다.");this.templates=bb(this.route,t.spawn)}async prepare(){if(this.prepared)return;const t=new Gn;await Promise.all(Fb.map(async e=>{const n=e==="base"?"/maps/forest150/releases/v7/catalog/unit_purified.glb":`/tools/unit_lab/units_free/${e}.glb`,i=await t.loadAsync(n);this.protos.set(e,this.normalized(i.scene,e==="base"?3.6:e==="k_fence_fortified"?2.2:3))})),await this.monsters.prepare((e,n)=>{this.info.textContent=`기존 복셀 몬스터 준비 · ${e} / ${n}`}),this.prepared=!0}normalized(t,e){t.updateMatrixWorld(!0);const n=new Pe().setFromObject(t),i=n.getCenter(new P),s=e/Math.max(.01,n.max.y-n.min.y);t.scale.multiplyScalar(s),t.position.set(-i.x*s,-n.min.y*s,-i.z*s),t.traverse(a=>{const l=a;l.isMesh&&(l.castShadow=!0,l.receiveShadow=!0)});const o=new _e;return o.add(t),o}async enter(){if(!this.active){this.active=!0,this.root.visible=!0,this.panel.hidden=!1,this.controls.enabled=!0,this.camera.fov=50,this.camera.updateProjectionMatrix(),this.onToggle(!0);for(const t of this.hideObjects())this.hidden.set(t,t.visible),t.visible=!1;for(const t of["side","gamePreview","previewChip"])document.getElementById(t).style.visibility="hidden";await this.start(this.mode)}}exit(){this.token++,this.active=!1,this.root.visible=!1,this.panel.hidden=!0,this.controls.enabled=!1;for(const[t,e]of this.hidden)t.visible=e;this.hidden.clear();for(const t of["side","gamePreview","previewChip"])document.getElementById(t).style.visibility="";this.camera.fov=72,this.camera.updateProjectionMatrix(),this.onToggle(!1)}async start(t){if(this.busy)return;this.busy=!0;const e=++this.token;this.mode=t,this.session=null,this.info.textContent="방어 시설과 적 모델 준비 중…";let n=[];try{await this.prepare();const i=this.templates.filter(o=>o.kind.startsWith("tower_"));if(n=await Promise.all(i.map(o=>oa.build(o.kind))),e!==this.token||!this.active){n.forEach(o=>o.dispose());return}this.clearVisuals(),this.session=new gb(t,this.route,this.templates,!0,this.nav,structuredClone(this.settings),Sb()),this.follow=!0,this.panel.querySelectorAll("[data-defense]").forEach(o=>o.classList.toggle("on",o.dataset.defense===t));const s=new is(new De().setFromPoints(this.route.map(o=>Ce(o,.08))),new ug({color:15193754,dashSize:3,gapSize:2,transparent:!0,opacity:.65}));s.computeLineDistances(),this.root.add(s),["q_green_blob","q_pink_slime","q_mushnub"].forEach((o,a)=>{const l=this.session.entryRoutes.get(o);this.root.add(new is(new De().setFromPoints(l.map(c=>Ce(c,.1))),new as({color:[8575920,16761722,8501727][a],transparent:!0,opacity:.2})))});for(const o of this.session.facilities){const a=new _e,l=n.find(_=>_.kind===o.kind);if(l)a.add(l.root);else if(o.kind==="k_fence_fortified")for(let _=0;_<4;_++){const g=sr(this.protos.get(o.kind)),p=new Pe().setFromObject(g),b=Math.max(.1,p.max.x-p.min.x);g.scale.x*=3.5/b,g.position.x=(_-1.5)*3.5,a.add(g)}else a.add(sr(this.protos.get(o.kind)));a.position.copy(Ce(o.pos)),this.root.add(a);const c=yb.facilities.find(_=>_.id===o.id),h=new te(this.cube,this.foundationMat);h.scale.set((c==null?void 0:c.width)??4,.12,(c==null?void 0:c.depth)??4),h.position.copy(Ce(o.pos,-.01)),h.receiveShadow=!0,this.root.add(h);const u=new _e,d=new te(new er(4,.18),new Le({color:2701866,side:on})),f=new te(new er(4,.18),new Le({color:o.kind==="base"?6673088:13424258,side:on}));f.position.z=.005,u.add(d,f),u.position.copy(Ce(o.pos,l?5.1:3.8)),this.root.add(u);const m=this.label(o.name);m.position.copy(Ce(o.pos,l?5.8:4.5)),this.root.add(m),this.buildings.set(o.id,{root:a,rig:l,bar:u,fill:f,label:m,collapse:-1})}for(const o of this.session.traps){const a=this.session.settings.traps[o.kind],l=new Tb(o.kind);l.root.position.copy(Ce(o.pos,.03)),this.root.add(l.root);const c=this.label(a.name);c.position.copy(Ce(o.pos,1.4)),this.root.add(c),this.root.add(this.ring(o.pos,a.radius,o.kind==="mine"?16758382:7592123,.16)),this.trapVisuals.set(o.id,{rig:l,label:c})}this.refresh(),this.camera.position.copy(Ce(this.focus,0).add(new P(35,48,55))),this.controls.target.copy(Ce(this.focus,1)),this.camera.lookAt(this.controls.target)}catch(i){n.forEach(s=>s.dispose()),this.info.textContent="방어 장면 준비 실패: "+String(i),console.error(i)}finally{this.busy=!1}}label(t){const e=document.createElement("canvas");e.width=320,e.height=52;const n=e.getContext("2d");n.fillStyle="#142113e6",n.fillRect(0,0,320,52),n.font="bold 25px Malgun Gothic, sans-serif",n.fillStyle="#efe8be",n.textAlign="center",n.fillText(t,160,35);const i=new $m(new Mf({map:new Cf(e),depthTest:!1,transparent:!0}));return i.scale.set(6,.98,1),i}ring(t,e,n,i){const s=Array.from({length:48},(o,a)=>Ce({x:t.x+Math.cos(a/48*Math.PI*2)*e,y:t.y+Math.sin(a/48*Math.PI*2)*e},.18));return new Ef(new De().setFromPoints(s),new as({color:n,transparent:!0,opacity:i,depthWrite:!1}))}removeLine(t){if(t){t.removeFromParent(),t.geometry.dispose();for(const e of Array.isArray(t.material)?t.material:[t.material])e.dispose()}}makeEnemy(t){var i;const e=(i=this.session)==null?void 0:i.enemies.find(s=>s.id===t);if(!e)return;const n=this.monsters.create(e.archetype);n.root.position.copy(Ce(e.pos)),this.root.add(n.root),this.enemies.set(t,n)}handle(t){var n;if(t.type==="spawn"){this.makeEnemy(t.id);return}const e=(n=this.buildings.get(t.id))==null?void 0:n.rig;if(t.type==="windup"&&t.to&&e&&(e.aim(Ce(t.to),0,!0),e.prepare(t.duration??.5)),t.type==="shot"&&t.from&&t.to){e==null||e.aim(Ce(t.to),0,!0),e==null||e.fire();const i=t.attack==="area",s=(e==null?void 0:e.muzzleWorld())??Ce(t.from,3),o=Ce(t.to,i?.2:1),a=new _e,l=new te(this.cube,i?this.stoneMat:this.lightMat);if(l.scale.setScalar(i?.65:.25),i||(l.scale.z=1.3),a.add(l),!i){const h=new te(this.cube,this.trailMat);h.scale.set(.18,.18,3.8),h.position.z=-2.2,a.add(h)}a.position.copy(s),a.lookAt(o),this.root.add(a);const c=i?this.ring(t.to,t.splash??1,16758116,.7):void 0;c&&this.root.add(c),this.shots.push({mesh:a,from:s,to:o,age:0,life:t.flightSeconds??.5,arc:i?t.kind==="tower_catapult"?10:t.kind==="tower_throw"?5:3:0,target:t.target,attack:i?"area":"direct",marker:c}),this.burst(s,i?5:3)}if(t.type==="trap"&&t.to){const i=this.trapVisuals.get(t.id);i==null||i.rig.activate(t.duration??.6),t.trapKind==="mine"?this.burst(Ce(t.to,.5),22,t.splash??5):t.trapKind==="spikes"&&this.burst(Ce(t.to,.3),5)}if(t.type==="hit"){const i=this.enemies.get(t.id);i&&(i.hit=1),t.to&&this.burst(Ce(t.to,1),2)}if(t.type==="impact"&&t.to&&this.burst(Ce(t.to,t.attack==="area"?.3:.8),t.attack==="area"?22:3,t.attack==="area"?t.splash??4:1),t.type==="bite"){const i=this.enemies.get(t.id);i&&(i.attack=.3),t.to&&this.burst(Ce(t.to,1.5),3)}if(t.type==="destroy"){const i=this.buildings.get(t.id);i&&(i.collapse=0,i.bar.visible=!1,i.label.visible=!1,this.burst(i.root.position.clone().add(new P(0,1,0)),14))}if(t.type==="down"){const i=this.enemies.get(t.id);i&&(i.dying=0,this.burst(i.root.position.clone().add(new P(0,1,0)),4))}}burst(t,e,n=1){for(let i=0;i<e;i++){const s=new te(this.cube,this.bitMat);s.scale.setScalar(.12+i%3*.08),s.position.copy(t),this.root.add(s);const o=i*2.399;this.bits.push({mesh:s,velocity:new P(Math.cos(o)*(3+n),2+i%4,Math.sin(o)*(3+n)),life:.8})}}tick(t,e){var a;if(!this.active)return;for(const l of this.hideObjects())l.visible=!1;const n=this.session;if(!n)return;if(n.paused){this.controls.update(),this.refresh();return}n.advance(t*this.speed);for(const l of n.drainEvents())this.handle(l);const i=Math.min(.2,t*this.speed),s=new Set(n.enemies.map(l=>l.id));for(const[l,c]of this.enemies)s.has(l)||(this.monsters.release(c),this.enemies.delete(l));for(const l of n.enemies){const c=this.enemies.get(l.id);if(c)if(l.alive){c.root.position.copy(Ce(l.pos)),c.root.rotation.y=Math.atan2(l.facing.x,-l.facing.y),c.hit=Math.max(0,c.hit-i*5),c.attack=Math.max(0,c.attack-i),c.mesh.material.userData.u.uHit.value=c.hit;const h=(l.phase==="road"||l.phase==="approach")&&l.speed>.05,u=n.elapsed*(h?l.speed*3.5:2)+l.id*1.7;c.mesh.position.y=h?Math.abs(Math.sin(u))*.1:Math.sin(u)*.016,c.mesh.rotation.z=h?Math.sin(u)*.04:0,c.mesh.rotation.x=c.attack>0?-Math.sin(c.attack/.3*Math.PI)*.16:0,c.mesh.scale.set(1,1+Math.sin(u)*.018,1)}else c.dying>=0?(c.dying+=i,c.mesh.scale.y=Math.max(.12,1-c.dying*.85),c.mesh.position.y=-Math.min(.8,c.dying*.5),c.mesh.rotation.z=c.dying*.6,c.dying>1.2&&(this.monsters.release(c),this.enemies.delete(l.id))):(this.monsters.release(c),this.enemies.delete(l.id))}for(const l of n.facilities){const c=this.buildings.get(l.id);if(c.fill.scale.x=l.hp/l.maxHp,c.fill.position.x=-2*(1-l.hp/l.maxHp),c.bar.quaternion.copy(this.camera.quaternion),c.collapse>=0)c.collapse+=i,c.root.rotation.z=Math.min(.8,c.collapse),c.root.position.y=-Math.min(3,c.collapse*2),c.collapse>1.8&&(c.root.visible=!1);else{const h=n.aimPoint(l.id);c.rig&&(c.rig.aim(h?Ce(h):null,i),c.rig.tick(i))}}for(const l of n.traps)(a=this.trapVisuals.get(l.id))==null||a.rig.tick(i,l.cooldown);if(this.shots=this.shots.filter(l=>{if(l.age+=t*this.speed,l.attack==="direct"){const h=n.enemies.find(u=>u.id===l.target&&u.alive);h&&l.to.copy(Ce(h.pos,1))}const c=Math.min(1,l.age/Math.max(.05,l.life));return l.mesh.position.lerpVectors(l.from,l.to,c),l.mesh.position.y+=Math.sin(c*Math.PI)*l.arc,l.mesh.lookAt(l.to),c>=1?(l.mesh.removeFromParent(),this.removeLine(l.marker),!1):!0}),this.bits=this.bits.filter(l=>(l.life-=t,l.velocity.y-=t*9,l.mesh.position.addScaledVector(l.velocity,t),l.mesh.rotation.x+=t*2,l.life<=0?(l.mesh.removeFromParent(),!1):!0)),this.camera.aspect=e,this.camera.updateProjectionMatrix(),this.follow){const l=Ce(n.focus,1.2);this.controls.target.lerp(l,Math.min(1,t*2));const c=l.clone().add(new P(35,48,55));this.camera.position.lerp(c,Math.min(1,t*2)),this.camera.lookAt(this.controls.target)}else this.controls.update();this.renderer.shadowMap.needsUpdate=!0,this.refreshAt+=t,this.refreshAt>=.15&&(this.refreshAt=0,this.refresh());const o=document.getElementById("status");o&&(o.textContent=`${gd[n.mode]} · ${n.elapsed.toFixed(1)} / ${n.duration}s · 적 ${n.alive} · 직격 처치 ${n.directKills} · 범위 명중 ${n.areaHits}`)}refresh(){const t=this.session;t&&(this.timer.textContent=Ob(t.remaining),this.meter.style.transform=`scaleX(${t.remaining/t.duration})`,this.info.textContent=`${gd[t.mode]} · ${t.phaseLabel}
생존 적 ${t.alive} · 처치 ${t.killed}
복셀 몬스터 ${t.seen.size} / 45종
직격 처치 ${t.directKills} · 범위 명중 ${t.areaHits}
${t.finished?"관찰 완료 · 승패 판정 없음":t.paused?"일시정지":"혼합 무리 진입 중"}`,this.panel.querySelector("#defPause").textContent=t.paused?"재생":"일시정지",this.panel.querySelector("#defPause").disabled=t.finished,this.list.innerHTML=t.facilities.map(e=>{var o;const n=t.settings.weapons[e.kind],i=(o=this.buildings.get(e.id))==null?void 0:o.rig,s=n?`${n.attack==="direct"?"직격":"범위"} · 피해 ${n.damage} · ${n.interval}초${n.splash?" · 반경 "+n.splash+"m":""} · ${(i==null?void 0:i.phase)??"대기"} · 재사용 ${Math.max(0,e.cooldown).toFixed(1)}초`:e.kind==="k_fence_fortified"?"방책 · 길 차단 · 중앙 통로 개방":"보급 시설 · 공격 없음";return`<div class="def-fac${e.hp<=0?" down":""}"><div><span>${e.name}</span><span>${e.hp>0?Math.ceil(e.hp)+" / "+e.maxHp:"붕괴"}</span></div><small>${s}</small></div>`}).join("")+"<h3>전방 트랩</h3>"+t.traps.map(e=>{const n=t.settings.traps[e.kind],i=e.kind==="slow"?`속도 ${Math.round(n.slowMultiplier*100)}% · ${n.duration}초`:e.kind==="bind"?`${n.duration}초 이동·공격 정지`:`피해 ${n.damage}`;return`<div class="def-fac"><div><span>${n.name}</span><span>${e.cooldown>0?e.cooldown.toFixed(1)+"초":"준비"}</span></div><small>${i} · 반경 ${n.radius}m · 발동 ${e.activations}회</small></div>`}).join(""))}clearVisuals(){var n;for(const i of this.enemies.values())this.monsters.release(i);const t=i=>{var s;(s=i.material.map)==null||s.dispose(),i.material.dispose()};for(const i of this.buildings.values())(n=i.rig)==null||n.dispose(),i.bar.traverse(s=>{if(s instanceof te){s.geometry.dispose();for(const o of Array.isArray(s.material)?s.material:[s.material])o.dispose()}}),t(i.label);for(const i of this.trapVisuals.values())i.rig.dispose(),t(i.label);const e=[];this.root.traverse(i=>{i instanceof is&&e.push(i)}),e.forEach(i=>this.removeLine(i)),this.enemies.clear(),this.buildings.clear(),this.trapVisuals.clear(),this.shots=[],this.bits=[],this.root.clear()}}const $o=["polluted","mid","purified"],$s={polluted:"오염",mid:"정화중",purified:"정화완료"},Bb={polluted:1,mid:2,purified:3};function zb(r){return $o.includes(r)}function Kr(r){return zb(r)?r:r==="polluted"?"polluted":"purified"}function Hb(r){return r==="polluted"?"polluted":"purified"}function Ds(r,t,e){const n=new Et(r),i=new Et(t);return"#"+n.lerp(i,e).getHexString()}function Vb(r,t,e){const n=Math.min(1,Math.max(0,e));return{sky:Ds(r.sky,t.sky,n),sun:Ds(r.sun,t.sun,n),sunIntensity:r.sunIntensity+(t.sunIntensity-r.sunIntensity)*n,hemiSky:Ds(r.hemiSky,t.hemiSky,n),hemiGround:Ds(r.hemiGround,t.hemiGround,n),hemiIntensity:r.hemiIntensity+(t.hemiIntensity-r.hemiIntensity)*n,fogColor:Ds(r.fogColor??r.sky,t.fogColor??t.sky,n),fogNear:(r.fogNear??90)+((t.fogNear??90)-(r.fogNear??90))*n,fogFar:(r.fogFar??300)+((t.fogFar??300)-(r.fogFar??300))*n,backdropTint:Ds(r.backdropTint??"#ffffff",t.backdropTint??"#ffffff",n)}}function aa(r,t){an.background=new Et(t??r.sky),Yo.color.set(r.hemiSky),Yo.groundColor.set(r.hemiGround),Yo.intensity=r.hemiIntensity,xn.color.set(r.sun),xn.intensity=r.sunIntensity,Sc=r.fogColor?new Wc(r.fogColor,r.fogNear??90,r.fogFar??300):null}let Ur=null,zs=null,pl=!1;const kt=r=>document.getElementById(r),se=()=>kt("status"),bc=.3;function Gb(r){let t=0;return r.traverse(e=>{var o;const n=e,i=e.name.toLowerCase(),s=n.isMesh?(((o=n.geometry)==null?void 0:o.name)??"").toLowerCase():"";if(!(!i.includes("flower_mushroom")&&!s.includes("flower_mushroom"))){if(n.isInstancedMesh){const a=n,l=new Ht,c=new P,h=new mn,u=new P;for(let d=0;d<a.count;d++)a.getMatrixAt(d,l),l.decompose(c,h,u),u.multiplyScalar(bc),l.compose(c,h,u),a.setMatrixAt(d,l);a.instanceMatrix.needsUpdate=!0,a.computeBoundingBox(),a.computeBoundingSphere(),t+=a.count;return}e.scale.multiplyScalar(bc),t++}}),t}const sh=kt("viewport"),ze=new Wf({antialias:!0,canvas:kt("gameCanvas")});ze.setPixelRatio(Math.min(devicePixelRatio,1.5));ze.outputColorSpace=Be;ze.toneMapping=zn;ze.shadowMap.enabled=!0;ze.shadowMap.type=Yd;ze.shadowMap.autoUpdate=!1;const an=new _f,Yo=new Nf("#C7DBEE","#263C25",.65),xn=new ia("#FFF0C4",2.3);xn.castShadow=!0;xn.shadow.mapSize.set(2048,2048);xn.shadow.bias=-15e-5;xn.shadow.normalBias=.035;xn.shadow.camera.near=1;xn.shadow.camera.far=450;an.add(Yo,xn,xn.target);const ve=new CM(sh);ve.bindUi();oS();const Tr=new Mc,Rt=new Zf;an.add(Rt.root);Rt.root.rotation.y=ve.facing;const Ys=new Wg,la=new At;let Je,fn,Fr=null,Wi=[],Zr="",ri="purified",Ut=null,Ns=null,Sc=null,ot={x:75,y:26},Ks=!1,Or=!1,Zs="",ml=0,Xi=!1,ti="";const In=new Set;let Sn=null;const Nt=new RM(an,()=>fn,()=>ot,r=>{ot=r},Rt,"/tools/unit_lab/monsters_anim/mushnub.glb");Nt.viewForward=()=>ve.viewForward();const nt=new nh(an),rh=new jM(an);nt.onSpawnFx=r=>rh.burst(r);nt.onNavDirty=()=>wc();function wc(){var t;if(!Fr)return;const r=((t=nt.layout)==null?void 0:t.slots)??[];if(Fr.rebuildFromSlots(r),fn=Fr.nav,!fn.canStand(ot,.6)){const e=fn.spawnPoints(8,{radius:.65,awayFrom:ot,minDistance:.5,spacing:1.2});e[0]&&(ot=e[0])}}const ls=new NM(an),bn=new KM,En=new _e;En.name="placedProps";an.add(En);const rn=new _e;rn.name="catalogDragGhost";rn.visible=!1;an.add(rn);const gl=new Map;let ii=null,to=!1,Ec=!1;const rp=new P,op=$d(()=>Promise.resolve().then(()=>Yf),void 0).then(r=>new r.GLTFLoader);let jr=Pn[0].id,Jr=Jn[0].id;const vd=new P(1e6,0,0);function oh(){const r=sh.getBoundingClientRect(),t=Math.max(1,Math.floor(r.width)),e=Math.max(1,Math.floor(r.height));ze.setSize(t,e,!1)}addEventListener("resize",oh);oh();let Qn="play";const Wb={play:"플레이 · WASD 이동 · F 사격 · PLAY로 사냥",place:"배치 · 카탈로그에서 드래그 → 슬롯 스냅 또는 자유 프롭",build:"건설 · 빈 패드 클릭 → 종류 칩으로 설치",inspect:"살펴보기 · 메시 클릭 검사 · 정화/오염 · 설치 없음"};function ah(r){document.querySelectorAll(".panel-tab").forEach(t=>{t.classList.toggle("active",t.dataset.panel===r)}),document.querySelectorAll(".panel-body").forEach(t=>{t.hidden=t.dataset.panel!==r}),(r==="units"||r==="place")&&requestAnimationFrame(()=>bn.resize())}function ap(r){Qn=r,document.querySelectorAll(".mode-btn").forEach(i=>{i.classList.toggle("active",i.dataset.mode===r)}),ah({play:"play",place:"place",build:"build",inspect:"inspect"}[r]);const e=document.getElementById("hint");e&&(e.textContent=Wb[r]),document.body.dataset.mode=r;const n=document.getElementById("viewport");n&&(n.classList.toggle("mode-place",r==="place"),n.classList.toggle("mode-build",r==="build"),n.classList.toggle("mode-inspect",r==="inspect")),lh(),r==="place"&&requestAnimationFrame(()=>bn.resize())}function lh(){const r=Qn==="play"?"플레이":Qn==="place"?"배치":Qn==="build"?"건설":"살펴보기",t=nt.selectedSlotId?`슬롯 ${nt.selectedSlotId}`:Rt.key?Rt.key:"선택 없음",e=Qn==="play"?"WASD · F":Qn==="place"?"DnD":Qn==="build"?"클릭 패드":"클릭 검사",n=document.getElementById("statusModeLine");n&&(n.textContent=`${r} · ${t} · ${e}`)}document.querySelectorAll(".panel-tab").forEach(r=>{r.onclick=()=>ah(r.dataset.panel||"play")});document.querySelectorAll(".mode-btn").forEach(r=>{r.onclick=()=>ap(r.dataset.mode||"play")});const _l=document.getElementById("previewChip"),yd=document.getElementById("previewCollapse");function ch(r){const t=document.getElementById("gamePreview"),e=document.getElementById("previewChip");t&&t.classList.toggle("collapsed",!r),e&&(r?e.setAttribute("hidden",""):e.removeAttribute("hidden")),document.body.classList.toggle("preview-expanded",r)}_l&&(_l.addEventListener("pointerdown",r=>r.stopPropagation()),_l.onclick=()=>ch(!0));yd&&(yd.onclick=()=>ch(!1));ch(!1);ap("play");async function xl(r){const t=await fetch(r,{cache:"no-store"});if(!t.ok)throw new Error(r+" "+t.status);return t.json()}function cs(r=!1){if(!Ut)return;const t=Sn!=null&&Sn.active?Sn.focus:ot,e=Fe(t.x,t.y,0);if(xn.position.set(e.x-40,e.y+90,e.z+35),xn.target.position.copy(e),ze.shadowMap.needsUpdate=!0,!r&&e.distanceTo(vd)<5)return;vd.copy(e);const n=48;Object.assign(xn.shadow.camera,{left:-n,right:n,top:n,bottom:-n}),xn.shadow.camera.updateProjectionMatrix(),Ut.root.traverse(i=>{const s=i;if(!s.isMesh)return;s.receiveShadow=!0;const o=s;let a=s.getWorldPosition(new P);o.isInstancedMesh&&(o.computeBoundingSphere(),o.boundingSphere&&(a=o.localToWorld(o.boundingSphere.center.clone()))),s.castShadow=/tree|rock|shrub|build_pad/.test(s.name)&&a.distanceTo(e)<85}),ze.shadowMap.needsUpdate=!0}function Xb(){const r=kt("objectCategory"),t=r.value;for(;r.options.length>1;)r.remove(1);for(const e of[...new Set(Wi.map(n=>n.category))].sort()){const n=document.createElement("option");n.value=n.textContent=e,r.append(n)}[...r.options].some(e=>e.value===t)&&(r.value=t)}function eo(){const r=(kt("objectSearch").value||"").toLowerCase(),t=kt("objectCategory").value,e=Wi.filter(i=>(!t||i.category===t)&&`${i.name} ${i.id}`.toLowerCase().includes(r)),n=kt("objectList");n.replaceChildren();for(const i of e){const s=document.createElement("button");s.type="button",s.textContent=`${i.name} · ${i.id}`,s.setAttribute("aria-current",String(Zr===i.id)),s.onclick=()=>hh(i.id),n.append(s)}}function hh(r){Zr=r,eo();const t=Wi.find(i=>i.id===r);if(!t){kt("objectInfo").textContent="항목 없음";return}const e=t.boundsMeters[ri]??Object.values(t.boundsMeters)[0]??[],n=t.variants[ri]??Object.values(t.variants)[0]??"";kt("objectInfo").textContent=[`${t.name} (${t.id})`,`분류: ${t.category} / rev ${t.sourceRevision}`,`상태: ${ri}`,`크기 XYZ: ${e.map(i=>i.toFixed(2)).join(" × ")} m`,`피벗: ${t.pivot}`,n].join(`
`)}function uh(){Ut!=null&&Ut.person&&(Ut.person.visible=!Rt.key),Rt.root.visible=!!Rt.key}function qb(){const r=kt("charWho").value;return kt("charBody").value==="35"?`${r}_35`:r}function no(){const r=kt("charButtons");r.replaceChildren();for(const t of Zf.catalogEntries()){const e=document.createElement("button");e.type="button",e.textContent=t.label,e.dataset.key=t.key,e.classList.toggle("active",Rt.key===t.key),e.onclick=()=>{const n=t.key.replace(/_35$/,"");kt("charWho").value=n,kt("charBody").value=t.key.endsWith("_35")?"35":"2",dh()},r.append(e)}}const $b=[{match:/^(idle|stand|ingame_idle)$/i,label:"대기"},{match:/^(walk)$/i,label:"걷기"},{match:/^(run|move)$/i,label:"뛰기"},{match:/^(shoot|shoot2)$/i,label:"쏘기"},{match:/^(throw)$/i,label:"던지기"},{match:/^(pickup)$/i,label:"줍기"},{match:/^(victory)$/i,label:"승리"},{match:/^(fail)$/i,label:"패배"}];function vl(r){for(const t of $b)if(t.match.test(r))return t.label;return r}function ca(){const r=kt("animSelect"),t=r.value;r.replaceChildren();const e=document.getElementById("animPills");if(e&&e.replaceChildren(),!Rt.clips.length){const n=document.createElement("option");n.value="",n.textContent="(클립 없음)",r.append(n);return}for(const n of Rt.clips){const i=document.createElement("option");i.value=n.name,i.textContent=`${vl(n.name)} · ${n.name}`,r.append(i)}if([...r.options].some(n=>n.value===t)?r.value=t:Rt.current&&(r.value=Rt.current),e){const n=["idle","run","walk","walk_shoot","walk_gun","shoot","shoot2","draw","holster","draw_launcher","holster_launcher","throw"],i=new Set;for(const o of n){const a=Rt.clips.find(c=>c.name.toLowerCase()===o);if(!a||i.has(a.name))continue;i.add(a.name);const l=document.createElement("button");l.type="button",l.className="anim-pill"+(Rt.current===a.name?" on":""),l.dataset.anim=a.name,l.textContent=vl(a.name),l.addEventListener("click",()=>{Ac(a.name,/shoot|throw|pickup|victory|fail/i.test(a.name)),ca(),kt("charInfo").textContent=`클립: ${a.name}`+(Rt.key?`
${Yr(Rt.key)}`:"")}),e.append(l)}let s=0;for(const o of Rt.clips){if(i.has(o.name)||s>=6)continue;i.add(o.name),s++;const a=document.createElement("button");a.type="button",a.className="anim-pill minor"+(Rt.current===o.name?" on":""),a.dataset.anim=o.name,a.textContent=vl(o.name),a.addEventListener("click",()=>{Ac(o.name,!1),ca()}),e.append(a)}}}function Yb(){const r=document.getElementById("buildAnimClips");if(!r)return;r.replaceChildren();const t=nt.clipsOn();if(!t.length){r.textContent="선택 슬롯 애니 없음";return}for(const n of t){const i=document.createElement("button");i.type="button",i.className="anim-pill minor",i.textContent=n.name,i.addEventListener("click",()=>{nt.playSlotClip(null,n.name),Ma()}),r.append(i)}const e=nt.currentClipOn();if(e){const n=document.createElement("span");n.className="muted",n.textContent=` 재생: ${e}`,r.append(n)}}async function dh(){const r=qb();kt("charInfo").textContent=`로딩: ${Yr(r)}…`,se().textContent=`캐릭터 로딩: ${r}`;try{await Rt.load(r),Nt.onCharacterReady(),Xi=!1,ti="",no(),ca(),uh(),Rt.root.position.copy(Fe(ot.x,ot.y,0)),kt("charInfo").textContent=[`스폰: ${Yr(r)}`,`키: ${r}`,`클립 ${Rt.clips.length}개 · 현재 ${Rt.current||"-"}`,`위치 ${ot.x.toFixed(1)}, ${ot.y.toFixed(1)} m (내비 마스크)`].join(`
`),se().textContent=`캐릭터 ${r} 준비`}catch(t){kt("charInfo").textContent="스폰 실패: "+t.message,se().textContent="캐릭터 실패: "+t.message,console.error(t)}}function Kb(){Rt.clear(),Xi=!1,ti="",no(),ca(),uh(),kt("charInfo").textContent="맵 기본 person GLB 사용 중"}function fh(r){const t=document.getElementById("stateSelect");t&&t.value!==r&&(t.value=r);const e=document.getElementById("purifyRing");e&&e.setAttribute("data-stage",r);const n=document.getElementById("purifyStageNum");n&&(n.textContent=String(Bb[r]));const i=document.getElementById("purifyStageName");i&&(i.textContent=$s[r]);const s=document.getElementById("statusPurify");s&&(s.setAttribute("data-stage",r),s.textContent=$s[r]),document.querySelectorAll("#purifySteps button, #purifyCompact button").forEach(o=>{o.classList.toggle("active",o.dataset.stage===r)})}function Zb(){const r=document.getElementById("purifyFlash");r&&(r.classList.add("on"),window.setTimeout(()=>r.classList.remove("on"),420))}function Md(r=performance.now()){if(!Ur)return;const{from:t,to:e,toSky:n,t0:i,dur:s}=Ur,o=Math.min(1,(r-i)/s),a=o<.5?2*o*o:1-Math.pow(-2*o+2,2)/2,l=Vb(t,e,a),c=Math.sin(Math.PI*a)*.35;l.sunIntensity+=c*.55,l.hemiIntensity+=c*.12,aa(l,a>.35?n??e.sky:void 0),zs=l,o>=1&&(aa(e,n??e.sky),zs=e,Ur=null,cs(!0))}async function ph(r,t={}){var a;if(!Je)return;const e=Kr(r),n=t.animate!==!1&&Ks&&!!zs,i=++ml;Or=!0,Zs="";const s=ri;ri=e,fh(e),se().textContent=`정화 단계: ${$s[e]} 불러오는 중…`;const o=zs??Je.lighting[Kr(s)]??Je.lighting.purified;try{const l=(a=Je.backdrops)==null?void 0:a[e],c=Je.lighting[e];if(!c)throw new Error("missing lighting for "+e);const h=(Je.states[e]??Je.states.purified)+"?rev="+Je.revision,u=await eh.load(h,Je.person,void 0,void 0,{blockM:.5,personM:1.5,stand:{x:ot.x,y:ot.y,z:0,yaw:ve.facing},backdrop:l??{radius:420,height:360,footY:255}});let d=null;try{l&&(d=await th.load(l,c.backdropTint))}catch(m){throw u.dispose(),m}if(i!==ml){u.dispose(),d==null||d.dispose();return}Ns==null||Ns.dispose(),Ns=d,Ns&&an.add(Ns.mesh),Ut==null||Ut.dispose(),Ut=u,Ut!=null&&Ut.person&&(Ut.person.rotation.y=ve.facing);const f=Gb(Ut.root);console.info(`[forest-play] mushroom scale override: ${bc} (${f} instances)`),Ut.grassFar=58,an.add(Ut.root),uh(),nt.setMapState(Hb(e)),kt("mapInfo").textContent=["리비전: "+Je.revision,"정화 단계: "+$s[e]+" ("+e+")","스폰: "+ot.x.toFixed(1)+", "+ot.y.toFixed(1)+" m","맵: 150 × 300 m","카탈로그: "+Wi.length+"종"].join(`
`),Zr?hh(Zr):eo(),n&&o?(Zb(),Ur={from:{...o},to:{...c},toSky:(l==null?void 0:l.sky)??c.sky,t0:performance.now(),dur:1200,swapped:!0},aa(o),zs=o):(Ur=null,aa(c,(l==null?void 0:l.sky)??c.sky),zs={...c},cs(!0)),se().textContent=`정화 단계: ${$s[e]}`}catch(l){Zs=l.message,se().textContent="로드 실패: "+Zs,console.error(l)}finally{i===ml&&(Or=!1)}}async function ya(r){const t=Kr(r);if(!pl){if(t===ri&&Ut&&!Zs){fh(t);return}pl=!0;try{await ph(t,{animate:!0})}finally{pl=!1}}}function bd(r){const t=$o.indexOf(Kr(ri)),e=$o[Math.min($o.length-1,Math.max(0,t+r))];e&&ya(e)}function ha(r){return nh.isTurretKindId(r)}function ua(r){return nh.isUnitFacilityKindId(r)}function lp(){for(rn.visible=!1;rn.children.length;)rn.remove(rn.children[0]);nt.setDropHighlight(null)}function cp(r,t){r.traverse(e=>{const n=e;if(!n.isMesh||!n.material)return;const i=Array.isArray(n.material)?n.material:[n.material];for(const s of i){s.transparent=!0;const o=s;"opacity"in o&&(o.opacity=.45),s.depthWrite=!1,"emissive"in o&&o.emissive&&(o.emissive.setHex(t?2779706:6957610),o.emissiveIntensity=.35)}})}async function jb(r){const t=gl.get(r.id);if(t)return t.clone(!0);const e=r.height_m&&r.height_m>.05?Math.min(4.5,r.height_m):2.2;try{const s=(await(await op).loadAsync(r.url)).scene;s.traverse(h=>{const u=h;u.isMesh&&(u.castShadow=!1,u.receiveShadow=!1)}),s.updateMatrixWorld(!0);const o=new Pe().setFromObject(s),a=o.getSize(new P),l=Math.max(.2,a.y),c=e/l;return s.scale.setScalar(c),s.position.y=-o.min.y*c,gl.set(r.id,s),s.clone(!0)}catch(n){console.warn("catalog ghost load failed",r.url,n);const i=new te(new nr(.7,12,10),new hn({color:8956518,transparent:!0,opacity:.45,depthWrite:!1}));return i.position.y=.7,gl.set(r.id,i),i.clone(!0)}}async function Ar(r){ii=r,to=!0,lp();const t=await jb(r);(ii==null?void 0:ii.id)===r.id&&(cp(t,!0),rn.add(t),rn.visible=!0,se().textContent=`드래그: ${r.id} · 슬롯에 놓으면 설치, 그 외는 자유 프롭`)}function es(){to=!1,ii=null,lp()}function hp(r,t){if(!Ut)return null;pp(r,t),Ys.setFromCamera(la,ve.camera);const e=nt.pickSlot(Ys);if(e){const i=nt.slotWorldPosition(e,rp);if(i)return{point:i.clone(),slotId:e}}const n=Ys.intersectObject(Ut.root,!0);return n.length?{point:n[0].point.clone(),slotId:null}:null}function up(r,t){if(ha(r.id)){const e=nt.pickNearestSlot(t.point,18,"tower")||(t.slotId&&nt.slotKindOf(t.slotId)==="tower"?t.slotId:null);return{slotId:e,ok:!!e}}if(ua(r.id)){const e=nt.pickNearestSlot(t.point,18,"unit")||(t.slotId&&nt.slotKindOf(t.slotId)==="unit"?t.slotId:null);return{slotId:e,ok:!!e}}return t.slotId?{slotId:t.slotId,ok:!1}:{slotId:null,ok:!0}}function mh(r,t){if(!to||!ii)return;const e=hp(r,t);if(!e){nt.setDropHighlight(null),rn.visible=rn.children.length>0;return}const i=up(ii,e);if(i.slotId&&i.ok){const o=nt.slotWorldPosition(i.slotId,rp);o?rn.position.copy(o):rn.position.copy(e.point),nt.setDropHighlight(i.slotId,!0)}else rn.position.copy(e.point),i.slotId&&!i.ok?nt.setDropHighlight(i.slotId,!1):nt.setDropHighlight(null);rn.visible=!0;const s=rn.children[0];s&&cp(s,i.ok||!i.slotId)}async function dp(r,t){var e;try{const i=await(await op).loadAsync(r.url),s=i.scene;s.traverse(m=>{const _=m;_.isMesh&&(_.castShadow=!0,_.receiveShadow=!0)}),s.updateMatrixWorld(!0);const o=new Pe().setFromObject(s),a=o.getSize(new P),l=r.height_m&&r.height_m>.05?Math.min(6,r.height_m):Math.min(3.2,Math.max(.8,a.y||1.5)),c=Math.max(.2,a.y),h=l/c;s.scale.setScalar(h),s.position.copy(t),s.position.y=t.y-o.min.y*h,s.name=`catalog_prop_${r.id}_${En.children.length}`,s.userData.catalogId=r.id,s.userData.catalogSource=r.source,En.add(s);const u=i.animations??[];nt.registerFreePropAnim(s,u),rh.burst(s.position.clone());const d=document.getElementById("unitCatalogInfo");d&&(d.textContent=[`자유 프롭 배치: ${r.name} (${r.id})`,`월드 ${t.x.toFixed(1)}, ${t.y.toFixed(1)}, ${t.z.toFixed(1)}`,r.url,`씬 프롭 ${En.children.length}개`].join(`
`));const f=(e=i.animations)!=null&&e.length?` · 애니 ${i.animations.map(m=>m.name).join(",")}`:"";return se().textContent=`프롭 배치: ${r.id}${f}`,!0}catch(n){return se().textContent="프롭 배치 실패: "+n.message,!1}}async function fp(r,t,e){const n=nt.dropHighlightId;if(n&&nt.dropHighlightOk){const a=nt.slotKindOf(n);if(a==="tower"&&ha(r.id)){const l=nt.installKind(n,r.id,[ot]);return ye(),pn(),se().textContent=l?`DnD 설치: ${r.id} @ ${n}`:`DnD 실패: ${r.id}`,{ok:l,mode:"tower_slot",slotId:n,kind:r.id}}if(a==="unit"&&ua(r.id)){const l=nt.installUnitKind(n,r.id,[ot]);return ye(),pn(),se().textContent=l?`DnD 설치: ${r.id} @ ${n}`:`DnD 실패: ${r.id}`,{ok:l,mode:"unit_slot",slotId:n,kind:r.id}}}const i=hp(t,e);if(!i)return se().textContent="드롭: 히트 없음",{ok:!1,mode:"miss"};const s=up(r,i);if(s.slotId&&ha(r.id)&&nt.slotKindOf(s.slotId)==="tower"){const a=nt.installKind(s.slotId,r.id,[ot]);return ye(),pn(),se().textContent=a?`DnD 설치: ${r.id} @ ${s.slotId}`:`DnD 실패: ${r.id}`,{ok:a,mode:"tower_slot",slotId:s.slotId,kind:r.id}}if(s.slotId&&ua(r.id)&&nt.slotKindOf(s.slotId)==="unit"){const a=nt.installUnitKind(s.slotId,r.id,[ot]);return ye(),pn(),se().textContent=a?`DnD 설치: ${r.id} @ ${s.slotId}`:`DnD 실패: ${r.id}`,{ok:a,mode:"unit_slot",slotId:s.slotId,kind:r.id}}return{ok:await dp(r,i.point),mode:"free_prop",slotId:s.slotId||i.slotId||void 0}}function pp(r,t){const e=ze.domElement.getBoundingClientRect();la.x=(r-e.left)/e.width*2-1,la.y=-((t-e.top)/e.height)*2+1}function Jb(r,t,e){var c;nt.selectSlot(r),ah("build"),ye();const n=document.getElementById("slotPicker");if(!n)return;const i=(c=nt.layout)==null?void 0:c.slots.find(h=>h.id===r),s=document.getElementById("slotPickerTitle");s&&(s.textContent=(i==null?void 0:i.kind)==="unit"?`유닛 시설 ${r}`:`타워 슬롯 ${r}`);const o=document.getElementById("slotPickerHint");o&&(o.textContent=(i==null?void 0:i.kind)==="unit"?"맵 유닛 / 캠프 / 머신 시설 중 하나를 고르세요.":"유닛랩 터렛 5종 중 하나를 고르세요.");const a=document.getElementById("slotPickerKinds");if(a){if(a.replaceChildren(),(i==null?void 0:i.kind)==="tower")for(const h of Pn){const u=document.createElement("button");u.type="button",u.textContent=`${h.label} · ${h.id}`,u.onclick=()=>{jr=h.id,nt.installKind(r,h.id,[ot]),pn(),ye(),se().textContent=`건설: ${h.id} @ ${r}`},a.append(u)}else if((i==null?void 0:i.kind)==="unit")for(const h of Jn){const u=document.createElement("button");u.type="button",u.textContent=`${h.label} · ${h.group}`,u.onclick=()=>{Jr=h.id,nt.installUnitKind(r,h.id,[ot]),pn(),ye(),se().textContent=`건설: ${h.id} @ ${r}`},a.append(u)}}const l=sh.getBoundingClientRect();n.style.display="block",n.style.left=Math.min(l.width-290,Math.max(8,t-l.left+12))+"px",n.style.top=Math.min(l.height-280,Math.max(8,e-l.top+12))+"px"}function pn(){const r=document.getElementById("slotPicker");r&&(r.style.display="none")}function ye(){var o,a;Ma(),Yb();const r=document.getElementById("selectedSlotLabel");if(r){const l=nt.selectedSlotId;if(!l)r.textContent="선택 슬롯: (맵에서 타워/유닛 패드 클릭)";else{const c=nt.kindOn(l),h=(o=nt.layout)==null?void 0:o.slots.find(u=>u.id===l);r.textContent=`선택 슬롯: ${l} (${(h==null?void 0:h.kind)||"?"})${c?` · ${c}`:" · 비어 있음"}`}}const t=document.getElementById("buildInstallSelected"),e=document.getElementById("buildClearSlot"),n=(a=nt.layout)==null?void 0:a.slots.find(l=>l.id===nt.selectedSlotId),i=!!nt.selectedSlotId&&(n==null?void 0:n.kind)==="tower",s=!!nt.selectedSlotId&&(n==null?void 0:n.kind)==="unit";t&&(t.disabled=!(i||s)),e&&(e.disabled=!nt.selectedSlotId),document.querySelectorAll("#turretKindButtons button").forEach(l=>{l.classList.toggle("active",l.dataset.kind===jr),l.disabled=!i&&!!nt.selectedSlotId}),document.querySelectorAll("#unitKindButtons button").forEach(l=>{l.classList.toggle("active",l.dataset.kind===Jr),l.disabled=!s&&!!nt.selectedSlotId})}function Qb(){const r=document.getElementById("turretKindButtons");if(r){r.replaceChildren();for(const t of Pn){const e=document.createElement("button");e.type="button",e.dataset.kind=t.id,e.textContent=`${t.label}
${t.id}`,e.style.whiteSpace="pre-line",e.onclick=()=>{var n;if(jr=t.id,nt.selectedSlotId){const i=(n=nt.layout)==null?void 0:n.slots.find(s=>s.id===nt.selectedSlotId);(i==null?void 0:i.kind)==="tower"&&(nt.installKind(i.id,t.id,[ot]),se().textContent=`건설: ${t.id} @ ${i.id}`)}ye()},r.append(e)}}}function tS(){const r=document.getElementById("unitKindButtons");if(r){r.replaceChildren();for(const t of Jn){const e=document.createElement("button");e.type="button",e.dataset.kind=t.id,e.textContent=`${t.label}
${t.id}`,e.style.whiteSpace="pre-line",e.onclick=()=>{var n;if(Jr=t.id,nt.selectedSlotId){const i=(n=nt.layout)==null?void 0:n.slots.find(s=>s.id===nt.selectedSlotId);(i==null?void 0:i.kind)==="unit"&&(nt.installUnitKind(i.id,t.id,[ot]),se().textContent=`건설: ${t.id} @ ${i.id}`)}ye()},r.append(e)}}}function eS(r,t){if(!Ut)return;pp(r,t),Ys.setFromCamera(la,ve.camera);const e=nt.pickSlot(Ys);if(e&&Qn==="build"){Jb(e,r,t);return}if(e&&Qn==="place"){nt.selectSlot(e),ye(),se().textContent=`배치 모드 · 슬롯 ${e} (카탈로그 DnD로 설치)`;return}const n=Ys.intersectObject(Ut.root,!0);if(!n.length){pn(),Qn==="inspect"&&(kt("objectInfo").textContent="클릭: 히트 없음");return}pn();const i=n[0],s=i.object,o=s.name||"(unnamed)",a=s,l=a.isInstancedMesh?` instance#${i.instanceId}`:"",c=Wi.find(h=>o.toLowerCase().includes(h.id.toLowerCase())||h.id.toLowerCase().includes(o.toLowerCase().replace(/^inst_/,"").split("_")[0]||"___"));c?(hh(c.id),kt("objectInfo").textContent+=`

픽: ${o}${l}
거리 ${i.distance.toFixed(2)} m`):kt("objectInfo").textContent=[`픽 메시: ${o}${l}`,`타입: ${a.isInstancedMesh?"InstancedMesh":"Mesh"}`,`거리: ${i.distance.toFixed(2)} m`,`점: ${i.point.x.toFixed(2)}, ${i.point.y.toFixed(2)}, ${i.point.z.toFixed(2)}`,"(카탈로그 id 매칭 없음 — 목록에서 선택 후 배치)"].join(`
`)}async function nS(){var e;se().textContent="매니페스트 불러오는 중…",Je=await xl("/maps/forest150/manifest.json");const r=await xl(Je.navigation);if(fn=new zi(r),Fr=new JM(r),fn=Fr.nav,ot={...r.spawn},Je.catalog)try{Wi=(await xl(Je.catalog)).items??[],Xb(),eo()}catch(n){console.warn("catalog load failed",n),kt("objectInfo").textContent="카탈로그 로드 실패: "+n.message}no(),Qb(),tS(),ye(),bn.bindUi(),bn.onDragStart=n=>{Ar(n)},bn.onDragEnd=()=>{Ec||es()};try{await bn.load()}catch(n){console.warn("unit catalog load failed",n);const i=document.getElementById("unitCatalogInfo");i&&(i.textContent="유닛 카탈로그 로드 실패: "+n.message)}if(kt("stateSelect").value="purified",fh("purified"),await ph("purified",{animate:!1}),await Nt.load(),Je.construction)try{await nt.load(r,Je.construction),Ma(),wc()}catch(n){console.warn("construction load failed",n);const i=document.getElementById("buildInfo");i&&(i.textContent="건설 로드 실패: "+n.message)}Sn=new kb(an,ve.camera,ze,r,((e=nt.layout)==null?void 0:e.slots)??[],()=>{const n=[Rt.root,Nt.root,nt.root,ls.root,En];return Ut!=null&&Ut.person&&n.push(Ut.person),n},n=>{In.clear(),n?(Nt.stop(),pn(),kt("hint").textContent="디펜스 · 캐릭터 없는 시설 방어 관찰",kt("statusModeLine").textContent="디펜스"):(lh(),cs(!0))}),Ks=!0,se().textContent=Zs||"준비됨 · WASD 달리기 · 1 쌍권총 · 2 바주카 · F 사격";const t=new URLSearchParams(location.search).get("defense");!Rt.key&&!t&&dh(),t&&Sn.enter(),Object.assign(window,{forestPlayDebug:{get player(){return{...ot}},get revision(){return Je.revision},get state(){return ri},get character(){return Rt.key},get pose(){return Rt.pose},get catalogCount(){return Wi.length},get combatPlaying(){return Nt.playing},get combatAlive(){return Nt.mobs.filter(n=>n.alive).length},get buildInstalled(){var n;return((n=nt.defense)==null?void 0:n.buildings.filter(i=>i.built).length)??0},get buildSelected(){return nt.selectedSlotId},get buildKinds(){return Pn.map(n=>n.id)},get buildPlacedKinds(){return nt.towerSlotIds().map(n=>({id:n,kind:nt.kindOn(n)}))},get unitPlacedKinds(){return nt.unitSlotIds().map(n=>({id:n,kind:nt.kindOn(n)}))},get unitKinds(){return Jn.map(n=>n.id)},selectBuildSlot(n){return nt.selectSlot(n),ye(),nt.selectedSlotId},installTurret(n,i){const s=nt.installKind(n,i,[ot]);return ye(),s},installUnit(n,i){const s=nt.installUnitKind(n,i,[ot]);return ye(),s},demoFive(){const n=nt.installDemoFive([ot]);return ye(),n},demoUnits(){const n=nt.installDemoUnits([ot]);return ye(),n},showcaseFive(n,i){nt.showcaseAt({x:n,y:i}),ye()},clearBuild(){nt.clearAll(),ye()},syncNav(){var n;return wc(),{slots:((n=nt.layout)==null?void 0:n.slots.length)??0,canStandPlayer:fn.canStand(ot,.6)}},canStandAt(n,i,s=.65){return fn.canStand({x:n,y:i},s)},findPath(n,i,s,o,a=.65){return fn.findPath({x:n,y:i},{x:s,y:o},a)},segmentClear(n,i,s,o,a=.15){return fn.segmentClear({x:n,y:i},{x:s,y:o},a)},combatPlay(){return Nt.play(),ln(),Nt.playing},combatStop(){return Nt.stop(),ln(),Nt.playing},combatSpawn(){const n=Nt.spawnWave();return Nt.play(),ln(),n},combatFire(){Nt.manualFire(),ln()},get combatMobs(){return Nt.mobs.filter(n=>n.alive).map(n=>({id:n.id,x:n.pos.x,y:n.pos.y,rank:n.rank,lat:n.lat,hp:n.hp}))},setYaw(n){return ve.facing=n,Rc(n),n},get yaw(){return Rt.root.rotation.y},teleport(n,i){return ot={x:n,y:i},Rt.root.position.copy(Fe(n,i,0)),Ut!=null&&Ut.person&&Ut.person.position.copy(Fe(n,i,0)),cs(!0),{...ot}},get petEnabled(){return ls.enabled},get unitCatalogCount(){return bn.entries.length},get unitCatalogSelected(){return bn.selectedId},get placedPropCount(){return En.children.length},async dropCatalog(n,i,s){const o=bn.entries.find(l=>l.id===n);if(!o)return{ok:!1,mode:"missing_entry"};await Ar(o),mh(i,s);const a=await fp(o,i,s);return es(),a},selectUnitCatalog(n){return bn.select(n)},projectSlot(n){const i=nt.slotWorldPosition(n);if(!i)return null;const s=i.clone().project(ve.camera),o=ze.domElement.getBoundingClientRect();return{clientX:o.left+(s.x+1)/2*o.width,clientY:o.top+(-s.y+1)/2*o.height,ndcX:s.x,ndcY:s.y,inView:Math.abs(s.x)<=1.05&&Math.abs(s.y)<=1.05&&s.z<1}},async dropCatalogOnSlot(n,i){const s=bn.entries.find(c=>c.id===n);if(!s)return{ok:!1,mode:"missing_entry"};const o=nt.slotKindOf(i);if(o==="tower"&&ha(s.id)){await Ar(s);const c=nt.installKind(i,s.id,[ot]);return ye(),es(),{ok:c,mode:"tower_slot",slotId:i,kind:s.id}}if(o==="unit"&&ua(s.id)){await Ar(s);const c=nt.installUnitKind(i,s.id,[ot]);return ye(),es(),{ok:c,mode:"unit_slot",slotId:i,kind:s.id}}const a=nt.slotWorldPosition(i);if(!a)return{ok:!1,mode:"no_slot"};await Ar(s);const l=await dp(s,a);return es(),{ok:l,mode:"free_prop",slotId:i}}}})}kt("stateSelect").onchange=()=>{ya(kt("stateSelect").value)};kt("reloadMap").onclick=()=>{ph(kt("stateSelect").value,{animate:!1})};document.querySelectorAll("#purifySteps button, #purifyCompact button").forEach(r=>{r.addEventListener("click",()=>{const t=r.dataset.stage;t&&ya(t)})});kt("resetPlayer").onclick=()=>{!Ks||!fn||(ot={...fn.data.spawn},ve.reset(),Rt.root.position.copy(Fe(ot.x,ot.y,0)),cs(!0))};kt("objectCategory").onchange=()=>eo();kt("objectSearch").oninput=()=>eo();kt("spawnChar").onclick=()=>void dh();kt("clearChar").onclick=()=>Kb();kt("charWho").onchange=()=>no();kt("charBody").onchange=()=>no();kt("animSelect").onchange=()=>{const r=kt("animSelect").value;r&&(Ac(r,/^(shoot|shoot2|throw)$/i.test(r)),kt("charInfo").textContent=`클립: ${r}`+(Rt.key?`
${Yr(Rt.key)}`:""))};let Tc={x:0,y:0};ze.domElement.tabIndex=0;ze.domElement.addEventListener("pointerdown",r=>{if(r.button!==0)return;const t=document.activeElement;t&&t!==ze.domElement&&t.blur(),ze.domElement.focus(),Tc={x:r.clientX,y:r.clientY}});ze.domElement.addEventListener("pointerup",r=>{if(r.button!==0||to||Math.hypot(r.clientX-Tc.x,r.clientY-Tc.y)>6)return;const t=document.getElementById("gamePreview");if(t){const e=t.getBoundingClientRect();if(r.clientX>=e.left&&r.clientX<=e.right&&r.clientY>=e.top&&r.clientY<=e.bottom)return}eS(r.clientX,r.clientY)});const Qr=ze.domElement;Qr.addEventListener("dragenter",r=>{var t;[...((t=r.dataTransfer)==null?void 0:t.types)??[]].some(e=>e==="application/x-forest-unit"||e==="text/plain")&&r.preventDefault()});Qr.addEventListener("dragover",r=>{var t;!ii&&!((t=r.dataTransfer)!=null&&t.types)||(r.preventDefault(),r.dataTransfer&&(r.dataTransfer.dropEffect="copy"),mh(r.clientX,r.clientY))});Qr.addEventListener("dragleave",r=>{r.target===Qr&&nt.setDropHighlight(null)});Qr.addEventListener("drop",r=>{var s,o;r.preventDefault();const t=((s=r.dataTransfer)==null?void 0:s.getData("application/x-forest-unit"))||"";let e=ii;if(t)try{e=JSON.parse(t)}catch{}if(!e){const a=((o=r.dataTransfer)==null?void 0:o.getData("text/plain"))||"";e=bn.entries.find(l=>l.id===a)||null}if(!e){es(),se().textContent="드롭: 카탈로그 항목 없음";return}const n=r.clientX,i=r.clientY;Ec=!0,ii=e,to=!0,mh(n,i),(async()=>{try{await fp(e,n,i)}finally{Ec=!1,es()}})()});function Ac(r,t){Xi=!0,ti=r,Rt.play(r,t),kt("charInfo").textContent=`클립: ${r}`+(Rt.key?`
${Yr(Rt.key)}`:"")}function Sd(r){Nt.setWeapon(r);const t=document.getElementById("combatWeapon"),e=document.getElementById("combatMissile");t&&(t.value=r),e&&(e.value=r),ln()}addEventListener("keydown",r=>{var e;const t=((e=r.target)==null?void 0:e.tagName)??"";t==="INPUT"||t==="TEXTAREA"||t==="SELECT"||(["KeyW","KeyA","KeyS","KeyD","ArrowUp","ArrowDown","ArrowLeft","ArrowRight"].includes(r.code)&&(r.preventDefault(),In.add(r.code)),r.code==="KeyF"&&(r.preventDefault(),Nt.manualFire(),ln()),r.code==="Digit1"||r.code==="Numpad1"?(r.preventDefault(),Sd("pistol")):r.code==="Digit2"||r.code==="Numpad2"?(r.preventDefault(),Sd("bazooka")):r.code==="Digit3"||r.code==="Numpad3"?(r.preventDefault(),ya("purified")):r.code==="BracketLeft"?(r.preventDefault(),bd(-1)):r.code==="BracketRight"&&(r.preventDefault(),bd(1)))});addEventListener("keyup",r=>In.delete(r.code));addEventListener("blur",()=>In.clear());function ln(){const r=document.getElementById("combatInfo");r&&(r.textContent=Nt.infoText)}function Ma(){const r=document.getElementById("buildInfo");r&&(r.textContent=nt.infoText)}function gh(){const r=document.getElementById("petInfo");r&&(r.textContent=ls.infoText)}const wd=document.getElementById("combatPlay"),Ed=document.getElementById("combatStop"),Td=document.getElementById("combatSpawn"),Ad=document.getElementById("combatFire"),Cr=document.getElementById("combatAuto");wd&&wd.addEventListener("click",()=>{Nt.play(),ln()});Ed&&Ed.addEventListener("click",()=>{Nt.stop(),ln()});Td&&Td.addEventListener("click",()=>{Nt.spawnWave(),Nt.play(),ln()});Ad&&Ad.addEventListener("click",()=>{Nt.manualFire(),ln()});Cr&&(Nt.autoHunt=Cr.checked,Cr.onchange=()=>{Nt.autoHunt=Cr.checked,Cr.checked&&Nt.releaseWeaponHold(),ln()});const Hs=document.getElementById("combatWeapon");Hs&&(Hs.value=Nt.weapon,Hs.onchange=()=>{Nt.setWeapon(Hs.value==="bazooka"?"bazooka":"pistol");const r=document.getElementById("combatMissile");r&&(r.value=Nt.missileKind),ln()});const Us=document.getElementById("combatMissile");Us&&(Us.value=Nt.missileKind,Us.onchange=()=>{const r=Us.value==="bazooka"||Us.value==="throw"?Us.value:"pistol";Nt.setMissile(r),Hs&&r!=="throw"&&(Hs.value=r),ln()});const Cd=document.getElementById("buildInstallSelected"),Rd=document.getElementById("buildClearSlot"),Pd=document.getElementById("buildDemoFive"),Id=document.getElementById("buildClear"),Ld=document.getElementById("buildDefenseWave");Cd&&Cd.addEventListener("click",()=>{var e;const r=nt.selectedSlotId;if(!r)return;const t=(e=nt.layout)==null?void 0:e.slots.find(n=>n.id===r);(t==null?void 0:t.kind)==="tower"?(nt.installKind(r,jr,[ot]),se().textContent=`건설: ${jr} @ ${r}`):(t==null?void 0:t.kind)==="unit"&&(nt.installUnitKind(r,Jr,[ot]),se().textContent=`건설: ${Jr} @ ${r}`),pn(),ye()});Rd&&Rd.addEventListener("click",()=>{const r=nt.selectedSlotId;r&&(nt.clearSlot(r),ye())});Pd&&Pd.addEventListener("click",()=>{nt.installDemoFive([ot]),pn(),ye(),se().textContent="건설: 유닛랩 터렛 5종 데모 배치"});const Dd=document.getElementById("buildDemoUnits");Dd&&Dd.addEventListener("click",()=>{nt.installDemoUnits([ot]),pn(),ye(),se().textContent="건설: 유닛 시설 5종 데모 배치"});const Nd=document.getElementById("buildShowcase");Nd&&Nd.addEventListener("click",()=>{const r=Rt.root.rotation.y,t=Math.sin(r),e=-Math.cos(r);nt.showcaseAt({x:ot.x+t*6,y:ot.y+e*6}),ye(),se().textContent="건설: 5종 미리보기"});Id&&Id.addEventListener("click",()=>{nt.clearAll(),pn(),ye()});Ld&&Ld.addEventListener("click",()=>{nt.spawnDefenseWave(),ye()});var Xd;(Xd=document.getElementById("slotPickerClose"))==null||Xd.addEventListener("click",()=>pn());var qd;(qd=document.getElementById("slotPickerClear"))==null||qd.addEventListener("click",()=>{const r=nt.selectedSlotId;r&&nt.clearSlot(r),pn(),ye()});const Ud=document.getElementById("combatSpawnOne"),Fd=document.getElementById("combatClear");Ud&&Ud.addEventListener("click",()=>{const r=Nt.spawnNearPlayer(1);Nt.play(),ln(),se().textContent=`전투: 적 ${r}마리 스폰`});Fd&&Fd.addEventListener("click",()=>{Nt.clearWave(),Nt.stop(),ln()});const Od=document.getElementById("placeObject"),kd=document.getElementById("clearPlacedObjects");Od&&Od.addEventListener("click",()=>{iS()});kd&&kd.addEventListener("click",()=>{for(;En.children.length;){const r=En.children[0];nt.unregisterFreePropAnim(r),En.remove(r)}nt.clearFreePropAnims(),se().textContent="배치 오브젝트 제거",kt("objectInfo").textContent="배치 오브젝트 전부 제거됨"});async function iS(){const r=Wi.find(e=>e.id===Zr);if(!r){kt("objectInfo").textContent="카탈로그에서 오브젝트를 먼저 선택하세요.";return}const t=r.variants[ri]??Object.values(r.variants)[0];if(!t){kt("objectInfo").textContent="이 항목에 GLB 경로가 없습니다.";return}se().textContent=`오브젝트 배치 중: ${r.id}`;try{const{GLTFLoader:e}=await $d(async()=>{const{GLTFLoader:s}=await Promise.resolve().then(()=>Yf);return{GLTFLoader:s}},void 0),i=(await new e().loadAsync(t)).scene;i.traverse(s=>{const o=s;o.isMesh&&(o.castShadow=!0,o.receiveShadow=!0)}),i.position.copy(Fe(ot.x,ot.y,0)),i.name=`placed_${r.id}_${En.children.length}`,En.add(i),kt("objectInfo").textContent=[`배치: ${r.name} (${r.id})`,`위치 ${ot.x.toFixed(1)}, ${ot.y.toFixed(1)} m`,t,`씬 자식 ${En.children.length}개`].join(`
`),se().textContent=`오브젝트 배치: ${r.id}`}catch(e){kt("objectInfo").textContent="배치 실패: "+e.message,se().textContent="오브젝트 배치 실패"}}const Bd=document.getElementById("petSpawn"),zd=document.getElementById("petClear");Bd&&Bd.addEventListener("click",()=>{ls.spawn({x:ot.x-1.2,y:ot.y-1.2}).then(()=>{gh(),se().textContent="BCAT02 펫 스폰"}).catch(r=>{const t=document.getElementById("petInfo");t&&(t.textContent="펫 실패: "+r.message)})});zd&&zd.addEventListener("click",()=>{ls.despawn(),gh()});const yl=kt("autoLocomotion");yl&&(yl.onchange=()=>{yl.checked?(Xi=!1,ti=""):Rt.current&&(Xi=!0,ti=Rt.current)});function Hd(r,t=!1){const e=kt("autoLocomotion").checked;if(r&&e&&(Xi=!1,ti=""),Xi){!Nt.gearBusy&&ti&&Rt.current!==ti&&Rt.play(ti,/^(shoot|shoot2|throw)$/i.test(ti));return}!e||Nt.gearBusy||(Nt.attacking&&r?Rt.syncBody("attack",Nt.moveAttackClip()):r||t?Rt.syncBody("run"):Nt.attacking||Rt.syncBody("still"))}const sS=Math.PI/.1;let mp=ve.facing;function Cc(r,t){const e=Math.PI*2;return((t-r+Math.PI)%e+e)%e-Math.PI}function ko(r,t,e,n=sS){const i=Cc(r,t),s=n*e;return Math.abs(i)<=s?r+i:r+Math.sign(i)*s}function Vd(r,t){return Math.atan2(r,-t)}function Gd(){return Rt.key?Rt.root.rotation.y:Ut!=null&&Ut.person?Ut.person.rotation.y:null}function Rc(r){Rt.root.rotation.y=r,Ut!=null&&Ut.person&&(Ut.person.rotation.y=r),mp=r}function rS(){const r=ve.groundForward(),t=r.x,e=r.y,n=e,i=-t,s=Number(In.has("KeyW")||In.has("ArrowUp"))-Number(In.has("KeyS")||In.has("ArrowDown")),o=Number(In.has("KeyD")||In.has("ArrowRight"))-Number(In.has("KeyA")||In.has("ArrowLeft"));return{x:t*s+n*o,y:e*s+i*o}}function Ml(){const r=ve.mode==="follow",t=document.getElementById("camModeFollow"),e=document.getElementById("camModeQuarter");t==null||t.classList.toggle("active",r),e==null||e.classList.toggle("active",!r),t==null||t.setAttribute("aria-pressed",r?"true":"false"),e==null||e.setAttribute("aria-pressed",r?"false":"true")}function oS(){var r,t;(r=document.getElementById("camModeFollow"))==null||r.addEventListener("click",()=>{ve.setMode("follow"),Ml()}),(t=document.getElementById("camModeQuarter"))==null||t.addEventListener("click",()=>{ve.setMode("quarter"),Ml()}),Ml()}const aS=new Xg;let bl=0,Bo=0,Wd=0,Sl=0;function gp(){requestAnimationFrame(gp);const r=aS.getDelta(),t=Math.min(r,.05);oh();const e=ze.domElement,n=e.clientWidth/Math.max(1,e.clientHeight);if(Ks&&Ut&&!Or&&(Sn!=null&&Sn.active))Sn.tick(r,n),cs(),Ut.tick(t,ve.camera.position),Ut.updateVisibility(ve.camera.position),Md(),an.fog=Sc;else if(Ks&&Ut&&!Or&&fn){const o={...ot};let a=ve.facing;const l=Gd();l!=null&&Math.abs(Cc(mp,l))>.001&&(a=l);const c=rS(),h=Math.hypot(c.x,c.y),u=h>0;if(u){ve.mode!=="follow"&&(a=ko(a,Vd(c.x,c.y),t));const E=Nt.footMps;ot=fn.move(ot,{x:ot.x+c.x/h*E*t,y:ot.y+c.y/h*E*t},.6)}const d=Math.hypot(ot.x-o.x,ot.y-o.y)>.001;ve.facing=a,Rc(a),Rt.key?(Rt.root.position.copy(Fe(ot.x,ot.y,0)),Hd(d||u),Rt.tick(t)):Ut.person&&Ut.person.position.copy(Fe(ot.x,ot.y,0));const f={...ot};Nt.stepping=u,Nt.clipHeld=Xi,Nt.tick(t);const m=document.getElementById("combatWeapon"),_=document.getElementById("combatMissile");if(m&&Nt.autoHunt&&Nt.missileKind!=="throw"){const E=Nt.weapon==="bazooka"?"bazooka":"pistol";m.value!==E&&(m.value=E)}_&&_.value!==Nt.missileKind&&(_.value=Nt.missileKind);const g=Math.hypot(ot.x-f.x,ot.y-f.y)>.001,p=Nt.aimYaw();if(!u)if(p!=null)a=ko(a,p,t);else if(g)a=ko(a,Vd(ot.x-f.x,ot.y-f.y),t);else{const E=Gd();E!=null&&(a=ko(a,E,t))}ve.facing=a,Rc(a);const b=p!=null&&Math.abs(Cc(a,p))>.12;if(Rt.key&&(Rt.root.position.copy(Fe(ot.x,ot.y,0)),Hd(g||u||b)),ve.update(ot.x,ot.y,t,n),Tr.update(ot.x,ot.y,ot.x-o.x,ot.y-o.y,t),nt.tick(t),ls.tick(t,ot,fn,d||u),Rt.key?Rt.root.position.copy(Fe(ot.x,ot.y,0)):Ut.person&&Ut.person.position.copy(Fe(ot.x,ot.y,0)),cs(),Ut.tick(t,ve.camera.position),Ut.updateVisibility(ve.camera.position),Md(),an.fog=Sc,Sl+=t,Sl>.4){Sl=0;const E=Rt.key?` · ${Rt.key}`:"",y=Nt.playing?` · hunt ${Nt.mobs.filter(w=>w.alive).length}`:"",S=ls.enabled?" · pet":"";se().textContent=Zs||`${Je.revision} · ${$s[Kr(ri)]} · ${Wd} FPS · ${ot.x.toFixed(1)}, ${ot.y.toFixed(1)}m${E}${y}${S}`,ln(),Ma(),gh(),lh()}}else ve.update(ot.x,ot.y,t,n),Tr.update(ot.x,ot.y,0,0,t),Rt.tick(t);bl++,Bo+=r,Bo>=1&&(Wd=Math.round(bl/Bo),bl=0,Bo=0),bn.tick(t),rh.tick(t),ze.render(an,ve.camera),Ks&&Ut&&!Or&&!(Sn!=null&&Sn.active)&&(Ut.updateVisibility(Tr.camera.position),Tr.render(ze,an),Ut.updateVisibility(ve.camera.position));const i=Tr.element.getBoundingClientRect(),s=document.getElementById("previewAspect");s&&i.height>0&&(s.textContent=i.width.toFixed(0)+"x"+i.height.toFixed(0)+" @ "+(i.width/i.height).toFixed(3))}gp();nS().catch(r=>{se().textContent="실패: "+r.message,console.error(r)});
