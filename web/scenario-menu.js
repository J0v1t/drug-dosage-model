/* Floating scenario navigation; retain the select as the model interface. */
document.addEventListener('DOMContentLoaded',()=>{
 const native=$('scenario'),picker=native.parentElement;
 native.hidden=true;
 const nav=document.createElement('nav');nav.className='scenario-nav';nav.setAttribute('aria-label','Drug scenario');picker.append(nav);
 function sync(){
  const focused=nav.contains(document.activeElement)?document.activeElement.dataset.value:null;
  nav.replaceChildren();
  for(const option of native.options){
   if(option.hidden)continue;
   const button=document.createElement('button');button.type='button';button.dataset.value=option.value;button.textContent=option.textContent;button.setAttribute('aria-pressed',String(option.selected));
   button.onclick=()=>{if(native.value===option.value)return;native.value=option.value;native.dispatchEvent(new Event('change',{bubbles:true}));sync()};
   button.onkeydown=e=>{const buttons=[...nav.children],index=buttons.indexOf(button);let next;if(e.key==='ArrowRight')next=(index+1)%buttons.length;else if(e.key==='ArrowLeft')next=(index-1+buttons.length)%buttons.length;else if(e.key==='Home')next=0;else if(e.key==='End')next=buttons.length-1;else return;e.preventDefault();buttons[next].focus()};
   nav.append(button);
  }
  if(focused)nav.querySelector('[data-value="'+focused+'"]')?.focus({preventScroll:true});
 }
 native.addEventListener('scenario-sync',sync);native.addEventListener('change',sync);sync();
});
