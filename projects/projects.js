//Importing Functions fetchJSON and renderProjects from the existing global.js
import { fetchJSON, renderProjects } from '../global.js';
//Fetching Project Data from lib/projects.json
const projects = await fetchJSON('../lib/projects.json');
//add # of projects in the heading  
document.querySelector('.projects-title').textContent = `${projects.length} Projects`;
//Selecting the Projects Container: Finds the HTML element with the class projects
const projectsContainer = document.querySelector('.projects');
//Rendering the Projects: Passes the data and container to renderProjects
renderProjects(projects, projectsContainer, 'h2');

//## What happens if the projects.json file is missing or incorrectly formatted?
////If it's missing, the request will typically return a 404 error.
////If the file contains invalid JSON, response.json() will throw a parsing error.
//## How does the renderProjects function handle an empty array of projects? 
////An empty array contains no projects to render.
//## Can you enhance it to display a placeholder message in this case?
////We could enhance renderProjects to display a message such as "No projects to display"