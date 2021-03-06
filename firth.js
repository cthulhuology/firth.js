// firth.js
//
// Copyright © 2012 David J. Goehrig <dave@dloh.org>
//

// Constants
RAM = 1024*1024 // 1MB

// Registers
Memory = new ArrayBuffer(RAM)
char = new Int8Array(Memory)
word = new Int16Array(Memory)
int = new Int32Array(Memory)
byte = new Uint8Array(Memory)
short = new Uint16Array(Memory)
long = new Uint32Array(Memory)
dump = function(offset, size) { 
	var range = []
	for (var i = 0; i < size; ++i) range.push(offset + i)
	return range.map(function(x) { return long[x] })
}

sp = 0
stmp = 0
rp = 0
rtmp = 0

// preoptimization: Compiler.eval('1600000 push 0 ~ : loop 1 +  <- loop') on safari took 1 second, .6 seconds on chrome, 10s on FF aurora
// 			or about 4.8mips safari, 8mips chrome, .5mips ff 
// postoptimization: Compiler.eval('1600000 push 0 ~ : loop 1 +  <- loop') on safari took 0.5 seconds, 0.085 seconds, 3.6s on FF aurora
//			or about 9.7mips safari, 56mips chrome, 1.3mips ff

main = function (offset) {
	var a = 0;		// source register
	var d = 0;		// destination register
	var i = offset;		// instruction pointer
	var p = 0; 		// program register
	var m = Memory;		// memory image
	var start = (new Date()).getTime()
	console.log("Start: ",start)
fetch: while(true) {
		if (i >= RAM/4) {							// halt the virtual machine if i is out of range
			var stop =  (new Date()).getTime()
			console.log("Stop: ", stop)
			console.log("Run Time: ", (stop - start) / 1000, "s")
			console.log("Stack Trace:");
			console.log("IP: ", i, " Source: ", a, " Destination: ", d)
			console.log("SP: ", sp, " TMP: ", stmp, " Data: ", dump(0,32))
			console.log("RP: ", rp, " TMP: ", rtmp, " Data: ", dump(32,32))
			return int[(sp&31)];
		}
		p = long[i++];				// post increment instruction pointer after reading the instruction 
	decode: while (true) {
			switch(0x1f & p) {					// check the low bits, we can pack up to 12 instructions per cell!
			case 0:	continue fetch; // .				// fetch the next instruction
			case 1: int[(sp&31)] = -int[(sp&31)]; break; // -
			case 2: int[(sp-1)&31] += int[(sp&31)]; --sp; break; // +
			case 3: int[(sp-1)&31] *= int[(sp&31)]; --sp; break; // *
			case 4: int[(sp-1)&31] /= int[(sp&31)]; --sp; break; // /
			case 5: int[(sp-1)&31] %= int[(sp&31)]; --sp; break; // %
			case 6: int[(sp&31)] = ~int[sp&31]; break; // ~
			case 7: int[(sp-1)&31] &= int[(sp&31)]; --sp; break; // &
			case 8: int[(sp-1)&31] |= int[(sp&31)]; --sp; break; // |
			case 9: int[(sp-1)&31] ^= int[(sp&31)]; --sp; break; // ^
			case 10: --sp; break; // drop
			case 11: int[(sp+1)&31] = int[sp&31]; ++sp; break;  // dup
			case 12: int[(sp+1)&31] = int[(sp-1)&31]; ++sp; break; // over
			case 13: int[((++rp)&31)+32] = int[(sp--)&31]; break; // push
			case 14: int[(++sp)&31] = int[((rp--)&31)+32]; break; // pop
			case 15: int[(++sp)&31] = int[a]; break; // @
			case 16: int[(++sp)&31] = int[a++]; break; // @+
			case 17: long[d] = long[(sp--)&31]; break; // !
			case 18: long[d++] = long[(sp--)&31]; break; // !+
			case 19: long[(++sp)&31] = a; break; // @s
			case 20: a = long[(sp--)&31]; break; // !s
			case 21: long[(++sp)&31] = d; break; // @d
			case 22: d = long[(sp--)&31]; break; // !d 
			case 23: i = long[((rp--)&31)+32]; continue fetch; // ;					// force fetch
			case 24: rtmp = i; i = long[(rp&31)+32]; long[(rp&31)+32] = rtmp; continue fetch; // <>	// force fetch
			case 25: long[((++rp)&31)+32] = i; i = long[(sp--)&31]; continue fetch; // ->		// force fetch
			case 26: long[(++sp)&31] = long[i++]; continue fetch; // #				// force fetch + immediate value
			case 27: i = long[i]; continue fetch; // $						// force fetch + immediate value
			case 28: long[((++rp)&31)+32] = i+1; i = long[i]; continue fetch; // ,			// force fetch + immediate value
			case 29: i = (int[sp&31] == 0 ? long[i] : i+1); continue fetch;	// ?0			// force fetch + immediate value
			case 30: i = (int[sp&31] < 0 ? long[i] : i+1); continue fetch; // ?			// force fetch + immediate value
			case 31: if (int[(rp&31)+32] > 0) { // <-
					i = long[i]; int[(rp&31)+32] = int[(rp&31)+32] - 1			// decrement and loop
				} else {
					i = i + 1; --rp								// drop and continue
				}; continue fetch;								// force fetch + immediate value
			default:
				console.error("Invalid instruction at: ", i, " value: ", p & 0x1f)
				console.log(new Date())
				return i;
			}
			p >>= 5;		// we can encode up to 12 instructions per 64 bit cell
			continue decode;	// decode the next instruction in the stream
		}
	}
}

