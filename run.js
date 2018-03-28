const HqClient = require('./lib/client');
const googleTab = require('./solvers/google-tab');

const solver = googleTab;


async function run() {
    try {
        let token = process.env.HQ_TOKEN || '';
        let hq = new HqClient(token);
        hq.on('question', handleQuestion);
    } catch (err) {
        log(err);
    }
}


async function handleQuestion(question) {
  return new Promise((resolve) => {
      solver.answer(question);
      return resolve();
  });
}


if (require.main == module) {
    run();
}