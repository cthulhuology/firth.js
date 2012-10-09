//  optimizations.js

Log = console.log
console.log = function() {
	document.body.appendChild( document.createElement('div')).innerHTML = Array.prototype.join.apply(arguments,[" "])
	Log.apply(console,arguments)
}

times = function (msg,f,x)  {
	var start = (new Date()).getTime()
	for (var i = 0; i < x; ++i) f(i)
	var stop = (new Date()).getTime()
	console.log(msg,(stop - start)/1000 + "s")
}

var zeros = ones = twos = threes = fours = fives = sixes = sevens = eights = nines = 0
numbers = []
for (var i = 0; i < 1000000; ++i) numbers.push(Math.floor(Math.random()*10))

var methods = [ "zero","one","two","three","four","five","six","seven","eight","nine" ];
invokes = numbers.map(function(x) { return methods[x] })

times("1,000,000 Nothings", function(x) {},1000000)

times("1,000,000 Dynamic Switches", function(x) {
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
,1000000)

times("1,000,000 Dynamic Switch with String", function(x) {
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
,1000000)

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

times("1,000,000 Dynamic Object Dispatches w/o guard", 
	function(x) { obj[numbers[x]]() }
,1000000)

times("1,000,000 Dynamic Object Dispatches w/ guard",
	function(x) {  obj.hasOwnProperty(numbers[x]) ? obj[numbers[x]]() : console.log("undefined", numbers[x]) }
,1000000)
	
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

times("1,000,000 Dynamic Array Dispatches w/o guard",
	function(x) {  arr[numbers[x]]() }
,1000000)

times("1,000,000 Dynamic Array Dispatches w/ guard",
	function(x) {  (numbers[x] >= 0 && numbers[x] < arr.length) ? arr[numbers[x]]() : console.log("undefined", numbers[x]) }
,1000000)


obj = { zero :  function() { ++zeros } }
times("1,000,000 Static Object Dispatches w/o guard",
	function(x) { obj.zero() }
,1000000)

arr = [ function() { ++zeros } ]
times("1,000,000 Static Array Dispatches w/o guard",
	function(x) { arr[0]() }
,1000000)

times("1,000,000 Static Switch Dispatches",
	function(x) { switch(0) {	
		case 0: ++zeros; break;
		default:
			console.log("undefined ", numbers[x]);
	}}
,1000000)

foo = bar = baz = 0
times("1,000,000 Static Switch Dispatches for String",
	function(x) { switch("foo") {
		case "bar": return ++bar; break;
		case "baz": return ++baz; break;
		case "foo": return ++foo; break;
		default: console.log("undefined")
	}}
,1000000)

obj = { bar : function() { return ++bar }, baz: function() { return ++baz }, foo : function() { return ++foo } }
times("1,000,000 Static Object Dispatches for String w/o guard",
	function(x) { obj.foo() }
,1000000)

times("1,000,000 Static Object Dispatches for String w/ guard",
	function(x) { typeof(obj['foo']) == 'function' ? obj.foo() : console.log("undefined") }
,1000000)

function Foo() { return ++foo }
times("1,000,000 Static Named Function Dispatch",
	function(x) { Foo() }
,1000000)

var FOO = function() { return ++foo }
times("1,000,000 Static Variable Function Dispatch",
	function(x) { FOO() }
,1000000)

