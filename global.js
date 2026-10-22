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
  //open GitHub link in a new tab
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

export async function fetchJSON(url) {
  try {
    // Fetch the JSON file from the given URL
    const response = await fetch(url); //fetch(url) requests the file at the URL you provide
    //inspect the response object
    console.log(response);
    //handling errors
    if (!response.ok) {
      throw new Error(`Failed to fetch projects: ${response.statusText}`);}
      
    // parsing data
    const data = await response.json();
    return data;

  } catch (error) {
    console.error('Error fetching or parsing JSON data:', error);
  }
}

export async function fetchGitHubData(username) {
  return fetchJSON(`https://api.github.com/users/${username}`);
}

export function renderProjects(projects, containerElement, headingLevel = 'h2') {
  // Clearing existing content:
  containerElement.innerHTML = '';
  // Creating an <article> Element for each project using a loop
  for (const project of projects) {
    const article = document.createElement('article');
    //Defining the Content Dynamically
    article.innerHTML = `
    <${headingLevel}>${project.title}</${headingLevel}>
    <img src="${project.image}" alt="${project.title}">
    <p>${project.description}</p>`;
    //Appending the Article
    containerElement.appendChild(article);

  }
  
}



//####Challenge####
//##What type of data should the project parameter contain?
//// array
//##How would you test if the containerElement is valid?

//####Think about it:####
//##Why is it important to clear the container before adding new elements?
////This removes the existing content before rendering the projects again. 
//##What would happen if you skipped this step?
////Calling the function repeatedly could duplicate all the project articles.

//####Think about it:####
//##Why do we use createElement instead of directly appending HTML?
////It lets us create DOM elements programmatically and build the page from data.
//##How does using createElement make your code more secure or modular?
////

//####Think about it:####
//##What happens if one of the properties, like project.image, is missing?
////The corresponding content may be empty or incorrect.
//##How can you handle missing or invalid data gracefully?
////We could supply fallback values, such as "Untitled project"

//####Check Your Understanding####
//##What happens if containerElement is null?
////The function will throw an error when it tries to access innerHTML
//##How can you make the function robust against missing or incorrect parameters?
////We could check that the container exists before using it.

//####Challenge####
//##What happens if you pass an invalid headingLevel (e.g., a non-heading tag)?
////The generated HTML could be invalid or not behave as intended. 
//##How can you validate the headingLevel parameter?
//// You could validate it against the allowed heading levels (h1 through h6)