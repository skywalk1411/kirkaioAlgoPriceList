const itemList = require('./items.json');
const delivery = [];
const parseRarity = (str) => {
  if (str === 'MYTHICAL') { return 'M'; }
  else if (str === 'LEGENDARY') { return 'L';}
  else if (str === 'EPIC') { return 'E'; }
  else if (str === 'RARE') { return 'R'; }
  else if (str === 'COMMON') { return 'C'; }
  else { return 'U'; }
};
const basePrice = (rarity) => {
  if (rarity === 'MYTHICAL') { return 1000000 }
  if (rarity === 'LEGENDARY') { return 100000 }
  if (rarity === 'EPIC') { return 50000 }
  if (rarity === 'RARE') { return 2000 }
  if (rarity === 'COMMON') { return 1000 }
};
const produceDelivery = () => {
    for (const weapon in itemList.weapons) {
        for (const skin in itemList.weapons[weapon].skins) {
            let finalPrice = (itemList.weapons[weapon].skins[skin].prices.average === 0) ? basePrice(itemList.weapons[weapon].skins[skin].rarity) : itemList.weapons[weapon].skins[skin].prices.average;
            let temp = { itemName: itemList.weapons[weapon].skins[skin].name, Value: finalPrice, rarity: parseRarity(itemList.weapons[weapon].skins[skin].rarity) };
            delivery.push(temp);
        }
    }
    for (const character in itemList.characters) {
        let finalPrice = (itemList.characters[character].prices.average === 0) ? basePrice(itemList.characters[character].rarity) : itemList.characters[character].prices.average;
        let temp = { itemName: itemList.characters[character].name, Value: finalPrice, rarity: parseRarity(itemList.characters[character].rarity) };
        delivery.push(temp);
    }
    for (const chest in itemList.chests) {
      let finalPrice = (itemList.chests[chest].salePrice === 0) ? basePrice(itemList.chests[chest].rarity) : itemList.chests[chest].salePrice;
        let temp = { itemName: itemList.chests[chest].name, Value: finalPrice, rarity: parseRarity(itemList.chests[chest].rarity) };
        delivery.push(temp);
    }
    for (const card in itemList.charactercards) {
      let finalPrice = (itemList.charactercards[card].salePrice===0) ? basePrice(itemList.charactercards[card].rarity) : itemList.charactercards[card].salePrice;
        let temp = { itemName: itemList.charactercards[card].name, Value: finalPrice, rarity: parseRarity(itemList.charactercards[card].rarity)};
        delivery.push(temp);
    }
    return delivery;
};
const fs = require('fs');

function exportJsonToFile(jsonData, filePath) {
  try {
    // Convert the JSON object to a string
    const jsonString = JSON.stringify(jsonData, null, 2);

    // Write the JSON string to the file
    fs.writeFileSync(filePath, jsonString, 'utf8');

    console.log('JSON data has been exported to file:', filePath);
  } catch (error) {
    console.error('Error occurred while exporting JSON data:', error);
  }
}
let final = produceDelivery();
exportJsonToFile(final,'/media/md0/sdb1/project/kirkachat/controllers/baseListNew.json');
//console.log(delivery)
