function calculator() {
	var defaultValue = 0;
	var currentValue = defaultValue;
	var resultElem = result;
	var inputElem = input;
	
	this.add = function(addedInput) {
		currentValue += addedInput;
		return currentValue;
	}
	this.multiply = function(multiplyInput) {
		currentValue *= multiplyInput;
		return currentValue;
	}
	this.clear = function() {
		currentValue = defaultValue;
		return currentValue;
	}
	
	this.changeDefault = function(newDefaultValue) {
		defaultValue = newDefaultValue;
	}
}

var inputId = "input";
var resultId = "result";
var settingsId = "settings";
var plusId = "plus";
var multId = "mult";
var clearId = "clear";
var dialogId = "dialog";
var okId = "ok";
var settingsInput = "defaultVal";
var nonValidInputMessage = "Please enter a valid number.";

var defaultInput = "";

$( "#"+dialogId ).hide();

var calc = new calculator(document.getElementById(resultId), document.getElementById(inputId));

function getInputVal() {
	var inputVal = parseInt($("#"+inputId).val(), 10);
	if (!inputVal) {
		inputVal = 0;
	}
	return inputVal;
}

function setResult(newValue) {
	$("#" + resultId).val(newValue);
}

$("#" + plusId).click(function() {
	var addMethod = calc.add;
	var newValue = addMethod(getInputVal());
	setResult(newValue);
});

$("#" + multId).click(function() {
	setResult(calc.multiply(getInputVal()));
});

$("#"+clearId).click(function() {
	setResult(calc.clear());
	$("#"+inputId).val(defaultInput);
});

$("#"+inputId).on( "keypress", function( event ) {
	if ((event.which !=8 && event.which < 48) || event.which > 57) {
		alert(nonValidInputMessage);
		return false;
	}
	return true;
});

$("#"+settingsId).click(function() {
	$(function() {
		$( "#"+dialogId ).dialog();
	});
	$("#"+settingsInput).on( "keypress", function( event ) {
		if (((event.which !=8 && event.which < 48) || event.which > 57) &&
				(!(event.which == 45 && this.selectionStart == 0)) ){
			alert(nonValidInputMessage);
			return false;
		}
		return true;
	});
	$("#"+okId).click(function() {
		calc.changeDefault(parseInt($("#"+settingsInput).val(), 10));
		$( "#"+dialogId ).dialog( "close" );
	});
});
