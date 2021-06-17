# Node Map

![Screenshot of a web browser running the network map. There is a map with red and blue circles and blue lines to represent nodes and the links between them.](/image.png?raw=true "Screenshot")

### Getting Started

#### `yarn`

Installs dependencies.

#### `yarn start`

Runs the app in development mode.  
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

The page will reload if you make edits.  
You will also see any lint errors in the console.

#### `yarn update-data`

Fetches the latest node, link and kiosk data.

#### Seattle Meshnet Customization

- modified map component draws asychnronously from a Google spreadsheet

- 'npm run build' creates a minified build of the project, which can then be imported to the Meshnet static website. it replaces the 'static' folder

- build incorporation:
1. put the main chunk file in the script in the map section of the website
2. grab the generated script and link portion from the generated index.html
2. isBuild bool in Nodemarker needs to be changed (changes file path)
4. img is right now being hard imported, and there's some kind of conflict with the 'img/map' folder naming

instructions on getting your spreadsheet as a google endpoint:
https://www.freecodecamp.org/news/cjn-google-sheets-as-json-endpoint/