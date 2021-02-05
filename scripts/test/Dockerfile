FROM node

RUN apt-get update -qq
RUN apt-get install wait-for-it -y -qq

WORKDIR /usr/src/app

# Context must be the root directory of this repo
COPY package*.json ./
RUN npm install
RUN npm install @graphprotocol/graph-cli

COPY . ./
COPY scripts/test/entrypoint.sh .

CMD ["./entrypoint.sh"]
