/*
    The Reserver is created to renew the reservation timer in a room
    
    HOWTO:
        -place a blue flag (preferrably two so that the timer increases) in the room you want renewed
        -Reserver's will be created when the reservation timer is below 2500

    The Reserver's memory :
        -work: the room name of the room I want to reserve
        -flag : the creeps unique identifier

    The Reserver's create function only returns true if the spawner is busy or a Reserver is made.
    
*/
var role_proto = require('prototype.role');

var roleReserver = {
    
    parts: [[MOVE,CLAIM]],

    // TODO make a helper function for finding the costs
    costs: [650],


};

module.exports=roleClaimer;