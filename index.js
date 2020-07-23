const { request } = require("@octokit/request");
const wtd = require("what-the-diff");
var fs = require("fs");

const ev = JSON.parse(
  fs.readFileSync(process.env.GITHUB_EVENT_PATH, 'utf8')
)
const prNum = ev.pull_request.number

console.log('pr ' + prNum)

const sha = process.env.GITHUB_SHA

console.log('sha ' + sha)

const token = process.env.GITHUB_TOKEN

console.log('token ' + token)

async function run(suggestion, rangeStart, rangeEnd) {
  const open = "```suggestion";
  const close = "```";
  const body = `${open}` + "\n" + suggestion + `${close}`;

  console.log("requesting with prNum: " + prNum)
  console.log("with sha: " + sha)
  const result = await request(
    "POST /repos/:owner/:repo/pulls/:pull_number/comments",
    {
      headers: {
        authorization: "token " + token
      },
      mediaType: {
        previews: ["comfort-fade"]
      },
      owner: "rvantonder",
      repo: "silly-test-repo", // TODO GITHUB_REPOSITORY https://docs.github.com/en/actions/configuring-and-managing-workflows/using-environment-variables
      pull_number: prNum,
      body: body,
      commit_id: sha,
      path: "test.go",
      side: "RIGHT",
      start_side: "RIGHT",
      start_line: rangeStart,
      line: rangeEnd,
    }
  );
  console.log('status ' + result.status)
  console.log('result ' + result)
  console.log(`${result.data.length} comments found.`);
}

// get PR files
// do comby -i, then git diff > p.patch
// iterate patch


// get the range of things removed (from file)
// suggest the range of things in the "to" file, and add the + lines to the content

fs.readFile("p.patch", "utf8", function(err, contents) {
  // header makes what-the-diff happy.
  // header = `diff --git file.txt file.txt\r\nindex 83db48f..bf269f4 100644\r\n`;
  // contents = `${header}${contents}`;
  const diffs = wtd.parse(contents);
  console.log(diffs);
  console.log("diffs is\n" + JSON.stringify(diffs));
  for (var i = 0; i < diffs.length; i++) {
    console.log("iterating diff " + 1)
    var hunks = diffs[i].hunks;
    for (var j = 0; j < hunks.length; j++) {
      console.log("iterating hunk " + j + "\n" + JSON.stringify(hunks[j]));
      var startLine = hunks[j].newStartLine;
      var lines = hunks[j].lines;
      var suggest = "";
      for (var k = 0; k < lines.length; k++) {
        var line = lines[k];
        if (!line.startsWith("-")) {
          line = line.substr(1) // remove '+' or space
          suggest += line + "\n"
        }
      }
      rangeStart = hunks[j].oldStartLine
      rangeEnd = rangeStart + hunks[j].oldLineCount - 1
      console.log("suggest at: " + rangeStart + " to " + rangeEnd)
      console.log("=====")
      console.log(suggest)
      console.log("-----")
      run(suggest, rangeStart, rangeEnd);
      console.log("sent")
    }
  }
});




