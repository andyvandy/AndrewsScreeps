/*
    The Allocator spreads energy throughout their homeroom, the allocator consists of CARRY and MOVE parts
    The Allocator has two states: 
        -allocating : allocating resources on throughout the room
        -fetching : getting resources from an approriate source
    The Allocator's memory has no flags
   
    TODO:
        -add behaviour for when there are no containers or storages
        -add behavious to stock up a container for upgraders
        -add behaviour to prioritize towers when they are below a certain threshold
*/
var role_proto = require('prototype.role');

var roleAllocator = {
    
    parts: [[CARRY,CARRY,MOVE],
            [CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,MOVE,MOVE,MOVE]],

    // TODO make a helper function for finding the costs
    costs: [150,450],

    create: function(spawn){
        if (!!spawn.spawning){
            // since it returns null otherwise
            //skip this if the spawn is busy
            return;
        }
        memory={spawn:spawn.name,
                home:spawn.room.name,
                role: "allocator",
                job:"fetching"};
        var num= 1;
        var name= memory.role+num;


        // if there are 0 creeps, build a cheap allocator so that we can rebuild
        var numCreeps = _.sum(Game.creeps, (c) =>  c.memory.home ==room_name);
        if (numCreeps==0){
            var body=this.parts[0];
        }
        else{
            var body = this.parts[ this.costs.indexOf(_.max(this.costs.filter((c) => {return (c<spawn.room.energyCapacityAvailable);})))];
        }
        
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
    run : function(){
        var creep = this.creep;
        // crontroll what task the creep is assigned
        if((creep.memory.job =="allocating") && (creep.carry.energy == 0)) {
            creep.memory.job="fetching";
            creep.say('picking up');
        }
        if((creep.memory.job=="fetching") && (creep.carry.energy >=100)) {
            creep.memory.job ="allocating";
            creep.say('allocating');
        }

        //perform the assigned task
        if(creep.memory.job =="allocating"){
            roleAllocator.allocate();
        }
        else if(creep.memory.job =="fetching"){
            roleAllocator.fetch();
        }
    },
    fetch: function(){
        var creep= this.creep;

        //check for storage
        var storage=creep.room.find(FIND_STRUCTURES,{
                                    filter: (structure) =>{return (structure.structureType ==STRUCTURE_STORAGE) ;}});
        if(storage.length){
            if(creep.withdraw(storage[0], RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                creep.moveTo(storage[0]);
            } 
        }
        else{
            //otherwise look for containers
            var container=creep.pos.findClosestByRange(FIND_STRUCTURES,{
                                    filter: (structure) =>{return (structure.structureType ==STRUCTURE_CONTAINER)&&
                                                    (structure.energy >100) ;}});
            if(container){
                if(creep.withdraw(container, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(container);
                } 
            }
        }
    },
    allocate: function(){

        //Querry for all the possible things that could be filled
        var extension = creep.pos.findClosestByRange(FIND_STRUCTURES, {
                filter: (structure) => {
                    return (structure.structureType == STRUCTURE_EXTENSION) && structure.energy < structure.energyCapacity;
                }
            });

        var spawns = creep.room.find(FIND_STRUCTURES, {
                filter: (structure) => {
                    return (structure.structureType == STRUCTURE_SPAWN) && structure.energy < structure.energyCapacity;
                }
            });

        var towers = creep.room.find(FIND_STRUCTURES, {
                filter: (structure) => {
                    return (structure.structureType == STRUCTURE_TOWER) && structure.energy < 0.95*structure.energyCapacity;
                }
            });
        
        //Fill all of the structures that need to be filled, importance is encoded by the order in which it appears in these conditions
        if(extension){
            if(creep.transfer(extension, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                creep.moveTo(extension);
            }
        }
        else if(spawns.length){
            if(creep.transfer(spawns[0], RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                creep.moveTo(spawns[0]);
            }
        }
        else if(towers.length){
            if(creep.transfer(towers[0], RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                creep.moveTo(towers[0]);
            }
        }
    }

};

module.exports = roleAllocator;