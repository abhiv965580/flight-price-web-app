const express = require("express");
const Amadeus = require("amadeus");
const cors = require('cors');

const app = express();
const port = 8080;

// Replace these values with your Amadeus API credentials
const amadeus = new Amadeus({
  clientId: "xoj5UMUzwVDMs7c7OS8dvHGQGf0BqSXo",
  clientSecret: "z63GADK8TGatNi9t",
});

app.use(cors({ origin: 'http://localhost:3000' }));

app.get("/airlinesCodes", async (req, res) => {
  const { iataCode } = req.query;
  try {
    const response = await amadeus.referenceData.airlines.get({
      airlineCodes: iataCode,
    });
    console.log(response.data[0].businessName);
    return res.json(response.data[0].businessName);
  } catch (error) {
    console.error(error);
    return null;
  }
});

app.get("/prices", async (req, res) => {
  const { source, destination, departureDate } = req.query;
  try {
    const response = await amadeus.shopping.flightOffersSearch.get({
      originLocationCode: source,
      destinationLocationCode: destination,
      departureDate,
      adults: 1,
      currencyCode: "INR",
    });
    const prices = {};
    response.data.forEach((offer) => {
      const airlineCode = offer.validatingAirlineCodes[0];
      console.log(airlineCode);
      if (!prices[airlineCode]) {
        prices[airlineCode] = offer.price.total;
      }
    });
    console.log(prices);
    res.json(prices);
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ error: "An error occurred while fetching flight prices" });
  }
});

app.listen(port, () => {
  console.log(`Flight web app listening at http://localhost:${port}`);
});
