import { AzureFunction, Context, HttpRequest } from "@azure/functions";

var redis = require("redis");
// Connect to the Azure Cache for Redis over the TLS port using the key.
var cacheHostName = process.env.REDISCACHEHOSTNAME;
var cachePassword = process.env.REDISCACHEKEY;
var cacheConnection = redis.createClient({
  // rediss for TLS
  url: "rediss://" + cacheHostName + ":6380",
  password: cachePassword,
});

console.log("Attempting to connect to " + process.env.REDISCACHEHOSTNAME);
cacheConnection.connect();
console.log("Connected to " + process.env.REDISCACHEHOSTNAME);

const httpTrigger: AzureFunction = async function (
  context: Context,
  req: HttpRequest
): Promise<void> {
  context.log("HTTP trigger function processed a request.");

  // Simple get and put of integral data types into the cache
  const message = await cacheConnection.get("Message");
  console.log("\nCache command: GET Message");
  console.log("Cache response : " + message);

  const responseMessage = message
    ? message
    : "This HTTP triggered function executed successfully but there was a cache miss";

  context.res = {
    // status: 200, /* Defaults to 200 */
    body: responseMessage,
  };
};

export default httpTrigger;
