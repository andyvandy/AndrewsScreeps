/*
    The Allocator spreads energy throughout their homeroom, the allocator consists of CARRY and MOVE parts
    The Allocator has two states: 
        -allocating : allocating resources on throughout the room
        -fetching : getting resources from an approriate source
        

    The Allocator's memory has the following structure:
        -specialDelivery: a boolean value indicating wheter the creep is doing a custom job which may involve minerals
        -delivery: the flag for a custom job

    NOTES:
        -when the allocators life is below 200 tick they will try to spawn a successor.
        -the allocator should move in the smae tick they pickup
   
    TODO:
        -add behaviour for when there are no containers or storages
        -add behavious to stock up a container for upgraders
        -add behaviour to prioritize towers when they are below a certain threshold
        -add rejuvenation
        -add behaviour to account for defcon situations
*/
var role_proto = require('prototype.role');

var roleAllocator = {
    
    parts: [[CARRY,CARRY,MOVE],
            [CARRY,CARRY,CARRY,CARRY,MOVE,MOVE],
            [CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,MOVE,MOVE,MOVE,MOVE],
            [CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE]],

    // TODO make a helper function for finding the costs
    costs: [150,300,600,900],

    create: function(spawn){
        if (!!spawn.spawning){
            // since it returns null otherwise
            //skip this if the spawn is busy
            return true;
        }
        memory={spawn:spawn.name,
                home:spawn.room.name,
                role: "allocator",
                job:"fetching"};
        var num= 1;
        var name= memory.role+num;


        // if there are 0 creeps, build a cheap allocator so that we can rebuild
        var numCreeps = _.sum(Game.creeps, (c) =>  (c.memory.role == "allocator") && (c.memory.home ==memory.home));
        if (numCreeps==0){
            console.log("uhoh!");
            var body=this.parts[0];
        }
        else{
            var body = this.parts[ this.costs.indexOf(_.max(this.costs.filter((c) => {return (c<=spawn.room.energyCapacityAvailable);})))];
        }
        
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

    run : function(){
        var creep = this.creep;
        
        this.layroads();
        // crontroll what task the creep is assigned
        if((creep.memory.job =="allocating") && (_.sum(creep.carry) == 0)) {
            creep.memory.job="fetching";
            creep.say('picking up');
        }
        if((creep.memory.job=="fetching") && (_.sum(creep.carry) == creep.carryCapacity)) {
            creep.memory.job ="allocating";
            creep.say('allocating');
        }

        //perform the assigned task
        if(creep.memory.job =="allocating"){
            if (creep.memory.specialDelivery==true){
                this.specialDropoff();
            }else{
                this.allocate();
            }
        }
        else if(creep.memory.job =="fetching"){
            if (creep.memory.specialDelivery==true){
                this.specialPickUp();
            }else{
                this.retrieve();
            }
        }

        // make sure there is an allocator for the next generation lol
        if(creep.ticksToLive<200){
            var numAllocators = _.sum(Game.creeps, (c) =>  c.memory.home ==creep.memory.home &&c.memory.role == "allocator");
            if (numAllocators<3){
                roleAllocator.create(Game.spawns[creep.memory.spawn]);
            }
        }
    },
    retrieve: function(){
        var creep= this.creep;

        //check for storage
        var storage=creep.room.find(FIND_STRUCTURES,{
                                    filter: (structure) =>{return (structure.structureType ==STRUCTURE_STORAGE)&&(structure.store[RESOURCE_ENERGY] >100 );}});
        if(storage.length){
            if(creep.withdraw(storage[0], RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                creep.moveTo(storage[0]);
                if(creep.carry.energy== creep.carryCapacity){
                    this.allocate(); // so that the allocator moves in the same tick they pickup!
                }
            } 
        }
        else{
            //otherwise look for containers
            var container=creep.pos.findClosestByRange(FIND_STRUCTURES,{
                                    filter: (structure) =>{return (structure.structureType ==STRUCTURE_CONTAINER)&&
                                                    (structure.store[RESOURCE_ENERGY] >100) ;}});
            if(container){
                if(creep.withdraw(container, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(container);
                } 
            }
        }
    },

    allocate: function(){
        var creep= this.creep;
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
        //only fill the ones with a grey/red flag
        var greyRedFlags= creep.room.find(FIND_FLAGS,{filter: (f) => {return (f.color ==COLOR_GREY && f.secondaryColor ==COLOR_RED); }});
        // there should only be one
        if (greyRedFlags.length){
            var link = _.filter(greyRedFlags[0].pos.lookFor(LOOK_STRUCTURES), (s) => s.structureType==STRUCTURE_LINK && s.energy < 0.9*s.energyCapacity);
            if (!link.length){
                link = false;
            }
        }
        else{
            var link = false;
        }
        //Fill all of the structures that need to be filled, importance is encoded by the order in which it appears in these conditions
        if( (creep.room.energyAvailable >1000) && link){
            // this is to ensure a steady flow of energy to the upgraders since this isn't time consuming to do
            if(creep.transfer(link[0], RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                creep.moveTo(link[0]);
            }
        }
        else if(extension){
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
        else if(link){
            if(creep.transfer(link[0], RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                creep.moveTo(link[0]);
            }
        }else{
            // if there is nothing do a custom job if there are any
            this.customJobs();

        }
    },
    customJobs: function(){
        /*these are allocation jobs which are designated by a white/grey flag
            the params of the flag are as follows 
            SOURCEFLAG_#_DEPOSITFLAG_RESOURCETYPE_THRESHOLD
        */
        var creep = this.creep;
        //query all white grey flags in the room
        var customJobs = creep.room.find(FIND_FLAGS,{filter: (f) => {return (f.color ==COLOR_WHITE && f.secondaryColor == COLOR_GREY); }});
        for (var job in customJobs){
            var params= customJobs[job].name.split("_");
            var source= params[0];
            var deposit= params[2];
            var resource= params[3];
            var threshold= Number(params[4]);
            
            var depositStructure= _.filter(Game.flags[deposit].pos.lookFor(LOOK_STRUCTURES),
                                     (s)=> s.structureType == STRUCTURE_CONTAINER ||
                                      s.structureType == STRUCTURE_STORAGE||
                                      s.structureType == STRUCTURE_TERMINAL);

            var sourceStructure= _.filter(Game.flags[source].pos.lookFor(LOOK_STRUCTURES),
                                     (s)=> s.structureType == STRUCTURE_CONTAINER ||
                                      s.structureType == STRUCTURE_STORAGE||
                                      s.structureType == STRUCTURE_TERMINAL);
            if (!sourceStructure.length || !depositStructure.length ){
                continue;
            }
            if (depositStructure[0].store[resource] >threshold ){
                // only fill upto the threshold
                continue;
            }
            if (sourceStructure[0].store[resource] <creep.carryCapacity|| sourceStructure[0].store[resource] ===undefined ){
                // do not take on a delivery when there is not enough to deliver
                continue;
            }
            console.log(sourceStructure[0].store[resource]);
            creep.memory.specialDelivery=true;
            creep.memory.delivery= customJobs[job].name;
        } 
    },
    specialPickUp:function(){
        // pick up a resource for a custom delivery
        var creep = this.creep;

        var params= creep.memory.delivery.split("_");
        var resource= params[3];
        var sourceStructure= _.filter(Game.flags[params[0]].pos.lookFor(LOOK_STRUCTURES),
                                     (s)=> s.structureType == STRUCTURE_CONTAINER ||
                                      s.structureType == STRUCTURE_STORAGE||
                                      s.structureType == STRUCTURE_TERMINAL);
        if (sourceStructure[0].store[resource] < creep.carryCapacity || sourceStructure[0].store[resource] ===undefined){
            //hopefully to stop the allocator from getting into a situation where they are stuck in a special delivery
            creep.memory.specialDelivery="false";
            return;
        }
        var result= creep.withdraw(sourceStructure[0], params[3]);
        if( result== ERR_NOT_IN_RANGE) {
            creep.moveTo(sourceStructure[0]);
        } 
       
    },
    specialDropoff:function(){
        // drop off a resource for a custom delivery
        var creep = this.creep;
        var params= creep.memory.delivery.split("_");

        //if the creep has energy from before begining the delivery and the resource in question is different, drop off the energy
        if (creep.carry[RESOURCE_ENERGY]>0 && params[3] !="energy" ){
            var storage=creep.room.find(FIND_STRUCTURES,{
                            filter: (structure) =>{return (structure.structureType ==STRUCTURE_STORAGE)&&(structure.store[RESOURCE_ENERGY] >100 );}});
            depositResult=  creep.transfer(storage[0], RESOURCE_ENERGY);
            if (depositResult== ERR_NOT_IN_RANGE){
                creep.moveTo(storage[0]);
            }
            return;
        }

        var depositStructure= _.filter(Game.flags[params[2]].pos.lookFor(LOOK_STRUCTURES),
                                     (s)=> s.structureType == STRUCTURE_CONTAINER ||
                                      s.structureType == STRUCTURE_STORAGE||
                                      s.structureType == STRUCTURE_TERMINAL);
        var result= creep.transfer(depositStructure[0], params[3]);
        if( result== ERR_NOT_IN_RANGE) {
            creep.moveTo(depositStructure[0]);
        }else if( result== OK){
            creep.memory.specialDelivery="false";
        }
    }

};

module.exports = roleAllocator;