/* [MS-CFB] v20130118 */
var CFB = (function(){
var exports = {};
function parse(file) {


var mver = 3; // major version
var ssz = 512; // sector size
var mssz = 64; // mini sector size
var nds = 0; // number of directory sectors
var nfs = 0; // number of FAT sectors
var nmfs = 0; // number of mini FAT sectors
var ndfs = 0; // number of DIFAT sectors
var dir_start = 0; // first directory sector location
var minifat_start = 0; // first mini FAT sector location
var difat_start = 0; // first mini FAT sector location

var ms_cutoff_size = 4096; // mini stream cutoff size
var minifat_store = 0; // first sector with minifat data
var minifat_size = 0; // size of minifat data

var fat_addrs = []; // locations of FAT sectors

/* [MS-CFB] 2.2 Compound File Header */
var blob = file.slice(0,512);
prep_blob(blob);
var read = ReadShift.bind(blob), chk = CheckField.bind(blob);
//var wrn = WarnField.bind(blob);
var j = 0, q;

// header signature 8
chk(HEADER_SIGNATURE, 'Header Signature: ');

// clsid 16
chk(HEADER_CLSID, 'CLSID: ');

// minor version 2
//wrn(HEADER_MINOR_VERSION, 'Minor Version: ');
read(2);

// major version 3
mver = read(2);
switch(mver) {
	case 3: ssz = 512; break;
	case 4: ssz = 4096; break;
	default: throw "Major Version: Expected 3 or 4 saw " + mver;
}

// reprocess header
var pos = blob.l;
blob = file.slice(0,ssz);
prep_blob(blob,pos);
read = ReadShift.bind(blob);
chk = CheckField.bind(blob);
var header = file.slice(0,ssz);

// Byte Order TODO
chk('feff', 'Byte Order: ');

// Sector Shift
switch((q = read(2))) {
	case 0x09: if(mver !== 3) throw 'MajorVersion/SectorShift Mismatch'; break;
	case 0x0c: if(mver !== 4) throw 'MajorVersion/SectorShift Mismatch'; break;
	default: throw 'Sector Shift: Expected 9 or 12 saw ' + q;
}

// Mini Sector Shift
chk('0600', 'Mini Sector Shift: ');

// Reserved
chk('000000000000', 'Mini Sector Shift: ');

// Number of Directory Sectors
nds = read(4);
if(mver === 3 && nds !== 0) throw '# Directory Sectors: Expected 0 saw ' + nds;

// Number of FAT Sectors
nfs = read(4);

// First Directory Sector Location
dir_start = read(4);

// Transaction Signature TODO
read(4);

// Mini Stream Cutoff Size TODO
chk('00100000', 'Mini Stream Cutoff Size: ');

// First Mini FAT Sector Location
minifat_start = read(4);

// Number of Mini FAT Sectors
nmfs = read(4);

// First DIFAT sector location
difat_start = read(4);

// Number of DIFAT Sectors
ndfs = read(4);

// Grab FAT Sector Locations
for(j = 0; blob.l != 512; ) {
	if((q = read(4))>=MAXREGSECT) break;
	fat_addrs[j++] = q;
}


/** Break the file up into sectors */
if(file.length%ssz!==0) console.error("CFB: size " + file.length + " % "+ssz);

var nsectors = Math.ceil((file.length - ssz)/ssz);
var sectors = [];
for(var i=1; i != nsectors; ++i) sectors[i-1] = file.slice(i*ssz,(i+1)*ssz);
sectors[nsectors-1] = file.slice((nsectors)*ssz);

/** Chase down the rest of the DIFAT chain to build a comprehensive list
    DIFAT chains by storing the next sector number as the last 32 bytes */
function sleuth_fat(idx, cnt) {
	if(idx === ENDOFCHAIN) {
		if(cnt !== 0) throw "DIFAT chain shorter than expected";
		return;
	}
	var sector = sectors[idx];
	for(var i = 0; i != ssz/4-1; ++i) {
		if((q = sector.readUInt32LE(i*4)) === ENDOFCHAIN) break;
		fat_addrs.push(q);
	}
	sleuth_fat(sector.readUInt32LE(ssz-4),cnt - 1);
}
sleuth_fat(difat_start, ndfs);

/** DONT CAT THE FAT!  Just calculate where we need to go */
function get_buffer(byte_addr, bytes) {
	var addr = fat_addrs[Math.floor(byte_addr*4/ssz)];
	if(ssz - (byte_addr*4 % ssz) < (bytes || 0))
		throw "FAT boundary crossed: " + byte_addr + " "+bytes+" "+ssz;
	return sectors[addr].slice((byte_addr*4 % ssz));
}

function get_buffer_u32(byte_addr) {
	return get_buffer(byte_addr,4).readUInt32LE(0);
}

function get_next_sector(idx) { return get_buffer_u32(idx); }

/** Chains */
var chkd = new Array(sectors.length), sector_list = [];
var get_sector = function get_sector(k) { return sectors[k]; };
for(i=0; i != sectors.length; ++i) {
	var buf = [];
	if(chkd[i]) continue;
	for(j=i; j<=MAXREGSECT; buf.push(j),j=get_next_sector(j)) chkd[j] = true;
	sector_list[i] = {nodes: buf};
	sector_list[i].data = Buffers(buf.map(get_sector)).toBuffer();
}
sector_list[dir_start].name = "!Directory";
if(nmfs > 0) sector_list[minifat_start].name = "!MiniFAT";
sector_list[fat_addrs[0]].name = "!FAT";

/** read directory structure */
var files = {}, Paths = [];
function read_directory(idx) {
	var blob, read, w;
	var sector = sector_list[idx].data;
	for(var i = 0; i != sector.length; i+= 128) {
		blob = sector.slice(i, i+128);
		prep_blob(blob, 64);
		read = ReadShift.bind(blob);
		var namelen = read(2);
		if(namelen === 0) return;
		var name = blob.utf16le(0,namelen-(Paths.length?2:0)); // OLE
		Paths.push(name);
		var o = { name: name };
		o.type = EntryTypes[read(1)];
		o.color = read(1);
		o.left = read(4); if(o.left === NOSTREAM) delete o.left;
		o.right = read(4); if(o.right === NOSTREAM) delete o.right;
		o.child = read(4); if(o.child === NOSTREAM) delete o.child;
		o.clsid = read(16);
		o.state = read(4);
		o.ctime = read(8);
		o.mtime = read(8);
		o.start = read(4);
		o.size = read(4);
		if(o.type === 'root') { //root entry
			minifat_store = o.start;
			if(nmfs > 0) sector_list[minifat_store].name = "!StreamData";
			minifat_size = o.size;
		} else if(o.size >= ms_cutoff_size) {
			o.storage = 'fat';
			try {
				sector_list[o.start].name = o.name;
				o.content = sector_list[o.start].data.slice(0,o.size);
			} catch(e) {
				o.start = o.start - 1; 
				sector_list[o.start].name = o.name;
				o.content = sector_list[o.start].data.slice(0,o.size);
			}
			prep_blob(o.content);
		} else {
			o.storage = 'minifat';
			w = o.start * mssz;
			o.content = sector_list[minifat_store].data.slice(w,w+o.size);
			prep_blob(o.content);
		}
		files[name] = o;
	}
}
read_directory(dir_start);

var root_name = Paths.shift();

if(files.VBA) console.error("VBA will not be processed");

var rval = {
	raw: {header: header, sectors: sectors},
	Paths: Paths,
	Directory: files
};

for(var name in files) {
	switch(name) {
		/* [MS-OSHARED] 2.3.3.2.2 Document Summary Information Property Set */
		case '!DocumentSummaryInformation':
			rval.DocSummary = parse_PropertySetStream(files[name], DocSummaryPIDDSI); break;
		/* [MS-OSHARED] 2.3.3.2.1 Summary Information Property Set*/
		case '!SummaryInformation':
			rval.Summary = parse_PropertySetStream(files[name], SummaryPIDSI); break;
	}
}

return rval;
} // parse


function readFileSync(filename) {
	var fs = require('fs');
	var file = fs.readFileSync(filename);
	return parse(file);
}

function readSync(blob, options) {
	var o = options || {};
	switch((o.type || "base64")) {
		case "file": return readFileSync(blob);
		case "base64": blob = Base64.decode(blob);
		/* falls through */
		case "binary": blob = s2a(blob); break;
	}
	return parse(blob);
}

exports.read = readSync;
exports.parse = parse;
return exports;
})();

