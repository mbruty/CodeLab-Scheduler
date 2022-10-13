const http = require("http");
const { exec } = require("child_process");
const { promisify } = require("util");
const execAsync = promisify(exec);
const requestListener = async function (req, res) {
  console.log("I've got a message!");
  if (req.method == "POST") {
    let body = "";
    req.on("data", (data) => {
      body += data;
    });
    req.on("end", () => {
      const data = JSON.parse(body);
      spawnProcess(data.language);
      res.writeHead(200);
      res.end();
    });
  } else {
    res.writeHead(200);
    res.end();
  }
};
const server = http.createServer(requestListener);
server.listen(3300);

function spawnProcess(language) {
  let image = "";
  switch (language) {
    case "JavaScript":
      image = "bun-engine";
      break;
    case "TypeScript":
      image = "typescript-engine";
      break;
    case "C#":
      image = "dotnet-engine";
      break;
    default:
      throw "No engine found";
  }
  // Run the docker image
  // -d detached
  // --rm remove the container after is is finished
  // ${image} The docker image to use
  // -m Limit the memory usage to 512mb
  // -cpus="1" Limit the amount of cpus to 1
  exec(`docker run -d --rm ${image} -m 512m -cpus="1" `);
}

// Always keep atleast 1 container running at all times
// This will speed up response times considerably

async function startRunning(image) {
  const x = await execAsync(`docker ps | grep ${image} | wc -l`);
  if (parseInt(x.stdout) != 0) {
    console.log(image, " is already running");
  } else {
    console.log("warming up ", image);
    exec(`docker run -d --rm ${image} -m 512m -cpus="1" `);
  }
}

startRunning("bun-engine");
startRunning("dotnet-engine");
startRunning("typescript-engine");
