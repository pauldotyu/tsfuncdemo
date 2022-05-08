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
  const name = req.query.name || (req.body && req.body.name);

  // Perform cache operations using the cache connection object...

  // Simple PING command
  console.log("\nCache command: PING");
  console.log("Cache response : " + (await cacheConnection.ping()));

  // Simple get and put of integral data types into the cache
  console.log("\nCache command: GET Message");
  console.log("Cache response : " + (await cacheConnection.get("Message")));

  console.log("\nCache command: SET Message");
  console.log(
    "Cache response : " +
      (await cacheConnection.set(
        "Message",
        "Hello " + name + "! The cache is working from Node.js!"
      ))
  );

  // Demonstrate "SET Message" executed as expected...
  console.log("\nCache command: GET Message");
  console.log("Cache response : " + (await cacheConnection.get("Message")));

  // Get the client list, useful to see if connection list is growing...
  console.log("\nCache command: CLIENT LIST");
  console.log(
    "Cache response : " +
      (await cacheConnection.sendCommand(["CLIENT", "LIST"]))
  );

  console.log("\nDone");

  // const responseMessage = name
  // ? "Hello, " + name + ". This HTTP triggered function executed successfully."
  // : "This HTTP triggered function executed successfully. Pass a name in the query string or in the request body for a personalized response.";

  const responseMessage = name
    ? await cacheConnection.get("Message")
    : "This HTTP triggered function executed successfully. Pass a name in the query string or in the request body for a personalized response.";

  context.res = {
    // status: 200, /* Defaults to 200 */
    body: responseMessage,
  };
};

export default httpTrigger;
