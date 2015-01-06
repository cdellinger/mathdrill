var startTime = new Date();
var questions = [];
var questionPosition = 0;
var questionStartTime;

var interval_id;
$(document).ready(function(){ 
	setupQuestions();	
});

startQuestions = function(){
	$('#statsRow').show();
	$('#progressRow').show();
	$('#questionRow').show();

	startTime = new Date();
	askQuestion();

	interval_id = window.setInterval(function() {
		var endTime = new Date();
		var time = parseInt((endTime - startTime)/1000);
		var mins = parseInt(time/60);
		var secs = time - (mins*60);
		$('#total_time').html(mins + ':' + ('00' + secs).substr(-2,2));	
	}, 1000);
}

$('#answer').on('keyup', function(e) {
    if (e.keyCode === 13) {
    	nextQuestion();
    }
});

nextQuestion = function(){
	if (isNaN($('#answer').val()) || $('#answer').val() == ''){
		alert('You must enter a number');
	}
	else{
		questions[questionPosition].answer = answer.value;
		questions[questionPosition].time_taken = parseInt(new Date() - questionStartTime)/ 1000;
		questionPosition++;
		$('#answered_questions').html(questionPosition+1);
		var percentComplete = parseInt((questionPosition/questions.length) * 10000)/100;
		$('#progress_bar').html('<div class="progress-bar progress-bar-success" role="progressbar" aria-valuenow="' + percentComplete + '" aria-valuemin="0" aria-valuemax="100" style="width:' + percentComplete + '%;">' + percentComplete + '%</div>');

		if (questionPosition < questions.length){
			askQuestion();
		}
		else{
			window.clearInterval(interval_id);
			var endTime = new Date();
			$('#total_time').html(parseInt((endTime - startTime)/1000));	

			var totalTime = parseInt((new Date() - startTime)/1000);
			//alert('finished in ' + totalTime + ' seconds');
			var numberRight = 0;
			$('#errors').html('');

			for (var x=0;x<questions.length;x++){
				if (questions[x].first_variable * questions[x].second_variable == questions[x].answer){
					numberRight++;
				}
				else{
					$('#errors').html($('#errors').html() + '<br/>' + questions[x].first_variable + ' * ' + questions[x].second_variable + ' = ' + questions[x].answer);
				}
			}

			$('#resultsRow').show();
			$('#statsRow').hide();
			$('#progressRow').hide();
			$('#questionRow').hide();
			$('#questionRow2').hide();

			var totalQuestions = questions.length;
			var score = parseInt((numberRight / questions.length)*10000)/100;
			$('#finishTotalTime').html(totalTime);
			$('#totalMissed').html(totalQuestions - numberRight);
			$('#questionsAnswered').html(totalQuestions);
			$('#score').html(score);

			$.post("/quiz/save", {questions: JSON.stringify(questions), userId: userId.value}, function( data ) {
			  alert(data);
			});
		}

	}
}
askQuestion = function(){
	field1.innerHTML = parseInt(questions[questionPosition].first_variable);
	field2.innerHTML = parseInt(questions[questionPosition].second_variable);
	$('#answer').val('');
	$('#answer').focus();
	questionStartTime = new Date();
}