/** CFB Constants */
{
	var MAXREGSECT = 0xFFFFFFFA;
	var DIFSECT = 0xFFFFFFFC;
	var FATSECT = 0xFFFFFFFD;
	var ENDOFCHAIN = 0xFFFFFFFE;
	var FREESECT = 0xFFFFFFFF;
	var HEADER_SIGNATURE = 'd0cf11e0a1b11ae1';
	var HEADER_MINOR_VERSION = '3e00';
	var MAXREGSID = 0xFFFFFFFA;
	var NOSTREAM = 0xFFFFFFFF;
	var HEADER_CLSID = '00000000000000000000000000000000';

	var EntryTypes = ['unknown','storage','stream',null,null,'root'];
}

if(typeof require !== 'undefined' && typeof exports !== 'undefined') {
	Buffers = Array;
	Buffers.prototype.toBuffer = function() {
		return Buffer.concat(this[0]);
	};
	var fs = require('fs');
	//exports.read = CFB.read;
	//exports.parse = CFB.parse;
	//exports.ReadShift = ReadShift;
	//exports.prep_blob = prep_blob;
	exports.main = function(args) {
		var cfb = CFB.read(args[0], {type:'file'});
		console.log(cfb);
	};
	if(typeof module !== 'undefined' && require.main === module)
		exports.main(process.argv.slice(2));
} else {
	Buffers = Array;
	Buffers.prototype.toBuffer = function() {
		var x = [];
		for(var i = 0; i != this[0].length; ++i) { x = x.concat(this[0][i]); }
		return x;
	};
}
