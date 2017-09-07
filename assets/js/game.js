// Initialize Firebase
var config = {
apiKey: "AIzaSyC74EPt-eIGAuBp4OSsoNC30jOc-IkqkfU",
authDomain: "project1-f6f1e.firebaseapp.com",
databaseURL: "https://project1-f6f1e.firebaseio.com",
projectId: "project1-f6f1e",
storageBucket: "project1-f6f1e.appspot.com",
messagingSenderId: "96427904111"
};
firebase.initializeApp(config);
var dB = firebase.database();

//fun stuff starts below:
/////////////////////////////////////////////////////////////

//reset database when game is refreshed
dB.ref("/texts").remove();
dB.ref("/players").remove();
dB.ref("/play").remove();
dB.ref("/writingmessage").remove();
dB.ref("/exit").remove();

//variables used in game play
var playerSet=false,userName,opponentName,userChoice,opponentChoice,wins=0,losses=0;

//onclick event listener for setting player name
$("#setPlayer").on("click",function(){

	//check to see if name has already been taken by other player
	if ($("#playerName").val()===opponentName){
		//if name has been chosen, then show #warningModal to warn player that name has already been chosen and to pick a new name
		$('#warningModal').modal({backdrop: 'static', keyboard: false});
		$("#warningModal").modal("show"); 
	} else {	
		//if name has not been chosen, then proceed with game - set username, a local variable, to what user has put into playerName textbox
		userName = $("#playerName").val();
		//show game and conversation buttons and don't display name textbox and button; set playerSet to true	
		$("#playerName").css("display","none");
		$("#setPlayer").css("display","none");
		$("#startGame").css("display","block");
		$("#startConvo").css("display","block");
		playerSet = true;

		//push names to Firebase
		dB.ref("/players").push($("#playerName").val());
	}
})

//modal button onclick listener - reset playerName to not show what user had previously entered
//this onclick listener is only accessible when the user has entered the same name as the other player, so the only functional need for this button is to clear modal and reset playerName
$("#chooseName").on("click",function(){
	$("#playerName").val("");
})

//child_added event listener for when a player has set their name 
dB.ref("/players").on("child_added",function(childSnapshot,prevChildKey){

	if(childSnapshot.val()!=userName){//if added name is not the user's name, it is the opponent's name
		$("#player2").html("<strong> Opponent: </strong>"+childSnapshot.val());
		opponentName=childSnapshot.val();//set opponentName to the returned name, this will be used in later gameplay functions
	} else {
		$("#player1").html("<strong> Player: </strong>"+childSnapshot.val());
	}
	//if the user's name has been set, then show the game players' names
	if(playerSet){
		$("#player1").css("display","block");
		$("#player2").css("display","block");
	}

})


//needed variable for boolean checks that are pertinent to conversation functions
var convoEntered = false;

//when start conversation button is pushed, show message elements and set convoEntered to true
$("#startConvo").on("click",function(){

	$("#startConvo").css("display","none");
	$("#endConvo").css("display","block");
	$("#textmsg").css("display","block");
	$("#sendText").css("display","block");		
	$("#textBox").css("display","block");

	convoEntered=true;

})

//when startgame is pushed, show game elements and set startGame to true
var startGame = false;
$("#startGame").on("click",function(){
	startGame = true;
	$("#choices").css("display","block");
	$("#startGame").css("display","none");			
	$("#opponentChoice").css("display","block");
	$("#result").css("display","none");
	$("#stats").css("display","none");
	$("#userChoice").css("display","none");
	$("#opponentChoice").css("display","none");
	$("#userChoice").text("");
	$("#opponentChoice").text("");
	$("#endGame").css("display","block");
})

//when user pushes endGame button do a complete reset back to enter user name and remove all game play components, other than opponent's name 
$("#endGame").on("click",function(){
	startGame = false;
	//push an exit signal to Firebase - signal of end game
	dB.ref("/exit").push(userName);
	//reset userName to undefined
	userName = void 0;
	//remove gameplay/conversation elements from firebase
	dB.ref("/players").remove();
	dB.ref("/players").push(opponentName);
	dB.ref("/play").remove();
	dB.ref("/writingmessage").remove();
	dB.ref("/texts").remove();
	//display and html reset for client side game
	$("#choices").css("display","none");
	$("#startGame").css("display","none");			
	$("#opponentChoice").css("display","none");
	$("#result").css("display","none");
	$("#stats").css("display","none");
	$("#userChoice").css("display","none");
	$("#opponentChoice").css("display","none");
	$("#userChoice").text("");
	$("#opponentChoice").text("");
	$("#endGame").css("display","none");
	$("#playerName").css("display","block");
	$("#setPlayer").css("display","block");
	$("#player1").html("");
	$("#player2").html("");
	$("#startConvo").css("display","none");
})

