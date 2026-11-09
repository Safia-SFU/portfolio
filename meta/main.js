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
    .call(xAxis);

  // Add Y axis
  svg
    .append('g')
    .attr('transform', `translate(${usableArea.left}, 0)`)
    .call(yAxis);

  //Sort commits by total lines in descending order
  const sortedCommits = d3.sort(commits, (d) => -d.totalLines);

  //Draw the dots
  const dots = svg.append('g').attr('class', 'dots');

  dots
    .selectAll('circle')
    .data(sortedCommits)
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
renderCommitInfo(data, commits);
renderScatterPlot(data, commits);
//renderTooltipContent(commits);
