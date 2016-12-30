/*
    This class is used to display room statuses every x ticks
*/


var status = {

    run:function(){
        var message ="";
        var header = "STATUS REPORT\n";



        message += header;
        for (room in Game.rooms){
            message+= "-----------------\n";
            message+=this.roomStatus(Game.rooms[room]);
        }
        console.log(message);
    },
    roomStatus : function(room){
        var roomMessage="";
        roomMessage += '<font color="cyan">Room: ' +room.name +'</font>\n';
        roomMessage += "Controller Level: " +room.controller.level +"\n";
        roomMessage += '<font color="yellow">Energy: ' +room.energyAvailable +"/"+ room.energyCapacityAvailable +'</font>\n';
        var numCreeps = _.sum(Game.creeps, (c) => c.memory.home  == room.name );
        roomMessage += "Creeps: " +numCreeps +"\n";
        return roomMessage;
    }
};

module.exports= status;