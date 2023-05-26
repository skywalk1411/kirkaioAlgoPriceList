# kirkaioAlgoPriceList

Installation:

Requirements:
- Nodejs
- mySQL

Steps:

-initialize database:
 1) install sequelize : `npm install -save sequelize sequelize-cli`
 2) init database config: `node_modules/.bin/sequelize init`
 3) update the new `/config/config.json` file created in the `/config` folder with your database username, password, database, host, dialect and logging informations who can write in the mysql server.
 4) create the database model: `node_modules/.bin/sequelize model:generate --name Trade --attributes tradeId:integer,userAndTag:string,offered:blob,wanted:blob,status:integer,bumps:integer`
 5) create the table `node_modules/.bin/sequelize db:create`

-install other nodejs packages:
now install the reset of the nodejs packages `npm install -save axios fs mysql2 path websocket`

-copy this cloned git repo into the same folder where you initialized the database.
extract the content of this repo into the root of that nodejs folder you initialized the database from.

-prepare the base pricelist
 1) save the output of `https://curious-catnip-pea.glitch.me/ItemListv2` json into `/controllers/items.json`
 2) manually update the salePrice of Wood, Golden, Ice, Cold, Girls band, Soldiers and Party to the kirka.io default until sherrif make that change :3
 3) run `node /controllers/makeItemPriceList.js`
 4) it should generate a json file in `/controllers/baseListNew.json`. the bot need that file.

-run the bot
 inside `/controllers` folder, run `node tracker.js`

the bot should create/update the file priceList.json, all that is left is to update/upload that file periodically onto webserver with the `pricelist.html and priceList.json`.

