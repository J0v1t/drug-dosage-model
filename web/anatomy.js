// Schematic pixel cutaway. Uniform concentration tint + gut-to-system pulses.

const skin='#dcb498',light='#efd1ac',shade='#b98274',outline='#493d40';
function box(x,y,w,h,c){b.fillStyle=c;b.fillRect(x,y,w,h)}
function pixelShape(points,fill,stroke=outline){b.beginPath();points.forEach(([x,y],i)=>i?b.lineTo(x,y):b.moveTo(x,y));b.closePath();b.fillStyle=fill;b.fill();if(stroke){b.lineWidth=1;b.strokeStyle=stroke;b.stroke()}}
function organ(points,fill){pixelShape(points,fill);}
function paintAnatomy(){
 body.width=144;body.height=224;b.clearRect(0,0,144,224);
 const shell=new Path2D();
 // A tapered human outline with a narrower waist, stepped shoulders and relaxed arms.
 const contour=[[62,8],[81,8],[86,12],[89,18],[89,34],[85,41],[80,44],[80,50],[90,52],[98,57],[105,64],[109,82],[112,105],[117,133],[116,145],[109,148],[104,144],[102,123],[99,105],[96,92],[92,100],[92,121],[96,140],[95,162],[92,181],[92,196],[101,201],[101,207],[78,207],[77,198],[77,176],[74,158],[72,148],[69,158],[66,178],[66,198],[67,207],[44,207],[44,201],[53,196],[53,179],[50,162],[49,141],[53,122],[53,101],[49,93],[45,106],[41,124],[40,143],[35,148],[29,145],[28,134],[33,106],[36,84],[39,65],[46,58],[54,53],[64,50],[64,44],[59,41],[55,34],[55,18],[58,12]];
 contour.forEach(([x,y],i)=>i?shell.lineTo(x,y):shell.moveTo(x,y));shell.closePath();
 b.fillStyle=skin;b.fill(shell);b.strokeStyle=outline;b.lineWidth=1;b.stroke(shell);
 b.save();b.clip(shell);
 // Skin depth, stepped joints and highlights.
 box(37,68,4,35,light);box(31,113,4,27,light);box(106,68,3,37,shade);box(111,112,4,29,shade);
 box(52,145,4,49,light);box(63,145,5,49,shade);box(79,145,4,49,light);box(90,145,5,49,shade);
 box(46,201,21,3,light);box(79,201,20,3,shade);box(32,142,8,3,shade);box(106,142,8,3,shade);
 // Original small head cutaway and soft facial features, inspired by pixel anatomy references.
 box(57,18,4,15,light);box(84,18,4,17,shade);box(62,41,19,5,shade);
 organ([[62,15],[66,12],[78,12],[83,16],[85,24],[81,28],[62,28],[59,24],[59,19]],'#df8894');
 box(62,18,5,2,'#f6b8b7');box(68,15,2,7,'#b96786');box(75,18,8,2,'#b96786');box(72,23,7,2,'#b96786');box(63,24,4,2,'#f6b8b7');
 box(64,32,2,2,outline);box(79,32,2,2,outline);box(70,38,6,1,outline);
 // Thoracic/abdominal cutaway, with separate organs drawn as a readable schematic.
 pixelShape([[53,55],[91,55],[94,65],[92,131],[86,139],[57,139],[51,130],[50,65]],'#785354');
 box(54,59,35,73,'#a46c65');box(58,61,28,65,'#be8275');
 // Vertebral column and clavicles, behind organs.
 for(let y=59;y<130;y+=5)box(71,y,3,3,'#ecd0a5');
 box(55,55,12,2,'#efd8b8');box(78,55,11,2,'#efd8b8');
 // Lungs: stepped silhouette, bronchi and shading.
 organ([[60,61],[66,61],[69,68],[69,85],[65,90],[55,89],[54,83],[55,70]],'#e78e91');
 organ([[78,61],[84,63],[89,73],[89,87],[83,91],[76,86],[76,68]],'#d57583');
 box(56,76,2,10,'#ffc3b1');box(85,74,2,13,'#b95772');
 box(71,53,3,18,'#e6c7ac');box(65,68,7,2,'#c0877d');box(74,68,8,2,'#bd827b');
 // Heart, central vessels and liver.
 organ([[70,75],[73,73],[76,76],[79,76],[80,81],[75,89],[70,85],[68,80]],'#b9485b');box(72,77,3,3,'#f47a7c');
 organ([[55,92],[69,90],[77,94],[76,100],[66,104],[55,101]],'#925858');box(57,93,10,2,'#b77468');
 // Stomach and short intestinal connection.
 organ([[82,91],[86,94],[86,103],[82,108],[75,107],[73,103],[75,99],[79,99],[79,92]],'#e79087');
 box(81,93,2,8,'#f1c19b');box(75,108,3,5,'#d7a47f');
 // Kidney hints, pelvis and neatly folded intestine.
 box(54,106,4,8,'#965a65');box(87,106,4,8,'#965a65');
 // Segmented pink colon frames independent small-intestine folds.
 pixelShape([[57,109],[60,108],[66,110],[76,110],[82,108],[86,108],[88,111],[87,115],[88,119],[87,123],[88,128],[86,133],[82,136],[76,136],[73,142],[70,140],[70,135],[63,135],[58,133],[55,130],[55,116]],'#b35d76');
 pixelShape([[58,111],[61,110],[66,112],[76,112],[82,110],[85,110],[86,112],[85,117],[86,122],[85,128],[83,132],[78,134],[74,133],[72,139],[72,133],[64,133],[59,131],[57,128],[57,116]],'#ef9fa7',null);
 pixelShape([[62,116],[68,117],[76,116],[82,115],[82,129],[76,132],[64,130],[61,127]],'#d37d96',null);
 function coil(points,color,width){b.beginPath();points.forEach(([x,y],i)=>i?b.lineTo(x,y):b.moveTo(x,y));b.strokeStyle=color;b.lineWidth=width;b.lineJoin='round';b.lineCap='round';b.stroke()}
 const folds=[[[63,118],[67,119],[73,118],[79,118],[80,120],[77,122],[69,121],[65,122]],[[64,124],[67,123],[72,124],[76,125],[80,124]],[[64,127],[68,129],[73,127],[77,129],[80,127]]];
 for(const line of folds){coil(line,'#a85370',4);coil(line,'#ffc0b8',2)}
 // Outer haustra and highlights, with an open lower outlet rather than a spiral.
 for(const [x,y] of [[59,112],[64,113],[70,113],[76,113],[82,112],[59,118],[59,123],[59,128],[84,117],[84,123],[83,129],[79,132],[65,131]]){box(x,y,2,2,'#ffcdc1');box(x-1,y+2,2,1,'#cc7d90')}
 box(72,135,2,4,'#e995a2');
 // Pixel vessels, lung branches, intestinal folds and organ highlights.
 box(73,72,2,7,'#963e56');box(75,73,5,2,'#e9a266');box(69,74,2,4,'#5597a0');
 for(const [x,y] of [[60,70],[63,74],[60,81],[81,69],[83,77],[79,84]]){box(x,y,3,1,'#f4b5ad');box(x+1,y+1,1,2,'#b95b77')}
 box(78,96,2,7,'#ffc2a7');box(59,94,10,1,'#d18578');
 // Small pixel rib edges maintain a cutaway feel without covering the organs.
 for(let y=67;y<89;y+=7){box(52,y,3,2,'#e9c8a5');box(89,y,3,2,'#d6b18f')}
 b.restore();
 return shell;
}
function drawBody(phase=0){
 const shell=paintAnatomy();
 const c=concentration(s.time);
 // Fixed visual scale: equal concentrations have equal intensity across scenarios.
 const intensity=.52*(1-Math.exp(-c/3));
 b.save();b.clip(shell);
 // Rose concentration tint complements the warm palette; its intensity follows C.
 b.fillStyle=`rgba(218,117,146,${intensity})`;b.fillRect(0,0,144,224);
 const gut=sampleAt(s.time).gut;
 const flow=s.bio/100*s.ka*gut;
 b.restore();
 if(flow>.01&&s.time>0){
  // Unidirectional amber transfer from gut into the shared central system.
  const path=[[81,103],[78,101],[76,97],[74,93],[73,89],[73,84]];
  const clock=reduced?0:playing?phase:s.time*.65;
  const head=Math.floor(clock*9)%path.length;
  for(let trail=2;trail>=0;trail--){const [x,y]=path[(head-trail+path.length)%path.length];b.globalAlpha=1-trail*.22;box(x-1,y-1,6,6,'#805231');box(x,y,4,4,'#ffdf48');if(trail===0)box(x+1,y,2,2,'#fff9cc')}b.globalAlpha=1;
 }

};
