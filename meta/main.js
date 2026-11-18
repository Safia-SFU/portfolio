import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';
// Load the CSV file and convert its values to the correct data types
async function loadData() {
  const data = await d3.csv('loc.csv', (row) => ({  //read the CSV file
    ...row, // ...row keeps all the original values in the row object
    line: Number(row.line), //Number() converts the numeric columns from strings into numbers
    depth: Number(row.depth),
    length: Number(row.length),
    date: new Date(row.date + 'T00:00' + row.timezone), //new Date() converts the date and datetime columns into JavaScript date objects
    datetime: new Date(row.datetime),
  }));

  return data;
}

///////  Computing commit Data
function processCommits(data) {
  return d3
    .groups(data, (d) => d.commit)
    .map(([commit, lines]) => {
      // Each 'lines' array contains all lines modified in this commit
      // All lines in a commit have the same author, date, etc.
      // So we can get this information from the first line
      let first = lines[0];
      // We can use object destructuring to get these properties
      let { author, date, time, timezone, datetime } = first;
      let ret = {
        id: commit,
        url: 'https://github.com/Safia-SFU/portfolio/commit/' + commit,
        author,
        date,
        time,
        timezone,
        datetime,
        //calculate hours as decimal for time analysis
        // e.g., 2:30 PM = 14.5
        hourFrac: datetime.getHours() + datetime.getMinutes() / 60,
        //calculate total lines changed in this commit
        totalLines: lines.length, // number of lines in this commit
      };

      // Store the original line data as a hidden property
      Object.defineProperty(ret, 'lines', {
        value: lines, // store the original line data as a hidden property
        writable: false, // make it read-only
        enumerable: false, // won't appear in the usual object listing or Object.keys()
        configurable: false, // cannot be deleted or reconfigured
        });

        return ret;
    });
}

// Displaying the Stats
function renderCommitInfo(data, commits) {
  // Create the discription lislt (dl) element
  const dl = d3.select('#stats').append('dl').attr('class', 'stats');


  // Add total Lines Of Code LOC
  dl.append('dt').html('<abbr title="Lines of code">LOC</abbr>');
  dl.append('dd').text(data.length);


  // Add total commits
  dl.append('dt').text('COMMITS');
  dl.append('dd').text(commits.length);

  // Add Number of files
  const files = d3.group(data, (d) => d.file).size; // count unique files
  dl.append('dt').text('FILES');
  dl.append('dd').text(files);


  // Average file length
  const FileLengths = d3.rollups(data, (v) => d3.max(v, (d) => d.line),(d) => d.file,);
  const avgFileLength = d3.mean(FileLengths, (d) => d[1]);
  dl.append('dt').text('AVG FILE LENGTH');
  dl.append('dd').text(Math.round(avgFileLength));

   // Average line length
  const averageLineLength = d3.mean(data, (d) => d.length);
  dl.append('dt').text('AVG LINE LENGTH');
  dl.append('dd').text(Math.round(averageLineLength));

  // Maximum indentation depth
  const maxDepth = d3.max(data, (d) => d.depth);
  dl.append('dt').text('MAX INDENTATION DEPTH');
  dl.append('dd').text(maxDepth);

  //Time of the day most work is done
  const workByPeriod = d3.rollups(
    data, (v) => v.length,
    (d) => new Date(d.datetime).toLocaleString('en', { dayPeriod: 'short' }),
  );
  const maxPeriod = d3.greatest(workByPeriod, (d) => d[1])?.[0];
  dl.append('dt').text('MOST WORK DONE');
  dl.append('dd').text(maxPeriod);
  
}

let xScale;
let yScale;
let commits;

