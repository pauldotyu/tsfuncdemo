# Azure Function Demo using TypeScript

> References:
> https://docs.microsoft.com/en-us/azure/azure-functions/create-first-function-cli-typescript?tabs=azure-cli%2Cbrowser

To run the code locally:

```bash
# drop into src directory
npm install
npm start
```

To deploy resources into Azure:

```bash
# drop into terraform directory
az login
terraform init
terrafomm plan -out myplan
terraform apply myplan
```

To publish the code to Azure:

```bash
# drop into src directory
npm run build:production
func azure functionapp publish <APP_NAME>
func azure functionapp logstream <APP_NAME> --browser
```

To run a load test using Artillery:

```bash
npm install -g artillery
artillery quick -c 200 -n 400 https://<APP_NAME>.azurewebsites.net/api/httpexample\?name\=paul
```

The load test should go very well. Without any dependencies you should see an average of 200-400 requests per second for a total of 80K requests; not bad.

Now, add Redis to the mix.

```bash

export REDISCACHEHOSTNAME=<REDIS_NAME>.redis.cache.windows.net
export REDISCACHEKEY=XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX

# test your redis instance
redis-cli -h <REDIS_NAME>.redis.cache.windows.net -p 6380 -a <REDIS_KEY>

# drop into the src directory
npm install redis bluebird
```

Add this bit of code to connect to redis - add it before your function definition

```javascript
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
```

If you don't already have a `local.settings.json` file in your repo, create the file and add this:

```json
{
  "IsEncrypted": false,
  "Values": {
    "FUNCTIONS_WORKER_RUNTIME": "node",
    "AzureWebJobsStorage": ""
  }
}
```