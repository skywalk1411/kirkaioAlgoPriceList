const axios = require('axios');
let priceList = require(`./baseListNew.json`);
let priceListConfig = {
    modified: 0,
    timer: 60000, //1min
    valueRatio: 1.75,
    valueDifferenceRatioValue: 0.75,
    adjustedRatio: 0.1
};
let inventory = {};
let maxCirculationUnit
const maxInInventory = () => {
    let temp = null;
    for (let item in inventory) {
        if (inventory[item].Totalunits - inventory[item].Banned > temp) {
            temp = inventory[item].Totalunits - inventory[item].Banned;
        }
    }
    maxCirculationUnit = temp;
};
const reloadInventory = () => {
    axios.get('https://curious-catnip-pea.glitch.me/fullitemquantity')
        .then(response => {
            inventory = response.data;
            console.log(`[import] sheriff's inventory/banned success.`);
            maxInInventory();
        })
        .catch(error => {
            console.error(`[import] sheriff's inventory/banned error: `, error);
        });
};
const calculateCirculationCoefficient = (itemName) => {
    const item = inventory[itemName];

    if (item && item.Totalunits > item.Banned) {
        const circulationCoefficient = (maxCirculationUnit / (item.Totalunits - item.Banned));
        return circulationCoefficient;
    }

    return 1;
};
const testTrade1 = {
    itemsOffered : [{"i":"Ghillie","r":"M","q":"1"}],
    itemsWanted : [{"i":"Pastel","r":"M","q":"1"}],
};
const testTrade2 = {
    itemsOffered : [{"i":"Caring","r":"M","q":"1"},{"i":"Mossy","r":"M","q":"1"}],
    itemsWanted : [{"i":"Basketcase","r":"M","q":"1"}],
};
const getItemBaseValue = (rarity) => {
    const baseValues = {
        C: 500,
        R: 1000,
        E: 10000,
        L: 100000,
        M: 1000000
    };
    return baseValues[rarity] || 100;
};
const rarityMultiplier = (str) => {
    if (str === 'C') { return 0.05; }
    else if (str === 'R') { return 0.10; }
    else if (str === 'E') { return 0.25; }
    else if (str === 'L') { return 0.50; }
    else if (str === 'M') { return 0.80; }
};
const doNotAdjustItems = ['Ice','Wood','Cold','Girls band','Party','Soldiers','Golden'];
const adjustPriceListGPT2 = (acceptedTrades) => {
    const adjustedPriceList = priceList.map(item => ({ ...item }));
    let offeredValue = 0;
    let wantedValue = 0;
    let offeredItems, wantedItems;
    for (const item of acceptedTrades.itemsOffered) {
        const foundItem = adjustedPriceList.find(i => i.itemName === item.i);
        if (foundItem) {
            offeredItems = foundItem;
            offeredValue += (foundItem.Value || getItemBaseValue(item.r)) * item.q;
        }
    }
    for (const item of acceptedTrades.itemsWanted) {
        const foundItem = adjustedPriceList.find(i => i.itemName === item.i);
        if (foundItem) {
            wantedItems = foundItem;
            wantedValue += (foundItem.Value || getItemBaseValue(item.r)) * item.q;
        }
    }
    const valueDifferenceRatioOffered = Math.abs(offeredValue - wantedValue) / Math.max(offeredValue, wantedValue);
    const valueDifferenceRatioWanted = Math.abs(wantedValue - offeredValue) / Math.max(wantedValue, offeredValue);
    if (valueDifferenceRatioOffered < priceListConfig.valueDifferenceRatioValue && valueDifferenceRatioWanted < priceListConfig.valueDifferenceRatioValue) {
        const valueRatioOffered = offeredValue > wantedValue ? wantedValue / offeredValue : offeredValue / wantedValue;
        const valueRatioWanted = offeredValue > wantedValue ? wantedValue / offeredValue : offeredValue / wantedValue;
        const adjustmentRatio = priceListConfig.adjustedRatio;
        console.log('[tradedif] ','valueRatio', valueDifferenceRatioOffered, valueDifferenceRatioWanted, 'ratioOffered: ', valueRatioOffered, 'offered:', acceptedTrades.itemsOffered, offeredValue, 'ratioWanted:', valueRatioWanted, 'wanted:', acceptedTrades.itemsWanted, wantedValue);
        for (const item of acceptedTrades.itemsOffered) {
            const foundItem = adjustedPriceList.find(i => i.itemName === item.i);
            if (foundItem) {
                const priceDifference = (foundItem.Value || getItemBaseValue(item.r)) * item.q * adjustmentRatio;
                let newValue;
                if (offeredValue > wantedValue) {
                    newValue = foundItem.Value - (priceDifference * valueRatioOffered * calculateCirculationCoefficient(foundItem.itemName) * rarityMultiplier(foundItem.rarity));
                } else if (offeredValue < wantedValue) {
                    newValue = foundItem.Value + (priceDifference * valueRatioOffered * calculateCirculationCoefficient(foundItem.itemName) * rarityMultiplier(foundItem.rarity));
                } else {
                    newValue = foundItem.Value;
                }
                console.log('[pricechange] ',foundItem, 'dif', priceDifference, 'new', Math.round(Math.max(0, newValue)), 'old', foundItem.Value);
                if (doNotAdjustItems.indexOf(item.i) == -1) {
                    foundItem.Value = Math.round(Math.max(0, newValue));
                    foundItem.rarity = item.r;
                }
            }
        }
        for (const item of acceptedTrades.itemsWanted) {
            const foundItem = adjustedPriceList.find(i => i.itemName === item.i);
            if (foundItem) {
                const priceDifference = (foundItem.Value || getItemBaseValue(item.r)) * item.q * adjustmentRatio;
                let newValue;
                if (offeredValue < wantedValue) {
                    newValue = foundItem.Value - (priceDifference * valueRatioWanted * calculateCirculationCoefficient(foundItem.itemName) * rarityMultiplier(foundItem.rarity));
                } else if (offeredValue > wantedValue) {
                    newValue = foundItem.Value + (priceDifference * valueRatioWanted * calculateCirculationCoefficient(foundItem.itemName) * rarityMultiplier(foundItem.rarity));
                } else {
                    newValue = foundItem.Value;
                }
                console.log('[pricechange] ',foundItem, 'dif', priceDifference, 'new', Math.round(Math.max(0, newValue)), 'old', foundItem.Value);
                if (doNotAdjustItems.indexOf(item.i) == -1) {
                    foundItem.Value = Math.round(Math.max(0, newValue));
                    foundItem.rarity = item.r;
                }
            }
        }

        //priceListConfig.modified = 1;
        //priceList = adjustedPriceList;
    }
};
adjustPriceListGPT2(testTrade2);
