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


let data = await loadData(); 
let commits = processCommits(data); // gives an array of commit objects, each with an id and other info
renderCommitInfo(data, commits);



