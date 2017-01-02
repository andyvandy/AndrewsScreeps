/*
    The distance peasant is to be used for lower room controller levels to distance mine, there should be an emphasis on carry capacity.
    
    The distance peasant has two states:
        -harvesting: the peasants is going out to harvest resources
        -spending: the peasant returns home to spend their resources

    The distance peasant's memory is as follows:
        -work: room name of source
        -source: flag of the source
        -flag: the name of the flag which spawned the creep so that duplicates aren't spawned , one flag per creep
*/
var role_proto = require('prototype.role');

var roleDistancePeasant = {
    
    parts: [[WORK,CARRY,CARRY,CARRY,MOVE,MOVE],
            [WORK,WORK,CARRY,CARRY,CARRY,CARRY,MOVE,MOVE,MOVE],
            [WORK,WORK,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE]],
    costs: [350,550,800],

    create: function(spawn,info) {
        if (!!spawn.spawning){
            // since it returns null otherwise
            //skip this if the spawn is busy
            return;
        }
        var source=info[2]; 
        memory={spawn:spawn.name,
                home:spawn.room.name,
                role: "distancepeasant",
                job:"harvesting",
                source:source,
                work:Game.flags[source].pos.roomName,
                flag:info.join("_")};
        var num= 1;
        var name= memory.role+num;
        var body = this.parts[ this.costs.indexOf(_.max(this.costs.filter((c) => {return (c<spawn.room.energyCapacityAvailable);})))];
        
        while(spawn.canCreateCreep(body,name)=== ERR_NAME_EXISTS){
            num+=1;
            name= memory.role+num;
        }
        memory.num=num;
        if(spawn.canCreateCreep(body,name) == OK){
            console.log("building a "+memory.role +" named " +name + " for room " + memory.home);
            spawn.createCreep(body, name,memory);
        }
    },
    /** @param {Creep} creep **/
    run: function() {
        var creep= this.creep;

        this.getOffEdge();
        //control what job the peasant does
        if((creep.memory.job == "harvesting")&&(this.creep.carry.energy == this.creep.carryCapacity) ){
            creep.memory.job = "spending";
            creep.say("Spending time!");
        }
        else if((creep.memory.job == "spending")&&(this.creep.carry.energy == 0)){
            creep.memory.job = "harvesting";
            creep.say("Harvest time!");
        }

        if(creep.memory.job == "harvesting"){
            this.harvest();    
        }
        else if(creep.memory.job== "spending"){
            this.spend(); 
        }
    },
    harvest: function(){
        // if there is a harvester blocking access to the source, the peasant should withdraw from the source
        var creep= this.creep;
        if (!this.gotoroom(creep.memory.work)){
            return 0;
        }

        if( creep.pos.isEqualTo(Game.flags[creep.memory.source])){
            var source = creep.pos.findClosestByRange(FIND_SOURCES);
            result= creep.harvest(source);
            if (result!= OK){
                if (Memory.verbose){console.log("harvesting error:" +result);} 
            }
        }
        else{
            creep.moveTo(Game.flags[creep.memory.source]);
        }
        
    },
    spend:function(){
        // the distance peasant only upgrades because that's easier
        var creep= this.creep;

        if (!this.gotoroom(creep.memory.home)){
            return 0;
        }

       
        if(creep.upgradeController(creep.room.controller) == ERR_NOT_IN_RANGE) {
            creep.moveTo(creep.room.controller);
        }
    },

    gotoroom:function(room_name){
        var creep= this.creep;
        if (creep.room.name==room_name){
            return true;
        }
        var exit_dir=Game.map.findExit(creep.room.name,room_name);
        var exit= creep.pos.findClosestByRange(exit_dir);
        creep.moveTo(exit);
        return false;
    }


};

module.exports= roleDistancePeasant;