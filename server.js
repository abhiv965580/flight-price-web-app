const express = require("express");
const Amadeus = require("amadeus");
const cors = require("cors");

const app = express();
const port = 8080;

const amadeus = new Amadeus({
  clientId: "xoj5UMUzwVDMs7c7OS8dvHGQGf0BqSXo",
  clientSecret: "z63GADK8TGatNi9t",
});

app.use(cors({ origin: "http://localhost:3000" }));

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function getAirlineNames(iataCodes) {
  try {
    const response = await amadeus.referenceData.airlines.get({
      airlineCodes: iataCodes,
    });
    const airlineNames = {};
    response.data.forEach((airline) => {
      airlineNames[airline.iataCode] = airline.businessName;
    });
    return airlineNames;
  } catch (error) {
    console.error(error);
    return null;
  }
}

app.get("/airlinesCodes", async (req, res) => {
  const { iataCode } = req.query;
  try {
    const response = await amadeus.referenceData.airlines.get({
      airlineCodes: iataCode,
    });
    return res.json(response.data);
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
    const airlineCodes = response.data.map(
      (offer) => offer.validatingAirlineCodes[0]
    );
    const uniqueAirlineCodes = [...new Set(airlineCodes)];
    await sleep(1000);
    const airlineNames = await getAirlineNames(uniqueAirlineCodes.join(","));
    const prices = {};
    response.data.forEach((offer) => {
      const airlineCode = offer.validatingAirlineCodes[0];
      const airlineName = airlineNames[airlineCode] || airlineCode;
      if (!prices[airlineName]) {
        prices[airlineName] = offer.price.total;
      }
    });
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
