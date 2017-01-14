/*
This class handles defenses for rooms and remote mining operations

    Each room will store the following in memory
        -defcon: Threat level used to determine response
        -numHostiles: #of hostile creeps present
        -defconLength: # of ticks that the room has been at a certain threat level
        -civiliansActive: Boolean value indicating wheter civilians are currently active in this room
    
    LEVELS:
        0: no hostiles present
        1: 1-2 hostiles present
        2: 3+ hostiles present

    NOTES:
        -blue flags which do not have a fourth argument specifying that they are military creeps will be turned purple until the end of the threat

    TODO:
        -create
        -implement tick counting
        -add multiple threat levels and responses
        -add safemode to the max threat level
        -add code to determine wheter walls have been breached
*/

var roomDefender = {

    initRoom:function(room_name){
        //initiallize defense variables
        Memory[room_name].defense={defcon:0,
                                   numHostiles:0,
                                   defconLength:0,
                                   civiliansActive:true
                                    }
    },

    assessThreats:function(room_name){
        //this function manages transitions between defcon levels
        var room = Game.rooms[room_name];
        var numHostiles = room.find(FIND_HOSTILE_CREEPS).length;
        if(numHostiles>2){
            Memory[room_name].defense.defcon=2;
        }else if (numHostiles>0){
            Memory[room_name].defense.defcon=1;
        }else{
            Memory[room_name].defense.defcon=0;
        }
    },

    run:function(room_name){
        // main function
        if (Memory[room_name].defense ===undefined){
            this.initRoom(room_name);
        }
        this.assessThreats(room_name);
        
        // execute the appropriate response
        if(Memory[room_name].defense.defcon==2){
            this.defcon2(room_name);
        }
        else if (Memory[room_name].defense.defcon==1){
            this.defcon1(room_name);
        }else if(Memory[room_name].defense.defcon==0){
            this.defcon0(room_name);
        }


    },
    deactivateCivilians:function(room_name){
        Memory[room_name].defense.civiliansActive=false;
        // query blue flags in the room
        var blueFlags = Game.rooms[room_name].find(FIND_FLAGS,{filter: (f) => {return (f.color ==COLOR_BLUE); }});
        // iterate over the flags and turn the civilian flags purple
        for (var i in blueFlags){
            var params = blueFlags[i].name.split("_");
            // the fourth param indicates wheter or not a creep is military
            if (params[3] !="military"){
                blueFlags[i].setColor(COLOR_PURPLE);
            }
        }
    },
    activateCivilians:function(room_name){
        Memory[room_name].defense.civiliansActive=true;
        // query purple flags in the room
        var purpleFlags = Game.rooms[room_name].find(FIND_FLAGS,{filter: (f) => {return (f.color ==COLOR_PURPLE); }});
        // iterate over the flags and turn the civilian flags blue
        for (var i in purpleFlags){
            var params = purpleFlags[i].name.split("_");
            // the fourth param indicates wheter or not a creep is military
            if (params[3] !="military"){
                purpleFlags[i].setColor(COLOR_BLUE);
            }
        }
    },

    defcon0:function(room_name){
        // this is a peace time function

        // if civilians are inactive, activate them
        if(Memory[room_name].defense.civiliansActive===false){
            Memory[room_name].defense.civiliansActive=true;
            this.activateCivilians(room_name);// the reason for the if statement is so that we aren't calling this too often
        }
    },

    defcon1:function(room_name){
        //response to a defcon 1 threat
        console.log("Defcon 1 event in room " +room_name);
        Memory[room_name].defense.lastAttack= Game.time;
        var room = Game.rooms[room_name];
        if (room.controller.reservation != undefined){
            // assuming we will have vision if this function is called, right? right.
            this.defcon1Remote(room_name);
        }

        // place a defender flag

    },
    defcon1Remote:function(room_name){
        // deactivate civilians, the guard should hadle the rest
        if(Memory[room_name].defense.civiliansActive!=false){
            Memory[room_name].defense.civiliansActive=false;
            this.deactivateCivilians(room_name);
        }
    },
    defcon2:function(room_name){
        //response to a defcon 2 threat
        console.log("Defcon 2 event in room " +room_name);
        Memory[room_name].defense.lastAttack= Game.time;
        var room = Game.rooms[room_name];
        if (room.controller.reservation != undefined){
            // assuming we will have vision if this function is called, right? right.
            this.defcon1Remote(room_name);
        }

        //place a squad flag
    },
    defcon2Remote:function(room_name){
        // TODO differentiate this function for level 1
        if(Memory[room_name].defense.civiliansActive!=false){
            Memory[room_name].defense.civiliansActive=false;
            this.deactivateCivilians(room_name);
        }
    }


};

module.exports=roomDefender;