var express = require('express');
var app = express();
var router = express.Router();

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

const child_process = require('child_process');

router.get('/', function (req, res) {
    var commands = [];

    client.search({
        index: 'commander',
        type: 'command',
        body: {
            query: {
                match_all: {}
            }
        }
    }).then(function (response) {
        var hits = response.hits.hits;

        hits.forEach(function(hit) {
            var command = hit._source;

            commands.push({
                id: hit._id,
                place: command.place,
                thing: command.thing,
                action: command.action
            });
        });

        res.render('index.html.twig', {
            context: {
                foo: 'bar',
                commands: commands
            }
        });
    }, function (error) {
        console.trace(error.message);
    });
});

router.get('/api/commands/:id/launch', function (req, res) {
    client.search({
        index: 'commander',
        type: 'command',
        body: {
            query: {
                terms : {
                    _id: [ req.params.id ]
                }
            }
        }
    }).then(function (response) {

        var hits = response.hits.hits;
        var commands = [];

        if (hits.length == 0) {
            return res.send(JSON.stringify({
                error: "no command found with id #${req.params.id}"
            }));
        }

        var command = hits[0]._source;
        child_process.exec(command.command, {
            env: Object.assign({}, process.env, { PATH: process.env.PATH + ':/usr/local/bin' }),
            shell: "/bin/sh"
        }, (error, stdout, stderr) => {
            if (error) {
                return res.send(JSON.stringify({
                    error: error,
                    stdout: stdout,
                    stderr: stderr
                }));
            }

            return res.send(JSON.stringify({
                stdout: stdout,
                stderr: stderr
            }));
        });
    }, function (error) {
        console.trace(error.message);

        return res.send(JSON.stringify({
            error: error.message
        }));
    });

});

router.get('/search', function (req, res) {
    var q = req.query.q;

    if (q == '') {
        return res.redirect('/');
    }

    client.search({
        index: 'commander',
        type: 'command',
        body: {
            query: {
                simple_query_string : {
                    query: q,
                    analyzer: "snowball",
                    fields: ["place", "thing", "action", "command"],
                    default_operator: "and"
                }
            }
        }
    }).then(function (response) {
        var hits = response.hits.hits;
        var commands = [];

        hits.forEach(function (hit) {
            var command = hit._source;

            commands.push({
                id: hit._id,
                place: command.place,
                thing: command.thing,
                action: command.action,
                command: command.command
            });
        });

        res.render('index.html.twig', {
            context: {
                q: q,
                foo: 'bar',
                commands: commands
            }
        });
    }, function (error) {
        console.trace(error.message);
    });
});

router.get('/install', function (req, res) {
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
                    place: { type: "string" },
                    thing: { type: "string" },
                    action: { type: "string" },
                    command: { type: "string" }
                }
            }
        });

        var commands = [
            {
                place: 'hall',
                thing: 'light',
                action: 'switch on',
                command: "/usr/local/bin/gpio -g mode 3 out && /usr/local/bin/gpio -g write 3 1"
            },
            {
                place: 'hall',
                thing: 'light',
                action: 'switch off',
                command: "/usr/local/bin/gpio -g mode 3 out && /usr/local/bin/gpio -g write 3 0"
            },
            {
                place: 'room',
                thing: 'light',
                action: 'cozy',
                command: null
            },
            {
                place: null,
                thing: 'light',
                action: 'backroom',
                command: null
            },
            {
                place: 'pinas',
                thing: 'openvpn',
                action: 'restart',
                command: null
            },
            {
                place: 'pinas',
                thing: 'deluge',
                action: 'restart',
                command: null
            }
        ];

        commands.forEach(function(command) {
            client.index({
                index: "commander",
                type: "command",
                body: {
                    place: command.place,
                    thing: command.thing,
                    action: command.action,
                    command: command.command
                }
            });
        });

        console.log('index configured');
    });

    res.render('install.html.twig');
});

app.use('/', router);

app.listen(3000, function () {
    console.log('commander listening on port 3000...');
});
