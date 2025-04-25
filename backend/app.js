const express = require('express');
const { exec } = require("child_process");

const app = express()
const port = 4000
const cors = require('cors');

app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

const API_VERSION = '/api-v1'
const AUCTION_APP_PATH = __dirname + '/../../../hyperledger/fabric-samples/auction-simple/application-javascript';

app.listen(port, () => {
  console.log(`auction-command-runner API-server: listening on port ${port}`)
});

// org = 'org1' or 'org2'
app.post(`${API_VERSION}/admin/enroll`, async (req, res) => {
  const org = req.body.org;

  exec(`node ${AUCTION_APP_PATH}/enrollAdmin.js ${org}`, (error, stdout, stderr) => {
    if (error) {
      console.error(error);
      res.json({
        'isSuccess': false,
        'message':`error admin of enrollment:${error}`
      });
      return;
    }
  
    if (stderr) {
      console.error(stderr);
      res.json({
        'isSuccess': false,
        'message':`error admin of enrollment:${stderr}`
      });
      return;
    }

    res.json({
      'isSuccess': true,
      'message':`success admin of enrollment:${org}`
    });
  });
});

// org = 'org1' or 'org2' , userID = 'seller' or 'biddder1'
app.post(`${API_VERSION}/user/register`,  (req, res)=> {
  const org = req.body.org;
  const userID = req.body.user_id;

  // command
  exec(`node ${AUCTION_APP_PATH}/registerEnrollUser.js ${org} ${userID}`, (error, stdout, stderr) => {
    if (error) {
      console.error(error);
      res.json({
        'isSuccess': false,
        'message':`${userID} User registration was failed: ${error}`
      });
      return;
    }
    if (stderr) {
        console.error(stderr);
        res.json({
          'isSuccess': false,
          'message':`${userID} User registration was failed: ${stderr}`
        });
        return;
    }
    res.json({
      'isSuccess': true,
      'message':`${userID} User registration was successful: ${org}`
    });
  });
});

app.post(`${API_VERSION}/auction/create`, async (req, res)=> {
  const org = req.body.org;
  const userID = req.body.user_id;
  const auctionID = req.body.auction_id;
  const item = req.body.item;

  // command
  exec(`node ${AUCTION_APP_PATH}/createAuction.js ${org} ${userID} ${auctionID} ${item}`, (error, stdout, stderr) => {
    if (error) {
      console.error(error);
      res.json({
        'isSuccess': false,
        'message':`Creating  ${auctionID} auction was failed: ${error}`
      });
      return;
    }
    if (stderr) {
      console.error(stderr);
      res.json({
        'isSuccess': false,
        'message':`Creating ${auctionID} was failed: ${stderr}`
      });
      return;
    }

    res.json({
      'isSuccess': true,
      'message':`Creating auction was successful: ${auctionID}`
    });
  });
});

app.post(`${API_VERSION}/auction/bid/create`,  (req, res)=> {
  const org = req.body['org'];
  const userID = req.body['user_id'];
  const auctionID = req.body['auction_id'];
  const bidAmount = req.body['bid_amount'];

  // command
  exec(`node ${AUCTION_APP_PATH}/bid.js ${org} ${userID} ${auctionID} ${bidAmount}`, (error, stdout, stderr) => {
    if (error) {
      console.error(error);
      res.json({
        'isSuccess': false,
        'message':`Creating bid-id ${auctionID} was failed: ${error}`
      });
      return;
    }
    if (stderr) {
      console.error(stderr);
      res.json({
        'isSuccess': false,
        'message':`Creating bid-id ${auctionID} was failed: ${stderr}`
      });
      return;
    }

    const bidStartIndex = stdout.indexOf("BidID: ");
    const bidEndIndex = stdout.indexOf("--> Evaluate Transaction: read the bid that was just created");

    if (bidStartIndex == -1 || bidEndIndex == -1) {
      const errorMessage = 'is not found BidID';
      console.error(errorMessage);
      res.json({
        'isSuccess': false,
        'message': errorMessage,
      });
      return;
    }

    const bidID = stdout.substring(bidStartIndex+7, bidEndIndex).trim();

    res.json({
      'isSuccess': true,
      'message': stdout,
      'bid_id': bidID,
    });
  });
});


app.post(`${API_VERSION}/auction/bid/submit`,  (req, res) => {
  const org = req.body['org'];
  const userID = req.body['user_id'];
  const auctionID = req.body['auction_id'];
  const bidID = req.body['bid_id'];

  exec(`node ${AUCTION_APP_PATH}/submitBid.js ${org} ${userID} ${auctionID} ${bidID}`, (error, stdout, stderr) => {
    if (error) {
        console.error(error);
        res.json({
          'isSuccess': false,
          'message':`The Bidding ${bidID} was failed: ${error}`
        });
        return;
    }
    if (stderr) {
      console.error(stderr);
      res.json({
        'isSuccess': false,
        'message':`The Bidding ${bidID} was failed: ${stderr}`
      });
      return;
    }
    res.json({
      'isSuccess': true,
      'message':`The Bidding ${bidID} was successful: Auciton-Item(${auctionID})`
    });
  });
});

app.post(`${API_VERSION}/auction/close`, async (req, res)=> {
  const org = req.body['org'];
  const userID = req.body['user_id'];
  const auctionID = req.body['auction_id'];

  exec(`node ${AUCTION_APP_PATH}/closeAuction.js ${org} ${userID} ${auctionID}`, (error, stdout, stderr) => {
    if (error) {
        console.error(error);
        res.json({
          'isSuccess': false,
          'message':`Failed: Auciton ${auctionID} closed - ${error}`
        });
        return;
    }
    if (stderr) {
      console.error(stderr);
      res.json({
        'isSuccess': false,
        'message':`Failed: Auciton ${auctionID} closed - ${stderr}`
      });
      return;
    }
    res.json({
      'isSuccess': true,
      'message': `Auciton ${auctionID} closed`
    });
  });
});

app.post(`${API_VERSION}/auction/bid/reveal`,  (req, res)=> {
  const org = req.body['org'];
  const userID = req.body['user_id'];
  const auctionID = req.body['auctionID'];
  const bidID = req.body['bid_id'];

  exec(`node ${AUCTION_APP_PATH}/revealBid.js ${org} ${userID} ${auctionID} ${bidID}`, (error, stdout, stderr) => {
    if (error) {
        console.error(error);
        res.json({
          'isSuccess': false,
          'message':`Failed: revealBid ${bidID} - ${error}`
        });
        return;
    }
    if (stderr) {
      console.error(error);
      res.json({
        'isSuccess': false,
        'message':`Failed: revealBid ${bidID} - ${stderr}`
      });
      return;
    }

    res.json({
      'isSuccess': true,
      'message': stdout
    });
  });
});

app.post(`${API_VERSION}/auction/end`, async (req, res)=> {
  const org = req.body['org'];
  const userID = req.body['user_id'];
  const auctionID = req.body['auctionID'];

  exec(`node ${AUCTION_APP_PATH}/endAuction.js ${org} ${userID} ${auctionID}`, (error, stdout, stderr) => {
    if (error) {
      console.error(error);
      res.json({
        'isSuccess': false,
        'message':`Failed: End auciton ${auctionID} - ${error}`
      });
      return;
    }
    if (stderr) {
      console.error(stderr);
      res.json({
        'isSuccess': false,
        'message':`Failed: End auciton ${auctionID} - ${stderr}`
      });
      return;
    }
    res.json({
      'isSuccess': true,
      'message': stdout
    });
  });
});