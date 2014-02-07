var http = require('http');
var url = require('url');
var querystring = require('querystring');
var requestUrl = require("request");
var libxmljs = require('libxmljs');
var xpath = require('xpath');
var dom = require('xmldom').DOMParser;


function processPost(request, response, callback) {
    var queryData = "";

    if(request.method == 'POST') {
        request.on('data', function(data) {
            queryData += data;
            if(queryData.length > 1e6) {
                queryData = "";
                response.writeHead(413, {'Content-Type': 'text/plain'}).end();
                request.connection.destroy();
            }
        });

        request.on('end', function() {
            //response.body = querystring.parse(queryData);
            var xmlDoc = new dom().parseFromString(queryData);

            var username = xpath.select("//username/text()", xmlDoc).toString();
            var password = xpath.select("//password/text()", xmlDoc).toString();
            var sourceIp = xpath.select("//sourceIp/text()", xmlDoc).toString();
            
            console.log(username);
            console.log(password);
            console.log(sourceIp);
            
            
            var urlParts = url.parse(request.url, true);
            //console.log(urlParts.query);
            
            var sfUrl ='v4dot1-simulation.cs7.force.com';
            //var sfUrl = urlParts.query['url'];//'v4dot1-simulation.cs7.force.com';
            //console.log(sfUrl);
            
            
            //var url = 'http://www.google.fr';
            
            

            var req = http.get({
                    host: sfUrl,
                    path: '/printAuthentication?username=' + username + '&password=' + password + '&sourceIp=' + sourceIp
                }, function(res) {
                var bodyChunks = [];
                res.on('data', function(chunk) {
                    bodyChunks.push(chunk);
                }).on('end', function() {
                    var body = Buffer.concat(bodyChunks);
                    response.post = body;
                    callback();
                })
            });
            req.on('error', function(e) {
                console.log('ERROR: ' + e.message);
            });

            
            
            /*http.request({
                  host: url,
                  port: 80,
                  path: '',
                  method: 'GET'
                }, function(res) {
                    console.log(res);
              console.log('STATUS: ' + res.statusCode);
              console.log('HEADERS: ' + res.headers);
              res.setEncoding('utf8');
              res.on('data', function (chunk) {
                console.log('BODY: ' + chunk);
              });
              
            }).end();*/
            
        });
    }
}

http.createServer(function(request, response) {
    if(request.method == 'POST') {
        processPost(request, response, function() {
            response.writeHead(200, "OK", {'Content-Type': 'text/xml'});
            response.write('<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"><soapenv:Body><AuthenticateResponse xmlns="urn:authentication.soap.sforce.com"><Authenticated>', 'utf8');
            response.write(response.post, 'utf8');
            response.write('</Authenticated></AuthenticateResponse></soapenv:Body></soapenv:Envelope>', 'utf8');
            response.end();
        });
    } else {
        response.writeHead(405, {'Content-Type': 'text/plain'});
        response.end();
    }

}).listen(8080);
