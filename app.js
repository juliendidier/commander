var express = require('express');
var app = express();

var elasticsearch = require('elasticsearch');
var client = elasticsearch.Client({
  host: 'localhost:9200'
});

var createEngine = require('node-twig').createEngine;
app.engine('.twig', createEngine({
    root: __dirname + '/views',
}));

app.set('views', './views');
app.set('view engine', 'twig');

app.get('/', function (req, res) {
    var commands = [];

    client.search({
        index: 'commander',
        type: 'command',
        body: {
            query: {
                match_all: {}
            }
        }
    }).then(function(response) {
        var hits = response.hits.hits;

        hits.forEach(function(hit) {
            var command = hit._source;

            console.log(hit);
            commands.push({hub: command.hub, place: command.place, thing: command.thing, action: command.action});
        });

        res.render('index.html.twig', {
            context: {
                foo: 'bar',
                commands: commands
            }
        });
    }, function(error) {
        console.trace(error.message);
    });
});

app.get('/install', function (req, res) {
    client.indices.delete({
        index: 'commander',
        type: '_all',
        id: '1'
    }, function (error, response) {
        client.indices.putMapping({
            index: 'commander',
            type: "command",
            body: {
                properties: {
                    hub: { type: "string" },
                    place: { type: "string" },
                    thing: { type: "string" },
                    action: { type: "string" }
                }
            }
        });

        var commands = [
            {hub: '', place: 'hall', thing: 'light', action: 'switch on', command: ''},
            {hub: '', place: 'hall', thing: 'light', action: 'switch off', command: ''},
            {hub: '', place: 'room', thing: 'light', action: 'cozy', command: ''},
            {hub: '', place: '', thing: 'light', action: 'backroom', command: ''},
            {hub: 'pinas', place: '', thing: 'openvpn', action: 'restart', command: ''},
            {hub: 'pinas', place: '', thing: 'deluge', action: 'restart', command: ''}
        ];

        commands.forEach(function(command) {
            client.index({
                index: "commander",
                type: "command",
                body: {
                    hub: command.hub,
                    place: command.place,
                    thing: command.thing,
                    action: command.action
                }
            });
        });

        console.log('index configured');
    });

    res.render('install.html.twig');
});

app.listen(3000, function () {
    console.log('commander listening on port 3000...');
});
