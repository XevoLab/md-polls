# MD-POLLS

Live-updatind polling platform based on AWS DynamoDB and socket.io

It filled my need of a more agile solution than google forms for quick polls on a small scale.

It was my first node.js app so the code *might* not be the cleanest, that being said, I'm proud of my little creation and I am even more happy to share it freely on GitHub.

If you want to host your own version of this website, please feel free to do so (credits appreciated [tw:@XevoLab](https://twitter.com/XevoLab)).

## Setup steps

Create a DynamoDB table called *polls* and with primary key *ID* in the eu-central-1 region (Frankfurt)
These are the default values, that can be edited once you download the source code.

Create a .env file in the project root (or set some envirnment variables) with your AWS access keys
  
	AWS_ACCESS_KEY_ID=Your access key
	AWS_SECRET_ACCESS_KEY=Your secret access key
