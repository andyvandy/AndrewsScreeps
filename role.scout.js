/*
    The scouts's role is to go into a flag and sit there for vision or to be annoying
    
    The scout has two states: 
        -travelling: the scout is headed to the flag
        -idle: the scout is on the flag
        

    The scout's memory consits of the following:
        -work: the room the creep wishes to scout
        -flag: the creep's unique identifier
    
    HOWTO:
        - place a blue flag in the room that says "signer_#_ROOM_message"
        -the flag will be removed once the signer has completed their task

*/

var role_proto = require('prototype.role');

var roleScout = {
    
    parts: [[MOVE]],

    // TODO make a helper function for finding the costs
    costs: [50],


    create: function(spawn,params) {
        if (!!spawn.spawning){
            // since it returns null otherwise
            //skip this if the spawn is busy
            return true;
        }
        var flag = Game.flags[params.join("_")];

        memory={spawn:spawn.name,
                home:spawn.room.name,
                role: "scout",
                job:"travelling",
                work:Game.flags[params.join("_")].pos.roomName,
                flag:params.join("_")};
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
            return true;
        }
        return false;
    },   

    run:function(){
        // the signer signs a room then removes the flag
        var creep= this.creep;
        if (creep.memory.job=="travelling"){
            this.travel();
        }else if(creep.memory.job=="idling"){
            this.idle()
        }
        this.getOffEdge();
    },

    travel:function(){
        var creep= this.creep;
        if (!this.gotoroom(creep.memory.work)){
            return 0;
        }
        if(creep.pos !=Game.flags[creep.memory.flag].pos){
                creep.moveTo(Game.flags[creep.memory.flag]);
        }else{
            creep.memory.job="idling";
        }
    },
    idle:function(){
        var creep= this.creep;
        creep.say("error");
    }
        
};

module.exports=roleScout;