//firebase child_added event listener for exit - this is used specifically for controlling the opponent's page who did not push endGame button
dB.ref("/exit").on("child_added",function(childSnapshot,prevChildkey){
	if(childSnapshot.val()!=userName){
		startGame = false;
		$("#choices").css("display","none");
		$("#startGame").css("display","block");			
		$("#opponentChoice").css("display","none");
		$("#result").css("display","none");
		$("#stats").css("display","none");
		$("#userChoice").css("display","none");
		$("#opponentChoice").css("display","none");
		$("#userChoice").text("");
		$("#opponentChoice").text("");
		$("#endGame").css("display","none");
		$("#player2").html("Opponent "+ opponentName + " has exited the game. Waiting for new opponent.");
		$("#startConvo").css("display","block");				
	}
})

//when a p tag in the choices div has been clicked, push user's choice to firebase and hide the choices div
$("#choices>p").on("click",function(){
	dB.ref("/play/"+userName).set($(this).text());
	$("#choices").css("display","none");
})

//event listener for childadded for play node
dB.ref("/play").on("child_added",function(childSnapshot,prevChildKey){
	if(childSnapshot.key!=userName){//if this is the opponent's choice being added to the firebase node "play"
		opponentChoice = childSnapshot.val();//set opponentchoice to childSnapshot.val() -- this will be either rock, paper or scissors
		if(typeof userChoice==='undefined'){ //if userChoice, which is the local user's choice, has not been set
			$("#opponentChoice").text("Opponent has made their choice"); //then display on local user's screen that the opponent has made their choice
		} else if (userChoice.length>0){ //if user has made their choice, 
			$("#opponentChoice").text("Opponent chose " + opponentChoice); //then show opponent's choice
			determineVictory();//and run game result determination function
		}
		
	} else {
		userChoice = childSnapshot.val();//else, it is the local user's choice that has triggered the event listener, so set userChoice
		$("#userChoice").text("You chose " + userChoice);//and display userchoice as "You chose "...
		if(typeof opponentChoice === 'undefined'){//if opponent has not made their game choice, then display the following
			$("#opponentChoice").text("Waiting for Opponent to make choice");
		} else if (opponentChoice.length>0){ //if opponent has made game choice, show opponent choice
			$("#opponentChoice").text("Opponent chose " + opponentChoice);
			determineVictory();//and run game result determination function 
		}
	}

	if(startGame){//make sure that the local user has started a game before showing anything about the opponent
		$("#opponentChoice").css("display","block");
	} else {
		$("#opponentChoice").css("display","none");
	}
	
	$("#userChoice").css("display","block"); //show user's choice box
})

//game result determination function - only runs when both users have made their game choice
determineVictory = function(){
	if(userChoice==opponentChoice){ //if local user has chosen the same as their opponent
		$("#result").text("Both of you chose " + userChoice + ". Game results in a tie."); //display tie message
	} else if ((userChoice=="ROCK"&&opponentChoice=="SCISSORS")||(userChoice=="SCISSORS"&&opponentChoice=="PAPER")||(userChoice=="PAPER"&&opponentChoice=="ROCK")){ //methods in which local user has won game
		$("#result").text("You beat your opponent, " + opponentName + ". " + userChoice + " beats " + opponentChoice + "."); //display win message
		wins++; //increment win
	} else if ((opponentChoice=="ROCK"&&userChoice=="SCISSORS")||(opponentChoice=="SCISSORS"&&userChoice=="PAPER")||(opponentChoice=="PAPER"&&userChoice=="ROCK")){ //methods in which local user has lost game
		$("#result").text("Your opponent, " + opponentName + ", beat you. " + opponentChoice + " beats " + userChoice + "."); //display loss message
		losses++; //increment loss
	}
	$("#result").css("display","block"); //show game result message
	$("#stats").css("display","block"); //show game stats
	$("#wins").text("Wins: " + wins); //display current wins
	$("#losses").text("Losses: " + losses); //display current losses
	$("#startGame").css("display","block"); //display button to start new game
	userChoice = void 0; //reset userChoice and opponentChoice
	opponentChoice = void 0;
	dB.ref("/play/"+userName).remove(); //remove move by local user
	dB.ref("/play/"+opponentName).remove(); //remove move by opponent user
	
}

