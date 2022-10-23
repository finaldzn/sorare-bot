const { ActionCable } = require('@sorare/actioncable');



const tokenOfferWasUpdated = `tokenOfferWasUpdated {
  status
  actualReceiver {
    ... on User {
      slug
    }
  }
  sender {
    ... on User {
      slug
    }
  }
  senderSide {
    wei
    fiat {
      eur
      usd
      gbp
    }
    nfts {
      assetId
      collectionName
    }
  }
  receiverSide {
    wei
    fiat {
      eur
      usd
      gbp
    }
    nfts {
      assetId
      collectionName
      metadata {
        ... on TokenCardMetadataInterface {
          playerSlug
          rarity
          serialNumber
        }
      }
    }
  }
}
`;

const tokenAuctionWasUpdated = `tokenAuctionWasUpdated(sports: [NBA]) {
  open
  endDate
  currentPrice
  bestBid {
    amount
    amountInFiat {
      eur
      usd
      gbp
    }
    bidder {
      ... on User {
        slug
      }
    }
  }
  bids {
    nodes {
      amount
      amountInFiat {
        eur
        usd
        gbp
      }
      bidder {
        ... on User {
          slug
        }
      }
    }
  }
  nfts {
    assetId
    collectionName
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



function createSubscription(authorization){
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
            console.log('a token auction was updated', tokenOffer);
        }
    });
}