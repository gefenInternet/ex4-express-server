function objToString (obj) {
	var str = '';
	for (var p in obj) {
		if (obj.hasOwnProperty(p)) {
			if(p === 'resourceMap')
			{
				str += '---' + p + '---<br>' + objToString(obj[p]);
			}
			else
			{
				str += p + ' :: ' + obj[p] + '<br>';
			}
		}
	}
	return str;
}
function requestError(genericHtml,code){

	var requestType = {'400' : "I don't know what you are doing, but it's tear my code a parts.<br>you have 400 error code, it's mean that the request cannot be fulfilled due to bad syntax.<br><br>Please, go away...",
					   '403' : "I don't know what you are doing, but it's tear my code a parts.<br>you have 403 error code, it's mean that i'm (the srver) refuses to allow the requested action.<br><br>Please, go away...",
					   '404' : "I don't know what you are doing, but it's tear my code a parts.<br>you have 404 error code, it's mean that the requested file cannot be found.<br><br>Please, go away to another page...",
					   '405' : "I don't know what you are doing, but it's tear my code a parts.<br>you have 405 error code, it's mean that the request method not supported by that resource.<br><br>Please, go away... ",
					   '500' : "I don't know what you are doing, but it's tear my code a parts.<br>you have 500 error code, it's mean that we have \"An internal Server Error\".<br><br>although we both know that is my own fault, please, go away..."
					   };

	if(requestType[code] === undefined)
	{
		code = '500';
	}
	genericHtml = genericHtml.replace("<body>","<body>"+requestType[code]);

	return(genericHtml);
}
exports.requestError = requestError;