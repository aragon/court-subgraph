# Aragon Court Subgraph

![subgraph model](./model.png)

### Local

To test the subgraph locally please do the following tasks

##### 1. Install Ganache and The Graph
First make sure you have both Ganache and Graph CLIs
 
```bash
  npm install -g ganache-cli
  npm install -g @graphprotocol/graph-cli
```

##### 2. Start Ganache node
Start a local ganache in a separate terminal with the following params:

```bash
  ganache-cli -h 0.0.0.0 -i 15 --gasLimit 8000000 --deterministic
```

##### 3. Start Graph node
In another terminal, clone the graph node and start it:

```bash
  git clone https://github.com/graphprotocol/graph-node/
  cd graph-node/docker
  npm i
  rm -rf data
  docker-compose up
```

> If docker prompts you with the error `The reorg threshold 50 is larger than the size of the chain 7, you probably want to set the ETHEREUM_REORG_THRESHOLD environment variable to 0`, 
  simply add a new env variable in `docker-compose.yml` named `ETHEREUM_REORG_THRESHOLD` assigning it to 0 and start it again.

##### 4. Deploy local Aragon Court instance
To deploy a local instance run the following commands on a separate terminal:

```bash
  git clone https://github.com/aragon/aragon-network-deploy/
  cd aragon-network-deploy
  npm i
  npm run deploy:court:rpc
```

##### 5. Deploy Aragon Court subgraph
You can use the provided deployment script to create a manifest file with the providing the court deployed address as follows:

```bash
  ./scripts/deploy NETWORK=rpc COURT==<COURT_ADDRESS>
``` 
