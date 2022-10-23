const { getAllNBACards } = require("../scripts/constant_query");
const { initGraphQLCLient, sendGRAPHQLRequest } = require("../utils");
const { insertCard, updateOrCreateCard, createTable } = require("../database");
const { ActionCable } = require('@sorare/actioncable');

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}



async function getAllCards(client) {
  const [graphClient, slug] = await initGraphQLCLient(
    "https://api.sorare.com/graphql",
    "",
    ""
  );

  createTable(client);

  let cursor = null;
  let i = 0;
  do {
    console.log("Page starting from cursor", cursor);
    if (i > 50) {
      console.log("sleeping for a minute");
      await sleep(1000 * 60);
      i = 0;
    }
    const data = await sendGRAPHQLRequest(
      graphClient,
      {
        cursor: cursor,
      },
      getAllNBACards
    );
    i++;
    const paginatedCards = data["tokens"]["allNfts"]["nodes"];
    for (const card of paginatedCards) {
      if (!card.latestEnglishAuction) {
        continue;
      }
      console.log(card);
      if (card.latestEnglishAuction.bestBid) {
        await insertCard(client, card);
      } else {
        await insertCard(client, {
          ...card,
          latestEnglishAuction: {
            ...card.latestEnglishAuction,
            bestBid: {
              amount: 0,
              amountInFiat: {
                usd: 0,
              },
            },
          },
        });
      }
    }
    cursor = data["tokens"]["allNfts"]["pageInfo"]["endCursor"];
    if (!data["tokens"]["allNfts"]["pageInfo"]["hasNextPage"]) {
      console.log("reached the end");
      break;
    }
  } while (cursor != null);
}

const tokenAuctionWasUpdated = `tokenAuctionWasUpdated(sports: [NBA]) {
    open
    endDate
    currentPrice
    bestBid {
      amount
      amountInFiat {
        usd
      }
    }
    nfts {
      slug
      metadata {
        ... on TokenCardMetadataInterface {
          playerSlug
          rarity
          serialNumber
        }
      }
    }
  }
  `;
  
  
  
  function createSubscription(client, authorization){
      const cable = new ActionCable({
          headers: {
            'Authorization': `Bearer eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiI3NzgxMGI1My0yZjgwLTQ3OTEtOWMzYy00OTBhNWU0MjcxMDMiLCJzY3AiOiJ1c2VyIiwiYXVkIjoidG90d3NvcmFyZSIsImlhdCI6MTY2NjU0NzAyOSwiZXhwIjoiMTY2OTEzOTAyOSIsImp0aSI6IjNlODFkMmU4LWQ4ZDMtNDIxNy04OTIzLWY3NjQyN2U0ZDlmNSJ9.MyvMSFb3l1PiUv2ECYDdfd3Ze_D4Cb_Fu-Jec8N2JUY`,
            // 'APIKEY': '<YourOptionalAPIKey>'
          }
        });
      cable.subscribe(tokenAuctionWasUpdated, {
          connected() {
              console.log("connected");
          },
          
          disconnected(error) {
              console.log("disconnected", error);
          },
          
          rejected(error) {
              console.log("rejected", error);
          },
          
          received(data) {
              if (data?.result?.errors?.length > 0) {
              console.log('error', data?.result?.errors);
              return;
              }
              const tokenOffer = data?.result?.data;
              if(tokenOffer.latestEnglishAuction){
              updateOrCreateCard(client, tokenOffer);
              } else {
                console.log(tokenOffer)
              }
              console.log('a token auction was updated', tokenOffer);
          }
      });
  }

module.exports = {
    getAllCards,
    createSubscription
} ;
