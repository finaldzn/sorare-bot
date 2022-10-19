const { GraphQLClient } = require("graphql-request");
const runSignIn = require("./scripts/authUser");
const { getNBAPlayersFromTeamSlug } = require("./scripts/constant_query");

const { initGraphQLCLient, sendGRAPHQLRequest } = require("./utils");

const fs = require("fs");

const MY_EMAIL = "mouradianvictor@gmail.com";
const MY_PASS = "Redsox46Mm!!";

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function returnCleanData(data) {
  const clean = data.nbaTeam;
  let res = {};
  res.team = clean.name;
  res.slug = clean.slug;
  res.players = [];
  for (const player of clean.players) {
    res.players.push({
      team: clean.name,
      slug: player.slug,
      id: player.id,
      displayName: player.displayName,
      firstName: player.firstName,
      lastName: player.lastName,
      shirtNumber: player.shirtNumber,
      positions: player.positions,
      tenGameAverage: player.tenGameAverage,
      avatarImageUrl: player.avatarImageUrl,
      birthDate: player.birthDate,
      birthPlaceCountry: player.birthPlaceCountry,
    });
  }
  return res;
}

async function getPlayersFromTeam(nba_client, teamslug) {

  const data = await sendGRAPHQLRequest(
    nba_client,
    { slug: teamslug },
    getNBAPlayersFromTeamSlug
  );
  if (data.nbaTeam === null) {
    console.log("No data for team: ", teamslug);
    return null;
  }
  return returnCleanData(data);
}

const createCsvWriter = require("csv-writer").createObjectCsvWriter;

async function writeToCsv(path, data) {
  const csvWriter = createCsvWriter({
    path: path,
    header: [
      { id: "team", title: "team" },
      { id: "slug", title: "slug" },
      { id: "displayName", title: "displayName" },
      { id: "firstName", title: "firstName" },
      { id: "lastName", title: "lastName" },
      { id: "shirtNumber", title: "shirtNumber" },
      { id: "positions", title: "positions" },
      { id: "tenGameAverage", title: "tenGameAverage" },
      { id: "avatarImageUrl", title: "avatarImageUrl" },
      { id: "birthDate", title: "birthDate" },
      { id: "birthPlaceCountry", title: "birthPlaceCountry" },
    ],
  });
  await csvWriter.writeRecords(data);
}

const MAX_LIMIT = 1;

async function getAllPlayersFromAllTeams() {
  let limit = 0;
  const teams = fs.readFileSync("../TEAM_SLUGS.txt", "utf8");
  const teams_slugs = teams.split("\n");
  const [nba_client, slug] = await initGraphQLCLient(
    "https://api.sorare.com/sports/graphql",
    MY_EMAIL,
    MY_PASS
  );

  for (let team_slug of teams_slugs) {
    team_slug = team_slug.trim()
    console.log(team_slug)
    const data = await getPlayersFromTeam(nba_client, team_slug);
    if (data === null) continue;
    writeToCsv(`../data/${team_slug}.csv`, data.players);
  }
}

async function generateTeamSlugs() {
  const team_slugs = [];
  // read team file
  const data = await fs.readFileSync("../TEAM_dump.txt", "utf8");
  const team_list = data.split("\n");
  for (const team of team_list) {
    team_slugs.push(
      (team.split(" ")[0] + "-" + team.split(" ")[1]).toLowerCase()
    );
  }
  fs.writeFileSync("../TEAM_SLUGS.txt", team_slugs.join("\n"));
}

async function main() {
  //await getAllPlayersSlugFromTeams(MY_EMAIL, MY_PASS);
  // //const allPlayers = await getAllCards(client)
  // const allcards = await getAllBaseballCards(client, "kylian-mbappe-lottin")
  // console.log(allcards)
  //await getAssetsIdFromAllPossibleSlugs();
  //await mergeJSONFILES();
  await getAllPlayersFromAllTeams();
}

main();
