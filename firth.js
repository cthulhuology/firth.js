// firth.js
//
// Copyright © 2012 David J. Goehrig <dave@dloh.org>
//

// Constants
RAM = 1024*1024 // 1MB

// Registers
Memory = [];	// replaced with array buffer on boot

// Startup the VM
boot = function () {
	console.log(new Date());
	Memory = new ArrayBuffer(RAM);
	Memory.char = new Int8Array(Memory);
	Memory.word = new Int16Array(Memory);
	Memory.int = new Int32Array(Memory);
	Memory.byte = new Uint8Array(Memory);
	Memory.short = new Uint16Array(Memory);
	Memory.long = new Uint32Array(Memory);
	main();
	console.log(new Date());
}

stack = function() {
	// Layout of the stack is: 
	// 	| 0 | ... | 31 | sp | tmp |
	// this differs from the C version which hides the values sp at -1 and tmp at -2
	var s = new ArrayBuffer(34*4);
	s.int = new Int32Array(s);
	s.long = new Uint32Array(s);
	s.tos = function() { 
		if (arguments.length) this.int[this.long[32]&31] = arguments[0]
		return this.int[this.long[32]&31];
	}
	s.nos = function() { 
		if (arguments.length) this.int[(this.long[32]-1)&31] = arguments[0]
		return this.int[(this.long[32]-1)&31]
	}
	s.tmp =  function() {
		if (arguments.length) this.long[33] = arguments[0]
		return this.long[33]
	}
	s.pop = function() {
		return this.int[(this.long[32]--)&31]
	}
	s.push = function(v) {
		return this.int[(++this.long[32])&31] = v
	}
	return s
}

sysclock = function(m) {
//	timer(m);
//	mouse(m);
//	touchpad(m);
//	keyboard(m);
//	screen(m);
//	speakers(m);
//	network(m);
//	console.log("sysclock");
}

main = function () {
	var s = stack();	// data stack
	var r = stack();	// return stack
	var a = 0;		// source register
	var d = 0;		// destination register
	var i = 0;		// instruction pointer
	var m = Memory;		// memory image
fetch: while(true) {
		sysclock(m);				// simulate system clock update and read all I/O ports into memory
		if (i >= RAM/4) {			// halt the virtual machine if i is out of range
			console.log("Stack Trace:");
			console.log("IP: ", i, " Source: ", a, " Destination: ", d)
			console.log("SP: ", s.long[32], " TMP: ", s.long[33], " Data: ", 
			[ 0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31].map(function(x) { return s.int[x] }))
			console.log("RP: ", r.long[32], " TMP: ", r.long[33], " Data: ", 
			[ 0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31].map(function(x) { return r.int[x] }))
			return s.tos();
		}
		var instr = m.long[i++];		// post increment instruction pointer after reading the instruction 
	decode: while (true) {
			switch(0x1f & instr) {		// check the low bits, we can pack up to 12 instructions per cell!
			case 0:	continue fetch;		// fetch the next instruction
			case 1: s.tos(- s.tos()); break;
			case 2: s.nos(s.nos() + s.tos()); s.pop(); break;
			case 3: s.nos(s.nos() * s.tos()); s.pop(); break;
			case 4: s.nos(s.nos() / s.tos()); s.pop(); break;
			case 5: s.nos(s.nos() % s.tos()); s.pop(); break;
			case 6: s.tos(~ s.tos()); break;
			case 7: s.nos(s.nos() & s.tos()); s.pop(); break;
			case 8: s.nos(s.nos() | s.tos()); s.pop(); break;
			case 9: s.nos(s.nos() ^ s.tos()); s.pop(); break;
			case 10: s.pop(); break;
			case 11: s.push(s.tos()); break;
			case 12: s.push(s.nos()); break;
			case 13: r.push(s.pop()); break;
			case 14: s.push(r.pop()); break;
			case 15: s.push(m.long[a]); break;
			case 16: s.push(m.long[a++]); break;
			case 17: m.long[d] = s.pop(); break;
			case 18: m.long[d++] = s.pop(); break;
			case 19: s.push(a); break;
			case 20: a = s.pop(); break;
			case 21: s.push(d); break;
			case 22: d = s.pop(); break;
			case 23: i = r.pop(); continue fetch;				// force fetch
			case 24: r.tmp(i); i = r.tos(); r.tos(r.tmp()); continue fetch;	// force fetch
			case 25: r.push(i); i = s.pop(); continue fetch;		// force fetch
			case 26: s.push(m.long[i++]); continue fetch;			// force fetch + immediate value
			case 27: i = m.long[i]; continue fetch;				// force fetch + immediate value
			case 28: r.push(i+1); i = m.long[i]; continue fetch;		// force fetch + immediate value
			case 29: I = (s.tos() == 0 ? m.long[i] : i+1); continue fetch;	// force fetch + immediate value
			case 30: I = (s.tos() < 0 ? m.long[i] : i+1); continue fetch;	// force fetch + immediate value
			case 31: if (r.tos() > 0) {  
					I = m.long[i]; r.tos(r.tos()-1)		// decrement and loop
				} else {
					I = i + 1; r.pop()			// drop and continue
				}; continue fetch;					// force fetch + immediate value
			default:
				console.error("Invalid instruction at: ", i, " value: ", instr & 0x1f)
				return i;
			}
			instr >>= 5;		// we can encode up to 12 instructions per 64 bit cell
			continue decode;	// decode the next instruction in the stream
		}
	};
}

Compiler = {
	instructions: [ '.', '-', '+', '*', '/', '%', '~', '&', '|', '^',
		'drop','dup','over','push','pop','@','@+','!','!+','@s','!s','@d','@d',
		';','<->','->','#','$',',','?0','?','<-', ],
	definitions: {},
	compile: function(words) {									// words is an array of words
		var count = 0										// number of operations encoded in current word
		var instr = 0;										// current instruction long we're encoding
		var offset = 0;										// location in memory we are target compiling
		while (words.length) {
			var word = words.shift()
			if ( Compiler.instructions.indexOf(word) < 0 ) {				// test to see if constant or definition
				if (Compiler.definitions.hasOwnProperty(word)) {	
					instr += Compiler.instructions.indexOf('#') << (5*count)	// literal instruction
					Memory.long[offset++] = instr					// save the current instruction long
					instr = Compiler.definitions[word]				// compile the literal value
					count = 0							// zero the count so we advance the offset
				} else {
					instr += Compiler.instructions.indexOf('#') << (5*count)	// literal instruction
					Memory.long[offset++] = instr					// save the current instruction long
					instr = parseInt(word)						// treat it as a literal int
					count = 0							// zero the coutn so we advance the offset
				}
			} else {									// this is an instruction
				instr += Compiler.instructions.indexOf(word) << (5*count)		
				count = (count + 1) % 6							// we encode up to 6 instructions per long
			}
			if (count == 0) {
				Memory.long[offset++] = instr						// save the current instruction word
				++offset								// increment the offset to the next long
				instr = 0								// reset the instruction
			}
		}
		Memory.long[offset] = instr						// save the current instruction word
	},
	eval: function(line) {
		Compiler.compile(line.trim().split(/\s+/))
		return main()
	}
}

// and finally boot!
boot();
