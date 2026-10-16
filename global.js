console.log('IT’S ALIVE!');


function $$(selector, context = document) {
  return Array.from(context.querySelectorAll(selector));
}


// ////Step 2:
// //Step 2.1:  Get an Array of All Nav Links Into a Variable
// let navLinks = $$("nav a");

// //Step 2.3: Find the Link to the Current Page

// let currentLink = navLinks.find(
//     (a) => a.host === location.host && a.pathname === location.pathname,
// );

// //Step 2.3: Add the current Class to the Current Page Link
// /* ? is a optional chaining operator, if currentLink exists, add the class; 
// if no matching link was found, skip the operation instead of throwing an error*/
// currentLink?.classList.add('current');

////Step3: Automatic Navigation Menu
// Step 3.1: Adding the Navigation Menu
let pages = [
  { url: '', title: 'Home' },
  { url: 'projects/', title: 'Projects' },
  { url: 'contact/', title: 'Contact'},
  { url: 'resume/', title: 'Resume'},
  { url: 'https://github.com/Safia-SFU', title: 'GitHub' },
];

//Create navigation menu:
let nav = document.createElement('nav');
document.body.prepend(nav);

// Determine the website's base path
const BASE_PATH =
  location.hostname === 'localhost' || location.hostname === '127.0.0.1'
    ? '/' // Local server
    : '/portfolio/'; // GitHub Pages repo name

//Create links and highlight the current page:
for (let p of pages) {
  let url = p.url;
  let title = p.title;
  // next step: create link and add it to nav
  url = !url.startsWith('http') ? BASE_PATH + url : url;

  let a = document.createElement('a');
  a.href = url;
  a.textContent = title;
  nav.append(a);
  //highlight the current page:
  if (a.host === location.host && a.pathname === location.pathname) {
  a.classList.add('current');}
  //open GitHib link in a new tab
  if (a.host !== location.host) {a.target = '_blank';}
}


// Step 4.2: Adding HTML for the Dark Mode Switch
document.body.insertAdjacentHTML(
  'afterbegin',
  `
	<label class="color-scheme">
		Theme:
		<select>
			<option value = "light dark">Automatic</option>
      <option value = "light">Light</option>
      <option value = "dark">Dark</option>
		</select>
	</label>`,
);

//Step 4.4 & 4.5:: Making the Theme button work and Saving the User’s Preference
let select = document.querySelector('select');
select.addEventListener('input', function (event) {
  document.documentElement.style.setProperty('color-scheme', event.target.value);
  localStorage.colorScheme = event.target.value;
});

if ('colorScheme' in localStorage) {
  document.documentElement.style.setProperty('color-scheme', localStorage.colorScheme);
  select.value = localStorage.colorScheme;
}

//Step 5: Better Contact Form
let form = document.querySelector('form');

form?.addEventListener('submit', function (event) {
  event.preventDefault();

  let data = new FormData(form);
  let url = form.action + '?';
  
  for (let [name, value] of data) {
  url += (url.endsWith('?') ? '' : '&') + name + 
  '=' + encodeURIComponent(value);
  }
  location.href = url;
});





