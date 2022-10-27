const { Client } = require('pg')


function initClient(dsn) {
    const client = new Client(dsn)
    client.connect()
    return client
}

function insertPlayerIntoDB(client, player) {
    const query = {
        text: 'INSERT INTO nbaplayers (team, slug, name, positions, avgscore, avatarurl) VALUES ($1, $2, $3, $4, $5, $6)',
        values: [player.team, player.slug, player.name, player.positions, player.avgScore, player.avatarURL],
    }
    client.query(query, err => {
        if (err) {
          console.error('connection error', err.stack)
        } else {
          console.log('connected')
        }
      })
}

function createTable(client) {
  client.query(
    `CREATE TABLE IF NOT EXISTS cards (
            slug VARCHAR(255) PRIMARY KEY,
            name VARCHAR(255),
            lastBid FLOAT,
            lastBidInUSD FLOAT,
            rarity VARCHAR(255),
            open BOOLEAN,
            startDate timestamp,
            endDate timestamp,
            bidsCount INT,
            player VARCHAR(255),
            updatedat timestamp DEFAULT CURRENT_TIMESTAMP,
            createdat timestamp DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (player) REFERENCES nbaplayers(slug)
            )`
  );
}

async function doesCardExist(client, slug) {
  const query = await client.query(
    `SELECT * FROM cards WHERE slug = '${slug}'`
  );
  return query.rowCount > 0;
}

async function insertCard(client, card) {
  const getPlayerSlugFromCardSlug = (slug) => {
    return slug.split("-").slice(0, -3).join("-");
  };
  if (!(await doesCardExist(client, card.slug))) {
    client.query(
      `INSERT INTO cards (slug, name, lastBid, lastBidInUSD, startDate, endDate, bidsCount, player, open, rarity) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [
        card.slug,
        card.name,
        card.latestEnglishAuction.bestBid.amount,
        card.latestEnglishAuction.bestBid.amountInFiat.usd,
        card.latestEnglishAuction.startDate,
        card.latestEnglishAuction.endDate,
        card.latestEnglishAuction.bidsCount,
        getPlayerSlugFromCardSlug(card.slug),
        card.open,
        card.rarity,
      ]
    ).catch((err) => {
      console.error(err);
    });
  }
}

async function updateOrCreateCard(client, card) {
  const getPlayerSlugFromCardSlug = (slug) => {
    return slug.split("-").slice(0, -3).join("-");
  };
  console.log("updating a card");
  if (await doesCardExist(client, card.slug)) {
    client.query(
      `UPDATE cards SET lastBid = $1, lastBidInUSD = $2, startDate = $3, endDate = $4, bidsCount = $5, player = $6, updatedat=$7, open=$8, rarity=$9 WHERE slug = $10`,
      [
        card.latestEnglishAuction.bestBid.amount,
        card.latestEnglishAuction.bestBid.amountInFiat.usd,
        card.latestEnglishAuction.startDate,
        card.latestEnglishAuction.endDate,
        card.latestEnglishAuction.bidsCount,
        getPlayerSlugFromCardSlug(card.slug),
        new Date(Date.now()).toISOString().replace('T',' ').replace('Z',''),
        card.open,
        card.rarity,
        card.slug,
      ]
    ).catch((err) => {
      console.log(err);
    });
  } else {
      client.query(
        `INSERT INTO cards (slug, name, lastBid, lastBidInUSD, startDate, endDate, bidsCount, player, open, rarity) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [
          card.slug,
          card.name,
          card.latestEnglishAuction.bestBid.amount,
          card.latestEnglishAuction.bestBid.amountInFiat.usd,
          card.latestEnglishAuction.startDate,
          card.latestEnglishAuction.endDate,
          card.latestEnglishAuction.bidsCount,
          getPlayerSlugFromCardSlug(card.slug),
          card.open,
          card.rarity
        ]
      ).catch((err) => {
        console.log("CAHUGHJTR ERROR")
        console.log(err);
      });
  }
}

module.exports = {
    initClient,
    insertPlayerIntoDB,
    insertCard,
    createTable,
    updateOrCreateCard

}
