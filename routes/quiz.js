var express = require('express');
var router = express.Router();

var pg = require('pg');

/* GET users listing. */
router.post('/', function(req, res, next) {
	var userId = 1;
	if (req.body.radioUser === 'eli'){
		userId = 2;
	}

	_getQuestions(userId, req.body.numberQuestions, function(err, data){
		console.log(data);
		res.render('quiz', { title: 'Express', userId: userId, questions: data });
	});	
});

/*
_getQuestions = function(userId, totalQuestions, cb){
	// get never answered questions
	// get questions not answered recently
	// get questions answered incorrectly
	// get questions that took a long time

	var sql = 'SELECT * FROM math_questions WHERE id NOT IN (SELECT math_question_id FROM math_quiz_questions a ';
	sql += 'INNER JOIN math_quizzes b ON a.math_quiz_id = b.id WHERE user_id = $1) LIMIT $2';
	var params = [userId, totalQuestions];

	_find(sql, params, '', function(err, data){
		if (err) return cb(err, null);
		if (data.length < totalQuestions){
			sql = 'SELECT COUNT(0) total, a.id, a.first_variable, a.second_variable, a.operator, a.answer ';
			sql += 'FROM math_questions a INNER JOIN math_quiz_questions b ON a.id = b.math_question_id ';
			sql += 'INNER JOIN math_quizzes c ON b.math_quiz_id = c.id WHERE user_id = $1 AND is_correct = false ';
			sql += 'GROUP BY a.id, a.first_variable, a.second_variable, a.operator, a.answer ';
			sql += 'ORDER BY total DESC ';
			sql += 'LIMIT $2';
			params = [userId, totalQuestions - data.length];
			_find(sql, params, '', function(err2, data2){
				if (err2) return cb(err2, null);
				return cb(null, data.concat(data2));
			});
		}
		else{
			return cb(null, data);
		}
	});
};
*/

_getQuestions = function(userId, totalQuestions, cb){
	// get never answered questions
	var sql = 'SELECT * FROM math_questions WHERE id NOT IN (SELECT math_question_id FROM math_quiz_questions a ';
	sql += 'INNER JOIN math_quizzes b ON a.math_quiz_id = b.id WHERE user_id = $1) LIMIT $2';

	_getAndAppendQuestions(sql, [userId, totalQuestions], [], function(err, data){
		if (err) return cb(err, null);
		if (data.length < totalQuestions){
			sql = 'SELECT COUNT(0) total, a.id, a.first_variable, a.second_variable, a.operator, a.answer ';
			sql += 'FROM math_questions a INNER JOIN math_quiz_questions b ON a.id = b.math_question_id ';
			sql += 'INNER JOIN math_quizzes c ON b.math_quiz_id = c.id WHERE user_id = $1 AND is_correct = false ';
			sql += 'GROUP BY a.id, a.first_variable, a.second_variable, a.operator, a.answer ';
			sql += 'ORDER BY total DESC ';
			sql += 'LIMIT $2';
			_getAndAppendQuestions(sql, [userId, parseInt((totalQuestions - data.length)/3)], data, function(err2, data2){
				if (err2) return cb(err2, null);
				if (data2.length < totalQuestions){
					sql = 'SELECT AVG(time_taken) total, a.id, a.first_variable, a.second_variable, a.operator, a.answer ';
					sql += 'FROM math_questions a INNER JOIN math_quiz_questions b ON a.id = b.math_question_id ';
					sql += 'INNER JOIN math_quizzes c ON b.math_quiz_id = c.id WHERE user_id = $1 AND is_correct = true ';
					sql += 'GROUP BY a.id, a.first_variable, a.second_variable, a.operator, a.answer ';
					sql += 'ORDER BY total DESC ';
					sql += 'LIMIT $2';					
					_getAndAppendQuestions(sql, [userId, parseInt((totalQuestions - data.length)/2)], data, function(err3, data3){
						if (err3) return cb(err3, null);
						if (data3.length < totalQuestions){
							sql = 'SELECT MAX(finished_on) last_quizzed, a.id, a.first_variable, a.second_variable, a.operator, a.answer ';
							sql += 'FROM math_questions a INNER JOIN math_quiz_questions b ON a.id = b.math_question_id ';
							sql += 'INNER JOIN math_quizzes c ON b.math_quiz_id = c.id WHERE user_id = $1 AND is_correct = true ';
							sql += 'GROUP BY a.id, a.first_variable, a.second_variable, a.operator, a.answer ';
							sql += 'ORDER BY last_quizzed ';
							sql += 'LIMIT $2';
							_getAndAppendQuestions(sql, [userId, totalQuestions - data.length], data, cb);
						}
						else{
							return cb(null, data3);
						}
					});
				}
				else{
					return cb(null, data2);
				}
			});
		}
		else{
			return cb(null, data);
		}

	// get questions not answered recently
	// get questions answered incorrectly
	// get questions that took a long time

	});
};

_getAndAppendQuestions = function(sql, params, existingQuestions, cb){
	if (params[1] == 0) params[1] = 1;	
	_find(sql, params, '', function(err, data){
		if (err) return cb(err, null);
		return cb(null, existingQuestions.concat(data));
	});
};

router.post('/save', function(req, res, next){
	var questions = JSON.parse(req.body.questions);

	var sql = 'INSERT INTO math_quizzes (user_id, finished_on, number_problems, number_correct) VALUES ($1, NOW(), $2, $3)';



	var sql2 = 'INSERT INTO math_quiz_questions (math_quiz_id, math_question_id, answer, time_taken, is_correct) VALUES ';
	var quizId = 333;
	var params2 = [quizId];
	var numberRight = 0;

	for (var x=0;x<questions.length;x++){
		var row = x * 4;
		sql2 += '($1, $' + (row + 2) + ', $' + (row + 3) + ', $' + (row + 4) + ', $' + (row + 5) + '), ';
		params2.push(questions[x].id);
		params2.push(questions[x].answer);
		params2.push(questions[x].time_taken);

		//multiplication
		if (questions[x].operator === 1){
			if (questions[x].first_variable * questions[x].second_variable == questions[x].answer){
				numberRight++;
				params2.push(true);
			}
			else{
				params2.push(false);
			}
		}
	}

	sql2 = sql2.substring(0, sql2.length - 2);

	var params = [req.body.userId, questions.length, numberRight];
	_insertReturnObject(sql, params, '', function(err, data){
console.log(err);
		if (err) return next(err);
		params2[0] = data.id;
		console.log(params2);
		_insertReturnObject(sql2, params2, '', function(err2, data2){
			console.log(err2);
			if (err2) return next(err2);
		});
	});
});

_find = function(sql, params, procToken, cb) {
	pg.connect(process.env.POSTGRES_CONNECT, function(err, client, done) {
		if (err){
			done();
			return cb(err, null);
		}


		client.query(sql, params, function(err, results) {
			done();
			if (err) return cb(err, null);
			return cb(null, results.rows);
		});
	});
}

_insertReturnObject = function(sql, params, procToken, cb) {
	sql += ' RETURNING *';
	pg.connect(process.env.POSTGRES_CONNECT, function(err, client, done) {
		if (err){
			done();
			return cb(err, null);
		}
		client.query(sql, params, function(err, results) {
			done();
			if (err) return cb(err, null);
			return cb(null, results.rows[0]);
		});
	});
}


module.exports = router;
