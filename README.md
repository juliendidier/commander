# Commander

API to launch commands thouth an REST API.

## Requirements

### ElasticSearch

```bash
sudo apt-get install oracle-java8-jdk
sudo update-alternatives --config java

wget http://download.elasticsearch.org/elasticsearch/elasticsearch/elasticsearch-1.4.4.deb
sudo dpkg -i elasticsearch-1.4.4.deb
```

### Node

```bash
sudo curl -sL https://deb.nodesource.com/setup_6.x | sudo bash -
```

## Install

```bash
git clone git@github.com:juliendidier/commander.git && cd commander
npm install
```

## Exec

```bash
node app.js
```
