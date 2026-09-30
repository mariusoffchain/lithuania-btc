/** Country settings shared by the browser, snapshot updater and release builder. */
export const COUNTRY = Object.freeze({
  name: "Lithuania BTC",
  origin: "https://lithuaniabtc.com",
  timezone: "Europe/Vilnius",
  boundaryPath: "data/lithuania.geojson",
  center: [23.88, 55.17],
  bounds: [
    [20.85, 53.88],
    [26.84, 56.46],
  ],
  navigationBounds: [
    [15, 48],
    [33, 63],
  ],
  merchantsURL:
    "https://api.btcmap.org/v4/places/search?lat=55.17&lon=23.88&radius_km=250",
  repository: "https://github.com/mariusoffchain/lithuania-btc",
});
