var http = require('http');

var context;

exports.handler = (event, context, callback) => {
    handleRequest(event, context);
}

handleRequest = (event, context) => {
    var options = {};
    setOptions(options, event);
    request(options, event, context);
}

setOptions = (options, event) => {
    options.host = event.requestParams.hostname;
    options.port = event.requestParams.port;
    options.path = event.requestParams.path;
    options.method = event.requestParams.method;
    
    setHeaders(options, event);
}

setHeaders = (options, event) => {
    options.headers = {};

    if (event.params && event.params.header 
        && Object.keys(event.params.header).length > 0) {
        options.headers = event.params.header
    }
    
    if (event.context["user-agent"]) {
        options.headers["User-Agent"] = event.context["user-agent"];
    }

    if (event.context["source-ip"]) {
        options.headers["X-Forwarded-For"] = event.context["source-ip"];
    }

    if (!options.headers["Content-Type"]) {
        options.headers["Content-Type"] = "application/json";
    }
}

requestCallback = (context, response) => {
    var responseString = '';

    response.on('data', (chunk) => {
        responseString += chunk;
    });
  
    response.on('end', () => {
        var jsonResponse = '{}';

        if (responseString){
            jsonResponse = JSON.parse(responseString);
        }

        var output = {
            status: response.statusCode,
            bodyJson: jsonResponse,
            headers: response.headers
        };
        
        if (response.statusCode == 200) {
            context.succeed(output);
            return true;
        }

        output.bodyJson = responseString;
        context.fail(JSON.stringify(output));
    });
} 

request = (options, event, context) => {
    var req = http.request(options, requestCallback.bind(null, context));
    
    if (event.bodyJson) {
        console.log(JSON.stringify(event.bodyJson));
        req.write(JSON.stringify(event.bodyJson));
    }

    req.on('error', function(err) {
        context.fail(JSON.stringify({status: 500, bodyJson: { message: "Internal server error" }}));
    });
    
    req.end();
}
