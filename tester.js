var http = require('http');
var net = require('net');
var miniExpress = require('./miniExpress');
var app = miniExpress();

var OK_CODE = '200';
var NOT_FOUND_CODE = '404';
var BAD_PARSE_CODE = '500';
var PORT = 8800;
var UNSUPPORTED_CODE = '405';
var NON_HTTP_CODE = '400';

app.use('/bla', miniExpress.static('./www'));
app.listen(PORT);

//############################################### TEST 1 ####################################################
//test a normal good request with finished header, and no body
setTimeout(function(){
	var goodRequestSetting = {
		host: "localhost",
		port: PORT.toString(),
		path: "/bla/profile.html",
		method: "GET",
		connection: "keep-alive"
	};

	var req = http.request(goodRequestSetting, function(res) {
		res.setEncoding('utf8');
		if (res.statusCode != OK_CODE) {
			console.log("TEST 1 FAILED: status code is not " + OK_CODE + ", it is: " + res.statusCode);
		} else {
			console.log("TEST 1 PASSED!!!   :) ");
		}
	});

	req.on('error', function(e) {
		console.log("TEST 1 PROBLEM: problem with request: " + e.message);
	});

	req.end();
},1000);

//############################################### TEST 2 ####################################################
//test a request that cannot be parsed

setTimeout(function(){
	var client = net.connect({port: PORT.toString()}, function() {
		client.write('ksdjhfkjdshfksjdhfskdhf!\r\n\r\n');
	});
	client.on('data', function(data) {
		try {
			var status = data.toString().split(' ')[1];
			if (status != BAD_PARSE_CODE) {
				console.log("TEST 2 FAILED: status code is not " + BAD_PARSE_CODE + ", it is: " + status);
			} else {
				console.log("TEST 2 PASSED!!!   :) ");
			}
		} catch (e) {
			console.log("TEST 2 PROBLEM: there is no status");
		}
		client.end();
	});
},2000);

//############################################### TEST 3 ####################################################
//test a unsupported request

setTimeout(function(){
	var nonGETRequestSetting = {
		host: "localhost",
		port: PORT.toString(),
		path: "/bla/profile.html",
		method: "FLUFF",
		connection: "keep-alive"
	};

	var req = http.request(nonGETRequestSetting, function(res) {
		res.setEncoding('utf8');
		if (res.statusCode != UNSUPPORTED_CODE) {
			console.log("TEST 3 FAILED: status code is not " + UNSUPPORTED_CODE + ", it is: " + res.statusCode);
		} else {
			console.log("TEST 3 PASSED!!!   :) ");
		}
	});

	req.on('error', function(e) {
		console.log("TEST 3 PROBLEM: problem with request: " + e.message);
	});

	req.end();
},3000);

//############################################### TEST 4 ####################################################
//test request for no such file
setTimeout(function(){
	var goodRequestSetting = {
		host: "localhost",
		port: PORT.toString(),
		path: "/bla/blabla.html",
		method: "GET",
		connection: "keep-alive"
	};

	var req = http.request(goodRequestSetting, function(res) {
		res.setEncoding('utf8');
		if (res.statusCode != NOT_FOUND_CODE) {
			console.log("TEST 4 FAILED: status code is not " + NOT_FOUND_CODE + ", it is: " + res.statusCode);
		} else {
			console.log("TEST 4 PASSED!!!   :) ");
		}
	});

	req.on('error', function(e) {
		console.log("TEST 4 PROBLEM: problem with request: " + e.message);
	});

	req.end();
},4000);


//############################################### TEST 5 ####################################################
//test non http request

setTimeout(function(){
	var client = net.connect({port: PORT.toString()}, function() {
		client.write('GET /bla/profile.html NIRGEFENPROTOCOL/1.1\r\nHost: localhost \r\nPort: 8800\r\n\r\n');
	});
	client.on('data', function(data) {
		try {
			var status = data.toString().split(' ')[1];
			if (status != NON_HTTP_CODE) {
				console.log("TEST 5 FAILED: status code is not " + NON_HTTP_CODE + ", it is: " + status);
			} else {
				console.log("TEST 5 PASSED!!!   :) ");
			}
		} catch (e) {
			console.log("TEST 5 PROBLEM: there is no status");
		}
		client.end();
	});
},5000);

