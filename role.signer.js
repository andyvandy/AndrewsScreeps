/*
    The signers's role is to go into a room and sign the controller with a designated message
    
    The signer has no states: 
        

    The signer's memory consits of the following:
        -work: the room the signer wishes to sign
        -flag: the signer's unique identifier
        -message: the signer's message
    
    HOWTO:
        - place a blue flag in the room that says "signer_#_ROOM_message"
        -the flag will be removed once the signer has completed their task

*/

var role_proto = require('prototype.role');

var roleSigner = {
    
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
                role: "signer",
                work:Game.flags[params.join("_")].pos.roomName,
                flag:params.join("_"),
                message: params[3]};
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

        this.getOffEdge();

        var creep= this.creep;
        if (!this.gotoroom(creep.memory.work)){
            return 0;
        }
        var controller = creep.room.controller;
        if(creep.signController(controller,creep.memory.message) ==ERR_NOT_IN_RANGE){
                creep.moveTo(controller);
        }
        if(controller.sign.text!= undefined){
            Game.flags[creep.memory.flag].remove()
            console.log("controller in room " +creep.memory.work+ " signed.");
            creep.suicide();
        }

    }
};

module.exports=roleSigner;