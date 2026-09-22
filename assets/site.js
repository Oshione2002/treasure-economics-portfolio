function initMenu(){
  const nav=document.querySelector('.nav-shell');
  const button=document.querySelector('.menu-toggle');
  if(!nav||!button)return;
  button.addEventListener('click',()=>{
    const open=nav.classList.toggle('open');
    button.setAttribute('aria-expanded',String(open));
  });
}

function initContactForm(){
  const form=document.querySelector('[data-contact-form]');
  if(!form)return;
  form.addEventListener('submit',event=>{
    event.preventDefault();
    const data=new FormData(form);
    const subject=data.get('projectType')||'Research enquiry';
    const body=`Name: ${data.get('name')||''}\nEmail: ${data.get('email')||''}\n\n${data.get('message')||''}`;
    location.href=`mailto:talelume@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  });
}

document.addEventListener('DOMContentLoaded',()=>{
  initMenu();
  initContactForm();
});
