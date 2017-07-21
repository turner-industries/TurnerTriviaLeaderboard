/** @jsx createElement */
import {createElement, Component} from 'react';
import Confetti from 'react-confetti';
import glamorous from 'glamorous';
import * as firebase from 'firebase';
import orderBy from 'lodash/orderBy';
import take from 'lodash/take';
import humanizeDuration from 'humanize-duration';

const Wrapper = glamorous.div({
  display: 'flex',
  minHeight: '100vh',
  flexDirection: 'column',
  backgroundColor: '#FFF',
  paddingTop: 20,
});

const Logo = glamorous.div({
  height: 100,
  textAlign: 'center',
});

const Title = glamorous.h1({
  margin: 20,
  textAlign: 'center',
  color: '#00573D',
});

const Scores = glamorous.div({
  display: 'flex',
  flex: 1,
  flexDirection: 'column',
  flexWrap: 'wrap',
});

const Ranking = glamorous.div({
  flexGrow: '1',
  position: 'relative',
  alignItems: 'flex-start',
  justifyContent: 'center',
  paddingLeft: '85px',
  display: 'flex',
  flexDirection: 'column',
  marginBottom: 10,
  // borderTop: 'solid 1px',
});

const RankingFill = glamorous.div({
  position: 'absolute',
  top: 0,
  // left: 0,
  bottom: 0,
  backgroundColor: 'rgba(0, 87, 61, 0.48)',
  border: 'solid 1px',
  left: -20,
  transform: 'skewX(-20deg)',
});

const RankingPosition = glamorous.div({
  position: 'absolute',
  top: 0,
  left: 0,
  padding: 20,
  fontSize: 30,
  backgroundColor: '#000',
  color: '#FFF',
});

const Text = glamorous.div({
  zIndex: 0,
  textShadow: '#FFF 0px 0px 4px',
});

const Player = glamorous(Text)({
  padding: 10,
  fontSize: 22,
  textAlign: 'center',
});

const Score = glamorous(Text)({
  padding: 10,
  fontSize: 18,
  textAlign: 'center',
});

const config = {
  databaseURL: 'https://turnertrivia-ebc62.firebaseio.com/',
};
firebase.initializeApp(config);

// Get a reference to the database service
const database = firebase.database();

function mapScores(userMap) {
  return Object.keys(userMap).reduce((acc, userHash) => {
    const userInfo = userMap[userHash];
    return [
      ...acc,
      ...Object.keys(userInfo.sessions || {}).map(sessionKey => {
        const sessionInfo = userInfo.sessions[sessionKey];
        return computeSessionInfo(userInfo, sessionInfo, sessionKey);
      }),
    ];
  }, []);
}

function computeSessionInfo(userInfo, sessionInfo, sessionKey) {
  const ellapsedTimeInMs = sessionInfo.endTime - sessionInfo.startTime;
  const possibleBonusTime = sessionInfo.attempted * 7.5;
  const score = sessionInfo.correct / sessionInfo.attempted * 100;
  return {
    id: sessionKey,
    email: userInfo.email,
    name: userInfo.name,
    ellapsedTimeInMs,
    possibleBonusTime,
    score,
    ...sessionInfo,
  };
}

class App extends Component {
  state = {
    scores: [],
    numberOfPieces: 0,
  };

  componentWillMount() {
    database.ref('users').on('value', this._onNewValues);

    database.ref('lastAnswer').on('value', this._confetti);

    setInterval(() => {
      if (this.state.numberOfPieces > 0) {
        this.setState(prev => ({
          numberOfPieces: Math.max(prev.numberOfPieces - 10, 0),
        }));
      }
    }, 250);
  }

  _confetti = snapshot => {
    const lastAnswer = snapshot.val() || {};

    if (lastAnswer.correct) {
      this.setState(prev => ({
        numberOfPieces: prev.numberOfPieces + 200,
      }));
    }
  };

  _onNewValues = snapshot => {
    const userMap = snapshot.val();
    if (!userMap) {
      return;
    }

    const scores = mapScores(userMap);
    this.setState({
      scores: take(
        orderBy(scores, ['score', 'ellapsedTimeInMs'], ['desc', 'asc']),
        8
      ),
    });
  };

  render() {
    const {numberOfPieces, scores} = this.state;
    return (
      <Wrapper>
        <Confetti numberOfPieces={numberOfPieces} />
        <Logo>
          <img
            src="http://www.turner-industries.com/wp-content/uploads/2015/06/logo-print.png"
            height={100}
            alt="Logo"
          />
        </Logo>
        <Title>Trivia Leaderboard</Title>
        <Scores>
          {scores.map((score, idx) =>
            <Ranking key={score.id}>
              <RankingFill
                style={{
                  width: `${score.score}%`,
                  opacity: 1 - idx * 0.1,
                }}
              />
              <RankingPosition>
                {idx + 1}
              </RankingPosition>
              <Player>
                {score.name}
              </Player>
              <Score>
                {humanizeDuration(score.ellapsedTimeInMs, {round: true})}
              </Score>
            </Ranking>
          )}
        </Scores>
      </Wrapper>
    );
  }
}

export default App;
