/* Optional native verification. Run in a disposable AE project.
   Creates 12 compositions, each with 10 YUGraphic text fixtures. */
(function(){
 var root=File($.fileName).parent.parent;
 $.evalFile(File(root.fsName+'/jsx/presets-data.jsx'));$.evalFile(File(root.fsName+'/jsx/yu-text.jsx'));$.evalFile(File(root.fsName+'/jsx/hostscript.jsx'));$.evalFile(File(root.fsName+'/vendor/yu-text-motion/core.js'));
 var project=app.project||app.newProject(),folder=project.items.addFolder('YU MotionAstra Validation'),report=[],failures=0,c,l,p,i,j;
 project.expressionEngine='javascript-1.0';
 function scan(g,t){for(var k=1;k<=g.numProperties;k++){var q=g.property(k);if(q.canSetExpression&&q.expression){q.valueAtTime(t,false);if(q.expressionError)throw Error(q.expressionError);}else if(q.numProperties)scan(q,t);}}
 for(i=0;i<YTMCore.presets.length;i++){
  p=YTMCore.presets[i];if(i%10===0){c=project.items.addComp('YU '+p.category,1920,1080,1,8,30);c.parentFolder=folder;}c.openInViewer();
  for(j=1;j<=c.numLayers;j++)c.layer(j).selected=false;
  l=c.layers.addText('YU MOTION');l.name=p.name;l.inPoint=1.5;l.outPoint=7;l.selected=true;l.property('ADBE Transform Group').property('ADBE Position').setValue([960,540]);c.time=1.8;
  var opt='{"mode":"BOTH","duration":'+p.duration+',"stagger":'+p.stagger+',"intensity":100,"seed":1,"group":"'+p.group+'","order":"'+p.order+'","easing":"preset","placement":"edges"}';
  try{var result=eval('('+MotionAstra.dispatch(encodeURIComponent('{"action":"yuText","operation":"apply","id":'+p.id+',"options":'+opt+'}'))+')');if(!result.ok||result.changed!==1)throw Error(result.message);for(j=0;j<5;j++)scan(l,[1.5,1.8,3,6.5,7][j]);report.push('PASS '+p.name);}catch(e){failures++;report.push('FAIL '+p.name+': '+e);}
  l.enabled=false;
 }
 report.push('Failures: '+failures+'. Enable one fixture layer at a time and RAM-preview; expression checks do not prove visual fidelity.');
 var file=File.saveDialog('Save YU validation report','*.txt');if(file&&file.open('w')){file.encoding='UTF-8';file.write(report.join('\n'));file.close();}alert(report[report.length-1]);
}());
