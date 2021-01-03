#!/usr/bin/env node

var fs = require('fs');
var path = require('path');
const marked = require('marked');
var sleep = require('sleep');
const { exec } = require('child_process');
const commander = require('commander');
const program = new commander.Command();
const Confirm = require('prompt-confirm');
var sqlite3 = require('sqlite3').verbose();
const Database = require('better-sqlite3');

//

program
  // .option('-c, --command <type>', 'command type; index, search', 'search')
  // .option('-i, --index <type>', 'command type: index ', false )
  .option('-i, --index', 'set command type: index ' )
  // .option('  -f, --file <file>', 'specify file to index', null ) // if not specified, NOTEFILES_LIST files will be indexed
  .option('-f, --file <file>', '(index) specify file to index', null ) // if not specified, NOTEFILES_LIST files will be indexed
  .option('-s, --search', 'set command type: search ' )
  .option('-t, --search-type <type>', '(search) specify search type e.g. regex, like', null )
  .option('-r, --regex', '(search) enable regex extension for search', true ) // enable by default
  .option('--header <keyword>', '(search) search by header', "." )
  .option('--content <keyword>', '(search) search by content', "." )
  .option('--note <keyword>', '(search) search by note', "." )
  .option('--limit <number>', '(search) set limit for search', -1 )
  .option('-S, --raw-sql <sql>', '(search) use raw SQL query for search', null )
  // .option('--no-sql', '(search) disable showing sql query executed' )
  .option('-H, --hide-sql', '(search) disable showing sql query executed' )
  .option('--pcre-path <file>', 'set sqlite3 pcre file path for search', "/usr/lib/sqlite3/pcre.so" )
  .option('-d, --database <file>', 'specify database file for index/search', "./note-cli.db" )
  .option('--delete-database', 'delete database' )
  .option('-y, --yes', 'no confirmation prompt' )
  .parse(process.argv)
  ;

// console.log(program.header, program.content, program.hideSql);

// if (program.args.length === 0) program.help();
// console.log(program.args.length, process.argv.length )
// var NO_COMMAND_SPECIFIED = program.args.length === 0;
// if (NO_COMMAND_SPECIFIED) program.help();
if (! process.argv.slice(2).length) program.help();

if (program.index) index();
if (program.search) search();
if (program.deleteDatabase) deleteDatabase();

async function search(){

  // const db = new Database( program.database , { verbose: console.log });
  const db = new Database( program.database , { verbose: program.hideSql ? null : console.log });
  if (program.regex) db.loadExtension( program.pcrePath );

  const stmt = db.prepare( program.rawSql ? program.rawSql : `SELECT note.id, note.header, note.content from note
    WHERE LOWER(note.header) REGEXP ?
    AND LOWER(note.content) REGEXP ?
    AND LOWER(note.entire_note) REGEXP ?
    order by id desc
    LIMIT ?`)
    // .all( program.header , ".", ".") ;
    .all( program.header , program.content , program.note , program.limit ) ;

  console.log(stmt );
  // console.log(stmt.get('id') );

}

async function deleteDatabase(){

  var db = new sqlite3.Database( program.database );

  if (! program.yes) {
    const prompt = new Confirm('Are you sure?');
    await prompt.run()
      .then(function(answer) {
        if (answer == false) process.exit() ;
      });
  }
  // console.log("y..")

  db.serialize(function() {
    db.run(`DROP TABLE IF EXISTS note;`)
  });
  process.on('exit', function(){ console.log("Completed.") ; } );
}

async function index(){

  var db = new sqlite3.Database( program.database );

  if (program.file){
    fileContent = fs.readFileSync( program.file , 'utf8');
    fileContent = fileContent + "\n#" ;
  }

  // or
  if (! program.file){
    var note_files = process.env.NOTEFILES_LIST.split("\n") ;
    // // echo "${NOTEFILES[@]}"
    // // echo "${NOTEFILES_LIST}"
    fileContents = [] ;
    for (var i = 0; i < note_files.length; i++) {
      fileContents.push(fs.readFileSync( note_files[i] , 'utf8'))
    }
    fileContent = fileContents.join("\n\n") + "\n#" ;
  }

	var tokens = marked.lexer(fileContent);

  noteBlock_token = [] ;
  noteBlocks_token = [] ;

  for (var i = 0; i < tokens.length; i++) {
    if ( tokens[i]["type"] == "heading" && tokens[i]["depth"] === 1 ) {
      if (noteBlock_token !== []) {
        noteBlocks_token.push( noteBlock_token )
        noteBlock_token = [] ;
      }
      noteBlock_token.push( tokens[i] )
      continue
    }
    noteBlock_token.push( tokens[i] )
  }

  // fs.writeFileSync(`./note_system_noteBlocks_token.json`, JSON.stringify( noteBlocks_token , null, 4));

  db.serialize(function() {
    db.run(`CREATE TABLE IF NOT EXISTS note(
    	id INTEGER PRIMARY KEY  ,
    	header           TEXT ,
    	category            TEXT  ,
    	title        TEXT ,
    	tags         TEXT ,
    	content         TEXT ,
    	content_code_extraction         TEXT ,
    	entire_note         TEXT ,
    	entire_note_html         TEXT ,
    	entire_note_markdown         TEXT ,
    	meta         TEXT ,
    	dev         TEXT
    );`)
  });

  for (var i = 0; i < noteBlocks_token.length; i++) {

    if (i % 100 == 0) {
      console.log(i + "/" + noteBlocks_token.length)
    }

    header = noteBlocks_token[i].filter(token => token["type"] == "heading" && token["depth"] === 1).map(token => token["text"]).join("") ,
    content = noteBlocks_token[i].filter(token => token["type"] !== "heading" ).map(token => token["raw"]).join("") ,
    entire_note = noteBlocks_token[i].map(token => token["raw"]).join("")

    db.serialize(function() {
      db.run(` INSERT INTO NOTE (header, content, entire_note) VALUES ( ?, ?, ? ); `,
        [ header, content, entire_note ]
      );
    });
  }

  console.log("Database update processing...") ;
  // console.log("y.") ;
  // await sleep.sleep(99) ; // this prevents sqlite lines
  // process.exit() ; // this prevents sqlite lines

  process.on('exit', function(){ console.log("Completed.") ; } );
}
