//  optimizations.js

Log = console.log
console.log = function() {
	document.body.appendChild( document.createElement('div')).innerHTML = Array.prototype.join.apply(arguments,[" "])
	Log.apply(console,arguments)
}

table = document.body.appendChild(document.createElement('table'))
row = function(x,y) { 
	tr = table.appendChild(document.createElement('tr'))
	
	tr.appendChild(document.createElement('td')).innerHTML = x
	tr.appendChild(document.createElement('td')).innerHTML = y
}

times = function (msg,f)  {
	var start = (new Date()).getTime()
	for (var i = 0; i < 1000000; ++i) f(i)
	var stop = (new Date()).getTime()
	return msg + " " + (stop - start) + "ms"
}

var zeros = ones = twos = threes = fours = fives = sixes = sevens = eights = nines = 0
numbers = []
for (var i = 0; i < 1000000; ++i) numbers.push(Math.floor(Math.random()*10))

var methods = [ "zero","one","two","three","four","five","six","seven","eight","nine" ];
invokes = numbers.map(function(x) { return methods[x] })

row(times("Nothings", function(x) {}),'')

var adds = 0
row(times("Additions", function(x) { ++adds }),'')

row('',times("Dynamic Switches with Numbers", function(x) {
	switch(numbers[x]) {
		case 9: ++nines; break;			
		case 8: ++eights; break;
		case 7: ++sevens; break;
		case 6: ++sixes; break;
		case 5: ++fives; break;
		case 4: ++fours; break;
		case 3: ++threes; break;
		case 2: ++twos; break;
		case 1: ++ones; break;
		case 0: ++zeros; break;
		default:
			console.log("undefined ", numbers[x]);
	}}
))

row('',times("Dynamic Switch with String", function(x) {
	switch(invokes[x]) {	
		case "nine": ++nines; break;
		case "eight": ++eights; break;
		case "seven": ++sevens; break;
		case "six": ++sixes; break;
		case "five": ++fives; break;
		case "four": ++fours; break;
		case "three": ++threes; break;
		case "two": ++twos; break;
		case "one": ++ones; break;
		case "zero": ++zeros; break;
		default:
			console.log("undefined ", invokes[x])
	}}
))

obj = { 
	0: function() { return ++zeros },
	1: function() { return ++ones },
	2: function() { return ++twos },
	3: function() { return ++threes },
	4: function() { return ++fours },
	5: function() { return ++fives },
	6: function() { return ++sixes },
	7: function() { return ++sevens },
	8: function() { return ++eights },
	9: function() { return ++nines },
};

row(times("Dynamic Object Dispatches with Numbers w/o guard", 
	function(x) { obj[numbers[x]]() }
),times("Dynamic Object Dispatches with Numbers w/ guard",
	function(x) {  obj.hasOwnProperty(numbers[x]) ? obj[numbers[x]]() : console.log("undefined", numbers[x]) }
))

obj2= {
	zero: function() { return ++zeros },
	one: function() { return ++ones },
	two: function() { return ++twos },
	three: function() { return ++threes },
	four: function() { return ++fours },
	five: function() { return ++fives },
	six: function() { return ++sixes },
	seven: function() { return ++sevens },
	eight: function() { return ++eights },
	nine: function() { return ++nines },
};

row(times("Dynamic Object Dispatches with Strings w/o guard", 
	function(x) { obj2[invokes[x]]() }
),times("Dynamic Object Dispatches with Strings w/ guard",
	function(x) {  obj2.hasOwnProperty(invokes[x]) ? obj2[invokes[x]]() : console.log("undefined", invokes[x]) }
))
	
arr = [
	function() { return ++zeros },
	function() { return ++ones },
	function() { return ++twos },
	function() { return ++threes },
	function() { return ++fours },
	function() { return ++fives },
	function() { return ++sixes },
	function() { return ++sevens },
	function() { return ++eights },
	function() { return ++nines },
]

row(times("Dynamic Array Dispatches with Numbers w/o guard",
	function(x) {  arr[numbers[x]]() }
),times("Dynamic Array Dispatches with Numbers w/ guard",
	function(x) {  (numbers[x] >= 0 && numbers[x] < arr.length) ? arr[numbers[x]]() : console.log("undefined", numbers[x]) }
))


obj = { zero :  function() { ++zeros } }
row(times("Static Object Dispatches w/o guard",
	function(x) { obj.zero() }
),times("Static Object Dispatches w/ guard",
	function(x) { typeof(obj['zero'] == 'function') ? obj.zero() : console.log("undefined") }
))

arr = [ function() { ++zeros } ]
row(times("Static Array Dispatches w/o guard",
	function(x) { arr[0]() }
),'')

foo = bar = baz = 0
row('',times("Static Switch Dispatches",
	function(x) { switch(0) {	
		case 0: ++zeros; break;
		default:
			console.log("undefined ", numbers[x]);
	}}
))

row('',times("Static Switch Dispatches for String",
	function(x) { switch("foo") {
		case "bar": return ++bar; break;
		case "baz": return ++baz; break;
		case "foo": return ++foo; break;
		default: console.log("undefined")
	}}
))

obj = { bar : function() { return ++bar }, baz: function() { return ++baz }, foo : function() { return ++foo } }
row(times("Static Object Dispatches for String w/o guard",
	function(x) { obj['foo']() }
),times("Static Object Dispatches for String w/ guard",
	function(x) { typeof(obj['foo']) == 'function' ? obj['foo']() : console.log("undefined") }
))

narf = {}
narf.foo = function() { ++foo }
row(times("Static Object Dispatches via assigned property w/o guard",
	function(x) { narf.foo() }
),times("Static Object Dispatches  via assigned property w/ guard",
	function(x) { typeof(narf.foo) == "function" ? narf.foo() : console.log("undefined") }
))

row('',times("Static Object Dispatches  via assigned property w/ guard (via string)",
	function(x) { typeof(narf['foo']) == "function" ? narf.foo() : console.log("undefined") }
))

function Foo() { return ++foo }
row(times("Static Named Function Dispatch",
	function(x) { Foo() }
),'')

var FOON = 0
var FOO = function() { return ++FOON }
row(times("Static Variable Function Dispatch",
	function(x) { FOO() }
),'')

