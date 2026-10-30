//Importing D3
import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';


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
//----Keep those-----//

//variable that hold the search query 
let query = '';
// -1 means no index (no pie slice is selected)
let selectedIndex = -1;
let selectedYear = null;

//update the filtering so both search query and selected year work together:
function updateProjects() {

  //// First, filter projects based on the search query
  let searchFilteredProjects = projects.filter((project) => {
    let values = Object.values(project).join('\n').toLowerCase();
    return values.includes(query.toLowerCase());
  });
  
  // Then, apply the selected year filter to the search results
  let filteredProjects = searchFilteredProjects.filter((project) => {
    let matchesYear = selectedYear === null || (project.year) === (selectedYear);

    return matchesYear;
  });

  renderProjects(filteredProjects, projectsContainer, 'h2');
  renderPieChart(searchFilteredProjects);
}

// Function to render the pie chart and legend
function renderPieChart(projectsGiven) {
    // re-calculate rolled data: Group projects by year and count them
    let newRolledData = d3.rollups(
        projectsGiven,
        (v) => v.length,
        (d) => d.year,
    );
    // re-calculate data: Convert the grouped data into labels and values
    let newData = newRolledData.map(([year, count]) => {
      return { value: count, label: year};
    });
    //recalculates the selected slice's index whenever the chart is redrawn 9to keep the highlight on selected pie)
    selectedIndex = newData.findIndex((d) => d.label === selectedYear);

    // Create the arc generator
    let newArcGenerator = d3.arc().innerRadius(0).outerRadius(50);
    // re-calculate slice generator, arc data, arc, etc.
    let newSliceGenerator = d3.pie().value((d) => d.value);
    //Calculate the pie slices:
    let newArcData = newSliceGenerator(newData);
    let newArcs = newArcData.map((d) => newArcGenerator(d));
    // TODO: clear up paths and legends : remove the previous chart and legend entries
    let newSVG = d3.select('svg');
    newSVG.selectAll('path').remove();

    // update paths and legends, refer to steps 1.4 and 2.2
    let legend = d3.select('.legend');
    legend.selectAll('li').remove();

    // Generate colors
    let colors = d3.scaleOrdinal(d3.schemeTableau10);

    // Draw the pie chart
    newArcs.forEach((arc, i) => {
      newSVG
        .append('path')
        .attr('d', arc)
        .attr('fill', colors(i))
        .attr('class', i === selectedIndex ? 'selected' : null)
        .on('click', () => {
          // Select or deselect the clicked wedge
          selectedIndex = selectedIndex === i ? -1 : i;

          // Store the selected year
          selectedYear = selectedIndex === -1 ? null : newData[selectedIndex].label;


          // Highlight the selected wedge
          newSVG
            .selectAll('path')
            .attr('class', (_, idx) => (
              idx === selectedIndex ? 'selected' : null
            ));

          // Highlight the corresponding legend item
          legend
            .selectAll('li')
            .attr('class', (_, idx) => (
              idx === selectedIndex
                ? 'legend-item selected'
                : 'legend-item'
            ));
          //filter projects based on the selected year:
          //selectedYear =
            //selectedIndex === -1 ? null : newData[selectedIndex].label;
        
          updateProjects();
          
        });
    });

    // Draw the legend
    newData.forEach((d, idx) => {
      legend
        .append('li')
        .attr('style', `--color:${colors(idx)}`)
        .attr(
          'class',
          idx === selectedIndex
            ? 'legend-item selected'
            : 'legend-item'
        )
        .html(
          `<span class="swatch"></span> ${d.label} <em>(${d.value})</em>`
        );
    });
}



// Render the initial pie chart and legend when the page loads
renderPieChart(projects);


/*searchInput.addEventListener('change', (event) => {
  let filteredProjects = setQuery(event.target.value);
  // re-render legends and pie chart when event triggers
  renderProjects(filteredProjects, projectsContainer, 'h2');
  renderPieChart(filteredProjects);
});*/

//Select the search field:
let searchInput = document.querySelector('.searchBar');


/*/ Update the projects and chart when the search changes
searchInput.addEventListener('change', (event) => {
  // update query value
  query = event.target.value;
  // TODO: filter the projects: Make the Search Case-Insensitive + Search Across All Project Metadata, Not Just Titles
  let filteredProjects = projects.filter((project) => {
    let values = Object.values(project).join('\n').toLowerCase();
    return values.includes(query.toLowerCase()); 
  }); */
  //replace the code above to incluse both filters:
searchInput.addEventListener('change', (event) => {
  query = event.target.value;
  updateProjects();
});





//## What happens if the projects.json file is missing or incorrectly formatted?
////If it's missing, the request will typically return a 404 error.
////If the file contains invalid JSON, response.json() will throw a parsing error.
//## How does the renderProjects function handle an empty array of projects? 
////An empty array contains no projects to render.
//## Can you enhance it to display a placeholder message in this case?
////We could enhance renderProjects to display a message such as "No projects to display"

////remove this to create a pie chart instead of a one red circle
//Create the path for our circle: this function takes data and returns a path string
/*
let arcGenerator = d3.arc().innerRadius(0).outerRadius(50);
//Generate an arc
let arc = arcGenerator({
  startAngle: 0,
  endAngle: 2 * Math.PI,
});
//add teh path to our SVG 
d3.select('svg').append('path').attr('d', arc).attr('fill', 'red');
*/
// We can also use this shorter version:
//let arc = d3.arc().innerRadius(0).outerRadius(50)({
 // startAngle: 0,
 // endAngle: 2 * Math.PI,});

/* we don't need those anymore, because we included them in Function to render the pie chart and legend
 //Drawing a Static Pie Chart With D3
let arcGenerator = d3.arc().innerRadius(0).outerRadius(50);*/
//Defining the data and its labels
/*let data = [
  { value: 1, label: 'apples' },
  { value: 2, label: 'oranges' },
  { value: 3, label: 'mangos' },
  { value: 4, label: 'pears' },
  { value: 5, label: 'limes' },
  { value: 5, label: 'cherries' },
];*/
/*
// Group projects by year and count them
let rolledData = d3.rollups(
  projects,
  (v) => v.length,
  (d) => d.year,
);
// Convert the grouped data into labels and values
let data = rolledData.map(([year, count]) => {
  return { value: count, label: year };
});

// Using D3 to calculate the pie slices
let sliceGenerator = d3.pie().value((d) => d.value);
let arcData = sliceGenerator(data);

// Generating the paths
let arcs = arcData.map((d) => arcGenerator(d));
// Defining the colors
let colors = d3.scaleOrdinal(d3.schemeTableau10);
// Drawing the pie chart
arcs.forEach((arc, idx) => {
    d3.select('svg')
    .append('path')
    .attr('d', arc)
    .attr('fill',colors(idx));
  
});

//Adding a Legend (add a <span> with a “swatch” class to each <li> so we can style them in CSS)
let legend = d3.select('.legend');
data.forEach((d, idx) => {
  legend
    .append('li')
    .attr('style', `--color:${colors(idx)}`) // set the style attribute while passing in parameters
    .html(`<span class="swatch"></span> ${d.label} <em>(${d.value})</em>`); // set the inner html of <li>
});
*/
