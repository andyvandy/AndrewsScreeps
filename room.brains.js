/*
    Room.brains calls the other room controller functions such as the planner and populator

    room.brains controls which phase a room is in which will change the behaviour of the room
    
    each room has the following memory properties:
        -phase: what phase the room is currently in
*/
var roomPopulator = require('room.populator');
var roomPlanner = require('room.planner');
var roomDefender = require('room.defender');
var towerController = require('tower.controller');


var roomBrains={

    setPhase:function(room_name){
        // determine the room's current phase
        var room = Game.rooms[room_name];
        if(room===undefined){
            return;
        }
        // if no phase is currently set, set the room phase to 1
        if (Memory[room_name]===undefined){
            Memory[room_name]={};
        }
        if (Memory[room_name].phase ===undefined){
            Memory[room_name].phase=1;
        }
        if(room.controller===undefined){
            return;
        }

        
        var hasStorage= room.find(FIND_STRUCTURES,{filter: (s)=> s.structureType==STRUCTURE_STORAGE}).length;
        var hasExtractor= room.find(FIND_STRUCTURES,{filter: (s)=> s.structureType==STRUCTURE_EXTRACTOR}).length;
        if ((room.controller.level>5) && hasExtractor){
             Memory[room_name].phase=4;
        }
        else if ((room.controller.level>3) && hasStorage &&(room.energyCapacityAvailable >900)){
            Memory[room_name].phase=3;
        }else if(room.controller.level>2) {
            Memory[room_name].phase=2;
        }else{
            Memory[room_name].phase=1;
        }
    },

    run:function(room_name){

        //determine the room's current phase
        if (Memory[room_name]===undefined || Game.time % 50 === 15){
            this.setPhase(room_name);
        } 

        //Control my towers
        var towers = _.filter(Game.structures, (s)=> s.structureType== STRUCTURE_TOWER && s.room.name == room_name);
        for(var s in towers) {    
            var tower= towers[s];
            towerController.run(tower);
        }

        //manage room defenses
        if(Game.time %10=== 3 ){
            // run this every once in a while to save cpu
            try {roomDefender.run(room_name);} catch(e){
                console.log("Room defender error in "+room_name+": "+e );
            };  
        }

        //Control my links
        try {this.links(room_name);} catch(e){};

        // Control my terminal
        if(Game.time %100=== 17 ){
            try {this.terminals(room_name);} catch(e){};
        }
        

        //spawn creeps
        if(Game.time %10=== 0 ){
            // run this every once in a while to save cpu
            try {roomPopulator.run(room_name,Memory[room_name].phase);} catch(e){
                console.log("Room populator error in "+room_name+": "+e );
            };
            
        }
        // place buildings
        if(Game.time % 50 === 5 ){
            try {roomPlanner.run(room_name);} catch(e){
                console.log("Room planner error in "+room_name+": "+e );
                console.log(e);
            };
        }
        // manage defenses TODO

    },

    links:function(room_name){
        //grey red for sources, grey blue for destinations
        //TODO entirely revamp this

        // exit if there are no links in the room TODO

        var greyRedFlags= Game.rooms[room_name].find(FIND_FLAGS,{filter: (f) => {return (f.color ==COLOR_GREY && f.secondaryColor ==COLOR_RED); }});
        if (greyRedFlags.length){
            var source_links = _.filter(greyRedFlags[0].pos.lookFor(LOOK_STRUCTURES), (s) => (s.structureType==STRUCTURE_LINK)&&(s.energy >0));
        }
        else{
            return false;
        }

        var greyBlueFlags= Game.rooms[room_name].find(FIND_FLAGS,{filter: (f) => {return (f.color ==COLOR_GREY && f.secondaryColor ==COLOR_BLUE); }});
        if (greyBlueFlags.length){
            var destination_links = _.filter(greyBlueFlags[0].pos.lookFor(LOOK_STRUCTURES), (s) => (s.structureType==STRUCTURE_LINK) && (s.energy < s.energyCapacity));
        }
        else{
            return false;
        }
        if (source_links[0]===undefined){
            return false;
        }
        source_links[0].transferEnergy(destination_links[0]);
    },
    terminals: function(room_name){
        // this function will control the terminals, for now they just sell the excess but eventually this should be
        // expanded into it's own file
        var room = Game.rooms[room_name];

        var terminal = room.terminal;
        if (terminal=== undefined){
            //exit the function if there is no terminal in the room
            return;
        }
        if (terminal.store[RESOURCE_ENERGY] <3000){
            return;
        }

        // loop through the resources, sell anything I have more than 50k of.
        for (var resource in terminal.store){
            if (resource != RESOURCE_ENERGY && terminal.store[resource] >50000){
                console.log("selling "+resource);
                var orders= _(_.sortBy(Game.market.getAllOrders(order => order.resourceType == resource && 
                                                    order.type == ORDER_BUY && 
                                                    Game.market.calcTransactionCost(1000, room_name, order.roomName) < 3000))).reverse().value();
                // try to find the best deal
                if (orders.length  ){
                    var result =Game.market.deal(orders[0].id,1000, room_name);
                }

            }       
        }
    }

};



module.exports = roomBrains;
