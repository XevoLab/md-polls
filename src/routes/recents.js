/**
 * @Author: francesco
 * @Date:   2020-04-16T22:19:10+02:00
 * @Last modified by:   francesco
 * @Last modified time: 2020-04-17T18:58:27+02:00
 */

const express = require('express');
const router = express.Router();

require('dotenv').config();

router.use(require("./mid/collectInfo.js"))

const aws = require('aws-sdk');
var ddb = new aws.DynamoDB({apiVersion: '2012-08-10', region: process.env.AWS_REGION});

router.get('/', (req, res) => {

  if (req.payload.userToken.new)
    return res.json([]);

  var params = {
		TableName: process.env.AWS_TABLE_NAME,
		ConsistentRead: false,
		/*Limit: 5,*/
    FilterExpression: "apiV = :apiV AND metadata.#owner.#token = :val",
		//FilterExpression: "",
    ExpressionAttributeNames: {
      '#owner' : 'owner',
      '#token' : 'token'
    },
		ExpressionAttributeValues: {
			':val': {S: req.payload.userToken.v},
			':apiV': {N: "2"},
		}
	};

	var ddbResponse = ddb.scan(params, function(err, data) {
		if (err) {
			console.error("DynamoDB error results.js : ", err);
		  res.json({result: "error", message:"Somthing didn\'t work out quite right"});
		} else {

			if (data.Items.length === 0) {
				res.json([]);
			}
			else {
        var rec = [];

        data.Items.sort((a,b) => (parseInt(b.created.N) - parseInt(a.created.N)) );
        data.Items = data.Items.slice(0,5);
        for (var c in data.Items) {
          rec.push({
            id: data.Items[c].ID.S,
            title: data.Items[c].title.S,
            created: data.Items[c].created.N,
            votesCount: data.Items[c].options.L.reduce((a, c) => a + parseInt(c.M.votes.N), 0)
          })
        }

				res.json(rec);
			}
		}
	});

})

module.exports = router;
