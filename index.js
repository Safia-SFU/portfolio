//import the fetchJSON and renderProjects functions from global.js
import { fetchJSON, renderProjects, fetchGitHubData } from './global.js';

//Fetch and Filter Projects
const projects = await fetchJSON('./lib/projects.json');
//Select the first three projects
const latestProjects = projects.slice(0, 3); 
//Select the Projects Container
const projectsContainer = document.querySelector('.projects');
//Render the Latest Projects
renderProjects(latestProjects, projectsContainer, 'h2');

//fetch githubData
const githubData = await fetchGitHubData('Safia-SFU');
//Targeting the HTML Element in index.js
const profileStats = document.querySelector('#profile-stats');

if (profileStats) {
  profileStats.innerHTML = `
        <dl>
          <dt>Followers:</dt><dd>${githubData.followers}</dd>
          <dt>Following:</dt><dd>${githubData.following}</dd>
          <dt>Public Repos:</dt><dd>${githubData.public_repos}</dd>
          <dt>Public Gists:</dt><dd>${githubData.public_gists}</dd>
        </dl>
    `;
}