function renderScatterPlot(data, commits) {
  // Put all the JS code of Steps inside this function
  //Define dimensions
  const width = 1000;
  const height = 600;

  const margin = { top: 10, right: 10, bottom: 30, left: 20 };

  //Create the SVG using D3
  const svg = d3
    .select('#chart')
    .append('svg')
    .attr('viewBox', `0 0 ${width} ${height}`)
    .style('overflow', 'visible');
  
  const usableArea = {
  top: margin.top,
  right: width - margin.right,
  bottom: height - margin.bottom,
  left: margin.left,
  width: width - margin.left - margin.right,
  height: height - margin.top - margin.bottom,
  };

  //create scales for x and y axes
  xScale = d3
  .scaleTime()
  .domain(d3.extent(commits, (d) => d.datetime))
  .range([0, width])
  .nice();
  yScale = d3.scaleLinear().domain([0, 24]).range([height, 0]);
  
  // Calculate the range of lines edited
  const [minLines, maxLines] = d3.extent(commits, (d) => d.totalLines);
  // Create a scale for dot radius
  const rScale = d3.scaleSqrt().domain([minLines, maxLines]).range([3, 20]);
  // Update scales with new ranges
  xScale.range([usableArea.left, usableArea.right]);
  yScale.range([usableArea.bottom, usableArea.top]);

  // Create the axes
  const xAxis = d3.axisBottom(xScale);
  const yAxis = d3
  .axisLeft(yScale)
  .tickFormat((d) => String(d % 24).padStart(2, '0') + ':00');

  // Add gridlines BEFORE the axes
  const gridlines = svg
    .append('g')
    .attr('class', 'gridlines')
    .attr('transform', `translate(${usableArea.left}, 0)`);


  // Create gridlines as an axis with no labels and full-width ticks
  gridlines.call(d3.axisLeft(yScale).tickFormat('').tickSize(-usableArea.width));


  // Add X axis
  svg
    .append('g')
    .attr('transform', `translate(0, ${usableArea.bottom})`)
    .attr('class', 'x-axis') // Give it a class so we can find and update it later
    .call(xAxis);

  // Add Y axis
  svg
    .append('g')
    .attr('transform', `translate(${usableArea.left}, 0)`)
    .attr('class', 'y-axis') // Give it a class for consistency
    .call(yAxis);

  //Sort commits by total lines in descending order
  const sortedCommits = d3.sort(commits, (d) => -d.totalLines);

  //Draw the dots
  const dots = svg.append('g').attr('class', 'dots');

  dots
    .selectAll('circle')
    .data(sortedCommits, (d) => d.id) // Use each commit's unique ID to identify its circle.
    .join('circle')
    .attr('cx', (d) => xScale(d.datetime))
    .attr('cy', (d) => yScale(d.hourFrac))
    .attr('r', (d) => rScale(d.totalLines))
    .attr('fill', (d) =>
    d.hourFrac >= 6 && d.hourFrac < 18 ? '#f4a261' : '#457b9d',
    )
    .style('fill-opacity', 0.7) // Add transparency for overlapping dots
    .on('mouseenter', (event, commit) => {
      d3.select(event.currentTarget).style('fill-opacity', 1); // Full opacity on hover
      renderTooltipContent(commit);
      updateTooltipVisibility(true);
      updateTooltipPosition(event);
    })
    .on('mouseleave', (event) => {
      d3.select(event.currentTarget).style('fill-opacity', 0.7);
      //Hide tooltip when mouse leaves the dot
      updateTooltipVisibility(false);
    });
  createBrushSelector(svg);

}

