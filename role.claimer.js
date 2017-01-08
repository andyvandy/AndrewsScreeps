/*
    The Claimer will be created with a room in mind to claim
    HOWTO
    place a blue flag in the room you want to claim, it will be removed once the room is claimed

    The Claimer's memory :
        -work: the room name of the room I want to claim
        -flag : the creeps unique identifier

    The claimer's create function only returns true if the spawner is busy or a claimer is made.
    
*/
var role_proto = require('prototype.role');

var roleClaimer = {
    
    parts: [[MOVE,CLAIM]],

    // TODO make a helper function for finding the costs
    costs: [650],


    create: function(spawn,params) {
        if (!!spawn.spawning){
            // since it returns null otherwise
            //skip this if the spawn is busy
            return true;
        }
        var flag = Game.flags[params.join("_")];
        
        //if I own the room, remove the flag
        if (flag.room != undefined){
            if(flag.room.controller.my){
                flag.remove();
                return false;
            }
        }

        memory={spawn:spawn.name,
                home:spawn.room.name,
                role: "claimer",
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
        if(creep.claimController(controller) ==ERR_NOT_IN_RANGE){
                creep.moveTo(controller);
        }

    }
};

module.exports=roleClaimer;