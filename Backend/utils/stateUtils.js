// Utility to get state ObjectId by name
const State = require('../models/state');

async function getStateIdByName(stateName) {
    if (!stateName) return null;
    const state = await State.findOne({ name: new RegExp('^' + stateName + '$', 'i') });
    return state ? state._id : null;
}

module.exports = { getStateIdByName };
