/**
 * The tiny script that runs before first paint.
 *
 * The client picker caches both the chosen theme *and* the computed CSS
 * variables in localStorage. Applying the cached variables here means a
 * returning visitor never sees the studio default flash past before their own
 * colour lands. Pure string — importable from a server component.
 */
export const THEME_BOOTSTRAP = `(function(){try{var raw=localStorage.getItem("nso:theme:v12");if(!raw)return;var d=JSON.parse(raw);if(!d||d.v!==12||!d.vars)return;var r=document.documentElement;for(var k in d.vars){if(k.slice(0,2)==="--"&&typeof d.vars[k]==="string")r.style.setProperty(k,d.vars[k]);}}catch(e){}})();`;
