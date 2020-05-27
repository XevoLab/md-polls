/**
 * @Author: francesco
 * @Date:   2020-04-16T20:17:53+02:00
 * @Last modified by:   francesco
 * @Last modified time: 2020-05-20T22:42:45+02:00
 */

require('dotenv').config();

const aws = require('aws-sdk');
var ddb = new aws.DynamoDB({apiVersion: '2012-08-10', region: process.env.AWS_REGION});

const getQuestionary = (req, res, next) => {

  var params = {
		TableName: process.env.AWS_TABLE_NAME,
		ConsistentRead: true,
		Limit: 1,
		KeyConditionExpression: "ID = :val",
		ExpressionAttributeValues: {
			':val': {S: req.params.id}
		}
	};

	var ddbResponse = ddb.query(params, function(err, data) {
		if (err) {
      // Error with data
      //
      req.q = {ok: false}
			console.error("DynamoDB error getQuestionary: ", err);
      next();
      return;
		} else {
      // Data grabbed
      //
      req.q = {ok: true, length: data.Items.length}
			if (data.Items.length > 0) {
        req.q.data = aws.DynamoDB.Converter.unmarshall(data.Items[0]);

        // Attach the public-ready data
        req.q.pubD = {
          ID: req.q.data.ID,
          created: req.q.data.created,
          title: req.q.data.title,
          options: req.q.data.options,
          metadata: {minOptions: req.q.data.metadata.minOptions, maxOptions: req.q.data.metadata.maxOptions, collectNames: req.q.data.metadata.collectNames}
        }
      }

      next();
      return
		}
	});
}

module.exports = getQuestionary;
