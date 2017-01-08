/*
    The Reserver is created to renew the reservation timer in a room
    
    HOWTO:
        -place a blue flag (preferrably two so that the timer increases) in the room you want renewed
        -Reserver's will be created when the reservation timer is below 3500

    The Reserver's memory :
        -work: the room name of the room I want to reserve
        -flag : the creeps unique identifier

    The Reserver's create function only returns true if the spawner is busy or a Reserver is made.
    
*/
var role_proto = require('prototype.role');

var roleReserver = {
    
    parts: [[MOVE,MOVE,CLAIM,CLAIM]],

    // TODO make a helper function for finding the costs
    costs: [1300],

    create:function(spawn,params){
        console.log("test");
        if (!!spawn.spawning){
            // since it returns null otherwise
            //skip this if the spawn is busy
            return true;
        }
        var flag = Game.flags[params.join("_")];
        
        //if I don't have vision of the room don't make the reserver
        if (flag.room === undefined){
            return false;
        }
        else if( (flag.room.controller.reservation != undefined) && flag.room.controller.reservation.ticksToEnd >3500){
             //I don't want to constantly reserve since I can save $$
            return false;
        }

        memory={spawn:spawn.name,
                home:spawn.room.name,
                role: "reserver",
                work:Game.flags[params.join("_")].pos.roomName,
                flag:params.join("_")};
        var num= 1;
        var name= memory.role+num;
        var body = this.parts[ this.costs.indexOf(_.max(this.costs.filter((c) => {return (c<=spawn.room.energyCapacityAvailable);})))];
        while(spawn.canCreateCreep(body,name)=== ERR_NAME_EXISTS){
            num+=1;
            name= memory.role+num;
        }
        memory.num=num;
        if(spawn.canCreateCreep(body,name) == OK){
            console.log("building a "+memory.role +" named " +name + " for room " + memory.home);
            spawn.createCreep(body, name,memory);
            return true;
        }
        return false;
    },
    run:function(){
        var creep= this.creep;

        this.getOffEdge();

        var creep= this.creep;
        if (!this.gotoroom(creep.memory.work)){
            return 0;
        }
        var controller = creep.room.controller;
        if(creep.reserveController(controller) ==ERR_NOT_IN_RANGE){
                creep.moveTo(controller);
        }
    }

};

module.exports=roleReserver;