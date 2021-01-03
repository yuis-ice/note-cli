
# Note-CLI

Markdown Indexing and Pcre Regular Expression Compatible Full Text Searching for Advanced Note Takers.

## Quick Start

// indexing file
./note-cli.js --index --file notes.md.example

// searching for keywords by regular expression
./note-cli.js --search --header "python" --content "hello.?world" --hide-sql

// and you will get:
[
  {       
    id: 2,
    header: 'how to hello world in python',
    content: '```py \n# how to hello world in python\n\nprint("hello world")\n```\n\n'
  }
]

## Basic comcept

There are great note taking tools over there, such as Evernote. But the reason I quit using Evernote was its poor searching capability (i.e. cannot search some special characters; cannot search with regular expression, of course) and also, lack of extensibility. That's where Note-CLI comes in.

I'm kind of person who likes to take a note on my favorite text editor (Atom editor, for my case). For note taking, I have a single Markdown format text file. In it, I do take notes about everything. Note-CLI does work for indexing chunks of Markdown content to a database file and enables you to search your Markdown notes with SQL query (and also regex).

## Installation

git cloen [url]
cd [cd]
npm i

## Requirement

- node.js v13.10.1 (probably higher or other versions works)
- sqlite3-pcre

// node.js [nvm-sh/nvm](https://github.com/nvm-sh/nvm)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.37.2/install.sh | bash
bash
nvm install v13.10.1
node -v

// sqlite3-pcre
sudo apt update
sudo apt install sqlite3 sqlite3-pcre


<!-- ## Examples -->

<!-- ./note-cli.js --search --header program.*ng --content novel --limit 3 --raw-sql "$( cat raw-sql.sql.example )" -->

## Command line options

$ ./note-cli.js --help
Usage: note-cli [options]

Options:
  -i, --index               set command type: index
  -f, --file <file>         (index) specify file to index (default: null)
  -s, --search              set command type: search
  -t, --search-type <type>  (search) specify search type e.g. regex, like (default: null)
  -r, --regex               (search) enable regex extension for search (default: true)   
  --header <keyword>        (search) search by header (default: ".")
  --content <keyword>       (search) search by content (default: ".")
  --note <keyword>          (search) search by note (default: ".")
  --limit <number>          (search) set limit for search (default: -1)
  -S, --raw-sql <sql>       (search) use raw SQL query for search (default: null)
  -H, --hide-sql            (search) disable showing sql query executed
  --pcre-path <file>        set sqlite3 pcre file path for search (default: "/usr/lib/sqlite3/pcre.so")
  -d, --database <file>     specify database file for index/search (default: "./note-cli.db")
  --delete-database         delete database
  -y, --yes                 no confirmation prompt
  -h, --help                display help for command
