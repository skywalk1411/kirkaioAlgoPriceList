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
let maxCirculationUnit;
const maxInInventory = () => {
    let temp = null;
    for (let item in inventory) {
        if (inventory[item].Totalunits - inventory[item].Banned > temp) {
            temp = inventory[item].Totalunits - inventory[item].Banned;
        }
    }
    maxCirculationUnit = temp;
    console.log(temp)
};
const reloadInventory = () => {
    axios.get('https://curious-catnip-pea.glitch.me/fullitemquantity')
        .then(response => {
            inventory = response.data;
            console.log(`[import] sheriff's inventory/banned success.`);
            maxInInventory();
            adjustPriceListGPT2(testTrade5);
        })
        .catch(error => {
            console.error(`[import] sheriff's inventory/banned error: `, error);
        });
};
const calculateCirculationCoefficient = (itemName) => {
    const item = inventory[itemName];
    if (item && item.Totalunits > item.Banned) {
        const circulationCoefficient = (maxCirculationUnit / (item.Totalunits - item.Banned));
        return circulationCoefficient/2;
    }
    return ((maxCirculationUnit / 5)/2);
};
const testTrade1 = {
    itemsOffered : [{"i":"Hologram","r":"M","q":"1"}],
    itemsWanted : [{"i":"Sunday","r":"M","q":"1"}],
};
const testTrade2 = {
    itemsOffered : [{"i":"Caring","r":"M","q":"1"},{"i":"Mossy","r":"M","q":"1"}],
    itemsWanted : [{"i":"Basketcase","r":"M","q":"1"}],
};
const testTrade5 = {
    itemsOffered : [{"i":"Caring","r":"M","q":"1"},{"i":"Mossy","r":"M","q":"1"}],
    itemsWanted : [{"i":"Basketcase","r":"M","q":"1"},{"i":"Elmoo","r": "C","q":"6000"}],
};
const testTrade3 = {
    itemsOffered : [{"i":"Gold","r":"M","q":"1"}],
    itemsWanted : [{"i":"Legend","r":"M","q":"1"}],
};
const testTrade4 = {
    itemsOffered : [{"i":"Vivid","r":"M","q":"1"},{"i":"Jap","r":"M","q":"1"}],
    itemsWanted : [{"i":"Maksim","r":"M","q":"1"},{"i":"Orbit","r":"M","q":"1"}],
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
    console.log(acceptedTrades)
    const adjustedPriceList = priceList.map(item => ({ ...item }));
    let offeredValue = 0;
    let wantedValue = 0;
    for (const item of acceptedTrades.itemsOffered) {
        const foundItem = adjustedPriceList.find(i => i.itemName === item.i);
        if (foundItem) {
            offeredValue += (foundItem.Value || getItemBaseValue(item.r)) * item.q;
        }
    }
    for (const item of acceptedTrades.itemsWanted) {
        const foundItem = adjustedPriceList.find(i => i.itemName === item.i);
        if (foundItem) {
            wantedValue += (foundItem.Value || getItemBaseValue(item.r)) * item.q;
        }
    }
    const valueDifferenceRatioOffered = Math.abs(offeredValue - wantedValue) / Math.max(offeredValue, wantedValue);
    const valueDifferenceRatioWanted = Math.abs(wantedValue - offeredValue) / Math.max(wantedValue, offeredValue);
    const valueRatio = offeredValue > wantedValue ? wantedValue / offeredValue : offeredValue / wantedValue;
    console.log(`[tradeCompare] ratio: ${valueRatio}/0.75 ${valueRatio > priceListConfig.valueDifferenceRatioValue} <offered> valueDifRatio: ${valueDifferenceRatioOffered} value: ${offeredValue} vs <wanted> valueDifRatio: ${valueDifferenceRatioWanted} value: ${wantedValue}`);
    if (valueRatio > priceListConfig.valueDifferenceRatioValue) {
        //const adjustmentRatio = priceListConfig.adjustedRatio;
        for (const item of acceptedTrades.itemsOffered) {
            const foundItem = adjustedPriceList.find(i => i.itemName === item.i);
            if (foundItem) {
                const priceDifference = (foundItem.Value || getItemBaseValue(item.r)) /** item.q */* valueDifferenceRatioOffered;
                let newValue,newValueCoef;
                if (offeredValue > wantedValue) {
                    newValue = foundItem.Value - (priceDifference * valueRatio * rarityMultiplier(foundItem.rarity));
                    newValueCoef = foundItem.Value - (priceDifference * valueRatio * calculateCirculationCoefficient(foundItem.itemName) * rarityMultiplier(foundItem.rarity));
                } else if (offeredValue < wantedValue) {
                    newValue = foundItem.Value + (priceDifference * valueRatio * rarityMultiplier(foundItem.rarity));
                    newValueCoef = foundItem.Value - (priceDifference * valueRatio * calculateCirculationCoefficient(foundItem.itemName) * rarityMultiplier(foundItem.rarity));
                } else {
                    newValue = foundItem.Value;
                    newValueCoef = foundItem.Value;
                }
                console.log(`[pricechange] <offered> i:${foundItem.itemName} r:${foundItem.rarity} old:${foundItem.Value} x${item.q} math: ${foundItem.Value}${(offeredValue > wantedValue)? '-': (offeredValue<wantedValue)? '+':`=${foundItem.Value}.;`} (${priceDifference} * ${valueRatio} * ${rarityMultiplier(foundItem.rarity)}) = newValue ${Math.round(Math.max(0, newValue))} circulCoeff: ${calculateCirculationCoefficient(foundItem.itemName)} newValueCoef: ${newValueCoef}`);
                if (doNotAdjustItems.indexOf(item.i) == -1) {
                    foundItem.Value = Math.round(Math.max(0, newValue));
                    foundItem.rarity = item.r;
                }
            }
        }
        for (const item of acceptedTrades.itemsWanted) {
            const foundItem = adjustedPriceList.find(i => i.itemName === item.i);
            if (foundItem) {
                const priceDifference = (foundItem.Value || getItemBaseValue(item.r)) /** item.q */* valueDifferenceRatioWanted;
                let newValue,newValueCoef;
                if (offeredValue < wantedValue) {
                    newValue = foundItem.Value - (priceDifference * valueRatio/* * calculateCirculationCoefficient(foundItem.itemName) */* rarityMultiplier(foundItem.rarity));
                    newValueCoef = foundItem.Value - (priceDifference * valueRatio * calculateCirculationCoefficient(foundItem.itemName) * rarityMultiplier(foundItem.rarity));
                } else if (offeredValue > wantedValue) {
                    newValue = foundItem.Value + (priceDifference * valueRatio/* * calculateCirculationCoefficient(foundItem.itemName) */* rarityMultiplier(foundItem.rarity));
                    newValueCoef = foundItem.Value + (priceDifference * valueRatio * calculateCirculationCoefficient(foundItem.itemName) * rarityMultiplier(foundItem.rarity));
                } else {
                    newValue = foundItem.Value;
                    newValueCoef = foundItem.Value;
                }
                console.log(`[pricechange] <offered> i:${foundItem.itemName} r:${foundItem.rarity} old:${foundItem.Value} x${item.q} math: ${foundItem.Value}${(offeredValue < wantedValue)? '-': (offeredValue>wantedValue)? '+':`=${foundItem.Value}.;`} (${priceDifference} * ${valueRatio} * ${rarityMultiplier(foundItem.rarity)}) = newValue ${Math.round(Math.max(0, newValue))} circulCoeff: ${calculateCirculationCoefficient(foundItem.itemName)} newValueCoef: ${newValueCoef}`);
                if (doNotAdjustItems.indexOf(item.i) == -1) {
                    foundItem.Value = Math.round(Math.max(0, newValue));
                    foundItem.rarity = item.r;
                }
            }
        }
    }
};
reloadInventory();
