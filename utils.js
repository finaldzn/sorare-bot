const fs = require("fs");
const { GraphQLClient } = require("graphql-request");
const runSignIn = require("./scripts/authUser");

function mergeJSONFILES() {
  let data = [];
  const team_data = readTeamsFile();
  for (const team in team_data) {
    const team_slug = team_data[team].team_slug;
    const t_data = JSON.parse(
      fs.readFileSync(`../${team_slug}_info.json`, "utf8")
    );
    data = data.concat(t_data);
  }

  const listString = JSON.stringify(data);
  fs.writeFileSync(`../info.json`, listString, "utf8");
}

/**
 *
 * @returns returns an array of all players slug and their teams
 */
function readTeamsFile() {
  const teams = fs.readFileSync("../Atlanta_braves.json", "utf8");
  return JSON.parse(teams);
}

function parseTeams() {
  const teams = fs.readFileSync("../Atlanta_braves.txt", "utf8");
  const teamsArray = teams.split("\n");
  const teamsArrayParsed = teamsArray.map((team) => {
    const teamName = team
      .split(" (")[0]
      .replace(/ /g, "-")
      .replace(".", "")
      .toLowerCase();
    return teamName;
  });
  return teamsArrayParsed;
}

function writePlayerInfo(filename, list) {
  const listString = JSON.stringify(list);
  fs.writeFileSync(`../${filename}_info.json`, listString, "utf8");
}

function writePlayerList(list) {
  const listString = JSON.stringify(list);
  fs.writeFileSync("../Atlanta_braves.json", listString, "utf8");
}

async function sendGRAPHQLRequest(client, input, query) {
  const data = await client.request(query, input);
  return data;
}

async function initGraphQLCLient(
  endpoint = "https://api.sorare.com/mlb/graphql",
  email,
  pass
) {
  //const user = await runSignIn(email, pass);
  const graphQLClient = new GraphQLClient(endpoint, {
    headers: {
     Authorization: `Bearer eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiI3NzgxMGI1My0yZjgwLTQ3OTEtOWMzYy00OTBhNWU0MjcxMDMiLCJzY3AiOiJ1c2VyIiwiYXVkIjoidG90d3NvcmFyZSIsImlhdCI6MTY2NjU0NzAyOSwiZXhwIjoiMTY2OTEzOTAyOSIsImp0aSI6IjNlODFkMmU4LWQ4ZDMtNDIxNy04OTIzLWY3NjQyN2U0ZDlmNSJ9.MyvMSFb3l1PiUv2ECYDdfd3Ze_D4Cb_Fu-Jec8N2JUY`,
      "JWT-AUD": `totwsorare`,
    },
  });
  return [graphQLClient, 'dummy'];
}

module.exports = {
  parseTeams,
  writePlayerList,
  sendGRAPHQLRequest,
  initGraphQLCLient,
  readTeamsFile,
  writePlayerInfo,
  mergeJSONFILES
};