///////////////////////////////////////////////////
// add a new function to update the x-axis and points the existing scatterplot
function updateScatterPlot(data, commits) {
  // Set the same chart width as the original scatterplot.
  const width = 1000;
  // Set the same chart height as the original scatterplot.
  const height = 600;
  //define the margins around teh chart
  const margin = { top: 10, right: 10, bottom: 30, left: 20 };
  //calculate the usable drawing area inside teh margins
  const usableArea = {
    top: margin.top,
    right: width - margin.right,
    bottom: height - margin.bottom,
    left: margin.left,
    width: width - margin.left - margin.right,
    height: height - margin.top - margin.bottom,
  };

  //select the svg that already exists insode #chart and use select instead of append to avoid 
  //creating an invalid scale
  const svg = d3.select('#chart').select('svg');

  
  xScale = xScale.domain(d3.extent(commits, (d) => d.datetime));

  const [minLines, maxLines] = d3.extent(commits, (d) => d.totalLines);
  const rScale = d3.scaleSqrt().domain([minLines, maxLines]).range([2, 30]);

  const xAxis = d3.axisBottom(xScale);

  // CHANGE: we should clear out the existing xAxis and then create a new one.
  //find teh existing x-axis group using the class we added
  const xAxisGroup = svg.select('g.x-axis');
  //remove the old axis ticks and labels
  xAxisGroup.selectAll('*').remove();
  //Draw the updated x-axis inside the same group
  xAxisGroup.call(xAxis);

  const dots = svg.select('g.dots');


  const sortedCommits = d3.sort(commits, (d) => -d.totalLines);
  dots
    .selectAll('circle')
    .data(sortedCommits, (d) => d.id) // Use each commit's unique ID to identify its circle.
    .join('circle')
    .attr('cx', (d) => xScale(d.datetime))
    .attr('cy', (d) => yScale(d.hourFrac))
    .attr('r', (d) => rScale(d.totalLines))
    .attr('fill', (d) =>
      d.hourFrac >= 6 && d.hourFrac < 18 ? '#f4a261' : '#457b9d')
    .style('fill-opacity', 0.7) // Add transparency for overlapping dots
    .on('mouseenter', (event, commit) => {
      d3.select(event.currentTarget).style('fill-opacity', 1); // Full opacity on hover
      renderTooltipContent(commit);
      updateTooltipVisibility(true);
      updateTooltipPosition(event);
    })
    .on('mouseleave', (event) => {
      d3.select(event.currentTarget).style('fill-opacity', 0.7);
      updateTooltipVisibility(false);
    });
}


///////////////////////////////////
//Function to update tooltip:
function renderTooltipContent(commit) {
  const link = document.getElementById('commit-link');
  const date = document.getElementById('commit-date');

  if (Object.keys(commit).length === 0) return;

  link.href = commit.url;
  link.textContent = commit.id;
  date.textContent = commit.datetime?.toLocaleString('en', {
    dateStyle: 'full',
  });
}

//show or hide the tooltip based on the isVisible parameter
function updateTooltipVisibility(isVisible) {
  const tooltip = document.getElementById('commit-tooltip');
  tooltip.hidden = !isVisible;
}

// Update the tooltip position based on the mouse event
function updateTooltipPosition(event) {
  const tooltip = document.getElementById('commit-tooltip');
  tooltip.style.left = `${event.clientX}px`;
  tooltip.style.top = `${event.clientY}px`;
}

//function to create a brush selector
function createBrushSelector(svg) {
  svg.call(d3.brush().on('start brush end', brushed));;
  // Raise dots and everything after overlay
  svg.selectAll('.dots, .overlay ~ *').raise();

}

function brushed(event) {
    const selection = event.selection;
    d3.selectAll('circle').classed('selected', (d) =>
    isCommitSelected(selection, d),
    );
    renderSelectionCount(selection);
    renderLanguageBreakdown(selection);
  }

  function isCommitSelected(selection, commit) {
    if (!selection) {
      return false;
    }
  // return true if commit is within brushSelection and false if not
  const [x0, x1] = selection.map((d) => d[0]); 
  const [y0, y1] = selection.map((d) => d[1]); 
  const x = xScale(commit.datetime); 
  const y = yScale(commit.hourFrac); 
  return x >= x0 && x <= x1 && y >= y0 && y <= y1;
  }

  function renderSelectionCount(selection) {
  const selectedCommits = selection
    ? commits.filter((d) => isCommitSelected(selection, d))
    : [];

  const countElement = document.querySelector('#selection-count');
  countElement.textContent = `${
    selectedCommits.length || 'No'
  } commits selected`;

  return selectedCommits;
}

// Language brekdown
function renderLanguageBreakdown(selection) {
  const selectedCommits = selection
    ? commits.filter((d) => isCommitSelected(selection, d))
    : [];
  const container = document.getElementById('language-breakdown');


  if (selectedCommits.length === 0) {
    container.innerHTML = '';
    return;
  }
  const requiredCommits = selectedCommits.length ? selectedCommits : commits;
  const lines = requiredCommits.flatMap((d) => d.lines);


  // Use d3.rollup to count lines per language
  const breakdown = d3.rollup(
    lines,
    (v) => v.length,
    (d) => d.type,
  );

  // Update DOM with breakdown
  container.innerHTML = '';

  for (const [language, count] of breakdown) {
    const proportion = count / lines.length;
    const formatted = d3.format('.1~%')(proportion);

    container.innerHTML += `
            <dt>${language}</dt>
            <dd>${count} lines (${formatted})</dd>
        `;
  }
}



