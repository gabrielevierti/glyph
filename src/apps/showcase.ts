import { chip, compactToggle, checkBox, radioButton, sliderTrack, stepper, compactTabs, notificationToast, spinner, skeleton, countBadge, gray as G, type as T, section, progressBar, metric, sparkline, pageDots } from '../glyph/index.js';
import type { Screen, RenderContext, Rect } from '../glyph/index.js';

const rect = (x:number,y:number,width:number,height:number):Rect => ({x,y,width,height});
const header = (g:RenderContext['g'], title:string, sub:string) => {
  g.text(title, 22, 22, T.title, G.max, 'left', 'middle');
  g.text(sub, 554, 22, T.micro, G.secondary, 'right', 'middle');
  g.hline(22,554,38,G.hairline);
};
const footer = (ctx:RenderContext, label:string) => {
  ctx.g.hline(22,554,267,G.hairline);
  ctx.g.text(label,22,277,T.micro,G.tertiary,'left','middle');
  pageDots(ctx.g, 505,277,ctx.app.screens.length,ctx.app.screenIndex);
};
export const showcaseControls:Screen = {
 name:'UI Kit · Controls',animated:true,
 render(ctx){const {g,now}=ctx; const t=now/1000;header(g,'GLYPH / UI KIT','01   CONTROLS');
 section(g,rect(18,48,260,206),'Inputs',{icon:'sliders'});
 chip(g,rect(32,84,70,22),'ACTIVE',{selected:true}); chip(g,rect(109,84,68,22),'READY');chip(g,rect(184,84,75,22),'OFFLINE');
 compactToggle(g,rect(33,123,39,19),Math.sin(t)>0);g.text('Toggle',82,132,T.caption,G.secondary,'left','middle');
 checkBox(g,rect(167,120,22,22),true);g.text('Checked',196,132,T.caption,G.secondary,'left','middle');
 radioButton(g,rect(34,157,19,19),true);radioButton(g,rect(59,157,19,19),false);
 g.text('Radio group',89,167,T.caption,G.secondary,'left','middle');
 sliderTrack(g,rect(35,197,214,18),.5+.35*Math.sin(t*.7),{steps:6});
 section(g,rect(288,48,270,206),'Navigation & feedback',{icon:'layers'});
 compactTabs(g,rect(304,86,236,27),['HOME','DATA','TOOLS'],Math.floor(t/3)%3);
 stepper(g,rect(316,128,213,18),5,Math.floor(t/2)%5);
 notificationToast(g,rect(304,161,236,43),'Sync completed','Updated just now');
 countBadge(g,rect(305,217,38,21),12);spinner(g,rect(368,213,27,27),(t%1));
 skeleton(g,rect(422,215,111,25),2);
 footer(ctx,'WAVEGUIDE-FIRST · OUTLINE SURFACES');
 }
};
export const showcaseDashboard:Screen = {
 name:'UI Kit · Dashboard',animated:true,
 render(ctx){const {g,now}=ctx;const t=now/1000;header(g,'MISSION CONTROL','02   DASHBOARD');
 section(g,rect(18,48,262,207),'System overview',{icon:'layers'});
 metric(g,rect(36,88,106,69),'98.6',{unit:'%',label:'UPTIME'});
 metric(g,rect(160,88,96,69),'24',{label:'DEVICES'});
 g.text('STORAGE',36,169,T.micro,G.tertiary,'left','middle');
 progressBar(g,rect(36,180,217,9),.63);
 g.text('63% USED',253,199,T.micro,G.secondary,'right','middle');
 chip(g,rect(36,218,91,20),'ALL ONLINE',{selected:true});
 section(g,rect(290,48,268,207),'Live telemetry',{icon:'activity'});
 g.text('LATENCY',308,91,T.micro,G.tertiary,'left','middle');
 g.text(`${Math.round(18+4*Math.sin(t))} ms`,535,91,T.bodyStrong,G.max,'right','middle');
 const values=Array.from({length:36},(_,i)=>18+Math.sin(i*.48+t*.7)*8+Math.cos(i*.19)*4);
 sparkline(g,rect(310,105,220,66),values,{gray:G.max});
 g.hline(308,536,182,G.hairline);
 g.text('FRAME BUDGET',308,201,T.micro,G.secondary,'left','middle');
 g.text('16.7 ms',535,201,T.caption,G.max,'right','middle');
 sliderTrack(g,rect(308,224,225,18),.72);
 footer(ctx,'LIVE TELEMETRY · DEMONSTRATION DATA');
 }
};
export const showcaseStates:Screen = {
 name:'UI Kit · States',animated:true,
 render(ctx){const {g,now}=ctx;const t=now/1000;header(g,'COMPONENT STATES','03   STATES');
 section(g,rect(18,48,540,206),'Feedback and progress',{icon:'check-circle'});
 g.text('INITIALIZING',37,92,T.label,G.secondary,'left','middle');
 spinner(g,rect(172,80,31,31),t%1);
 skeleton(g,rect(236,79,290,32),3);
 g.hline(36,538,127,G.hairline);
 g.text('WORKFLOW',37,148,T.label,G.secondary,'left','middle');
 stepper(g,rect(178,137,342,21),6,Math.floor(t/2)%6);
 g.text('PREFERENCES',37,189,T.label,G.secondary,'left','middle');
 compactToggle(g,rect(174,177,39,19),true);
 checkBox(g,rect(245,177,20,20),true);
 radioButton(g,rect(299,177,20,20),false);
 chip(g,rect(356,175,160,25),'LOW INK MODE',{selected:true});
 notificationToast(g,rect(37,216,481,28),'Components designed for a 576 x 288 Gray4 display');
 footer(ctx,'NO EXTERNAL IMAGE ASSETS REQUIRED');
 }
};
