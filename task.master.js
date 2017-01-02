/*
Credit to Garethp https://github.com/Garethp/Screeps/blob/master/roleManager.js

*/


var role_proto = require('prototype.role');

var taskMaster = {



    roleExists: function(role){
        try
        {
            require("role." + role);
            return true;
        }
        catch(e)
        {
            return false;
        }
    },

    getRole: function(role){
        if(!this.roleExists(role))
            return false;
        var roleObject = require("role." + role);
        roleObject = Object.assign( role_proto,roleObject);
        return roleObject;
    },

    run: function(){
        // make each creep do their job 

        for(var name in Game.creeps) {
            var creep = Game.creeps[name];
            //credit to https://github.com/Garethp/Screeps/blob/master/performRoles.js
            if(creep.spawning || creep.memory.role == undefined || (creep.memory.active !== undefined && !creep.memory.active))
                continue;

            var role = creep.memory.role;
            if(this.roleExists(role)){
                role = this.getRole(role);
            }
            var role = Object.create(role);
            //var job = Object.assign(role_proto,rolePeasant);
            //job.prototype=role_proto;
            
            role.setCreep(creep);
            try { role.run(); } catch(e) { 
                console.log(creep.memory.role+" role error: " + e);
            };
            
        }
    },


};

module.exports = taskMaster;