//############################################### TEST 6 ####################################################
//test http version 1.0 + not keep alive = closed socket

setTimeout(function(){
	var firstReq = true;
	var client = net.connect({port: PORT.toString()}, function() {
		client.write('GET /bla/sdfest.html HTTP/1.0\r\nHost: localhost \r\nPort: 8800\r\n\r\n');
	});
	client.on('data', function(data) {
		if (firstReq) {
			setTimeout(function() {
				try {
					client.write('GET /bla/fff.html HTTP/1.1\r\nHost: localhost Port: 8800\r\n\r\n');
					console.log("TEST 6 FAILED: socket should have been closed by now");
				} catch(e) {
					if ((e.message != undefined) && (e.message.indexOf("socket has been ended") != -1) ) {
						console.log("TEST 6 PASSED!!!   :) ");
					} else {
						console.log("TEST 6 PROBLEM: " + e);

					}
				}
				client.end();
			}, 500);
		}
	});
},6000);

//############################################### TEST 7 ####################################################
//test connection: close in header = socket is closed

setTimeout(function(){
	var firstReq = true;
	var client = net.connect({port: PORT.toString()}, function() {
		client.write('GET /bla/sdfest.html HTTP/1.1\r\nHost: localhost \r\nPort: 8800\r\nConnection: close\r\n\r\n');
	});
	client.on('data', function(data) {
		if (firstReq) {
			setTimeout(function() {
				try {
					client.write('GET /bla/fff.html HTTP/1.1\r\nHost: localhost \r\nPort: 8800\r\n\r\n');
					console.log("TEST 7 FAILED: socket should have been closed by now");
				} catch(e) {
					if ((e.message != undefined) && (e.message.indexOf("socket has been ended") != -1) ) {
						console.log("TEST 7 PASSED!!!   :) ");
					} else {
						console.log("TEST 7 PROBLEM: " + e);

					}
				}
				client.end();
			}, 500);
		}
	});
},7000);

//############################################### TEST 8 ####################################################
//test timeout of 2 sec = socket is closed

setTimeout(function(){
	var firstReq = true;
	var client = net.connect({port: PORT.toString()}, function() {
		client.write('GET /bla/sdfest.html HTTP/1.1\r\nHost: localhost \r\nPort: 8800\r\nConnection: close\r\n\r\n');
	});
	setTimeout(function() {
		try {
			client.write('GET /bla/fff.html HTTP/1.1\r\nHost: localhost \r\nPort: 8800\r\n\r\n');
			console.log("TEST 8 FAILED: socket should have been closed by now");
		} catch(e) {
			if ((e.message != undefined) && (e.message.indexOf("socket has been ended") != -1) ) {
				console.log("TEST 8 PASSED!!!   :) ");
			} else {
				console.log("TEST 8 PROBLEM: " + e);

			}
		}
		client.end();
	},2500);
},8000);

//############################################### TEST 9 ####################################################
//test trying to get a file that is not under the root

setTimeout(function(){
	var nonRootRequestSetting = {
		host: "localhost",
		port: PORT.toString(),
		path: "/bla/../profile.html",
		method: "GET",
		connection: "keep-alive"
	};

	var req = http.request(nonRootRequestSetting, function(res) {
		res.setEncoding('utf8');
		if (res.statusCode != BAD_PARSE_CODE) {
			console.log("TEST 9 FAILED: status code is not " + BAD_PARSE_CODE + ", it is: " + res.statusCode);
		} else {
			console.log("TEST 9 PASSED!!!   :) ");
		}
	});

	req.on('error', function(e) {
		console.log("TEST 9 PROBLEM: problem with request: " + e.message);
	});

	req.end();
},11000);

//############################################### TEST 10 ####################################################
//test 2 request in the same write

