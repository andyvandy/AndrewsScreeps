/*
    The poker goes into a room and tries to make the tower waste energy
    
*/
var role_proto = require('prototype.role');

var rolePoker = {
    
    parts: [[TOUGH,TOUGH,HEAL,MOVE,MOVE,MOVE],
            [TOUGH,TOUGH,TOUGH,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,ATTACK,HEAL,HEAL,HEAL,MOVE]],
            

    // TODO make a helper function for finding the costs
    costs: [420,1200],


    create: function(spawn,params) {
        if (!!spawn.spawning){
            // since it returns null otherwise
            //skip this if the spawn is busy
            return true;
        }
        memory={spawn:spawn.name,
                home:spawn.room.name,
                role: "poker",
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

        //heal if damaged
        if(creep.getActiveBodyparts(HEAL) && (creep.hits<creep.hitsMax) ){
                creep.heal(creep);
        }

        var closestHostile = creep.pos.findClosestByRange(FIND_HOSTILE_CREEPS);
        if ( creep.pos.isEqualTo(Game.flags[creep.memory.flag].pos) && (creep.hits==creep.hitsMax) ){
            var exit =creep.pos.findClosestByRange(FIND_EXIT);
            creep.moveTo(exit);
        }else{
            creep.moveTo(Game.flags[creep.memory.flag]);
        }
    }
};

module.exports=rolePoker;