Compiler = {
	instructions: [ '.', '-', '+', '*', '/', '%', '~', '&', '|', '^',
		'drop','dup','over','push','pop','@','@+','!','!+','@s','!s','@d','@d',
		';','<>','->','#','$',',','?0','?','<-', ],
	definitions: {},
	define: function(word,value) {
		// console.log("Define ", word, " = ", value )
		Compiler.definitions[word] = value
	},
	lookup: function(word) {
		// console.log("Lookup ", word)
		return Compiler.definitions.hasOwnProperty(word) ?
			Compiler.definitions[word] :
			parseInt(word)
	},
	offset: 64,
	compile: function(text) {									// text is the source code
		var count = 0										// number of operations encoded in current word
		var instr = 0;										// current instruction long we're encoding
		var lit = Compiler.instructions.indexOf('#')						// we use this opcode for literal values
		var words = text.split(/\s+/)								// words is the the array of symbols
		while (words.length) {
			var word = words.shift()							// consume next word in source
			// console.log("compiling ", word, " at ", Compiler.offset, ":", count)
			if (word == ':' ) {
				if (count != 0) long[Compiler.offset++] = instr				// align to a cell boundary
				instr = 0
				count = 0								// reset count to 0
				Compiler.define(words.shift(),Compiler.offset)				// define this offset as next word in source 
				continue;
			}
			var op = Compiler.instructions.indexOf(word)					// -1 is not an instruction
			if ( op < 0 ) {									// test to see if constant or definition
				instr += lit << (5*count)
				long[Compiler.offset++] = instr						// save the current instruction long
				instr = Compiler.lookup(word)						// compile the literal value
				count = 0								// zero the count so we advance the offset
			} else {									// this is an instruction
				// console.log("opcode: ", op)
				instr += op << (5*count)		
				if (op > 22) {								
					if (op < 26) {							// force fetch must align to next op after
						count = 0
					} else {							// 26+ have literal values following
						long[Compiler.offset++] = instr				// save the current packed instruction
						instr = Compiler.lookup(words.shift())			// consume the next word and lookup literal
						count = 0						// reset count so we save literal value
					}
				} else {
					count = (count + 1) % 6						// we encode up to 6 instructions per long
				}
			}
			if (count == 0) {
				long[Compiler.offset++] = instr						// save the current instruction word
				instr = 0								// reset the instruction
			}
		}
		long[Compiler.offset] = instr								// save the last instruction word
		return Compiler.offset++								// last cell saved
	},
	eval: function(line) {
		var offset = Compiler.offset
		Compiler.compile(line.trim())
		retval = main(offset)
		Compiler.offset = offset
		for (var i = offset; i < RAM/4; ++i) long[i] = 0					// clear out all of the memory above
		return retval
	}
}

$ = Compiler.compile
_ = Compiler.eval	// Because typing sucks

// and finally boot!
main(64);
