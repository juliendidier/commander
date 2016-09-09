var express = require('express');
var app = express();

var sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database('commander.sqlite3');

var createEngine = require('node-twig').createEngine;
app.engine('.twig', createEngine({
    root: __dirname + '/views',
}));

app.set('views', './views');
app.set('view engine', 'twig');

app.get('/', function (req, res) {
    var commands = [];

    db.each("SELECT hub, place, thing, action FROM command", function(err, row) {
        commands.push({hub: row.hub, place: row.place, thing: row.thing, action: row.action});
    });

    res.render('index.html.twig', {
        context: {
            foo: 'bar',
            commands: commands
        }
    });
});

app.get('/install', function (req, res) {
    db.serialize(function() {
        db.run('CREATE TABLE IF NOT EXISTS command (hub VARCHAR(20), place VARCHAR(20), thing VARCHAR(20), action VARCHAR(255), command TEXT)');
        var stmt = db.prepare('INSERT INTO command VALUES ($hub, $place, $thing, $action, $command)');

        stmt.run({$hub: '', $place: 'hall', $thing: 'light', $action: 'switch on', $command: ''});
        stmt.run({$hub: '', $place: 'hall', $thing: 'light', $action: 'switch off', $command: ''});
        stmt.run({$hub: '', $place: 'room', $thing: 'light', $action: 'cozy', $command: ''});
        stmt.run({$hub: '', $place: '', $thing: 'light', $action: 'backroom', $command: ''});
        stmt.run({$hub: 'pinas', $place: '', $thing: 'openvpn', $action: 'restart', $command: ''});
        stmt.run({$hub: 'pinas', $place: '', $thing: 'deluge', $action: 'restart', $command: ''});

        stmt.finalize();
        console.log('database configured');
    });

    res.render('install.html.twig');
});

app.listen(3000, function () {
    console.log('commander listening on port 3000...');

    // db.close();
});
