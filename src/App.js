/** @jsx createElement */
import {createElement, Component} from 'react';
import glamorous from 'glamorous';
import {Card} from 'semantic-ui-react';
import * as firebase from 'firebase';
import orderBy from 'lodash/orderBy';

import Container from 'layout/Card';
import {Col} from 'styles';

const Wrapper = glamorous.div({
  display: 'flex',
  minHeight: '100vh',
  flexDirection: 'column',
  paddingTop: 50,
});

const config = {
  // apiKey: "apiKey",
  // authDomain: "projectId.firebaseapp.com",
  databaseURL: 'https://turnertrivia-ebc62.firebaseio.com/',
};
firebase.initializeApp(config);

// Get a reference to the database service
const database = firebase.database();

class App extends Component {
  state = {
    scores: [],
  };

  componentWillMount() {
    database.ref('users').on('value', snapshot => {
      const userMap = snapshot.val();
      const scores = Object.keys(userMap).reduce((acc, userHash) => {
        const userInfo = userMap[userHash];
        return [
          ...acc,
          ...Object.keys(userInfo.sessions).map(sessionKey => {
            const sessionInfo = userInfo.sessions[sessionKey];
            const ellapsedTimeSeconds =
              (sessionInfo.endTime - sessionInfo.startTime) / 1000;
            const possibleBonusTime = sessionInfo.attempted * 7.5;
            const bonusMultiplier =
              Math.max(possibleBonusTime - ellapsedTimeSeconds, 0) / 100 + 1;
            const score = sessionInfo.correct / sessionInfo.attempted * 100;
            const enhancedScore = score * bonusMultiplier;
            return {
              id: sessionKey,
              email: userInfo.email,
              name: userInfo.name,
              ellapsedTimeSeconds,
              possibleBonusTime,
              bonusMultiplier,
              score,
              enhancedScore,
              ...sessionInfo,
            };
          }),
        ];
      }, []);

      this.setState({scores: orderBy(scores, ['enhancedScore'], ['desc'])});
    });
  }
  render() {
    const {scores} = this.state;
    return (
      <Wrapper>
        <Col>
          <Container>
            <Card.Group itemsPerRow={3}>
              {scores.map((score, idx) =>
                <Card key={score.id}>
                  <Card.Content>
                    <Card.Header>{`${idx + 1} - ${score.name}`}</Card.Header>
                    <Card.Meta>
                      {score.enhancedScore.toFixed(0)}
                    </Card.Meta>
                  </Card.Content>
                </Card>
              )}
            </Card.Group>
          </Container>
        </Col>
      </Wrapper>
    );
  }
}

export default App;
