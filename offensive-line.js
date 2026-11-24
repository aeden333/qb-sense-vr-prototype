(function(){
var canvas=document.getElementById('c');
if(!canvas)return;
var ctx=canvas.getContext('2d');
function drawOL(){
try{
if(typeof phase==='undefined'||typeof st==='undefined'||typeof LOSY==='undefined'||typeof QBX==='undefined'||typeof QBY==='undefined')return;
if(phase!=='read')return;
var now=Date.now()-st.t0;
var progress=Math.max(0,Math.min(1,now/st.press));
var olY=QBY-34;
var offsets=[-120,-60,0,60,120];
var labels=['LT','LG','C','RG','RT'];
var blitzSide=st.extra>0?(st.bx&&st.bx[0]<QBX?-1:1):0;
ctx.save();
ctx.strokeStyle='rgba(37,99,235,.45)';
ctx.lineWidth=3;
ctx.beginPath();
ctx.arc(QBX,QBY-10,100,Math.PI*1.12,Math.PI*1.88);
ctx.stroke();
for(var i=0;i<5;i++){
var x=QBX+offsets[i];
var y=olY+progress*16;
var beaten=(blitzSide===1&&i>=3)||(blitzSide===-1&&i<=1);
if(beaten){x+=blitzSide*progress*24;y+=progress*10}
ctx.fillStyle=(progress>0.82)?'#B91C1C':'#2563EB';
ctx.beginPath();ctx.arc(x,y,13,0,Math.PI*2);ctx.fill();
ctx.fillStyle='#fff';ctx.font='bold 10px sans-serif';ctx.textAlign='center';
ctx.fillText(labels[i],x,y+4);
}
ctx.restore();
}catch(e){}
}
function loop(){drawOL();requestAnimationFrame(loop)}
loop();
})();