//onclick listener for sendText
$("#sendText").on("click",function(){
	dB.ref("/texts").push("<strong>" + userName + "</strong> >>> " + $("#textmsg").val()); //push message for text to firebase
	writingMsg = false; //no longer writing message as message was sent
})

//event listener for new text message sent to firebase
dB.ref("/texts").on("child_added",function(childSnapshot,prevChildKey){
	var newtxt = childSnapshot.val(); //childSnapshot value will be a new text message
	if(newtxt.substr(8,userName.length)!=userName){//checking to see who sent it - newtxt.substr(8,userName.length) will be equal to user name if local user sent the message
		$("#textBox>.epsilon-animation").remove();//removing the opponent's text epsilon animation and replacing with message bubble
		$("#textBox").append("<p class='opponentText'><em>" + childSnapshot.val() + "</em></p>");
	} else {
		$("#textBox").append("<p class='playerText'>" + childSnapshot.val() + "</p>"); //adding local user message to box
		$("textarea").val(""); //resetting textarea to blank
	}
	
	//if conversation has not been entered, this push of a text to firebase is obviously from the opponent
	//show modal alerting local user of an incoming message
	if (!convoEntered){
		$('#myModal').modal({backdrop: 'static', keyboard: false});
		$("#myModal").modal("show");
		$("#myModal > div").addClass("modal-animation");				
	}

	//show button for ending conversation
	$("#endConvo").css("display","block");
})

//incoming message modal button onclick event listener function - when clicked show message elements
$("#msgRcvd").on("click",function(){
	convoEntered = true;
	$("#textmsg").css("display","block");
	$("#sendText").css("display","block");
	$("#textBox").css("display","block");
	$("#endConvo").css("display","block");
	$("#startConvo").css("display","none");
})

//when text entered in textarea, show opponent that you area writing a message
//textarea onkeyup event listener to 
var writingMsg = false;
$("textarea").on("keyup",function(event){
	if(!writingMsg){ //we only want this to show up with one message on the opponents screen show use boolean to limit
		writingMsg = true;
		dB.ref("/writingmessage").push(userName); //push which user is currently writing a message
	}
})

//when a new message is being written, a new child has been added to the writingmessage node
//event listener for new child added for writingmessage node
dB.ref("/writingmessage").on("child_added",function(childSnapshot,prevChildKey){
	var writer = childSnapshot.val();//all that has been pushed has been the user writing a message
	if(writer != userName){//we only want to add the following if the person writing the message is not the one who will receive the message
		$("#textBox").append("<div class='epsilon-animation'>"+writer+" is writing a message: <span id='one' class='glyphicon glyphicon-dot'></span><span id='two' class='glyphicon glyphicon-dot'></span><span id='three' class='glyphicon glyphicon-dot'></span></div>");
	}
})

//endconversation onclick event listener
$('#endConvo').on("click",function(){
   	dB.ref("/texts").remove();//if conversation is ended, remove the texts node from firebase
});

//if any children in texts have been removed this event listener will trigger
//the only time that this will occur is when the endConvo button has been pushed, so the following css formatting on conversation elements should occur for both people
dB.ref("/texts").on("child_removed",function(childSnapshot,prevChildkey){
	$("#textBox").empty();
	$("#endConvo").css("display","none");
   	$("#startConvo").css("display","block");//show the startConvo button to start new conversation
   	convoEntered = false;//set conversation entered to false to signify that the conversation has ended
	$("#textmsg").css("display","none");
	$("#sendText").css("display","none");
	$("#textBox").css("display","none");
	$("textarea").val("");
	$("#myModal").modal("hide");
	$("#myModal > div").removeClass("modal-animation");
})
