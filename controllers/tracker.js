const websocket = require('websocket');
const { dataTunneler } = require('./data_controller');
let lastData = {
    timer: null
};
let config = {
    url: /*'wss://chat.kirka.io',*/'ws://192.168.0.140:9098',
};
let preferences = {
    consoled: false,
};
let wskirka;
//trade test strings
//const testAcceptedTradeSample = `**ToxicGaming#QRKM5K** accepted **k1_2trappy#KY4VZO**'s offer`;
//const testAcceptedTradeSample2 = `**Kreepy.#Z8RQGA** accepted **Deimos#Q4FDRT**'s offer`;
//const testCancelledTradeSample = `**Tempo#Z0NXTE** cancelled their trade offer`;
//const testTradeSample = `ByBALls#HNV3CH is offering their [Tide|SCAR|WEAPON_SKIN|LEGENDARY], [Proton Beam|LAR|WEAPON_SKIN|LEGENDARY] for your [Sunset|VITA|WEAPON_SKIN|LEGENDARY], type  **/trade accept 51406** to accept this offer`;
//const testTradeSample2 = `"Hi12381_(quit)#GGBTSW is offering their [Heartbeat|Shark|WEAPON_SKIN|MYTHICAL], [Fade|Revolver|WEAPON_SKIN|LEGENDARY] for your [Flower|Shark|WEAPON_SKIN|MYTHICAL], type  **/trade accept 32703** to accept this offer`;
const regexAcceptedTradeOffer = /accepted.*offer/i;
const regexCancelledTradeOffer = /cancelled their trade offer/i;
const regexOfferToAccept = /is offering their(?:(?!is offering their).)*?for your(?:(?!for your).)*?to accept this offer/i;
const regexUsername = /([A-Za-z0-9_\.\!\@\#\$\^\&\*\(\)\[\]\/\\\|\+\-]{4,14})#+([A-Za-z0-9]){6}/;/*/\w+#\w+/g;*/
const regexItems = /\[(.*?)\|(.*?)\|(.*?)\|(.*?)\]x?(\d*)/g;
const regexTradeId = /(\*\*\/trade accept (\d+?)\*\*)/i;
const regexForYour = /for your/i;
/*const xipanswer = `/([A-Za-z0-9_.!@#$^&*()[]/\|+-]{4,14})/`
const xipFixed = `/([A-Za-z0-9_\.\!\@\#\$\^\&\*\(\)\[\]\/\\\|\+\-]{4,14})#+([A-Za-z0-9]){6}/`*/
function separateString(string) {
    const trimmedString = string.trim();
    const splitArray = trimmedString.split('**');
    const regex = /([A-Za-z0-9_\.\!\@\#\$\^\&\*\(\)\[\]\/\\\|\+\-]{4,14})#+([A-Za-z0-9]){6}/;
    const matchesArray = [];
  
    for (let i = 0; i < splitArray.length; i++) {
      const match = regex.exec(splitArray[i]);
  
      if (match) {
        matchesArray.push(match[0]);
      }
    }
  
    return matchesArray;
  }
const parseRarity = (str) => {
    if (str === 'MYTHICAL') { return 'M'; }
    else if (str === 'LEGENDARY') { return 'L';}
    else if (str === 'EPIC') { return 'E'; }
    else if (str === 'RARE') { return 'R'; }
    else if (str === 'COMMON') { return 'C'; }
    else { return 'U'; }
};
const parseTrade = (str) => {
    console.log('[rawTrade] ',JSON.stringify(str));
    const isAcceptedTrade = regexAcceptedTradeOffer.test(str);
    const isCancelledTrade = regexCancelledTradeOffer.test(str);
    const isOfferingTrade = regexOfferToAccept.test(str);
    if (isAcceptedTrade) {
        const parsedData = separateString(str);
        const acceptedTradeUsername = parsedData[0];
        const acceptedTradeOfferer = parsedData[1];
        return {
            type: 'acceptedTrade',
            acceptedTradeUsername,
            acceptedTradeOfferer,
        };
    } else if (isCancelledTrade) {
        const parsedData = separateString(str);
        const cancelledTradeUsername = parsedData[0];
        return {
            type: 'cancelledTrade',
            cancelledTradeUsername,
        };
    } else if (isOfferingTrade) {
        const username = str.match(regexUsername)?.[0] ?? '';
        const tradeId = str.match(regexTradeId)?.[2] ?? '';
        const forYourIndex = str.search(regexForYour);
        const itemsOfferedStr = str.substring(str.indexOf('['), forYourIndex).trim();
        const itemsWantedStr = str.substring(forYourIndex).trim();
        const itemsOffered = Array.from(itemsOfferedStr.matchAll(regexItems), match => ({
            i: match[1],
            r: parseRarity(match[4]),
            q: match[5] || '1',
        }));
        const itemsWanted = Array.from(itemsWantedStr.matchAll(regexItems), match => ({
            i: match[1],
            r: parseRarity(match[4]),
            q: match[5] || '1',
        }));
        let foundProblem = 0;
        if (username === '') { foundProblem = 1; console.log('[parseTrade] error: username empty',username, str.username)};
        if (itemsOffered === '[]') { foundProblem = 1; console.log('[parseTrade] error: offered empty', itemsOffered, str.itemsOffered)};
        if (itemsWanted === '[]') { foundProblem = 1; console.log('[parseTrade] error: wanted empty',itemsWanted, str.itemsWanted)};
        if (tradeId === '') { foundProblem = 1; console.log('[parseTrade] error: tradeid empty', tradeId, str.tradeId)};
        if (foundProblem === 1) { console.log('[parseTrade] raw str argument:',JSON.stringify(str))};
        return {
            type: 'trade',
            username,
            itemsOffered,
            itemsWanted,
            tradeId,
        };
    } else { 
        console.log('[parseTrade] not regex not matching error :', str);
    }
};
const consoledTestRegex = 0;
const connectws = () => {
    console.log('[websocket] connecting...')
    wskirka = new websocket.client();
    wskirka.on('connectFailed', function (err) {
        console.log('[websocket] connect failed');
    })
    wskirka.on('connect', (connection) => {
        clearInterval(lastData.timer);
        console.log('[websocket] connected.');
        connection.on('error', function (err) {
            connection.close();
            console.log('[websocket] error', err);
        })
        connection.on('close', function (err) {
            lastData.timer = setInterval(connectws, 1500);
            console.log('[websocket] connection close', err);
        })
        connection.on('message', function (message) {
            let delivery = JSON.parse(message.utf8Data);
            if (delivery.type === 2) {
                if (consoledTestRegex === 1) {
                    console.log(separateString(`${delivery.user.name}#${delivery.user.shortId}`));
                }
            }
            if (delivery.type === 3) {
                for (let i = delivery.messages.length - 1; i > -1; i--) {
                    if (delivery.messages[i].type == 13) {
                        let test = parseTrade(delivery.messages[i].message);
                        dataTunneler(test);
                    }
                }
            }
            else if (delivery.type == 13 && delivery.user === null) {
                let predelivery = parseTrade(delivery.message);
                dataTunneler(predelivery);
            }
        })
    })
    wskirka.connect(config.url, null);
};
connectws();
