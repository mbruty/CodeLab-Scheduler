const DockerEvents = require("docker-events");
const Dockerode = require("dockerode");
const docker = new Dockerode();
const emitter = new DockerEvents({ docker });

emitter.on("connect", function() {
  console.log("connected to docker api");
});

emitter.on("die", function(message) {
  spawnProcess(message.from);
});

emitter.start();

function getImageForLanguage(language) {
  switch (language) {
    case "JavaScript":
      return "ghcr.io/mbruty/mike-codelab-codeengine/bun-engine";
    case "TypeScript":
      return "ghcr.io/mbruty/mike-codelab-codeengine/typescript-engine";
    case "C#":
      return "ghcr.io/mbruty/mike-codelab-codeengine/dotnet-engine";
    case "Python":
      return "ghcr.io/mbruty/mike-codelab-codeengine/python-engine";
    default:
      throw "No engine found";
  }
}

function spawnProcess(image) {
  // Run the docker image
  // -d detached
  // --rm remove the container after is is finished
  // ${image} The docker image to use
  // -m Limit the memory usage to 512mb
  // -cpus="1" Limit the amount of cpus to 1
    ["-d", "--rm", "-m 512", "-cpus=1"],
    // 
  docker.run(
    image,
    "",
    null,
    {
      HostConfig: {
        Memory: 5.12e8, // Max 512MB of RAM
        DiskQuota: 5.12e8, // Max 512 MB, prevent zip bombs
        AutoRemove: true,
      }
    }
  );
}

// Always keep atleast 1 container running at all times
// This will speed up response times considerably

async function warmup(numRequired) {
  const images = {
    // "ghcr.io/mbruty/mike-codelab-codeengine/bun-engine": 0,
    "ghcr.io/mbruty/mike-codelab-codeengine/typescript-engine": 0,
    // "ghcr.io/mbruty/mike-codelab-codeengine/dotnet-engine": 0,
    "ghcr.io/mbruty/mike-codelab-codeengine/python-engine": 0
  }
  const containers = await docker.listContainers();
  for (const container of containers) {
    images[container.Image]++;
  }

  for (const image in images) {
    const numToCreate = numRequired - images[image];
    for (let i = 0; i < numToCreate; i++) {
      spawnProcess(image);
    }
  }

}

warmup(2);