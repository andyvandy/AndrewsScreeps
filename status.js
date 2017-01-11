/*
    This class is used to display room statuses every x ticks
*/


var status = {

    run:function(){
        var message ="";
        var header = "STATUS REPORT\n";
        //report on bucket level
        message += "BUCKET LEVEL: " +Game.cpu.bucket+"\n"; 


        message += header;
        for (room_name in Game.rooms){
            message+=this.roomStatus(Game.rooms[room_name]);
        }
        console.log(message);
    },
    roomStatus : function(room){
        if (Game.rooms[room_name].controller === undefined ){
            return "";
        }
        if (!Game.rooms[room_name].controller.my){
            return "";
        }

        var roomMessage="-----------------\n";
        roomMessage += '<font color="cyan">Room: ' +room.name +'</font>\n';
        roomMessage += "Controller Level: " +room.controller.level +"\n";
        roomMessage += '<font color="yellow">Energy: ' +room.energyAvailable +"/"+ room.energyCapacityAvailable +'</font>\n';
        var storage= room.find(FIND_STRUCTURES,{filter: (s)=> s.structureType==STRUCTURE_STORAGE});
        if (storage.length){
            roomMessage += '<font color="yellow">Storage energy: ' + storage[0].store[RESOURCE_ENERGY] +"\n";
        }
        var numCreeps = _.sum(Game.creeps, (c) => c.memory.home  == room.name );
        roomMessage += "Creeps: " +numCreeps +"\n";

        return roomMessage;
    }
};

module.exports= status;