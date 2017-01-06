/*
    Room.brains calls the other room controller functions such as the planner and populator

    room.brains controls which phase a room is in which will change the behaviour of the room
    
    each room has the following memory properties:
        -phase: what phase the room is currently in
*/
var roomPopulator = require('room.populator');
var roomPlanner = require('room.planner');


var roomBrains={

    setPhase:function(room_name){
        // determine the room's current phase

        // if no phase is currently set, set the room phase to 1
        if (Memory[room_name]===undefined){
            Memory[room_name]={};
        }
        if (Memory[room_name].phase ===undefined){
            Memory[room_name].phase=1;
        }

        var room = Game.rooms[room_name];
        var hasStorage= room.find(FIND_STRUCTURES,{filter: (s)=> s.structureType==STRUCTURE_STORAGE}).length;
        if ((room.controller.level>3) && hasStorage &&(room.energyCapacityAvailable >900)){
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

        //spawn creeps
        if(Game.time % 10=== 0 ){
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

    }

};



module.exports = roomBrains;


