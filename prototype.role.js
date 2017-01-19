/*

        TODO
            -Camel case all the functions ( and the calls to them)... woops
            -add a recle creep function
*/


var role_proto={
    // credit for setCreep to https://github.com/Garethp/Screeps/blob/master/role_prototype.js

    /**
     * The creep for this role
     *
     * @type creep
     */
    creep: null,

    /**
     * Set the creep for this role
     *
     * @param {Creep} creep
     */
    setCreep: function(creep)
    {
        this.creep = creep;
        return this;
    },

    run : function()
    {
        this.action(this.creep); // unclear what happens if an unnessecary variable is passed
    },

    action: function(){} ,

    lastWill: function(){},

    layroads: function(){
        var creep=this.creep;
        // check if the creep is on a road, and if not build one
        // only do so if there are less than 10 construction site present so that it doesn't turn into a shitshow again lol
        var numContructionSites = creep.room.find(FIND_CONSTRUCTION_SITES).length;
        if (numContructionSites<10){
            var road =this.creep.pos.lookFor(LOOK_STRUCTURES,{
                            filter: (structure) => { return structure.structureType == STRUCTURE_ROAD; }} );

            if (!road.length){
                var found_site =creep.pos.lookFor(LOOK_CONSTRUCTION_SITES,{
                                filter: (site) => { return site.structureType == STRUCTURE_ROAD; }} );
                if(!found_site.length){
                    creep.pos.createConstructionSite(STRUCTURE_ROAD);
                }
            }
        }   
    },

    getOffEdge: function(){
        // use this to stop creeps from dancing on the edge of a room
        var creep=this.creep;
        if(creep.pos.x==0){creep.move(RIGHT)}
        if(creep.pos.x==49){creep.move(LEFT)}
        if(creep.pos.y==0){creep.move(BOTTOM)}
        if(creep.pos.y==49){creep.move(TOP)}
    },
    gotoroom:function(room_name,safely =false){
        var creep= this.creep;
        var avoid=[];

        if (creep.room.name==room_name){
            return true;
        }
        if (safely){

            var purpleFlags= creep.room.find(FIND_FLAGS,{filter: (f)=> f.color== COLOR_PURPLE && f.secondaryColor == COLOR_PURPLE});
            for (let i in purpleFlags){
                avoid= avoid.concat([purpleFlags[i]]);
            }
        }
        var exit_dir=Game.map.findExit(creep.room.name,room_name);
        var exit= creep.pos.findClosestByRange(exit_dir);
        PathFinder.use(false);
        creep.moveTo(exit,{avoid:avoid});
        PathFinder.use(true);
        return false;
    },
    deploy: function(){
        // deploy to the current checkpoint
        //this is used for military creeps
        var creep=this.creep;
        var checkpointFlag= Game.flags[creep.memory.squad+"_"+creep.memory.checkpoint];
        if (checkpointFlag === undefined){
            checkpointFlag= Game.flags[creep.memory.squad+"_"+creep.memory.checkpoint+"_FINAL"];
        }
        if ( checkpointFlag.name.split("_")[2]=="FINAL" ){
            creep.memory.job= "missioning";
            this.escort();
        }
        creep.moveTo(checkpointFlag);
        if (creep.pos.inRangeTo(checkpointFlag,5) ){
            creep.say("reached!");
            creep.memory.job="idling";
        }
    },
    
    prices : {
        "move":50,
        "work":100,
        "carry":50,
        "attack":80,
        "ranged_attack":150,
        "heal":250,
        "claim":600,
        "tough":10
    },
    getCosts:function(bodies){
        //this function takes as input an array of arrays containing creep bodies 
        // and returns an array of the costs of each body in order.
        var output=[];
        for (let i in bodies){
            var bodyCost=0;
            for (let j in bodies[i]){
                bodyCost += this.prices[bodies[i][j]];
            }
            output= output.concat([bodyCost]);
        }
        return output;
    },
    setToRecycle:function(){
        //take the creep and set their role to garbage
        // a piece of garbage will go and recycle itself
        this.creep.memory.role="garbage";
    },
    retreat:function(){
        // retreat to previous checkpoint
        // had issues with not being able to find a path before so now I use gotoroom
        var creep=this.creep;
        creep.say("retreat!");
        if(!this.gotoroom(Game.flags[creep.memory.squad+"_"+(creep.memory.checkpoint-1)].pos.roomName)){
            return;
        }
        result= creep.moveTo(Game.flags[creep.memory.squad+"_"+(creep.memory.checkpoint-1)]);
        if(result!= OK){
            console.log("retreat movement not OK: "+ result);
        }
    },
    flee: function(){
        //this job is meant to preserve creeps such as harvesters when hostiles enter the room
        // the creep should go towards it's spawning room since that should be guaranteed to be safe hopefully
        // the creep has to have a home and work property
        var creep= this.creep;
        creep.say("spoopy!");
        this.getOffEdge();
        if(creep.room.name ==creep.memory.work ){
            // the if statement ensures the creep doesn't go all the way home
            this.gotoroom(creep.memory.home);
        }
    }
};



module.exports = role_proto;