var http = require('http');
var net = require('net');
var miniExpress = require('./miniExpress');
var app = miniExpress();

var OK_CODE = '200';
var PORT = 8800;

app.use('/bla', miniExpress.static('./www'));
app.listen(PORT);

var howManyFinished = 0;

var client = net.connect({port: PORT.toString()}, function() {});
try {
	var i=0;
	var allClients = [];
	for (i=0; i< 100; i++) {
		var client = net.connect({port: PORT.toString()}, function() {});
		allClients[i] = client;
		client.on('data',function(data) {
			console.log("good");
			setTimeout(function() {
				client.end();
				howManyFinished++;
			}, 500);
		});
		client.on('error',function(err) {
			console.log(err);
			setTimeout(function() {
				client.end();
				howManyFinished++;
			}, 500);
		});
	}
} catch(e) {
	console.log("problem");
}

for (i=0; i< 100; i++) {
	allClients[i].write('GET /bla/test1.txt HTTP/1.1\r\nHost: localhost Port: 8800\r\n\r\n');
}

setTimeout(function() {
	app.close();
},10000);