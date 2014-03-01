
function someFunction(){} 				//all functions inherit from Function
function otherFunction(){} 				//that will inherit from the 
										//first function on the next line
otherFunction.prototype = someFunction; //and here is the inherit

A = Object.prototype;					//Object.prototype.__proto__ == null sp
										//A.__proto__ will be the same
B = Function.prototype;					//Function.prototype.proto == Object.prototype
										//so B.__proto__==Object.prototype==A
C = someFunction;    					//all function inherit form Function, 
										//someFunction is a function,
										//so someFunction.__proto__==Function.prototype==B
D = new otherFunction(); 				//otherFunction.prototype==someFunction==C.
										//when make x=new y(), x.__proto__==y.prototype,
										//so D.__proto__==otherFunction.prototype==someFunction==C.

//checking it all works
function checkAll() {
	alert(A.__proto__==null);
	alert(B.__proto__==A);
	alert(C.__proto__==B);
	alert(D.__proto__==C);
}