setTimeout(function(){
	var printed = false;
	var client = net.connect({port: PORT.toString()}, function() {
		client.write('GET /bla/test1.txt HTTP/1.1\r\nHost: localhost \r\nPort: 8800\r\n\r\n' +
					'GET /bla/test2.txt HTTP/1.1\r\nHost: localhost \r\nPort: 8800\r\n\r\n');
	});
	var test1Arrived = false;
	var test2Arrived = false;
	client.on('data', function(data) {
		try {
			var status = data.toString().split(' ')[1];

			if (status != OK_CODE) {
				console.log("TEST 10 FAILED: status code is not " + OK_CODE + ", it is: " + status);
				printed = true;
			}
			if (data.toString().indexOf("This is test")== -1) {
				console.log("TEST 10 FAILED: there is no status and this is not the body we expected");
				printed = true;
			} else {
				if (data.toString().indexOf("This is test 1") != -1) {
					test1Arrived = true;
				}
				if (data.toString().indexOf("This is test 2") != -1) {
					test2Arrived = true;
				}
			}
		} catch(e) {
			console.log("TEST 10 PROBLEM: there is no status");
			printed = true;
		}

		if (test1Arrived && test2Arrived) {
			console.log("TEST 10 PASSED!!!   :) ");
			printed = true;
		}

		setTimeout(function() {
			if (!printed) {
				console.log("TEST 10 FAILED: not both of the files arrived");
			}
			client.end();
		}, 2500);
	});
},12000);

//############################################### TEST 11 ####################################################
//test header is not done

setTimeout(function(){
	var printed = false;
	var client = net.connect({port: PORT.toString()}, function() {
		client.write('GET /bla/test1.txt HTTP/1.1\r\nHost: localhost ');
	});
	setTimeout(function() {
		client.write('Port: 8800\r\n\r\n');
	},500);
	var test1Arrived = false;
	client.on('data', function(data) {
		try {
			var status = data.toString().split(' ')[1];
			if (status != OK_CODE) {
				console.log("TEST 11 FAILED: status code is not " + OK_CODE + ", it is: " + status);
				printed = true;
			}
			if (data.toString().indexOf("This is test")== -1) {
				console.log("TEST 11 FAILED: there is no status and this is not the body we expected");
				printed = true;
			} else {
				if (data.toString().indexOf("This is test 1") != -1) {
					test1Arrived = true;
				}
			}
		} catch(e) {
			console.log("TEST 11 PROBLEM: there is no status");
			printed = true;
		}

		if (test1Arrived) {
			console.log("TEST 11 PASSED!!!   :) ");
			printed = true;
		}

		setTimeout(function() {
			if (!printed) {
				console.log("TEST 11 FAILED: the expected file has not arrived yet (2.5 sec)");
			}
			client.end();
		}, 2500);
	});
},13000);

//############################################### TEST 12 ####################################################
//test body is not done

setTimeout(function(){
	var printed = false;
	var client = net.connect({port: PORT.toString()}, function() {
		client.write('GET /bla/test1.txt HTTP/1.1\r\nHost: localhost \r\nPort: 8800\r\n' +
		'Content-Length: 15' + '\r\n\r\n' + 'bla bla 9');
	});
	setTimeout(function() {
		client.write('blabla\r\n\r\n');
	},500);
	var test1Arrived = false;
	client.on('data', function(data) {
		try {
			var status = data.toString().split(' ')[1];
			if (status != OK_CODE) {
				console.log("TEST 12 FAILED: status code is not " + OK_CODE + ", it is: " + status);
				printed = true;
			}
			if (data.toString().indexOf("This is test")== -1) {
				console.log("TEST 12 FAILED: there is no status and this is not the body we expected");
				printed = true;
			} else {
				if (data.toString().indexOf("This is test 1") != -1) {
					test1Arrived = true;
				}
			}
		} catch(e) {
			console.log("TEST 12 PROBLEM: there is no status");
			printed = true;
		}

		if (test1Arrived) {
			console.log("TEST 12 PASSED!!!   :) ");
			printed = true;
		}

		setTimeout(function() {
			if (!printed) {
				console.log("TEST 12 FAILED: the expected file has not arrived yet (2.5 sec)");
			}
			client.end();
		}, 2500);
	});
},14000);

//############################################### END ####################################################

setTimeout(function(){
	app.close();
},50000); 