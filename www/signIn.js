var mainId = "defaultMainForm";
var footerId = "footer";
var calculatorFormId = "calculatorForm";
var allowedUsername = "admin";
var allowedPassword = "admin";

function signIn(usernameId, passwordId) {
	var username = document.getElementById(usernameId).value;
	var password = document.getElementById(passwordId).value;
	document.getElementById(usernameId).value = "";
	document.getElementById(passwordId).value = "";
	
	
	if ((username === allowedUsername) &&
		(password === allowedPassword)) {
		document.getElementById(mainId).style.display = 'none';
		document.getElementById(footerId).style.display = 'none';
		document.getElementById(calculatorFormId).style.display = 'block';
	}
}
