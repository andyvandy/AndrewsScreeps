/*
    This class has a bunch of utility functions
    
    TODO: 
        -clean up globalDistance

*/

var utils={
    globalDistance:function(pos1,pos2){
        // takes in two room pos arguments and returns their global distance
        var room1replaced = pos1.roomName.replace(/[ENSW]/g, function(s) { return  ","+s+",";});
        var room1= room1replaced.split(",");
        var room2replaced = pos2.roomName.replace(/[ENSW]/g, function(s) { return  ","+s+",";});
        var room2= room2replaced.split(",");

        var x1,y1,xDirection1,yDirection1,x1RoomNum,y1RoomNum;
        var x2,y2,xDirection2,yDirection2,x2RoomNum,y2RoomNum;
        
        if (room1[1]=="E"){
            xDirection1=1;
        }else{
           xDirection1=-1; 
        }
        if (room1[3]=="N"){
            yDirection1=1;
        }else{
            yDirection1=-1; 
        }

        if (room2[1]=="E"){
            xDirection2=1;
        }else{
           xDirection2=-1; 
        }
        if (room2[3]=="N"){
            yDirection2=1;
        }else{
            yDirection2=-1; 
        }

        x1RoomNum= room1[2];y1RoomNum= room1[4];
        x2RoomNum= room2[2];y2RoomNum= room2[4];

        x1 = 50*x1RoomNum*xDirection1 +pos1.x;
        y1 = 50*y1RoomNum*yDirection1 +pos1.y;
        x2 = 50*x2RoomNum*xDirection2 +pos2.x;
        y2 = 50*y2RoomNum*yDirection2 +pos2.y;

        return Math.sqrt(Math.pow(x1-x2,2) +Math.pow(y1-y2,2));
    }

};

module.exports= utils;