let data = await loadData();
commits = processCommits(data);

//Lab 8 - step 2.1
// Adding Unit Visualization for Files
function updateFileDisplay(filteredCommits) {
  // Create a D3 ordinal color scale.
  let colors = d3.scaleOrdinal(d3.schemeTableau10);
  // Collect all the lines associated with the currently visible commits.
  // flatMap() combines the lines arrays from each commit into one array.
  let lines = filteredCommits.flatMap((d) => d.lines);
  ////////////////////////////////////////////////////////
  // Show each filename and the technologies recorded for its lines.
  console.log(
    'Technologies by file:',
    d3.rollups(
      lines,
      (fileLines) => [...new Set(fileLines.map((d) => d.type))],
      (d) => d.file
    )
  );
  ////////////////////////////////////////////////////////
  let files = d3
    .groups(lines, (d) => d.file)
    .map(([name, lines]) => {
      return { name, lines };
    })
    // Sort files from the most lines to the fewest lines.
    .sort((a, b) => b.lines.length - a.lines.length);
  
  //Find the <dl is="files"> element in meta/index.html
  let filesContainer = d3
    .select('#files')
    .selectAll('div') //select existing divs representing files
    .data(files, (d) => d.name) //match each div using its filename
    .join(
    // This code only runs when the div is initially rendered
    //create a new dic only when a file doesn't already have one
      (enter) =>
        enter.append('div').call((div) => {
        //create a <dt> containing a <code> for teh filename
        div.append('dt').append('code');
        ////create a <dd> for rhe number of files
        div.append('dd');
      }),
  );

  // This code updates the div info
  // Update the filename displayed inside each <code> element.
  // Display the filename and number of lines in the <dt> element.
  filesContainer.select('dt').html((d) => `
    <code>${d.name}</code>
    <small>${d.lines.length} lines</small>
  `);
  // Update the number of lines displayed for each file.
  // Find the <dd> element belonging to each file.
  filesContainer
    .select('dd')
    // Select the existing line elements inside each <dd>.
    .selectAll('div')
    // Connect each line of code to one div element.
    .data((d) => d.lines)
    // Create new divs or remove extra ones as the slider changes.
    .join('div')
    // Give every line element the CSS class "loc".
    .attr('class', 'loc')
    //Assign a technology-based color to each line using a CSS variable.
    .attr('style', (d) => `--color: ${colors(d.type)}`);
}


//Lab 8:
//Step1.1:
// Max time to show as % of total time
let commitProgress = 100;
// Store the commits that should currently appear in the visualization.
// Initially, all commits are included because the slider starts at 100%.
let filteredCommits = commits;

let timeScale = d3
  .scaleTime()
  .domain([
    d3.min(commits, (d) => d.datetime),
    d3.max(commits, (d) => d.datetime),
  ])
  .range([0, 100]);
let commitMaxTime = timeScale.invert(commitProgress);



// Update the date when the slider moves
function onTimeSliderChange() {
  const slider = document.getElementById('commit-progress');

  commitProgress = Number(slider.value);

  commitMaxTime = timeScale.invert(commitProgress);


  document.getElementById('commit-time').textContent =
    commitMaxTime.toLocaleString('en', {
      dateStyle: 'long',
      timeStyle: 'short',
    });
  // keep only commits that happened on or before the selected date
  filteredCommits = commits.filter((d) => d.datetime <= commitMaxTime);

  //update the existing scatterplot with the filtered commits
  updateScatterPlot(data, filteredCommits);

  //update the file list using the same filtered commits
  updateFileDisplay(filteredCommits);
 
}



//create the original scatterplot with all commits
renderScatterPlot(data, commits);
//display the original commit statistics
renderCommitInfo(data, commits);

//renderTooltipContent(commits);

// Listen for slider changes 
document
  .getElementById('commit-progress')
  .addEventListener('input', onTimeSliderChange);

// Initialize the date when the page loads
onTimeSliderChange();


